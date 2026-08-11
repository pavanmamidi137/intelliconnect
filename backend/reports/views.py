from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin
from rest_framework.viewsets import GenericViewSet

from config.exceptions import NotFoundError, StorageError

from .models import MeetingReport
from .serializers import MeetingReportSerializer


class ReportViewSet(ListModelMixin, RetrieveModelMixin, GenericViewSet):
    serializer_class = MeetingReportSerializer
    queryset = MeetingReport.objects.none()
    lookup_field = "id"

    def get_queryset(self):
        user = self.request.user
        if user.organization_id is None:
            return MeetingReport.objects.none()
        return MeetingReport.objects.filter(
            meeting__organization=user.organization
        ).select_related("meeting")

    def get_object(self):
        obj = super().get_object()
        if obj.meeting.organization_id != self.request.user.organization_id:
            from rest_framework.exceptions import NotFound

            raise NotFound("You don't have permission to access this report.")
        return obj


class ReportDownloadView(APIView):
    """Return a signed/fetchable URL for a report's PDF."""

    def get(self, request, id):
        report = MeetingReport.objects.filter(id=id).first()
        if report is None:
            raise NotFoundError("Report not found.")
        if report.meeting.organization_id != request.user.organization_id:
            raise NotFoundError("You don't have permission to access this report.")
        if report.status != MeetingReport.Status.READY or not report.file_path:
            raise NotFoundError("This report isn't ready yet.")

        from storage import get_storage

        try:
            url = get_storage().url(report.file_path)
        except StorageError:
            raise
        filename = f"IntelliConnect-{report.meeting.title}.pdf"
        return Response({"url": url, "filename": filename})
