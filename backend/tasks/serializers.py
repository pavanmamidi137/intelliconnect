from rest_framework import serializers

from people.models import Person

from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    person_name = serializers.CharField(source="person.full_name", read_only=True, default="")
    department = serializers.CharField(source="person.department", read_only=True, default="")
    meeting_title = serializers.CharField(source="meeting.title", read_only=True, default="")
    person_id_field = serializers.UUIDField(source="person_id", write_only=True, required=False)

    class Meta:
        model = Task
        fields = [
            "id", "meeting", "person", "person_name", "department",
            "mentioned_name", "task", "deadline", "priority", "status",
            "ai_confidence", "context", "source", "created_at",
            "person_id_field", "meeting_title",
        ]
        read_only_fields = ["id", "meeting", "person", "created_at", "source"]

    def validate_person(self, value):
        """People must belong to the caller's organization."""
        request = self.context.get("request")
        if request and value is not None:
            org = request.user.organization
            if org is None or value.organization_id != org.id:
                raise serializers.ValidationError(
                    "You don't have permission to assign this person."
                )
        return value

    def validate(self, attrs):
        meeting = attrs.get("meeting") or getattr(self.instance, "meeting", None)
        request = self.context.get("request")
        if meeting is not None and request is not None:
            if meeting.organization_id != request.user.organization_id:
                raise serializers.ValidationError(
                    "You don't have permission to modify this meeting's tasks."
                )
        return attrs


class TaskReviewSerializer(serializers.ModelSerializer):
    """Full task payload used by the meeting review screen."""

    person_name = serializers.CharField(source="person.full_name", read_only=True, default="")
    department = serializers.CharField(source="person.department", read_only=True, default="")
    designation = serializers.CharField(source="person.designation", read_only=True, default="")
    needs_confirmation = serializers.SerializerMethodField()
    candidates = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            "id", "person", "person_name", "department", "designation",
            "mentioned_name", "task", "deadline", "priority", "status",
            "ai_confidence", "context", "source", "needs_confirmation", "candidates",
        ]

    def get_needs_confirmation(self, obj):
        from ai.analyzer import task_needs_confirmation

        return task_needs_confirmation(obj)

    def get_candidates(self, obj):
        """Recompute candidate matches (with confidence) at read time so
        they're always fresh and the host can see why a person was chosen."""
        request = self.context.get("request")
        if request is None or not obj.meeting_id:
            return []

        from ai.matcher import compute_confidence, find_candidates
        from meetings.models import MeetingParticipant

        candidates = find_candidates(
            request.user.organization, obj.mentioned_name or obj.task
        )
        participant_ids = set(
            MeetingParticipant.objects.filter(meeting=obj.meeting).values_list("person_id", flat=True)
        )
        return [
            {
                "id": person.id,
                "full_name": person.full_name,
                "department": person.department,
                "designation": person.designation,
                "confidence": round(
                    compute_confidence(
                        person,
                        obj.mentioned_name or obj.task,
                        context=obj.context or "",
                        participant_ids=participant_ids,
                    )[0],
                    2,
                ),
            }
            for person in candidates
        ]
