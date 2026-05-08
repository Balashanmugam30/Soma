from datetime import datetime

from pydantic import BaseModel, Field


class Task(BaseModel):
    id: int
    task: str = Field(..., min_length=1, max_length=512)
    time: datetime
    agent: str = Field(..., min_length=1, max_length=64)
    status: str = Field(default="scheduled", min_length=1, max_length=32)
    user_email: str = Field(..., min_length=3, max_length=320)
