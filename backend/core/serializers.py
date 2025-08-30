from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Organization, OrganizationMembership, Project, Environment, EnvVariable, AuditLog
import re

User = get_user_model()


class OrganizationSerializer(serializers.ModelSerializer):
    """
    Production-ready organization serializer
    """
    member_count = serializers.SerializerMethodField()
    project_count = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = ('id', 'name', 'description', 'created_at', 'updated_at', 
                 'member_count', 'project_count', 'user_role')
        read_only_fields = ('id', 'created_at', 'updated_at', 'member_count', 
                           'project_count', 'user_role')

    def get_member_count(self, obj):
        return obj.organizationmembership_set.count()

    def get_project_count(self, obj):
        return obj.projects.count()

    def get_user_role(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                membership = OrganizationMembership.objects.get(
                    user=request.user, 
                    organization=obj
                )
                return membership.role
            except OrganizationMembership.DoesNotExist:
                return None
        return None

    def validate_name(self, value):
        """Validate organization name"""
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Organization name must be at least 2 characters long.")
        
        # Check for duplicate names for the same user
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            existing = Organization.objects.filter(
                name__iexact=value.strip(),
                organizationmembership__user=request.user
            ).exclude(id=self.instance.id if self.instance else None)
            
            if existing.exists():
                raise serializers.ValidationError("You already have an organization with this name.")
        
        return value.strip()


class ProjectSerializer(serializers.ModelSerializer):
    """
    Production-ready project serializer
    """
    environment_count = serializers.SerializerMethodField()
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = Project
        fields = ('id', 'name', 'description', 'organization', 'organization_name',
                 'created_at', 'updated_at', 'created_by_name', 'environment_count')
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by_name', 
                           'organization_name', 'environment_count')

    def get_environment_count(self, obj):
        return obj.environments.count()

    def validate_name(self, value):
        """Validate project name"""
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Project name must be at least 2 characters long.")
        
        if not re.match(r'^[a-zA-Z0-9\s\-_\.]+$', value):
            raise serializers.ValidationError(
                "Project name can only contain letters, numbers, spaces, hyphens, underscores, and dots."
            )
        
        return value.strip()

    def validate_organization(self, value):
        """Validate user has access to the organization"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                membership = OrganizationMembership.objects.get(
                    user=request.user,
                    organization=value
                )
                if membership.role not in ['admin', 'editor']:
                    raise serializers.ValidationError(
                        "You don't have permission to create projects in this organization."
                    )
            except OrganizationMembership.DoesNotExist:
                raise serializers.ValidationError("You don't have access to this organization.")
        
        return value


class EnvironmentSerializer(serializers.ModelSerializer):
    """
    Production-ready environment serializer
    """
    variable_count = serializers.SerializerMethodField()
    project_name = serializers.CharField(source='project.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = Environment
        fields = ('id', 'name', 'project', 'project_name', 'environment_type', 
                 'description', 'created_at', 'updated_at', 'created_by_name', 'variable_count')
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by_name', 
                           'project_name', 'variable_count')

    def get_variable_count(self, obj):
        return obj.variables.count()

    def validate_name(self, value):
        """Validate environment name"""
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Environment name must be at least 2 characters long.")
        
        if not re.match(r'^[a-zA-Z0-9\-_]+$', value):
            raise serializers.ValidationError(
                "Environment name can only contain letters, numbers, hyphens, and underscores."
            )
        
        return value.strip().lower()

    def validate(self, attrs):
        """Cross-field validation"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            project = attrs.get('project')
            name = attrs.get('name')
            
            if project and name:
                # Check if user has access to the project
                try:
                    membership = OrganizationMembership.objects.get(
                        user=request.user,
                        organization=project.organization
                    )
                    if membership.role not in ['admin', 'editor']:
                        raise serializers.ValidationError(
                            "You don't have permission to create environments in this project."
                        )
                except OrganizationMembership.DoesNotExist:
                    raise serializers.ValidationError("You don't have access to this project.")
                
                # Check for duplicate environment names in the same project
                existing = Environment.objects.filter(
                    project=project,
                    name=name
                ).exclude(id=self.instance.id if self.instance else None)
                
                if existing.exists():
                    raise serializers.ValidationError(
                        "An environment with this name already exists in this project."
                    )
        
        return attrs


class EnvVariableSerializer(serializers.ModelSerializer):
    """
    Production-ready environment variable serializer
    """
    value = serializers.CharField(write_only=True, required=False, allow_blank=True)
    decrypted_value = serializers.SerializerMethodField()
    environment_name = serializers.CharField(source='environment.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = EnvVariable
        fields = ('id', 'key', 'value', 'decrypted_value', 'environment', 
                 'environment_name', 'created_at', 'updated_at', 'created_by_name')
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by_name', 
                           'environment_name', 'decrypted_value')

    def get_decrypted_value(self, obj):
        """
        Get decrypted value only if user has appropriate permissions
        """
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                membership = OrganizationMembership.objects.get(
                    user=request.user,
                    organization=obj.environment.project.organization
                )
                # Only show values to admin and editor roles
                if membership.role in ['admin', 'editor']:
                    try:
                        return obj.decrypt_value()
                    except ValueError:
                        return "[DECRYPTION_ERROR]"
                else:
                    return "[HIDDEN]"
            except OrganizationMembership.DoesNotExist:
                return "[NO_ACCESS]"
        return "[NO_ACCESS]"

    def validate_key(self, value):
        """Validate environment variable key"""
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("Variable key cannot be empty.")
        
        # Standard environment variable naming convention
        if not re.match(r'^[A-Z][A-Z0-9_]*$', value):
            raise serializers.ValidationError(
                "Variable key must start with a letter and contain only uppercase letters, numbers, and underscores."
            )
        
        return value.strip()

    def validate(self, attrs):
        """Cross-field validation"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            environment = attrs.get('environment')
            key = attrs.get('key')
            
            if environment and key:
                # Check if user has access to the environment
                try:
                    membership = OrganizationMembership.objects.get(
                        user=request.user,
                        organization=environment.project.organization
                    )
                    if membership.role not in ['admin', 'editor']:
                        raise serializers.ValidationError(
                            "You don't have permission to create variables in this environment."
                        )
                except OrganizationMembership.DoesNotExist:
                    raise serializers.ValidationError("You don't have access to this environment.")
                
                # Check for duplicate variable keys in the same environment
                existing = EnvVariable.objects.filter(
                    environment=environment,
                    key=key
                ).exclude(id=self.instance.id if self.instance else None)
                
                if existing.exists():
                    raise serializers.ValidationError(
                        "A variable with this key already exists in this environment."
                    )
        
        return attrs

    def create(self, validated_data):
        """Create new environment variable with encryption"""
        value = validated_data.pop('value', '')
        env_var = EnvVariable(**validated_data)
        
        # Encrypt the value
        if value:
            env_var.encrypt_value(value)
        
        env_var.save()
        return env_var

    def update(self, instance, validated_data):
        """Update environment variable with encryption"""
        value = validated_data.pop('value', None)
        
        # Update other fields
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        
        # Encrypt new value if provided
        if value is not None:
            instance.encrypt_value(value)
        
        instance.save()
        return instance


class AuditLogSerializer(serializers.ModelSerializer):
    """
    Production-ready audit log serializer
    """
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = AuditLog
        fields = ('id', 'user_name', 'user_email', 'action', 'target_type', 
                 'target_id', 'details', 'ip_address', 'timestamp')
        read_only_fields = ('id', 'user_name', 'user_email', 'action', 'target_type', 
                           'target_id', 'details', 'ip_address', 'timestamp')


class OrganizationMembershipSerializer(serializers.ModelSerializer):
    """
    Production-ready organization membership serializer
    """
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True)

    class Meta:
        model = OrganizationMembership
        fields = ('id', 'user', 'user_name', 'user_email', 'organization', 
                 'organization_name', 'role', 'joined_at')
        read_only_fields = ('id', 'user_name', 'user_email', 'organization_name', 'joined_at')

    def validate_role(self, value):
        """Validate role assignment"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            organization = self.initial_data.get('organization') or (
                self.instance.organization if self.instance else None
            )
            
            if organization:
                try:
                    current_membership = OrganizationMembership.objects.get(
                        user=request.user,
                        organization=organization
                    )
                    # Only admins can assign admin roles
                    if value == 'admin' and current_membership.role != 'admin':
                        raise serializers.ValidationError(
                            "Only organization admins can assign admin roles."
                        )
                except OrganizationMembership.DoesNotExist:
                    raise serializers.ValidationError("You don't have access to this organization.")
        
        return value