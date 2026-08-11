from django.urls import path

from .views import OrganizationView

app_name = "organizations"

urlpatterns = [
    path("organization/", OrganizationView.as_view(), name="organization"),
]
