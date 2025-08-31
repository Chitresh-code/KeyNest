"""
Celery configuration for KeyNest project.
"""

import os
from celery import Celery
from django.conf import settings

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'KeyNest.settings')

app = Celery('keynest')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django app configs.
app.autodiscover_tasks()

# Optional configuration, see the application user guide.
app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone=settings.TIME_ZONE,
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,
    task_soft_time_limit=20 * 60,
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
    beat_scheduler='django_celery_beat.schedulers:DatabaseScheduler',
)

# Email task routing
app.conf.task_routes = {
    'authentication.tasks.send_email_task': {'queue': 'email'},
    'authentication.tasks.send_activation_email': {'queue': 'email'},
    'authentication.tasks.send_password_reset_email': {'queue': 'email'},
    'authentication.tasks.send_organization_invitation': {'queue': 'email'},
    'authentication.tasks.send_project_notification': {'queue': 'email'},
}

# Task rate limiting
app.conf.task_annotations = {
    'authentication.tasks.send_email_task': {'rate_limit': '50/m'},
    'authentication.tasks.send_activation_email': {'rate_limit': '20/m'},
    'authentication.tasks.send_password_reset_email': {'rate_limit': '10/m'},
}

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')

# Celery Beat Schedule for periodic tasks
app.conf.beat_schedule = {
    'cleanup-expired-tokens': {
        'task': 'authentication.tasks.cleanup_expired_tokens',
        'schedule': 3600.0,  # Run every hour
    },
    'cleanup-failed-login-attempts': {
        'task': 'authentication.tasks.cleanup_failed_attempts',
        'schedule': 86400.0,  # Run daily
    },
    'cleanup-expired-invitations': {
        'task': 'authentication.tasks.cleanup_expired_invitations',
        'schedule': 3600.0,  # Run every hour
    },
}