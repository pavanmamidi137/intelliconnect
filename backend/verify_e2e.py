"""End-to-end verification of the full production-style stack.

Exercises: register (Supabase Postgres) → add people → create meeting with
transcript upload (Supabase Storage) → AI processing (Gemini) → review →
generate report (PDF to Supabase Storage) → signed-URL download.

Unlike smoke_test.py this does NOT assume deterministic demo output.
"""

import io
import json
import sys
import time
import uuid

import httpx

BASE = "http://127.0.0.1:8000/api"
client = httpx.Client(timeout=180.0)

TRANSCRIPT = """Project Alpha Planning Meeting — August 5, 2026

Ravi Kumar (Development): We need to finalize the backend API before the release.
Priya Sharma (Design): I can handle the onboarding design review.
Ravi Kumar: I will prepare the API documentation by next Friday.
Decision: The release scope is locked for September.
Action items: Ravi to prepare API docs, Priya to schedule the design review.
"""


def check(step, response, ok_status=(200, 201, 202)):
    ok = response.status_code in ok_status
    print(f"{'PASS' if ok else 'FAIL'} [{response.status_code}] {step}")
    if not ok:
        print(response.text[:600])
        sys.exit(1)
    return response.json()


suffix = uuid.uuid4().hex[:6]
email = f"e2e-{suffix}@demo.io"

# 1. Register (writes to Supabase Postgres)
r = check("register (Supabase Postgres)", client.post(f"{BASE}/auth/register/", json={
    "full_name": "E2E Host", "email": email, "password": "strong-pass-123",
    "confirm_password": "strong-pass-123", "organization_name": f"E2E Org {suffix}",
    "organization_type": "company",
}))
headers = {"Authorization": f"Bearer {r['access']}"}

# 2. People
p1 = check("create person Ravi (Development)", client.post(f"{BASE}/people/", headers=headers,
           json={"full_name": "Ravi Kumar", "department": "Development", "designation": "Senior Developer"}))
p2 = check("create person Ravi (HR)", client.post(f"{BASE}/people/", headers=headers,
           json={"full_name": "Ravi Kumar", "department": "HR", "designation": "HR Manager"}))
p3 = check("create person Priya", client.post(f"{BASE}/people/", headers=headers,
           json={"full_name": "Priya Sharma", "department": "Design", "designation": "Product Designer"}))

# 3. Meeting + transcript upload (writes to Supabase Storage)
r = check("create meeting + upload", client.post(f"{BASE}/meetings/", headers=headers, files={
    "title": (None, "Project Alpha Planning"),
    "meeting_date": (None, "2026-08-05"),
    "meeting_type": (None, "meeting"),
    "participant_ids": (None, json.dumps([p1["id"], p2["id"], p3["id"]])),
    "transcript": ("transcript.txt", io.BytesIO(TRANSCRIPT.encode()), "text/plain"),
}))
meeting_id = r["id"]
print(f"  -> meeting {meeting_id} status={r['status']} transcript={r['transcript_name']}")

# 4. Process with real Gemini
check("start processing (Gemini)", client.post(f"{BASE}/meetings/{meeting_id}/process/", headers=headers))
detail = None
for _ in range(120):
    detail = client.get(f"{BASE}/meetings/{meeting_id}/", headers=headers).json()
    if detail["status"] not in ("processing", "draft"):
        break
    time.sleep(2)
print(f"  -> final status: {detail['status']}")
if detail["status"] == "failed":
    print("  -> ANALYSIS FAILED. Check the AI provider / prompt.")
    sys.exit(1)
assert detail["status"] in ("review_required", "completed"), detail["status"]
print(f"  -> tasks={len(detail['tasks'])} key_points={len(detail['key_points'])} "
      f"decisions={len(detail['decisions'])} mentions={len(detail['mentions'])}")

# 5. Generate report (PDF to Supabase Storage)
r = check("generate report (PDF)", client.post(
    f"{BASE}/meetings/{meeting_id}/generate-report/", headers=headers, json={
        "tasks": [{"id": t["id"], "person": t["person"], "task": t["task"],
                   "deadline": t["deadline"], "priority": t["priority"],
                   "status": t["status"], "context": t["context"]} for t in detail["tasks"]],
    }))
print(f"  -> report {r.get('report_id')}")

# 6. Reports + signed URL download
r = check("reports list", client.get(f"{BASE}/reports/", headers=headers))
report = r["results"][0]
r = check("report download url", client.get(f"{BASE}/reports/{report['id']}/download/", headers=headers))
url = r["url"]
is_signed = url.startswith("http")
print(f"  -> download URL is {'signed (Supabase)' if is_signed else 'relative (local)'}")
pdf = client.get(url, headers=headers if not is_signed else None)
assert pdf.status_code == 200 and pdf.content[:4] == b"%PDF", f"not a PDF: {pdf.status_code}"
print(f"  -> PDF downloaded ({len(pdf.content)} bytes)")

# 7. Verify files exist in Supabase Storage
from dotenv import load_dotenv
load_dotenv()
import os
from supabase import create_client

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))
org_id = detail["organization"]
transcript_files = supabase.storage.from_("meeting-files").list(f"meeting-files/{org_id}/{meeting_id}/transcript")
print(f"  -> transcript file in storage: {[f['name'] for f in transcript_files]}")
report_files = supabase.storage.from_("meeting-files").list(f"meeting-files/{org_id}/{meeting_id}/reports")
print(f"  -> report file in storage: {[f['name'] for f in report_files]}")

print("\nE2E VERIFICATION PASSED (Supabase Postgres + Storage + Gemini)")
