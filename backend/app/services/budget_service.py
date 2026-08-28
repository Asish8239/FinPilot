import uuid
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.budget import BudgetPlan, BudgetEntry
from app.schemas.budget import (
    BudgetPlanResponse, BudgetEntryResponse, BudgetAllocation,
    CreateBudgetPlanRequest, UpdateBudgetPlanRequest,
    BudgetEntryRequest, UpdateBudgetEntryRequest,
)
from app.core.exceptions import NotFoundError, ConflictError, ForbiddenError


def compute_allocation(income: float) -> BudgetAllocation:
    needs = round(income * 0.50, 2)
    wants = round(income * 0.30, 2)
    savings = round(income * 0.20, 2)
    residual = round(income - needs - wants - savings, 2)
    return BudgetAllocation(needs=needs, wants=wants, savings_investments=savings + residual)


def _plan_to_response(plan: BudgetPlan, entries: list[BudgetEntry]) -> BudgetPlanResponse:
    total_budgeted = sum(float(e.budgeted) for e in entries)
    total_actual = sum(float(e.actual) for e in entries)
    income = float(plan.monthly_income)
    savings_actual = sum(float(e.actual) for e in entries if e.category in ("savings", "investments"))

    return BudgetPlanResponse(
        id=plan.id,
        user_id=plan.user_id,
        month=plan.month,
        monthly_income=income,
        currency=plan.currency,
        suggested_allocation=compute_allocation(income),
        entries=[BudgetEntryResponse.model_validate(e) for e in entries],
        total_budgeted=total_budgeted,
        total_actual=total_actual,
        surplus=round(income - total_actual, 2),
        savings_rate=round(savings_actual / income * 100, 1) if income else 0.0,
        created_at=plan.created_at,
        updated_at=plan.updated_at,
    )


def _parse_month(month_str: str) -> date:
    try:
        parts = month_str.split("-")
        return date(int(parts[0]), int(parts[1]), 1)
    except Exception:
        raise ValueError(f"Invalid month format: {month_str}. Use YYYY-MM")


async def create_plan(db: AsyncSession, user_id: uuid.UUID, req: CreateBudgetPlanRequest) -> BudgetPlanResponse:
    month = _parse_month(req.month)
    existing = await db.scalar(
        select(BudgetPlan).where(BudgetPlan.user_id == user_id, BudgetPlan.month == month)
    )
    if existing:
        raise ConflictError(f"Budget plan for {req.month} already exists")

    plan = BudgetPlan(user_id=user_id, month=month, monthly_income=req.monthly_income, currency=req.currency)
    db.add(plan)
    await db.flush()
    return _plan_to_response(plan, [])


async def get_plan(db: AsyncSession, user_id: uuid.UUID, month_str: str) -> BudgetPlanResponse:
    month = _parse_month(month_str)
    plan = await db.scalar(
        select(BudgetPlan).where(BudgetPlan.user_id == user_id, BudgetPlan.month == month)
    )
    if not plan:
        raise NotFoundError("Budget plan")
    entries_result = await db.execute(
        select(BudgetEntry).where(BudgetEntry.plan_id == plan.id)
    )
    return _plan_to_response(plan, entries_result.scalars().all())


async def update_plan(
    db: AsyncSession, user_id: uuid.UUID, plan_id: uuid.UUID, req: UpdateBudgetPlanRequest
) -> BudgetPlanResponse:
    plan = await db.scalar(select(BudgetPlan).where(BudgetPlan.id == plan_id))
    if not plan:
        raise NotFoundError("Budget plan")
    if plan.user_id != user_id:
        raise ForbiddenError()
    if req.monthly_income is not None:
        plan.monthly_income = req.monthly_income
    await db.flush()
    entries_result = await db.execute(select(BudgetEntry).where(BudgetEntry.plan_id == plan.id))
    return _plan_to_response(plan, entries_result.scalars().all())


async def add_entry(
    db: AsyncSession, user_id: uuid.UUID, plan_id: uuid.UUID, req: BudgetEntryRequest
) -> BudgetEntryResponse:
    plan = await db.scalar(select(BudgetPlan).where(BudgetPlan.id == plan_id))
    if not plan:
        raise NotFoundError("Budget plan")
    if plan.user_id != user_id:
        raise ForbiddenError()
    entry = BudgetEntry(plan_id=plan_id, category=req.category, label=req.label,
                        budgeted=req.budgeted, actual=req.actual)
    db.add(entry)
    await db.flush()
    return BudgetEntryResponse.model_validate(entry)


async def update_entry(
    db: AsyncSession, user_id: uuid.UUID, entry_id: uuid.UUID, req: UpdateBudgetEntryRequest
) -> BudgetEntryResponse:
    entry = await db.scalar(select(BudgetEntry).where(BudgetEntry.id == entry_id))
    if not entry:
        raise NotFoundError("Budget entry")
    plan = await db.scalar(select(BudgetPlan).where(BudgetPlan.id == entry.plan_id))
    if not plan or plan.user_id != user_id:
        raise ForbiddenError()
    if req.label is not None:
        entry.label = req.label
    if req.budgeted is not None:
        entry.budgeted = req.budgeted
    if req.actual is not None:
        entry.actual = req.actual
    await db.flush()
    return BudgetEntryResponse.model_validate(entry)


async def delete_entry(db: AsyncSession, user_id: uuid.UUID, entry_id: uuid.UUID) -> None:
    entry = await db.scalar(select(BudgetEntry).where(BudgetEntry.id == entry_id))
    if not entry:
        raise NotFoundError("Budget entry")
    plan = await db.scalar(select(BudgetPlan).where(BudgetPlan.id == entry.plan_id))
    if not plan or plan.user_id != user_id:
        raise ForbiddenError()
    await db.delete(entry)
    await db.flush()
