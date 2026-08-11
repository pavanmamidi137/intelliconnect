"""
Context-aware person matching.

Names are NEVER treated as unique identifiers. Matching considers:
  * name similarity (token-level)
  * department / designation overlap between the candidate and the
    surrounding task or mention context
  * the person being a participant of the meeting
  * organization-level signals (department/designation vocabulary)

The result is a confidence score in [0, 1]. Assignments only happen
automatically when confidence meets the configured threshold; otherwise
the task/mention is left unresolved for host confirmation.
"""

import re
from dataclasses import dataclass
from difflib import SequenceMatcher
from typing import Optional

from django.conf import settings
from django.db.models import Q

from people.models import Person


@dataclass
class MatchResult:
    person: Optional[Person]
    confidence: float
    reason: str = ""


# ---------------------------------------------------------------------------
# Name utilities
# ---------------------------------------------------------------------------

_STOP_TOKENS = {"mr", "mrs", "ms", "dr", "prof", "sir", "madam"}


def normalize_name(name: str) -> str:
    if not name:
        return ""
    cleaned = re.sub(r"[^a-z0-9\s]", " ", name.lower())
    tokens = [t for t in cleaned.split() if t and t not in _STOP_TOKENS]
    return " ".join(tokens)


def _name_tokens(name: str) -> set[str]:
    return set(normalize_name(name).split())


def name_similarity(a: str, b: str) -> float:
    """Token-aware similarity in [0, 1] that tolerates small variations."""
    if not a or not b:
        return 0.0
    na, nb = normalize_name(a), normalize_name(b)
    if na == nb:
        return 1.0
    ta, tb = _name_tokens(a), _name_tokens(b)
    if not ta or not tb:
        return 0.0
    if ta == tb:
        return 0.98
    # One is a subset of the other (e.g. "Ravi" vs "Ravi Kumar").
    if ta.issubset(tb) or tb.issubset(ta):
        return 0.9
    overlap = len(ta & tb) / max(len(ta), len(tb))
    if overlap >= 0.5:
        return 0.7
    return round(SequenceMatcher(None, na, nb).ratio(), 2)


# ---------------------------------------------------------------------------
# Candidate discovery
# ---------------------------------------------------------------------------

def _text_fragments(text: str) -> list[str]:
    """Lower-case normalized tokens plus department/designation-ish phrases."""
    if not text:
        return []
    lowered = text.lower()
    return re.findall(r"[a-z][a-z0-9_\-\. ]{1,60}", lowered)


def find_candidates(
    organization,
    mentioned_name: str,
    limit: int = 8,
    people: Optional[list[Person]] = None,
) -> list[Person]:
    """People whose name plausibly matches the mentioned name.

    `people` lets callers that already loaded the organization's people
    (e.g. the analysis pipeline) filter in memory instead of issuing one
    query per mention — required for fast batch resolution.
    """
    if not mentioned_name:
        return []
    tokens = _name_tokens(mentioned_name)
    if not tokens:
        return []
    if people is not None:
        matched = [
            p
            for p in people
            if p.is_active and all(any(token in part for part in p.full_name.lower().split()) for token in tokens if len(token) >= 2)
        ]
        return matched[:limit]
    q = Q(organization=organization, is_active=True)
    for token in tokens:
        if len(token) >= 2:
            q &= Q(full_name__icontains=token)
    return list(Person.objects.filter(q).distinct()[:limit])


# ---------------------------------------------------------------------------
# Confidence scoring
# ---------------------------------------------------------------------------

def _mentions(text: str, phrase: str) -> bool:
    if not phrase or not text:
        return False
    return phrase.lower() in text.lower()


def _keyword_hit(text: str, phrase: str) -> bool:
    """True when a significant token of `phrase` appears in `text`
    (token-level substring match, tolerant of inflections like
    "developing" vs "development").
    """
    if not phrase or not text:
        return False
    tokens = {t for t in re.findall(r"[a-z]+", text.lower()) if len(t) >= 4}
    phrase_tokens = [t for t in re.findall(r"[a-z]+", phrase.lower()) if len(t) >= 4]
    if not phrase_tokens:
        return False
    for pt in phrase_tokens:
        for token in tokens:
            if pt in token or token in pt:
                return True
    return False


def compute_confidence(
    candidate: Person,
    mentioned_name: str,
    *,
    context: str = "",
    transcript: str = "",
    participant_ids: Optional[set] = None,
    org_departments: Optional[set] = None,
) -> tuple[float, str]:
    """Full confidence computation for a (candidate, mentioned_name) pair."""
    if not candidate or not mentioned_name:
        return 0.0, "No name provided."

    reasons: list[str] = []
    score = name_similarity(candidate.full_name, mentioned_name)

    if score <= 0.0:
        return 0.0, "Name does not match any known person."

    reasons.append(f"Name match ({score:.0%})")

    haystack = f"{context} {transcript}".lower() if (context or transcript) else ""

    # Department overlap in surrounding context.
    if candidate.department:
        if _keyword_hit(haystack, candidate.department):
            score += 0.12
            reasons.append(f"Context mentions {candidate.department}")
        elif org_departments:
            # Context references a different department — negative signal.
            other_departments = {d for d in org_departments if d and d != candidate.department}
            if any(_keyword_hit(haystack, d) for d in other_departments):
                score -= 0.18
                reasons.append("Context mentions a different department")

    # Designation overlap.
    if candidate.designation:
        if _keyword_hit(haystack, candidate.designation):
            score += 0.08
            reasons.append(f"Context mentions {candidate.designation}")

    # Meeting participant signal.
    if participant_ids and candidate.id in participant_ids:
        score += 0.10
        reasons.append("Attended this meeting")

    return round(max(0.0, min(1.0, score)), 2), "; ".join(reasons)


def best_match(
    organization,
    mentioned_name: str,
    *,
    context: str = "",
    transcript: str = "",
    participant_ids: Optional[set] = None,
    people: Optional[list[Person]] = None,
) -> MatchResult:
    """Resolve a mentioned name to its best candidate with confidence.

    Returns an unassigned MatchResult (person=None) when the best
    candidate falls below the configured threshold or when no candidate
    exists — the caller must then request host confirmation.

    Pass `people` (the pre-loaded organization roster) to avoid one query
    per mention/task during batch analysis.
    """
    threshold = settings.AI_CONFIDENCE_THRESHOLD
    candidates = find_candidates(organization, mentioned_name, people=people)
    if not candidates:
        return MatchResult(None, 0.0, "No matching person found in the organization.")

    org_departments = {
        p.department.strip()
        for p in candidates
        if p.department and p.department.strip()
    }
    scored = [
        (
            compute_confidence(
                c,
                mentioned_name,
                context=context,
                transcript=transcript,
                participant_ids=participant_ids,
                org_departments=org_departments,
            ),
            c,
        )
        for c in candidates
    ]
    scored.sort(key=lambda item: item[0][0], reverse=True)
    (confidence, reason), best = scored[0]

    if confidence >= threshold:
        return MatchResult(best, confidence, reason)

    return MatchResult(None, confidence, f"Confidence too low for automatic assignment ({confidence:.0%}). {reason}")
