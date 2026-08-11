from rest_framework import serializers

from tasks.models import Task

from .models import Person


class PersonSerializer(serializers.ModelSerializer):
    meetings_count = serializers.SerializerMethodField()
    tasks_count = serializers.SerializerMethodField()
    completed_tasks = serializers.SerializerMethodField()
    pending_tasks = serializers.SerializerMethodField()

    class Meta:
        model = Person
        fields = [
            "id", "full_name", "user_name", "teams", "email", "department",
            "designation", "additional_info", "is_active", "created_at",
            "meetings_count", "tasks_count", "completed_tasks", "pending_tasks",
        ]
        read_only_fields = ["id", "created_at", "meetings_count", "tasks_count",
                            "completed_tasks", "pending_tasks"]

    def get_meetings_count(self, obj):
        return obj.meeting_links.count()

    def get_tasks_count(self, obj):
        return obj.tasks.count()

    def get_completed_tasks(self, obj):
        return obj.tasks.filter(status=Task.Status.COMPLETED).count()

    def get_pending_tasks(self, obj):
        return obj.tasks.filter(
            status__in=[Task.Status.PENDING, Task.Status.IN_PROGRESS]
        ).count()


class PersonDetailSerializer(PersonSerializer):
    """Person profile payload: attributes plus history aggregates."""

    meeting_history = serializers.SerializerMethodField()
    assigned_tasks = serializers.SerializerMethodField()

    class Meta(PersonSerializer.Meta):
        fields = PersonSerializer.Meta.fields + ["meeting_history", "assigned_tasks"]

    def get_meeting_history(self, obj):
        from meetings.models import Meeting
        from meetings.serializers import MeetingListSerializer

        meetings = Meeting.objects.filter(
            participant_links__person=obj,
            organization=obj.organization,
        ).distinct()
        return MeetingListSerializer(meetings[:20], many=True).data

    def get_assigned_tasks(self, obj):
        tasks = Task.objects.filter(person=obj).select_related("meeting")[:50]
        return [
            {
                "id": task.id,
                "task": task.task,
                "deadline": task.deadline,
                "priority": task.priority,
                "status": task.status,
                "meeting_id": task.meeting_id,
                "meeting_title": task.meeting.title,
                "ai_confidence": task.ai_confidence,
            }
            for task in tasks
        ]
