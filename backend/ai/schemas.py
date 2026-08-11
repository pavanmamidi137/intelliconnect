"""
Validation contracts for AI-generated content.

The backend never blindly trusts provider output: every response is
parsed and validated against these schemas before anything is saved.
"""

from datetime import date
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class ExtractedTask(BaseModel):
    mentioned_name: str = Field(default="", max_length=255)
    task: str = Field(min_length=1, max_length=1000)
    deadline: Optional[date] = None
    context: str = Field(default="", max_length=2000)

    @field_validator("mentioned_name", "task", "context")
    @classmethod
    def strip_text(cls, value):
        return (value or "").strip()


class ExtractedMention(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    context: str = Field(default="", max_length=2000)

    @field_validator("name", "context")
    @classmethod
    def strip_text(cls, value):
        return (value or "").strip()


class MeetingAnalysis(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    summary: str = Field(min_length=1, max_length=3000)
    paragraph_summary: str = Field(min_length=1, max_length=12000)
    key_points: list[str] = Field(default_factory=list, max_length=30)
    decisions: list[str] = Field(default_factory=list, max_length=30)
    tasks: list[ExtractedTask] = Field(default_factory=list, max_length=50)
    people_mentioned: list[ExtractedMention] = Field(default_factory=list, max_length=50)

    @field_validator("title", "summary", "paragraph_summary")
    @classmethod
    def strip_text(cls, value):
        return (value or "").strip()

    @field_validator("key_points", "decisions")
    @classmethod
    def clean_bullets(cls, values):
        cleaned = []
        for item in values:
            if isinstance(item, str) and item.strip():
                cleaned.append(item.strip())
        return cleaned


class ProviderStatus(BaseModel):
    """Readiness info for the AI settings page (never includes keys)."""

    name: str
    configured: bool
    available: bool
    model: str = ""
    detail: str = ""
