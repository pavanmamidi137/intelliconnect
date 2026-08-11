import uuid

from django.conf import settings
from django.db import models


class Meeting(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PROCESSING = "processing", "Processing"
        REVIEW_REQUIRED = "review_required", "Review Required"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    class MeetingType(models.TextChoices):
        MEETING = "meeting", "Meeting"
        ONE_ON_ONE = "one_on_one", "One-on-One"
        STANDUP = "standup", "Standup"
        BRAINSTORM = "brainstorm", "Brainstorm"
        REVIEW = "review", "Review"
        CLIENT_CALL = "client_call", "Client Call"
        OTHER = "other", "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="meetings",
    )
    host = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="hosted_meetings",
    )
    title = models.CharField(max_length=255)
    meeting_date = models.DateField()
    meeting_type = models.CharField(
        max_length=32,
        choices=MeetingType.choices,
        default=MeetingType.MEETING,
    )
    notes = models.TextField(blank=True, default="")
    transcript_path = models.CharField(max_length=1024, blank=True, default="")
    transcript_filename = models.CharField(max_length=255, blank=True, default="")
    audio_path = models.CharField(max_length=1024, blank=True, default="")
    audio_filename = models.CharField(max_length=255, blank=True, default="")
    pdf_path = models.CharField(max_length=1024, blank=True, default="")
    status = models.CharField(
        max_length=32,
        choices=Status.choices,
        default=Status.DRAFT,
    )
    # Real AI pipeline stage (0-7) reported to the processing screen.
    processing_stage = models.PositiveSmallIntegerField(null=True, blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-meeting_date", "-created_at"]
        indexes = [
            models.Index(fields=["organization", "status"]),
            models.Index(fields=["organization", "meeting_date"]),
        ]

    def __str__(self):
        return self.title


class MeetingParticipant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name="participant_links")
    person = models.ForeignKey(
        "people.Person",
        on_delete=models.CASCADE,
        related_name="meeting_links",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("meeting", "person")
        ordering = ["created_at"]


class MeetingSummary(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    meeting = models.OneToOneField(Meeting, on_delete=models.CASCADE, related_name="summary")
    summary = models.TextField(blank=True, default="")
    paragraph_summary = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class KeyPoint(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name="key_points")
    content = models.TextField()
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "created_at"]


class Decision(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name="decisions")
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]


class PersonMention(models.Model):
    """A person mentioned in a meeting transcript.

    Resolved to a Person with a confidence score; unresolved mentions
    (low confidence) surface for host confirmation.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name="mentions")
    full_name = models.CharField(max_length=255)
    person = models.ForeignKey(
        "people.Person",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="mentions",
    )
    confidence = models.FloatField(null=True, blank=True)
    context = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [models.Index(fields=["meeting", "person"])]
