from django.urls import path

from .views import ReportDownloadView, ReportViewSet

app_name = "reports"

urlpatterns = [
    path("reports/", ReportViewSet.as_view({"get": "list"}), name="reports-list"),
    path("reports/<uuid:id>/", ReportViewSet.as_view({"get": "retrieve"}), name="reports-detail"),
    path("reports/<uuid:id>/download/", ReportDownloadView.as_view(), name="reports-download"),
]
