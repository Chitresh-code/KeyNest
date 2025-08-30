from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router for viewsets
router = DefaultRouter()
router.register(r'organizations', views.OrganizationViewSet, basename='organization')
router.register(r'projects', views.ProjectViewSet, basename='project')
router.register(r'environments', views.EnvironmentViewSet, basename='environment')
router.register(r'variables', views.EnvVariableViewSet, basename='variable')

app_name = 'core'

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
    
    # Custom endpoints
    path('projects/<int:project_id>/environments/', views.ProjectEnvironmentListView.as_view(), name='project-environments'),
    path('environments/<int:env_id>/variables/', views.EnvironmentVariableListView.as_view(), name='environment-variables'),
    path('environments/<int:env_id>/export/', views.export_env_file, name='export-env'),
    path('environments/<int:env_id>/import/', views.import_env_file, name='import-env'),
    path('audit-logs/', views.AuditLogListView.as_view(), name='audit-logs'),
]