"""Add CHECK constraints and missing indexes from Phase 2 model updates.

Migration 0001 created all tables but did not add the CHECK constraints
that were added to the ORM models in Phase 2. This migration adds them
idempotently alongside a few performance indexes that were missing.

Revision ID: 0002
Revises: 0001
Create Date: 2026-08-23
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── users.role CHECK ───────────────────────────────────────────────────────
    op.execute(
        "ALTER TABLE users ADD CONSTRAINT ck_user_role "
        "CHECK (role IN ('student', 'admin'))"
    )

    # ── budget_entries.category CHECK ─────────────────────────────────────────
    op.execute(
        "ALTER TABLE budget_entries ADD CONSTRAINT ck_budget_entry_category "
        "CHECK (category IN ('needs', 'wants', 'savings', 'investments'))"
    )

    # ── budget_entries.actual non-negative CHECK ───────────────────────────────
    op.execute(
        "ALTER TABLE budget_entries ADD CONSTRAINT ck_budget_entry_actual_nonneg "
        "CHECK (actual >= 0)"
    )

    # ── calculator_history.calculator_type CHECK ───────────────────────────────
    op.execute(
        "ALTER TABLE calculator_history ADD CONSTRAINT ck_calc_type "
        "CHECK (calculator_type IN ('sip', 'lumpsum'))"
    )

    # ── Performance indexes ────────────────────────────────────────────────────
    # Composite index on user_progress(user_id, lesson_id) for idempotency checks
    op.create_index(
        "ix_user_progress_user_lesson",
        "user_progress",
        ["user_id", "lesson_id"],
        unique=False,
    )

    # Index on ai_messages(conversation_id, created_at) for context window slicing
    op.create_index(
        "ix_ai_messages_conv_created",
        "ai_messages",
        ["conversation_id", "created_at"],
    )

    # Index on calculator_history(user_id, created_at DESC) for history trimming
    op.create_index(
        "ix_calculator_history_user_created",
        "calculator_history",
        ["user_id", sa.text("created_at DESC")],
    )

    # Index on watchlist_items(user_id, symbol) for duplicate detection
    op.create_index(
        "ix_watchlist_items_user_symbol",
        "watchlist_items",
        ["user_id", "symbol"],
    )

    # Index on ai_conversations(user_id, updated_at) for listing newest-first
    op.create_index(
        "ix_ai_conversations_user_updated",
        "ai_conversations",
        ["user_id", sa.text("updated_at DESC")],
    )


def downgrade() -> None:
    # Drop indexes
    op.drop_index("ix_ai_conversations_user_updated", table_name="ai_conversations")
    op.drop_index("ix_watchlist_items_user_symbol", table_name="watchlist_items")
    op.drop_index("ix_calculator_history_user_created", table_name="calculator_history")
    op.drop_index("ix_ai_messages_conv_created", table_name="ai_messages")
    op.drop_index("ix_user_progress_user_lesson", table_name="user_progress")

    # Drop CHECK constraints
    op.execute("ALTER TABLE calculator_history DROP CONSTRAINT IF EXISTS ck_calc_type")
    op.execute("ALTER TABLE budget_entries DROP CONSTRAINT IF EXISTS ck_budget_entry_actual_nonneg")
    op.execute("ALTER TABLE budget_entries DROP CONSTRAINT IF EXISTS ck_budget_entry_category")
    op.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS ck_user_role")
