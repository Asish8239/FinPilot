"""User model — single source of truth for auth identity."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Uuid

from app.core.database import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint(
            "role IN ('student','admin')",
            name="ck_user_role",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    supabase_uid: Mapped[str | None] = mapped_column(
        String,
        unique=False,
        nullable=True,
        index=True,
    )

    email: Mapped[str | None] = mapped_column(
        String,
        unique=False,
        nullable=True,
        index=True,
    )

    full_name: Mapped[str | None] = mapped_column(
        String(200)
    )

    avatar_url: Mapped[str | None] = mapped_column(
        Text
    )

    role: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="student",
    )

    onboarding_done: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    # ── Relationships ──────────────────────────────────────────────────────────

    progress: Mapped[list["UserProgress"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )

    quiz_attempts: Mapped[list["UserQuizAttempt"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )

    xp: Mapped["UserXP | None"] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False,
    )

    streak: Mapped["Streak | None"] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False,
    )

    badges: Mapped[list["UserBadge"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )

    conversations: Mapped[list["AIConversation"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )

    budget_plans: Mapped[list["BudgetPlan"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )

    calc_history: Mapped[list["CalculatorHistory"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )

    watchlist: Mapped[list["WatchlistItem"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )

    financial_health_profile: Mapped[
        "FinancialHealthProfile | None"
    ] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False,
    )