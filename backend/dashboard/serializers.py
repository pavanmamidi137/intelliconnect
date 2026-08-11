from django.contrib.auth import get_user_model
from rest_framework import serializers

from organizations.models import Organization
from tasks.models import Task

User = get_user_model()


class RecentTaskSerializer(serializers.ModelSerializer):
    person_name = serializers.CharField(source="person.full_name", read_only=True, default="")
    department = serializers.CharField(source="person.department", read_only=True, default="")
    meeting_id = serializers.UUIDField(source="meeting.id", read_only=True)
    meeting_title = serializers.CharField(source="meeting.title", read_only=True)

    class Meta:
        model = Task
        fields = [
            "id", "task", "status", "deadline", "priority", "ai_confidence",
            "meeting_id", "meeting_title", "person_name", "department",
        ]


class AdminOrganizationListSerializer(serializers.ModelSerializer):
    """Organization row for the platform admin dashboard.

    Counts are annotated on the queryset (members/people/meetings/tasks) so
    the list stays a single query rather than N+1.
    """

    members_count = serializers.IntegerField(read_only=True)
    people_count = serializers.IntegerField(read_only=True)
    meetings_count = serializers.IntegerField(read_only=True)
    completed_meetings = serializers.IntegerField(read_only=True)
    open_tasks = serializers.IntegerField(read_only=True)

    class Meta:
        model = Organization
        fields = [
            "id", "name", "organization_type", "created_at",
            "members_count", "people_count", "meetings_count",
            "completed_meetings", "open_tasks",
        ]


class AdminUserListSerializer(serializers.ModelSerializer):
    organization = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "full_name", "email", "role", "designation", "department",
            "is_active", "organization", "created_at",
        ]

    def get_organization(self, obj):
        if not obj.organization_id:
            return None
        return {"id": str(obj.organization_id), "name": obj.organization.name}
