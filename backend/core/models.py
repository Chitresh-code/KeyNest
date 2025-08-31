from django.db import models
from django.contrib.auth.models import AbstractUser
from cryptography.fernet import Fernet
from django.conf import settings
import base64
import os


class User(AbstractUser):
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # OAuth fields
    google_id = models.CharField(max_length=100, blank=True, null=True, unique=True)
    github_id = models.CharField(max_length=100, blank=True, null=True, unique=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']


class Organization(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_orgs')
    
    def __str__(self):
        return self.name


class OrganizationMembership(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('editor', 'Editor'),
        ('viewer', 'Viewer'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='viewer')
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'organization')


class OrganizationInvitation(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('editor', 'Editor'),
        ('viewer', 'Viewer'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    ]
    
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='invitations')
    inviter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_invitations')
    invitee_email = models.EmailField()
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='viewer')
    token = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    accepted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ('organization', 'invitee_email')
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['status']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"Invitation to {self.invitee_email} for {self.organization.name}"
    
    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at
    
    def can_be_accepted(self):
        return self.status == 'pending' and not self.is_expired()


class Project(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='projects')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_projects')
    
    def __str__(self):
        return f"{self.organization.name} - {self.name}"


class Environment(models.Model):
    ENVIRONMENT_TYPES = [
        ('development', 'Development'),
        ('staging', 'Staging'),
        ('production', 'Production'),
        ('testing', 'Testing'),
    ]
    
    name = models.CharField(max_length=100)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='environments')
    environment_type = models.CharField(max_length=20, choices=ENVIRONMENT_TYPES, default='development')
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ('project', 'name')
    
    def __str__(self):
        return f"{self.project.name} - {self.name}"


class EnvVariable(models.Model):
    key = models.CharField(max_length=255)
    encrypted_value = models.TextField()
    environment = models.ForeignKey(Environment, on_delete=models.CASCADE, related_name='variables')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ('environment', 'key')
    
    def __str__(self):
        return f"{self.environment.name} - {self.key}"
    
    def encrypt_value(self, plain_value):
        """
        Encrypt the value using Fernet (AES-256)
        Production-ready with proper error handling
        """
        try:
            if not plain_value:
                raise ValueError("Cannot encrypt empty value")
            
            if not hasattr(settings, 'ENCRYPTION_KEY') or not settings.ENCRYPTION_KEY:
                raise ValueError("ENCRYPTION_KEY not configured in settings")
            
            # Ensure we have the encryption key as bytes
            if isinstance(settings.ENCRYPTION_KEY, str):
                key = settings.ENCRYPTION_KEY.encode()
            else:
                key = settings.ENCRYPTION_KEY
                
            fernet = Fernet(key)
            encrypted_value = fernet.encrypt(plain_value.encode('utf-8'))
            self.encrypted_value = base64.b64encode(encrypted_value).decode('utf-8')
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Encryption failed for variable {self.key}: {str(e)}")
            raise ValueError(f"Encryption failed: {str(e)}")
    
    def decrypt_value(self):
        """
        Decrypt the value using Fernet
        Production-ready with proper error handling
        """
        try:
            if not self.encrypted_value:
                return ""
            
            if not hasattr(settings, 'ENCRYPTION_KEY') or not settings.ENCRYPTION_KEY:
                raise ValueError("ENCRYPTION_KEY not configured in settings")
            
            # Ensure we have the encryption key as bytes
            if isinstance(settings.ENCRYPTION_KEY, str):
                key = settings.ENCRYPTION_KEY.encode()
            else:
                key = settings.ENCRYPTION_KEY
                
            fernet = Fernet(key)
            encrypted_bytes = base64.b64decode(self.encrypted_value.encode('utf-8'))
            decrypted_value = fernet.decrypt(encrypted_bytes)
            return decrypted_value.decode('utf-8')
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Decryption failed for variable {self.key}: {str(e)}")
            raise ValueError(f"Decryption failed: {str(e)}")
    
    @property
    def value(self):
        """Property to get decrypted value"""
        return self.decrypt_value()


class EnvVariableVersion(models.Model):
    """Track versions of environment variables for audit and rollback"""
    env_variable = models.ForeignKey(EnvVariable, on_delete=models.CASCADE, related_name='versions')
    encrypted_value = models.TextField()
    version_number = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ('env_variable', 'version_number')
        ordering = ['-version_number']


class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('view', 'View'),
        ('export', 'Export'),
        ('import', 'Import'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    target_type = models.CharField(max_length=50)  # 'project', 'environment', 'variable'
    target_id = models.CharField(max_length=100)
    details = models.JSONField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.email} - {self.action} - {self.target_type}:{self.target_id}"
    
    class Meta:
        ordering = ['-timestamp']
