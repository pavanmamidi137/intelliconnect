"""Create a platform admin (app-management role) user.

Usage:
    python manage.py create_admin --email admin@example.com --password <pw>

Platform admins see the app-management dashboard and can manage all
organizations, users, and meetings. They are not tied to an organization.
"""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

User = get_user_model()


class Command(BaseCommand):
    help = "Create a platform admin user (app-management role)."

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True, help="Admin email address.")
        parser.add_argument("--password", required=True, help="Admin password (min 8 chars).")
        parser.add_argument("--full-name", default="Platform Admin", help="Display name.")

    def handle(self, *args, **options):
        email = (options["email"] or "").strip().lower()
        password = options["password"] or ""
        full_name = options["full_name"] or "Platform Admin"

        if not email or "@" not in email:
            raise CommandError("A valid --email is required.")
        if len(password) < 8:
            raise CommandError("Password must be at least 8 characters.")

        if User.objects.filter(email__iexact=email).exists():
            raise CommandError(f"A user with email {email} already exists.")

        user = User.objects.create_user(
            email=email,
            password=password,
            full_name=full_name,
            role=User.Role.ADMIN,
            is_staff=True,
        )
        self.stdout.write(
            self.style.SUCCESS(f"Platform admin created: {user.email} (role={user.role})")
        )
