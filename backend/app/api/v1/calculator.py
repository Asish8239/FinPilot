from __future__ import annotations

from typing import Annotated
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.anonymous import get_anonymous_id
from app.services import calculator_service
from app.schemas.calculator import (
    SIPCalculatorRequest,
    SIPCalculatorResponse,
    LumpsumRequest,
    LumpsumResponse,
)

router = APIRouter()


@router.post(
    "/sip",
    response_model=SIPCalculatorResponse,
    summary="SIP projection calculator",
    description=(
        "Returns a projected SIP corpus based on the inputs provided. "
        "All figures are estimates assuming a constant rate of return. "
        "This is not financial advice."
    ),
)
async def sip_calculate(
    body: SIPCalculatorRequest,
    session_id: Annotated[uuid.UUID, Depends(get_anonymous_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> SIPCalculatorResponse:
    result = calculator_service.calculate_sip(body)
    if body.save_to_history:
        hist_id = await calculator_service.save_history(
            db,
            session_id,
            "sip",
            body.model_dump(exclude={"save_to_history"}),
            result.projected_maturity_value,
            result.total_invested,
        )
        result.history_id = hist_id
    return result


@router.post(
    "/lumpsum",
    response_model=LumpsumResponse,
    summary="Lumpsum projection calculator",
    description=(
        "Returns a projected lumpsum corpus using compound interest. "
        "All figures are estimates assuming a constant rate of return. "
        "This is not financial advice."
    ),
)
async def lumpsum_calculate(
    body: LumpsumRequest,
    session_id: Annotated[uuid.UUID, Depends(get_anonymous_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LumpsumResponse:
    result = calculator_service.calculate_lumpsum(body)
    if body.save_to_history:
        hist_id = await calculator_service.save_history(
            db,
            session_id,
            "lumpsum",
            body.model_dump(exclude={"save_to_history"}),
            result.projected_maturity_value,
            result.total_invested,
        )
        result.history_id = hist_id
    return result
