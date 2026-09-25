"""Financial goals routes."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.anonymous import get_anonymous_id
from app.core.database import get_db
from app.schemas.financial_goal import (
    FinancialGoalAnalysis,
    FinancialGoalCreate,
    FinancialGoalResponse,
    FinancialGoalUpdate,
    FinancialGoalsSummary,
)
from app.services import financial_goal_service

router = APIRouter()


@router.get(
    "",
    response_model=list[FinancialGoalResponse],
    summary="List financial goals",
)
async def list_financial_goals(
    session_id: Annotated[
        uuid.UUID,
        Depends(get_anonymous_id),
    ],
    db: Annotated[
        AsyncSession,
        Depends(get_db),
    ],
) -> list[FinancialGoalResponse]:
    return await financial_goal_service.list_goals(
        db,
        session_id,
    )


@router.get(
    "/summary",
    response_model=FinancialGoalsSummary,
    summary="Get financial goals summary",
)
async def get_financial_goals_summary(
    session_id: Annotated[
        uuid.UUID,
        Depends(get_anonymous_id),
    ],
    db: Annotated[
        AsyncSession,
        Depends(get_db),
    ],
) -> FinancialGoalsSummary:
    goals = await financial_goal_service.list_goals(
        db,
        session_id,
    )

    return financial_goal_service.build_summary(
        goals
    )


@router.get(
    "/{goal_id}/analysis",
    response_model=FinancialGoalAnalysis,
    summary="Analyze a financial goal",
)
async def analyze_financial_goal(
    goal_id: uuid.UUID,
    session_id: Annotated[
        uuid.UUID,
        Depends(get_anonymous_id),
    ],
    db: Annotated[
        AsyncSession,
        Depends(get_db),
    ],
) -> FinancialGoalAnalysis:
    goal = await financial_goal_service.get_goal(
        db,
        session_id,
        goal_id,
    )

    if goal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Financial goal not found",
        )

    return financial_goal_service.analyze_goal(
        goal
    )


@router.get(
    "/{goal_id}",
    response_model=FinancialGoalResponse,
    summary="Get a financial goal",
)
async def get_financial_goal(
    goal_id: uuid.UUID,
    session_id: Annotated[
        uuid.UUID,
        Depends(get_anonymous_id),
    ],
    db: Annotated[
        AsyncSession,
        Depends(get_db),
    ],
) -> FinancialGoalResponse:
    goal = await financial_goal_service.get_goal(
        db,
        session_id,
        goal_id,
    )

    if goal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Financial goal not found",
        )

    return goal


@router.post(
    "",
    response_model=FinancialGoalResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a financial goal",
)
async def create_financial_goal(
    body: FinancialGoalCreate,
    session_id: Annotated[
        uuid.UUID,
        Depends(get_anonymous_id),
    ],
    db: Annotated[
        AsyncSession,
        Depends(get_db),
    ],
) -> FinancialGoalResponse:
    try:
        return await financial_goal_service.create_goal(
            db,
            session_id,
            body,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.patch(
    "/{goal_id}",
    response_model=FinancialGoalResponse,
    summary="Update a financial goal",
)
async def update_financial_goal(
    goal_id: uuid.UUID,
    body: FinancialGoalUpdate,
    session_id: Annotated[
        uuid.UUID,
        Depends(get_anonymous_id),
    ],
    db: Annotated[
        AsyncSession,
        Depends(get_db),
    ],
) -> FinancialGoalResponse:
    try:
        goal = await financial_goal_service.update_goal(
            db,
            session_id,
            goal_id,
            body,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    if goal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Financial goal not found",
        )

    return goal


@router.delete(
    "/{goal_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a financial goal",
)
async def delete_financial_goal(
    goal_id: uuid.UUID,
    session_id: Annotated[
        uuid.UUID,
        Depends(get_anonymous_id),
    ],
    db: Annotated[
        AsyncSession,
        Depends(get_db),
    ],
):
    deleted = await financial_goal_service.delete_goal(
        db,
        session_id,
        goal_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Financial goal not found",
        )

    return None