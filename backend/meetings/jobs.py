"""Background job dispatch.

Long-running operations (AI analysis, PDF generation) never block the
HTTP request. When CELERY_BROKER_URL is configured, jobs are dispatched
to Celery + Redis; otherwise they run in daemon threads so the product
works without extra infrastructure.

The frontend reflects real backend processing state by polling meeting
status — progress is never faked.
"""

import logging
import threading

from django.conf import settings
from django.db import close_old_connections

logger = logging.getLogger("intelliconnect")


def dispatch_async(job_func, *args):
    """Run `job_func(*args)` in the background and return immediately.

    Celery worker when a broker is configured; otherwise a daemon thread.
    """
    if settings.CELERY_BROKER_URL:
        from config.celery import app as celery_app

        celery_app.send_task(f"intelliconnect.{job_func.__name__}", args=args)
        return None

    def _run():
        close_old_connections()
        try:
            job_func(*args)
        except Exception:
            logger.exception("Background job %s failed", job_func.__name__)
        finally:
            close_old_connections()

    thread = threading.Thread(target=_run, daemon=True, name=job_func.__name__)
    thread.start()
    return None


def run_sync_or_dispatch(job_func, *args):
    """Run synchronously in development, dispatch to Celery in production.

    Used for short jobs (PDF generation) where the caller wants the
    result in the HTTP response.
    """
    if settings.CELERY_BROKER_URL:
        from config.celery import app as celery_app

        celery_app.send_task(f"intelliconnect.{job_func.__name__}", args=args)
        return None
    return job_func(*args)


# ---------------------------------------------------------------------------
# Job entry points (also registered as Celery tasks by name)
# ---------------------------------------------------------------------------

def analyze_meeting_job(meeting_id):
    from ai.analyzer import analyze_meeting

    return analyze_meeting(meeting_id)


def generate_report_job(meeting_id):
    from reports.services import generate_report

    return generate_report(meeting_id)
