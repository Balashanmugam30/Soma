from fastapi import APIRouter

from services.task_service import get_tasks


router = APIRouter()


@router.get("/tasks")
def fetch_tasks() -> dict[str, object]:
    return {"tasks": get_tasks()}
