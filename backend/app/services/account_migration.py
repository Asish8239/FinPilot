"""
Anonymous -> authenticated account data migration.

An anonymous FinPilot user is identified by the browser-generated
X-Session-ID UUID and therefore has that UUID as users.id.

An authenticated user has a separately generated users.id and a
Supabase UID in users.supabase_uid.

This service safely merges the anonymous account into the authenticated
account without allowing an arbitrary session ID to claim authenticated
data.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_tutor import AIConversation
from app.models.budget import BudgetEntry, BudgetPlan
from app.models.calculator import CalculatorHistory
from app.models.progress import (
    Streak,
    UserBadge,
    UserProgress,
    UserXP,
)
from app.models.quiz import UserQuizAttempt
from app.models.user import User
from app.models.watchlist import WatchlistItem


async def migrate_anonymous_account(
    db: AsyncSession,
    anonymous_user_id: uuid.UUID,
    authenticated_user: User,
) -> bool:
    """
    Merge an anonymous user's data into an authenticated FinPilot user.

    Returns:
        True  -> migration performed
        False -> nothing needed to migrate
    """

    # Never allow the fallback UUID to participate in migration.
    if anonymous_user_id.int == 0:
        return False

    # The anonymous source must be different from the authenticated user.
    if anonymous_user_id == authenticated_user.id:
        return False

    anonymous_user = await db.scalar(
        select(User).where(User.id == anonymous_user_id)
    )

    # No anonymous account exists for this browser session.
    if anonymous_user is None:
        return False

    # CRITICAL SECURITY CHECK:
    # Only a genuinely anonymous local user may be migrated.
    #
    # An authenticated user's X-Session-ID must never be able to point
    # at another authenticated account.
    if anonymous_user.supabase_uid is not None:
        return False

    target_user_id = authenticated_user.id

    await _migrate_progress(
        db,
        anonymous_user_id,
        target_user_id,
    )

    await _migrate_quiz_attempts(
        db,
        anonymous_user_id,
        target_user_id,
    )

    await _migrate_xp(
        db,
        anonymous_user_id,
        target_user_id,
    )

    await _migrate_streak(
        db,
        anonymous_user_id,
        target_user_id,
    )

    await _migrate_badges(
        db,
        anonymous_user_id,
        target_user_id,
    )

    await _migrate_conversations(
        db,
        anonymous_user_id,
        target_user_id,
    )

    await _migrate_budgets(
        db,
        anonymous_user_id,
        target_user_id,
    )

    await _migrate_calculator_history(
        db,
        anonymous_user_id,
        target_user_id,
    )

    await _migrate_watchlist(
        db,
        anonymous_user_id,
        target_user_id,
    )

    # Delete the now-empty anonymous user.
    #
    # All remaining child records should have been moved above.
    # ON DELETE CASCADE provides a final safety net for anything that
    # legitimately remains attached to the anonymous user.
    await db.delete(anonymous_user)

    await db.flush()

    return True


async def _migrate_progress(
    db: AsyncSession,
    source_user_id: uuid.UUID,
    target_user_id: uuid.UUID,
) -> None:
    """Merge lesson progress while respecting the unique user/lesson key."""

    source_rows = (
        await db.scalars(
            select(UserProgress).where(
                UserProgress.user_id == source_user_id
            )
        )
    ).all()

    if not source_rows:
        return

    target_rows = (
        await db.scalars(
            select(UserProgress).where(
                UserProgress.user_id == target_user_id
            )
        )
    ).all()

    target_by_lesson = {
        row.lesson_id: row
        for row in target_rows
    }

    for source in source_rows:
        target = target_by_lesson.get(source.lesson_id)

        if target is None:
            source.user_id = target_user_id
            continue

        # Merge both records.
        target.completed = target.completed or source.completed

        target.time_spent_sec = max(
            target.time_spent_sec or 0,
            source.time_spent_sec or 0,
        )

        target.xp_earned = max(
            target.xp_earned or 0,
            source.xp_earned or 0,
        )

        target.completed_at = _latest_datetime(
            target.completed_at,
            source.completed_at,
        )

        await db.delete(source)


async def _migrate_quiz_attempts(
    db: AsyncSession,
    source_user_id: uuid.UUID,
    target_user_id: uuid.UUID,
) -> None:
    """Move all quiz attempts to the authenticated account."""

    await db.execute(
        UserQuizAttempt.__table__.update()
        .where(UserQuizAttempt.user_id == source_user_id)
        .values(user_id=target_user_id)
    )


async def _migrate_xp(
    db: AsyncSession,
    source_user_id: uuid.UUID,
    target_user_id: uuid.UUID,
) -> None:
    """Merge XP totals and preserve the strongest level."""

    source = await db.scalar(
        select(UserXP).where(UserXP.user_id == source_user_id)
    )

    target = await db.scalar(
        select(UserXP).where(UserXP.user_id == target_user_id)
    )

    if source is None:
        return

    if target is None:
        source.user_id = target_user_id
        return

    target.total_xp = (
        (target.total_xp or 0)
        + (source.total_xp or 0)
    )

    target.level = max(
        target.level or 1,
        source.level or 1,
    )

    target.updated_at = _latest_datetime(
        target.updated_at,
        source.updated_at,
    )

    await db.delete(source)


async def _migrate_streak(
    db: AsyncSession,
    source_user_id: uuid.UUID,
    target_user_id: uuid.UUID,
) -> None:
    """Merge streak information without losing the stronger streak."""

    source = await db.scalar(
        select(Streak).where(Streak.user_id == source_user_id)
    )

    target = await db.scalar(
        select(Streak).where(Streak.user_id == target_user_id)
    )

    if source is None:
        return

    if target is None:
        source.user_id = target_user_id
        return

    target.current_streak = max(
        target.current_streak or 0,
        source.current_streak or 0,
    )

    target.longest_streak = max(
        target.longest_streak or 0,
        source.longest_streak or 0,
    )

    target.last_activity_date = _latest_date(
        target.last_activity_date,
        source.last_activity_date,
    )

    target.updated_at = _latest_datetime(
        target.updated_at,
        source.updated_at,
    )

    await db.delete(source)


async def _migrate_badges(
    db: AsyncSession,
    source_user_id: uuid.UUID,
    target_user_id: uuid.UUID,
) -> None:
    """Move earned badges, avoiding duplicate user/badge combinations."""

    source_badges = (
        await db.scalars(
            select(UserBadge).where(
                UserBadge.user_id == source_user_id
            )
        )
    ).all()

    if not source_badges:
        return

    target_badges = (
        await db.scalars(
            select(UserBadge).where(
                UserBadge.user_id == target_user_id
            )
        )
    ).all()

    existing_badge_ids = {
        badge.badge_id
        for badge in target_badges
    }

    for source_badge in source_badges:
        if source_badge.badge_id in existing_badge_ids:
            await db.delete(source_badge)
            continue

        source_badge.user_id = target_user_id
        existing_badge_ids.add(source_badge.badge_id)


async def _migrate_conversations(
    db: AsyncSession,
    source_user_id: uuid.UUID,
    target_user_id: uuid.UUID,
) -> None:
    """Move AI conversations; their messages follow via conversation_id."""

    await db.execute(
        AIConversation.__table__.update()
        .where(AIConversation.user_id == source_user_id)
        .values(user_id=target_user_id)
    )


async def _migrate_budgets(
    db: AsyncSession,
    source_user_id: uuid.UUID,
    target_user_id: uuid.UUID,
) -> None:
    """
    Merge budget plans.

    BudgetPlan has a unique (user_id, month) constraint.
    If both users have a plan for the same month, the authenticated
    user's plan is retained and anonymous entries are moved into it.
    """

    source_plans = (
        await db.scalars(
            select(BudgetPlan).where(
                BudgetPlan.user_id == source_user_id
            )
        )
    ).all()

    if not source_plans:
        return

    target_plans = (
        await db.scalars(
            select(BudgetPlan).where(
                BudgetPlan.user_id == target_user_id
            )
        )
    ).all()

    target_by_month = {
        plan.month: plan
        for plan in target_plans
    }

    for source_plan in source_plans:
        target_plan = target_by_month.get(source_plan.month)

        if target_plan is None:
            source_plan.user_id = target_user_id
            target_by_month[source_plan.month] = source_plan
            continue

        # Both accounts have a plan for this month.
        #
        # Preserve the authenticated user's plan as the canonical
        # monthly plan. Merge the financial values conservatively.
        target_plan.monthly_income = max(
            float(target_plan.monthly_income or 0),
            float(source_plan.monthly_income or 0),
        )

        if not target_plan.currency and source_plan.currency:
            target_plan.currency = source_plan.currency

        # Move all anonymous entries to the retained plan.
        await db.execute(
            BudgetEntry.__table__.update()
            .where(BudgetEntry.plan_id == source_plan.id)
            .values(plan_id=target_plan.id)
        )

        await db.delete(source_plan)


async def _migrate_calculator_history(
    db: AsyncSession,
    source_user_id: uuid.UUID,
    target_user_id: uuid.UUID,
) -> None:
    """Move all calculator history."""

    await db.execute(
        CalculatorHistory.__table__.update()
        .where(CalculatorHistory.user_id == source_user_id)
        .values(user_id=target_user_id)
    )


async def _migrate_watchlist(
    db: AsyncSession,
    source_user_id: uuid.UUID,
    target_user_id: uuid.UUID,
) -> None:
    """
    Merge watchlists.

    WatchlistItem has a unique (user_id, symbol) constraint.
    """

    source_items = (
        await db.scalars(
            select(WatchlistItem).where(
                WatchlistItem.user_id == source_user_id
            )
        )
    ).all()

    if not source_items:
        return

    target_items = (
        await db.scalars(
            select(WatchlistItem).where(
                WatchlistItem.user_id == target_user_id
            )
        )
    ).all()

    target_by_symbol = {
        item.symbol: item
        for item in target_items
    }

    for source in source_items:
        target = target_by_symbol.get(source.symbol)

        if target is None:
            source.user_id = target_user_id
            target_by_symbol[source.symbol] = source
            continue

        # Preserve the authenticated user's existing item.
        # If it has no notes, retain useful anonymous notes.
        if not target.notes and source.notes:
            target.notes = source.notes

        # Keep the earlier added_at timestamp.
        if source.added_at and (
            not target.added_at
            or source.added_at < target.added_at
        ):
            target.added_at = source.added_at

        await db.delete(source)


def _latest_datetime(
    first: datetime | None,
    second: datetime | None,
) -> datetime | None:
    if first is None:
        return second

    if second is None:
        return first

    return max(first, second)


def _latest_date(
    first: date | None,
    second: date | None,
) -> date | None:
    if first is None:
        return second

    if second is None:
        return first

    return max(first, second)