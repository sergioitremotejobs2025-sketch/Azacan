from celery import shared_task
from django.core.mail import send_mail
import logging

logger = logging.getLogger(__name__)

@shared_task
def send_email_task(subject, message, recipient_list, from_email=None):
    """
    Asynchronous task to send an email.
    """
    try:
        send_mail(subject, message, from_email, recipient_list)
        logger.info(f"Email '{subject}' sent successfully to {recipient_list}")
        return f"Sent email to {len(recipient_list)} recipients"
    except Exception as e:
        logger.error(f"Failed to send email '{subject}': {e}")
        return f"Failed: {e}"
