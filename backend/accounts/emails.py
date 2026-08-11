"""Transactional email helpers for authentication.

Email is optional: when SMTP credentials are configured in the backend
environment (EMAIL_HOST, EMAIL_PORT, ...), real emails are sent. Without
them, codes are logged so local development can still complete the flow
(the views return the code in dev mode).
"""

import logging

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger("intelliconnect")


def email_configured() -> bool:
    return bool(settings.EMAIL_HOST and settings.EMAIL_PORT)


def send_login_otp(email: str, code: str) -> bool:
    """Send a 6-digit login verification code. Returns True when emailed."""
    subject = "Your IntelliConnect login code"
    message = (
        f"Your IntelliConnect verification code is: {code}\n\n"
        "This code expires in 10 minutes. If you didn't request it, "
        "you can safely ignore this email."
    )
    if email_configured():
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
        logger.info("Sent login OTP to %s", email)
        return True
    logger.info("Login OTP for %s: %s (no email backend configured)", email, code)
    return False
