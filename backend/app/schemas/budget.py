from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

CategoryType = Literal["needs", "wants", "savings", "investments"]


class CreateBudgetPlanRequest(BaseModel):
    month: str = Field(pattern=r"^\d{4}-(0[1-9]|1[0-2])$",
                       description="Month in YYYY-MM format")
    monthly_income: float = Field(gt=0, description="Gross monthly income in INR")
    currency: str = "INR"


class UpdateBudgetPlanRequest(BaseModel):
    monthly_income: float | None = Field(default=None, gt=0)


class BudgetAllocation(BaseModel):
    needs: float
    wants: float
    savings_investments: float


class BudgetEntryRequest(BaseModel):
    category: CategoryType
    label: str = Field(min_length=1, max_length=200)
    budgeted: float = Field(gt=0)
    actual: float = Field(ge=0, default=0.0)


class UpdateBudgetEntryRequest(BaseModel):
    label: str | None = Field(default=None, min_length=1, max_length=200)
    budgeted: float | None = Field(default=None, gt=0)
    actual: float | None = Field(default=None, ge=0)


class BudgetEntryResponse(BaseModel):
    id: uuid.UUID
    plan_id: uuid.UUID
    category: str
    label: str
    budgeted: float
    actual: float
    created_at: datetime

    model_config = {"from_attributes": True}


class BudgetPlanResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    month: date
    monthly_income: float
    currency: str
    suggested_allocation: BudgetAllocation
    entries: list[BudgetEntryResponse] = []
    total_budgeted: float = 0.0
    total_actual: float = 0.0
    surplus: float = 0.0
    savings_rate: float = 0.0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
