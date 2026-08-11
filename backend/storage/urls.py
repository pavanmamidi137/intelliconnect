from django.urls import path

from .views import local_file

app_name = "storage"

urlpatterns = [
    path("file/<path:path>", local_file, name="file"),
]
