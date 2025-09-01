"""
Production-ready JWT authentication views with OAuth, email verification, and comprehensive security.
"""

import logging
from typing import Dict, Any, Optional
from datetime import timedelta
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.conf import settings
from django.shortcuts import redirect
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_exempt
from oauth2_provider.models import AccessToken as OAuthAccessToken
from oauth2_provider import urls as oauth2_urls
import requests
import secrets

from core.models import User, Organization, OrganizationMembership, AuditLog
from .serializers import (
    UserRegistrationSerializer, CustomTokenObtainPairSerializer, 
    UserSerializer, PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
    GoogleOAuthSerializer, GitHubOAuthSerializer, LogoutSerializer,
    AccountActivationSerializer, PasswordChangeSerializer
)
from .tasks import (
    send_activation_email, send_password_reset_email, send_welcome_email,
    send_organization_invitation, send_project_notification
)

logger = logging.getLogger(__name__)
User = get_user_model()


def send_direct_email(subject, message, recipient_email, from_email=None):
    """
    Send email directly via SMTP (bypasses Celery for reliable delivery).
    """
    try:
        import smtplib
        from email.mime.text import MIMEText
        from django.conf import settings
        
        msg = MIMEText(message, 'plain', 'utf-8')
        msg['Subject'] = subject
        msg['From'] = from_email or settings.DEFAULT_FROM_EMAIL
        msg['To'] = recipient_email
        
        server = smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT)
        server.starttls()
        server.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        logger.info(f"Direct email sent successfully to {recipient_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send direct email to {recipient_email}: {str(e)}")
        return False


def get_client_ip(request) -> str:
    """Get client IP address from request, handling proxy forwarded IPs."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip or 'unknown'


class AuthRateThrottle(AnonRateThrottle):
    """Custom rate limiter for authentication endpoints."""
    scope = 'auth'


# ==================================================
# JWT TOKEN VIEWS
# ==================================================

class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT token obtain view with enhanced security and logging."""
    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [AuthRateThrottle]
    
    @method_decorator(never_cache)
    @method_decorator(csrf_exempt)
    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)
            
            if response.status_code == 200:
                # Extract user from validated data
                serializer = self.get_serializer(data=request.data)
                if serializer.is_valid():
                    user = serializer.user
                    
                    # Log successful login
                    AuditLog.objects.create(
                        user=user,
                        action='login',
                        target_type='user',
                        target_id=str(user.id),
                        details={'method': 'jwt', 'ip': get_client_ip(request)},
                        ip_address=get_client_ip(request)
                    )
                    
                    # Add user info to response
                    response.data.update({
                        'user': UserSerializer(user).data,
                        'message': f'Welcome back, {user.first_name or user.username}!'
                    })
                    
                    logger.info(f"JWT login successful: {user.email}")
            
            return response
            
        except Exception as e:
            logger.error(f"JWT login error: {str(e)}")
            return Response({
                'error': 'Authentication failed',
                'detail': 'Unable to process login request'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CustomTokenRefreshView(TokenRefreshView):
    """Custom JWT token refresh view with logging."""
    throttle_classes = [UserRateThrottle]
    
    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)
            
            if response.status_code == 200:
                logger.info(f"JWT token refreshed for IP: {get_client_ip(request)}")
            
            return response
            
        except TokenError as e:
            logger.warning(f"JWT refresh failed: {str(e)} for IP: {get_client_ip(request)}")
            return Response({
                'error': 'Token refresh failed',
                'detail': str(e)
            }, status=status.HTTP_401_UNAUTHORIZED)


# ==================================================
# USER REGISTRATION & ACTIVATION
# ==================================================

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([AuthRateThrottle])
@ratelimit(key='ip', rate='3/m', method='POST')
@csrf_exempt
@never_cache
def register(request):
    """
    Register a new user with email verification.
    Production-ready with comprehensive validation and security.
    """
    try:
        serializer = UserRegistrationSerializer(data=request.data)
        
        if not serializer.is_valid():
            logger.warning(f"Registration validation failed: {serializer.errors}")
            return Response({
                'error': 'Invalid registration data',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email'].lower()
        
        # Check if user already exists
        if User.objects.filter(email=email).exists():
            logger.warning(f"Registration attempt with existing email: {email}")
            return Response({
                'error': 'An account with this email already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            try:
                # Validate password
                validate_password(serializer.validated_data['password'])
                
                # Create user (inactive until email verification)
                user = User.objects.create_user(
                    username=serializer.validated_data['username'],
                    email=email,
                    password=serializer.validated_data['password'],
                    first_name=serializer.validated_data.get('first_name', ''),
                    last_name=serializer.validated_data.get('last_name', ''),
                    is_active=False  # Require email activation
                )
                
                # Create personal organization
                org = Organization.objects.create(
                    name=f"{user.first_name or user.username}'s Organization",
                    description="Personal workspace",
                    created_by=user
                )
                
                # Add user as admin to their organization
                OrganizationMembership.objects.create(
                    user=user,
                    organization=org,
                    role='admin'
                )
                
                # Generate activation token
                activation_token = default_token_generator.make_token(user)
                activation_uid = urlsafe_base64_encode(force_bytes(user.pk))
                
                # Send activation email (direct SMTP - reliable delivery)
                from django.template.loader import render_to_string
                import smtplib
                from email.mime.text import MIMEText
                
                try:
                    # Create email content using the simple template
                    context = {
                        'user': {
                            'first_name': user.first_name,
                            'last_name': user.last_name,
                            'full_name': user.get_full_name() or user.username,
                            'username': user.username,
                            'email': user.email,
                        },
                        'site_name': settings.SITE_NAME,
                        'site_url': settings.FRONTEND_URL,
                        'activation_url': f"{settings.FRONTEND_URL}/{settings.ACTIVATION_URL.format(uid=activation_uid, token=activation_token)}",
                        'token': activation_token,
                        'uid': activation_uid,
                    }
                    
                    email_content = render_to_string('authentication/activation_email.html', context)
                    
                    # Send directly via SMTP (same method that works)
                    msg = MIMEText(email_content, 'plain', 'utf-8')
                    msg['Subject'] = f"Activate Your {settings.SITE_NAME} Account"
                    msg['From'] = settings.DEFAULT_FROM_EMAIL
                    msg['To'] = user.email
                    
                    server = smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT)
                    server.starttls()
                    server.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
                    server.send_message(msg)
                    server.quit()
                    
                    logger.info(f"Activation email sent successfully to {user.email}")
                    
                except Exception as email_error:
                    # Log email error but don't fail registration
                    logger.error(f"Failed to send activation email to {user.email}: {str(email_error)}")
                
                # Log successful registration
                AuditLog.objects.create(
                    user=user,
                    action='register',
                    target_type='user',
                    target_id=str(user.id),
                    details={
                        'email': email,
                        'organization_created': org.id,
                        'activation_required': True
                    },
                    ip_address=get_client_ip(request)
                )
                
                logger.info(f"User registered successfully (activation required): {email}")
                
                return Response({
                    'message': 'Registration successful! Please check your email to activate your account.',
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'username': user.username,
                        'is_active': user.is_active
                    }
                }, status=status.HTTP_201_CREATED)
                
            except ValidationError as e:
                logger.warning(f"Password validation failed for {email}: {e.messages}")
                return Response({
                    'error': 'Password does not meet security requirements',
                    'details': list(e.messages)
                }, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return Response({
            'error': 'Registration failed',
            'detail': 'Unable to process registration request'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([AuthRateThrottle])
@csrf_exempt
def activate_account(request):
    """Activate user account via email token."""
    try:
        serializer = AccountActivationSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'error': 'Invalid activation data',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        uid = serializer.validated_data['uid']
        token = serializer.validated_data['token']
        
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({
                'error': 'Invalid activation link'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not default_token_generator.check_token(user, token):
            return Response({
                'error': 'Invalid or expired activation token'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if user.is_active:
            return Response({
                'message': 'Account is already active'
            }, status=status.HTTP_200_OK)
        
        # Activate user
        user.is_active = True
        user.save()
        
        # Send welcome email directly
        email_subject = "Welcome to KeyNest!"
        email_message = f"""Hello {user.get_full_name() or user.username},

Welcome to KeyNest! Your account has been successfully activated.

You can now log in to KeyNest and start managing your environment variables securely. Here's what you can do:

• Create organizations and invite team members
• Set up projects and environments
• Securely store and manage environment variables
• Export/import environment configurations

To get started, simply log in to your account and explore the features.

If you have any questions or need help, don't hesitate to reach out to our support team.

Best regards,
The KeyNest Team

---
This is an automated message, please do not reply to this email.
If you need help, please contact our support team.

© KeyNest Team"""
        
        send_direct_email(
            subject=email_subject,
            message=email_message,
            recipient_email=user.email
        )
        
        # Log activation
        AuditLog.objects.create(
            user=user,
            action='activate',
            target_type='user',
            target_id=str(user.id),
            details={'email_activation': True},
            ip_address=get_client_ip(request)
        )
        
        logger.info(f"User account activated: {user.email}")
        
        return Response({
            'message': 'Account activated successfully! You can now log in.'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Account activation error: {str(e)}")
        return Response({
            'error': 'Account activation failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==================================================
# PASSWORD RESET
# ==================================================

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([AuthRateThrottle])
@ratelimit(key='ip', rate='5/h', method='POST')
@csrf_exempt
def password_reset_request(request):
    """Request password reset email."""
    try:
        serializer = PasswordResetRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'error': 'Invalid email format'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email'].lower()
        
        try:
            user = User.objects.get(email=email, is_active=True)
            
            # Generate reset token
            reset_token = default_token_generator.make_token(user)
            reset_uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Send reset email (direct SMTP - reliable delivery)
            try:
                from django.template.loader import render_to_string
                import smtplib
                from email.mime.text import MIMEText
                
                context = {
                    'user': {
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'full_name': user.get_full_name() or user.username,
                        'username': user.username,
                        'email': user.email,
                    },
                    'site_name': settings.SITE_NAME,
                    'site_url': settings.FRONTEND_URL,
                    'reset_url': f"{settings.FRONTEND_URL}/{settings.PASSWORD_RESET_URL.format(uid=reset_uid, token=reset_token)}",
                    'token': reset_token,
                    'uid': reset_uid,
                }
                
                # Create a simple password reset template content
                email_content = f"""Hello {user.first_name or user.username},

You have requested to reset your password for your {settings.SITE_NAME} account.

To reset your password, please click the link below:

{context['reset_url']}

If you did not request a password reset, please ignore this email. Your password will remain unchanged.

This password reset link will expire in 24 hours for security reasons.

Best regards,
The {settings.SITE_NAME} Team

---
This is an automated message, please do not reply to this email.
If you need help, please contact our support team.

© {settings.SITE_NAME} Team"""
                
                # Send directly via SMTP
                msg = MIMEText(email_content, 'plain', 'utf-8')
                msg['Subject'] = f"Reset Your {settings.SITE_NAME} Password"
                msg['From'] = settings.DEFAULT_FROM_EMAIL
                msg['To'] = user.email
                
                server = smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT)
                server.starttls()
                server.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
                server.send_message(msg)
                server.quit()
                
                logger.info(f"Password reset email sent successfully to {user.email}")
                
            except Exception as email_error:
                logger.error(f"Failed to send password reset email to {user.email}: {str(email_error)}")
            
            # Log password reset request
            AuditLog.objects.create(
                user=user,
                action='password_reset_request',
                target_type='user',
                target_id=str(user.id),
                details={'email': email},
                ip_address=get_client_ip(request)
            )
            
            logger.info(f"Password reset requested for: {email}")
            
        except User.DoesNotExist:
            # Don't reveal if email exists or not for security
            logger.warning(f"Password reset requested for non-existent email: {email}")
        
        # Always return success to prevent email enumeration
        return Response({
            'message': 'If an account with this email exists, you will receive password reset instructions.'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Password reset request error: {str(e)}")
        return Response({
            'error': 'Password reset request failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([AuthRateThrottle])
@csrf_exempt
def password_reset_confirm(request):
    """Confirm password reset with token."""
    try:
        serializer = PasswordResetConfirmSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'error': 'Invalid reset data',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        uid = serializer.validated_data['uid']
        token = serializer.validated_data['token']
        password = serializer.validated_data['new_password']
        
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id, is_active=True)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({
                'error': 'Invalid reset link'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not default_token_generator.check_token(user, token):
            return Response({
                'error': 'Invalid or expired reset token'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate new password
        try:
            validate_password(password, user)
        except ValidationError as e:
            return Response({
                'error': 'Password does not meet security requirements',
                'details': list(e.messages)
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Set new password
        user.set_password(password)
        user.save()
        
        # Log password change
        AuditLog.objects.create(
            user=user,
            action='password_reset_confirm',
            target_type='user',
            target_id=str(user.id),
            details={'method': 'email_reset'},
            ip_address=get_client_ip(request)
        )
        
        logger.info(f"Password reset completed for: {user.email}")
        
        return Response({
            'message': 'Password has been reset successfully. You can now log in with your new password.'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Password reset confirm error: {str(e)}")
        return Response({
            'error': 'Password reset failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@throttle_classes([UserRateThrottle])
def change_password(request):
    """Change password for authenticated user."""
    try:
        serializer = PasswordChangeSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'error': 'Invalid password change data',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        current_password = serializer.validated_data['current_password']
        new_password = serializer.validated_data['new_password']
        
        # Verify current password
        if not user.check_password(current_password):
            return Response({
                'error': 'Current password is incorrect'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        # Log password change
        AuditLog.objects.create(
            user=user,
            action='password_change',
            target_type='user',
            target_id=str(user.id),
            details={'method': 'authenticated_change'},
            ip_address=get_client_ip(request)
        )
        
        logger.info(f"Password changed for user: {user.email}")
        
        return Response({
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Password change error for user {request.user.id}: {str(e)}")
        return Response({
            'error': 'Password change failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==================================================
# API STATUS & FRONTEND INTEGRATION
# ==================================================

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
@throttle_classes([UserRateThrottle])
def api_status(request):
    """API status and configuration endpoint for frontend integration."""
    try:
        from django.conf import settings
        from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
        import django
        
        # Get token info for authenticated users
        token_info = None
        if request.user.is_authenticated:
            token_info = {
                'user_id': request.user.id,
                'username': request.user.username,
                'email': request.user.email,
                'is_staff': request.user.is_staff,
                'is_active': request.user.is_active,
            }
        
        # Get organization count for user
        user_org_count = 0
        if request.user.is_authenticated:
            from core.models import OrganizationMembership
            user_org_count = OrganizationMembership.objects.filter(
                user=request.user
            ).count()
        
        status_data = {
            'status': 'healthy',
            'version': '1.0.0',
            'django_version': django.get_version(),
            'api_endpoints': {
                'authentication': {
                    'register': '/api/auth/register/',
                    'login': '/api/auth/login/',
                    'refresh': '/api/auth/token/refresh/',
                    'logout': '/api/auth/logout/',
                    'profile': '/api/auth/profile/',
                    'activate': '/api/auth/activate/',
                    'password_reset': '/api/auth/password-reset/',
                    'password_reset_confirm': '/api/auth/password-reset-confirm/',
                    'change_password': '/api/auth/change-password/',
                    'accept_invitation': '/api/auth/invitations/accept/',
                },
                'oauth': {
                    'google': '/api/auth/oauth/google/',
                    'github': '/api/auth/oauth/github/',
                },
                'organizations': '/api/core/organizations/',
                'projects': '/api/core/projects/',
                'environments': '/api/core/environments/',
                'variables': '/api/core/variables/',
            },
            'features': {
                'jwt_authentication': True,
                'oauth_providers': ['google', 'github'],
                'email_notifications': True,
                'organization_invitations': True,
                'project_notifications': True,
                'audit_logging': True,
                'rate_limiting': True,
                'encryption': True,
            },
            'token_config': {
                'access_token_lifetime_minutes': 60,
                'refresh_token_lifetime_days': 7,
                'rotate_refresh_tokens': True,
                'blacklist_after_rotation': True,
            },
            'user_info': token_info,
            'user_stats': {
                'organization_count': user_org_count,
            } if request.user.is_authenticated else None,
            'cors_enabled': hasattr(settings, 'CORS_ALLOWED_ORIGINS'),
            'debug_mode': settings.DEBUG,
            'timestamp': timezone.now().isoformat(),
        }
        
        return Response(status_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"API status error: {str(e)}")
        return Response({
            'status': 'error',
            'message': 'API status check failed',
            'timestamp': timezone.now().isoformat(),
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
@throttle_classes([UserRateThrottle])
def frontend_config(request):
    """Frontend configuration endpoint with all necessary settings."""
    try:
        from django.conf import settings
        
        config = {
            'api': {
                'base_url': request.build_absolute_uri('/api/'),
                'version': '1.0.0',
                'endpoints': {
                    # Authentication endpoints
                    'auth_register': '/api/auth/register/',
                    'auth_login': '/api/auth/login/',
                    'auth_refresh': '/api/auth/token/refresh/',
                    'auth_logout': '/api/auth/logout/',
                    'auth_profile': '/api/auth/profile/',
                    'auth_activate': '/api/auth/activate/',
                    'auth_password_reset': '/api/auth/password-reset/',
                    'auth_password_reset_confirm': '/api/auth/password-reset-confirm/',
                    'auth_change_password': '/api/auth/change-password/',
                    'auth_status': '/api/auth/status/',
                    
                    # OAuth endpoints
                    'oauth_google': '/api/auth/oauth/google/',
                    'oauth_github': '/api/auth/oauth/github/',
                    
                    # Organization management
                    'organizations': '/api/core/organizations/',
                    'organization_invite': '/api/core/organizations/{id}/invite_member/',
                    'organization_members': '/api/core/organizations/{id}/members/',
                    'organization_update_role': '/api/core/organizations/{id}/update_member_role/',
                    'organization_remove_member': '/api/core/organizations/{id}/remove_member/',
                    'accept_invitation': '/api/auth/invitations/accept/',
                    
                    # Project management
                    'projects': '/api/core/projects/',
                    'environments': '/api/core/environments/',
                    'variables': '/api/core/variables/',
                    
                    # Utility endpoints
                    'export_env': '/api/core/environments/{id}/export/',
                    'import_env': '/api/core/environments/{id}/import/',
                    'audit_logs': '/api/core/audit-logs/',
                }
            },
            'authentication': {
                'method': 'JWT',
                'token_header': 'Authorization',
                'token_prefix': 'Bearer',
                'access_token_lifetime': 3600,  # 1 hour in seconds
                'refresh_token_lifetime': 604800,  # 7 days in seconds
                'auto_refresh': True,
                'rotate_refresh_tokens': True,
            },
            'oauth': {
                'enabled': True,
                'providers': {
                    'google': {
                        'name': 'Google',
                        'scopes': ['openid', 'email', 'profile'],
                        'endpoint': '/api/auth/oauth/google/',
                    },
                    'github': {
                        'name': 'GitHub',
                        'scopes': ['user:email'],
                        'endpoint': '/api/auth/oauth/github/',
                    }
                }
            },
            'features': {
                'registration': True,
                'email_verification': True,
                'password_reset': True,
                'organizations': True,
                'projects': True,
                'environments': True,
                'variables': True,
                'invitations': True,
                'notifications': True,
                'audit_logging': True,
                'file_export': ['env', 'json', 'yaml'],
                'file_import': ['env', 'json', 'yaml'],
            },
            'validation': {
                'password_min_length': 8,
                'username_min_length': 3,
                'email_max_length': 254,
                'organization_name_max_length': 255,
                'project_name_max_length': 255,
                'environment_name_max_length': 100,
                'variable_key_max_length': 255,
            },
            'limits': {
                'max_organizations_per_user': None,  # No limit
                'max_members_per_organization': 100,
                'max_projects_per_organization': None,  # No limit
                'max_environments_per_project': None,  # No limit
                'max_variables_per_environment': None,  # No limit
                'file_upload_max_size': '10MB',
                'rate_limit_per_minute': 60,
            },
            'cors': {
                'enabled': True,
                'credentials': True,
                'methods': ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
                'headers': ['authorization', 'content-type', 'accept', 'origin', 'x-requested-with'],
            },
            'websocket': {
                'enabled': False,  # Not implemented yet
                'url': None,
            }
        }
        
        return Response(config, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Frontend config error: {str(e)}")
        return Response({
            'error': 'Configuration unavailable',
            'message': 'Unable to load frontend configuration'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==================================================
# ORGANIZATION INVITATIONS
# ==================================================

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@throttle_classes([UserRateThrottle])
def accept_organization_invitation(request):
    """Accept an organization invitation by token."""
    try:
        token = request.data.get('token')
        
        if not token:
            return Response({
                'error': 'Invitation token is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Find and validate invitation
        try:
            from core.models import OrganizationInvitation, OrganizationMembership
            invitation = OrganizationInvitation.objects.select_related(
                'organization', 'inviter'
            ).get(token=token)
        except OrganizationInvitation.DoesNotExist:
            return Response({
                'error': 'Invalid invitation token'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if invitation can be accepted
        if not invitation.can_be_accepted():
            if invitation.is_expired():
                invitation.status = 'expired'
                invitation.save()
                return Response({
                    'error': 'Invitation has expired'
                }, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({
                    'error': 'Invitation is no longer valid'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if the user's email matches the invitation
        if request.user.email.lower() != invitation.invitee_email.lower():
            return Response({
                'error': 'This invitation is not for your email address'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user is already a member
        if OrganizationMembership.objects.filter(
            user=request.user,
            organization=invitation.organization
        ).exists():
            return Response({
                'error': 'You are already a member of this organization'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Accept invitation
        with transaction.atomic():
            # Create membership
            membership = OrganizationMembership.objects.create(
                user=request.user,
                organization=invitation.organization,
                role=invitation.role
            )
            
            # Update invitation status
            invitation.status = 'accepted'
            invitation.accepted_at = timezone.now()
            invitation.save()
            
            # Notify existing organization members about the new member
            from authentication.tasks import send_project_notification
            existing_members = OrganizationMembership.objects.filter(
                organization=invitation.organization
            ).exclude(user=request.user).select_related('user')
            
            for member in existing_members:
                send_project_notification.delay(
                    user_id=member.user.id,
                    project_name=invitation.organization.name,
                    notification_type='member_added',
                    message=f'{request.user.username} ({request.user.email}) has joined "{invitation.organization.name}" as {invitation.role}.'
                )
            
            # Log invitation acceptance
            AuditLog.objects.create(
                user=request.user,
                action='accept',
                target_type='invitation',
                target_id=str(invitation.organization.id),
                details={
                    'organization_id': invitation.organization.id,
                    'organization_name': invitation.organization.name,
                    'role': invitation.role,
                    'inviter_email': invitation.inviter.email,
                    'invitation_created': invitation.created_at.isoformat()
                },
                ip_address=get_client_ip(request)
            )
            
            logger.info(f"User {request.user.email} accepted invitation to {invitation.organization.name}")
        
        return Response({
            'message': f'Successfully joined {invitation.organization.name}',
            'organization': {
                'id': invitation.organization.id,
                'name': invitation.organization.name,
                'role': invitation.role,
                'joined_at': membership.joined_at.isoformat()
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error accepting invitation for user {request.user.id}: {str(e)}")
        return Response({
            'error': 'Failed to accept invitation'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==================================================
# OAUTH INTEGRATION
# ==================================================

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([AuthRateThrottle])
@csrf_exempt
def google_oauth_login(request):
    """Authenticate user with Google OAuth access token."""
    try:
        serializer = GoogleOAuthSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'error': 'Invalid request data',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        validated_data = serializer.validate(request.data)
        
        # Log successful OAuth login
        logger.info(f"Google OAuth login successful for user: {validated_data['user']['email']}")
        
        # Create audit log
        AuditLog.objects.create(
            user_id=validated_data['user']['id'],
            action='oauth_login',
            target_type='authentication',
            target_id='google',
            details={'provider': 'google'},
            ip_address=get_client_ip(request)
        )
        
        return Response({
            'message': 'Google OAuth authentication successful',
            'tokens': {
                'access': validated_data['access'],
                'refresh': validated_data['refresh']
            },
            'user': validated_data['user'],
            'is_new_user': validated_data.get('is_new_user', False)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Google OAuth login error: {str(e)}")
        return Response({
            'error': 'Authentication failed',
            'message': 'Google OAuth authentication failed'
        }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([AuthRateThrottle])
@csrf_exempt
def github_oauth_login(request):
    """Authenticate user with GitHub OAuth access token."""
    try:
        serializer = GitHubOAuthSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'error': 'Invalid request data',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        validated_data = serializer.validate(request.data)
        
        # Log successful OAuth login
        logger.info(f"GitHub OAuth login successful for user: {validated_data['user']['email']}")
        
        # Create audit log
        AuditLog.objects.create(
            user_id=validated_data['user']['id'],
            action='oauth_login',
            target_type='authentication',
            target_id='github',
            details={'provider': 'github'},
            ip_address=get_client_ip(request)
        )
        
        return Response({
            'message': 'GitHub OAuth authentication successful',
            'tokens': {
                'access': validated_data['access'],
                'refresh': validated_data['refresh']
            },
            'user': validated_data['user'],
            'is_new_user': validated_data.get('is_new_user', False)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"GitHub OAuth login error: {str(e)}")
        return Response({
            'error': 'Authentication failed',
            'message': 'GitHub OAuth authentication failed'
        }, status=status.HTTP_401_UNAUTHORIZED)


# ==================================================
# USER PROFILE & SETTINGS
# ==================================================


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_profile(request):
    """Get current user profile."""
    try:
        # Get user's organizations
        memberships = OrganizationMembership.objects.filter(
            user=request.user
        ).select_related('organization')
        
        organizations = [{
            'id': membership.organization.id,
            'name': membership.organization.name,
            'role': membership.role
        } for membership in memberships]
        
        return Response({
            'user': UserSerializer(request.user).data,
            'organizations': organizations
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Profile retrieval error for user {request.user.id}: {str(e)}")
        return Response({
            'error': 'Failed to retrieve profile'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout(request):
    """Logout user by blacklisting refresh token."""
    try:
        serializer = LogoutSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'error': 'Invalid refresh token',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Token is blacklisted in the serializer's validate method
        logger.info(f"User {request.user.email} logged out successfully")
        
        return Response({
            'message': 'Successfully logged out'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Logout error for user {request.user.id}: {str(e)}")
        return Response({
            'error': 'Logout failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

