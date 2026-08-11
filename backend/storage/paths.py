"""Storage path convention.

meeting-files/
    organization-id/
        meeting-id/
            transcript/
            audio/
            reports/
"""

import uuid
from pathlib import Path


def meeting_transcript_path(organization_id, meeting_id, filename):
    return str(
        Path("meeting-files") / str(organization_id) / str(meeting_id)
        / "transcript" / _unique_name(filename)
    ).replace("\\", "/")


def meeting_audio_path(organization_id, meeting_id, filename):
    return str(
        Path("meeting-files") / str(organization_id) / str(meeting_id)
        / "audio" / _unique_name(filename)
    ).replace("\\", "/")


def meeting_report_path(organization_id, meeting_id, filename):
    return str(
        Path("meeting-files") / str(organization_id) / str(meeting_id)
        / "reports" / _unique_name(filename)
    ).replace("\\", "/")


def _unique_name(filename):
    stem = Path(filename).stem
    suffix = Path(filename).suffix
    return f"{stem}-{uuid.uuid4().hex[:8]}{suffix}"
