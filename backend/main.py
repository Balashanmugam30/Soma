from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

load_dotenv()

from models.schemas import HealthResponse
from routes.chat import router as chat_router
from routes.notification import router as notification_router
from routes.speech import router as speech_router
from routes.skill import router as skill_router
from routes.task import router as task_router
from utils.helpers import get_frontend_origins

app = FastAPI(
    title="SOMA Backend",
    description="FastAPI backend for SOMA chat orchestration.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_frontend_origins(
        os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, tags=["chat"])
app.include_router(notification_router, tags=["notifications"])
app.include_router(speech_router, tags=["speech"])
app.include_router(skill_router, tags=["skills"])
app.include_router(task_router, tags=["tasks"])

STATIC_DIR = Path(__file__).resolve().parent / "static"
NEXT_ASSETS_DIR = STATIC_DIR / "_next"
FAVICON_PATH = STATIC_DIR / "favicon.ico"

if NEXT_ASSETS_DIR.exists():
    app.mount("/_next", StaticFiles(directory=NEXT_ASSETS_DIR), name="next-assets")


@app.get("/favicon.ico", include_in_schema=False)
def favicon() -> FileResponse:
    return FileResponse(FAVICON_PATH)


@app.get("/health", response_model=HealthResponse, tags=["system"])
def health_check() -> HealthResponse:
    return HealthResponse(status="ok", service="SOMA backend")


@app.get("/{full_path:path}", include_in_schema=False)
def serve_frontend(full_path: str = "") -> FileResponse:
    if not STATIC_DIR.exists():
        return FileResponse(Path(__file__).resolve())

    normalized_path = full_path.strip("/")
    candidates = []

    if not normalized_path:
        candidates.append(STATIC_DIR / "index.html")
    else:
        candidates.extend(
            [
                STATIC_DIR / normalized_path,
                STATIC_DIR / f"{normalized_path}.html",
                STATIC_DIR / normalized_path / "index.html",
            ]
        )

    for candidate in candidates:
        if candidate.exists() and candidate.is_file():
            return FileResponse(candidate)

    return FileResponse(STATIC_DIR / "index.html")
