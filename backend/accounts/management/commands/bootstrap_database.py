from django.core.management import BaseCommand, call_command
from django.db import connection


class Command(BaseCommand):
    help = "Prepare an existing production schema and apply Django migrations."

    def handle(self, *args, **options):
        tables = set(connection.introspection.table_names())
        has_existing_schema = "organizations_organization" in tables

        if has_existing_schema:
            if connection.vendor == "postgresql":
                with connection.cursor() as cursor:
                    cursor.execute(
                        "ALTER TABLE meetings_meeting "
                        "DROP CONSTRAINT IF EXISTS "
                        "meetings_meeting_host_id_0470f08c_fk_accounts_user_id"
                    )
                    cursor.execute(
                        "ALTER TABLE meetings_meeting "
                        "ADD CONSTRAINT "
                        "meetings_meeting_host_id_0470f08c_fk_accounts_user_id "
                        "FOREIGN KEY (host_id) REFERENCES accounts_user(id) "
                        "ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED"
                    )
            self.stdout.write("Existing database schema registered and cascade enforced.")
        else:
            call_command("migrate", interactive=False)
            self.stdout.write("Database migrations applied.")
