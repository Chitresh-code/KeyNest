"""
Celery tasks for authentication-related email sending.
"""

import logging
from typing import Dict, List, Optional
from celery import shared_task
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

logger = logging.getLogger(__name__)
User = get_user_model()


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_email_task(self, subject: str, message: str, from_email: str, 
                    recipient_list: List[str], html_message: str = None):
    """
    Generic email sending task with retry logic.
    """
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=from_email or settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipient_list,
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Email sent successfully to {recipient_list}")
        return f"Email sent to {len(recipient_list)} recipients"
        
    except Exception as exc:
        logger.error(f"Failed to send email to {recipient_list}: {str(exc)}")
        if self.request.retries < self.max_retries:
            logger.info(f"Retrying email send (attempt {self.request.retries + 1})")
            raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))
        else:
            logger.error(f"Email sending failed after {self.max_retries} retries")
            raise exc


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_html_email_task(self, subject: str, template_name: str, context: Dict,
                        recipient_email: str, from_email: str = None):
    """
    Send HTML email using Django templates with retry logic.
    """
    try:
        # Render HTML content
        html_content = render_to_string(template_name, context)
        
        # Create text version (basic fallback)
        text_content = f"""
        {subject}
        
        This is an HTML email. Please enable HTML viewing in your email client.
        
        If you cannot view this email properly, please visit: {context.get('site_url', settings.SITE_URL)}
        
        Best regards,
        The {settings.SITE_NAME} Team
        """
        
        # Create email message
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email or settings.DEFAULT_FROM_EMAIL,
            to=[recipient_email],
        )
        email.attach_alternative(html_content, "text/html")
        
        # Send email
        email.send()
        
        logger.info(f"HTML email sent successfully to {recipient_email}")
        return f"HTML email sent to {recipient_email}"
        
    except Exception as exc:
        logger.error(f"Failed to send HTML email to {recipient_email}: {str(exc)}")
        if self.request.retries < self.max_retries:
            logger.info(f"Retrying HTML email send (attempt {self.request.retries + 1})")
            raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))
        else:
            logger.error(f"HTML email sending failed after {self.max_retries} retries")
            raise exc


@shared_task
def send_activation_email(user_id: int, activation_token: str, activation_uid: str):
    """
    Send account activation email to user.
    """
    try:
        user = User.objects.get(id=user_id)
        
        context = {
            'user': user,
            'site_name': settings.SITE_NAME,
            'site_url': settings.FRONTEND_URL,
            'activation_url': f"{settings.FRONTEND_URL}/{settings.ACTIVATION_URL.format(uid=activation_uid, token=activation_token)}",
            'token': activation_token,
            'uid': activation_uid,
        }
        
        return send_html_email_task.delay(
            subject=f"Activate Your {settings.SITE_NAME} Account",
            template_name='authentication/activation_email.html',
            context=context,
            recipient_email=user.email,
        )
        
    except User.DoesNotExist:
        logger.error(f"User with ID {user_id} not found for activation email")
        return "User not found"
    except Exception as exc:
        logger.error(f"Error sending activation email for user {user_id}: {str(exc)}")
        raise exc


@shared_task
def send_password_reset_email(user_id: int, reset_token: str, reset_uid: str):
    """
    Send password reset email to user.
    """
    try:
        user = User.objects.get(id=user_id)
        
        context = {
            'user': user,
            'site_name': settings.SITE_NAME,
            'site_url': settings.FRONTEND_URL,
            'reset_url': f"{settings.FRONTEND_URL}/{settings.PASSWORD_RESET_URL.format(uid=reset_uid, token=reset_token)}",
            'token': reset_token,
            'uid': reset_uid,
        }
        
        return send_html_email_task.delay(
            subject=f"Reset Your {settings.SITE_NAME} Password",
            template_name='authentication/password_reset_email.html',
            context=context,
            recipient_email=user.email,
        )
        
    except User.DoesNotExist:
        logger.error(f"User with ID {user_id} not found for password reset email")
        return "User not found"
    except Exception as exc:
        logger.error(f"Error sending password reset email for user {user_id}: {str(exc)}")
        raise exc


@shared_task
def send_organization_invitation(inviter_id: int, invitee_email: str, 
                                organization_name: str, invitation_token: str):
    """
    Send organization invitation email.
    """
    try:
        inviter = User.objects.get(id=inviter_id)
        
        context = {
            'inviter': inviter,
            'invitee_email': invitee_email,
            'organization_name': organization_name,
            'site_name': settings.SITE_NAME,
            'site_url': settings.FRONTEND_URL,
            'invitation_url': f"{settings.FRONTEND_URL}/invite/accept/{invitation_token}",
            'token': invitation_token,
        }
        
        return send_html_email_task.delay(
            subject=f"You're Invited to Join {organization_name} on {settings.SITE_NAME}",
            template_name='authentication/organization_invitation.html',
            context=context,
            recipient_email=invitee_email,
        )
        
    except User.DoesNotExist:
        logger.error(f"Inviter with ID {inviter_id} not found")
        return "Inviter not found"
    except Exception as exc:
        logger.error(f"Error sending organization invitation: {str(exc)}")
        raise exc


@shared_task
def send_project_notification(user_id: int, project_name: str, 
                             notification_type: str, message: str):
    """
    Send project-related notification email.
    """
    try:
        user = User.objects.get(id=user_id)
        
        context = {
            'user': user,
            'project_name': project_name,
            'notification_type': notification_type,
            'message': message,
            'site_name': settings.SITE_NAME,
            'site_url': settings.FRONTEND_URL,
        }
        
        subject_map = {
            'created': f"New Project Created: {project_name}",
            'updated': f"Project Updated: {project_name}",
            'deleted': f"Project Deleted: {project_name}",
            'member_added': f"Added to Project: {project_name}",
            'member_removed': f"Removed from Project: {project_name}",
        }
        
        return send_html_email_task.delay(
            subject=subject_map.get(notification_type, f"Project Notification: {project_name}"),
            template_name='authentication/project_notification.html',
            context=context,
            recipient_email=user.email,
        )
        
    except User.DoesNotExist:
        logger.error(f"User with ID {user_id} not found for project notification")
        return "User not found"
    except Exception as exc:
        logger.error(f"Error sending project notification: {str(exc)}")
        raise exc


@shared_task
def send_welcome_email(user_id: int):
    """
    Send welcome email after account activation.
    """
    try:
        user = User.objects.get(id=user_id)
        
        context = {
            'user': user,
            'site_name': settings.SITE_NAME,
            'site_url': settings.FRONTEND_URL,
            'dashboard_url': f"{settings.FRONTEND_URL}/dashboard",
        }
        
        return send_html_email_task.delay(
            subject=f"Welcome to {settings.SITE_NAME}!",
            template_name='authentication/welcome_email.html',
            context=context,
            recipient_email=user.email,
        )
        
    except User.DoesNotExist:
        logger.error(f"User with ID {user_id} not found for welcome email")
        return "User not found"
    except Exception as exc:
        logger.error(f"Error sending welcome email: {str(exc)}")
        raise exc


@shared_task
def cleanup_expired_tokens():
    """
    Periodic task to clean up expired JWT tokens and user activations.
    """
    try:
        from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
        
        # Clean up expired tokens (older than 7 days)
        cutoff_date = timezone.now() - timedelta(days=7)
        expired_count = OutstandingToken.objects.filter(
            created_at__lt=cutoff_date
        ).delete()[0]
        
        logger.info(f"Cleaned up {expired_count} expired JWT tokens")
        return f"Cleaned up {expired_count} expired tokens"
        
    except Exception as exc:
        logger.error(f"Error cleaning up expired tokens: {str(exc)}")
        raise exc


@shared_task
def cleanup_failed_attempts():
    """
    Periodic task to clean up old failed login attempts.
    """
    try:
        from axes.models import AccessAttempt
        
        # Clean up attempts older than 30 days
        cutoff_date = timezone.now() - timedelta(days=30)
        deleted_count = AccessAttempt.objects.filter(
            attempt_time__lt=cutoff_date
        ).delete()[0]
        
        logger.info(f"Cleaned up {deleted_count} old failed login attempts")
        return f"Cleaned up {deleted_count} failed attempts"
        
    except Exception as exc:
        logger.error(f"Error cleaning up failed attempts: {str(exc)}")
        raise exc


@shared_task
def cleanup_expired_invitations():
    """
    Periodic task to clean up expired organization invitations.
    """
    try:
        from core.models import OrganizationInvitation
        
        # Mark expired invitations
        cutoff_date = timezone.now()
        expired_count = OrganizationInvitation.objects.filter(
            expires_at__lt=cutoff_date,
            status='pending'
        ).update(status='expired')
        
        # Clean up old invitations (older than 30 days)
        old_cutoff_date = timezone.now() - timedelta(days=30)
        deleted_count = OrganizationInvitation.objects.filter(
            created_at__lt=old_cutoff_date,
            status__in=['expired', 'cancelled', 'accepted']
        ).delete()[0]
        
        logger.info(f"Expired {expired_count} invitations, cleaned up {deleted_count} old invitations")
        return f"Expired {expired_count} invitations, cleaned up {deleted_count} old invitations"
        
    except Exception as exc:
        logger.error(f"Error cleaning up invitations: {str(exc)}")
        raise exc