from __future__ import annotations

import os
import smtplib
from email.mime.text import MIMEText


EMAIL = os.getenv("SMTP_EMAIL", "").strip()
PASSWORD = os.getenv("SMTP_APP_PASSWORD", "").strip()


def send_email(to_email: str, task: str) -> None:
    if not EMAIL or not PASSWORD:
        print("Reminder email skipped: SMTP credentials are not configured.")
        return

    msg = MIMEText(f"Reminder: {task}")
    msg["Subject"] = "SOMA Reminder"
    msg["From"] = EMAIL
    msg["To"] = to_email

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(EMAIL, PASSWORD)
        server.send_message(msg)
