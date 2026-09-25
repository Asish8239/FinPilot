"""knowledge quiz persistence

Revision ID: 025cad182993
Revises: 0006
Create Date: 2026-09-14
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "025cad182993"
down_revision: Union[str, None] = "0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create persistent dynamic Knowledge Quiz tables."""

    op.create_table(
        "knowledge_quiz_sessions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("session_id", sa.String(length=255), nullable=False),
        sa.Column("topic_slug", sa.String(length=150), nullable=False),
        sa.Column("topic_name", sa.String(length=255), nullable=False),
        sa.Column("difficulty", sa.String(length=30), nullable=False),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("generated_by", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("score", sa.Float(), nullable=True),
        sa.Column("max_score", sa.Float(), nullable=True),
        sa.Column("percentage", sa.Float(), nullable=True),
        sa.Column("passed", sa.Boolean(), nullable=True),
        sa.Column("feedback", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_knowledge_quiz_sessions_session_id",
        "knowledge_quiz_sessions",
        ["session_id"],
        unique=False,
    )

    op.create_index(
        "ix_knowledge_quiz_sessions_status",
        "knowledge_quiz_sessions",
        ["status"],
        unique=False,
    )

    op.create_index(
        "ix_knowledge_quiz_sessions_topic_slug",
        "knowledge_quiz_sessions",
        ["topic_slug"],
        unique=False,
    )

    op.create_table(
        "knowledge_quiz_questions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("quiz_id", sa.Uuid(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("option_a", sa.Text(), nullable=False),
        sa.Column("option_b", sa.Text(), nullable=False),
        sa.Column("option_c", sa.Text(), nullable=False),
        sa.Column("option_d", sa.Text(), nullable=False),
        sa.Column("correct_answer", sa.String(length=1), nullable=False),
        sa.Column("explanation", sa.Text(), nullable=False),
        sa.Column("selected_answer", sa.String(length=1), nullable=True),
        sa.Column("is_correct", sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(
            ["quiz_id"],
            ["knowledge_quiz_sessions.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_knowledge_quiz_questions_quiz_id",
        "knowledge_quiz_questions",
        ["quiz_id"],
        unique=False,
    )


def downgrade() -> None:
    """Remove persistent dynamic Knowledge Quiz tables."""

    op.drop_index(
        "ix_knowledge_quiz_questions_quiz_id",
        table_name="knowledge_quiz_questions",
    )

    op.drop_table("knowledge_quiz_questions")

    op.drop_index(
        "ix_knowledge_quiz_sessions_topic_slug",
        table_name="knowledge_quiz_sessions",
    )

    op.drop_index(
        "ix_knowledge_quiz_sessions_status",
        table_name="knowledge_quiz_sessions",
    )

    op.drop_index(
        "ix_knowledge_quiz_sessions_session_id",
        table_name="knowledge_quiz_sessions",
    )

    op.drop_table("knowledge_quiz_sessions")
