import uuid

from django.db import models


class Person(models.Model):
    """A person connected to an organization.

    `id` is the only unique identifier. Duplicate full names are valid
    (e.g. "Ravi Kumar — Development" and "Ravi Kumar — HR") and are
    distinguished by context: department, designation, email, etc.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="people",
    )
    full_name = models.CharField(max_length=255)
    # Username/handle and team memberships are optional import-friendly
    # attributes (common in HR/person exports). Teams is a free-text field;
    # store comma-separated team names.
    user_name = models.CharField(max_length=255, blank=True, default="")
    teams = models.CharField(max_length=1000, blank=True, default="")
    email = models.EmailField(blank=True, default="")
    department = models.CharField(max_length=255, blank=True, default="")
    designation = models.CharField(max_length=255, blank=True, default="")
    additional_info = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["full_name"]
        indexes = [
            models.Index(fields=["organization", "full_name"]),
            models.Index(fields=["organization", "department"]),
        ]

    def __str__(self):
        return self.full_name
