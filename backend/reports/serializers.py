from rest_framework import serializers

from meetings.models import Meeting

from .models import MeetingReport


class MeetingReportSerializer(serializers.ModelSerializer):
    meeting_title = serializers.CharField(source="meeting.title", read_only=True)
    meeting_date = serializers.DateField(source="meeting.meeting_date", read_only=True)
    tasks_count = serializers.SerializerMethodField()
    decisions_count = serializers.SerializerMethodField()
    meeting_status = serializers.CharField(source="meeting.status", read_only=True)

    class Meta:
        model = MeetingReport
        fields = [
            "id", "meeting", "meeting_title", "meeting_date", "meeting_status",
            "status", "file_path", "generated_at", "tasks_count", "decisions_count",
        ]
        read_only_fields = fields

    def get_tasks_count(self, obj):
        return obj.meeting.tasks.count()

    def get_decisions_count(self, obj):
        return obj.meeting.decisions.count()
