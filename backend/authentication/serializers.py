from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from core.models import User
import re
import requests
from django.conf import settings


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Production-ready user registration serializer with comprehensive validation
    """
    password = serializers.CharField(
        write_only=True, 
        min_length=8,
        max_length=128,
        style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(
        write_only=True, 
        style={'input_type': 'password'}
    )
    email = serializers.EmailField(
        required=True,
        max_length=254
    )
    username = serializers.CharField(
        required=True,
        min_length=3,
        max_length=150
    )

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'confirm_password', 'first_name', 'last_name')
        extra_kwargs = {
            'first_name': {'required': False, 'max_length': 150},
            'last_name': {'required': False, 'max_length': 150},
        }

    def validate_email(self, value):
        """
        Validate email format and uniqueness
        """
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("User with this email already exists.")
        return value.lower()

    def validate_username(self, value):
        """
        Validate username format and uniqueness
        """
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        
        # Check for valid username format (alphanumeric + underscore)
        if not re.match(r'^[a-zA-Z0-9_]+$', value):
            raise serializers.ValidationError(
                "Username can only contain letters, numbers, and underscores."
            )
        
        return value

    def validate_password(self, value):
        """
        Validate password using Django's built-in validators
        """
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate(self, attrs):
        """
        Cross-field validation
        """
        if attrs.get('password') != attrs.get('confirm_password'):
            raise serializers.ValidationError("Passwords do not match.")
        
        # Remove confirm_password as it's not needed for user creation
        attrs.pop('confirm_password', None)
        return attrs


class UserLoginSerializer(serializers.Serializer):
    """
    Production-ready login serializer with input validation
    """
    email = serializers.EmailField(
        required=True,
        max_length=254
    )
    password = serializers.CharField(
        required=True,
        max_length=128,
        style={'input_type': 'password'}
    )

    def validate_email(self, value):
        """
        Normalize email to lowercase
        """
        return value.lower()

    def validate(self, attrs):
        """
        Validate that both email and password are provided
        """
        email = attrs.get('email')
        password = attrs.get('password')

        if not email or not password:
            raise serializers.ValidationError("Both email and password are required.")
        
        return attrs


class UserSerializer(serializers.ModelSerializer):
    """
    Production-ready user serializer for safe user data exposure
    """
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = (
            'id', 
            'username', 
            'email', 
            'first_name', 
            'last_name', 
            'full_name',
            'date_joined',
            'last_login',
            'is_active'
        )
        read_only_fields = ('id', 'date_joined', 'last_login', 'is_active')

    def get_full_name(self, obj):
        """
        Get user's full name or username if names not provided
        """
        if obj.first_name or obj.last_name:
            return f"{obj.first_name} {obj.last_name}".strip()
        return obj.username


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Production-ready serializer for user profile updates
    """
    class Meta:
        model = User
        fields = ('first_name', 'last_name')
        extra_kwargs = {
            'first_name': {'max_length': 150, 'allow_blank': True},
            'last_name': {'max_length': 150, 'allow_blank': True},
        }

    def validate(self, attrs):
        """
        Ensure at least some data is being updated
        """
        if not any(attrs.values()):
            raise serializers.ValidationError("At least one field must be provided for update.")
        return attrs


class PasswordChangeSerializer(serializers.Serializer):
    """
    Production-ready password change serializer
    """
    current_password = serializers.CharField(
        required=True,
        max_length=128,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        required=True,
        min_length=8,
        max_length=128,
        style={'input_type': 'password'}
    )
    confirm_new_password = serializers.CharField(
        required=True,
        style={'input_type': 'password'}
    )

    def validate_new_password(self, value):
        """
        Validate new password using Django's built-in validators
        """
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate(self, attrs):
        """
        Cross-field validation for password change
        """
        if attrs.get('new_password') != attrs.get('confirm_new_password'):
            raise serializers.ValidationError("New passwords do not match.")
        
        # Remove confirm_new_password as it's not needed
        attrs.pop('confirm_new_password', None)
        return attrs


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT token serializer with enhanced user validation and custom claims
    """
    username_field = 'email'
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields[self.username_field] = serializers.EmailField(required=True)
        self.fields['password'] = serializers.CharField(required=True, style={'input_type': 'password'})

    @classmethod
    def get_token(cls, user):
        """
        Add custom claims to JWT token
        """
        token = super().get_token(user)
        
        # Add custom claims
        token['user_id'] = user.id
        token['username'] = user.username
        token['email'] = user.email
        token['full_name'] = f"{user.first_name} {user.last_name}".strip() or user.username
        token['is_active'] = user.is_active
        token['is_staff'] = user.is_staff
        token['is_superuser'] = user.is_superuser
        
        return token

    def validate(self, attrs):
        """
        Enhanced validation with better error handling
        """
        email = attrs.get('email', '').lower()
        password = attrs.get('password', '')

        if not email or not password:
            raise serializers.ValidationError(
                {'detail': 'Both email and password are required.'}
            )

        # Try to authenticate user
        user = authenticate(
            request=self.context.get('request'),
            username=email,
            password=password
        )

        if not user:
            # Check if user exists but password is wrong
            try:
                user_obj = User.objects.get(email=email)
                raise serializers.ValidationError(
                    {'detail': 'Invalid credentials. Please check your password.'}
                )
            except User.DoesNotExist:
                raise serializers.ValidationError(
                    {'detail': 'Invalid credentials. Please check your email and password.'}
                )

        if not user.is_active:
            raise serializers.ValidationError(
                {'detail': 'Account is deactivated. Please contact support.'}
            )

        # Set user for token generation
        self.user = user
        
        # Generate tokens
        refresh = self.get_token(user)
        
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        }


class CustomTokenRefreshSerializer(TokenRefreshSerializer):
    """
    Custom token refresh serializer with enhanced validation
    """
    
    def validate(self, attrs):
        """
        Enhanced token refresh validation
        """
        try:
            refresh = RefreshToken(attrs['refresh'])
            
            # Check if token is blacklisted
            if hasattr(refresh, 'check_blacklist'):
                refresh.check_blacklist()
                
            data = {
                'access': str(refresh.access_token),
            }
            
            # Optionally rotate refresh token
            if hasattr(refresh, 'rotate'):
                data['refresh'] = str(refresh.rotate())
            
            return data
            
        except Exception as e:
            raise serializers.ValidationError(
                {'detail': 'Invalid or expired refresh token.'}
            )


class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Password reset request serializer
    """
    email = serializers.EmailField(required=True, max_length=254)

    def validate_email(self, value):
        """
        Validate email exists in system
        """
        email = value.lower()
        try:
            User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't reveal if email exists or not for security
            pass
        return email


class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Password reset confirmation serializer
    """
    uid = serializers.CharField(required=True)
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(
        required=True,
        min_length=8,
        max_length=128,
        style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(
        required=True,
        style={'input_type': 'password'}
    )

    def validate_new_password(self, value):
        """
        Validate new password using Django's built-in validators
        """
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate(self, attrs):
        """
        Cross-field validation for password reset
        """
        if attrs.get('new_password') != attrs.get('confirm_password'):
            raise serializers.ValidationError("Passwords do not match.")
        
        # Remove confirm_password as it's not needed
        attrs.pop('confirm_password', None)
        return attrs


class AccountActivationSerializer(serializers.Serializer):
    """
    Account activation serializer
    """
    uid = serializers.CharField(required=True)
    token = serializers.CharField(required=True)


class LogoutSerializer(serializers.Serializer):
    """
    Logout serializer for token blacklisting
    """
    refresh = serializers.CharField(required=True)

    def validate(self, attrs):
        """
        Validate refresh token and blacklist it
        """
        try:
            refresh_token = RefreshToken(attrs['refresh'])
            refresh_token.blacklist()
        except Exception as e:
            raise serializers.ValidationError({'detail': 'Invalid refresh token.'})
        
        return attrs


class GoogleOAuthSerializer(serializers.Serializer):
    """
    Google OAuth authentication serializer
    """
    access_token = serializers.CharField(required=True)
    
    def validate_access_token(self, value):
        """
        Verify Google access token and fetch user info
        """
        try:
            # Verify the token with Google
            google_user_info_url = 'https://www.googleapis.com/oauth2/v2/userinfo'
            response = requests.get(
                google_user_info_url,
                headers={'Authorization': f'Bearer {value}'},
                timeout=10
            )
            
            if response.status_code != 200:
                raise serializers.ValidationError({'detail': 'Invalid Google access token.'})
            
            user_data = response.json()
            
            # Validate required fields
            required_fields = ['id', 'email', 'verified_email']
            for field in required_fields:
                if field not in user_data:
                    raise serializers.ValidationError({'detail': 'Invalid user data from Google.'})
            
            if not user_data.get('verified_email', False):
                raise serializers.ValidationError({'detail': 'Google email is not verified.'})
            
            return user_data
            
        except requests.exceptions.RequestException:
            raise serializers.ValidationError({'detail': 'Failed to verify Google token.'})
        except Exception:
            raise serializers.ValidationError({'detail': 'Invalid Google access token.'})

    def create_or_get_user(self, google_user_data):
        """
        Create or get user from Google data
        """
        email = google_user_data['email'].lower()
        google_id = google_user_data['id']
        
        try:
            # Try to find existing user by email
            user = User.objects.get(email=email)
            
            # Update Google ID if not set
            if not hasattr(user, 'google_id') or not user.google_id:
                user.google_id = google_id
                user.save()
                
        except User.DoesNotExist:
            # Create new user
            user = User.objects.create_user(
                username=email.split('@')[0],  # Use email prefix as username
                email=email,
                first_name=google_user_data.get('given_name', ''),
                last_name=google_user_data.get('family_name', ''),
                is_active=True  # Google users are pre-verified
            )
            user.google_id = google_id
            user.save()
        
        return user

    def validate(self, attrs):
        """
        Validate Google OAuth and return JWT tokens
        """
        google_user_data = self.validate_access_token(attrs['access_token'])
        user = self.create_or_get_user(google_user_data)
        
        # Generate JWT tokens
        refresh = CustomTokenObtainPairSerializer.get_token(user)
        
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data,
            'is_new_user': not User.objects.filter(
                email=google_user_data['email'].lower()
            ).exists()
        }


class GitHubOAuthSerializer(serializers.Serializer):
    """
    GitHub OAuth authentication serializer
    """
    access_token = serializers.CharField(required=True)
    
    def validate_access_token(self, value):
        """
        Verify GitHub access token and fetch user info
        """
        try:
            # Get user info from GitHub
            github_user_url = 'https://api.github.com/user'
            response = requests.get(
                github_user_url,
                headers={
                    'Authorization': f'token {value}',
                    'Accept': 'application/vnd.github.v3+json'
                },
                timeout=10
            )
            
            if response.status_code != 200:
                raise serializers.ValidationError({'detail': 'Invalid GitHub access token.'})
            
            user_data = response.json()
            
            # Get user email (might be private)
            github_emails_url = 'https://api.github.com/user/emails'
            email_response = requests.get(
                github_emails_url,
                headers={
                    'Authorization': f'token {value}',
                    'Accept': 'application/vnd.github.v3+json'
                },
                timeout=10
            )
            
            if email_response.status_code == 200:
                emails = email_response.json()
                # Find primary verified email
                primary_email = None
                for email_info in emails:
                    if email_info.get('primary', False) and email_info.get('verified', False):
                        primary_email = email_info['email']
                        break
                
                if not primary_email and emails:
                    # If no primary, get first verified email
                    for email_info in emails:
                        if email_info.get('verified', False):
                            primary_email = email_info['email']
                            break
                
                user_data['email'] = primary_email
            
            # Validate required fields
            required_fields = ['id', 'login']
            for field in required_fields:
                if field not in user_data:
                    raise serializers.ValidationError({'detail': 'Invalid user data from GitHub.'})
            
            if not user_data.get('email'):
                raise serializers.ValidationError({
                    'detail': 'GitHub email is required and must be verified.'
                })
            
            return user_data
            
        except requests.exceptions.RequestException:
            raise serializers.ValidationError({'detail': 'Failed to verify GitHub token.'})
        except Exception:
            raise serializers.ValidationError({'detail': 'Invalid GitHub access token.'})

    def create_or_get_user(self, github_user_data):
        """
        Create or get user from GitHub data
        """
        email = github_user_data['email'].lower()
        github_id = str(github_user_data['id'])
        username = github_user_data['login']
        
        try:
            # Try to find existing user by email
            user = User.objects.get(email=email)
            
            # Update GitHub ID if not set
            if not hasattr(user, 'github_id') or not user.github_id:
                user.github_id = github_id
                user.save()
                
        except User.DoesNotExist:
            # Create new user with unique username
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            
            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=github_user_data.get('name', '').split(' ')[0] if github_user_data.get('name') else '',
                last_name=' '.join(github_user_data.get('name', '').split(' ')[1:]) if github_user_data.get('name') else '',
                is_active=True  # GitHub users are pre-verified
            )
            user.github_id = github_id
            user.save()
        
        return user

    def validate(self, attrs):
        """
        Validate GitHub OAuth and return JWT tokens
        """
        github_user_data = self.validate_access_token(attrs['access_token'])
        user = self.create_or_get_user(github_user_data)
        
        # Generate JWT tokens
        refresh = CustomTokenObtainPairSerializer.get_token(user)
        
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data,
            'is_new_user': not User.objects.filter(
                email=github_user_data['email'].lower()
            ).exists()
        }