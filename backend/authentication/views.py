import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from core.models import User, Organization, OrganizationMembership, AuditLog
from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserSerializer

logger = logging.getLogger(__name__)


def get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


class AuthThrottle(AnonRateThrottle):
    scope = 'auth'
    rate = '5/min'


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthThrottle])
@csrf_exempt
@never_cache
def register(request):
    """
    Register a new user and create a personal organization
    Production-ready with proper validation, logging, and error handling
    """
    try:
        serializer = UserRegistrationSerializer(data=request.data)
        if not serializer.is_valid():
            logger.warning(f"Registration failed - invalid data: {serializer.errors}")
            return Response({
                'error': 'Invalid registration data',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if user already exists
        email = serializer.validated_data['email']
        if User.objects.filter(email=email).exists():
            logger.warning(f"Registration attempt with existing email: {email}")
            return Response({
                'error': 'User with this email already exists'
            }, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            try:
                # Validate password with Django's validators
                validate_password(serializer.validated_data['password'])
                
                # Create user
                user = User.objects.create_user(
                    username=serializer.validated_data['username'],
                    email=email,
                    password=serializer.validated_data['password'],
                    first_name=serializer.validated_data.get('first_name', ''),
                    last_name=serializer.validated_data.get('last_name', '')
                )
                
                # Create personal organization
                org = Organization.objects.create(
                    name=f"{user.first_name or user.username}'s Organization",
                    description="Personal organization",
                    created_by=user
                )
                
                # Add user as admin to their organization
                OrganizationMembership.objects.create(
                    user=user,
                    organization=org,
                    role='admin'
                )
                
                # Create authentication token
                token, created = Token.objects.get_or_create(user=user)
                
                # Log successful registration
                AuditLog.objects.create(
                    user=user,
                    action='create',
                    target_type='user',
                    target_id=str(user.id),
                    details={'registration': True, 'organization_created': org.id},
                    ip_address=get_client_ip(request)
                )
                
                logger.info(f"User registered successfully: {user.email}")
                
                return Response({
                    'message': 'User registered successfully',
                    'token': token.key,
                    'user': UserSerializer(user).data,
                    'organization': {
                        'id': org.id,
                        'name': org.name
                    }
                }, status=status.HTTP_201_CREATED)
                
            except ValidationError as e:
                logger.warning(f"Password validation failed for {email}: {e.messages}")
                return Response({
                    'error': 'Password does not meet security requirements',
                    'details': list(e.messages)
                }, status=status.HTTP_400_BAD_REQUEST)
                
    except Exception as e:
        logger.error(f"Unexpected error during registration: {str(e)}")
        return Response({
            'error': 'Registration failed due to server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthThrottle])
@csrf_exempt
@never_cache
def login(request):
    """
    Login user and return authentication token
    Production-ready with rate limiting and audit logging
    """
    try:
        serializer = UserLoginSerializer(data=request.data)
        if not serializer.is_valid():
            logger.warning(f"Login failed - invalid data: {serializer.errors}")
            return Response({
                'error': 'Invalid login data',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        # Authenticate user
        try:
            user = User.objects.get(email=email)
            
            # Check if user is active
            if not user.is_active:
                logger.warning(f"Login attempt for inactive user: {email}")
                return Response({
                    'error': 'Account is disabled'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Try authentication with both username and email
            authenticated_user = authenticate(request, username=user.username, password=password)
            if not authenticated_user:
                # Fallback: check password manually if authenticate fails
                if user.check_password(password):
                    authenticated_user = user
            
            if authenticated_user:
                # Generate or get existing token
                token, created = Token.objects.get_or_create(user=user)
                
                # Get user's organizations with role information
                memberships = OrganizationMembership.objects.filter(
                    user=user
                ).select_related('organization')
                
                organizations = [{
                    'id': membership.organization.id,
                    'name': membership.organization.name,
                    'role': membership.role
                } for membership in memberships]
                
                # Log successful login
                AuditLog.objects.create(
                    user=user,
                    action='view',
                    target_type='user',
                    target_id=str(user.id),
                    details={'login': True},
                    ip_address=get_client_ip(request)
                )
                
                logger.info(f"User logged in successfully: {user.email}")
                
                return Response({
                    'message': 'Login successful',
                    'token': token.key,
                    'user': UserSerializer(user).data,
                    'organizations': organizations
                }, status=status.HTTP_200_OK)
            else:
                # Log failed login attempt
                logger.warning(f"Failed login attempt for: {email}")
                return Response({
                    'error': 'Invalid credentials'
                }, status=status.HTTP_401_UNAUTHORIZED)
                
        except User.DoesNotExist:
            logger.warning(f"Login attempt for non-existent user: {email}")
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
    except Exception as e:
        logger.error(f"Unexpected error during login: {str(e)}")
        return Response({
            'error': 'Login failed due to server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@throttle_classes([UserRateThrottle])
def logout(request):
    """
    Logout user by deleting their token
    Production-ready with proper error handling and logging
    """
    try:
        if hasattr(request.user, 'auth_token'):
            # Log logout
            AuditLog.objects.create(
                user=request.user,
                action='view',
                target_type='user',
                target_id=str(request.user.id),
                details={'logout': True},
                ip_address=get_client_ip(request)
            )
            
            request.user.auth_token.delete()
            logger.info(f"User logged out successfully: {request.user.email}")
            
            return Response({
                'message': 'Logout successful'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'message': 'No active session found'
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Error during logout for user {request.user.email}: {str(e)}")
        return Response({
            'error': 'Logout failed due to server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@throttle_classes([UserRateThrottle])
def profile(request):
    """
    Get current user profile
    Production-ready with proper error handling
    """
    try:
        return Response({
            'user': UserSerializer(request.user).data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error fetching profile for user {request.user.email}: {str(e)}")
        return Response({
            'error': 'Failed to fetch profile'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def get_client_ip(request):
    """
    Get client IP address from request
    Handles proxy forwarded IPs for production environments
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip
