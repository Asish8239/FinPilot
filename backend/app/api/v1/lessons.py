"""Standalone /lessons routes — by UUID, not by slug. Anonymous."""
from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.anonymous import get_anonymous_id
from app.schemas.learning import (
    CompleteLessonRequest,
    CompleteLessonResponse,
    LessonResponse,
)
from app.services import learning_service

router = APIRouter()


@router.get(
    "/{lesson_id}",
    response_model=LessonResponse,
    summary="Get a lesson by UUID",
)
async def get_lesson_by_id(
    lesson_id: uuid.UUID,
    session_id: Annotated[uuid.UUID, Depends(get_anonymous_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LessonResponse:
    lesson, progress = await learning_service.get_lesson(db, lesson_id, session_id)
    return await learning_service.build_lesson_response(lesson, progress)


@router.post(
    "/{lesson_id}/complete",
    response_model=CompleteLessonResponse,
    summary="Mark a lesson complete by UUID",
    description="Idempotent — calling twice returns the cached result without double-awarding XP.",
)
async def complete_lesson_by_id(
    lesson_id: uuid.UUID,
    body: CompleteLessonRequest,
    session_id: Annotated[uuid.UUID, Depends(get_anonymous_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CompleteLessonResponse:
    return await learning_service.complete_lesson(
        db, lesson_id, session_id, body.time_spent_sec
    )
