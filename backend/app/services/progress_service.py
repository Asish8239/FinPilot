from __future__ import annotations

import uuid
from datetime import date, timedelta, datetime, timezone

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.progress import (
    UserXP,
    Streak,
    Badge,
    UserBadge,
    UserProgress,
)
from app.models.learning import Lesson, Module
from app.models.calculator import CalculatorHistory
from app.models.budget import BudgetPlan, BudgetEntry
from app.schemas.progress import (
    DashboardResponse,
    BadgesResponse,
    BadgeResponse,
    DayActivity,
    RecommendedLesson,
    BudgetSnapshot,
    SIPSnapshot,
)


XP_THRESHOLDS = [0, 100, 300, 600, 1000]


def compute_level(total_xp: int) -> int:
    """
    Calculate the user's level from total XP.

    Levels:
      1 -> 0 XP
      2 -> 100 XP
      3 -> 300 XP
      4 -> 600 XP
      5 -> 1000 XP
      6+ -> every additional 500 XP
    """
    for i in range(len(XP_THRESHOLDS) - 1, -1, -1):
        if total_xp >= XP_THRESHOLDS[i]:
            base = i + 1

            if total_xp >= 1000:
                return 5 + (total_xp - 1000) // 500

            return base

    return 1


def xp_to_next_level(total_xp: int) -> int:
    """Return the XP required to reach the next level."""
    level = compute_level(total_xp)

    if level < len(XP_THRESHOLDS):
        return XP_THRESHOLDS[level] - total_xp

    next_threshold = 1000 + (level - 4) * 500
    return next_threshold - total_xp


def compute_streak(
    last_activity: date | None,
    current: int,
) -> tuple[int, bool]:
    """
    Calculate the user's current streak.

    Returns:
        (new_streak, updated)
    """
    today = date.today()

    if last_activity == today:
        return current, False

    if last_activity == today - timedelta(days=1):
        return current + 1, True

    return 1, True


async def check_badges(
    db: AsyncSession,
    user_id: uuid.UUID,
    xp_row: UserXP,
    streak_row: Streak,
) -> list[str]:
    """
    Award newly earned badges.

    Badge criteria are evaluated against:
      - lessons_completed
      - streak_days
      - xp_total
      - module_completed

    IMPORTANT:
    A module counts as completed only when ALL of its published
    lessons have been completed by the user.
    """

    # ------------------------------------------------------------------
    # Completed lessons
    # ------------------------------------------------------------------
    lessons_done = (
        await db.scalar(
            select(func.count(UserProgress.id)).where(
                UserProgress.user_id == user_id,
                UserProgress.completed == True,
            )
        )
        or 0
    )

    # ------------------------------------------------------------------
    # Fully completed modules
    #
    # A module is complete only when:
    #
    #     completed published lessons
    #     ==
    #     total published lessons
    #
    # This prevents "Module Master" from being awarded after only
    # completing one lesson.
    # ------------------------------------------------------------------
    module_completion_result = await db.execute(
        select(
            Module.id,
            func.count(Lesson.id).label("total_lessons"),
            func.count(UserProgress.id).label("completed_lessons"),
        )
        .join(
            Lesson,
            (Lesson.module_id == Module.id)
            & (Lesson.is_published == True),
        )
        .outerjoin(
            UserProgress,
            (UserProgress.lesson_id == Lesson.id)
            & (UserProgress.user_id == user_id)
            & (UserProgress.completed == True),
        )
        .where(Module.is_published == True)
        .group_by(Module.id)
    )

    modules_done = 0

    for row in module_completion_result:
        total_lessons = row.total_lessons or 0
        completed_lessons = row.completed_lessons or 0

        if total_lessons > 0 and completed_lessons >= total_lessons:
            modules_done += 1

    # ------------------------------------------------------------------
    # Badge statistics
    # ------------------------------------------------------------------
    stats = {
        "lessons_completed": lessons_done,
        "streak_days": streak_row.current_streak,
        "xp_total": xp_row.total_xp,
        "module_completed": modules_done,
    }

    # ------------------------------------------------------------------
    # Load all badge definitions
    # ------------------------------------------------------------------
    all_badges_result = await db.execute(select(Badge))
    all_badges = all_badges_result.scalars().all()

    # ------------------------------------------------------------------
    # Load already-earned badges
    # ------------------------------------------------------------------
    earned_result = await db.execute(
        select(UserBadge.badge_id).where(
            UserBadge.user_id == user_id
        )
    )

    earned_ids = {row[0] for row in earned_result}

    # ------------------------------------------------------------------
    # Award newly qualified badges
    # ------------------------------------------------------------------
    new_badge_names: list[str] = []

    for badge in all_badges:
        if badge.id in earned_ids:
            continue

        stat_val = stats.get(badge.criteria_type, 0)

        if stat_val >= badge.criteria_value:
            db.add(
                UserBadge(
                    user_id=user_id,
                    badge_id=badge.id,
                )
            )
            new_badge_names.append(badge.name)

    if new_badge_names:
        await db.flush()

    return new_badge_names


async def get_dashboard(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> DashboardResponse:
    # ------------------------------------------------------------------
    # XP & streak
    # ------------------------------------------------------------------
    xp_row = await db.scalar(
        select(UserXP).where(UserXP.user_id == user_id)
    )

    streak_row = await db.scalar(
        select(Streak).where(Streak.user_id == user_id)
    )

    total_xp = xp_row.total_xp if xp_row else 0
    level = compute_level(total_xp)
    xp_next = xp_to_next_level(total_xp)

    cur_streak = (
        streak_row.current_streak
        if streak_row
        else 0
    )

    long_streak = (
        streak_row.longest_streak
        if streak_row
        else 0
    )

    # ------------------------------------------------------------------
    # Lesson counts
    # ------------------------------------------------------------------
    total_lessons = (
        await db.scalar(
            select(func.count(Lesson.id)).where(
                Lesson.is_published == True
            )
        )
        or 0
    )

    completed_lessons = (
        await db.scalar(
            select(func.count(UserProgress.id)).where(
                UserProgress.user_id == user_id,
                UserProgress.completed == True,
            )
        )
        or 0
    )

    completion_pct = (
        round(
            completed_lessons / total_lessons * 100,
            1,
        )
        if total_lessons
        else 0.0
    )

    # ------------------------------------------------------------------
    # Weekly activity — last 7 days
    # ------------------------------------------------------------------
    today = date.today()
    weekly_activity: list[DayActivity] = []

    for i in range(6, -1, -1):
        day = today - timedelta(days=i)

        day_start = datetime(
            day.year,
            day.month,
            day.day,
            tzinfo=timezone.utc,
        )

        day_end = datetime(
            day.year,
            day.month,
            day.day,
            23,
            59,
            59,
            tzinfo=timezone.utc,
        )

        count = (
            await db.scalar(
                select(func.count(UserProgress.id)).where(
                    UserProgress.user_id == user_id,
                    UserProgress.completed == True,
                    UserProgress.completed_at >= day_start,
                    UserProgress.completed_at <= day_end,
                )
            )
            or 0
        )

        xp_day = (
            await db.scalar(
                select(
                    func.coalesce(
                        func.sum(UserProgress.xp_earned),
                        0,
                    )
                ).where(
                    UserProgress.user_id == user_id,
                    UserProgress.completed == True,
                    UserProgress.completed_at >= day_start,
                    UserProgress.completed_at <= day_end,
                )
            )
            or 0
        )

        weekly_activity.append(
            DayActivity(
                date=day.isoformat(),
                lessons_completed=count,
                xp_earned=xp_day,
            )
        )

    # ------------------------------------------------------------------
    # Recent badges — last 5
    # ------------------------------------------------------------------
    recent_badges_result = await db.execute(
        select(UserBadge)
        .where(UserBadge.user_id == user_id)
        .order_by(UserBadge.earned_at.desc())
        .limit(5)
    )

    recent_user_badges = recent_badges_result.scalars().all()

    badge_responses: list[BadgeResponse] = []

    for ub in recent_user_badges:
        badge_result = await db.scalar(
            select(Badge).where(Badge.id == ub.badge_id)
        )

        if badge_result:
            badge_responses.append(
                BadgeResponse(
                    id=badge_result.id,
                    name=badge_result.name,
                    description=badge_result.description,
                    icon_url=badge_result.icon_url,
                    criteria_type=badge_result.criteria_type,
                    criteria_value=badge_result.criteria_value,
                    earned=True,
                    earned_at=ub.earned_at,
                )
            )

    # ------------------------------------------------------------------
    # Recommended lessons
    #
    # One next unfinished lesson per track.
    # ------------------------------------------------------------------
    completed_ids_result = await db.execute(
        select(UserProgress.lesson_id).where(
            UserProgress.user_id == user_id,
            UserProgress.completed == True,
        )
    )

    completed_ids = {
        row[0]
        for row in completed_ids_result
    }

    recommended: list[RecommendedLesson] = []

    for track in ["A", "B", "C"]:
        modules_result = await db.execute(
            select(Module)
            .where(
                Module.track == track,
                Module.is_published == True,
            )
            .order_by(Module.order_index)
        )

        for mod in modules_result.scalars():
            lessons_result = await db.execute(
                select(Lesson)
                .where(
                    Lesson.module_id == mod.id,
                    Lesson.is_published == True,
                )
                .order_by(Lesson.order_index)
            )

            for lesson in lessons_result.scalars():
                if lesson.id not in completed_ids:
                    recommended.append(
                        RecommendedLesson(
                            lesson_id=lesson.id,
                            lesson_title=lesson.title,
                            module_title=mod.title,
                            module_slug=mod.slug,
                            lesson_slug=lesson.slug,
                            track=track,
                            xp_reward=lesson.xp_reward,
                        )
                    )
                    break
            else:
                continue

            break

    # ------------------------------------------------------------------
    # Budget snapshot — current month
    # ------------------------------------------------------------------
    budget_summary = None

    today_first = date(
        today.year,
        today.month,
        1,
    )

    plan_result = await db.scalar(
        select(BudgetPlan).where(
            BudgetPlan.user_id == user_id,
            BudgetPlan.month == today_first,
        )
    )

    if plan_result:
        entries_result = await db.execute(
            select(BudgetEntry).where(
                BudgetEntry.plan_id == plan_result.id
            )
        )

        entries = entries_result.scalars().all()

        total_actual = sum(
            float(e.actual)
            for e in entries
        )

        savings = sum(
            float(e.actual)
            for e in entries
            if e.category in ("savings", "investments")
        )

        income = float(plan_result.monthly_income)

        budget_summary = BudgetSnapshot(
            income=income,
            spent=total_actual,
            remaining=income - total_actual,
            savings_rate=(
                round(
                    savings / income * 100,
                    1,
                )
                if income
                else 0.0
            ),
        )

    # ------------------------------------------------------------------
    # Calculator history — last 3
    # ------------------------------------------------------------------
    calc_result = await db.execute(
        select(CalculatorHistory)
        .where(
            CalculatorHistory.user_id == user_id
        )
        .order_by(
            CalculatorHistory.created_at.desc()
        )
        .limit(3)
    )

    calc_history = [
        SIPSnapshot.model_validate(c)
        for c in calc_result.scalars()
    ]

    # ------------------------------------------------------------------
    # Final dashboard response
    # ------------------------------------------------------------------
    return DashboardResponse(
        overall_completion_pct=completion_pct,
        completed_lessons=completed_lessons,
        total_lessons=total_lessons,
        current_streak=cur_streak,
        longest_streak=long_streak,
        total_xp=total_xp,
        level=level,
        xp_to_next_level=xp_next,
        recent_badges=badge_responses,
        recommended_lessons=recommended,
        weekly_activity=weekly_activity,
        budget_summary=budget_summary,
        calculator_history=calc_history,
    )