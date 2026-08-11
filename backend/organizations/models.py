import uuid

from django.db import models


class Organization(models.Model):
    class OrganizationType(models.TextChoices):
        COMPANY = "company", "Company"
        STARTUP = "startup", "Startup"
        COLLEGE = "college", "College / University"
        GOVERNMENT = "government", "Government"
        NON_PROFIT = "non_profit", "Non-Profit"
        OTHER = "other", "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    organization_type = models.CharField(
        max_length=32,
        choices=OrganizationType.choices,
        default=OrganizationType.COMPANY,
    )
    description = models.TextField(blank=True, default="")
    website = models.URLField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name
