"""
AI Tutor routes — anonymous conversation management and Groq streaming endpoint.

GROQ_API_KEY stays on the server; it is never sent to the client.
No authentication required.
"""
from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.anonymous import get_anonymous_id
from app.schemas.ai_tutor import (
    ConversationResponse,
    ConversationSummary,
    CreateConversationRequest,
    MessageResponse,
    SendMessageRequest,
)
from app.services import ai_tutor_service

router = APIRouter()


@router.post(
    "/conversations",
    response_model=ConversationSummary,
    status_code=201,
    summary="Start a new AI tutor conversation",
)
async def create_conversation(
    body: CreateConversationRequest,
    session_id: Annotated[uuid.UUID, Depends(get_anonymous_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ConversationSummary:
    conv = await ai_tutor_service.create_conversation(
        db, session_id, body.initial_message, body.lesson_id
    )
    return ConversationSummary.model_validate(conv)


@router.get(
    "/conversations",
    response_model=list[ConversationSummary],
    summary="List all conversations for this session",
)
async def list_conversations(
    session_id: Annotated[uuid.UUID, Depends(get_anonymous_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[ConversationSummary]:
    convs = await ai_tutor_service.list_conversations(db, session_id)
    return [ConversationSummary.model_validate(c) for c in convs]


@router.get(
    "/conversations/{conv_id}",
    response_model=ConversationResponse,
    summary="Get a conversation with its full message history",
)
async def get_conversation(
    conv_id: uuid.UUID,
    session_id: Annotated[uuid.UUID, Depends(get_anonymous_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ConversationResponse:
    conv = await ai_tutor_service.get_conversation(db, conv_id, session_id)
    messages = await ai_tutor_service.get_messages(db, conv_id)
    resp = ConversationResponse.model_validate(conv)
    resp.messages = [MessageResponse.model_validate(m) for m in messages]
    return resp


@router.post(
    "/conversations/{conv_id}/messages",
    summary="Send a message and receive an SSE-streamed Groq AI response",
    description=(
        "Streams the assistant reply as Server-Sent Events. "
        "Each event is: `data: {\"token\": \"...\"}`. "
        "The stream ends with `data: [DONE]`. "
        "On error: `data: {\"error\": \"...\"}` followed by `data: [DONE]`."
    ),
)
async def send_message(
    conv_id: uuid.UUID,
    body: SendMessageRequest,
    session_id: Annotated[uuid.UUID, Depends(get_anonymous_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> StreamingResponse:
    conv = await ai_tutor_service.get_conversation(db, conv_id, session_id)
    return StreamingResponse(
        ai_tutor_service.stream_response(db, conv, session_id, body.content),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
