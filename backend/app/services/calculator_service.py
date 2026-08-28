"""
SIP and lumpsum projection calculator.

All results are clearly labelled as PROJECTIONS based on a constant assumed
rate of return.  Actual returns will vary.  These figures are not guarantees.
"""
from __future__ import annotations

import logging
import uuid
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.calculator import CalculatorHistory
from app.schemas.calculator import (
    SIPCalculatorRequest,
    SIPCalculatorResponse,
    LumpsumRequest,
    LumpsumResponse,
    YearlyProjection,
)

logger = logging.getLogger(__name__)

_TWO_DP = Decimal("0.01")


def _d(value: float | int | str) -> Decimal:
    """Convert to Decimal safely."""
    return Decimal(str(value))


def _sip_fv(p: Decimal, r_monthly: Decimal, n_months: int) -> Decimal:
    """
    Standard SIP future-value formula:
      FV = P × [((1 + r)^n − 1) / r] × (1 + r)
    """
    growth = (1 + r_monthly) ** n_months
    return p * ((growth - 1) / r_monthly) * (1 + r_monthly)


def calculate_sip(req: SIPCalculatorRequest) -> SIPCalculatorResponse:
    """
    Project SIP corpus over time.
    Returns projected values — not guaranteed investment outcomes.
    """
    p = _d(req.monthly_investment)
    r = _d(req.annual_rate) / _d(1200)   # monthly rate
    ri = _d(req.inflation_rate) / _d(1200)
    n_total = req.years * 12

    maturity = _sip_fv(p, r, n_total)
    invested = p * n_total

    # Real rate using Fisher equation: (1+nominal)/(1+inflation) − 1
    if req.inflation_rate > 0 and r > ri:
        real_r = ((1 + r) / (1 + ri)) - 1
        adj_maturity = _sip_fv(p, real_r, n_total)
    else:
        adj_maturity = maturity

    projections: list[YearlyProjection] = []
    for yr in range(1, req.years + 1):
        mo = yr * 12
        yr_val = _sip_fv(p, r, mo)
        yr_inv = p * mo
        projections.append(YearlyProjection(
            year=yr,
            invested=float(yr_inv.quantize(_TWO_DP, ROUND_HALF_UP)),
            value=float(yr_val.quantize(_TWO_DP, ROUND_HALF_UP)),
            returns=float((yr_val - yr_inv).quantize(_TWO_DP, ROUND_HALF_UP)),
        ))

    return SIPCalculatorResponse(
        projected_maturity_value=float(maturity.quantize(_TWO_DP, ROUND_HALF_UP)),
        total_invested=float(invested.quantize(_TWO_DP, ROUND_HALF_UP)),
        projected_wealth_gained=float((maturity - invested).quantize(_TWO_DP, ROUND_HALF_UP)),
        inflation_adjusted_projected_value=float(adj_maturity.quantize(_TWO_DP, ROUND_HALF_UP)),
        yearly_projections=projections,
    )


def calculate_lumpsum(req: LumpsumRequest) -> LumpsumResponse:
    """
    Project lumpsum corpus over time using compound interest.
    Returns projected values — not guaranteed investment outcomes.
    """
    p = _d(req.principal)
    r = _d(req.annual_rate) / _d(100)
    ri = _d(req.inflation_rate) / _d(100)

    projections: list[YearlyProjection] = []
    for yr in range(1, req.years + 1):
        yr_val = p * (1 + r) ** yr
        projections.append(YearlyProjection(
            year=yr,
            invested=float(p.quantize(_TWO_DP, ROUND_HALF_UP)),
            value=float(yr_val.quantize(_TWO_DP, ROUND_HALF_UP)),
            returns=float((yr_val - p).quantize(_TWO_DP, ROUND_HALF_UP)),
        ))

    maturity = p * (1 + r) ** req.years
    if req.inflation_rate > 0 and r > ri:
        real_r = ((1 + r) / (1 + ri)) - 1
        adj_maturity = p * (1 + real_r) ** req.years
    else:
        adj_maturity = maturity

    return LumpsumResponse(
        projected_maturity_value=float(maturity.quantize(_TWO_DP, ROUND_HALF_UP)),
        total_invested=float(p.quantize(_TWO_DP, ROUND_HALF_UP)),
        projected_wealth_gained=float((maturity - p).quantize(_TWO_DP, ROUND_HALF_UP)),
        inflation_adjusted_projected_value=float(adj_maturity.quantize(_TWO_DP, ROUND_HALF_UP)),
        yearly_projections=projections,
    )


async def save_history(
    db: AsyncSession,
    user_id: uuid.UUID,
    calc_type: str,
    params: dict,
    projected_maturity: float,
    total_invested: float,
) -> uuid.UUID:
    """Persist a calculation snapshot; keep at most 10 records per user."""
    count = await db.scalar(
        select(func.count(CalculatorHistory.id))
        .where(CalculatorHistory.user_id == user_id)
    ) or 0

    if count >= 10:
        oldest = await db.scalar(
            select(CalculatorHistory)
            .where(CalculatorHistory.user_id == user_id)
            .order_by(CalculatorHistory.created_at)
            .limit(1)
        )
        if oldest:
            await db.delete(oldest)

    row = CalculatorHistory(
        user_id=user_id,
        calculator_type=calc_type,
        params=params,
        result_maturity=projected_maturity,
        result_total_invested=total_invested,
    )
    db.add(row)
    await db.flush()
    return row.id
