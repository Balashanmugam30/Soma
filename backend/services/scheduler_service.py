from __future__ import annotations

from apscheduler.schedulers.background import BackgroundScheduler

from services.email_service import send_email
from services.notification_service import add_notification
from services.webhook_service import trigger_webhook


scheduler = BackgroundScheduler()
scheduler.start()
jobs = {}


def trigger_reminder(task) -> None:
    message = f"Reminder: {task.task} now"
    print(message)
    add_notification(message)
    send_email(task.user_email, task.task)
    trigger_webhook(task)
    print("Reminder executed successfully")


def schedule_task(task) -> None:
    job = scheduler.add_job(
        trigger_reminder,
        "date",
        run_date=task.time,
        args=[task],
        id=f"task-{task.id}",
        replace_existing=True,
    )
    jobs[task.id] = job


def cancel_job(task_id: int) -> None:
    job = jobs.pop(task_id, None)
    if job is not None:
        job.remove()
