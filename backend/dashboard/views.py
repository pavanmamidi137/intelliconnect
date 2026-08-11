"""Dashboard APIs.

Two audiences:

* Host dashboard  — ``GET /api/dashboard/`` is scoped to the requesting
  host's own organization. Every host effectively has a separate
  dashboard because every query is filtered by ``organization``.
  Only real data is returned — no fabricated analytics.

* Admin dashboard — ``GET /api/dashboard/admin/`` (plus the management
  lists under ``/api/dashboard/admin/...``) is platform-wide app
  management and requires the ``admin`` role.
"""

from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ai.providers import active_provider_name, provider_statuses
from config.pagination import StandardResultsSetPagination
from meetings.models import Decision, Meeting
from meetings.serializers import MeetingListSerializer
from organizations.models import Organization
from people.models import Person
from reports.models import MeetingReport
from tasks.models import Task

from .permissions import IsPlatformAdmin
from .serializers import (
    AdminOrganizationListSerializer,
    AdminUserListSerializer,
    RecentTaskSerializer,
)

User = get_user_model()

OPEN_TASK_STATUSES = [Task.Status.PENDING, Task.Status.IN_PROGRESS]


def _meetings_by_status(queryset):
    return {choice: queryset.filter(status=choice).count() for choice in Meeting.Status.values}


def _tasks_by_status(queryset):
    return {choice: queryset.filter(status=choice).count() for choice in Task.Status.values}


class HostDashboardView(APIView):
    """Real, organization-scoped stats for the signed-in host."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        org = request.user.organization
        if org is None:
            return Response(
                {"detail": "Organization not found."}, status=status.HTTP_404_NOT_FOUND
            )

        meetings = org.meetings.all()
        tasks = Task.objects.filter(meeting__organization=org)
        open_tasks = tasks.filter(status__in=OPEN_TASK_STATUSES)
        due_cutoff = timezone.localdate() + timezone.timedelta(days=7)

        stats = {
            "total_meetings": meetings.count(),
            "meetings_by_status": _meetings_by_status(meetings),
            "people_count": org.people.count(),
            "open_tasks": open_tasks.count(),
            "completed_tasks": tasks.filter(status=Task.Status.COMPLETED).count(),
            # Upcoming or already overdue (within the next 7 days), not completed.
            "tasks_due_soon": open_tasks.filter(deadline__lte=due_cutoff).count(),
            "reports_count": MeetingReport.objects.filter(
                meeting__organization=org, status=MeetingReport.Status.READY
            ).count(),
            "decisions_count": Decision.objects.filter(meeting__organization=org).count(),
        }

        providers = provider_statuses()
        recent_tasks = (
            open_tasks.select_related("meeting", "person").order_by("-created_at")[:5]
        )

        return Response(
            {
                "organization": {
                    "id": str(org.id),
                    "name": org.name,
                    "organization_type": org.organization_type,
                },
                "stats": stats,
                "recent_meetings": MeetingListSerializer(
                    meetings.select_related("host")[:5], many=True
                ).data,
                "recent_tasks": RecentTaskSerializer(recent_tasks, many=True).data,
                "ai": {
                    "primary": active_provider_name(),
                    "configured": any(p["configured"] for p in providers),
                },
            }
        )


class AdminDashboardView(APIView):
    """Platform-wide app-management overview (admin role only)."""

    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        meetings = Meeting.objects.all()
        tasks = Task.objects.all()

        stats = {
            "organizations": Organization.objects.count(),
            "users": User.objects.count(),
            "people": Person.objects.count(),
            "meetings": meetings.count(),
            "meetings_by_status": _meetings_by_status(meetings),
            "tasks": tasks.count(),
            "tasks_by_status": _tasks_by_status(tasks),
            "reports": MeetingReport.objects.count(),
            "reports_ready": MeetingReport.objects.filter(
                status=MeetingReport.Status.READY
            ).count(),
            "decisions": Decision.objects.count(),
            "transcripts_stored": meetings.exclude(transcript_path="").count(),
            "pdfs_generated": meetings.exclude(pdf_path="").count(),
        }

        recent_organizations = (
            Organization.objects.annotate(
                members_count=Count("members", distinct=True),
                people_count=Count("people", distinct=True),
                meetings_count=Count("meetings", distinct=True),
                completed_meetings=Count(
                    "meetings", filter=Q(meetings__status=Meeting.Status.COMPLETED), distinct=True
                ),
                open_tasks=Count(
                    "meetings__tasks",
                    filter=Q(meetings__tasks__status__in=OPEN_TASK_STATUSES),
                    distinct=True,
                ),
            )
            .order_by("-created_at")[:5]
        )

        return Response(
            {
                "stats": stats,
                "recent_organizations": AdminOrganizationListSerializer(
                    recent_organizations, many=True
                ).data,
                "recent_meetings": MeetingListSerializer(
                    meetings.select_related("host")[:5], many=True
                ).data,
                "providers": provider_statuses(),
                "primary": active_provider_name(),
            }
        )


class AdminOrganizationsView(APIView):
    """Paginated organization list for app management."""

    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        queryset = Organization.objects.all().order_by("-created_at")
        search = (request.query_params.get("search") or "").strip()
        if search:
            queryset = queryset.filter(name__icontains=search)

        queryset = queryset.annotate(
            members_count=Count("members", distinct=True),
            people_count=Count("people", distinct=True),
            meetings_count=Count("meetings", distinct=True),
            completed_meetings=Count(
                "meetings", filter=Q(meetings__status=Meeting.Status.COMPLETED), distinct=True
            ),
            open_tasks=Count(
                "meetings__tasks",
                filter=Q(meetings__tasks__status__in=OPEN_TASK_STATUSES),
                distinct=True,
            ),
        )

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        return paginator.get_paginated_response(
            AdminOrganizationListSerializer(page, many=True).data
        )


class AdminUsersView(APIView):
    """Paginated user list for app management."""

    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        queryset = User.objects.all().order_by("-created_at")
        search = (request.query_params.get("search") or "").strip()
        if search:
            queryset = queryset.filter(
                Q(full_name__icontains=search) | Q(email__icontains=search)
            )

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        return paginator.get_paginated_response(
            AdminUserListSerializer(page, many=True).data
        )
