from __future__ import annotations

from collections.abc import Sequence

from models.task_model import Task


tasks: list[Task] = []


def add_task(task: Task) -> None:
    tasks.append(task)


def get_tasks() -> Sequence[Task]:
    return tasks


def _matches_task(task: Task, task_name: str) -> bool:
    normalized_task_name = task_name.strip().lower()
    return normalized_task_name in task.task.lower()


def delete_task(task_name: str) -> list[Task]:
    global tasks

    removed_tasks = [task for task in tasks if _matches_task(task, task_name)]
    tasks = [task for task in tasks if not _matches_task(task, task_name)]
    return removed_tasks


def update_task(task_name: str, new_time) -> list[Task]:
    updated_tasks: list[Task] = []

    for task in tasks:
        if _matches_task(task, task_name):
            task.time = new_time
            task.status = "rescheduled"
            updated_tasks.append(task)

    return updated_tasks
