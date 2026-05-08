from __future__ import annotations

import json
import logging
import re

from services.gemini_service import generate_response


logger = logging.getLogger(__name__)
ALLOWED_CATEGORIES = {"controller", "planner", "executor"}


def fallback_skill(text: str) -> dict[str, str]:
    lowered = text.lower()

    if any(keyword in lowered for keyword in ("summarize", "summary", "analyze", "analysis", "pdf")):
        return {"name": "Content Analyzer", "category": "executor"}

    if any(keyword in lowered for keyword in ("study", "plan", "schedule", "revise", "exam")):
        return {"name": "Study Planner", "category": "planner"}

    if any(keyword in lowered for keyword in ("task", "todo", "workflow", "reminder", "command")):
        return {"name": "Task Manager", "category": "controller"}

    return {"name": "Custom Skill", "category": "planner"}


def _build_skill_prompt(skill_text: str) -> str:
    return f"""
You are an advanced AI system inside SOMA.

Your job:
Analyze the given content and convert it into a reusable AI skill.

You must return:

1. name:
- short
- professional
- max 3 words
- must reflect actual purpose

2. category:
Choose ONLY ONE:
- controller (task management, workflows, commands)
- planner (study, planning, structuring, schedules)
- executor (analysis, summarization, research, output generation)

Examples:

Input:
"Summarize a PDF document and extract key insights"
Output:
{{
  "name": "PDF Summarizer",
  "category": "executor"
}}

Input:
"Plan my study schedule for exams"
Output:
{{
  "name": "Study Planner",
  "category": "planner"
}}

Input:
"Manage daily tasks and reminders"
Output:
{{
  "name": "Task Manager",
  "category": "controller"
}}

Now analyze this content:

{skill_text}

Return ONLY valid JSON in this exact shape:
{{
  "name": "Professional Skill Name",
  "category": "controller|planner|executor"
}}
""".strip()


def _extract_json_block(response: str) -> dict[str, str]:
    cleaned = response.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("No JSON object found in Gemini response.")

    payload = json.loads(cleaned[start : end + 1])
    if not isinstance(payload, dict):
        raise ValueError("Gemini response JSON must be an object.")

    return {
        "name": str(payload.get("name", "")).strip(),
        "category": str(payload.get("category", "")).strip().lower(),
    }


def _normalize_skill_name(name: str, fallback_name: str) -> str:
    normalized = re.sub(r"\s+", " ", name).strip()
    if not normalized:
        normalized = fallback_name

    words = normalized.split()
    if len(words) > 3:
        normalized = " ".join(words[:3])

    return normalized[:64].strip() or fallback_name


def _validate_skill_data(data: dict[str, str], fallback: dict[str, str]) -> dict[str, str]:
    category = data.get("category", "").strip().lower()
    if category not in ALLOWED_CATEGORIES:
        raise ValueError("Invalid skill category returned by Gemini.")

    return {
        "name": _normalize_skill_name(data.get("name", ""), fallback["name"]),
        "category": category,
    }


async def analyze_skill(skill_text: str) -> dict[str, str]:
    """
    Analyze raw skill input and return a structured reusable skill object.
    """

    fallback = fallback_skill(skill_text)

    try:
        response = await generate_response(_build_skill_prompt(skill_text))
        parsed = _extract_json_block(response)
        return _validate_skill_data(parsed, fallback)
    except Exception as exc:
        logger.warning("Skill analysis failed; using fallback classifier. %s", exc)
        return fallback
