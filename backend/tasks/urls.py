from django.urls import path

from .views import TaskViewSet

app_name = "tasks"

urlpatterns = [
    path("tasks/", TaskViewSet.as_view({"get": "list", "post": "create"}), name="tasks-list"),
    path(
        "tasks/<uuid:id>/",
        TaskViewSet.as_view(
            {"get": "retrieve", "patch": "partial_update", "delete": "destroy"}
        ),
        name="tasks-detail",
    ),
]
