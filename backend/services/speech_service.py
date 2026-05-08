from __future__ import annotations

import os

from google.cloud import speech, texttospeech

# Ensure credentials path is absolute.
cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

if cred_path and not os.path.isabs(cred_path):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    cred_path = os.path.join(base_dir, cred_path)
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = cred_path


class SpeechService:
    def __init__(self) -> None:
        print("GOOGLE CREDENTIAL PATH:", os.getenv("GOOGLE_APPLICATION_CREDENTIALS"))

        try:
            self.stt = speech.SpeechClient()
            self.tts = texttospeech.TextToSpeechClient()
            print("Google Speech clients initialized successfully")
        except Exception as exc:  # pragma: no cover - depends on env credentials
            print("Google Speech init error:", str(exc))
            self.stt = None
            self.tts = None

    def speech_to_text(self, audio_bytes: bytes, language: str = "en-IN") -> str:
        if not self.stt:
            raise RuntimeError("Google Cloud Speech-to-Text is not configured.")

        audio = speech.RecognitionAudio(content=audio_bytes)
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
            sample_rate_hertz=48000,
            language_code=language,
        )

        response = self.stt.recognize(config=config, audio=audio)
        if not response.results:
            return ""

        return response.results[0].alternatives[0].transcript

    def text_to_speech(self, text: str, language: str = "en-IN") -> bytes:
        if not self.tts:
            raise RuntimeError("Google Cloud Text-to-Speech is not configured.")

        synthesis_input = texttospeech.SynthesisInput(text=text)
        voice = texttospeech.VoiceSelectionParams(language_code=language)
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )

        response = self.tts.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config,
        )
        return response.audio_content


speech_service = SpeechService()
