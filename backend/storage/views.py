"""Serve locally-stored files with authorization checks.

Only relevant for the local development storage backend. Production uses
Supabase signed URLs, so this view is never exposed there.
"""

from django.conf import settings
from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from meetings.models import Meeting
from reports.models import MeetingReport


class LocalFileView(APIView):
    """Authenticated download endpoint for files on local storage.

    Access is limited to members of the organization that owns the file.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, path):
        if settings.STORAGE_BACKEND == "supabase":
            raise Http404

        meeting = None
        report = None
        if Meeting.objects.filter(transcript_path=path).exists():
            meeting = Meeting.objects.filter(transcript_path=path).first()
        elif Meeting.objects.filter(audio_path=path).exists():
            meeting = Meeting.objects.filter(audio_path=path).first()
        elif Meeting.objects.filter(pdf_path=path).exists():
            meeting = Meeting.objects.filter(pdf_path=path).first()
        else:
            report = MeetingReport.objects.filter(file_path=path).first()
            meeting = report.meeting if report else None

        if meeting is None or meeting.organization_id != request.user.organization_id:
            raise Http404

        if report is not None and report.meeting_id != meeting.id:
            raise Http404

        from storage.backends import LocalStorageBackend

        backend = LocalStorageBackend(root=settings.MEDIA_ROOT)
        target = backend._resolve(path)
        if not target.exists():
            raise Http404
        return FileResponse(
            open(target, "rb"),
            content_type=self._guess_content_type(path),
            filename=target.name,
        )

    def _guess_content_type(self, path):
        from pathlib import Path

        return {
            ".pdf": "application/pdf",
            ".txt": "text/plain",
            ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".mp3": "audio/mpeg",
            ".wav": "audio/wav",
            ".m4a": "audio/mp4",
            ".srt": "text/plain",
            ".vtt": "text/vtt",
        }.get(Path(path).suffix.lower(), "application/octet-stream")


local_file = LocalFileView.as_view()
