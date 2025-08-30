import logging
import json
import yaml
from io import StringIO
from django.db import transaction
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status, generics, permissions
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.parsers import MultiPartParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied, ValidationError
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from .models import (
    Organization, OrganizationMembership, Project, 
    Environment, EnvVariable, AuditLog
)
from .serializers import (
    OrganizationSerializer, ProjectSerializer, EnvironmentSerializer,
    EnvVariableSerializer, AuditLogSerializer, OrganizationMembershipSerializer
)
from .permissions import HasOrganizationPermission, HasProjectPermission, HasEnvironmentPermission
from .utils import parse_env_file, validate_env_data, get_client_ip

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


class ProjectViewSet(BaseKeyNestViewSet):
    """
    Production-ready Project ViewSet with organization-based filtering
    """
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated, HasProjectPermission]
    
    def get_queryset(self):
        """Return projects from user's organizations"""
        user_orgs = Organization.objects.filter(
            organizationmembership__user=self.request.user
        ).values_list('id', flat=True)
        
        return Project.objects.filter(
            organization_id__in=user_orgs
        ).select_related('organization', 'created_by').prefetch_related('environments')
    
    def perform_create(self, serializer):
        """Create project with audit logging"""
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
            
            logger.info(f"Project created: {project.name} by {self.request.user.email}")


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
