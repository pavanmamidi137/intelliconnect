import uuid

from django.db import models


class Task(models.Model):
    class Priority(models.TextChoices):
        HIGH = "high", "High"
        MEDIUM = "medium", "Medium"
        LOW = "low", "Low"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"

    class Source(models.TextChoices):
        AI = "ai", "AI"
        MANUAL = "manual", "Manual"

    class EmailStatus(models.TextChoices):
        # No reliable email sent yet (not assigned, awaiting confirmation,
        # or previous attempts did not reach the assignee).
        PENDING = "pending", "Pending"
        # Email accepted by the mail server and queued for the assignee.
        DELIVERED = "delivered", "Delivered"
        # The send attempt raised (invalid address, relay error, ...).
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    meeting = models.ForeignKey(
        "meetings.Meeting",
        on_delete=models.CASCADE,
        related_name="tasks",
    )
    person = models.ForeignKey(
        "people.Person",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tasks",
    )
    # Raw name as extracted by AI, kept for transparency and re-matching.
    mentioned_name = models.CharField(max_length=255, blank=True, default="")
    task = models.CharField(max_length=1000)
    deadline = models.DateField(null=True, blank=True)
    priority = models.CharField(
        max_length=16,
        choices=Priority.choices,
        default=Priority.MEDIUM,
    )
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.PENDING,
    )
    ai_confidence = models.FloatField(null=True, blank=True)
    context = models.TextField(blank=True, default="")
    source = models.CharField(
        max_length=16,
        choices=Source.choices,
        default=Source.AI,
    )
    # Set when a task-notification email was delivered through a reliable
    # transport (configured SMTP, or Resend with a verified-domain sender).
    # Left null when a send "succeeded" through a channel that cannot reach
    # the assignee (e.g. Resend's onboarding@resend.dev default sender), so
    # host confirmation will re-send instead of silently skipping.
    notified_at = models.DateTimeField(null=True, blank=True)
    # Email delivery tracking for the UI (Delivered / Pending / Failed + retry).
    email_status = models.CharField(
        max_length=16,
        choices=EmailStatus.choices,
        default=EmailStatus.PENDING,
    )
    email_sent_at = models.DateTimeField(null=True, blank=True)
    email_error = models.CharField(max_length=500, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["meeting", "person"]),
            models.Index(fields=["meeting", "status"]),
        ]

    def __str__(self):
        return self.task
