"""
Calculator schemas.
All result fields are explicitly labelled as PROJECTIONS / ESTIMATES.
Financial results must never be presented as guarantees.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class SIPCalculatorRequest(BaseModel):
    monthly_investment: float = Field(gt=0, description="Monthly SIP amount in INR")
    annual_rate: float = Field(gt=0, le=100, description="Expected annual return rate (%)")
    years: int = Field(ge=1, le=50, description="Investment duration in years")
    inflation_rate: float = Field(ge=0, lt=100, default=0.0,
                                  description="Expected annual inflation rate (%)")
    save_to_history: bool = False


class LumpsumRequest(BaseModel):
    principal: float = Field(gt=0, description="One-time lumpsum investment in INR")
    annual_rate: float = Field(gt=0, le=100, description="Expected annual return rate (%)")
    years: int = Field(ge=1, le=50, description="Investment duration in years")
    inflation_rate: float = Field(ge=0, lt=100, default=0.0,
                                  description="Expected annual inflation rate (%)")
    save_to_history: bool = False


class YearlyProjection(BaseModel):
    year: int
    invested: float
    value: float
    returns: float


_DISCLAIMER = (
    "These figures are projections based on a constant assumed rate of return. "
    "Actual returns will vary. Past performance does not guarantee future results. "
    "This is not financial advice."
)


class SIPCalculatorResponse(BaseModel):
    # Clearly labelled as estimates
    projected_maturity_value: float
    total_invested: float
    projected_wealth_gained: float
    inflation_adjusted_projected_value: float
    yearly_projections: list[YearlyProjection]
    disclaimer: str = _DISCLAIMER
    history_id: uuid.UUID | None = None


class LumpsumResponse(BaseModel):
    projected_maturity_value: float
    total_invested: float
    projected_wealth_gained: float
    inflation_adjusted_projected_value: float
    yearly_projections: list[YearlyProjection]
    disclaimer: str = _DISCLAIMER
    history_id: uuid.UUID | None = None
