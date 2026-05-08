from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field

from models.schemas import MemorySnapshot


@dataclass
class MemoryRecord:
    preferred_language: str = "en"
    preferences: list[str] = field(default_factory=list)
    behavior_history: list[str] = field(default_factory=list)
    recent_topics: list[str] = field(default_factory=list)
    response_style_history: list[str] = field(default_factory=list)
    tone_history: list[str] = field(default_factory=list)
    pattern_counts: Counter[str] = field(default_factory=Counter)


@dataclass(frozen=True)
class BehaviorProfile:
    domain: str
    response_style: str
    tone: str
    complexity: str
    patterns: list[str]


class MemoryService:
    _store: dict[str, MemoryRecord] = {}

    def get_memory(self, user_id: str, language: str) -> MemorySnapshot:
        record = self._store.setdefault(user_id, MemoryRecord(preferred_language=language))
        record.preferred_language = language or record.preferred_language

        return MemorySnapshot(
            userId=user_id,
            preferredLanguage=record.preferred_language,
            preferences=record.preferences[-5:],
            behaviorHistory=record.behavior_history[-5:],
            recentTopics=record.recent_topics[-5:],
            preferredResponseStyle=self._preferred_style(record),
            preferredTone=self._preferred_tone(record),
            repeatedPatterns=self._top_patterns(record),
        )

    def profile_message(
        self,
        *,
        message: str,
        intent: str,
        skill_id: str | None,
    ) -> BehaviorProfile:
        normalized = message.lower().strip()
        word_count = len(normalized.split())
        complexity_keywords = [
            "explain",
            "compare",
            "detailed",
            "step-by-step",
            "architecture",
            "strategy",
            "tradeoff",
            "analyze",
            "implement",
            "debug",
        ]
        simple_keywords = ["quick", "brief", "short", "simple", "just"]

        if any(keyword in normalized for keyword in complexity_keywords) or word_count >= 18:
            response_style = "detailed"
            complexity = "complex"
        elif any(keyword in normalized for keyword in simple_keywords) or word_count <= 8:
            response_style = "short"
            complexity = "simple"
        else:
            response_style = "balanced"
            complexity = "moderate"

        domain = self._derive_domain(intent, normalized, skill_id)
        tone = self._derive_tone(
            domain=domain,
            complexity=complexity,
            response_style=response_style,
        )
        patterns = [domain, response_style]

        if tone not in {"clear", "calm"}:
            patterns.append(tone)

        return BehaviorProfile(
            domain=domain,
            response_style=response_style,
            tone=tone,
            complexity=complexity,
            patterns=patterns,
        )

    def update_memory(
        self,
        user_id: str,
        *,
        language: str,
        intent: str,
        message: str,
        skill_id: str | None,
        behavior_profile: BehaviorProfile,
    ) -> None:
        record = self._store.setdefault(user_id, MemoryRecord(preferred_language=language))
        record.preferred_language = language or record.preferred_language

        topic = self._derive_topic(intent, message)
        preference = self._derive_preference(intent, skill_id, behavior_profile)

        if preference and preference not in record.preferences:
            record.preferences.append(preference)
        if topic:
            record.recent_topics.append(topic)

        record.behavior_history.append(
            f"Intent: {intent} | Style: {behavior_profile.response_style} | Tone: {behavior_profile.tone}"
        )
        record.response_style_history.append(behavior_profile.response_style)
        record.tone_history.append(behavior_profile.tone)
        record.pattern_counts.update(behavior_profile.patterns)

        record.behavior_history = record.behavior_history[-10:]
        record.recent_topics = record.recent_topics[-10:]
        record.preferences = record.preferences[-10:]
        record.response_style_history = record.response_style_history[-12:]
        record.tone_history = record.tone_history[-12:]

    def format_memory_context(self, memory: MemorySnapshot) -> str:
        if not memory.preferences and not memory.behaviorHistory and not memory.recentTopics:
            return "No prior memory available."

        sections = [
            f"Preferred language: {memory.preferredLanguage}",
            f"Preferred response style: {memory.preferredResponseStyle}",
            f"Preferred tone: {memory.preferredTone}",
            f"Preferences: {', '.join(memory.preferences) if memory.preferences else 'None'}",
            f"Repeated patterns: {', '.join(memory.repeatedPatterns) if memory.repeatedPatterns else 'None'}",
            f"Behavior history: {', '.join(memory.behaviorHistory) if memory.behaviorHistory else 'None'}",
            f"Recent topics: {', '.join(memory.recentTopics) if memory.recentTopics else 'None'}",
        ]
        return "\n".join(sections)

    @staticmethod
    def _derive_topic(intent: str, message: str) -> str:
        normalized = message.strip()
        if not normalized:
            return intent
        return normalized[:80]

    @staticmethod
    def _derive_preference(
        intent: str,
        skill_id: str | None,
        behavior_profile: BehaviorProfile,
    ) -> str | None:
        if skill_id:
            return f"Uses skill: {skill_id}"
        if behavior_profile.response_style == "short":
            return "Prefers concise answers"
        if behavior_profile.response_style == "detailed":
            return "Prefers detailed answers"
        if intent != "general":
            return f"Often requests: {intent}"
        return None

    @staticmethod
    def _derive_domain(intent: str, message: str, skill_id: str | None) -> str:
        if skill_id == "study-planner":
            return "study"
        if skill_id == "task-manager":
            return "task"
        if skill_id == "research-assistant":
            return "research"
        if intent != "general":
            return intent
        if any(
            keyword in message
            for keyword in ["code", "bug", "debug", "api", "python", "typescript"]
        ):
            return "coding"
        return "general"

    @staticmethod
    def _derive_tone(*, domain: str, complexity: str, response_style: str) -> str:
        if domain == "coding":
            return "technical"
        if domain in {"study", "planning", "task"}:
            return "coaching"
        if response_style == "short":
            return "concise"
        if complexity == "complex":
            return "structured"
        return "clear"

    @staticmethod
    def _preferred_style(record: MemoryRecord) -> str:
        if not record.response_style_history:
            return "balanced"
        return Counter(record.response_style_history).most_common(1)[0][0]

    @staticmethod
    def _preferred_tone(record: MemoryRecord) -> str:
        if not record.tone_history:
            return "clear"
        return Counter(record.tone_history).most_common(1)[0][0]

    @staticmethod
    def _top_patterns(record: MemoryRecord) -> list[str]:
        return [pattern for pattern, _count in record.pattern_counts.most_common(4)]
