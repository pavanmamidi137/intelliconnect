import json

from django.conf import settings
from rest_framework import serializers

from config.exceptions import FileValidationError
from people.models import Person
from reports.models import MeetingReport
from storage import get_storage
from storage.paths import meeting_audio_path, meeting_transcript_path
from tasks.models import Task
from tasks.serializers import TaskReviewSerializer, TaskSerializer

from .models import (
    Decision,
    KeyPoint,
    Meeting,
    MeetingParticipant,
    MeetingSummary,
    PersonMention,
)
from .transcripts import is_supported_transcript


class ParticipantPersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Person
        fields = ["id", "full_name", "email", "department", "designation"]


class MeetingListSerializer(serializers.ModelSerializer):
    host_name = serializers.CharField(source="host.full_name", read_only=True)
    participants_count = serializers.SerializerMethodField()
    participants = serializers.SerializerMethodField()
    tasks_count = serializers.SerializerMethodField()
    decisions_count = serializers.SerializerMethodField()
    has_pdf = serializers.SerializerMethodField()

    class Meta:
        model = Meeting
        fields = [
            "id", "title", "meeting_date", "meeting_type", "status",
            "created_at", "host_name", "participants_count", "participants",
            "tasks_count", "decisions_count", "has_pdf",
        ]

    def get_participants_count(self, obj):
        return obj.participant_links.count()

    def get_participants(self, obj):
        return [
            {
                "id": link.person_id,
                "full_name": link.person.full_name,
                "department": link.person.department,
            }
            for link in obj.participant_links.select_related("person")[:12]
        ]

    def get_tasks_count(self, obj):
        return obj.tasks.count()

    def get_decisions_count(self, obj):
        return obj.decisions.count()

    def get_has_pdf(self, obj):
        return bool(obj.pdf_path)


class MeetingCreateSerializer(serializers.ModelSerializer):
    # Sent as a JSON-encoded string in multipart form data.
    participant_ids = serializers.JSONField(required=False, write_only=True)
    # Transcript and audio are both optional — a meeting can be created as a
    # draft without files, or with a transcript and/or audio recording.
    # AI analysis needs a transcript; the process endpoint enforces that.
    transcript = serializers.FileField(required=False, write_only=True)
    # Paste-in transcript text — stored as a TXT transcript so pasted
    # meetings are analyzed exactly like file uploads.
    transcript_text = serializers.CharField(
        required=False, write_only=True, allow_blank=True, trim_whitespace=False
    )
    audio = serializers.FileField(required=False, write_only=True)

    class Meta:
        model = Meeting
        fields = [
            "id", "title", "meeting_date", "meeting_type", "notes",
            "participant_ids", "transcript", "transcript_text", "audio",
        ]

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError("Meeting title is required.")
        return value.strip()

    def validate_transcript(self, file):
        if file.size > settings.MAX_TRANSCRIPT_SIZE:
            raise serializers.ValidationError(
                f"Transcript files must be smaller than {settings.MAX_TRANSCRIPT_SIZE_MB} MB."
            )
        if not is_supported_transcript(file.name):
            raise serializers.ValidationError(
                "This file type isn't supported. Upload a TXT, PDF, DOCX, SRT, or VTT transcript."
            )
        return file

    def validate_audio(self, file):
        if file.size > settings.MAX_AUDIO_SIZE:
            raise serializers.ValidationError(
                f"Audio files must be smaller than {settings.MAX_AUDIO_SIZE_MB} MB."
            )
        ext = file.name.rsplit(".", 1)[-1].lower() if "." in file.name else ""
        if f".{ext}" not in settings.ALLOWED_AUDIO_EXTENSIONS:
            raise serializers.ValidationError(
                "This audio type isn't supported. Upload an MP3, WAV, or M4A file."
            )
        return file

    def validate_participant_ids(self, value):
        if not value:
            return []
        if not isinstance(value, list):
            raise serializers.ValidationError("participant_ids must be a list.")
        value = [str(v) for v in value]
        request = self.context.get("request")
        org = request.user.organization if request else None
        if org is None:
            raise serializers.ValidationError("Organization not found.")
        people = Person.objects.filter(id__in=value, organization=org)
        if people.count() != len(set(value)):
            raise serializers.ValidationError(
                "One or more participants don't belong to your organization."
            )
        return list(people.values_list("id", flat=True))

    def validate_transcript_text(self, value):
        value = value or ""
        if len(value) > 200_000:
            raise serializers.ValidationError(
                "Pasted transcript is too long — keep it under 200,000 characters."
            )
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if attrs.get("transcript") is not None and attrs.get("transcript_text", "").strip():
            raise serializers.ValidationError(
                {"transcript_text": "Upload a transcript file OR paste text — not both."}
            )
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        participant_ids = validated_data.pop("participant_ids", [])
        transcript_file = validated_data.pop("transcript", None)
        transcript_text = validated_data.pop("transcript_text", "") or ""
        audio_file = validated_data.pop("audio", None)

        meeting = Meeting.objects.create(
            organization=request.user.organization,
            host=request.user,
            **validated_data,
        )

        # Persist files first; on failure the meeting is cleaned up so no
        # orphaned records remain.
        storage = get_storage()
        try:
            if transcript_file is not None:
                meeting.transcript_path = storage.save(
                    meeting_transcript_path(request.user.organization_id, meeting.id, transcript_file.name),
                    transcript_file.read(),
                )
                meeting.transcript_filename = transcript_file.name
            elif transcript_text.strip():
                # Pasted text is stored as a real TXT transcript so the rest
                # of the pipeline (analysis, transcript view, PDF) works
                # exactly as it does for uploaded files.
                meeting.transcript_path = storage.save(
                    meeting_transcript_path(request.user.organization_id, meeting.id, "transcript.txt"),
                    transcript_text.encode("utf-8"),
                )
                meeting.transcript_filename = "transcript.txt"
            if audio_file:
                meeting.audio_path = storage.save(
                    meeting_audio_path(request.user.organization_id, meeting.id, audio_file.name),
                    audio_file.read(),
                )
                meeting.audio_filename = audio_file.name
            meeting.save()
        except Exception as exc:
            meeting.delete()
            if isinstance(exc, FileValidationError):
                raise
            raise FileValidationError("We couldn't store your files. Please try again.") from exc

        for person_id in participant_ids:
            MeetingParticipant.objects.create(meeting=meeting, person_id=person_id)

        return meeting


class KeyPointSerializer(serializers.ModelSerializer):
    class Meta:
        model = KeyPoint
        fields = ["id", "content", "order"]


class DecisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Decision
        fields = ["id", "content"]


class PersonMentionSerializer(serializers.ModelSerializer):
    person_name = serializers.CharField(source="person.full_name", read_only=True, default="")
    department = serializers.CharField(source="person.department", read_only=True, default="")

    class Meta:
        model = PersonMention
        fields = ["id", "full_name", "person", "person_name", "department",
                  "confidence", "context"]


class MeetingSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = MeetingSummary
        fields = ["id", "summary", "paragraph_summary"]


class ReportMetaSerializer(serializers.ModelSerializer):
    class Meta:
        model = MeetingReport
        fields = ["id", "status", "generated_at", "file_path"]


class MeetingDetailSerializer(serializers.ModelSerializer):
    host_name = serializers.CharField(source="host.full_name", read_only=True)
    host_email = serializers.CharField(source="host.email", read_only=True)
    participants = serializers.SerializerMethodField()
    summary = MeetingSummarySerializer(read_only=True)
    key_points = KeyPointSerializer(many=True, read_only=True)
    decisions = DecisionSerializer(many=True, read_only=True)
    tasks = TaskReviewSerializer(many=True, read_only=True)
    mentions = PersonMentionSerializer(many=True, read_only=True)
    reports = ReportMetaSerializer(many=True, read_only=True)
    transcript_name = serializers.CharField(source="transcript_filename", read_only=True)
    audio_name = serializers.CharField(source="audio_filename", read_only=True)
    has_pdf = serializers.SerializerMethodField()

    class Meta:
        model = Meeting
        fields = [
            "id", "title", "meeting_date", "meeting_type", "status", "notes",
            "host", "host_name", "host_email", "organization",
            "participants", "summary", "key_points", "decisions", "tasks",
            "mentions", "reports", "transcript_name", "audio_name",
            "processing_stage", "processed_at", "created_at", "has_pdf",
        ]

    def get_participants(self, obj):
        return ParticipantPersonSerializer(
            [link.person for link in obj.participant_links.select_related("person")],
            many=True,
        ).data

    def get_has_pdf(self, obj):
        return bool(obj.pdf_path)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        tasks_data = data.pop("tasks", [])
        data["unresolved_tasks_count"] = sum(
            1 for t in tasks_data if t.get("needs_confirmation")
        )
        data["tasks"] = tasks_data
        return data
