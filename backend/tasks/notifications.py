"""Task assignment emails.

A task email is sent when an assignee is newly attached or confirmed.
Two transports are supported, chosen at send time:

  * SMTP (setting.EMAIL_HOST set) — works without owning a domain (e.g.
    Gmail + App Password), so email reaches any recipient today.
  * Resend (RESEND_API_KEY set) — used otherwise; the default
    onboarding@resend.dev sender only reaches the account owner's inbox
    until a domain is added and verified.

Sending is best-effort: provider failures are logged and never block the
task workflow.
"""

import base64
import logging
from pathlib import Path

from django.conf import settings
from django.utils import timezone

logger = logging.getLogger("intelliconnect")

from .models import Task  # noqa: E402


def _render_html(task) -> str:
    meeting = task.meeting
    person = task.person

    deadline = task.deadline
    if deadline:
        try:
            deadline = deadline.strftime("%A, %d %B %Y")
        except (ValueError, AttributeError):
            deadline = str(deadline)

    priority_labels = {
        "high": "High",
        "medium": "Medium",
        "low": "Low",
    }
    status_labels = {
        "pending": "Pending",
        "in_progress": "In Progress",
        "completed": "Completed",
    }

    rows = [
        ("Assignee", person.full_name),
        ("Priority", priority_labels.get(task.priority, task.priority.title())),
        ("Deadline", deadline or "Not set"),
        ("Status", status_labels.get(task.status, task.status.title())),
    ]

    details = "".join(
        f'<tr><td style="padding:6px 0;color:#64748b;font-size:13px;">{label}</td>'
        f'<td style="padding:6px 0;color:#0f172a;font-size:13px;font-weight:600;">{value}</td></tr>'
        for label, value in rows
    )

    context_html = ""
    if task.context:
        context_html = (
            '<div style="margin-top:16px;padding:12px 14px;background:#f1f5f9;border-radius:8px;'
            'font-size:13px;color:#334155;">'
            f"<strong>Context:</strong> {task.context}</div>"
        )

    return f"""\
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f8fafc;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="background:#ffffff;border-radius:12px;padding:28px 32px;border:1px solid #e2e8f0;">
      <div style="font-size:15px;font-weight:700;color:#2563eb;letter-spacing:.5px;">
        IntelliConnect
      </div>
      <h2 style="color:#0f172a;font-size:20px;margin:18px 0 6px;">You have a new task</h2>
      <p style="color:#475569;font-size:14px;margin:0 0 18px;">
        from the meeting &ldquo;<strong>{meeting.title}</strong>&rdquo;
      </p>
      <div style="padding:14px 16px;background:#eff6ff;border-radius:8px;border-left:4px solid #2563eb;">
        <p style="margin:0;color:#0f172a;font-size:16px;font-weight:600;">{task.task}</p>
      </div>
      <table style="width:100%;margin-top:14px;border-collapse:collapse;">{details}</table>
      {context_html}
      <p style="color:#94a3b8;font-size:12px;margin-top:24px;">
        Sent by IntelliConnect · {timezone.now().strftime("%d %b %Y, %H:%M")}
      </p>
    </div>
  </div>
</body>
</html>"""


def _report_pdf_attachment(task):
    """Return (filename, bytes) for the meeting's report PDF if it exists.

    The PDF is generated on confirmation (or re-analysis), so attachment is
    opportunistic: when the report is ready the assignee gets it alongside
    the task email; otherwise the email still goes out without it.
    """
    meeting = task.meeting
    pdf_path = getattr(meeting, "pdf_path", "") or ""
    if not pdf_path:
        return None
    try:
        from storage.backends import get_storage

        content = get_storage().read(pdf_path)
        if not content:
            return None
        filename = Path(pdf_path).name or f"{meeting.title}-report.pdf"
        return filename, content
    except Exception as exc:  # noqa: BLE001 - attachment must never block the send
        logger.warning("Could not read report PDF %s for attachment: %s", pdf_path, exc)
        return None


def _mark_delivered(task):
    """Record a reliable delivery so confirm/re-analysis won't re-send."""
    now = timezone.now()
    task.email_status = Task.EmailStatus.DELIVERED
    task.email_sent_at = now
    task.email_error = ""
    task.notified_at = now
    task.save(
        update_fields=["email_status", "email_sent_at", "email_error", "notified_at", "updated_at"]
    )


def _mark_failed(task, error: str):
    """Record a failed attempt so the UI can show a Retry action."""
    task.email_status = Task.EmailStatus.FAILED
    task.email_sent_at = None
    task.email_error = (error or "")[:500]
    task.save(update_fields=["email_status", "email_sent_at", "email_error", "updated_at"])


def send_task_notification(
    task, previous_person_id=None, previous_confidence=None
) -> bool:
    """Send an assignment email when appropriate. Returns True if an email was sent.

    Rules:
      - Skipped when no transport is configured or the assignee has no email.
      - Skipped when the assignee is unchanged AND a reliable email already
        went out (task.notified_at set by SMTP or a domain Resend sender).
      - Sent on first assignment, on a changed assignee, and when a pending
        (below-threshold) assignment is confirmed by the host.
      - Sent again on host confirmation for 'already assigned' tasks whose
        earlier email could not be delivered to the assignee (e.g. sent via
        Resend's onboarding@resend.dev default, which only reaches the
        account owner's inbox).
    """
    if not settings.EMAIL_HOST and not settings.RESEND_ENABLED:
        return False
    person = task.person
    if person is None or not person.email:
        return False

    same_assignee = (
        previous_person_id is not None and str(previous_person_id) == str(person.id)
    )
    if same_assignee and task.notified_at is not None:
        # A reliable email already reached this assignee; don't re-send.
        return False

    try:
        subject = f"New task: {task.task[:80]}"
        if settings.EMAIL_HOST:
            # SMTP transport (Gmail App Password etc.) — no domain needed.
            from django.core.mail import EmailMultiAlternatives

            person_name = person.full_name
            deadline = task.deadline
            if deadline:
                try:
                    deadline = deadline.strftime("%A, %d %B %Y")
                except (ValueError, AttributeError):
                    deadline = str(deadline)
            plain = (
                f"Hi {person_name},\n\n"
                f"You have a new task from the meeting \"{task.meeting.title}\":\n\n"
                f"  {task.task}\n"
                f"  Priority: {task.priority}  ·  Deadline: {deadline or 'Not set'}\n\n"
                f"Sign in to IntelliConnect to view details.\n"
            )
            email = EmailMultiAlternatives(
                subject=subject,
                body=plain,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[person.email],
            )
            email.attach_alternative(_render_html(task), "text/html")
            attachment = _report_pdf_attachment(task)
            if attachment is not None:
                filename, content = attachment
                email.attach(filename=filename, content=content, mimetype="application/pdf")
            email.send(fail_silently=False)
            _mark_delivered(task)
            logger.info(
                "Task notification sent to %s (task %s, pdf=%s) via SMTP.",
                person.email,
                task.id,
                getattr(task.meeting, "pdf_path", "") or "",
            )
            return True

        import resend

        resend.api_key = settings.RESEND_API_KEY
        from_addr = settings.RESEND_FROM.strip()
        from_addr = from_addr or "IntelliConnect <onboarding@resend.dev>"

        payload = {
            "from": from_addr,
            "to": [person.email],
            "subject": subject,
            "html": _render_html(task),
        }
        attachment = _report_pdf_attachment(task)
        if attachment is not None:
            filename, content = attachment
            payload["attachments"] = [
                {
                    "filename": filename,
                    "content": base64.b64encode(content).decode("ascii"),
                }
            ]
        response = resend.Emails.send(payload)
        task_id = response.get("id") if isinstance(response, dict) else getattr(response, "id", "")
        # Resend's sandbox sender (onboarding@resend.dev) only reaches the
        # account owner's inbox — don't record it as a reliable delivery so
        # host confirmation can re-send through a working channel.
        if "resend.dev" not in settings.RESEND_FROM.lower():
            _mark_delivered(task)
        else:
            task.email_error = "Resend default sender only reaches the owner's inbox."
            task.save(update_fields=["email_error", "updated_at"])
        logger.info(
            "Task notification sent to %s (task %s, email %s) via Resend (sender %s).",
            person.email,
            task.id,
            task_id,
            from_addr,
        )
        return True
    except Exception as exc:  # noqa: BLE001 - never break the task workflow
        logger.warning(
            "Could not send task notification to %s: %s", person.email, exc
        )
        _mark_failed(task, str(exc))
        return False