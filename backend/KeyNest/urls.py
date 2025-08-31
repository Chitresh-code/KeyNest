"""
URL configuration for KeyNest project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.http import JsonResponse
from django.conf.urls.static import static

def health_check(request):
    """Health check endpoint for load balancers"""
    return JsonResponse({
        'status': 'healthy',
        'service': 'KeyNest API',
        'version': '1.0.0'
    })

def api_root(request):
    """API root endpoint with available endpoints"""
    return JsonResponse({
        'message': 'Welcome to KeyNest API',
        'version': '1.0.0',
        'description': 'Secure environment variable management platform',
        'documentation': {
            'status': '/api/auth/status/',
            'config': '/api/auth/config/',
        },
        'endpoints': {
            'authentication': '/api/auth/',
            'organizations': '/api/core/organizations/',
            'projects': '/api/core/projects/',
            'environments': '/api/core/environments/',
            'variables': '/api/core/variables/',
            'health': '/health/',
            'admin': '/admin/',
        },
        'features': [
            'JWT Authentication',
            'OAuth (Google, GitHub)',
            'Organization Management',
            'Project Management',
            'Environment Variables',
            'Email Notifications',
            'Audit Logging',
            'File Import/Export'
        ]
    })

urlpatterns = [
    # Health check for load balancers
    path('health/', health_check, name='health_check'),
    
    # API root
    path('api/', api_root, name='api_root'),
    
    # Authentication endpoints
    path('api/auth/', include('authentication.urls')),
    
    # Core API endpoints
    path('api/core/', include('core.urls')),
    
    # Admin interface
    path('admin/', admin.site.urls),
]

# Debug toolbar for development
# if settings.DEBUG:
#     try:
#         import debug_toolbar
#         urlpatterns = [
#             path('__debug__/', include(debug_toolbar.urls)),
#         ] + urlpatterns
#     except ImportError:
#         pass
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
