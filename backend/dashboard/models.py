from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class SiteTheme(models.Model):
    """Platform-wide branding controlled by the super admin.

    A single (singleton) row whose values are exposed through the public
    ``GET /api/settings/theme/`` endpoint and applied by the frontend as
    CSS variables — theme color, accent color, backgrounds, corner radius
    and body font. Everything is optional; empty values mean "use the
    default design system".
    """

    FONT_CHOICES = [
        ("default", "Default (Geist)"),
        ("system", "System UI"),
        ("serif", "Elegant Serif"),
        ("mono", "Monospace"),
    ]

    RADIUS_CHOICES = [
        ("0.5rem", "Soft"),
        ("0.75rem", "Rounded (default)"),
        ("1rem", "Extra rounded"),
        ("0rem", "Sharp"),
    ]

    primary_color = models.CharField(
        max_length=7, blank=True, default="",
        help_text="Main brand color (hex, e.g. #2563eb). Empty = default blue.",
    )
    accent_color = models.CharField(
        max_length=7, blank=True, default="",
        help_text="Accent / gradient partner color (hex, e.g. #0ea5e9).",
    )
    light_background = models.CharField(
        max_length=7, blank=True, default="",
        help_text="Light-mode background (hex). Empty = default white.",
    )
    dark_background = models.CharField(
        max_length=7, blank=True, default="",
        help_text="Dark-mode background (hex). Empty = default slate.",
    )
    radius = models.CharField(
        max_length=8, choices=RADIUS_CHOICES, default="0.75rem",
        help_text="Corner radius of cards, buttons and inputs.",
    )
    font_family = models.CharField(
        max_length=16, choices=FONT_CHOICES, default="default",
        help_text="Body font family. Headings always keep the Saira Condensed display font.",
    )

    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )

    class Meta:
        verbose_name = "Site theme"
        verbose_name_plural = "Site themes"

    def __str__(self):
        return f"Site theme (updated {self.updated_at:%Y-%m-%d %H:%M})"

    @classmethod
    def get_singleton(cls):
        """Return the single site-theme row, creating it on first use."""
        theme, _ = cls.objects.get_or_create(pk=1)
        return theme

    def as_payload(self):
        return {
            "primary_color": self.primary_color,
            "accent_color": self.accent_color,
            "light_background": self.light_background,
            "dark_background": self.dark_background,
            "radius": self.radius,
            "font_family": self.font_family,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
