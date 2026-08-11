"""Remove test data created by verify_e2e.py / smoke_test.py runs.

Deletes: users with e2e-*/host-* emails, their organizations (cascades to
people/meetings/tasks/reports), and the associated files in Supabase Storage.
"""

import os
from dotenv import load_dotenv

load_dotenv()

import django  # noqa: E402

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.db.models import Count, Q  # noqa: E402

from accounts.models import User  # noqa: E402
from meetings.models import Meeting  # noqa: E402
from storage import get_storage  # noqa: E402


def main():
    storage = get_storage()
    users = User.objects.filter(Q(email__startswith="e2e-") | Q(email__startswith="host-"))
    org_ids = set(users.values_list("organization_id", flat=True))
    org_ids.discard(None)

    meetings = Meeting.objects.filter(organization_id__in=org_ids)
    paths = set()
    for meeting in meetings:
        for path in (meeting.transcript_path, meeting.audio_path, meeting.pdf_path):
            if path:
                paths.add(path)
        for report in meeting.reports.all():
            if report.file_path:
                paths.add(report.file_path)

    for path in paths:
        try:
            storage.delete(path)
        except Exception as exc:
            print(f"  storage delete failed for {path}: {exc}")

    # Delete meetings first (Meeting.host is PROTECT against user deletion).
    deleted_meetings, _ = meetings.delete()
    deleted_users, _ = users.delete()

    # Orgs that no longer have members, meetings, or people are test leftovers.
    from organizations.models import Organization

    orphan_orgs = Organization.objects.annotate(
        member_count=Count("members"),
        meeting_count=Count("meetings"),
        people_count=Count("people"),
    ).filter(member_count=0, meeting_count=0, people_count=0)
    deleted_orgs, _ = orphan_orgs.delete()
    print(f"deleted {deleted_meetings} test meetings")
    print(f"deleted {deleted_users} test users")
    print(f"deleted {deleted_orgs} leftover organizations")
    print(f"removed {len(paths)} stored files")


if __name__ == "__main__":
    main()
