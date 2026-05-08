from __future__ import annotations

import re
from datetime import datetime, timedelta


TAMIL_CHARACTERS = "அஆஇஈஉஊஎஏஐஒஓஔகஙசஞடணதநபமயரலவழளறன"
HINDI_CHARACTERS = "अआइईउऊएऐओऔकखगघचछजझटठडढतथदधनपफबभमयरलवशषसह"


def _extract_hour(message: str) -> int | None:
    match = re.search(r"(\d{1,2})(?::(\d{2}))?\s*(am|pm)?", message)
    if not match:
        return None

    hour = int(match.group(1))
    meridiem = (match.group(3) or "").lower()

    if meridiem == "pm" and hour != 12:
        hour += 12
    if meridiem == "am" and hour == 12:
        hour = 0
    if 0 <= hour <= 23:
        return hour

    return None


def _extract_task_label(message: str) -> str:
    patterns = [
        r"remind me(?: to)? (.+?)(?: tomorrow| today| at \d| by \d| on \w+|$)",
        r"set a reminder(?: for| to)? (.+?)(?: tomorrow| today| at \d| by \d| on \w+|$)",
        r"meeting(?: about)? (.+?)(?: tomorrow| today| at \d| by \d| on \w+|$)",
        r"exam(?: about)? (.+?)(?: tomorrow| today| at \d| by \d| on \w+|$)",
    ]

    for pattern in patterns:
        match = re.search(pattern, message, re.IGNORECASE)
        if match:
            candidate = match.group(1).strip(" .")
            if candidate:
                return candidate

    if "exam" in message.lower():
        return "exam"

    return "meeting"


def _detect_language(message: str) -> str:
    if any(char in message for char in TAMIL_CHARACTERS):
        return "ta"
    if any(char in message for char in HINDI_CHARACTERS):
        return "hi"
    return "en"


def _format_confirmation(task_label: str, scheduled_for: datetime, language: str) -> str:
    formatted_time = scheduled_for.strftime("%I:%M %p on %d %b").lstrip("0")

    if language == "ta":
        return f"சரி, '{task_label}' நினைவூட்டலை {formatted_time}க்கு அமைத்துவிட்டேன்."
    if language == "hi":
        return f"ठीक है, '{task_label}' के लिए रिमाइंडर {formatted_time} पर सेट कर दिया है।"
    return f"Done. I set a reminder for '{task_label}' at {formatted_time}."


def split_intents(message: str) -> list[str]:
    separators = [" and ", ",", " also "]
    parts = [message]

    for separator in separators:
        next_parts: list[str] = []
        for part in parts:
            next_parts.extend(part.split(separator))
        parts = next_parts

    return [part.strip() for part in parts if part.strip()]


def extract_intent(message: str) -> dict[str, object]:
    lowered_message = message.lower()
    detected_language = _detect_language(message)
    now = datetime.now()
    hour = _extract_hour(lowered_message)

    if "cancel" in lowered_message:
        return {
            "action": "cancel",
            "task": _extract_task_label(message),
            "language": detected_language,
        }

    if "change" in lowered_message or "reschedule" in lowered_message or "update" in lowered_message:
        scheduled_time: datetime | None = None

        if "tomorrow" in lowered_message:
            scheduled_time = now + timedelta(days=1)
            scheduled_time = scheduled_time.replace(
                hour=hour if hour is not None else 10,
                minute=0,
                second=0,
                microsecond=0,
            )
        elif hour is not None:
            scheduled_time = now.replace(
                hour=hour,
                minute=0,
                second=0,
                microsecond=0,
            )
            if scheduled_time <= now:
                scheduled_time += timedelta(days=1)

        return {
            "action": "update",
            "task": _extract_task_label(message),
            "time": scheduled_time or now.replace(hour=10, minute=0, second=0, microsecond=0),
            "language": detected_language,
        }

    if any(keyword in lowered_message for keyword in ["remind", "reminder", "meeting", "exam"]):
        scheduled_time: datetime | None = None

        if "tomorrow" in lowered_message:
            scheduled_time = now + timedelta(days=1)
            scheduled_time = scheduled_time.replace(
                hour=hour if hour is not None else 9,
                minute=0,
                second=0,
                microsecond=0,
            )
        elif "today" in lowered_message and hour is not None:
            scheduled_time = now.replace(
                hour=hour,
                minute=0,
                second=0,
                microsecond=0,
            )
            if scheduled_time <= now:
                scheduled_time += timedelta(days=1)
        elif hour is not None:
            scheduled_time = now.replace(
                hour=hour,
                minute=0,
                second=0,
                microsecond=0,
            )
            if scheduled_time <= now:
                scheduled_time += timedelta(days=1)

        task_label = _extract_task_label(message)

        return {
            "action": "set_reminder",
            "task": task_label,
            "time": scheduled_time,
            "language": detected_language,
            "confirmation": _format_confirmation(
                task_label,
                scheduled_time if scheduled_time is not None else now,
                detected_language,
            ),
        }

    return {"action": "chat", "language": detected_language}
