import asyncio
import os
from dataclasses import replace

from agents.controller import ControllerAgent
from agents.domain_agents import LifeAgent, OfficeAgent, StudentAgent
from agents.executor import ExecutorAgent
from agents.planner import PlannerAgent
from models.task_model import Task
from models.schemas import ChatRequest, ChatResponse, ThinkingStep
from services.ai_service import ai_service
from services.intent_service import extract_intent, split_intents
from services.memory_service import MemoryService
from services.scheduler_service import cancel_job, schedule_task
from services.task_service import add_task, delete_task, get_tasks, update_task
from utils.helpers import normalize_language, sanitize_message


def is_valid_for_agent(agent: str, message: str) -> bool:
    lowered_message = message.lower()

    if agent == "office":
        return any(word in lowered_message for word in ["meeting", "work", "deadline"])

    if agent == "student":
        return any(word in lowered_message for word in ["study", "exam", "subject"])

    if agent == "life":
        return True

    return True


class ChatService:
    def __init__(self) -> None:
        self.controller = ControllerAgent()
        self.planner = PlannerAgent()
        self.executor = ExecutorAgent()
        self.office_agent = OfficeAgent()
        self.student_agent = StudentAgent()
        self.life_agent = LifeAgent()
        self.memory_service = MemoryService()

    async def handle_message(self, payload: ChatRequest) -> ChatResponse:
        cleaned_message = sanitize_message(payload.message)
        language = normalize_language(payload.language)
        user_id = payload.userId or "anonymous"
        reminder_email = (
            payload.userEmail
            if payload.userEmail
            else payload.userId
            if payload.userId and "@" in payload.userId
            else os.getenv("DEFAULT_REMINDER_EMAIL", "").strip()
        )

        try:
            selected_agent = payload.agentType if payload.agentType in {"office", "student", "life"} else None
            responses: list[str] = []
            thinking: list[ThinkingStep] = []

            for message_part in split_intents(cleaned_message):
                controller_result = self.controller.analyze(message_part)

                if selected_agent and not is_valid_for_agent(selected_agent, message_part):
                    return ChatResponse(
                        response=f"This request doesn't belong to the {selected_agent} agent. Please switch agent.",
                        steps=[],
                    )

                if selected_agent and selected_agent != controller_result.agent_type:
                    controller_result = replace(
                        controller_result,
                        agent_type=selected_agent,
                        intent=selected_agent,
                        summary=f"Controller honoring selected {selected_agent} agent...",
                    )

                intent = extract_intent(message_part)
                thinking.append(
                    ThinkingStep(
                        message=message_part,
                        intent=str(intent.get("action", "chat")),
                        agent=controller_result.agent_type,
                    )
                )

                if intent["action"] == "cancel":
                    removed_tasks = delete_task(str(intent["task"]))
                    for task in removed_tasks:
                        cancel_job(task.id)
                    responses.append(
                        "Your task has been cancelled."
                        if removed_tasks
                        else "I couldn't find that task to cancel."
                    )
                    continue

                if intent["action"] == "update":
                    updated_tasks = update_task(str(intent["task"]), intent["time"])
                    for task in updated_tasks:
                        schedule_task(task)
                    responses.append(
                        "Your task has been updated."
                        if updated_tasks
                        else "I couldn't find that task to update."
                    )
                    continue

                if intent["action"] == "set_reminder" and intent["time"]:
                    task = Task(
                        id=len(get_tasks()) + 1,
                        task=str(intent["task"]),
                        time=intent["time"],
                        agent=controller_result.agent_type,
                        user_email=reminder_email or "user@email.com",
                    )
                    add_task(task)
                    schedule_task(task)
                    responses.append(f"✔ {task.task} scheduled")
                    continue

                behavior_profile = self.memory_service.profile_message(
                    message=message_part,
                    intent=controller_result.intent,
                    skill_id=payload.skillId,
                )
                planner_result = self.planner.create_plan(
                    message_part,
                    controller_result,
                    language,
                )
                agent_type = controller_result.agent_type
                if agent_type == "office":
                    agent_output = self.office_agent.handle(message_part)
                elif agent_type == "student":
                    agent_output = self.student_agent.handle(message_part)
                else:
                    agent_output = self.life_agent.handle(message_part)
                memory = self.memory_service.get_memory(user_id, language)
                memory_context = self.memory_service.format_memory_context(memory)
                prompt = self.executor.build_prompt(
                    message_part,
                    controller_result,
                    planner_result,
                    agent_context=agent_output,
                    language=language,
                    skill=payload.skill,
                    skill_id=payload.skillId,
                    memory_snapshot=memory,
                    memory_context=memory_context,
                )
                try:
                    response = await asyncio.to_thread(ai_service.generate, prompt)
                    if not response or len(response.strip()) == 0:
                        raise Exception("Empty response from AI providers")
                except Exception as exc:
                    print("AI provider error:", str(exc))
                    response = "All AI providers failed. Please try again."

                responses.append(response)
                self.memory_service.update_memory(
                    user_id,
                    language=language,
                    intent=controller_result.intent,
                    message=message_part,
                    skill_id=payload.skillId,
                    behavior_profile=behavior_profile,
                )

            result = ChatResponse(response="\n".join(responses), steps=thinking)
            print("FINAL RESPONSE:", result.model_dump())
            return result
        except Exception as exc:
            print("AI provider error:", str(exc))
            result = ChatResponse(
                response="All AI providers failed. Please try again.",
                steps=[],
            )
            print("FINAL RESPONSE:", result.model_dump())
            return result
