from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class KnowledgeLearningProgress(Base):
    __tablename__ = "knowledge_learning_progress"

    __table_args__ = (
        UniqueConstraint(
            "session_id",
            "topic_slug",
            name="uq_knowledge_progress_session_topic",
        ),
        Index("ix_knowledge_progress_session_id", "session_id"),
        Index("ix_knowledge_progress_topic_slug", "topic_slug"),
        Index("ix_knowledge_progress_mastery", "mastery"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)

    session_id: Mapped[str] = mapped_column(String(128), nullable=False)
    topic_slug: Mapped[str] = mapped_column(String(160), nullable=False)
    topic_name: Mapped[str] = mapped_column(String(255), nullable=False)

    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    completed_attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    best_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    best_percentage: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    average_percentage: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    mastery: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    current_difficulty: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="beginner",
    )

    last_percentage: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    last_result: Mapped[str | None] = mapped_column(String(32), nullable=True)
    last_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)

    last_attempt_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
