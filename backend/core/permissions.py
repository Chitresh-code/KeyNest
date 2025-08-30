from rest_framework.permissions import BasePermission
from django.core.exceptions import ObjectDoesNotExist
from .models import Organization, OrganizationMembership, Project, Environment


class HasOrganizationPermission(BasePermission):
    """
    Permission class for organization-level access control
    Production-ready with comprehensive role checking
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated"""
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """Check if user has permission for specific organization"""
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            membership = OrganizationMembership.objects.get(
                user=request.user,
                organization=obj
            )
            
            # Define permission matrix
            if view.action in ['list', 'retrieve']:
                # All members can view
                return True
            elif view.action in ['create']:
                # Handled at the view level
                return True
            elif view.action in ['update', 'partial_update']:
                # Admin and Editor can update
                return membership.role in ['admin', 'editor']
            elif view.action in ['destroy']:
                # Only Admin can delete
                return membership.role == 'admin'
            else:
                # Default to restrictive for unknown actions
                return membership.role == 'admin'
                
        except OrganizationMembership.DoesNotExist:
            return False


class HasProjectPermission(BasePermission):
    """
    Permission class for project-level access control
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated"""
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """Check if user has permission for specific project"""
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            membership = OrganizationMembership.objects.get(
                user=request.user,
                organization=obj.organization
            )
            
            # Define permission matrix
            if view.action in ['list', 'retrieve']:
                # All organization members can view projects
                return True
            elif view.action in ['create']:
                # Handled at the view level (check organization access)
                return True
            elif view.action in ['update', 'partial_update']:
                # Admin and Editor can update
                return membership.role in ['admin', 'editor']
            elif view.action in ['destroy']:
                # Only Admin can delete
                return membership.role == 'admin'
            else:
                # Default to restrictive for unknown actions
                return membership.role in ['admin', 'editor']
                
        except OrganizationMembership.DoesNotExist:
            return False


class HasEnvironmentPermission(BasePermission):
    """
    Permission class for environment-level access control
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated"""
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """Check if user has permission for specific environment or variable"""
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Determine organization based on object type
        if hasattr(obj, 'project'):
            # Environment object
            organization = obj.project.organization
        elif hasattr(obj, 'environment'):
            # EnvVariable object
            organization = obj.environment.project.organization
        else:
            return False
        
        try:
            membership = OrganizationMembership.objects.get(
                user=request.user,
                organization=organization
            )
            
            # Define permission matrix
            if view.action in ['list', 'retrieve']:
                # All organization members can view
                return True
            elif view.action in ['create']:
                # Admin and Editor can create
                return membership.role in ['admin', 'editor']
            elif view.action in ['update', 'partial_update']:
                # Admin and Editor can update
                return membership.role in ['admin', 'editor']
            elif view.action in ['destroy']:
                # Only Admin can delete (or Editor for variables)
                if hasattr(obj, 'environment'):  # EnvVariable
                    return membership.role in ['admin', 'editor']
                else:  # Environment
                    return membership.role == 'admin'
            else:
                # Default to restrictive for unknown actions
                return membership.role in ['admin', 'editor']
                
        except OrganizationMembership.DoesNotExist:
            return False


class IsOrganizationAdmin(BasePermission):
    """
    Permission class that only allows organization admins
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated"""
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """Check if user is admin of the related organization"""
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Determine organization based on object type
        if isinstance(obj, Organization):
            organization = obj
        elif hasattr(obj, 'organization'):
            organization = obj.organization
        elif hasattr(obj, 'project'):
            organization = obj.project.organization
        elif hasattr(obj, 'environment'):
            organization = obj.environment.project.organization
        else:
            return False
        
        try:
            membership = OrganizationMembership.objects.get(
                user=request.user,
                organization=organization
            )
            return membership.role == 'admin'
        except OrganizationMembership.DoesNotExist:
            return False


class CanViewAuditLogs(BasePermission):
    """
    Permission class for viewing audit logs
    Only admins and editors can view audit logs
    """
    
    def has_permission(self, request, view):
        """Check if user has access to any organizations as admin/editor"""
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if user is admin/editor in any organization
        return OrganizationMembership.objects.filter(
            user=request.user,
            role__in=['admin', 'editor']
        ).exists()


class CanExportEnvironment(BasePermission):
    """
    Permission class for exporting environment data
    All organization members can export (viewing secrets requires editor+ role)
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated"""
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """Check if user can export from this environment"""
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            membership = OrganizationMembership.objects.get(
                user=request.user,
                organization=obj.project.organization
            )
            # All members can export (but values may be masked for viewers)
            return True
        except OrganizationMembership.DoesNotExist:
            return False


class CanImportToEnvironment(BasePermission):
    """
    Permission class for importing environment data
    Only admins and editors can import
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated"""
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """Check if user can import to this environment"""
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            membership = OrganizationMembership.objects.get(
                user=request.user,
                organization=obj.project.organization
            )
            # Only admin and editor can import
            return membership.role in ['admin', 'editor']
        except OrganizationMembership.DoesNotExist:
            return False


def get_user_role_in_organization(user, organization):
    """
    Utility function to get user's role in organization
    Returns None if user is not a member
    """
    try:
        membership = OrganizationMembership.objects.get(
            user=user,
            organization=organization
        )
        return membership.role
    except OrganizationMembership.DoesNotExist:
        return None


def can_user_access_organization(user, organization):
    """
    Utility function to check if user has any access to organization
    """
    return OrganizationMembership.objects.filter(
        user=user,
        organization=organization
    ).exists()


def can_user_modify_organization(user, organization):
    """
    Utility function to check if user can modify organization
    """
    try:
        membership = OrganizationMembership.objects.get(
            user=user,
            organization=organization
        )
        return membership.role in ['admin', 'editor']
    except OrganizationMembership.DoesNotExist:
        return False


def can_user_admin_organization(user, organization):
    """
    Utility function to check if user is admin of organization
    """
    try:
        membership = OrganizationMembership.objects.get(
            user=user,
            organization=organization
        )
        return membership.role == 'admin'
    except OrganizationMembership.DoesNotExist:
        return False