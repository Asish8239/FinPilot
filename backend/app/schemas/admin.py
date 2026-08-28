"""
Admin-only schemas for content management and analytics.
These are never exposed to student-role users.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


# ── Analytics ─────────────────────────────────────────────────────────────────

class ModuleStats(BaseModel):
    module_id: uuid.UUID
    module_title: str
    completion_rate: float   # % of users who completed at least one lesson
    total_completions: int


class AdminAnalyticsResponse(BaseModel):
    total_users: int
    active_last_7_days: int
    active_last_30_days: int
    total_lessons_completed: int
    total_quiz_attempts: int
    quiz_pass_rate: float
    average_streak: float
    top_modules: list[ModuleStats]
    generated_at: datetime


# ── Module / Lesson management ────────────────────────────────────────────────

class CreateModuleRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    slug: str = Field(min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$")
    description: str | None = None
    level: Literal["beginner", "intermediate", "advanced"]
    track: Literal["A", "B", "C"] | None = None
    order_index: int = Field(default=0, ge=0)
    icon_url: str | None = None
    is_published: bool = False


class UpdateModuleRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    level: Literal["beginner", "intermediate", "advanced"] | None = None
    track: Literal["A", "B", "C"] | None = None
    order_index: int | None = Field(default=None, ge=0)
    icon_url: str | None = None
    is_published: bool | None = None


class CreateLessonRequest(BaseModel):
    module_id: uuid.UUID
    title: str = Field(min_length=1, max_length=200)
    slug: str = Field(min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$")
    content_type: Literal["markdown", "video", "interactive"] = "markdown"
    content_markdown: str | None = None
    video_url: str | None = None
    order_index: int = Field(default=0, ge=0)
    estimated_minutes: int = Field(default=5, ge=1)
    xp_reward: int = Field(default=10, ge=0)
    is_published: bool = False


class UpdateLessonRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    content_type: Literal["markdown", "video", "interactive"] | None = None
    content_markdown: str | None = None
    video_url: str | None = None
    order_index: int | None = Field(default=None, ge=0)
    estimated_minutes: int | None = Field(default=None, ge=1)
    xp_reward: int | None = Field(default=None, ge=0)
    is_published: bool | None = None


# ── Quiz / Question management ────────────────────────────────────────────────

class CreateQuestionRequest(BaseModel):
    question_text: str = Field(min_length=1)
    question_type: Literal["mcq", "true_false", "fill_blank"]
    options: list[dict] | None = None  # [{"key": "A", "text": "..."}]
    correct_answer: str = Field(min_length=1)
    explanation: str | None = None
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    points: int = Field(default=10, ge=1)
    order_index: int = Field(default=0, ge=0)


class CreateQuizRequest(BaseModel):
    lesson_id: uuid.UUID
    title: str = Field(min_length=1, max_length=200)
    passing_score: int = Field(default=70, ge=0, le=100)
    max_attempts: int = Field(default=3, ge=1)
    questions: list[CreateQuestionRequest] = []
