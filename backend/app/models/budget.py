"""Budget planner models."""
from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import (
    CheckConstraint, Date, DateTime, ForeignKey,
    Numeric, String, UniqueConstraint, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base

VALID_CATEGORIES = ("needs", "wants", "savings", "investments")


class BudgetPlan(Base):
    __tablename__ = "budget_plans"
    __table_args__ = (
        UniqueConstraint("user_id", "month", name="uq_user_budget_month"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    month: Mapped[date] = mapped_column(Date, nullable=False)
    monthly_income: Mapped[float] = mapped_column(
        Numeric(12, 2), nullable=False
    )
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="budget_plans")
    entries: Mapped[list["BudgetEntry"]] = relationship(
        back_populates="plan", cascade="all, delete-orphan"
    )


class BudgetEntry(Base):
    __tablename__ = "budget_entries"
    __table_args__ = (
        CheckConstraint(
            "category IN ('needs','wants','savings','investments')",
            name="ck_budget_entry_category",
        ),
        CheckConstraint("actual >= 0", name="ck_budget_entry_actual_nonneg"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("budget_plans.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category: Mapped[str] = mapped_column(String(20), nullable=False)
    label: Mapped[str] = mapped_column(String(200), nullable=False)
    budgeted: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    actual: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    plan: Mapped["BudgetPlan"] = relationship(back_populates="entries")
