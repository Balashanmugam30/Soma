from __future__ import annotations

from fastapi import APIRouter

from models.schemas import SkillAnalysisRequest, SkillAnalysisResponse
from services.skill_service import analyze_skill


router = APIRouter()


@router.post("/analyze-skill", response_model=SkillAnalysisResponse)
async def analyze_skill_route(payload: SkillAnalysisRequest) -> SkillAnalysisResponse:
    result = await analyze_skill(payload.content)
    return SkillAnalysisResponse(**result)
