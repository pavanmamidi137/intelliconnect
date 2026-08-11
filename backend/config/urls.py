from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    # IntelliConnect API — all routes are organization-scoped server-side.
    path("api/", include("accounts.urls")),
    path("api/", include("organizations.urls")),
    path("api/", include("people.urls")),
    path("api/", include("meetings.urls")),
    path("api/", include("tasks.urls")),
    path("api/", include("reports.urls")),
    path("api/", include("dashboard.urls")),
    # Local development storage serving (Supabase in production).
    path("api/storage/", include("storage.urls")),
]

# Health check endpoint for deployment probes.
from django.http import JsonResponse  # noqa: E402


def health(request):
    return JsonResponse({"status": "ok"})


urlpatterns.append(path("api/health/", health, name="health"))
