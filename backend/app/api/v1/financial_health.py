"""Financial health routes — persistent financial snapshot and summary."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.anonymous import get_anonymous_id
from app.core.database import get_db
from app.schemas.financial_health import (
    FinancialHealthResponse,
    FinancialHealthSummary,
    FinancialHealthUpdate,
)
from app.services import financial_health_service

router = APIRouter()


@router.get(
    "",
    response_model=FinancialHealthResponse,
    summary="Get the financial health profile",
)
async def get_financial_health(
    session_id: Annotated[
        uuid.UUID,
        Depends(get_anonymous_id),
    ],
    db: Annotated[
        AsyncSession,
        Depends(get_db),
    ],
) -> FinancialHealthResponse:
    profile = await financial_health_service.get_profile(
        db,
        session_id,
    )

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Financial health profile not found",
        )

    return profile


@router.put(
    "",
    response_model=FinancialHealthResponse,
    summary="Create or update the financial health profile",
)
async def save_financial_health(
    body: FinancialHealthUpdate,
    session_id: Annotated[
        uuid.UUID,
        Depends(get_anonymous_id),
    ],
    db: Annotated[
        AsyncSession,
        Depends(get_db),
    ],
) -> FinancialHealthResponse:
    return await financial_health_service.create_or_update_profile(
        db,
        session_id,
        body,
    )


@router.get(
    "/summary",
    response_model=FinancialHealthSummary,
    summary="Get calculated financial health metrics",
)
async def get_financial_health_summary(
    session_id: Annotated[
        uuid.UUID,
        Depends(get_anonymous_id),
    ],
    db: Annotated[
        AsyncSession,
        Depends(get_db),
    ],
) -> FinancialHealthSummary:
    profile = await financial_health_service.get_profile(
        db,
        session_id,
    )

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Financial health profile not found",
        )

    return financial_health_service.build_summary(profile)