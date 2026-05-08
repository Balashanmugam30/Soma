from __future__ import annotations


notifications: list[str] = []


def add_notification(message: str) -> None:
    notifications.append(message)


def get_notifications() -> list[str]:
    return notifications
