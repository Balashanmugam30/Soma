from fastapi import APIRouter

from services.notification_service import get_notifications


router = APIRouter()


@router.get("/notifications")
def get_all_notifications() -> dict[str, list[str]]:
    return {"notifications": get_notifications()}
