from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, field_validator


class LessonSummary(BaseModel):
    id: uuid.UUID
    title: str
    slug: str
    content_type: str
    order_index: int
    estimated_minutes: int
    xp_reward: int
    is_published: bool
    completed: bool = False
    xp_earned: int = 0

    model_config = {"from_attributes": True}


class LessonResponse(LessonSummary):
    module_id: uuid.UUID
    content_markdown: str | None
    video_url: str | None
    created_at: datetime


class ModuleSummary(BaseModel):
    id: uuid.UUID
    title: str
    slug: str
    description: str | None
    level: str
    track: str | None
    order_index: int
    icon_url: str | None
    is_published: bool
    lesson_count: int = 0
    completed_count: int = 0
    completion_pct: float = 0.0

    model_config = {"from_attributes": True}


class ModuleDetailResponse(ModuleSummary):
    lessons: list[LessonSummary] = []


class CompleteLessonRequest(BaseModel):
    time_spent_sec: int = 0

    @field_validator("time_spent_sec")
    @classmethod
    def non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("time_spent_sec must be >= 0")
        return v


class CompleteLessonResponse(BaseModel):
    lesson_id: uuid.UUID
    xp_earned: int
    total_xp: int
    level: int
    streak: int
    new_badges: list[str] = []
    already_completed: bool = False
