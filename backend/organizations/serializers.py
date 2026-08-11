from rest_framework import serializers

from meetings.models import Meeting
from tasks.models import Task

from .models import Organization


class OrganizationSerializer(serializers.ModelSerializer):
    people_count = serializers.SerializerMethodField()
    meetings_count = serializers.SerializerMethodField()
    completed_meetings = serializers.SerializerMethodField()
    open_tasks = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = [
            "id", "name", "organization_type", "description", "website",
            "created_at", "people_count", "meetings_count",
            "completed_meetings", "open_tasks",
        ]
        read_only_fields = ["id", "created_at"]

    def get_people_count(self, obj):
        return obj.people.count()

    def get_meetings_count(self, obj):
        return obj.meetings.count()

    def get_completed_meetings(self, obj):
        return obj.meetings.filter(status=Meeting.Status.COMPLETED).count()

    def get_open_tasks(self, obj):
        return (
            Task.objects.filter(
                meeting__organization=obj,
                status__in=[Task.Status.PENDING, Task.Status.IN_PROGRESS],
            ).count()
        )
