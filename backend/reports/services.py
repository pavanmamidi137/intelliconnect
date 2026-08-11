"""Report generation service.

Generates the professional PDF, stores it through the active storage
backend (Supabase in production, local disk in development), records a
MeetingReport row and links the file back to the meeting.
"""

import logging
import re
from datetime import date

from config.exceptions import StorageError
from meetings.models import Meeting
from storage import get_storage
from storage.paths import meeting_report_path

from .models import MeetingReport
from .pdf import generate_meeting_pdf

logger = logging.getLogger("intelliconnect")


def _slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug[:60] or "meeting-report"


def generate_report(meeting_id) -> MeetingReport:
    """Generate, store and record the report for a meeting."""
    meeting = Meeting.objects.select_related("organization", "host", "summary").get(id=meeting_id)

    report = MeetingReport.objects.create(meeting=meeting, status=MeetingReport.Status.GENERATING)

    try:
        pdf_bytes = generate_meeting_pdf(meeting)
        filename = f"IntelliConnect-{_slugify(meeting.title)}-{meeting.meeting_date.isoformat()}.pdf"
        path = meeting_report_path(meeting.organization_id, meeting.id, filename)
        get_storage().save(path, pdf_bytes, content_type="application/pdf")

        report.file_path = path
        report.status = MeetingReport.Status.READY
        report.save(update_fields=["file_path", "status"])

        meeting.pdf_path = path
        meeting.status = Meeting.Status.COMPLETED
        meeting.save(update_fields=["pdf_path", "status", "updated_at"])

        logger.info("Generated report %s for meeting %s", report.id, meeting.id)
        return report
    except StorageError:
        report.status = MeetingReport.Status.FAILED
        report.save(update_fields=["status"])
        raise
    except Exception as exc:
        report.status = MeetingReport.Status.FAILED
        report.save(update_fields=["status"])
        logger.exception("Report generation failed for meeting %s", meeting.id)
        raise StorageError("We couldn't generate this report. Please try again.") from exc
