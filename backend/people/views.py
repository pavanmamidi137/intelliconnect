import csv
import io
import re
import uuid

from django.db.models import Q
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import GenericViewSet
from rest_framework.mixins import (
    CreateModelMixin,
    DestroyModelMixin,
    ListModelMixin,
    RetrieveModelMixin,
    UpdateModelMixin,
)

from config.exceptions import ApplicationError, FileValidationError

from .models import Person
from .serializers import PersonDetailSerializer, PersonSerializer


class _OrganizationScoped:
    """Restrict every query to the caller's organization."""

    def get_queryset(self):
        user = self.request.user
        if user.organization_id is None:
            return Person.objects.none()
        return Person.objects.filter(organization=user.organization).select_related(
            "organization"
        )


class PersonViewSet(
    _OrganizationScoped,
    ListModelMixin,
    RetrieveModelMixin,
    CreateModelMixin,
    UpdateModelMixin,
    DestroyModelMixin,
    GenericViewSet,
):
    queryset = Person.objects.none()
    lookup_field = "id"

    def get_serializer_class(self):
        if self.action == "retrieve":
            return PersonDetailSerializer
        return PersonSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        search = request.query_params.get("search", "").strip()
        if search:
            queryset = queryset.filter(
                Q(full_name__icontains=search)
                | Q(email__icontains=search)
                | Q(department__icontains=search)
                | Q(designation__icontains=search)
            )

        department = request.query_params.get("department", "").strip()
        if department:
            queryset = queryset.filter(department__iexact=department)

        designation = request.query_params.get("designation", "").strip()
        if designation:
            queryset = queryset.filter(designation__iexact=designation)

        status_filter = request.query_params.get("status", "").strip()
        if status_filter in ("active", "inactive"):
            queryset = queryset.filter(is_active=(status_filter == "active"))

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        # Keep meeting participant links intact via CASCADE; tasks become unassigned.
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_object(self):
        obj = super().get_object()
        if obj.organization_id != self.request.user.organization_id:
            from rest_framework.exceptions import NotFound

            raise NotFound("You don't have permission to access this person.")
        return obj


# Header matching is case-insensitive and tolerant of spaces/underscores, so
# "ID", "Id", "full_name", "Full_Name", "FULL NAME", "username", etc. all
# resolve to the same canonical field.
_IMPORT_FIELD_ALIASES = {
    "id": "id",
    "fullname": "full_name",
    "username": "user_name",
    "teams": "teams",
    "email": "email",
    "department": "department",
    "designation": "designation",
    "additionalinfo": "additional_info",
}


def _normalize_header(header):
    return re.sub(r"[\s_]+", "", (header or "").strip().lower())


def _build_column_map(fieldnames):
    """Map the CSV's actual headers (any casing) to canonical fields."""
    column_to_field = {}
    for header in fieldnames or []:
        key = _normalize_header(header)
        if key in _IMPORT_FIELD_ALIASES:
            column_to_field[header] = _IMPORT_FIELD_ALIASES[key]
    return column_to_field


def _row_value(row, column_to_field, field):
    """Read a canonical field from a row regardless of the header's case."""
    for column, canonical in column_to_field.items():
        if canonical == field:
            return (row.get(column) or "").strip()
    return ""


class PersonImportView(APIView):
    """Import people from an uploaded CSV file.

    Accepted columns: ID, full_name, user_name, teams, email, department,
    designation, additional_info. Headers are matched case-insensitively
    (and tolerate spaces/underscores). Only full_name is required.

    Duplicate handling:
      * Rows missing a name are skipped and reported.
      * Rows whose email already exists in the organization are skipped.
      * A CSV ID column is used to skip already-imported rows when it holds
        the person's UUID; non-UUID external IDs are ignored because
        person_id (a system UUID) is always the unique identifier.
    """

    def post(self, request):
        file = request.FILES.get("file")
        if file is None:
            raise ApplicationError("Please upload a CSV file.")

        if file.size > 5 * 1024 * 1024:
            raise FileValidationError("CSV files must be smaller than 5 MB.")

        name = file.name.lower()
        if not name.endswith(".csv"):
            raise FileValidationError("Please upload a CSV file.")

        try:
            raw = file.read().decode("utf-8-sig")
            reader = csv.DictReader(io.StringIO(raw))
            rows = list(reader)
        except Exception as exc:
            raise FileValidationError("We couldn't read this CSV file.") from exc

        if not rows:
            raise FileValidationError("The CSV file contains no rows to import.")

        organization = request.user.organization
        column_to_field = _build_column_map(reader.fieldnames)

        existing_uuids = set(
            Person.objects.filter(organization=organization).values_list("id", flat=True)
        )
        existing_emails = {
            email.lower()
            for email in Person.objects.filter(organization=organization)
            .exclude(email="")
            .values_list("email", flat=True)
        }

        created, skipped = 0, []
        seen_emails = set()
        for index, row in enumerate(rows, start=2):
            full_name = _row_value(row, column_to_field, "full_name")
            if not full_name:
                skipped.append(f"Row {index}: missing full_name")
                continue

            csv_id = _row_value(row, column_to_field, "id")
            if csv_id:
                try:
                    if uuid.UUID(csv_id) in existing_uuids:
                        skipped.append(f"Row {index}: already imported (ID {csv_id})")
                        continue
                except (ValueError, AttributeError):
                    pass  # non-UUID external IDs are ignored

            email = _row_value(row, column_to_field, "email")
            email_key = email.lower() if email else ""
            if email_key:
                if email_key in seen_emails or email_key in existing_emails:
                    skipped.append(f"Row {index}: duplicate email ({email})")
                    continue
                seen_emails.add(email_key)

            Person.objects.create(
                organization=organization,
                full_name=full_name,
                user_name=_row_value(row, column_to_field, "user_name"),
                teams=_row_value(row, column_to_field, "teams"),
                email=email,
                department=_row_value(row, column_to_field, "department"),
                designation=_row_value(row, column_to_field, "designation"),
                additional_info=_row_value(row, column_to_field, "additional_info"),
            )
            created += 1

        return Response(
            {
                "created": created,
                "skipped": len(skipped),
                "skipped_details": skipped[:25],
            },
            status=status.HTTP_201_CREATED,
        )


class PersonFacetsView(APIView):
    """Distinct departments / designations for filter dropdowns."""

    def get(self, request):
        org = request.user.organization
        people = Person.objects.filter(organization=org) if org else Person.objects.none()
        return Response(
            {
                "departments": sorted(
                    {p for p in people.values_list("department", flat=True) if p}
                ),
                "designations": sorted(
                    {p for p in people.values_list("designation", flat=True) if p}
                ),
            }
        )
