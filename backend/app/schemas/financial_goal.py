"""Financial goal API schemas."""

from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class FinancialGoalCreate(BaseModel):
    """Payload used to create a financial goal."""

    name: str = Field(
        min_length=1,
        max_length=120,
    )

    category: str = Field(
        default="general",
        min_length=1,
        max_length=40,
    )

    target_amount: Decimal = Field(
        gt=0,
        max_digits=14,
        decimal_places=2,
    )

    current_amount: Decimal = Field(
        default=Decimal("0"),
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    monthly_contribution: Decimal = Field(
        default=Decimal("0"),
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    target_date: date | None = None

    priority: int = Field(
        default=3,
        ge=1,
        le=5,
    )

    notes: str | None = Field(
        default=None,
        max_length=2000,
    )


class FinancialGoalUpdate(BaseModel):
    """Payload used to update an existing financial goal."""

    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=120,
    )

    category: str | None = Field(
        default=None,
        min_length=1,
        max_length=40,
    )

    target_amount: Decimal | None = Field(
        default=None,
        gt=0,
        max_digits=14,
        decimal_places=2,
    )

    current_amount: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    monthly_contribution: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    target_date: date | None = None

    priority: int | None = Field(
        default=None,
        ge=1,
        le=5,
    )

    status: str | None = Field(
        default=None,
        min_length=1,
        max_length=20,
    )

    notes: str | None = Field(
        default=None,
        max_length=2000,
    )


class FinancialGoalResponse(BaseModel):
    """Persisted financial goal."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    category: str
    target_amount: Decimal
    current_amount: Decimal
    monthly_contribution: Decimal
    target_date: date | None
    priority: int
    status: str
    notes: str | None
    created_at: datetime
    updated_at: datetime


class FinancialGoalAnalysis(BaseModel):
    """Calculated progress and planning metrics for a goal."""

    id: uuid.UUID
    name: str
    category: str
    status: str
    currency: str

    target_amount: Decimal
    current_amount: Decimal
    remaining_amount: Decimal

    progress_percent: Decimal
    monthly_contribution: Decimal
    required_monthly_contribution: Decimal

    target_date: date | None
    months_remaining: int | None

    on_track: bool
    completed: bool


class FinancialGoalsSummary(BaseModel):
    """Aggregate overview of the user's financial goals."""

    currency: str
    total_goals: int
    active_goals: int
    completed_goals: int
    total_target_amount: Decimal
    total_current_amount: Decimal
    total_remaining_amount: Decimal
    overall_progress_percent: Decimal