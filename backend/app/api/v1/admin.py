"""
Admin routes — protected by X-Admin-Key header (matches SECRET_KEY in env).
No user auth required; anonymous app uses a static secret for admin access.
"""
from __future__ import annotations

import uuid
from typing import Annotated
from fastapi.responses import Response

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.schemas.admin import (
    AdminAnalyticsResponse,
    CreateLessonRequest,
    CreateModuleRequest,
    CreateQuizRequest,
    CreateQuestionRequest,
    UpdateLessonRequest,
    UpdateModuleRequest,
)
from app.schemas.learning import LessonResponse, ModuleDetailResponse
from app.schemas.quiz import QuizResponse, QuestionResponse
from app.services import admin_service

router = APIRouter()


async def require_admin(x_admin_key: str | None = Header(default=None, alias="X-Admin-Key")) -> None:
    """Simple admin guard: requires X-Admin-Key header matching SECRET_KEY."""
    if not x_admin_key or x_admin_key != settings.SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access denied",
        )


# ── Analytics ──────────────────────────────────────────────────────────────────

@router.get(
    "/analytics",
    response_model=AdminAnalyticsResponse,
    summary="Platform-wide analytics",
)
async def get_analytics(
    _: Annotated[None, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AdminAnalyticsResponse:
    return await admin_service.get_analytics(db)


# ── User management ────────────────────────────────────────────────────────────

@router.get(
    "/users",
    response_model=list[dict],
    summary="List all sessions (paginated)",
)
async def list_users(
    _: Annotated[None, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[dict]:
    # In anonymous mode, users table contains session records
    from sqlalchemy import select, text
    result = await db.execute(text(f"SELECT id, created_at FROM users LIMIT {limit} OFFSET {offset}"))
    rows = result.fetchall()
    return [{"id": str(r[0]), "created_at": str(r[1])} for r in rows]


# ── Module CRUD ────────────────────────────────────────────────────────────────

@router.post(
    "/modules",
    status_code=201,
    summary="Create a new learning module",
)
async def create_module(
    body: CreateModuleRequest,
    _: Annotated[None, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    mod = await admin_service.create_module(db, body)
    return {"id": str(mod.id), "slug": mod.slug, "title": mod.title}


@router.patch(
    "/modules/{module_id}",
    summary="Update a learning module",
)
async def update_module(
    module_id: uuid.UUID,
    body: UpdateModuleRequest,
    _: Annotated[None, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    mod = await admin_service.update_module(db, module_id, body)
    return {"id": str(mod.id), "slug": mod.slug, "title": mod.title, "is_published": mod.is_published}


@router.patch(
    "/modules/{module_id}/publish",
    summary="Publish a module (make it visible to students)",
)
async def publish_module(
    module_id: uuid.UUID,
    _: Annotated[None, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    mod = await admin_service.publish_module(db, module_id)
    return {"id": str(mod.id), "is_published": mod.is_published}


@router.delete(
    "/modules/{module_id}",
    status_code=204,
    summary="Delete a module (cascades to lessons, quizzes, progress)",
)
async def delete_module(
    module_id: uuid.UUID,
    _: Annotated[None, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    await admin_service.delete_module(db, module_id)
    return Response(status_code=204)


# ── Lesson CRUD ────────────────────────────────────────────────────────────────

@router.post(
    "/lessons",
    status_code=201,
    summary="Create a lesson inside a module",
)
async def create_lesson(
    body: CreateLessonRequest,
    _: Annotated[None, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    lesson = await admin_service.create_lesson(db, body)
    return {"id": str(lesson.id), "slug": lesson.slug, "title": lesson.title}


@router.patch(
    "/lessons/{lesson_id}",
    summary="Update a lesson",
)
async def update_lesson(
    lesson_id: uuid.UUID,
    body: UpdateLessonRequest,
    _: Annotated[None, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    lesson = await admin_service.update_lesson(db, lesson_id, body)
    return {"id": str(lesson.id), "slug": lesson.slug, "title": lesson.title, "is_published": lesson.is_published}


@router.patch(
    "/lessons/{lesson_id}/publish",
    summary="Publish a lesson",
)
async def publish_lesson(
    lesson_id: uuid.UUID,
    _: Annotated[None, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    lesson = await admin_service.publish_lesson(db, lesson_id)
    return {"id": str(lesson.id), "is_published": lesson.is_published}


@router.delete(
    "/lessons/{lesson_id}",
    status_code=204,
    summary="Delete a lesson",
)
async def delete_lesson(
    lesson_id: uuid.UUID,
    _: Annotated[None, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    await admin_service.delete_lesson(db, lesson_id)
    return Response(status_code=204)


# ── Quiz CRUD ──────────────────────────────────────────────────────────────────

@router.post(
    "/quizzes",
    status_code=201,
    summary="Create a quiz with questions for a lesson",
)
async def create_quiz(
    body: CreateQuizRequest,
    _: Annotated[None, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    quiz = await admin_service.create_quiz(db, body)
    return {"id": str(quiz.id), "title": quiz.title, "lesson_id": str(quiz.lesson_id)}


@router.post(
    "/quizzes/{quiz_id}/questions",
    status_code=201,
    summary="Add a question to an existing quiz",
)
async def add_question(
    quiz_id: uuid.UUID,
    body: CreateQuestionRequest,
    _: Annotated[None, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    q = await admin_service.add_question(db, quiz_id, body)
    return {"id": str(q.id), "question_type": q.question_type}


@router.delete(
    "/quizzes/{quiz_id}",
    status_code=204,
    summary="Delete a quiz and all its questions",
)
async def delete_quiz(
    quiz_id: uuid.UUID,
    _: Annotated[None, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    await admin_service.delete_quiz(db, quiz_id)
    return Response(status_code=204)
