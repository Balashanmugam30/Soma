from typing import Literal

from pydantic import BaseModel, Field


class FileMetadata(BaseModel):
    filename: str = Field(..., min_length=1, max_length=256)
    type: str = Field(..., min_length=1, max_length=128)


class ChatSkill(BaseModel):
    id: str | None = Field(default=None, max_length=128)
    title: str | None = Field(default=None, max_length=128)
    name: str | None = Field(default=None, max_length=128)
    description: str | None = Field(default=None, max_length=512)
    prompt: str | None = Field(default=None, max_length=4000)
    content: str | None = Field(default=None, max_length=4000)
    category: Literal["controller", "planner", "executor"] | None = None


class ChatRequest(BaseModel):
    userId: str | None = Field(default=None, max_length=128)
    userEmail: str | None = Field(default=None, max_length=320)
    chatId: str | None = Field(default=None, max_length=128)
    message: str = Field(..., min_length=1, max_length=4000)
    language: str = Field(default="en", max_length=16)
    agentType: str | None = Field(default=None, max_length=64)
    skill: ChatSkill | None = None
    skillId: str | None = Field(default=None, max_length=64)
    files: list[FileMetadata] = Field(default_factory=list)


class ThinkingStep(BaseModel):
    message: str
    intent: str
    agent: str


class ChatResponse(BaseModel):
    response: str
    steps: list[ThinkingStep]


class HealthResponse(BaseModel):
    status: str
    service: str


class SkillAnalysisRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=20000)


class SkillAnalysisResponse(BaseModel):
    name: str = Field(..., min_length=1, max_length=64)
    category: Literal["controller", "planner", "executor"]


class SkillDefinition(BaseModel):
    id: str
    name: str
    description: str
    promptTemplate: str


class MemorySnapshot(BaseModel):
    userId: str
    preferredLanguage: str
    preferences: list[str]
    behaviorHistory: list[str]
    recentTopics: list[str]
    preferredResponseStyle: str = "balanced"
    preferredTone: str = "clear"
    repeatedPatterns: list[str] = Field(default_factory=list)
