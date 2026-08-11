"""Celery application.

Only used when CELERY_BROKER_URL is configured. Without a broker the
backend runs jobs in daemon threads, so the product works out of the box.
"""

import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("intelliconnect")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks(related_name="jobs")
