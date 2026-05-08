from dataclasses import dataclass

from agents.controller import ControllerResult


@dataclass(frozen=True)
class PlannerResult:
    steps: list[str]


class PlannerAgent:
    STEP_LIBRARY = {
        "en": {
            "coding": [
                "Controller analyzing coding request...",
                "Planner identifying the technical objective...",
                "Planner sequencing the implementation or debugging path...",
                "Executor preparing the technical response...",
            ],
            "planning": [
                "Controller analyzing planning request...",
                "Planner organizing priorities...",
                "Planner sequencing the day...",
                "Executor preparing the final plan...",
            ],
            "study": [
                "Controller analyzing study request...",
                "Planner identifying learning goals...",
                "Planner structuring study sessions...",
                "Executor preparing the study plan...",
            ],
            "research": [
                "Controller analyzing research request...",
                "Planner identifying investigation areas...",
                "Planner structuring evidence gathering...",
                "Executor preparing research insights...",
            ],
            "task": [
                "Controller analyzing task request...",
                "Planner grouping related tasks...",
                "Planner setting priorities...",
                "Executor preparing the action plan...",
            ],
            "general": [
                "Controller analyzing general request...",
                "Planner identifying the best approach...",
                "Executor preparing the final response...",
            ],
        },
        "ta": {
            "coding": [
                "Controller coding request-ai analyze seigirathu...",
                "Planner technical objective-ai identify seigirathu...",
                "Planner implementation path-ai sequence seigirathu...",
                "Executor technical response-ai tayar seigirathu...",
            ],
            "planning": [
                "Controller planning request-ai analyze seigirathu...",
                "Planner priorities-ai organize seigirathu...",
                "Planner naalai sequence seigirathu...",
                "Executor final plan-ai tayar seigirathu...",
            ],
            "study": [
                "Controller study request-ai analyze seigirathu...",
                "Planner learning goals-ai identify seigirathu...",
                "Planner study sessions-ai structure seigirathu...",
                "Executor study plan-ai tayar seigirathu...",
            ],
            "research": [
                "Controller research request-ai analyze seigirathu...",
                "Planner investigation areas-ai identify seigirathu...",
                "Planner evidence gathering-ai structure seigirathu...",
                "Executor research insights-ai tayar seigirathu...",
            ],
            "task": [
                "Controller task request-ai analyze seigirathu...",
                "Planner related tasks-ai group seigirathu...",
                "Planner priorities-ai set seigirathu...",
                "Executor action plan-ai tayar seigirathu...",
            ],
            "general": [
                "Controller general request-ai analyze seigirathu...",
                "Planner best approach-ai identify seigirathu...",
                "Executor final response-ai tayar seigirathu...",
            ],
        },
        "hi": {
            "coding": [
                "Controller coding request ka analysis kar raha hai...",
                "Planner technical objective pahchan raha hai...",
                "Planner implementation ya debugging path bana raha hai...",
                "Executor technical response taiyar kar raha hai...",
            ],
            "planning": [
                "Controller planning request ka analysis kar raha hai...",
                "Planner priorities organize kar raha hai...",
                "Planner din ka sequence bana raha hai...",
                "Executor final plan taiyar kar raha hai...",
            ],
            "study": [
                "Controller study request ka analysis kar raha hai...",
                "Planner learning goals pahchan raha hai...",
                "Planner study sessions structure kar raha hai...",
                "Executor study plan taiyar kar raha hai...",
            ],
            "research": [
                "Controller research request ka analysis kar raha hai...",
                "Planner investigation areas pahchan raha hai...",
                "Planner evidence gathering structure kar raha hai...",
                "Executor research insights taiyar kar raha hai...",
            ],
            "task": [
                "Controller task request ka analysis kar raha hai...",
                "Planner related tasks group kar raha hai...",
                "Planner priorities set kar raha hai...",
                "Executor action plan taiyar kar raha hai...",
            ],
            "general": [
                "Controller general request ka analysis kar raha hai...",
                "Planner best approach pahchan raha hai...",
                "Executor final response taiyar kar raha hai...",
            ],
        },
    }

    def create_plan(
        self,
        message: str,
        controller_result: ControllerResult,
        language: str,
    ) -> PlannerResult:
        localized_language = language if language in self.STEP_LIBRARY else "en"
        step_set = self.STEP_LIBRARY[localized_language]
        steps = step_set.get(controller_result.intent, step_set["general"])
        return PlannerResult(steps=steps[:7])
