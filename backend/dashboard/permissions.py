from rest_framework.permissions import BasePermission


# Roles allowed into the platform app-management dashboard. The legacy
# "admin" value is accepted for rows created before superadmin existed.
PLATFORM_ADMIN_ROLES = ("superadmin", "admin")


class IsPlatformAdmin(BasePermission):
    """Only users with the platform super-admin role (app management) may pass."""

    message = "You don't have permission to access this resource."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user is not None
            and user.is_authenticated
            and getattr(user, "role", None) in PLATFORM_ADMIN_ROLES
        )
