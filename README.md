# IntelliConnect

**Turn Every Conversation Into Action.**

AI-powered meeting intelligence for smarter conversations, clearer decisions,
and accountable execution. IntelliConnect turns meeting transcripts into
structured summaries, key points, decisions, person-matched tasks, and
professional PDF reports.

## Architecture

```
intelliconnect/
├── frontend/   Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 ·
│               shadcn-style components · Framer Motion · RHF + Zod
└── backend/    Django 6 · DRF · JWT (simplejwt) · Supabase PostgreSQL ·
                Supabase Storage · provider-independent AI · reportlab PDFs
```

| Layer       | Technology |
|-------------|------------|
| Frontend    | Next.js App Router, React, TypeScript, Tailwind CSS, Lucide, Framer Motion, React Hook Form, Zod, TanStack Query |
| Backend     | Django, Django REST Framework, JWT auth, Django ORM |
| Database    | Supabase PostgreSQL (pooled connection) |
| File storage| Supabase Storage (private `meeting-files` bucket) |
| AI          | Provider-independent: Groq (primary), Cerebras (secondary), Gemini, OpenAI — all optional |
| PDF         | reportlab (backend-generated) |
| Background  | Celery + Redis when configured; in-process threads otherwise |

## Quick start

### 1. Environment files

```bash
cp backend/.env.example backend/.env      # fill in real values
cp frontend/.env.example frontend/.env.local
```

Key backend variables:

```dotenv
# Supabase Postgres — use the IPv4 pooler on machines without IPv6
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres

# Supabase Storage (bucket is created automatically as private)
STORAGE_BACKEND=supabase
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # server-side only, never in the browser
SUPABASE_STORAGE_BUCKET=meeting-files

# AI providers — keys are optional; unconfigured providers are skipped
AI_PRIMARY_PROVIDER=groq
AI_SECONDARY_PROVIDER=cerebras
GEMINI_API_KEY=...
```

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt   # Windows
# .venv/bin/pip install -r requirements.txt               # POSIX

# Migrate against Supabase (session-mode pooler for DDL)
DATABASE_URL="postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:5432/postgres" \
  .venv/Scripts/python manage.py migrate

.venv/Scripts/python manage.py runserver 0.0.0.0:8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev -- -p 3000
```

Open http://localhost:3000, register your workspace, add people, upload a
meeting transcript, review the AI output, and generate the PDF report.

## Core workflow

```
Landing → Register → Add People → Create Meeting → Upload Transcript
(or paste it) → AI Analysis → Person Matching → Review & Confirm → PDF Report → Reports
```

Meetings accept a transcript **file** (TXT/PDF/DOCX/SRT/VTT), **pasted
transcript text** (stored as a TXT transcript), audio, or none of the above
(draft). Creating a meeting with a transcript starts analysis immediately.

Key product rules:

- **Names are never unique identifiers.** Every person has a UUID; duplicate
  names (e.g. two "Ravi Kumar") are resolved with department, designation,
  meeting-participant, and task-context signals plus a confidence score.
- **No silent assignments.** Tasks below the configurable confidence
  threshold (`AI_CONFIDENCE_THRESHOLD`, default 0.75) require host
  confirmation on the review screen.
- **AI output is validated.** Provider responses are checked against a
  pydantic schema before anything is persisted.
- **Progress is real.** The processing screen reflects the backend's actual
  pipeline stage, never faked progress.

## Roles & dashboards

Every account has a role: **host** (created through registration, manages
one organization) or **superadmin** (platform-level app management;
`admin` is accepted as a legacy alias).

- **Host dashboard** — `/dashboard`. Scoped to the signed-in host's own
  organization: real meeting/task/people/report stats plus recent meetings
  and open tasks. Every host sees their own data; the backend filters every
  query by organization.
- **Admin dashboard** — `/admin`. Platform-wide app management: totals
  across organizations, users, people, meetings, tasks, and reports,
  meetings/tasks by status, AI provider status, and searchable management
  tables for organizations and users. Requires the `superadmin` role;
  cross-role access redirects automatically.
- **Brand & Design** (Settings → superadmin only) — change the platform
  theme color, accent, light/dark backgrounds, corner radius and body font.
  Saved themes apply instantly to every user via CSS variables and the
  browser-tab icon follows the brand. GET `/api/settings/theme/` is public;
  PUT/reset require the super-admin role.

Create a platform admin with:

```bash
cd backend
.venv/Scripts/python manage.py create_admin \
  --email admin@example.com --password <strong-password> --full-name "Platform Admin"
```

## API surface

```
POST /api/auth/register/          POST /api/auth/login/
POST /api/auth/otp/request/       POST /api/auth/otp/verify/   (passwordless login)
POST /api/auth/logout/            POST /api/auth/refresh/
GET|PATCH /api/profile/           POST /api/profile/password/
GET|PATCH /api/organization/
GET|POST /api/people/             GET|PATCH|DELETE /api/people/<id>/
POST /api/people/import/          GET /api/people/facets/
GET|POST /api/meetings/           GET|PATCH|DELETE /api/meetings/<id>/
POST /api/meetings/<id>/process/  GET /api/meetings/<id>/status/
GET /api/meetings/<id>/review/    GET /api/meetings/<id>/transcript/
POST /api/meetings/<id>/generate-report/
GET /api/settings/theme/          PUT /api/settings/theme/   (superadmin)
GET|POST /api/tasks/              GET|PATCH|DELETE /api/tasks/<id>/
GET /api/reports/                 GET /api/reports/<id>/download/
```

All endpoints are organization-scoped server-side; cross-organization access
returns 404. Secrets (service-role key, AI keys) never reach the browser.

## Security model

- JWT access + rotating refresh tokens (blacklist on logout), PBKDF2 password
  hashing.
- Organization-level data isolation on every queryset.
- File type/size validation for transcript (TXT/PDF/DOCX/SRT/VTT) and audio
  (MP3/WAV/M4A) uploads.
- Private Supabase bucket; downloads served via signed URLs generated with
  the service-role key through Django.
- Consistent, friendly error envelopes — no stack traces reach clients.

## Storage layout (Supabase bucket: `meeting-files`)

```
meeting-files/
    organization-id/
        meeting-id/
            transcript/   # uploaded transcripts
            audio/        # optional recordings
            reports/      # generated PDFs
```

## Development extras

| Script (backend/) | Purpose |
|---|---|
| `verify_supabase.py` | Checks Postgres, storage bucket, and AI provider connectivity |
| `verify_e2e.py` | Full end-to-end flow against the real stack |
| `smoke_test.py` | Deterministic flow (requires `AI_ENABLE_DEMO=true`) |
| `cleanup_test_data.py` | Removes E2E test data and stored files |

Run `AI_ENABLE_DEMO=true` to exercise the whole product offline without API
keys (the demo provider is development-only and clearly labeled).

## Deploy on Render

The repo ships a [`render.yaml`](render.yaml) blueprint with two services:

1. **intelliconnect-api** — Django REST API (`gunicorn`, static served via
   Whitenoise). Database, storage, and AI stay on Supabase / your chosen
   AI provider.
2. **intelliconnect-web** — Next.js frontend (`npm start`), with
   `NEXT_PUBLIC_API_URL` pointed at the API service.

Steps:

1. Push this repository to GitHub.
2. In the Render dashboard: **New → Blueprint**, pick the repo, and confirm
   the two services.
3. Set the API service's secret environment variables (Render dashboard →
   Service → Environment): `SECRET_KEY`, `DATABASE_URL` (your Supabase
   pooler string), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and your AI
   provider key(s) — `GEMINI_API_KEY` when `AI_PRIMARY_PROVIDER=gemini`.
   `FRONTEND_ORIGINS` defaults to the blueprint web service URL; adjust if
   you rename services or add a custom domain.
4. Deploy. The API runs migrations and `collectstatic` on every deploy;
   the frontend builds with the public `NEXT_PUBLIC_*` variables inlined.

Notes:

- **Load balancing & throughput.** Render's load balancer fronts the API
  service; gunicorn serves each worker process as an independent request
  handler. The start command honors `WEB_CONCURRENCY` (Render sets it from
  the instance size — raise it, or move to a paid plan, to scale request
  throughput). The database uses a pooled connection (`conn_max_age=600`)
  so workers share connections safely.
- Background AI/PDF jobs run in-process threads when no broker is
  configured (they do not block requests). For higher throughput, add a
  Render Redis instance and set `CELERY_BROKER_URL` / `CELERY_RESULT_BACKEND`.
- The service-role key, database password, and AI keys are never committed;
  they exist only as Render environment variables.
