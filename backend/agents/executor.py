from agents.controller import ControllerResult
from agents.planner import PlannerResult
from models.schemas import ChatSkill, MemorySnapshot
from services.gemini_service import GeminiService

SYSTEM_PROMPT = """
You are SOMA, an intelligent AI assistant.

Style:

* Speak naturally and clearly, like a helpful human
* Be concise and to the point
* Avoid robotic or dramatic language
* Do not use phrases like "I am fully synchronized" or "systems ready"

Behavior:

* Understand the user's intent and respond directly
* Be helpful, calm, and confident
* Keep responses clean and easy to read
* If the user greets, respond casually (e.g., "Hey", "Hi there")

Language:

* Always reply in the same language as the user
""".strip()


AGENT_STYLES = {
    "office": "You are a professional assistant. Be clear, structured, and task-focused.",
    "student": "You are a helpful study assistant. Explain simply and guide step-by-step.",
    "life": "You are a friendly life assistant. Be natural, helpful, and practical.",
}


DEFAULT_SKILLS = {
    "study-planner": {
        "name": "Study Planner",
        "prompt": "Focus on study plans, revision strategy, learning order, and realistic academic scheduling.",
    },
    "study-coach": {
        "name": "Study Planner",
        "prompt": "Focus on study plans, revision strategy, learning order, and realistic academic scheduling.",
    },
    "task-manager": {
        "name": "Task Manager",
        "prompt": "Focus on organizing tasks, prioritization, execution sequence, and clarity of action items.",
    },
    "task-organizer": {
        "name": "Task Manager",
        "prompt": "Focus on organizing tasks, prioritization, execution sequence, and clarity of action items.",
    },
    "research-assistant": {
        "name": "Research Assistant",
        "prompt": "Focus on structured research, comparison, summarization, and balanced analysis.",
    },
    "planner": {
        "name": "Task Manager",
        "prompt": "Focus on structured planning, realistic scheduling, and clear next steps.",
    },
}


class ExecutorAgent:
    def __init__(self) -> None:
        self.gemini_service = GeminiService()

    def build_prompt(
        self,
        message: str,
        controller_result: ControllerResult,
        planner_result: PlannerResult,
        *,
        agent_context: str,
        language: str,
        skill: ChatSkill | None,
        skill_id: str | None,
        memory_snapshot: MemorySnapshot,
        memory_context: str,
    ) -> str:
        return self._build_prompt(
            message=message,
            controller_result=controller_result,
            planner_result=planner_result,
            agent_context=agent_context,
            language=language,
            skill=skill,
            skill_id=skill_id,
            memory_snapshot=memory_snapshot,
            memory_context=memory_context,
        )

    async def execute(
        self,
        message: str,
        controller_result: ControllerResult,
        planner_result: PlannerResult,
        *,
        agent_context: str,
        language: str,
        skill: ChatSkill | None,
        skill_id: str | None,
        memory_snapshot: MemorySnapshot,
        memory_context: str,
    ) -> str:
        prompt = self._build_prompt(
            message=message,
            controller_result=controller_result,
            planner_result=planner_result,
            agent_context=agent_context,
            language=language,
            skill=skill,
            skill_id=skill_id,
            memory_snapshot=memory_snapshot,
            memory_context=memory_context,
        )
        return await self.gemini_service.generate_response(prompt)

    def _build_prompt(
        self,
        *,
        message: str,
        controller_result: ControllerResult,
        planner_result: PlannerResult,
        agent_context: str,
        language: str,
        skill: ChatSkill | None,
        skill_id: str | None,
        memory_snapshot: MemorySnapshot,
        memory_context: str,
    ) -> str:
        user_language = self._detect_language(message) or language
        skill_context = self._build_skill_context(skill=skill, skill_id=skill_id)
        agent_style = AGENT_STYLES.get(controller_result.agent_type or "life", AGENT_STYLES["life"])

        if user_language == "ta":
            language_instruction = "Respond ONLY in Tamil. Do NOT use English."
        elif user_language == "hi":
            language_instruction = "Respond ONLY in Hindi. Do NOT use English."
        else:
            language_instruction = "Respond in English."

        if skill_context:
            return f"""
{language_instruction}

{SYSTEM_PROMPT}

{agent_style}

Agent context:
{agent_context}

Follow this skill strictly:
{skill_context}

User:
{message}

Respond naturally like ChatGPT. Avoid robotic tone.
""".strip()

        return f"""
{language_instruction}

{SYSTEM_PROMPT}

{agent_style}

Agent context:
{agent_context}

User:
{message}

Respond naturally like ChatGPT. Avoid robotic tone.
""".strip()

    @staticmethod
    def _detect_language(text: str) -> str:
        for char in text:
            codepoint = ord(char)
            if 0x0B80 <= codepoint <= 0x0BFF:
                return "ta"
            if 0x0900 <= codepoint <= 0x097F:
                return "hi"
        return "en"

    @staticmethod
    def _build_skill_context(*, skill: ChatSkill | None, skill_id: str | None) -> str:
        if skill:
            skill_content = (skill.content or skill.prompt or skill.description or "").strip()
            if skill_content:
                return skill_content

        default_skill = DEFAULT_SKILLS.get(skill_id or "")
        if default_skill:
            return default_skill["prompt"]

        return ""
