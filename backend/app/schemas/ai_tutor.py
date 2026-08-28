from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, field_validator


class CreateConversationRequest(BaseModel):
    initial_message: str
    lesson_id: uuid.UUID | None = None

    @field_validator("initial_message")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("initial_message cannot be blank")
        return v.strip()


class SendMessageRequest(BaseModel):
    content: str

    @field_validator("content")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("content cannot be blank")
        return v.strip()


class MessageResponse(BaseModel):
    id: uuid.UUID
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationSummary(BaseModel):
    id: uuid.UUID
    title: str
    lesson_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ConversationResponse(ConversationSummary):
    messages: list[MessageResponse] = []
