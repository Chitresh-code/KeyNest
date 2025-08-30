from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from django.urls import reverse
from django.db import models
from django.forms import TextInput, Textarea
from django.contrib.admin import SimpleListFilter
from django.utils import timezone
from datetime import datetime, timedelta
import json

from .models import (
    User, Organization, OrganizationMembership, Project, 
    Environment, EnvVariable, EnvVariableVersion, AuditLog
)


class CreatedAtFilter(SimpleListFilter):
    """Custom filter for created_at dates"""
    title = 'Created Date'
    parameter_name = 'created_at'

    def lookups(self, request, model_admin):
        return (
            ('today', 'Today'),
            ('week', 'Past 7 days'),
            ('month', 'Past 30 days'),
            ('year', 'Past year'),
        )

    def queryset(self, request, queryset):
        now = timezone.now()
        if self.value() == 'today':
            return queryset.filter(created_at__date=now.date())
        elif self.value() == 'week':
            return queryset.filter(created_at__gte=now - timedelta(days=7))
        elif self.value() == 'month':
            return queryset.filter(created_at__gte=now - timedelta(days=30))
        elif self.value() == 'year':
            return queryset.filter(created_at__gte=now - timedelta(days=365))


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Production-ready User admin with enhanced features"""
    
    list_display = ('email', 'username', 'first_name', 'last_name', 'is_staff', 
                    'is_active', 'created_at_display', 'last_login_display', 'organizations_count')
    list_filter = ('is_staff', 'is_active', 'is_superuser', CreatedAtFilter, 'last_login')
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('created_at', 'updated_at')}),
    )
    readonly_fields = ('created_at', 'updated_at', 'last_login')
    
    def created_at_display(self, obj):
        return obj.created_at.strftime('%Y-%m-%d %H:%M')
    created_at_display.short_description = 'Created'
    created_at_display.admin_order_field = 'created_at'
    
    def last_login_display(self, obj):
        if obj.last_login:
            return obj.last_login.strftime('%Y-%m-%d %H:%M')
        return 'Never'
    last_login_display.short_description = 'Last Login'
    last_login_display.admin_order_field = 'last_login'
    
    def organizations_count(self, obj):
        count = obj.organizationmembership_set.count()
        if count > 0:
            url = reverse('admin:core_organizationmembership_changelist') + f'?user__id__exact={obj.id}'
            return format_html('<a href="{}">{} organizations</a>', url, count)
        return '0'
    organizations_count.short_description = 'Organizations'
    
    actions = ['activate_users', 'deactivate_users']
    
    def activate_users(self, request, queryset):
        count = queryset.update(is_active=True)
        self.message_user(request, f'{count} users activated successfully.')
    activate_users.short_description = 'Activate selected users'
    
    def deactivate_users(self, request, queryset):
        count = queryset.update(is_active=False)
        self.message_user(request, f'{count} users deactivated successfully.')
    deactivate_users.short_description = 'Deactivate selected users'


class OrganizationMembershipInline(admin.TabularInline):
    """Inline for organization memberships"""
    model = OrganizationMembership
    extra = 0
    fields = ('user', 'role', 'joined_at')
    readonly_fields = ('joined_at',)
    autocomplete_fields = ('user',)


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    """Production-ready Organization admin"""
    
    list_display = ('name', 'description_truncated', 'created_by', 'members_count', 
                    'projects_count', 'created_at_display')
    list_filter = ('created_at', CreatedAtFilter)
    search_fields = ('name', 'description', 'created_by__email')
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    
    fields = ('name', 'description', 'created_by', 'created_at', 'updated_at')
    readonly_fields = ('created_at', 'updated_at')
    autocomplete_fields = ('created_by',)
    
    inlines = [OrganizationMembershipInline]
    
    formfield_overrides = {
        models.TextField: {'widget': Textarea(attrs={'rows': 4, 'cols': 40})},
    }
    
    def description_truncated(self, obj):
        if obj.description:
            return obj.description[:50] + ('...' if len(obj.description) > 50 else '')
        return '-'
    description_truncated.short_description = 'Description'
    
    def created_at_display(self, obj):
        return obj.created_at.strftime('%Y-%m-%d %H:%M')
    created_at_display.short_description = 'Created'
    created_at_display.admin_order_field = 'created_at'
    
    def members_count(self, obj):
        count = obj.organizationmembership_set.count()
        if count > 0:
            url = reverse('admin:core_organizationmembership_changelist') + f'?organization__id__exact={obj.id}'
            return format_html('<a href="{}">{} members</a>', url, count)
        return '0'
    members_count.short_description = 'Members'
    
    def projects_count(self, obj):
        count = obj.projects.count()
        if count > 0:
            url = reverse('admin:core_project_changelist') + f'?organization__id__exact={obj.id}'
            return format_html('<a href="{}">{} projects</a>', url, count)
        return '0'
    projects_count.short_description = 'Projects'


@admin.register(OrganizationMembership)
class OrganizationMembershipAdmin(admin.ModelAdmin):
    """Production-ready Organization Membership admin"""
    
    list_display = ('user_email', 'organization_name', 'role', 'joined_at_display')
    list_filter = ('role', 'joined_at', CreatedAtFilter)
    search_fields = ('user__email', 'user__username', 'organization__name')
    date_hierarchy = 'joined_at'
    ordering = ('-joined_at',)
    
    autocomplete_fields = ('user', 'organization')
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User Email'
    user_email.admin_order_field = 'user__email'
    
    def organization_name(self, obj):
        return obj.organization.name
    organization_name.short_description = 'Organization'
    organization_name.admin_order_field = 'organization__name'
    
    def joined_at_display(self, obj):
        return obj.joined_at.strftime('%Y-%m-%d %H:%M')
    joined_at_display.short_description = 'Joined'
    joined_at_display.admin_order_field = 'joined_at'


class EnvironmentInline(admin.TabularInline):
    """Inline for project environments"""
    model = Environment
    extra = 0
    fields = ('name', 'environment_type', 'created_by', 'created_at')
    readonly_fields = ('created_at',)
    show_change_link = True


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    """Production-ready Project admin"""
    
    list_display = ('name', 'organization_name', 'description_truncated', 'created_by', 
                    'environments_count', 'created_at_display')
    list_filter = ('organization', 'created_at', CreatedAtFilter)
    search_fields = ('name', 'description', 'organization__name', 'created_by__email')
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    
    fields = ('name', 'description', 'organization', 'created_by', 'created_at', 'updated_at')
    readonly_fields = ('created_at', 'updated_at')
    autocomplete_fields = ('organization', 'created_by')
    
    inlines = [EnvironmentInline]
    
    formfield_overrides = {
        models.TextField: {'widget': Textarea(attrs={'rows': 4, 'cols': 40})},
    }
    
    def organization_name(self, obj):
        return obj.organization.name
    organization_name.short_description = 'Organization'
    organization_name.admin_order_field = 'organization__name'
    
    def description_truncated(self, obj):
        if obj.description:
            return obj.description[:50] + ('...' if len(obj.description) > 50 else '')
        return '-'
    description_truncated.short_description = 'Description'
    
    def created_at_display(self, obj):
        return obj.created_at.strftime('%Y-%m-%d %H:%M')
    created_at_display.short_description = 'Created'
    created_at_display.admin_order_field = 'created_at'
    
    def environments_count(self, obj):
        count = obj.environments.count()
        if count > 0:
            url = reverse('admin:core_environment_changelist') + f'?project__id__exact={obj.id}'
            return format_html('<a href="{}">{} environments</a>', url, count)
        return '0'
    environments_count.short_description = 'Environments'


class EnvVariableInline(admin.TabularInline):
    """Inline for environment variables"""
    model = EnvVariable
    extra = 0
    fields = ('key', 'masked_value', 'created_by', 'created_at')
    readonly_fields = ('masked_value', 'created_at')
    show_change_link = True
    
    def masked_value(self, obj):
        """Display masked value for security"""
        if obj.encrypted_value:
            return '••••••••'
        return '-'
    masked_value.short_description = 'Value'


@admin.register(Environment)
class EnvironmentAdmin(admin.ModelAdmin):
    """Production-ready Environment admin"""
    
    list_display = ('name', 'project_name', 'organization_name', 'environment_type', 
                    'variables_count', 'created_by', 'created_at_display')
    list_filter = ('environment_type', 'created_at', CreatedAtFilter, 'project__organization')
    search_fields = ('name', 'project__name', 'project__organization__name', 'created_by__email')
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    
    fields = ('name', 'project', 'environment_type', 'description', 'created_by', 
              'created_at', 'updated_at')
    readonly_fields = ('created_at', 'updated_at')
    autocomplete_fields = ('project', 'created_by')
    
    inlines = [EnvVariableInline]
    
    formfield_overrides = {
        models.TextField: {'widget': Textarea(attrs={'rows': 4, 'cols': 40})},
    }
    
    def project_name(self, obj):
        return obj.project.name
    project_name.short_description = 'Project'
    project_name.admin_order_field = 'project__name'
    
    def organization_name(self, obj):
        return obj.project.organization.name
    organization_name.short_description = 'Organization'
    organization_name.admin_order_field = 'project__organization__name'
    
    def created_at_display(self, obj):
        return obj.created_at.strftime('%Y-%m-%d %H:%M')
    created_at_display.short_description = 'Created'
    created_at_display.admin_order_field = 'created_at'
    
    def variables_count(self, obj):
        count = obj.variables.count()
        if count > 0:
            url = reverse('admin:core_envvariable_changelist') + f'?environment__id__exact={obj.id}'
            return format_html('<a href="{}">{} variables</a>', url, count)
        return '0'
    variables_count.short_description = 'Variables'


class EnvVariableVersionInline(admin.TabularInline):
    """Inline for variable versions"""
    model = EnvVariableVersion
    extra = 0
    fields = ('version_number', 'masked_value', 'created_by', 'created_at')
    readonly_fields = ('masked_value', 'created_at')
    ordering = ('-version_number',)
    
    def masked_value(self, obj):
        """Display masked value for security"""
        if obj.encrypted_value:
            return '••••••••'
        return '-'
    masked_value.short_description = 'Value'


@admin.register(EnvVariable)
class EnvVariableAdmin(admin.ModelAdmin):
    """Production-ready Environment Variable admin with security features"""
    
    list_display = ('key', 'environment_name', 'project_name', 'organization_name', 
                    'masked_value', 'versions_count', 'created_by', 'updated_at_display')
    list_filter = ('environment__environment_type', 'created_at', CreatedAtFilter, 
                   'environment__project__organization')
    search_fields = ('key', 'environment__name', 'environment__project__name', 
                     'environment__project__organization__name')
    date_hierarchy = 'created_at'
    ordering = ('-updated_at',)
    
    fields = ('key', 'environment', 'encrypted_value_display', 'created_by', 
              'created_at', 'updated_at')
    readonly_fields = ('encrypted_value_display', 'created_at', 'updated_at')
    autocomplete_fields = ('environment', 'created_by')
    
    inlines = [EnvVariableVersionInline]
    
    def environment_name(self, obj):
        return obj.environment.name
    environment_name.short_description = 'Environment'
    environment_name.admin_order_field = 'environment__name'
    
    def project_name(self, obj):
        return obj.environment.project.name
    project_name.short_description = 'Project'
    project_name.admin_order_field = 'environment__project__name'
    
    def organization_name(self, obj):
        return obj.environment.project.organization.name
    organization_name.short_description = 'Organization'
    organization_name.admin_order_field = 'environment__project__organization__name'
    
    def masked_value(self, obj):
        """Display masked value for security in list view"""
        if obj.encrypted_value:
            return '••••••••'
        return '-'
    masked_value.short_description = 'Value'
    
    def encrypted_value_display(self, obj):
        """Show encrypted value (not decrypted) for security"""
        if obj.encrypted_value:
            return format_html(
                '<div style="font-family: monospace; word-break: break-all; max-width: 400px;">'
                '{}...</div>',
                obj.encrypted_value[:50]
            )
        return '-'
    encrypted_value_display.short_description = 'Encrypted Value (Partial)'
    
    def updated_at_display(self, obj):
        return obj.updated_at.strftime('%Y-%m-%d %H:%M')
    updated_at_display.short_description = 'Updated'
    updated_at_display.admin_order_field = 'updated_at'
    
    def versions_count(self, obj):
        count = obj.versions.count()
        if count > 0:
            url = reverse('admin:core_envvariableversion_changelist') + f'?env_variable__id__exact={obj.id}'
            return format_html('<a href="{}">{} versions</a>', url, count)
        return '0'
    versions_count.short_description = 'Versions'
    
    def get_queryset(self, request):
        """Optimize queries with select_related"""
        return super().get_queryset(request).select_related(
            'environment', 'environment__project', 'environment__project__organization', 'created_by'
        )


@admin.register(EnvVariableVersion)
class EnvVariableVersionAdmin(admin.ModelAdmin):
    """Production-ready Environment Variable Version admin"""
    
    list_display = ('variable_key', 'environment_name', 'version_number', 'masked_value', 
                    'created_by', 'created_at_display')
    list_filter = ('version_number', 'created_at', CreatedAtFilter)
    search_fields = ('env_variable__key', 'env_variable__environment__name', 
                     'env_variable__environment__project__name')
    date_hierarchy = 'created_at'
    ordering = ('-created_at', '-version_number')
    
    fields = ('env_variable', 'version_number', 'encrypted_value_display', 'created_by', 'created_at')
    readonly_fields = ('encrypted_value_display', 'created_at')
    autocomplete_fields = ('env_variable', 'created_by')
    
    def variable_key(self, obj):
        return obj.env_variable.key
    variable_key.short_description = 'Variable Key'
    variable_key.admin_order_field = 'env_variable__key'
    
    def environment_name(self, obj):
        return obj.env_variable.environment.name
    environment_name.short_description = 'Environment'
    environment_name.admin_order_field = 'env_variable__environment__name'
    
    def masked_value(self, obj):
        """Display masked value for security"""
        if obj.encrypted_value:
            return '••••••••'
        return '-'
    masked_value.short_description = 'Value'
    
    def encrypted_value_display(self, obj):
        """Show encrypted value (not decrypted) for security"""
        if obj.encrypted_value:
            return format_html(
                '<div style="font-family: monospace; word-break: break-all; max-width: 400px;">'
                '{}...</div>',
                obj.encrypted_value[:50]
            )
        return '-'
    encrypted_value_display.short_description = 'Encrypted Value (Partial)'
    
    def created_at_display(self, obj):
        return obj.created_at.strftime('%Y-%m-%d %H:%M')
    created_at_display.short_description = 'Created'
    created_at_display.admin_order_field = 'created_at'
    
    def get_queryset(self, request):
        """Optimize queries with select_related"""
        return super().get_queryset(request).select_related(
            'env_variable', 'env_variable__environment', 'env_variable__environment__project', 'created_by'
        )


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    """Production-ready Audit Log admin"""
    
    list_display = ('user_email', 'action', 'target_type', 'target_id', 'ip_address', 
                    'timestamp_display', 'details_preview')
    list_filter = ('action', 'target_type', 'timestamp', CreatedAtFilter)
    search_fields = ('user__email', 'target_type', 'target_id', 'ip_address')
    date_hierarchy = 'timestamp'
    ordering = ('-timestamp',)
    
    fields = ('user', 'action', 'target_type', 'target_id', 'details_formatted', 
              'ip_address', 'timestamp')
    readonly_fields = ('details_formatted', 'timestamp')
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User Email'
    user_email.admin_order_field = 'user__email'
    
    def timestamp_display(self, obj):
        return obj.timestamp.strftime('%Y-%m-%d %H:%M:%S')
    timestamp_display.short_description = 'Timestamp'
    timestamp_display.admin_order_field = 'timestamp'
    
    def details_preview(self, obj):
        """Show a preview of details JSON"""
        if obj.details:
            details_str = json.dumps(obj.details, indent=2)
            if len(details_str) > 50:
                return details_str[:50] + '...'
            return details_str
        return '-'
    details_preview.short_description = 'Details Preview'
    
    def details_formatted(self, obj):
        """Show formatted JSON details"""
        if obj.details:
            formatted = json.dumps(obj.details, indent=2, sort_keys=True)
            return format_html('<pre style="font-size: 12px;">{}</pre>', formatted)
        return '-'
    details_formatted.short_description = 'Details (JSON)'
    
    def has_add_permission(self, request):
        """Audit logs should not be manually created"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Audit logs should not be modified"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Allow deletion for cleanup purposes"""
        return request.user.is_superuser
    
    def get_queryset(self, request):
        """Optimize queries with select_related"""
        return super().get_queryset(request).select_related('user')


# Custom admin site configuration
admin.site.site_header = 'KeyNest Administration'
admin.site.site_title = 'KeyNest Admin'
admin.site.index_title = 'Welcome to KeyNest Administration'

# Register autocomplete fields for better UX
User._meta.get_field('email').help_text = 'Used as the primary login identifier'
Organization._meta.get_field('name').help_text = 'Organization display name'
Project._meta.get_field('name').help_text = 'Project identifier within organization'
Environment._meta.get_field('name').help_text = 'Environment name (e.g., dev, staging, prod)'
EnvVariable._meta.get_field('key').help_text = 'Environment variable key name'
