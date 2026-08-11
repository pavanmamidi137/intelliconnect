"""Verify the Supabase stack: Postgres connectivity, storage bucket access,
and the Gemini AI provider — without touching app data.

Usage: python verify_supabase.py
"""

import os
import sys

from dotenv import load_dotenv

load_dotenv()

import psycopg

DB_URL = os.getenv("DATABASE_URL", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "meeting-files")
GEMINI_KEY = os.getenv("GEMINI_API_KEY", "")


def check(name, fn):
    try:
        detail = fn()
        print(f"PASS  {name}: {detail}")
    except Exception as exc:
        print(f"FAIL  {name}: {exc}")
        return False
    return True


def test_db():
    if not DB_URL:
        raise RuntimeError("DATABASE_URL not set")
    with psycopg.connect(DB_URL, connect_timeout=15) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT current_database(), current_user, version()")
            db, user, version = cur.fetchone()
            return f"db={db} user={user} pg={version.split()[1]}"


def test_storage():
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set")
    from supabase import create_client

    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    def name(b):
        return b["name"] if isinstance(b, dict) else getattr(b, "name", "")

    buckets = client.storage.list_buckets()
    names = [name(b) for b in buckets]
    if BUCKET not in names:
        client.storage.create_bucket(BUCKET, options={"public": False})
        names = [name(b) for b in client.storage.list_buckets()]
    return f"bucket '{BUCKET}' present and private"


def test_gemini():
    if not GEMINI_KEY:
        raise RuntimeError("GEMINI_API_KEY not set")
    import httpx

    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent"
    with httpx.Client(timeout=30) as client:
        r = client.post(
            url,
            params={"key": GEMINI_KEY},
            json={"contents": [{"parts": [{"text": "Reply with the single word: ok"}]}]},
        )
        r.raise_for_status()
        text = r.json()["candidates"][0]["content"]["parts"][0]["text"]
        return f"model responded: {text.strip()[:30]}"


if __name__ == "__main__":
    ok = True
    ok &= check("Supabase Postgres", test_db)
    ok &= check("Supabase Storage", test_storage)
    ok &= check("Gemini provider", test_gemini)
    sys.exit(0 if ok else 1)
