from django.urls import path

from .views import (
    AdminDashboardView,
    AdminOrganizationsView,
    AdminUsersView,
    HostDashboardView,
    SiteThemeResetView,
    SiteThemeView,
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
    # Platform branding (super-admin editable, publicly readable).
    path("settings/theme/", SiteThemeView.as_view(), name="site-theme"),
    path("settings/theme/reset/", SiteThemeResetView.as_view(), name="site-theme-reset"),
]
