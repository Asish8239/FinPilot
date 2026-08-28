"""
Module routes — list and retrieve learning modules with per-session progress.
No authentication required.
"""
from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.anonymous import get_anonymous_id
from app.schemas.learning import (
    CompleteLessonRequest,
    CompleteLessonResponse,
    LessonResponse,
    ModuleDetailResponse,
)
from app.services import learning_service

router = APIRouter()


@router.get(
    "",
    response_model=list[ModuleDetailResponse],
    summary="List all published modules with session progress",
)
async def list_modules(
    session_id: Annotated[uuid.UUID, Depends(get_anonymous_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
    level: str | None = Query(default=None, description="Filter by level: beginner | intermediate | advanced"),
) -> list[ModuleDetailResponse]:
    return await learning_service.list_modules(db, session_id, level)


@router.get(
    "/{module_slug}",
    response_model=ModuleDetailResponse,
    summary="Get a single module by slug with lessons",
)
async def get_module(
    module_slug: str,
    session_id: Annotated[uuid.UUID, Depends(get_anonymous_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ModuleDetailResponse:
    modules = await learning_service.list_modules(db, session_id)
    for mod in modules:
        if mod.slug == module_slug:
            return mod
    from app.core.exceptions import NotFoundError
    raise NotFoundError("Module")


@router.get(
    "/{module_slug}/lessons/{lesson_slug}",
    response_model=LessonResponse,
    summary="Get a lesson by module and lesson slug",
)
async def get_lesson(
    module_slug: str,
    lesson_slug: str,
    session_id: Annotated[uuid.UUID, Depends(get_anonymous_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LessonResponse:
    _mod, lesson = await learning_service.get_lesson_by_slug(db, module_slug, lesson_slug)
    _lesson, progress = await learning_service.get_lesson(db, lesson.id, session_id)
    return await learning_service.build_lesson_response(lesson, progress)


@router.post(
    "/{module_slug}/lessons/{lesson_slug}/complete",
    response_model=CompleteLessonResponse,
    summary="Mark a lesson as complete",
    description="Idempotent — calling twice returns the cached result without double-awarding XP.",
)
async def complete_lesson(
    module_slug: str,
    lesson_slug: str,
    body: CompleteLessonRequest,
    session_id: Annotated[uuid.UUID, Depends(get_anonymous_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CompleteLessonResponse:
    _mod, lesson = await learning_service.get_lesson_by_slug(db, module_slug, lesson_slug)
    return await learning_service.complete_lesson(db, lesson.id, session_id, body.time_spent_sec)
