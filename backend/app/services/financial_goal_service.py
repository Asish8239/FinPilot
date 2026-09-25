"""Financial goal business logic."""

from __future__ import annotations

import calendar
from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.financial_goal import FinancialGoal
from app.schemas.financial_goal import (
    FinancialGoalCreate,
    FinancialGoalUpdate,
)

ZERO = Decimal("0")
HUNDRED = Decimal("100")


def _money(value: Decimal) -> Decimal:
    return Decimal(str(value)).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
    )


def _ratio(value: Decimal) -> Decimal:
    return Decimal(str(value)).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
    )


def _normalize_category(value: str) -> str:
    return value.strip().lower()


def _normalize_status(value: str) -> str:
    normalized = value.strip().lower()

    allowed = {
        "active",
        "paused",
        "completed",
    }

    if normalized not in allowed:
        raise ValueError(
            "Goal status must be active, paused, or completed."
        )

    return normalized


def _months_between(start: date, end: date) -> int:
    """Return the number of calendar months remaining.

    A partial remaining month counts as one month because the goal
    contribution is a monthly planning figure.
    """

    if end <= start:
        return 0

    months = (
        (end.year - start.year) * 12
        + (end.month - start.month)
    )

    if end.day > start.day:
        months += 1

    return max(0, months)


def _required_monthly_contribution(
    remaining_amount: Decimal,
    months_remaining: int | None,
) -> Decimal:
    if remaining_amount <= ZERO:
        return ZERO

    if months_remaining is None or months_remaining <= 0:
        return remaining_amount

    return _money(
        remaining_amount / Decimal(months_remaining)
    )


def _progress_percent(
    current_amount: Decimal,
    target_amount: Decimal,
) -> Decimal:
    if target_amount <= ZERO:
        return ZERO

    progress = (
        current_amount / target_amount
    ) * HUNDRED

    return _ratio(
        min(HUNDRED, max(ZERO, progress))
    )


async def list_goals(
    db: AsyncSession,
    user_id,
) -> list[FinancialGoal]:
    result = await db.scalars(
        select(FinancialGoal)
        .where(FinancialGoal.user_id == user_id)
        .order_by(
            FinancialGoal.status.asc(),
            FinancialGoal.priority.asc(),
            FinancialGoal.target_date.asc().nulls_last(),
            FinancialGoal.created_at.asc(),
        )
    )

    return list(result.all())


async def get_goal(
    db: AsyncSession,
    user_id,
    goal_id,
) -> FinancialGoal | None:
    return await db.scalar(
        select(FinancialGoal).where(
            FinancialGoal.id == goal_id,
            FinancialGoal.user_id == user_id,
        )
    )


async def create_goal(
    db: AsyncSession,
    user_id,
    data: FinancialGoalCreate,
) -> FinancialGoal:
    current_amount = _money(data.current_amount)
    target_amount = _money(data.target_amount)

    if current_amount > target_amount:
        current_amount = target_amount

    status = (
        "completed"
        if current_amount >= target_amount
        else "active"
    )

    goal = FinancialGoal(
        user_id=user_id,
        name=data.name.strip(),
        category=_normalize_category(data.category),
        target_amount=target_amount,
        current_amount=current_amount,
        monthly_contribution=_money(
            data.monthly_contribution
        ),
        target_date=data.target_date,
        priority=data.priority,
        status=status,
        notes=data.notes.strip() if data.notes else None,
    )

    db.add(goal)

    await db.commit()
    await db.refresh(goal)

    return goal


async def update_goal(
    db: AsyncSession,
    user_id,
    goal_id,
    data: FinancialGoalUpdate,
) -> FinancialGoal | None:
    goal = await get_goal(
        db,
        user_id,
        goal_id,
    )

    if goal is None:
        return None

    if data.name is not None:
        goal.name = data.name.strip()

    if data.category is not None:
        goal.category = _normalize_category(
            data.category
        )

    if data.target_amount is not None:
        goal.target_amount = _money(
            data.target_amount
        )

    if data.current_amount is not None:
        goal.current_amount = _money(
            data.current_amount
        )

    if data.monthly_contribution is not None:
        goal.monthly_contribution = _money(
            data.monthly_contribution
        )

    if data.target_date is not None:
        goal.target_date = data.target_date

    if data.priority is not None:
        goal.priority = data.priority

    if data.status is not None:
        goal.status = _normalize_status(
            data.status
        )

    if data.notes is not None:
        goal.notes = (
            data.notes.strip()
            if data.notes.strip()
            else None
        )

    target_amount = _money(
        Decimal(str(goal.target_amount))
    )

    current_amount = _money(
        Decimal(str(goal.current_amount))
    )

    if current_amount > target_amount:
        goal.current_amount = target_amount
        current_amount = target_amount

    if current_amount >= target_amount:
        goal.status = "completed"
    elif goal.status == "completed":
        goal.status = "active"

    await db.commit()
    await db.refresh(goal)

    return goal


async def delete_goal(
    db: AsyncSession,
    user_id,
    goal_id,
) -> bool:
    goal = await get_goal(
        db,
        user_id,
        goal_id,
    )

    if goal is None:
        return False

    await db.delete(goal)
    await db.commit()

    return True


def analyze_goal(
    goal: FinancialGoal,
    currency: str = "INR",
) -> dict:
    target_amount = _money(
        Decimal(str(goal.target_amount))
    )

    current_amount = _money(
        Decimal(str(goal.current_amount))
    )

    remaining_amount = max(
        ZERO,
        target_amount - current_amount,
    )

    progress_percent = _progress_percent(
        current_amount,
        target_amount,
    )

    today = date.today()

    months_remaining: int | None = None

    if goal.target_date is not None:
        months_remaining = _months_between(
            today,
            goal.target_date,
        )

    required_monthly = _required_monthly_contribution(
        remaining_amount,
        months_remaining,
    )

    monthly_contribution = _money(
        Decimal(str(goal.monthly_contribution))
    )

    completed = (
        remaining_amount <= ZERO
        or goal.status == "completed"
    )

    if completed:
        on_track = True
    elif goal.target_date is None:
        on_track = monthly_contribution > ZERO
    else:
        on_track = (
            monthly_contribution
            >= required_monthly
        )

    return {
        "id": goal.id,
        "name": goal.name,
        "category": goal.category,
        "status": goal.status,
        "currency": currency,
        "target_amount": target_amount,
        "current_amount": current_amount,
        "remaining_amount": _money(
            remaining_amount
        ),
        "progress_percent": progress_percent,
        "monthly_contribution": monthly_contribution,
        "required_monthly_contribution": required_monthly,
        "target_date": goal.target_date,
        "months_remaining": months_remaining,
        "on_track": on_track,
        "completed": completed,
    }


def build_summary(
    goals: list[FinancialGoal],
    currency: str = "INR",
) -> dict:
    total_goals = len(goals)

    active_goals = sum(
        1
        for goal in goals
        if goal.status == "active"
    )

    completed_goals = sum(
        1
        for goal in goals
        if goal.status == "completed"
    )

    total_target = sum(
        (
            Decimal(str(goal.target_amount))
            for goal in goals
        ),
        ZERO,
    )

    total_current = sum(
        (
            Decimal(str(goal.current_amount))
            for goal in goals
        ),
        ZERO,
    )

    total_remaining = max(
        ZERO,
        total_target - total_current,
    )

    overall_progress = (
        _progress_percent(
            total_current,
            total_target,
        )
        if total_target > ZERO
        else ZERO
    )

    return {
        "currency": currency,
        "total_goals": total_goals,
        "active_goals": active_goals,
        "completed_goals": completed_goals,
        "total_target_amount": _money(total_target),
        "total_current_amount": _money(total_current),
        "total_remaining_amount": _money(
            total_remaining
        ),
        "overall_progress_percent": overall_progress,
    }