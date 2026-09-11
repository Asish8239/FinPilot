"""
Learning service — module/lesson retrieval, progress tracking, lesson completion.

All business logic lives here; route handlers are thin wrappers.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError
from app.models.learning import Lesson, Module
from app.models.progress import (
    Streak,
    UserProgress,
    UserXP,
)
from app.schemas.learning import (
    CompleteLessonResponse,
    LessonResponse,
    LessonSummary,
    ModuleDetailResponse,
)
from app.services.progress_service import (
    check_badges,
    compute_level,
    compute_streak,
)


logger = logging.getLogger(__name__)


# ── Module helpers ─────────────────────────────────────────────────────────────


async def get_module_by_slug(
    db: AsyncSession,
    slug: str,
) -> Module:
    """
    Direct slug lookup — avoids the N+1 scan in the original route.
    """
    result = await db.execute(
        select(Module)
        .where(Module.slug == slug)
        .options(selectinload(Module.lessons))
    )

    mod = result.scalar_one_or_none()

    if not mod:
        raise NotFoundError("Module")

    return mod


async def list_modules(
    db: AsyncSession,
    user_id: uuid.UUID,
    level: str | None = None,
) -> list[ModuleDetailResponse]:
    """
    Return all published modules with lesson-level progress.

    UserProgress.xp_earned is included in each LessonSummary so the
    frontend receives the actual XP earned by the user rather than
    a hard-coded zero.
    """

    # ------------------------------------------------------------------
    # Load published modules and their lessons
    # ------------------------------------------------------------------
    q = (
        select(Module)
        .where(Module.is_published == True)
        .options(selectinload(Module.lessons))
        .order_by(Module.order_index)
    )

    if level:
        q = q.where(Module.level == level)

    result = await db.execute(q)
    modules = result.scalars().all()

    # ------------------------------------------------------------------
    # Count completed lessons per module for this user
    # ------------------------------------------------------------------
    completed_rows = await db.execute(
        select(
            Lesson.module_id,
            func.count(UserProgress.id),
        )
        .join(
            UserProgress,
            (UserProgress.lesson_id == Lesson.id)
            & (UserProgress.user_id == user_id)
            & (UserProgress.completed == True),
        )
        .where(Lesson.is_published == True)
        .group_by(Lesson.module_id)
    )

    completed_map: dict[uuid.UUID, int] = {
        row[0]: row[1]
        for row in completed_rows
    }

    # ------------------------------------------------------------------
    # Load completed lesson IDs AND XP earned
    # ------------------------------------------------------------------
    progress_rows = await db.execute(
        select(
            UserProgress.lesson_id,
            UserProgress.xp_earned,
        ).where(
            UserProgress.user_id == user_id,
            UserProgress.completed == True,
        )
    )

    progress_map: dict[uuid.UUID, int] = {
        row[0]: row[1]
        for row in progress_rows
    }

    done_ids: set[uuid.UUID] = set(progress_map.keys())

    # ------------------------------------------------------------------
    # Build response
    # ------------------------------------------------------------------
    out: list[ModuleDetailResponse] = []

    for mod in modules:
        published = [
            lesson
            for lesson in mod.lessons
            if lesson.is_published
        ]

        total = len(published)
        done = completed_map.get(mod.id, 0)

        out.append(
            ModuleDetailResponse(
                id=mod.id,
                title=mod.title,
                slug=mod.slug,
                description=mod.description,
                level=mod.level,
                track=mod.track,
                order_index=mod.order_index,
                icon_url=mod.icon_url,
                is_published=mod.is_published,
                lesson_count=total,
                completed_count=done,
                completion_pct=(
                    round(done / total * 100, 1)
                    if total
                    else 0.0
                ),
                lessons=[
                    LessonSummary(
                        id=lesson.id,
                        title=lesson.title,
                        slug=lesson.slug,
                        content_type=lesson.content_type,
                        order_index=lesson.order_index,
                        estimated_minutes=lesson.estimated_minutes,
                        xp_reward=lesson.xp_reward,
                        is_published=lesson.is_published,
                        completed=lesson.id in done_ids,
                        xp_earned=progress_map.get(
                            lesson.id,
                            0,
                        ),
                    )
                    for lesson in published
                ],
            )
        )

    return out


# ── Lesson helpers ─────────────────────────────────────────────────────────────


async def get_lesson_by_slug(
    db: AsyncSession,
    module_slug: str,
    lesson_slug: str,
) -> tuple[Module, Lesson]:
    """
    Fetch a published lesson by module + lesson slugs
    in a single join query.
    """

    result = await db.execute(
        select(Module, Lesson)
        .join(
            Lesson,
            Lesson.module_id == Module.id,
        )
        .where(
            Module.slug == module_slug,
            Lesson.slug == lesson_slug,
            Module.is_published == True,
            Lesson.is_published == True,
        )
    )

    row = result.first()

    if not row:
        raise NotFoundError("Lesson")

    return row.Module, row.Lesson


async def get_lesson(
    db: AsyncSession,
    lesson_id: uuid.UUID,
    user_id: uuid.UUID,
) -> tuple[Lesson, UserProgress | None]:
    """
    Fetch a published lesson and the user's progress record.
    """

    lesson = await db.scalar(
        select(Lesson).where(
            Lesson.id == lesson_id,
            Lesson.is_published == True,
        )
    )

    if not lesson:
        raise NotFoundError("Lesson")

    progress = await db.scalar(
        select(UserProgress).where(
            UserProgress.user_id == user_id,
            UserProgress.lesson_id == lesson_id,
        )
    )

    return lesson, progress


async def build_lesson_response(
    lesson: Lesson,
    progress: UserProgress | None,
) -> LessonResponse:
    """
    Build the full lesson response including actual user progress.
    """

    return LessonResponse(
        id=lesson.id,
        module_id=lesson.module_id,
        title=lesson.title,
        slug=lesson.slug,
        content_type=lesson.content_type,
        content_markdown=lesson.content_markdown,
        video_url=lesson.video_url,
        order_index=lesson.order_index,
        estimated_minutes=lesson.estimated_minutes,
        xp_reward=lesson.xp_reward,
        is_published=lesson.is_published,
        completed=(
            progress.completed
            if progress
            else False
        ),
        xp_earned=(
            progress.xp_earned
            if progress
            else 0
        ),
        created_at=lesson.created_at,
    )


# ── Completion ─────────────────────────────────────────────────────────────────


async def _ensure_xp_streak(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> tuple[UserXP, Streak]:
    """
    Lazily create XP and streak rows if they don't exist yet.
    """

    xp_row = await db.scalar(
        select(UserXP).where(
            UserXP.user_id == user_id
        )
    )

    if xp_row is None:
        xp_row = UserXP(user_id=user_id)
        db.add(xp_row)
        await db.flush()

    streak_row = await db.scalar(
        select(Streak).where(
            Streak.user_id == user_id
        )
    )

    if streak_row is None:
        streak_row = Streak(user_id=user_id)
        db.add(streak_row)
        await db.flush()

    return xp_row, streak_row


async def complete_lesson(
    db: AsyncSession,
    lesson_id: uuid.UUID,
    user_id: uuid.UUID,
    time_spent_sec: int,
) -> CompleteLessonResponse:
    """
    Mark a lesson complete for a user.

    Idempotent:
        Calling the endpoint twice does not double-award XP.

    Thread-safe:
        The database UNIQUE constraint on
        (user_id, lesson_id) protects progress records.
    """

    # ------------------------------------------------------------------
    # Verify lesson exists and is published
    # ------------------------------------------------------------------
    lesson = await db.scalar(
        select(Lesson).where(
            Lesson.id == lesson_id,
            Lesson.is_published == True,
        )
    )

    if not lesson:
        raise NotFoundError("Lesson")

    # ------------------------------------------------------------------
    # Ensure XP and streak records exist
    # ------------------------------------------------------------------
    xp_row, streak_row = await _ensure_xp_streak(
        db,
        user_id,
    )

    # ------------------------------------------------------------------
    # Find existing progress record
    # ------------------------------------------------------------------
    progress = await db.scalar(
        select(UserProgress).where(
            UserProgress.user_id == user_id,
            UserProgress.lesson_id == lesson_id,
        )
    )

    # ------------------------------------------------------------------
    # Idempotency
    # ------------------------------------------------------------------
    if progress and progress.completed:
        logger.debug(
            "Lesson %s already completed by user %s "
            "— returning cached result",
            lesson_id,
            user_id,
        )

        return CompleteLessonResponse(
            lesson_id=lesson_id,
            xp_earned=progress.xp_earned,
            total_xp=xp_row.total_xp,
            level=xp_row.level,
            streak=streak_row.current_streak,
            already_completed=True,
        )

    # ------------------------------------------------------------------
    # Award lesson XP
    # ------------------------------------------------------------------
    xp_earned = lesson.xp_reward
    now = datetime.now(timezone.utc)

    # ------------------------------------------------------------------
    # Create or update progress
    # ------------------------------------------------------------------
    if progress is None:
        progress = UserProgress(
            user_id=user_id,
            lesson_id=lesson_id,
            completed=True,
            completed_at=now,
            time_spent_sec=max(
                0,
                time_spent_sec,
            ),
            xp_earned=xp_earned,
        )

        db.add(progress)

    else:
        progress.completed = True
        progress.completed_at = now
        progress.time_spent_sec = max(
            0,
            time_spent_sec,
        )
        progress.xp_earned = xp_earned

    # ------------------------------------------------------------------
    # Update total XP
    # ------------------------------------------------------------------
    xp_row.total_xp += xp_earned
    xp_row.level = compute_level(
        xp_row.total_xp
    )

    # ------------------------------------------------------------------
    # Update streak
    # ------------------------------------------------------------------
    new_streak, updated = compute_streak(
        streak_row.last_activity_date,
        streak_row.current_streak,
    )

    if updated:
        streak_row.current_streak = new_streak
        streak_row.longest_streak = max(
            streak_row.longest_streak,
            new_streak,
        )
        streak_row.last_activity_date = now.date()

    # ------------------------------------------------------------------
    # Flush progress/XP before evaluating badges
    # ------------------------------------------------------------------
    await db.flush()

    # ------------------------------------------------------------------
    # Evaluate newly earned badges
    # ------------------------------------------------------------------
    new_badges = await check_badges(
        db,
        user_id,
        xp_row,
        streak_row,
    )

    logger.info(
        "User %s completed lesson %s (+%d XP, streak=%d)",
        user_id,
        lesson_id,
        xp_earned,
        streak_row.current_streak,
    )

    # ------------------------------------------------------------------
    # Final response
    # ------------------------------------------------------------------
    return CompleteLessonResponse(
        lesson_id=lesson_id,
        xp_earned=xp_earned,
        total_xp=xp_row.total_xp,
        level=xp_row.level,
        streak=streak_row.current_streak,
        new_badges=new_badges,
        already_completed=False,
    )