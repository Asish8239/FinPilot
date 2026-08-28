from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel


class BadgeResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str
    icon_url: str
    criteria_type: str
    criteria_value: int
    earned: bool = False
    earned_at: datetime | None = None

    model_config = {"from_attributes": True}


class DayActivity(BaseModel):
    date: str          # ISO date string YYYY-MM-DD
    lessons_completed: int
    xp_earned: int


class RecommendedLesson(BaseModel):
    lesson_id: uuid.UUID
    lesson_title: str
    module_title: str
    module_slug: str
    lesson_slug: str
    track: str | None
    xp_reward: int


class BudgetSnapshot(BaseModel):
    income: float
    spent: float
    remaining: float
    savings_rate: float


class SIPSnapshot(BaseModel):
    id: uuid.UUID
    calculator_type: str
    params: dict
    result_maturity: float
    result_total_invested: float
    created_at: datetime

    model_config = {"from_attributes": True}


class DashboardResponse(BaseModel):
    overall_completion_pct: float
    completed_lessons: int
    total_lessons: int
    current_streak: int
    longest_streak: int
    total_xp: int
    level: int
    xp_to_next_level: int
    recent_badges: list[BadgeResponse]
    recommended_lessons: list[RecommendedLesson]
    weekly_activity: list[DayActivity]
    budget_summary: BudgetSnapshot | None
    calculator_history: list[SIPSnapshot]


class BadgesResponse(BaseModel):
    earned: list[BadgeResponse]
    available: list[BadgeResponse]
