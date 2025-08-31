import logging
import json
import yaml
from io import StringIO
from django.db import transaction
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status, generics, permissions
from rest_framework.decorators import api_view, permission_classes, throttle_classes, action
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.parsers import MultiPartParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied, ValidationError
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from .models import (
    Organization, OrganizationMembership, OrganizationInvitation, Project, 
    Environment, EnvVariable, AuditLog
)
from .serializers import (
    OrganizationSerializer, ProjectSerializer, EnvironmentSerializer,
    EnvVariableSerializer, AuditLogSerializer, OrganizationMembershipSerializer
)
from .permissions import HasOrganizationPermission, HasProjectPermission, HasEnvironmentPermission
from .utils import parse_env_file, validate_env_data, get_client_ip
from authentication.tasks import send_organization_invitation, send_project_notification

logger = logging.getLogger(__name__)
User = get_user_model()


class BaseKeyNestViewSet(viewsets.ModelViewSet):
    """
    Base viewset with common functionality for KeyNest models
    """
    permission_classes = [IsAuthenticated]
    throttle_classes = [UserRateThrottle]
    
    def perform_create(self, serializer):
        """Set created_by field automatically"""
        serializer.save(created_by=self.request.user)
    
    def handle_exception(self, exc):
        """Enhanced error handling with logging"""
        logger.error(f"API Error in {self.__class__.__name__}: {str(exc)}")
        return super().handle_exception(exc)


class OrganizationViewSet(BaseKeyNestViewSet):
    """
    Production-ready Organization ViewSet with comprehensive permissions
    """
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated, HasOrganizationPermission]
    
    def get_queryset(self):
        """Return organizations where user is a member"""
        return Organization.objects.filter(
            organizationmembership__user=self.request.user
        ).select_related('created_by').prefetch_related(
            'organizationmembership_set__user',
            'projects'
        )
    
    def perform_create(self, serializer):
        """Create organization and add creator as admin"""
        with transaction.atomic():
            organization = serializer.save(created_by=self.request.user)
            OrganizationMembership.objects.create(
                user=self.request.user,
                organization=organization,
                role='admin'
            )
            
            # Log organization creation
            AuditLog.objects.create(
                user=self.request.user,
                action='create',
                target_type='organization',
                target_id=str(organization.id),
                details={'name': organization.name},
                ip_address=get_client_ip(self.request)
            )
            
            logger.info(f"Organization created: {organization.name} by {self.request.user.email}")
    
    @action(detail=True, methods=['post'])
    def invite_member(self, request, pk=None):
        """
        Invite a user to join the organization
        Production-ready with comprehensive validation and security measures
        """
        try:
            organization = self.get_object()
            
            # Check if user has admin permission
            try:
                membership = OrganizationMembership.objects.get(
                    user=request.user,
                    organization=organization
                )
                if membership.role != 'admin':
                    logger.warning(f"Non-admin user {request.user.email} attempted to invite member to org {organization.id}")
                    raise PermissionDenied("Only admins can invite members")
            except OrganizationMembership.DoesNotExist:
                logger.warning(f"Non-member user {request.user.email} attempted to invite member to org {organization.id}")
                raise PermissionDenied("You are not a member of this organization")
            
            # Validate and sanitize input
            email = request.data.get('email', '').strip().lower()
            role = request.data.get('role', 'viewer').strip().lower()
            
            # Input validation
            if not email:
                return Response({
                    'error': 'Email is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate email format
            from django.core.validators import validate_email
            from django.core.exceptions import ValidationError as DjangoValidationError
            try:
                validate_email(email)
            except DjangoValidationError:
                return Response({
                    'error': 'Invalid email format'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check email length (prevent DoS)
            if len(email) > 254:  # RFC 5321 limit
                return Response({
                    'error': 'Email address too long'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if role not in ['admin', 'editor', 'viewer']:
                return Response({
                    'error': 'Invalid role. Must be admin, editor, or viewer'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check organization member limit (prevent abuse)
            current_member_count = OrganizationMembership.objects.filter(
                organization=organization
            ).count()
            if current_member_count >= 100:  # Configurable limit
                return Response({
                    'error': 'Organization has reached the maximum number of members'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if user is already a member (for existing users)
            existing_user = None
            try:
                existing_user = User.objects.get(email=email)
                if OrganizationMembership.objects.filter(
                    user=existing_user,
                    organization=organization
                ).exists():
                    return Response({
                        'error': 'User is already a member of this organization'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Prevent self-invitation edge case
                if existing_user == request.user:
                    return Response({
                        'error': 'You cannot invite yourself'
                    }, status=status.HTTP_400_BAD_REQUEST)
            except User.DoesNotExist:
                # User doesn't exist yet, which is fine for invitations
                pass
            
            # Check if there's already a pending invitation
            existing_invitation = OrganizationInvitation.objects.filter(
                organization=organization,
                invitee_email=email,
                status='pending'
            ).first()
            
            if existing_invitation and not existing_invitation.is_expired():
                return Response({
                    'error': 'A pending invitation already exists for this email'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Generate unique invitation token
            import secrets
            invitation_token = secrets.token_urlsafe(32)
            
            # Set expiration (7 days from now)
            from django.utils import timezone
            from datetime import timedelta
            expires_at = timezone.now() + timedelta(days=7)
            
            # Create invitation with transaction
            with transaction.atomic():
                # Cancel any existing invitations
                if existing_invitation:
                    existing_invitation.status = 'cancelled'
                    existing_invitation.save()
                
                # Create new invitation
                invitation = OrganizationInvitation.objects.create(
                    organization=organization,
                    inviter=request.user,
                    invitee_email=email,
                    role=role,
                    token=invitation_token,
                    expires_at=expires_at
                )
                
                # Send invitation email
                send_organization_invitation.delay(
                    inviter_id=request.user.id,
                    invitee_email=email,
                    organization_name=organization.name,
                    invitation_token=invitation_token
                )
                
                # Log invitation with detailed audit trail
                AuditLog.objects.create(
                    user=request.user,
                    action='create',
                    target_type='invitation',
                    target_id=str(organization.id),
                    details={
                        'invitee_email': email,
                        'role': role,
                        'organization_id': organization.id,
                        'organization_name': organization.name,
                        'invitation_method': 'email_invite',
                        'expires_at': expires_at.isoformat()
                    },
                    ip_address=get_client_ip(request)
                )
                
                logger.info(f"Invitation sent to {email} for organization {organization.name} as {role} by {request.user.email}")
            
            return Response({
                'message': f'Invitation sent to {email} for {organization.name}',
                'invitation': {
                    'email': email,
                    'role': role,
                    'organization': organization.name,
                    'expires_at': expires_at.isoformat(),
                    'status': 'pending'
                }
            }, status=status.HTTP_201_CREATED)
            
        except PermissionDenied:
            raise
        except Exception as e:
            logger.error(f"Unexpected error in invite_member: {str(e)}")
            return Response({
                'error': 'An error occurred while processing the invitation'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """
        Get organization members
        Production-ready with proper authorization and data filtering
        """
        try:
            organization = self.get_object()
            
            # Check if user has access to this organization
            try:
                user_membership = OrganizationMembership.objects.get(
                    user=request.user,
                    organization=organization
                )
            except OrganizationMembership.DoesNotExist:
                logger.warning(f"Non-member user {request.user.email} attempted to access members of org {organization.id}")
                raise PermissionDenied("You are not a member of this organization")
            
            # Get all memberships with optimized query
            memberships = OrganizationMembership.objects.filter(
                organization=organization
            ).select_related('user').order_by('joined_at')
            
            # Filter sensitive data based on user role
            members_data = []
            for membership in memberships:
                member_data = {
                    'id': membership.user.id,
                    'email': membership.user.email,
                    'username': membership.user.username,
                    'role': membership.role,
                    'joined_at': membership.joined_at.isoformat()
                }
                
                # Add additional fields for admins only
                if user_membership.role == 'admin':
                    member_data.update({
                        'last_login': membership.user.last_login.isoformat() if membership.user.last_login else None,
                        'is_active': membership.user.is_active
                    })
                
                members_data.append(member_data)
            
            # Log member list access for audit
            AuditLog.objects.create(
                user=request.user,
                action='view',
                target_type='membership',
                target_id=str(organization.id),
                details={
                    'organization_name': organization.name,
                    'member_count': len(members_data)
                },
                ip_address=get_client_ip(request)
            )
            
            return Response({
                'members': members_data,
                'total_count': len(members_data)
            })
            
        except PermissionDenied:
            raise
        except Exception as e:
            logger.error(f"Unexpected error in members endpoint: {str(e)}")
            return Response({
                'error': 'An error occurred while retrieving members'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['patch'])
    def update_member_role(self, request, pk=None):
        """
        Update a member's role in the organization
        Production-ready with comprehensive validation and security checks
        """
        try:
            organization = self.get_object()
            
            # Check if user has admin permission
            try:
                admin_membership = OrganizationMembership.objects.get(
                    user=request.user,
                    organization=organization
                )
                if admin_membership.role != 'admin':
                    logger.warning(f"Non-admin user {request.user.email} attempted to update member role in org {organization.id}")
                    raise PermissionDenied("Only admins can update member roles")
            except OrganizationMembership.DoesNotExist:
                logger.warning(f"Non-member user {request.user.email} attempted to update member role in org {organization.id}")
                raise PermissionDenied("You are not a member of this organization")
            
            # Validate and sanitize input
            user_id = request.data.get('user_id')
            new_role = request.data.get('role', '').strip().lower()
            
            # Input validation
            if not user_id:
                return Response({
                    'error': 'user_id is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if not new_role:
                return Response({
                    'error': 'role is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if new_role not in ['admin', 'editor', 'viewer']:
                return Response({
                    'error': 'Invalid role. Must be admin, editor, or viewer'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate user_id is an integer
            try:
                user_id = int(user_id)
            except (ValueError, TypeError):
                return Response({
                    'error': 'Invalid user_id format'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get the member to be updated
            try:
                member_membership = OrganizationMembership.objects.select_related('user').get(
                    user_id=user_id,
                    organization=organization
                )
            except OrganizationMembership.DoesNotExist:
                return Response({
                    'error': 'User is not a member of this organization'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Prevent self-role modification to avoid lockout
            if member_membership.user == request.user:
                return Response({
                    'error': 'You cannot change your own role'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if trying to change the last admin
            if member_membership.role == 'admin' and new_role != 'admin':
                admin_count = OrganizationMembership.objects.filter(
                    organization=organization,
                    role='admin'
                ).count()
                if admin_count <= 1:
                    return Response({
                        'error': 'Cannot change role of the last admin in the organization'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Update role with transaction
            old_role = member_membership.role
            if old_role == new_role:
                return Response({
                    'message': 'Role is already set to the specified value',
                    'member': {
                        'id': member_membership.user.id,
                        'email': member_membership.user.email,
                        'username': member_membership.user.username,
                        'role': new_role
                    }
                })
            
            with transaction.atomic():
                member_membership.role = new_role
                member_membership.save()
                
                # Send notification to the user whose role was changed
                send_project_notification.delay(
                    user_id=member_membership.user.id,
                    project_name=organization.name,
                    notification_type='member_updated',
                    message=f'Your role in "{organization.name}" has been updated from {old_role} to {new_role} by {request.user.username}.'
                )
                
                # Log role update with comprehensive details
                AuditLog.objects.create(
                    user=request.user,
                    action='update',
                    target_type='membership',
                    target_id=str(organization.id),
                    details={
                        'updated_user_id': member_membership.user.id,
                        'updated_user_email': member_membership.user.email,
                        'old_role': old_role,
                        'new_role': new_role,
                        'organization_id': organization.id,
                        'organization_name': organization.name
                    },
                    ip_address=get_client_ip(request)
                )
                
                logger.info(f"Role updated for {member_membership.user.email} in org {organization.name}: {old_role} -> {new_role} by {request.user.email}")
            
            return Response({
                'message': f'Role updated successfully',
                'member': {
                    'id': member_membership.user.id,
                    'email': member_membership.user.email,
                    'username': member_membership.user.username,
                    'role': new_role
                }
            })
            
        except PermissionDenied:
            raise
        except Exception as e:
            logger.error(f"Unexpected error in update_member_role: {str(e)}")
            return Response({
                'error': 'An error occurred while updating the member role'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['delete'])
    def remove_member(self, request, pk=None):
        """
        Remove a member from the organization
        Production-ready with comprehensive validation and security checks
        """
        try:
            organization = self.get_object()
            
            # Check if user has admin permission
            try:
                admin_membership = OrganizationMembership.objects.get(
                    user=request.user,
                    organization=organization
                )
                if admin_membership.role != 'admin':
                    logger.warning(f"Non-admin user {request.user.email} attempted to remove member from org {organization.id}")
                    raise PermissionDenied("Only admins can remove members")
            except OrganizationMembership.DoesNotExist:
                logger.warning(f"Non-member user {request.user.email} attempted to remove member from org {organization.id}")
                raise PermissionDenied("You are not a member of this organization")
            
            # Validate and sanitize input
            user_id = request.data.get('user_id')
            
            if not user_id:
                return Response({
                    'error': 'user_id is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate user_id is an integer
            try:
                user_id = int(user_id)
            except (ValueError, TypeError):
                return Response({
                    'error': 'Invalid user_id format'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get the member to be removed
            try:
                member_membership = OrganizationMembership.objects.select_related('user').get(
                    user_id=user_id,
                    organization=organization
                )
            except OrganizationMembership.DoesNotExist:
                return Response({
                    'error': 'User is not a member of this organization'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Prevent self-removal to avoid lockout
            if member_membership.user == request.user:
                return Response({
                    'error': 'You cannot remove yourself from the organization'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Prevent removing the last admin
            if member_membership.role == 'admin':
                admin_count = OrganizationMembership.objects.filter(
                    organization=organization,
                    role='admin'
                ).count()
                if admin_count <= 1:
                    return Response({
                        'error': 'Cannot remove the last admin from the organization'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Remove membership with transaction
            member_email = member_membership.user.email
            member_username = member_membership.user.username
            member_role = member_membership.role
            
            with transaction.atomic():
                # Send notification to the removed user
                send_project_notification.delay(
                    user_id=user_id,
                    project_name=organization.name,
                    notification_type='member_removed',
                    message=f'You have been removed from "{organization.name}" by {request.user.username}.'
                )
                
                member_membership.delete()
                
                # Log removal with comprehensive details
                AuditLog.objects.create(
                    user=request.user,
                    action='delete',
                    target_type='membership',
                    target_id=str(organization.id),
                    details={
                        'removed_user_id': user_id,
                        'removed_user_email': member_email,
                        'removed_user_role': member_role,
                        'organization_id': organization.id,
                        'organization_name': organization.name
                    },
                    ip_address=get_client_ip(request)
                )
                
                logger.info(f"User {member_email} removed from organization {organization.name} by {request.user.email}")
            
            return Response({
                'message': f'User has been removed from {organization.name}',
                'removed_member': {
                    'email': member_email,
                    'username': member_username,
                    'role': member_role
                }
            })
            
        except PermissionDenied:
            raise
        except Exception as e:
            logger.error(f"Unexpected error in remove_member: {str(e)}")
            return Response({
                'error': 'An error occurred while removing the member'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProjectViewSet(BaseKeyNestViewSet):
    """
    Production-ready Project ViewSet with organization-based filtering
    """
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated, HasProjectPermission]
    
    def get_queryset(self):
        """Return projects from user's organizations, optionally filtered by organization"""
        user_orgs = Organization.objects.filter(
            organizationmembership__user=self.request.user
        ).values_list('id', flat=True)
        
        queryset = Project.objects.filter(
            organization_id__in=user_orgs
        ).select_related('organization', 'created_by').prefetch_related('environments')
        
        # Filter by organization if specified
        org_id = self.request.query_params.get('organization')
        if org_id:
            try:
                org_id = int(org_id)
                if org_id in user_orgs:
                    queryset = queryset.filter(organization_id=org_id)
                else:
                    # User doesn't have access to this organization
                    return Project.objects.none()
            except (ValueError, TypeError):
                pass
        
        return queryset
    
    def perform_create(self, serializer):
        """Create project with audit logging and notifications"""
        with transaction.atomic():
            project = serializer.save(created_by=self.request.user)
            
            # Log project creation
            AuditLog.objects.create(
                user=self.request.user,
                action='create',
                target_type='project',
                target_id=str(project.id),
                details={
                    'name': project.name,
                    'organization': project.organization.name
                },
                ip_address=get_client_ip(self.request)
            )
            
            # Send notifications to organization members
            organization_members = OrganizationMembership.objects.filter(
                organization=project.organization
            ).exclude(user=self.request.user).select_related('user')
            
            for membership in organization_members:
                send_project_notification.delay(
                    user_id=membership.user.id,
                    project_name=project.name,
                    notification_type='created',
                    message=f'New project "{project.name}" has been created by {self.request.user.username} in {project.organization.name}.'
                )
            
            logger.info(f"Project created: {project.name} by {self.request.user.email}")
    
    def perform_update(self, serializer):
        """Update project with notifications"""
        old_name = serializer.instance.name
        with transaction.atomic():
            project = serializer.save()
            
            # Send notifications if project name changed
            if old_name != project.name:
                organization_members = OrganizationMembership.objects.filter(
                    organization=project.organization
                ).exclude(user=self.request.user).select_related('user')
                
                for membership in organization_members:
                    send_project_notification.delay(
                        user_id=membership.user.id,
                        project_name=project.name,
                        notification_type='updated',
                        message=f'Project "{old_name}" has been renamed to "{project.name}" by {self.request.user.username}.'
                    )
            
            logger.info(f"Project updated: {project.name} by {self.request.user.email}")
    
    def perform_destroy(self, instance):
        """Delete project with notifications"""
        project_name = instance.name
        organization = instance.organization
        
        with transaction.atomic():
            # Send notifications before deletion
            organization_members = OrganizationMembership.objects.filter(
                organization=organization
            ).exclude(user=self.request.user).select_related('user')
            
            for membership in organization_members:
                send_project_notification.delay(
                    user_id=membership.user.id,
                    project_name=project_name,
                    notification_type='deleted',
                    message=f'Project "{project_name}" has been deleted by {self.request.user.username}.'
                )
            
            super().perform_destroy(instance)
            logger.info(f"Project deleted: {project_name} by {self.request.user.email}")


class EnvironmentViewSet(BaseKeyNestViewSet):
    """
    Production-ready Environment ViewSet with project-based filtering
    """
    serializer_class = EnvironmentSerializer
    permission_classes = [IsAuthenticated, HasEnvironmentPermission]
    
    def get_queryset(self):
        """Return environments from user's accessible projects"""
        user_orgs = Organization.objects.filter(
            organizationmembership__user=self.request.user
        ).values_list('id', flat=True)
        
        return Environment.objects.filter(
            project__organization_id__in=user_orgs
        ).select_related('project__organization', 'created_by').prefetch_related('variables')
    
    def perform_create(self, serializer):
        """Create environment with audit logging"""
        with transaction.atomic():
            environment = serializer.save(created_by=self.request.user)
            
            # Log environment creation
            AuditLog.objects.create(
                user=self.request.user,
                action='create',
                target_type='environment',
                target_id=str(environment.id),
                details={
                    'name': environment.name,
                    'project': environment.project.name,
                    'type': environment.environment_type
                },
                ip_address=get_client_ip(self.request)
            )
            
            logger.info(f"Environment created: {environment.name} by {self.request.user.email}")


class EnvVariableViewSet(BaseKeyNestViewSet):
    """
    Production-ready Environment Variable ViewSet with encryption
    """
    serializer_class = EnvVariableSerializer
    permission_classes = [IsAuthenticated, HasEnvironmentPermission]
    
    def get_queryset(self):
        """Return variables from user's accessible environments"""
        user_orgs = Organization.objects.filter(
            organizationmembership__user=self.request.user
        ).values_list('id', flat=True)
        
        return EnvVariable.objects.filter(
            environment__project__organization_id__in=user_orgs
        ).select_related('environment__project__organization', 'created_by')
    
    def perform_create(self, serializer):
        """Create variable with encryption and audit logging"""
        with transaction.atomic():
            variable = serializer.save(created_by=self.request.user)
            
            # Log variable creation (don't log the value for security)
            AuditLog.objects.create(
                user=self.request.user,
                action='create',
                target_type='variable',
                target_id=str(variable.id),
                details={
                    'key': variable.key,
                    'environment': variable.environment.name,
                    'project': variable.environment.project.name
                },
                ip_address=get_client_ip(self.request)
            )
            
            logger.info(f"Variable created: {variable.key} by {self.request.user.email}")
    
    def perform_update(self, serializer):
        """Update variable with audit logging"""
        with transaction.atomic():
            old_value_exists = bool(serializer.instance.encrypted_value)
            variable = serializer.save()
            
            # Log variable update
            AuditLog.objects.create(
                user=self.request.user,
                action='update',
                target_type='variable',
                target_id=str(variable.id),
                details={
                    'key': variable.key,
                    'value_updated': 'value' in serializer.validated_data,
                    'had_value': old_value_exists
                },
                ip_address=get_client_ip(self.request)
            )
            
            logger.info(f"Variable updated: {variable.key} by {self.request.user.email}")


class ProjectEnvironmentListView(generics.ListAPIView):
    """
    List environments for a specific project
    """
    serializer_class = EnvironmentSerializer
    permission_classes = [IsAuthenticated]
    throttle_classes = [UserRateThrottle]
    
    def get_queryset(self):
        project_id = self.kwargs['project_id']
        project = get_object_or_404(Project, id=project_id)
        
        # Check user has access to this project's organization
        try:
            OrganizationMembership.objects.get(
                user=self.request.user,
                organization=project.organization
            )
        except OrganizationMembership.DoesNotExist:
            raise PermissionDenied("You don't have access to this project.")
        
        return Environment.objects.filter(project=project)


class EnvironmentVariableListView(generics.ListAPIView):
    """
    List variables for a specific environment
    """
    serializer_class = EnvVariableSerializer
    permission_classes = [IsAuthenticated]
    throttle_classes = [UserRateThrottle]
    
    def get_queryset(self):
        env_id = self.kwargs['env_id']
        environment = get_object_or_404(Environment, id=env_id)
        
        # Check user has access to this environment's organization
        try:
            OrganizationMembership.objects.get(
                user=self.request.user,
                organization=environment.project.organization
            )
        except OrganizationMembership.DoesNotExist:
            raise PermissionDenied("You don't have access to this environment.")
        
        return EnvVariable.objects.filter(environment=environment)


class AuditLogListView(generics.ListAPIView):
    """
    List audit logs with filtering capabilities
    """
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]
    throttle_classes = [UserRateThrottle]
    
    @method_decorator(cache_page(60 * 5))  # Cache for 5 minutes
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
    
    def get_queryset(self):
        """Return audit logs for user's accessible organizations"""
        user_orgs = Organization.objects.filter(
            organizationmembership__user=self.request.user,
            organizationmembership__role__in=['admin', 'editor']
        ).values_list('id', flat=True)
        
        # For now, return all logs for organizations the user is admin/editor of
        # In a more complex system, you might want more granular filtering
        return AuditLog.objects.filter(
            user__organizationmembership__organization_id__in=user_orgs
        ).select_related('user').order_by('-timestamp')[:1000]  # Limit to recent 1000 logs


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@throttle_classes([UserRateThrottle])
def export_env_file(request, env_id):
    """
    Export environment variables as .env file
    Production-ready with comprehensive error handling and format support
    """
    try:
        # Get environment and check permissions
        environment = get_object_or_404(Environment, id=env_id)
        
        # Check user has access to this environment
        try:
            membership = OrganizationMembership.objects.get(
                user=request.user,
                organization=environment.project.organization
            )
            if membership.role not in ['admin', 'editor', 'viewer']:
                raise PermissionDenied("You don't have permission to export this environment.")
        except OrganizationMembership.DoesNotExist:
            raise PermissionDenied("You don't have access to this environment.")
        
        # Get export format from query parameter
        export_format = request.GET.get('format', 'env').lower()
        if export_format not in ['env', 'json', 'yaml']:
            return Response({
                'error': 'Invalid format. Supported formats: env, json, yaml'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get all variables for this environment
        variables = EnvVariable.objects.filter(environment=environment)
        
        # Decrypt variables and prepare data
        env_data = {}
        failed_decryptions = []
        
        for var in variables:
            try:
                decrypted_value = var.decrypt_value()
                env_data[var.key] = decrypted_value
            except Exception as e:
                logger.error(f"Failed to decrypt variable {var.key}: {str(e)}")
                failed_decryptions.append(var.key)
                env_data[var.key] = '[DECRYPTION_ERROR]'
        
        # Generate content based on format
        if export_format == 'env':
            content = generate_env_content(env_data)
            content_type = 'text/plain'
            file_extension = 'env'
        elif export_format == 'json':
            content = json.dumps(env_data, indent=2)
            content_type = 'application/json'
            file_extension = 'json'
        elif export_format == 'yaml':
            content = yaml.dump(env_data, default_flow_style=False)
            content_type = 'application/x-yaml'
            file_extension = 'yaml'
        
        # Create response
        response = HttpResponse(content, content_type=content_type)
        filename = f"{environment.project.name}_{environment.name}.{file_extension}"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        # Log export activity
        AuditLog.objects.create(
            user=request.user,
            action='export',
            target_type='environment',
            target_id=str(environment.id),
            details={
                'format': export_format,
                'variable_count': len(env_data),
                'failed_decryptions': failed_decryptions,
                'environment': environment.name,
                'project': environment.project.name
            },
            ip_address=get_client_ip(request)
        )
        
        logger.info(f"Environment exported: {environment.name} by {request.user.email} (format: {export_format})")
        
        # Add warnings to response headers if there were decryption failures
        if failed_decryptions:
            response['X-Decryption-Warnings'] = f"Failed to decrypt: {', '.join(failed_decryptions)}"
        
        return response
        
    except PermissionDenied:
        raise
    except Exception as e:
        logger.error(f"Export failed for environment {env_id}: {str(e)}")
        return Response({
            'error': 'Export failed due to server error',
            'details': str(e) if request.user.is_staff else 'Please contact support'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@throttle_classes([UserRateThrottle])
def import_env_file(request, env_id):
    """
    Import environment variables from .env, JSON, or YAML file
    Production-ready with validation and conflict resolution
    """
    try:
        # Get environment and check permissions
        environment = get_object_or_404(Environment, id=env_id)
        
        # Check user has write access to this environment
        try:
            membership = OrganizationMembership.objects.get(
                user=request.user,
                organization=environment.project.organization
            )
            if membership.role not in ['admin', 'editor']:
                raise PermissionDenied("You don't have permission to import to this environment.")
        except OrganizationMembership.DoesNotExist:
            raise PermissionDenied("You don't have access to this environment.")
        
        # Parse request data
        import_data = None
        import_format = 'auto'
        
        # Handle file upload
        if 'file' in request.FILES:
            uploaded_file = request.FILES['file']
            if uploaded_file.size > 10 * 1024 * 1024:  # 10MB limit
                return Response({
                    'error': 'File too large. Maximum size is 10MB.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            file_content = uploaded_file.read().decode('utf-8')
            file_name = uploaded_file.name.lower()
            
            # Determine format from filename
            if file_name.endswith('.json'):
                import_format = 'json'
            elif file_name.endswith(('.yaml', '.yml')):
                import_format = 'yaml'
            else:
                import_format = 'env'
                
        # Handle raw data in request body
        elif request.data.get('data'):
            file_content = request.data['data']
            import_format = request.data.get('format', 'env').lower()
        else:
            return Response({
                'error': 'No file or data provided. Use "file" for upload or "data" for raw content.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate import format
        if import_format not in ['env', 'json', 'yaml', 'auto']:
            return Response({
                'error': 'Invalid format. Supported formats: env, json, yaml'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Parse content based on format
        try:
            if import_format == 'json' or (import_format == 'auto' and file_content.strip().startswith('{')):
                import_data = json.loads(file_content)
            elif import_format == 'yaml' or (import_format == 'auto' and '---' in file_content):
                import_data = yaml.safe_load(file_content)
            else:
                # Parse as .env format
                import_data = parse_env_file(file_content)
        except (json.JSONDecodeError, yaml.YAMLError, ValueError) as e:
            return Response({
                'error': f'Failed to parse file content: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate parsed data
        validation_errors = validate_env_data(import_data)
        if validation_errors:
            return Response({
                'error': 'Invalid environment data',
                'details': validation_errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Handle conflict resolution
        overwrite = request.data.get('overwrite', False)
        existing_vars = {var.key: var for var in EnvVariable.objects.filter(environment=environment)}
        
        conflicts = []
        for key in import_data.keys():
            if key in existing_vars:
                conflicts.append(key)
        
        if conflicts and not overwrite:
            return Response({
                'error': 'Conflicting variables found',
                'conflicts': conflicts,
                'message': 'Set overwrite=true to replace existing variables'
            }, status=status.HTTP_409_CONFLICT)
        
        # Process import
        with transaction.atomic():
            imported_count = 0
            updated_count = 0
            failed_imports = []
            
            for key, value in import_data.items():
                try:
                    if key in existing_vars:
                        # Update existing variable
                        var = existing_vars[key]
                        var.encrypt_value(str(value))
                        var.save()
                        updated_count += 1
                    else:
                        # Create new variable
                        var = EnvVariable.objects.create(
                            key=key,
                            environment=environment,
                            created_by=request.user
                        )
                        var.encrypt_value(str(value))
                        var.save()
                        imported_count += 1
                        
                except Exception as e:
                    logger.error(f"Failed to import variable {key}: {str(e)}")
                    failed_imports.append({
                        'key': key,
                        'error': str(e)
                    })
            
            # Log import activity
            AuditLog.objects.create(
                user=request.user,
                action='import',
                target_type='environment',
                target_id=str(environment.id),
                details={
                    'format': import_format,
                    'imported_count': imported_count,
                    'updated_count': updated_count,
                    'failed_imports': len(failed_imports),
                    'overwrite_enabled': overwrite,
                    'environment': environment.name,
                    'project': environment.project.name
                },
                ip_address=get_client_ip(request)
            )
            
            logger.info(f"Environment import completed: {environment.name} by {request.user.email}")
            
            return Response({
                'message': 'Import completed successfully',
                'summary': {
                    'imported': imported_count,
                    'updated': updated_count,
                    'failed': len(failed_imports),
                    'total_variables': imported_count + updated_count
                },
                'failed_imports': failed_imports if failed_imports else None
            }, status=status.HTTP_200_OK)
            
    except PermissionDenied:
        raise
    except Exception as e:
        logger.error(f"Import failed for environment {env_id}: {str(e)}")
        return Response({
            'error': 'Import failed due to server error',
            'details': str(e) if request.user.is_staff else 'Please contact support'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def generate_env_content(env_data):
    """
    Generate .env file content from dictionary
    """
    lines = []
    for key, value in sorted(env_data.items()):
        # Escape special characters and quote values with spaces
        if ' ' in str(value) or '"' in str(value) or '\n' in str(value):
            escaped_value = str(value).replace('\\', '\\\\').replace('"', '\\"')
            lines.append(f'{key}="{escaped_value}"')
        else:
            lines.append(f'{key}={value}')
    
    return '\n'.join(lines) + '\n'
