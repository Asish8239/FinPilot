"""Financial health API schemas."""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class FinancialHealthUpdate(BaseModel):
    """Fields accepted when creating or updating a financial profile."""

    currency: str = Field(
        default="INR",
        min_length=3,
        max_length=10,
    )

    monthly_income: Decimal = Field(
        default=Decimal("0"),
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    monthly_expenses: Decimal = Field(
        default=Decimal("0"),
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    monthly_debt_payment: Decimal = Field(
        default=Decimal("0"),
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    cash_balance: Decimal = Field(
        default=Decimal("0"),
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    emergency_fund: Decimal = Field(
        default=Decimal("0"),
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    investments_value: Decimal = Field(
        default=Decimal("0"),
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    total_debt: Decimal = Field(
        default=Decimal("0"),
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    monthly_investment: Decimal = Field(
        default=Decimal("0"),
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    target_monthly_expenses: Decimal = Field(
        default=Decimal("0"),
        ge=0,
        max_digits=14,
        decimal_places=2,
    )


class FinancialHealthResponse(BaseModel):
    """Financial profile returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    currency: str

    monthly_income: Decimal
    monthly_expenses: Decimal
    monthly_debt_payment: Decimal

    cash_balance: Decimal
    emergency_fund: Decimal
    investments_value: Decimal
    total_debt: Decimal

    monthly_investment: Decimal
    target_monthly_expenses: Decimal

    created_at: datetime
    updated_at: datetime


class FinancialHealthSummary(BaseModel):
    """Computed financial-health metrics."""

    currency: str

    monthly_income: Decimal
    monthly_expenses: Decimal
    monthly_savings: Decimal
    monthly_debt_payment: Decimal

    savings_rate: Decimal

    cash_balance: Decimal
    emergency_fund: Decimal
    investments_value: Decimal
    total_debt: Decimal

    net_worth: Decimal

    emergency_fund_months: Decimal
    debt_to_income_ratio: Decimal