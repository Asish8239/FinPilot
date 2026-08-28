from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class AddWatchlistRequest(BaseModel):
    symbol: str = Field(min_length=1, max_length=20)
    name: str = Field(min_length=1, max_length=200)
    exchange: str = Field(default="NSE", max_length=10)
    notes: str | None = Field(default=None, max_length=500)

    @field_validator("symbol")
    @classmethod
    def uppercase_symbol(cls, v: str) -> str:
        return v.upper().strip()

    @field_validator("exchange")
    @classmethod
    def uppercase_exchange(cls, v: str) -> str:
        return v.upper().strip()


class UpdateWatchlistRequest(BaseModel):
    notes: str | None = Field(default=None, max_length=500)


class WatchlistItemResponse(BaseModel):
    id: uuid.UUID
    symbol: str
    name: str
    exchange: str
    notes: str | None
    added_at: datetime

    model_config = {"from_attributes": True}
