def sanitize_message(message: str) -> str:
    return " ".join(message.strip().split())


def get_frontend_origins(frontend_origin: str) -> list[str]:
    origins = {origin.strip() for origin in frontend_origin.split(",") if origin.strip()}
    origins.update(
        {
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3001",
        }
    )
    return sorted(origins)


def normalize_language(language: str | None) -> str:
    if not language:
        return "en"

    normalized = language.strip().lower()
    if normalized.startswith("ta"):
        return "ta"
    if normalized.startswith("hi"):
        return "hi"
    return "en"
