from django.urls import path

from .views import PersonBulkCreateView, PersonBulkDeleteView, PersonFacetsView, PersonImportView, PersonViewSet

app_name = "people"

urlpatterns = [
    path("people/", PersonViewSet.as_view({"get": "list", "post": "create"}), name="people-list"),
    path("people/import/", PersonImportView.as_view(), name="people-import"),
    path("people/bulk/", PersonBulkCreateView.as_view(), name="people-bulk-create"),
    path("people/bulk_delete/", PersonBulkDeleteView.as_view(), name="people-bulk-delete"),
    path("people/facets/", PersonFacetsView.as_view(), name="people-facets"),
    path(
        "people/<uuid:id>/",
        PersonViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="people-detail",
    ),
]
