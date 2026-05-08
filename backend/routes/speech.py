from __future__ import annotations

import base64

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from services.speech_service import speech_service

router = APIRouter()


class TextToSpeechRequest(BaseModel):
    text: str = Field(default="", max_length=4000)
    language: str = Field(default="en-IN", max_length=16)


@router.post("/speech-to-text")
async def speech_to_text(
    file: UploadFile = File(...),
    language: str = "en-IN",
) -> dict[str, str]:
    try:
        audio = await file.read()
        text = speech_service.speech_to_text(audio, language=language)
        return {"text": text}
    except Exception as exc:
        print("Speech-to-text error:", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/text-to-speech")
async def text_to_speech(payload: TextToSpeechRequest) -> dict[str, str]:
    try:
        language = payload.language or "en-IN"
        audio = speech_service.text_to_speech(payload.text, language=language)
        return {"audio": base64.b64encode(audio).decode("utf-8")}
    except Exception as exc:
        print("Text-to-speech error:", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc
