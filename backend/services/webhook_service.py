from __future__ import annotations

import os

import requests


WEBHOOK_URL = os.getenv("WEBHOOK_URL", "https://webhook.site/YOUR_UNIQUE_URL").strip()


def trigger_webhook(task) -> None:
    payload = {
        "task": task.task,
        "time": str(task.time),
        "agent": task.agent,
    }

    if not WEBHOOK_URL or "YOUR_UNIQUE_URL" in WEBHOOK_URL:
        print("Webhook skipped: WEBHOOK_URL is not configured.")
        return

    try:
        response = requests.post(WEBHOOK_URL, json=payload, timeout=15)
        print("Webhook triggered:", response.status_code)
    except Exception as exc:
        print("Webhook failed:", str(exc))
