from __future__ import annotations

import os

import requests


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-latest").strip().removeprefix("models/")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant").strip()
TOGETHER_MODEL = os.getenv("TOGETHER_MODEL", "meta-llama/Llama-3-8b-chat-hf").strip()
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3:latest").strip()
GEMINI_TIMEOUT_SECONDS = float(os.getenv("GEMINI_TIMEOUT_SECONDS", "20"))
GROQ_TIMEOUT_SECONDS = float(os.getenv("GROQ_TIMEOUT_SECONDS", "20"))
TOGETHER_TIMEOUT_SECONDS = float(os.getenv("TOGETHER_TIMEOUT_SECONDS", "20"))
OLLAMA_TIMEOUT_SECONDS = float(os.getenv("OLLAMA_TIMEOUT_SECONDS", "30"))


class AIService:
    def call_gemini(self, prompt: str) -> str | None:
        if not GEMINI_API_KEY:
            print("Gemini failed: missing API key")
            return None

        try:
            url = (
                f"https://generativelanguage.googleapis.com/v1beta/models/"
                f"{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
            )

            res = requests.post(
                url,
                json={"contents": [{"parts": [{"text": prompt}]}]},
                timeout=GEMINI_TIMEOUT_SECONDS,
            )

            print("Gemini status:", res.status_code)
            print("Gemini response:", res.text)
            res.raise_for_status()
            data = res.json()

            candidates = data.get("candidates", [])
            if not candidates:
                raise RuntimeError("No candidates returned")

            content = candidates[0].get("content", {})
            parts = content.get("parts", [])
            text = "".join(part.get("text", "") for part in parts).strip()
            return text or None
        except Exception as exc:
            print("Gemini failed:", str(exc))
            return None

    def call_groq(self, prompt: str) -> str | None:
        if not GROQ_API_KEY:
            print("Groq failed: missing API key")
            return None

        try:
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            }

            res = requests.post(
                url,
                headers=headers,
                json={
                    "model": GROQ_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                },
                timeout=GROQ_TIMEOUT_SECONDS,
            )

            print("Groq status:", res.status_code)
            print("Groq response:", res.text)
            res.raise_for_status()
            data = res.json()

            return data["choices"][0]["message"]["content"].strip()
        except Exception as exc:
            print("Groq failed:", str(exc))
            return None

    def call_together(self, prompt: str) -> str | None:
        if not TOGETHER_API_KEY:
            print("Together AI failed: missing API key")
            return None

        try:
            url = "https://api.together.xyz/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {TOGETHER_API_KEY}",
                "Content-Type": "application/json",
            }

            res = requests.post(
                url,
                headers=headers,
                json={
                    "model": TOGETHER_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                },
                timeout=TOGETHER_TIMEOUT_SECONDS,
            )

            print("Together status:", res.status_code)
            print("Together response:", res.text)
            res.raise_for_status()
            data = res.json()

            return data["choices"][0]["message"]["content"].strip()
        except Exception as exc:
            print("Together AI failed:", str(exc))
            return None

    def call_ollama(self, prompt: str) -> str | None:
        try:
            res = requests.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                },
                timeout=OLLAMA_TIMEOUT_SECONDS,
            )

            print("Ollama status:", res.status_code)
            print("Ollama response:", res.text)
            res.raise_for_status()
            data = res.json()
            response = data.get("response", "").strip()
            return response or None
        except Exception as exc:
            print("Ollama failed:", str(exc))
            return None

    def generate(self, prompt: str) -> str:
        for provider_name, provider in [
            ("Gemini", self.call_gemini),
            ("Groq", self.call_groq),
            ("Together AI", self.call_together),
            ("Ollama", self.call_ollama),
        ]:
            response = provider(prompt)
            if response:
                print(f"{provider_name} succeeded")
                return response

        return "All AI providers failed. Please try again."


ai_service = AIService()
