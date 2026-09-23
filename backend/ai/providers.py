"""
Provider-independent AI architecture.

Providers implement a common interface — structured JSON generation from
a prompt plus a JSON schema. The active provider order is driven by
environment configuration (AI_PRIMARY_PROVIDER / AI_SECONDARY_PROVIDER /
AI_FALLBACK_CHAIN) and providers are resolved at call time so failures
can fall through to the next configured provider.

Supported providers:
  * groq     — Groq (primary, OpenAI-compatible chat completions)
  * cerebras — Cerebras (secondary, OpenAI-compatible chat completions)
  * gemini   — Google Gemini (optional, native REST API)
  * openai   — OpenAI (optional, chat completions)
  * nvidia   — NVIDIA (optional, hosted NIM — requires SSE streaming)
  * demo     — deterministic development-only provider, never enabled in
               production deployments (requires AI_ENABLE_DEMO=true)

API keys are read from environment variables only; they are never
exposed to the frontend.
"""

import json
import re
import time
from abc import ABC, abstractmethod
from typing import Callable, Optional

import httpx
from django.conf import settings

from config.exceptions import AIOutputError, AIProviderError
from .schemas import MeetingAnalysis

# ---------------------------------------------------------------------------
# System prompt — instructs providers to return strictly structured JSON.
# ---------------------------------------------------------------------------

ANALYSIS_SYSTEM_PROMPT = """You are IntelliConnect's meeting intelligence engine. \
You convert raw meeting transcripts into structured, factual meeting intelligence.

Follow these rules strictly:
1. Return ONLY valid JSON. No markdown, no code fences, no commentary.
2. The JSON must exactly match the schema described below.
3. Base every claim on the transcript. Do not invent facts, people, or tasks.
4. Extract tasks ONLY when someone is clearly responsible for an action item.
5. For each task, set `mentioned_name` to the person's name exactly as it \
appears in the transcript.
6. `deadline` must be an ISO date (YYYY-MM-DD) ONLY if a deadline is mentioned; \
otherwise null.
7. `context` for each task should be a short phrase describing the surrounding \
discussion (topic, department, project).
8. `people_mentioned` lists every person name mentioned with a short context \
snippet (one sentence).
9. `key_points` should contain 3-8 concise bullet points.
10. `decisions` should contain 0-6 explicit decisions that were made.
11. `title` is a short descriptive meeting title inferred from the content.
12. If the transcript is empty or unreadable, set all fields to empty values.

JSON schema:
{
  "title": "string",
  "summary": "string (2-4 sentence bullet-free summary)",
  "paragraph_summary": "string (5-8 sentence detailed paragraph summary)",
  "key_points": ["string"],
  "decisions": ["string"],
  "tasks": [
    {
      "mentioned_name": "string",
      "task": "string",
      "deadline": "YYYY-MM-DD or null",
      "context": "string"
    }
  ],
  "people_mentioned": [
    {"name": "string", "context": "string"}
  ]
}"""


def _strip_json_fences(raw: str) -> str:
    """Remove markdown code fences a provider may have added anyway."""
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```[a-zA-Z]*\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


def _api_error_message(response, fallback, limit: int = 200) -> str:
    """Best-effort short human-readable reason from a provider error body."""
    try:
        payload = response.json()
    except ValueError:
        payload = None
    message = ""
    if isinstance(payload, dict):
        error = payload.get("error") or payload
        if isinstance(error, dict):
            message = error.get("message") or ""
    message = " ".join(str(message).strip().split())
    if not message and response.text:
        message = " ".join(response.text.strip().split())
    return (message or fallback)[:limit]


def _collect_stream_content(response: httpx.Response) -> str:
    """Aggregate `content` deltas from an OpenAI-style SSE stream."""
    parts = []
    try:
        for line in response.iter_lines():
            line = line.strip()
            if not line.startswith("data:"):
                continue
            data = line[len("data:"):].strip()
            if not data or data == "[DONE]":
                continue
            try:
                chunk = json.loads(data)
            except (TypeError, ValueError):
                continue
            choices = chunk.get("choices") or []
            if not choices:
                continue
            delta = choices[0].get("delta") or {}
            text = delta.get("content")
            if isinstance(text, str) and text:
                parts.append(text)
    finally:
        response.close()
    joined = "".join(parts).strip()
    if not joined:
        raise AIOutputError("The AI provider returned an empty response. Please retry.")
    return joined


class BaseProvider(ABC):
    name = "base"
    label = "Base"

    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model

    @property
    def configured(self) -> bool:
        return bool(self.api_key)

    @abstractmethod
    def generate_structured(self, user_prompt: str, temperature: float = 0.2) -> MeetingAnalysis:
        ...

    def _parse(self, raw: str) -> MeetingAnalysis:
        try:
            payload = json.loads(_strip_json_fences(raw))
        except json.JSONDecodeError as exc:
            raise AIOutputError(
                f"The AI provider returned malformed JSON ({exc}). Your transcript is safe. Please retry."
            ) from exc
        if not isinstance(payload, dict):
            raise AIOutputError("The AI provider returned an unexpected result. Please retry.")
        try:
            return MeetingAnalysis.model_validate(payload)
        except Exception as exc:
            raise AIOutputError(
                f"The AI output did not pass validation ({exc}). Your transcript is safe. Please retry."
            ) from exc


def _retry(fn: Callable[[], httpx.Response], attempts: int = 2, base_delay: float = 1.0) -> httpx.Response:
    """Retry transient provider failures (429/5xx) with exponential backoff."""
    last_exc: Optional[Exception] = None
    for attempt in range(attempts):
        try:
            response = fn()
            if response.status_code in (429, 500, 502, 503, 504):
                retry_after = None
                try:
                    retry_after = int(response.headers.get("retry-after", ""))
                except (TypeError, ValueError):
                    retry_after = None
                delay = retry_after if retry_after and retry_after <= 30 else base_delay * (2 ** attempt)
                if attempt < attempts - 1:
                    time.sleep(delay)
                    continue
            response.raise_for_status()
            return response
        except httpx.HTTPStatusError as exc:
            last_exc = exc
            if exc.response.status_code not in (429, 500, 502, 503, 504) or attempt >= attempts - 1:
                raise
            time.sleep(base_delay * (2 ** attempt))
        except httpx.HTTPError as exc:
            last_exc = exc
            if attempt >= attempts - 1:
                raise
            time.sleep(base_delay * (2 ** attempt))
    raise last_exc  # pragma: no cover - unreachable, satisfies typing


class OpenAICompatibleProvider(BaseProvider):
    """Shared implementation for Groq / Cerebras / OpenAI chat completions."""

    api_url = ""
    default_model = ""

    def generate_structured(self, user_prompt, temperature=0.2) -> MeetingAnalysis:
        if not self.configured:
            raise AIProviderError(
                f"The {self.label} provider is not configured. Add its API key to the backend environment."
            )
        try:
            with httpx.Client(
                timeout=httpx.Timeout(settings.AI_PROVIDER_TIMEOUT_SECONDS, connect=10.0)
            ) as client:
                def _call():
                    return client.post(
                        self.api_url,
                        headers={
                            "Authorization": f"Bearer {self.api_key}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "model": self.model,
                            "temperature": temperature,
                            "response_format": {"type": "json_object"},
                            "messages": [
                                {"role": "system", "content": ANALYSIS_SYSTEM_PROMPT},
                                {"role": "user", "content": user_prompt},
                            ],
                        },
                    )

                response = _retry(_call)
                content = response.json()["choices"][0]["message"]["content"]
        except httpx.HTTPStatusError as exc:
            detail = _api_error_message(exc.response, f"HTTP {exc.response.status_code}")
            raise AIProviderError(
                f"{self.label} returned an error: {detail} (HTTP {exc.response.status_code}). Please retry."
            ) from exc
        except httpx.HTTPError as exc:
            raise AIProviderError(f"Could not reach {self.label}. Please retry.") from exc
        except (KeyError, IndexError, TypeError) as exc:
            raise AIOutputError(f"{self.label} returned an unexpected result. Please retry.") from exc
        return self._parse(content)


class GroqProvider(OpenAICompatibleProvider):
    name = "groq"
    label = "Groq"
    api_url = "https://api.groq.com/openai/v1/chat/completions"


class CerebrasProvider(OpenAICompatibleProvider):
    name = "cerebras"
    label = "Cerebras"
    api_url = "https://api.cerebras.ai/v1/chat/completions"


class OpenAIProvider(OpenAICompatibleProvider):
    name = "openai"
    label = "OpenAI"
    api_url = "https://api.openai.com/v1/chat/completions"


class NvidiaProvider(OpenAICompatibleProvider):
    name = "nvidia"
    label = "NVIDIA"
    api_url = "https://integrate.api.nvidia.com/v1/chat/completions"

    def __init__(self, api_key: str, model: str):
        super().__init__(api_key, model)
        self.max_tokens = settings.NVIDIA_MAX_TOKENS

    def generate_structured(self, user_prompt, temperature=0.2) -> MeetingAnalysis:
        if not self.configured:
            raise AIProviderError(
                "The NVIDIA provider is not configured. Add NVIDIA_API_KEY to the backend environment."
            )
        # NVIDIA's hosted endpoint only reliably serves *streaming* completions:
        # a non-streaming (stream=false) request is accepted but never answered,
        # timing out the request every time. Stream the SSE response and merge
        # the `content` deltas instead.
        payload = {
            "model": self.model,
            "temperature": temperature,
            "max_tokens": self.max_tokens,
            "stream": True,
            "response_format": {"type": "json_object"},
            "chat_template_kwargs": {"enable_thinking": False},
            "messages": [
                {"role": "system", "content": ANALYSIS_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
        }
        try:
            # Streaming disables the overall deadline; each read still gets its
            # own timeout so an idle/garbage stream fails instead of hanging.
            with httpx.Client(
                timeout=httpx.Timeout(None, connect=10.0, read=settings.NVIDIA_STREAM_TIMEOUT_SECONDS)
            ) as client:
                def _call():
                    request = client.build_request(
                        "POST",
                        self.api_url,
                        headers={
                            "Authorization": f"Bearer {self.api_key}",
                            "Content-Type": "application/json",
                            "Accept": "text/event-stream",
                        },
                        json=payload,
                    )
                    response = client.send(request, stream=True)
                    if response.status_code in (429, 500, 502, 503, 504):
                        # Drop transient responses so their connection isn't held
                        # open while the retry loop backs off.
                        response.close()
                    return response

                # Attempt once: a read timeout means NVIDIA hasn't streamed any
                # bytes within the budget, and retrying would double an already
                # several-minute wait. Single attempt keeps the failure path fast.
                response = _retry(_call, attempts=1)
                content = _collect_stream_content(response)
        except httpx.HTTPStatusError as exc:
            detail = _api_error_message(exc.response, f"HTTP {exc.response.status_code}")
            raise AIProviderError(
                f"{self.label} returned an error: {detail} (HTTP {exc.response.status_code}). Please retry."
            ) from exc
        except httpx.HTTPError as exc:
            raise AIProviderError(f"Could not reach {self.label}. Please retry.") from exc
        except (KeyError, IndexError, TypeError) as exc:
            raise AIOutputError(f"{self.label} returned an unexpected result. Please retry.") from exc
        return self._parse(content)


class GeminiProvider(BaseProvider):
    name = "gemini"
    label = "Gemini"

    @staticmethod
    def _extract_text(payload: dict) -> str:
        candidates = payload.get("candidates") or []
        if not candidates:
            raise AIOutputError("Gemini returned no candidates. Please retry.")

        parts = (candidates[0].get("content") or {}).get("parts") or []
        for part in parts:
            if isinstance(part, dict) and part.get("thought"):
                continue
            text = part.get("text") if isinstance(part, dict) else None
            if isinstance(text, str) and text.strip():
                return text

        raise AIOutputError("Gemini returned no analyzable text. Please retry.")

    def generate_structured(self, user_prompt, temperature=0.2) -> MeetingAnalysis:
        if not self.configured:
            raise AIProviderError(
                "The Gemini provider is not configured. Add GEMINI_API_KEY to the backend environment."
            )
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}"
            f":generateContent"
        )
        combined = f"{ANALYSIS_SYSTEM_PROMPT}\n\nTranscript to analyze:\n{user_prompt}"
        # A capped thinking budget dramatically cuts latency on Gemini 2.x
        # thinking models (128 vs unset ≈ 40% faster) at a modest quality
        # cost — configurable via GEMINI_THINKING_BUDGET.
        generation_config = {
            "temperature": temperature,
            "responseMimeType": "application/json",
        }
        if settings.GEMINI_THINKING_BUDGET:
            generation_config["thinkingConfig"] = {
                "thinkingBudget": settings.GEMINI_THINKING_BUDGET
            }
        try:
            with httpx.Client(
                timeout=httpx.Timeout(settings.AI_PROVIDER_TIMEOUT_SECONDS, connect=10.0)
            ) as client:
                def _call():
                    return client.post(
                        url,
                        params={"key": self.api_key},
                        json={
                            "contents": [{"parts": [{"text": combined}]}],
                            "generationConfig": generation_config,
                        },
                    )

                response = _retry(_call)
                text = self._extract_text(response.json())
        except httpx.HTTPStatusError as exc:
            detail = _api_error_message(exc.response, f"HTTP {exc.response.status_code}")
            raise AIProviderError(
                f"{self.label} returned an error: {detail} (HTTP {exc.response.status_code}). Please retry."
            ) from exc
        except httpx.HTTPError as exc:
            raise AIProviderError("Could not reach Gemini. Please retry.") from exc
        except (KeyError, IndexError, TypeError) as exc:
            raise AIOutputError("Gemini returned an unexpected result. Please retry.") from exc
        return self._parse(text)


class DemoProvider(BaseProvider):
    """Development-only deterministic provider.

    Produces a clearly-structured analysis from template content so the
    full product flow can be exercised without external API keys. It is
    only reachable when AI_ENABLE_DEMO=true is set explicitly; the UI
    labels demo-processed meetings accordingly and it is never part of a
    production fallback chain.
    """

    name = "demo"
    label = "Demo (development only)"

    @property
    def configured(self):
        return settings.AI_ENABLE_DEMO

    def generate_structured(self, user_prompt, temperature=0.2) -> MeetingAnalysis:
        if not self.configured:
            raise AIProviderError("Demo provider is disabled. Set AI_ENABLE_DEMO=true to enable.")
        # Deterministic, schema-valid output derived from the transcript
        # so review flow and PDF generation can be exercised end-to-end.
        excerpt = user_prompt.strip().splitlines()[:12]
        excerpt_text = " ".join(line.strip() for line in excerpt if line.strip())[:400]
        return MeetingAnalysis(
            title="Q3 Planning Review",
            summary=(
                "The team reviewed the current quarter's progress and agreed on next steps. "
                "Key decisions covered the feature roadmap and documentation priorities."
            ),
            paragraph_summary=(
                "This meeting (processed in development demo mode) reviewed the quarter's "
                "roadmap. Participants aligned on the upcoming release scope, discussed "
                "responsibilities for documentation and API work, and agreed on timelines. "
                "Action items were assigned to named individuals with clear owners."
            ),
            key_points=[
                "Roadmap priorities for the next quarter were agreed.",
                "API documentation needs to be refreshed before release.",
                "Design review for the new onboarding flow is scheduled.",
            ],
            decisions=[
                "Feature scope for the next release was finalized.",
                "API documentation will be prioritized before launch.",
            ],
            tasks=[
                {
                    "mentioned_name": "Ravi Kumar",
                    "task": "Prepare API documentation",
                    "deadline": None,
                    "context": "Backend API development discussion",
                },
                {
                    "mentioned_name": "Priya Sharma",
                    "task": "Schedule design review for onboarding flow",
                    "deadline": None,
                    "context": "Product design and onboarding discussion",
                },
            ],
            people_mentioned=[
                {"name": "Ravi Kumar", "context": "Backend API development discussion"},
                {"name": "Priya Sharma", "context": "Product design review discussion"},
            ],
        )


# ---------------------------------------------------------------------------
# Registry / resolution
# ---------------------------------------------------------------------------

_PROVIDER_CLASSES = {
    "groq": GroqProvider,
    "cerebras": CerebrasProvider,
    "gemini": GeminiProvider,
    "openai": OpenAIProvider,
    "nvidia": NvidiaProvider,
    "demo": DemoProvider,
}


def build_provider(name: str) -> BaseProvider:
    cls = _PROVIDER_CLASSES.get((name or "").lower())
    if cls is None:
        raise AIProviderError(f"Unknown AI provider: {name}")
    return cls(api_key=_env_key(cls), model=_env_model(cls))


def _env_key(cls) -> str:
    key_map = {
        GroqProvider: settings.GROQ_API_KEY,
        CerebrasProvider: settings.CEREBRAS_API_KEY,
        GeminiProvider: settings.GEMINI_API_KEY,
        OpenAIProvider: settings.OPENAI_API_KEY,
        NvidiaProvider: settings.NVIDIA_API_KEY,
        DemoProvider: "",
    }
    return key_map.get(cls, "")


def _env_model(cls) -> str:
    model_map = {
        GroqProvider: settings.GROQ_MODEL,
        CerebrasProvider: settings.CEREBRAS_MODEL,
        GeminiProvider: settings.GEMINI_MODEL,
        OpenAIProvider: settings.OPENAI_MODEL,
        NvidiaProvider: settings.NVIDIA_MODEL,
        DemoProvider: "demo",
    }
    return model_map.get(cls, "")


def resolve_chain() -> list[BaseProvider]:
    """Return the ordered list of usable providers (configured ones first)."""
    configured, unconfigured = [], []
    for name in settings.AI_PROVIDER_ORDER:
        try:
            provider = build_provider(name)
        except AIProviderError:
            continue
        if name == "demo":
            if provider.configured:
                configured.append(provider)
            continue
        (configured if provider.configured else unconfigured).append(provider)
    return configured + unconfigured


def provider_statuses() -> list[dict]:
    """Readiness of every provider for the AI settings page (no keys)."""
    statuses = []
    for name in ["groq", "cerebras", "gemini", "openai", "nvidia"]:
        provider = build_provider(name)
        statuses.append(
            {
                "name": provider.name,
                "label": provider.label,
                "configured": provider.configured,
                "available": provider.configured,
                "model": provider.model,
                "detail": "" if provider.configured else "Add the API key in the backend environment.",
            }
        )
    return statuses


def active_provider_name() -> Optional[str]:
    chain = resolve_chain()
    return chain[0].name if chain else None
