"""Progress and gamification routes — anonymous, session-based."""
from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.anonymous import get_anonymous_id
from app.models.progress import Badge, UserBadge
from app.schemas.progress import BadgeResponse, BadgesResponse, DashboardResponse
from app.services.progress_service import get_dashboard

router = APIRouter()


@router.get(
    "/dashboard",
    response_model=DashboardResponse,
    summary="Get the learning dashboard for this session",
)
async def dashboard(
    session_id: Annotated[uuid.UUID, Depends(get_anonymous_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DashboardResponse:
    return await get_dashboard(db, session_id)


@router.get(
    "/badges",
    response_model=BadgesResponse,
    summary="List all badges (earned and available)",
)
async def get_badges(
    session_id: Annotated[uuid.UUID, Depends(get_anonymous_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> BadgesResponse:
    all_badges_result = await db.execute(select(Badge))
    all_badges = all_badges_result.scalars().all()

    earned_result = await db.execute(
        select(UserBadge).where(UserBadge.user_id == session_id)
    )
    earned_map = {ub.badge_id: ub.earned_at for ub in earned_result.scalars()}

    earned: list[BadgeResponse] = []
    available: list[BadgeResponse] = []

    for b in all_badges:
        br = BadgeResponse(
            id=b.id,
            name=b.name,
            description=b.description,
            icon_url=b.icon_url,
            criteria_type=b.criteria_type,
            criteria_value=b.criteria_value,
            earned=b.id in earned_map,
            earned_at=earned_map.get(b.id),
        )
        (earned if br.earned else available).append(br)

    return BadgesResponse(earned=earned, available=available)
