import logging
import threading
from datetime import date

from django.conf import settings
from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import GenericViewSet
from rest_framework.mixins import (
    CreateModelMixin,
    DestroyModelMixin,
    ListModelMixin,
    RetrieveModelMixin,
    UpdateModelMixin,
)

from config.exceptions import ApplicationError, NotFoundError, StorageError
from reports.models import MeetingReport
from storage import get_storage
from tasks.models import Task

from .jobs import analyze_meeting_job, dispatch_async, generate_report_job, run_sync_or_dispatch
from .models import (
    Decision,
    KeyPoint,
    Meeting,
    MeetingParticipant,
    MeetingSummary,
)
from .serializers import (
    MeetingCreateSerializer,
    MeetingDetailSerializer,
    MeetingListSerializer,
)

logger = logging.getLogger("intelliconnect")


class _OrganizationScoped:
    def get_queryset(self):
        user = self.request.user
        if user.organization_id is None:
            return Meeting.objects.none()
        return (
            Meeting.objects.filter(organization=user.organization)
            .select_related("host", "organization")
            .prefetch_related("participant_links__person")
        )


class MeetingViewSet(
    _OrganizationScoped,
    ListModelMixin,
    RetrieveModelMixin,
    CreateModelMixin,
    UpdateModelMixin,
    DestroyModelMixin,
    GenericViewSet,
):
    queryset = Meeting.objects.none()
    lookup_field = "id"

    def get_serializer_class(self):
        if self.action == "create":
            return MeetingCreateSerializer
        if self.action in ("retrieve", "list"):
            return MeetingListSerializer
        return MeetingListSerializer

    # ------------------------------------------------------------- list
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()

        search = request.query_params.get("search", "").strip()
        if search:
            queryset = queryset.filter(title__icontains=search)

        meeting_type = request.query_params.get("meeting_type", "").strip()
        if meeting_type:
            queryset = queryset.filter(meeting_type=meeting_type)

        status_filter = request.query_params.get("status", "").strip()
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        date_from = request.query_params.get("date_from", "").strip()
        if date_from:
            queryset = queryset.filter(meeting_date__gte=date_from)

        date_to = request.query_params.get("date_to", "").strip()
        if date_to:
            queryset = queryset.filter(meeting_date__lte=date_to)

        sort = request.query_params.get("sort", "-meeting_date")
        allowed = {
            "meeting_date": "meeting_date",
            "-meeting_date": "-meeting_date",
            "created_at": "created_at",
            "-created_at": "-created_at",
            "title": "title",
            "-title": "-title",
            "status": "status",
            "-status": "-status",
        }
        queryset = queryset.order_by(allowed.get(sort, "-meeting_date"))

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = MeetingListSerializer(page, many=True, context={"request": request})
            return self.get_paginated_response(serializer.data)
        serializer = MeetingListSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data)

    # ------------------------------------------------------------- create
    def create(self, request, *args, **kwargs):
        if request.user.organization_id is None:
            raise ApplicationError("You need an organization to create meetings.")
        serializer = MeetingCreateSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        meeting = serializer.save()
        return Response(
            MeetingDetailSerializer(meeting, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    # ------------------------------------------------------------- detail
    def retrieve(self, request, *args, **kwargs):
        meeting = self.get_object()
        return Response(
            MeetingDetailSerializer(meeting, context={"request": request}).data
        )

    def partial_update(self, request, *args, **kwargs):
        meeting = self.get_object()
        allowed = ["title", "meeting_date", "meeting_type", "notes"]
        for field in allowed:
            if field in request.data:
                setattr(meeting, field, request.data[field])
        meeting.save()
        return Response(
            MeetingDetailSerializer(meeting, context={"request": request}).data
        )

    # ------------------------------------------------------------- destroy
    def destroy(self, request, *args, **kwargs):
        meeting = self.get_object()
        storage = get_storage()
        paths = [
            meeting.transcript_path,
            meeting.audio_path,
            meeting.pdf_path,
        ] + list(meeting.reports.values_list("file_path", flat=True))
        for path in paths:
            if path:
                try:
                    storage.delete(path)
                except Exception:
                    logger.warning("Could not delete stored file %s", path)
        meeting.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeetingProcessView(APIView):
    """Start AI analysis. Returns immediately; the UI polls the meeting
    status while processing runs in the background."""

    def post(self, request, id):
        meeting = self._get_meeting(request, id)
        if meeting.status == Meeting.Status.PROCESSING:
            return Response(
                {"detail": "This meeting is already being analyzed."},
                status=status.HTTP_409_CONFLICT,
            )
        if not meeting.transcript_path:
            raise ApplicationError("This meeting has no transcript to analyze.")
        if meeting.status == Meeting.Status.COMPLETED and not request.data.get("force"):
            raise ApplicationError(
                "This meeting is already completed. Use force=true to re-analyze."
            )

        # The pipeline sets status=processing itself (its re-entry guard
        # relies on that transition), then moves to review_required.
        dispatch_async(analyze_meeting_job, meeting.id)

        return Response(
            {"detail": "Analysis started.", "status": "processing"},
            status=status.HTTP_202_ACCEPTED,
        )

    def _get_meeting(self, request, meeting_id):
        try:
            meeting = Meeting.objects.get(id=meeting_id)
        except Meeting.DoesNotExist:
            raise NotFoundError("Meeting not found.")
        if meeting.organization_id != request.user.organization_id:
            raise NotFoundError("You don't have permission to access this meeting.")
        return meeting


class MeetingStatusView(APIView):
    """Lightweight status + pipeline stage for the processing screen.

    The full detail serializer is heavy (task candidates, participant
    links, report lookups), so polling it every second adds real latency.
    This endpoint is a single cheap row read.
    """

    def get(self, request, id):
        meeting = MeetingProcessView()._get_meeting(request, id)
        return Response(
            {
                "id": str(meeting.id),
                "status": meeting.status,
                "processing_stage": meeting.processing_stage,
                "processed_at": meeting.processed_at,
            }
        )


class MeetingReviewView(APIView):
    """Full review payload: summary, key points, decisions, mentions and
    tasks including live candidate matches for unresolved names."""

    def get(self, request, id):
        meeting = MeetingProcessView()._get_meeting(request, id)
        return Response(
            MeetingDetailSerializer(meeting, context={"request": request}).data
        )


class MeetingGenerateReportView(APIView):
    """Apply host review edits, then generate and store the PDF report.

    Request body (all optional):
      title, meeting_date, notes
      summary, paragraph_summary
      key_points: [str]        — replaces all
      decisions:  [str]        — replaces all
      tasks: [{id?, person?, task?, deadline?, priority?, status?, context?}]
        — the FULL final task list. Existing tasks not present are removed;
          items without id are created as manual tasks.
    """

    def post(self, request, id):
        meeting = MeetingProcessView()._get_meeting(request, id)
        data = request.data or {}

        if "title" in data and str(data.get("title", "")).strip():
            meeting.title = str(data["title"]).strip()
        if "meeting_date" in data and data.get("meeting_date"):
            meeting.meeting_date = data["meeting_date"]
        if "notes" in data:
            meeting.notes = data.get("notes", "")

        self._apply_summary(meeting, data)
        self._apply_key_points(meeting, data)
        self._apply_decisions(meeting, data)
        self._apply_tasks(meeting, data)

        meeting.save(update_fields=["title", "meeting_date", "notes", "updated_at"])

        try:
            report = run_sync_or_dispatch(generate_report_job, meeting.id)
        except Exception as exc:
            logger.exception("Report generation failed for meeting %s", meeting.id)
            raise StorageError(
                "We couldn't generate this report. Please try again."
            ) from exc

        if report is None:
            # Dispatched to a worker — report will be generated asynchronously.
            return Response(
                {"detail": "Report generation started."},
                status=status.HTTP_202_ACCEPTED,
            )

        return Response(
            {
                "detail": "Report generated successfully.",
                "report_id": str(report.id),
                "meeting": MeetingDetailSerializer(
                    meeting, context={"request": request}
                ).data,
            }
        )

    def _apply_summary(self, meeting, data):
        if "summary" not in data and "paragraph_summary" not in data:
            return
        summary, created = MeetingSummary.objects.get_or_create(meeting=meeting)
        if "summary" in data:
            summary.summary = str(data.get("summary", "")).strip()
        if "paragraph_summary" in data:
            summary.paragraph_summary = str(data.get("paragraph_summary", "")).strip()
        summary.save()

    def _apply_key_points(self, meeting, data):
        if "key_points" not in data:
            return
        values = data.get("key_points") or []
        if not isinstance(values, list):
            raise ApplicationError("key_points must be a list of strings.")
        meeting.key_points.all().delete()
        for index, point in enumerate(values):
            text = str(point).strip()
            if text:
                KeyPoint.objects.create(meeting=meeting, content=text, order=index)

    def _apply_decisions(self, meeting, data):
        if "decisions" not in data:
            return
        values = data.get("decisions") or []
        if not isinstance(values, list):
            raise ApplicationError("decisions must be a list of strings.")
        meeting.decisions.all().delete()
        for decision in values:
            text = str(decision).strip()
            if text:
                Decision.objects.create(meeting=meeting, content=text)

    def _apply_tasks(self, meeting, data):
        if "tasks" not in data:
            return
        values = data.get("tasks")
        if not isinstance(values, list):
            raise ApplicationError("tasks must be a list of objects.")

        org_people = set(
            meeting.organization.people.values_list("id", flat=True)
        )
        valid_ids = {item.get("id") for item in values if item.get("id")}
        meeting.tasks.exclude(id__in=valid_ids).delete()

        for item in values:
            task_id = item.get("id")
            person_id = item.get("person")
            if person_id not in (None, "", "null") and str(person_id) not in {
                str(p) for p in org_people
            }:
                raise ApplicationError(
                    "One of the assigned people doesn't belong to your organization."
                )

            payload = {
                "task": str(item.get("task", "")).strip(),
                "deadline": item.get("deadline") or None,
                "priority": item.get("priority") or Task.Priority.MEDIUM,
                "status": item.get("status") or Task.Status.PENDING,
                "context": str(item.get("context", "")).strip(),
            }
            if person_id:
                payload["person_id"] = person_id

            if task_id:
                Task.objects.filter(id=task_id, meeting=meeting).update(**payload)
            else:
                payload["meeting"] = meeting
                payload["mentioned_name"] = str(item.get("mentioned_name", "")).strip()
                Task.objects.create(source=Task.Source.MANUAL, **payload)


class MeetingPdfView(APIView):
    """Return a fetchable URL for the meeting's generated PDF."""

    def get(self, request, id):
        meeting = MeetingProcessView()._get_meeting(request, id)
        if not meeting.pdf_path:
            raise NotFoundError("No PDF has been generated for this meeting.")
        storage = get_storage()
        try:
            url = storage.url(meeting.pdf_path)
        except StorageError as exc:
            raise exc
        return Response({"url": url, "filename": f"{meeting.title}.pdf"})
