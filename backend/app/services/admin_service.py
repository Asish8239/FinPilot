"""
Admin service — content management (module/lesson/quiz CRUD) and analytics.
All functions require the caller to have already verified role == 'admin'.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ConflictError, NotFoundError
from app.models.learning import Lesson, Module
from app.models.progress import UserProgress, UserXP, Streak
from app.models.quiz import Question, Quiz, UserQuizAttempt
from app.models.user import User
from app.schemas.admin import (
    AdminAnalyticsResponse,
    CreateLessonRequest,
    CreateModuleRequest,
    CreateQuestionRequest,
    CreateQuizRequest,
    ModuleStats,
    UpdateLessonRequest,
    UpdateModuleRequest,
)
from app.schemas.learning import LessonResponse, ModuleDetailResponse, LessonSummary

logger = logging.getLogger(__name__)


# ── Analytics ──────────────────────────────────────────────────────────────────

async def get_analytics(db: AsyncSession) -> AdminAnalyticsResponse:
    now = datetime.now(timezone.utc)
    day7 = now - timedelta(days=7)
    day30 = now - timedelta(days=30)

    total_users: int = await db.scalar(select(func.count(User.id))) or 0

    # Active = completed at least one lesson in window
    active_7: int = await db.scalar(
        select(func.count(func.distinct(UserProgress.user_id))).where(
            UserProgress.completed == True,
            UserProgress.completed_at >= day7,
        )
    ) or 0
    active_30: int = await db.scalar(
        select(func.count(func.distinct(UserProgress.user_id))).where(
            UserProgress.completed == True,
            UserProgress.completed_at >= day30,
        )
    ) or 0

    total_completions: int = await db.scalar(
        select(func.count(UserProgress.id)).where(UserProgress.completed == True)
    ) or 0

    total_attempts: int = await db.scalar(
        select(func.count(UserQuizAttempt.id))
    ) or 0
    passed_attempts: int = await db.scalar(
        select(func.count(UserQuizAttempt.id)).where(UserQuizAttempt.passed == True)
    ) or 0
    pass_rate = round(passed_attempts / total_attempts * 100, 1) if total_attempts else 0.0

    avg_streak_row = await db.scalar(select(func.avg(Streak.current_streak)))
    avg_streak = round(float(avg_streak_row), 1) if avg_streak_row else 0.0

    # Top 5 modules by completion count
    top_rows = await db.execute(
        select(
            Module.id,
            Module.title,
            func.count(UserProgress.id).label("completions"),
        )
        .join(Lesson, Lesson.module_id == Module.id)
        .join(UserProgress, UserProgress.lesson_id == Lesson.id)
        .where(UserProgress.completed == True)
        .group_by(Module.id, Module.title)
        .order_by(func.count(UserProgress.id).desc())
        .limit(5)
    )
    top_modules = []
    for row in top_rows:
        # Completion rate = users who completed ≥1 lesson / total users
        unique_users: int = await db.scalar(
            select(func.count(func.distinct(UserProgress.user_id)))
            .join(Lesson, UserProgress.lesson_id == Lesson.id)
            .where(Lesson.module_id == row.id, UserProgress.completed == True)
        ) or 0
        rate = round(unique_users / total_users * 100, 1) if total_users else 0.0
        top_modules.append(ModuleStats(
            module_id=row.id,
            module_title=row.title,
            completion_rate=rate,
            total_completions=row.completions,
        ))

    return AdminAnalyticsResponse(
        total_users=total_users,
        active_last_7_days=active_7,
        active_last_30_days=active_30,
        total_lessons_completed=total_completions,
        total_quiz_attempts=total_attempts,
        quiz_pass_rate=pass_rate,
        average_streak=avg_streak,
        top_modules=top_modules,
        generated_at=now,
    )


# ── Module CRUD ────────────────────────────────────────────────────────────────

async def create_module(db: AsyncSession, req: CreateModuleRequest) -> Module:
    existing = await db.scalar(select(Module).where(Module.slug == req.slug))
    if existing:
        raise ConflictError(f"Module slug '{req.slug}' already exists")
    mod = Module(**req.model_dump())
    db.add(mod)
    await db.flush()
    logger.info("Admin created module '%s' (slug=%s)", mod.title, mod.slug)
    return mod


async def update_module(
    db: AsyncSession, module_id: uuid.UUID, req: UpdateModuleRequest
) -> Module:
    mod = await db.scalar(select(Module).where(Module.id == module_id))
    if not mod:
        raise NotFoundError("Module")
    for field, value in req.model_dump(exclude_none=True).items():
        setattr(mod, field, value)
    await db.flush()
    return mod


async def publish_module(db: AsyncSession, module_id: uuid.UUID) -> Module:
    mod = await db.scalar(select(Module).where(Module.id == module_id))
    if not mod:
        raise NotFoundError("Module")
    mod.is_published = True
    await db.flush()
    logger.info("Admin published module '%s'", mod.title)
    return mod


async def delete_module(db: AsyncSession, module_id: uuid.UUID) -> None:
    mod = await db.scalar(select(Module).where(Module.id == module_id))
    if not mod:
        raise NotFoundError("Module")
    await db.delete(mod)
    await db.flush()


# ── Lesson CRUD ────────────────────────────────────────────────────────────────

async def create_lesson(db: AsyncSession, req: CreateLessonRequest) -> Lesson:
    # Verify module exists
    mod = await db.scalar(select(Module).where(Module.id == req.module_id))
    if not mod:
        raise NotFoundError("Module")

    existing = await db.scalar(
        select(Lesson).where(
            Lesson.module_id == req.module_id, Lesson.slug == req.slug
        )
    )
    if existing:
        raise ConflictError(f"Lesson slug '{req.slug}' already exists in this module")

    lesson = Lesson(**req.model_dump())
    db.add(lesson)
    await db.flush()
    logger.info("Admin created lesson '%s' in module %s", lesson.title, req.module_id)
    return lesson


async def update_lesson(
    db: AsyncSession, lesson_id: uuid.UUID, req: UpdateLessonRequest
) -> Lesson:
    lesson = await db.scalar(select(Lesson).where(Lesson.id == lesson_id))
    if not lesson:
        raise NotFoundError("Lesson")
    for field, value in req.model_dump(exclude_none=True).items():
        setattr(lesson, field, value)
    await db.flush()
    return lesson


async def publish_lesson(db: AsyncSession, lesson_id: uuid.UUID) -> Lesson:
    lesson = await db.scalar(select(Lesson).where(Lesson.id == lesson_id))
    if not lesson:
        raise NotFoundError("Lesson")
    lesson.is_published = True
    await db.flush()
    return lesson


async def delete_lesson(db: AsyncSession, lesson_id: uuid.UUID) -> None:
    lesson = await db.scalar(select(Lesson).where(Lesson.id == lesson_id))
    if not lesson:
        raise NotFoundError("Lesson")
    await db.delete(lesson)
    await db.flush()


# ── Quiz CRUD ──────────────────────────────────────────────────────────────────

async def create_quiz(db: AsyncSession, req: CreateQuizRequest) -> Quiz:
    lesson = await db.scalar(select(Lesson).where(Lesson.id == req.lesson_id))
    if not lesson:
        raise NotFoundError("Lesson")

    quiz = Quiz(
        lesson_id=req.lesson_id,
        title=req.title,
        passing_score=req.passing_score,
        max_attempts=req.max_attempts,
    )
    db.add(quiz)
    await db.flush()

    for i, q_req in enumerate(req.questions):
        q = Question(
            quiz_id=quiz.id,
            order_index=q_req.order_index if q_req.order_index is not None else i,
            **q_req.model_dump(exclude={"order_index"}),
        )
        db.add(q)
    await db.flush()

    logger.info("Admin created quiz '%s' for lesson %s", quiz.title, req.lesson_id)
    return quiz


async def add_question(
    db: AsyncSession, quiz_id: uuid.UUID, req: CreateQuestionRequest
) -> Question:
    quiz = await db.scalar(select(Quiz).where(Quiz.id == quiz_id))
    if not quiz:
        raise NotFoundError("Quiz")
    q = Question(quiz_id=quiz_id, **req.model_dump())
    db.add(q)
    await db.flush()
    return q


async def delete_quiz(db: AsyncSession, quiz_id: uuid.UUID) -> None:
    quiz = await db.scalar(select(Quiz).where(Quiz.id == quiz_id))
    if not quiz:
        raise NotFoundError("Quiz")
    await db.delete(quiz)
    await db.flush()


# ── User management (read-only for admins) ─────────────────────────────────────

async def list_users(
    db: AsyncSession,
    limit: int = 50,
    offset: int = 0,
) -> list[User]:
    result = await db.execute(
        select(User).order_by(User.created_at.desc()).limit(limit).offset(offset)
    )
    return result.scalars().all()
