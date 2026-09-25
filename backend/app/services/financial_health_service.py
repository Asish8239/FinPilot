"""Financial health business logic."""

from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.financial_health import FinancialHealthProfile
from app.schemas.financial_health import FinancialHealthUpdate


ZERO = Decimal("0")
HUNDRED = Decimal("100")


def _money(value: Decimal) -> Decimal:
    """Normalize monetary values to two decimal places."""
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _ratio(value: Decimal) -> Decimal:
    """Normalize calculated ratios to two decimal places."""
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


async def get_profile(
    db: AsyncSession,
    user_id,
) -> FinancialHealthProfile | None:
    """Return the user's financial health profile, if it exists."""

    result = await db.scalar(
        select(FinancialHealthProfile).where(
            FinancialHealthProfile.user_id == user_id
        )
    )

    return result


async def create_or_update_profile(
    db: AsyncSession,
    user_id,
    data: FinancialHealthUpdate,
) -> FinancialHealthProfile:
    """Create a financial health profile or update the existing one."""

    profile = await get_profile(db, user_id)

    if profile is None:
        profile = FinancialHealthProfile(
            user_id=user_id,
        )
        db.add(profile)

    profile.currency = data.currency.upper().strip()

    profile.monthly_income = _money(data.monthly_income)
    profile.monthly_expenses = _money(data.monthly_expenses)
    profile.monthly_debt_payment = _money(data.monthly_debt_payment)

    profile.cash_balance = _money(data.cash_balance)
    profile.emergency_fund = _money(data.emergency_fund)
    profile.investments_value = _money(data.investments_value)
    profile.total_debt = _money(data.total_debt)

    profile.monthly_investment = _money(data.monthly_investment)
    profile.target_monthly_expenses = _money(
        data.target_monthly_expenses
    )

    await db.commit()
    await db.refresh(profile)

    return profile


def build_summary(
    profile: FinancialHealthProfile,
):
    """Calculate derived financial-health metrics."""

    monthly_income = Decimal(str(profile.monthly_income))
    monthly_expenses = Decimal(str(profile.monthly_expenses))
    monthly_debt_payment = Decimal(
        str(profile.monthly_debt_payment)
    )

    cash_balance = Decimal(str(profile.cash_balance))
    emergency_fund = Decimal(str(profile.emergency_fund))
    investments_value = Decimal(
        str(profile.investments_value)
    )
    total_debt = Decimal(str(profile.total_debt))

    monthly_savings = (
        monthly_income
        - monthly_expenses
        - monthly_debt_payment
    )

    if monthly_income > ZERO:
        savings_rate = (
            monthly_savings / monthly_income
        ) * HUNDRED

        debt_to_income_ratio = (
            monthly_debt_payment / monthly_income
        ) * HUNDRED
    else:
        savings_rate = ZERO
        debt_to_income_ratio = ZERO

    if monthly_expenses > ZERO:
        emergency_fund_months = (
            emergency_fund / monthly_expenses
        )
    else:
        emergency_fund_months = ZERO

    net_worth = (
        cash_balance
        + investments_value
        - total_debt
    )

    return {
        "currency": profile.currency,
        "monthly_income": _money(monthly_income),
        "monthly_expenses": _money(monthly_expenses),
        "monthly_savings": _money(monthly_savings),
        "monthly_debt_payment": _money(
            monthly_debt_payment
        ),
        "savings_rate": _ratio(savings_rate),
        "cash_balance": _money(cash_balance),
        "emergency_fund": _money(emergency_fund),
        "investments_value": _money(
            investments_value
        ),
        "total_debt": _money(total_debt),
        "net_worth": _money(net_worth),
        "emergency_fund_months": _ratio(
            emergency_fund_months
        ),
        "debt_to_income_ratio": _ratio(
            debt_to_income_ratio
        ),
    }