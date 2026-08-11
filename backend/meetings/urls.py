from django.urls import path

from .views import (
    MeetingGenerateReportView,
    MeetingPdfView,
    MeetingProcessView,
    MeetingReviewView,
    MeetingStatusView,
    MeetingViewSet,
)

app_name = "meetings"

urlpatterns = [
    path("meetings/", MeetingViewSet.as_view({"get": "list", "post": "create"}), name="meetings-list"),
    path(
        "meetings/<uuid:id>/",
        MeetingViewSet.as_view(
            {"get": "retrieve", "patch": "partial_update", "delete": "destroy"}
        ),
        name="meetings-detail",
    ),
    path("meetings/<uuid:id>/process/", MeetingProcessView.as_view(), name="meetings-process"),
    path("meetings/<uuid:id>/status/", MeetingStatusView.as_view(), name="meetings-status"),
    path("meetings/<uuid:id>/review/", MeetingReviewView.as_view(), name="meetings-review"),
    path(
        "meetings/<uuid:id>/generate-report/",
        MeetingGenerateReportView.as_view(),
        name="meetings-generate-report",
    ),
    path("meetings/<uuid:id>/pdf/", MeetingPdfView.as_view(), name="meetings-pdf"),
]
