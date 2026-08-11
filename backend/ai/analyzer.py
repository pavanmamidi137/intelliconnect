"""
Meeting analysis pipeline.

Flow: load transcript → build prompt → call providers (with fallback) →
validate structured output → persist summary/key points/decisions/tasks
→ resolve mentioned people with confidence → set meeting status.

Designed so it can run synchronously (default) or be dispatched to
Celery + Redis in production without changing the pipeline itself.
"""

import logging
import re
from datetime import date

from django.conf import settings
from django.utils import timezone

from config.exceptions import AIProviderError
from meetings.models import (
    Decision,
    KeyPoint,
    Meeting,
    MeetingParticipant,
    MeetingSummary,
    PersonMention,
)
from people.models import Person
from storage import get_storage
from tasks.models import Task

from .matcher import best_match
from .providers import resolve_chain
from .schemas import MeetingAnalysis

logger = logging.getLogger("intelliconnect")


def _build_prompt(transcript: str, meeting_title: str) -> str:
    # Collapse blank-line runs to keep the token count down (a long
    # transcript's repeated blank lines inflate prompt size for nothing).
    compact = re.sub(r"\n{3,}", "\n\n", transcript.strip())[: settings.AI_MAX_TRANSCRIPT_CHARS]
    header = f"Meeting title: {meeting_title}\n\nTranscript:\n"
    if len(transcript.strip()) > settings.AI_MAX_TRANSCRIPT_CHARS:
        header = (
            f"Meeting title: {meeting_title}\n"
            f"(Transcript truncated to {settings.AI_MAX_TRANSCRIPT_CHARS} characters)\n\nTranscript:\n"
        )
    return f"{header}{compact}"


def _load_transcript_text(meeting: Meeting) -> str:
    from meetings.transcripts import extract_transcript_text

    storage = get_storage()
    try:
        content = storage.read(meeting.transcript_path)
    except Exception as exc:
        raise AIProviderError(
            "We couldn't read this meeting's transcript. Your file is safe. Please retry."
        ) from exc
    return extract_transcript_text(meeting.transcript_filename or "transcript.txt", content)


PROCESSING_STAGES = [
    "Reading transcript",
    "Understanding conversation",
    "Identifying people",
    "Extracting key points",
    "Detecting decisions",
    "Identifying tasks",
    "Matching people",
    "Preparing report",
]


def _set_stage(meeting: Meeting, stage: int | None):
    meeting.processing_stage = stage
    meeting.save(update_fields=["processing_stage", "updated_at"])


def analyze_meeting(meeting_id) -> Meeting:
    """Run the full analysis pipeline for a meeting. Returns the meeting.

    The `processing_stage` column is updated at each real pipeline step so
    the processing screen reflects actual backend progress (never faked).
    """
    meeting = Meeting.objects.select_related("organization", "host").get(id=meeting_id)

    if meeting.status == Meeting.Status.PROCESSING:
        return meeting

    meeting.status = Meeting.Status.PROCESSING
    meeting.processing_stage = 0
    meeting.save(update_fields=["status", "processing_stage", "updated_at"])

    try:
        transcript = _load_transcript_text(meeting)
        _set_stage(meeting, 1)
        analysis = _call_providers(meeting, transcript)
        # Stages 2-5 complete with the provider call (people, key points,
        # decisions and tasks are all extracted from the transcript).
        _set_stage(meeting, 6)
        _persist_analysis(meeting, analysis, transcript)
        _set_stage(meeting, 7)
        meeting.status = Meeting.Status.REVIEW_REQUIRED
        meeting.processed_at = timezone.now()
        meeting.processing_stage = None
        meeting.save(update_fields=["status", "processed_at", "processing_stage", "updated_at"])
        return meeting
    except Exception:
        meeting.status = Meeting.Status.FAILED
        meeting.processing_stage = None
        meeting.save(update_fields=["status", "processing_stage", "updated_at"])
        raise


def _call_providers(meeting: Meeting, transcript: str) -> MeetingAnalysis:
    providers = resolve_chain()
    if not providers:
        raise AIProviderError(
            "No AI provider is configured. Add an API key to the backend environment and try again."
        )

    prompt = _build_prompt(transcript, meeting.title)
    errors = []
    for provider in providers:
        try:
            logger.info("Analyzing meeting %s with provider %s", meeting.id, provider.name)
            return provider.generate_structured(prompt)
        except Exception as exc:  # noqa: BLE001 - try next provider in the chain
            errors.append(f"{provider.label}: {exc}")
            logger.warning("Provider %s failed for meeting %s: %s", provider.name, meeting.id, exc)
            continue

    detail = "We couldn't analyze this meeting. Your transcript is safe. Please retry."
    if errors:
        detail = f"{detail} ({errors[0]})"
    raise AIProviderError(detail)


def _persist_analysis(meeting: Meeting, analysis: MeetingAnalysis, transcript: str) -> None:
    """Persist validated AI output and resolve people with confidence.

    All writes are batched (bulk_create / single deletes) and the
    organization's people roster is loaded once and matched in memory, so
    persistence stays fast even against a remote database pooler.
    """
    # `created` doubles as the "first analysis" signal: on a first run there
    # are no child rows to replace, so the four delete queries are skipped.
    summary, created = MeetingSummary.objects.get_or_create(
        meeting=meeting,
        defaults={
            "summary": analysis.summary,
            "paragraph_summary": analysis.paragraph_summary,
        },
    )
    if not created:
        summary.summary = analysis.summary
        summary.paragraph_summary = analysis.paragraph_summary
        summary.save(update_fields=["summary", "paragraph_summary", "updated_at"])
        meeting.key_points.all().delete()
        meeting.decisions.all().delete()
        meeting.mentions.all().delete()
        meeting.tasks.all().delete()

    KeyPoint.objects.bulk_create(
        [
            KeyPoint(meeting=meeting, content=point, order=index)
            for index, point in enumerate(analysis.key_points)
        ]
    )
    Decision.objects.bulk_create(
        [Decision(meeting=meeting, content=decision) for decision in analysis.decisions]
    )

    participant_ids = set(
        MeetingParticipant.objects.filter(meeting=meeting).values_list("person_id", flat=True)
    )
    roster = list(Person.objects.filter(organization=meeting.organization, is_active=True))

    mention_rows = []
    for mention in analysis.people_mentioned:
        result = best_match(
            meeting.organization,
            mention.name,
            context=mention.context,
            transcript=transcript,
            participant_ids=participant_ids,
            people=roster,
        )
        mention_rows.append(
            PersonMention(
                meeting=meeting,
                full_name=mention.name,
                person=result.person,
                confidence=result.confidence,
                context=mention.context,
            )
        )
    PersonMention.objects.bulk_create(mention_rows)

    task_rows = []
    for extracted in analysis.tasks:
        result = best_match(
            meeting.organization,
            extracted.mentioned_name,
            context=extracted.context,
            transcript=transcript,
            participant_ids=participant_ids,
            people=roster,
        )
        task_rows.append(
            Task(
                meeting=meeting,
                person=result.person,
                mentioned_name=extracted.mentioned_name,
                task=extracted.task,
                deadline=extracted.deadline,
                ai_confidence=result.confidence,
                context=extracted.context,
                source=Task.Source.AI,
            )
        )
    Task.objects.bulk_create(task_rows)


def task_needs_confirmation(task: Task) -> bool:
    """A task requires host confirmation when unassigned or low confidence."""
    if task.source == Task.Source.MANUAL and task.person is not None:
        return False
    return task.person is None or (task.ai_confidence is not None and task.ai_confidence < settings.AI_CONFIDENCE_THRESHOLD)
