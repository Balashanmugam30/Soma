from dataclasses import dataclass


@dataclass(frozen=True)
class ControllerResult:
    intent: str
    agent_type: str
    summary: str


class ControllerAgent:
    def analyze(self, message: str) -> ControllerResult:
        lowered_message = message.lower()

        if any(keyword in lowered_message for keyword in ["meeting", "work", "deadline"]):
            return ControllerResult(
                intent="office",
                agent_type="office",
                summary="Controller routing request to OfficeAgent...",
            )

        if any(keyword in lowered_message for keyword in ["study", "exam", "subject"]):
            return ControllerResult(
                intent="student",
                agent_type="student",
                summary="Controller routing request to StudentAgent...",
            )

        if any(
            keyword in lowered_message
            for keyword in [
                "code",
                "coding",
                "bug",
                "debug",
                "function",
                "api",
                "python",
                "javascript",
                "typescript",
                "next.js",
                "fastapi",
            ]
        ):
            return ControllerResult(
                intent="coding",
                agent_type="office",
                summary="Controller analyzing coding request...",
            )

        if any(keyword in lowered_message for keyword in ["study", "exam", "revision", "learn"]):
            return ControllerResult(
                intent="study",
                agent_type="student",
                summary="Controller analyzing study request...",
            )

        if any(keyword in lowered_message for keyword in ["research", "investigate", "analyze", "compare"]):
            return ControllerResult(
                intent="research",
                agent_type="student",
                summary="Controller analyzing research request...",
            )

        if any(keyword in lowered_message for keyword in ["task", "todo", "organize", "prioritize"]):
            return ControllerResult(
                intent="task",
                agent_type="life",
                summary="Controller analyzing task request...",
            )

        if any(keyword in lowered_message for keyword in ["plan", "schedule", "roadmap"]):
            return ControllerResult(
                intent="planning",
                agent_type="life",
                summary="Controller analyzing planning request...",
            )

        return ControllerResult(
            intent="life",
            agent_type="life",
            summary="Controller routing request to LifeAgent...",
        )
