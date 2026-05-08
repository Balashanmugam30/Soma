from fastapi import APIRouter

from models.schemas import ChatRequest, ChatResponse
from services.chat_service import ChatService

router = APIRouter()
chat_service = ChatService()


@router.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest) -> ChatResponse:
    print("Incoming:", payload.model_dump())
    try:
        result = await chat_service.handle_message(payload)
        result_dict = result.model_dump()
        print("Outgoing:", result_dict)
        return {
            "response": result_dict.get("response", "No response"),
            "steps": result_dict.get("steps", []),
        }
    except Exception as exc:
        print("Chat route error:", exc)
        result_dict = {"response": "Internal error occurred.", "steps": []}
        print("Outgoing:", result_dict)
        return result_dict
