from __future__ import annotations

import asyncio
import logging
import os

import requests


logger = logging.getLogger(__name__)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-latest").strip()
GEMINI_TIMEOUT_SECONDS = float(os.getenv("GEMINI_TIMEOUT_SECONDS", "15"))
MULTILINGUAL_INSTRUCTION = (
    "You are SOMA, an AI assistant.\n"
    "You MUST ALWAYS respond in the SAME LANGUAGE as the user's input.\n"
    "If the user speaks Tamil, respond ONLY in Tamil.\n"
    "If the user speaks Hindi, respond ONLY in Hindi.\n"
    "If the user speaks English, respond in English.\n"
    "NEVER say you are restricted to English.\n"
    "NEVER refuse language requests.\n"
    "Always fully comply with the user's language."
)


class GeminiService:
    def __init__(self) -> None:
        self.api_key = GEMINI_API_KEY
        self.model = GEMINI_MODEL.removeprefix("models/")
        self.timeout_seconds = GEMINI_TIMEOUT_SECONDS

    async def generate_response(self, prompt: str) -> str:
        if not self.api_key:
            logger.warning("GEMINI_API_KEY not configured; using fallback response.")
            raise RuntimeError("Gemini API key not configured.")

        try:
            return await asyncio.wait_for(
                asyncio.to_thread(self._generate_response_blocking, prompt),
                timeout=self.timeout_seconds + 1,
            )
        except Exception as exc:
            logger.exception("Gemini request failed", exc_info=exc)
            raise RuntimeError(f"Gemini error: {str(exc)}") from exc

    def _generate_response_blocking(self, prompt: str) -> str:
        prompt = f"{MULTILINGUAL_INSTRUCTION}\n\n{prompt}"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        headers = {
            "Content-Type": "application/json",
        }
        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt}],
                }
            ]
        }

        try:
            response = requests.post(
                url,
                headers=headers,
                json=payload,
                timeout=self.timeout_seconds,
            )

            print("STATUS:", response.status_code)
            print("RESPONSE:", response.text)

            response.raise_for_status()

            data = response.json()
        except Exception as exc:
            print("Gemini error:", str(exc))
            raise RuntimeError(f"Gemini error: {str(exc)}") from exc

        print("Gemini API raw response:", data)

        candidates = data.get("candidates", [])
        if not candidates:
            raise RuntimeError(f"No candidates returned: {data}")

        parts = candidates[0]["content"]["parts"]
        text = "".join(part.get("text", "") for part in parts)

        if not text:
            raise RuntimeError(f"Empty response from Gemini: {data}")

        return text.strip()


gemini_service = GeminiService()


async def generate_response(prompt: str) -> str:
    return await gemini_service.generate_response(prompt)
