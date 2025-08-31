from django.urls import path
from . import views

app_name = 'authentication'

urlpatterns = [
    # API Status & Configuration
    path('status/', views.api_status, name='api_status'),
    path('config/', views.frontend_config, name='frontend_config'),
    
    # Basic Authentication
    path('register/', views.register, name='register'),
    path('login/', views.CustomTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', views.CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', views.logout, name='logout'),
    path('profile/', views.get_profile, name='profile'),
    
    # Account Management
    path('activate/', views.activate_account, name='activate_account'),
    path('password-reset/', views.password_reset_request, name='password_reset_request'),
    path('password-reset-confirm/', views.password_reset_confirm, name='password_reset_confirm'),
    path('change-password/', views.change_password, name='change_password'),
    
    # Organization Invitations
    path('invitations/accept/', views.accept_organization_invitation, name='accept_invitation'),
    
    # OAuth
    path('oauth/google/', views.google_oauth_login, name='google_oauth'),
    path('oauth/github/', views.github_oauth_login, name='github_oauth'),
]