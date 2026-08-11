from django.urls import path

from .views import (
    AdminDashboardView,
    AdminOrganizationsView,
    AdminUsersView,
    HostDashboardView,
)

app_name = "dashboard"

urlpatterns = [
    path("dashboard/", HostDashboardView.as_view(), name="host-dashboard"),
    path("dashboard/admin/", AdminDashboardView.as_view(), name="admin-dashboard"),
    path(
        "dashboard/admin/organizations/",
        AdminOrganizationsView.as_view(),
        name="admin-organizations",
    ),
    path("dashboard/admin/users/", AdminUsersView.as_view(), name="admin-users"),
]
