from rest_framework.permissions import BasePermission


class IsPlatformAdmin(BasePermission):
    """Only users with the platform admin role (app management) may pass."""

    message = "You don't have permission to access this resource."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user is not None
            and user.is_authenticated
            and getattr(user, "role", None) == "admin"
        )
