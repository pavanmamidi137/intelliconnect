"""
Django settings for the IntelliConnect backend.

Secrets and provider configuration come exclusively from environment
variables / the .env file. Nothing sensitive is hard-coded here.
"""

import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Load backend/.env if present (never committed).
load_dotenv(BASE_DIR / ".env")


def env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in ("1", "true", "yes", "on")


def env_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except (TypeError, ValueError):
        return default


# ---------------------------------------------------------------------------
# Core Django
# ---------------------------------------------------------------------------

SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-insecure-key-change-me")

DEBUG = env_bool("DEBUG", False)

ALLOWED_HOSTS = [
    h.strip()
    for h in os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1,0.0.0.0").split(",")
    if h.strip()
]

# Django's default hashing is PBKDF2-SHA256 with a strong iteration count.
# Argon2 can be enabled by adding "django.contrib.auth.hashers.Argon2PasswordHasher"
# to the top of PASSWORD_HASHERS when production policy requires it.
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher",
]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    # IntelliConnect apps
    "accounts",
    "organizations",
    "people",
    "meetings",
    "tasks",
    "reports",
    "dashboard",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    # Serve Django's static files (admin assets) in production without a
    # separate web server.
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# ---------------------------------------------------------------------------
# Database — Supabase PostgreSQL in production, SQLite for local development.
# Set DATABASE_URL to a Supabase pooler/connection string to use Postgres.
# ---------------------------------------------------------------------------

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    import dj_database_url

    DATABASES = {"default": dj_database_url.parse(DATABASE_URL, conn_max_age=600)}
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---------------------------------------------------------------------------
# Auth — custom User (email login) + JWT
# ---------------------------------------------------------------------------

AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
     "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
    ),
    "DEFAULT_PAGINATION_CLASS": "config.pagination.StandardResultsSetPagination",
    "PAGE_SIZE": 20,
    "EXCEPTION_HANDLER": "config.exceptions.intelliconnect_exception_handler",
    "UNAUTHENTICATED_USER": "django.contrib.auth.models.AnonymousUser",
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=env_int("JWT_ACCESS_MINUTES", 60)),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=env_int("JWT_REFRESH_DAYS", 7)),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# ---------------------------------------------------------------------------
# CORS — the Next.js frontend is a separate origin.
# ---------------------------------------------------------------------------

FRONTEND_ORIGINS = [
    o.strip()
    for o in os.getenv("FRONTEND_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
    if o.strip()
]
CORS_ALLOWED_ORIGINS = FRONTEND_ORIGINS
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = ["DELETE", "GET", "OPTIONS", "PATCH", "POST", "PUT"]
CORS_ALLOW_HEADERS = ["accept", "authorization", "content-type", "origin", "user-agent", "x-csrftoken"]

# ---------------------------------------------------------------------------
# File storage — Supabase Storage in production, local disk for development.
# All privileged storage operations happen server-side; service-role keys
# are never exposed to the frontend.
# ---------------------------------------------------------------------------

STORAGE_BACKEND = os.getenv("STORAGE_BACKEND", "local").lower()
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "meeting-files")

MEDIA_ROOT = os.getenv("MEDIA_ROOT", str(BASE_DIR / "media"))
MEDIA_URL = "/media/"

# Upload limits (bytes)
MAX_TRANSCRIPT_SIZE = env_int("MAX_TRANSCRIPT_SIZE_MB", 20) * 1024 * 1024
MAX_AUDIO_SIZE = env_int("MAX_AUDIO_SIZE_MB", 200) * 1024 * 1024
ALLOWED_TRANSCRIPT_EXTENSIONS = {".txt", ".pdf", ".docx", ".srt", ".vtt"}
ALLOWED_AUDIO_EXTENSIONS = {".mp3", ".wav", ".m4a"}

# ---------------------------------------------------------------------------
# AI providers — provider-independent architecture. Keys come from env only.
# ---------------------------------------------------------------------------

AI_PRIMARY_PROVIDER = os.getenv("AI_PRIMARY_PROVIDER", "groq").lower()
AI_SECONDARY_PROVIDER = os.getenv("AI_SECONDARY_PROVIDER", "cerebras").lower()
AI_FALLBACK_CHAIN = [
    p.strip().lower()
    for p in os.getenv("AI_FALLBACK_CHAIN", "").split(",")
    if p.strip()
]
# Optional explicit list; falls back to [primary, secondary] when empty.
AI_PROVIDER_ORDER = AI_FALLBACK_CHAIN or [AI_PRIMARY_PROVIDER, AI_SECONDARY_PROVIDER]

# Development-only deterministic provider is appended as a last-resort
# fallback when explicitly enabled; real providers always win.
if env_bool("AI_ENABLE_DEMO", False) and "demo" not in AI_PROVIDER_ORDER:
    AI_PROVIDER_ORDER = AI_PROVIDER_ORDER + ["demo"]

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
CEREBRAS_API_KEY = os.getenv("CEREBRAS_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# Models (configurable, sensible defaults per provider)
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
CEREBRAS_MODEL = os.getenv("CEREBRAS_MODEL", "llama-3.3-70b")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-latest")
# Caps the model's internal thinking time (Gemini 2.x thinking models).
# A low budget (128-256) speeds responses up substantially; 0 is rejected
# by the API, and an empty value leaves the provider default.
GEMINI_THINKING_BUDGET = os.getenv("GEMINI_THINKING_BUDGET", "256")
try:
    GEMINI_THINKING_BUDGET = int(GEMINI_THINKING_BUDGET)
except (TypeError, ValueError):
    GEMINI_THINKING_BUDGET = None
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# Development-only deterministic provider. Never enabled in production
# deployments; requires AI_ENABLE_DEMO=true explicitly.
AI_ENABLE_DEMO = env_bool("AI_ENABLE_DEMO", False)

# Person-matching confidence threshold (0..1). Tasks/mentions below this
# threshold require host confirmation instead of silent assignment.
AI_CONFIDENCE_THRESHOLD = float(os.getenv("AI_CONFIDENCE_THRESHOLD", "0.75"))
# Cap on transcript characters sent to the AI provider. Lower = faster
# analysis; 30000 chars (~7.5k tokens) keeps full context for typical
# meetings. Override with AI_MAX_TRANSCRIPT_CHARS if needed.
AI_MAX_TRANSCRIPT_CHARS = env_int("AI_MAX_TRANSCRIPT_CHARS", 30000)

# ---------------------------------------------------------------------------
# Background processing — Celery + Redis when configured; otherwise AI and
# PDF jobs run synchronously so the product works out of the box.
# ---------------------------------------------------------------------------

CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "")
CELERY_TASK_ALWAYS_EAGER = not CELERY_BROKER_URL
CELERY_TASK_EAGER_PROPAGATES = True

# ---------------------------------------------------------------------------
# Internationalization / static
# ---------------------------------------------------------------------------

LANGUAGE_CODE = "en-us"
TIME_ZONE = os.getenv("TIME_ZONE", "UTC")
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Production hardening toggles (enabled through env in production).
if env_bool("ENABLE_HTTPS_REDIRECT", False):
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
if env_bool("ENABLE_HSTS", False):
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True

CSRF_TRUSTED_ORIGINS = FRONTEND_ORIGINS
