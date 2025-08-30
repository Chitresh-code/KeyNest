from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from core.models import User
import re


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