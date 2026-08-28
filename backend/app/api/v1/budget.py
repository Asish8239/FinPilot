"""Budget planner routes — anonymous monthly plan and expense entry CRUD."""
from __future__ import annotations

import uuid
from typing import Annotated
from fastapi.responses import Response

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.anonymous import get_anonymous_id
from app.schemas.budget import (
    BudgetEntryRequest,
    BudgetEntryResponse,
    BudgetPlanResponse,
    CreateBudgetPlanRequest,
    UpdateBudgetEntryRequest,
    UpdateBudgetPlanRequest,
)
from app.services import budget_service

router = APIRouter()


@router.post(
    "",
    response_model=BudgetPlanResponse,
    status_code=201,
    summary="Create a monthly budget plan",
)
async def create_plan(
    body: CreateBudgetPlanRequest,
    session_id: Annotated[uuid.UUID, Depends(get_anonymous_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> BudgetPlanResponse:
    return await budget_service.create_plan(db, session_id, body)


@router.get(
    "/{month}",
    response_model=BudgetPlanResponse,
    summary="Get budget plan for a given month (YYYY-MM)",
)
async def get_plan(
    month: str,
    session_id: Annotated[uuid.UUID, Depends(get_anonymous_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> BudgetPlanResponse:
    return await budget_service.get_plan(db, session_id, month)


@router.patch(
    "/{plan_id}",
    response_model=BudgetPlanResponse,
    summary="Update monthly income for a budget plan",
)
async def update_plan(
    plan_id: uuid.UUID,
    body: UpdateBudgetPlanRequest,
    session_id: Annotated[uuid.UUID, Depends(get_anonymous_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> BudgetPlanResponse:
    return await budget_service.update_plan(db, session_id, plan_id, body)


@router.post(
    "/{plan_id}/entries",
    response_model=BudgetEntryResponse,
    status_code=201,
    summary="Add a budget line item",
)
async def add_entry(
    plan_id: uuid.UUID,
    body: BudgetEntryRequest,
    session_id: Annotated[uuid.UUID, Depends(get_anonymous_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> BudgetEntryResponse:
    return await budget_service.add_entry(db, session_id, plan_id, body)


@router.patch(
    "/entries/{entry_id}",
    response_model=BudgetEntryResponse,
    summary="Update a budget entry (label, budgeted amount, or actual spend)",
)
async def update_entry(
    entry_id: uuid.UUID,
    body: UpdateBudgetEntryRequest,
    session_id: Annotated[uuid.UUID, Depends(get_anonymous_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> BudgetEntryResponse:
    return await budget_service.update_entry(db, session_id, entry_id, body)


@router.delete(
    "/entries/{entry_id}",
    status_code=204,
    summary="Delete a budget entry",
)
async def delete_entry(
    entry_id: uuid.UUID,
    session_id: Annotated[uuid.UUID, Depends(get_anonymous_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    await budget_service.delete_entry(db, session_id, entry_id)
    return Response(status_code=204)
