"""End-to-end API smoke test.

Exercises: register → add people (incl. duplicate names) → create meeting
with transcript upload → AI processing → review → generate report → download.
"""

import io
import json
import sys
import uuid

import httpx

BASE = "http://127.0.0.1:8000/api"
client = httpx.Client(timeout=120.0)

TRANSCRIPT = """Project Alpha Planning Meeting — August 5, 2026

Ravi Kumar: We need to finalize the backend API before the release.
Priya Sharma: I can handle the onboarding design review.
Ravi Kumar: I'll prepare the API documentation by next Friday.
Decision: The release scope is locked for September.
"""


def check(step, response, ok_status=(200, 201, 202)):
    ok = response.status_code in ok_status
    print(f"{'PASS' if ok else 'FAIL'} [{response.status_code}] {step}")
    if not ok:
        print(response.text[:500])
        sys.exit(1)
    return response.json()


# 1. Register ---------------------------------------------------------------
email = f"host-{uuid.uuid4().hex[:6]}@example.com"
r = check("register", client.post(f"{BASE}/auth/register/", json={
    "full_name": "Aisha Khan", "email": email, "password": "strong-pass-123",
    "confirm_password": "strong-pass-123", "organization_name": "Acme Labs",
    "organization_type": "startup", "designation": "Engineering Manager",
    "department": "Engineering",
}))
token = r["access"]
headers = {"Authorization": f"Bearer {token}"}
org_id = r["user"]["organization"]["id"]
print(f"  -> org={org_id}")

# 2. Login ------------------------------------------------------------------
r = check("login", client.post(f"{BASE}/auth/login/",
          json={"email": email, "password": "strong-pass-123"}))

# 3. People (duplicate names allowed) ---------------------------------------
ravi_dev = check("create person (Ravi Kumar, Development)", client.post(
    f"{BASE}/people/", headers=headers,
    json={"full_name": "Ravi Kumar", "department": "Development",
          "designation": "Senior Developer", "email": "ravi.dev@acme.io"}))
ravi_hr = check("create person (Ravi Kumar, HR)", client.post(
    f"{BASE}/people/", headers=headers,
    json={"full_name": "Ravi Kumar", "department": "HR",
          "designation": "HR Manager", "email": "ravi.hr@acme.io"}))
priya = check("create person (Priya Sharma)", client.post(
    f"{BASE}/people/", headers=headers,
    json={"full_name": "Priya Sharma", "department": "Design",
          "designation": "Product Designer"}))
print(f"  -> ravi_dev={ravi_dev['id']} ravi_hr={ravi_hr['id']}")

# 4. Search + duplicate-name integrity --------------------------------------
r = check("search people 'Ravi'", client.get(f"{BASE}/people/?search=Ravi", headers=headers))
assert r["count"] == 2, f"expected 2 Ravis, got {r['count']}"
print("  -> duplicate names both preserved")

# 5. Create meeting with transcript upload ----------------------------------
files = {
    "title": (None, "Project Alpha Planning"),
    "meeting_date": (None, "2026-08-05"),
    "meeting_type": (None, "meeting"),
    "participant_ids": (None, json.dumps([ravi_dev["id"], ravi_hr["id"], priya["id"]])),
    "transcript": ("transcript.txt", io.BytesIO(TRANSCRIPT.encode()), "text/plain"),
}
r = check("create meeting", client.post(f"{BASE}/meetings/", headers=headers, files=files))
meeting_id = r["id"]
print(f"  -> meeting={meeting_id} status={r['status']}")

# 6. Process (demo provider — deterministic) --------------------------------
r = check("start processing", client.post(f"{BASE}/meetings/{meeting_id}/process/", headers=headers))
import time
for _ in range(60):
    detail = client.get(f"{BASE}/meetings/{meeting_id}/", headers=headers).json()
    if detail["status"] not in ("processing", "draft"):
        break
    time.sleep(0.5)
assert detail["status"] == "review_required", f"unexpected status {detail['status']}"
print(f"  -> processed, status={detail['status']}, tasks={len(detail['tasks'])}")

# 7. Review -----------------------------------------------------------------
r = check("review", client.get(f"{BASE}/meetings/{meeting_id}/review/", headers=headers))
assert r["unresolved_tasks_count"] == 0, "demo tasks should resolve to Development Ravi"
api_task = next(t for t in r["tasks"] if t["task"].startswith("Prepare API"))
assert api_task["person"] == ravi_dev["id"], f"expected dev Ravi, got {api_task['person']}"
assert api_task["ai_confidence"] >= 0.75, f"expected high confidence, got {api_task['ai_confidence']}"
print(f"  -> task '{api_task['task']}' -> {api_task['person_name']} ({api_task['department']}, confidence {api_task['ai_confidence']})")

# 8. Generate report --------------------------------------------------------
r = check("generate report", client.post(
    f"{BASE}/meetings/{meeting_id}/generate-report/", headers=headers, json={
        "title": "Project Alpha Planning — Final",
        "tasks": [{"id": t["id"], "person": t["person"], "task": t["task"],
                   "deadline": t["deadline"], "priority": t["priority"],
                   "status": t["status"], "context": t["context"]} for t in r["tasks"]],
    }))
assert r["report_id"]
print(f"  -> report={r['report_id']}")

# 9. Reports list + PDF download --------------------------------------------
r = check("reports list", client.get(f"{BASE}/reports/", headers=headers))
assert r["count"] >= 1
report_id = r["results"][0]["id"]
r = check("report download url", client.get(f"{BASE}/reports/{report_id}/download/", headers=headers))
pdf_url = r["url"]
if pdf_url.startswith("/"):
    pdf_url = f"http://127.0.0.1:8000{pdf_url}"
pdf = client.get(pdf_url, headers=headers)
assert pdf.status_code == 200 and pdf.content[:4] == b"%PDF", f"not a PDF: {pdf.status_code}"
print(f"  -> PDF downloaded ({len(pdf.content)} bytes)")

# 10. CSV import + task API -------------------------------------------------
csv_data = "full_name,email,department,designation\nSana Verma,sana@acme.io,Marketing,Manager\n"
r = check("csv import", client.post(f"{BASE}/people/import/", headers=headers,
          files={"file": ("people.csv", io.BytesIO(csv_data.encode()), "text/csv")}))
assert r["created"] == 1

# 11. Org scope isolation ----------------------------------------------------
r2 = check("second org register", client.post(f"{BASE}/auth/register/", json={
    "full_name": "Other User", "email": f"other-{uuid.uuid4().hex[:6]}@example.com",
    "password": "strong-pass-123", "confirm_password": "strong-pass-123",
    "organization_name": "Other Corp", "organization_type": "company",
}))
h2 = {"Authorization": f"Bearer {r2['access']}"}
resp = client.get(f"{BASE}/meetings/{meeting_id}/", headers=h2)
assert resp.status_code == 404, f"cross-org access should 404, got {resp.status_code}"
print("  -> cross-organization access blocked (404)")

print("\nALL SMOKE TESTS PASSED")
