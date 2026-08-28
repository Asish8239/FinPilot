"""Initial schema — all tables

Revision ID: 0001
Revises:
Create Date: 2026-08-23
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    # ── users ──────────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("supabase_uid", sa.String, unique=True, nullable=False),
        sa.Column("email", sa.String, unique=True, nullable=False),
        sa.Column("full_name", sa.String(200)),
        sa.Column("avatar_url", sa.Text),
        sa.Column("role", sa.String(20), nullable=False, server_default="student"),
        sa.Column("onboarding_done", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_users_supabase_uid", "users", ["supabase_uid"])
    op.create_index("ix_users_email", "users", ["email"])

    # ── modules ────────────────────────────────────────────────────────────────
    op.create_table(
        "modules",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("slug", sa.String(100), unique=True, nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("level", sa.String(20), nullable=False),
        sa.Column("track", sa.String(10)),
        sa.Column("order_index", sa.Integer, server_default="0"),
        sa.Column("icon_url", sa.Text),
        sa.Column("is_published", sa.Boolean, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_modules_order_index", "modules", ["order_index"])

    # ── lessons ────────────────────────────────────────────────────────────────
    op.create_table(
        "lessons",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("module_id", UUID(as_uuid=True), sa.ForeignKey("modules.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column("content_type", sa.String(20), server_default="markdown"),
        sa.Column("content_markdown", sa.Text),
        sa.Column("video_url", sa.Text),
        sa.Column("order_index", sa.Integer, server_default="0"),
        sa.Column("estimated_minutes", sa.Integer, server_default="5"),
        sa.Column("xp_reward", sa.Integer, server_default="10"),
        sa.Column("is_published", sa.Boolean, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("module_id", "slug", name="uq_lesson_module_slug"),
    )
    op.create_index("ix_lessons_module_id", "lessons", ["module_id"])

    # ── quizzes ────────────────────────────────────────────────────────────────
    op.create_table(
        "quizzes",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("lesson_id", UUID(as_uuid=True), sa.ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("passing_score", sa.Integer, server_default="70"),
        sa.Column("max_attempts", sa.Integer, server_default="3"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_quizzes_lesson_id", "quizzes", ["lesson_id"])

    op.create_table(
        "questions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("quiz_id", UUID(as_uuid=True), sa.ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("question_text", sa.Text, nullable=False),
        sa.Column("question_type", sa.String(20), nullable=False),
        sa.Column("options", JSONB),
        sa.Column("correct_answer", sa.Text, nullable=False),
        sa.Column("explanation", sa.Text),
        sa.Column("difficulty", sa.String(10), server_default="medium"),
        sa.Column("points", sa.Integer, server_default="10"),
        sa.Column("order_index", sa.Integer, server_default="0"),
    )
    op.create_index("ix_questions_quiz_id", "questions", ["quiz_id"])

    op.create_table(
        "user_quiz_attempts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("quiz_id", UUID(as_uuid=True), sa.ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("score", sa.Integer, nullable=False),
        sa.Column("max_score", sa.Integer, nullable=False),
        sa.Column("percentage", sa.Numeric(5, 2), nullable=False),
        sa.Column("passed", sa.Boolean, nullable=False),
        sa.Column("answers", JSONB, nullable=False),
        sa.Column("feedback", JSONB),
        sa.Column("time_taken_sec", sa.Integer),
        sa.Column("attempt_number", sa.Integer, server_default="1"),
        sa.Column("attempted_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_user_quiz_attempts_user_id", "user_quiz_attempts", ["user_id"])
    op.create_index("ix_user_quiz_attempts_quiz_id", "user_quiz_attempts", ["quiz_id"])
    op.create_index("ix_user_quiz_attempts_user_quiz", "user_quiz_attempts", ["user_id", "quiz_id"])

    # ── progress ───────────────────────────────────────────────────────────────
    op.create_table(
        "user_progress",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("lesson_id", UUID(as_uuid=True), sa.ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False),
        sa.Column("completed", sa.Boolean, server_default="false"),
        sa.Column("completed_at", sa.DateTime(timezone=True)),
        sa.Column("time_spent_sec", sa.Integer, server_default="0"),
        sa.Column("xp_earned", sa.Integer, server_default="0"),
        sa.UniqueConstraint("user_id", "lesson_id", name="uq_user_lesson_progress"),
    )
    op.create_index("ix_user_progress_user_id", "user_progress", ["user_id"])
    op.create_index("ix_user_progress_user_completed", "user_progress", ["user_id", "completed"])

    op.create_table(
        "user_xp",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False),
        sa.Column("total_xp", sa.Integer, server_default="0"),
        sa.Column("level", sa.Integer, server_default="1"),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "streaks",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False),
        sa.Column("current_streak", sa.Integer, server_default="0"),
        sa.Column("longest_streak", sa.Integer, server_default="0"),
        sa.Column("last_activity_date", sa.Date),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "badges",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("name", sa.String(100), unique=True, nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("icon_url", sa.Text, nullable=False),
        sa.Column("criteria_type", sa.String(40), nullable=False),
        sa.Column("criteria_value", sa.Integer, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "user_badges",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("badge_id", UUID(as_uuid=True), sa.ForeignKey("badges.id", ondelete="CASCADE"), nullable=False),
        sa.Column("earned_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "badge_id", name="uq_user_badge"),
    )
    op.create_index("ix_user_badges_user_id", "user_badges", ["user_id"])

    # ── ai_tutor ───────────────────────────────────────────────────────────────
    op.create_table(
        "ai_conversations",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("lesson_id", UUID(as_uuid=True), sa.ForeignKey("lessons.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", sa.String(200), server_default="New Conversation"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_ai_conversations_user_id", "ai_conversations", ["user_id"])

    op.create_table(
        "ai_messages",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("conversation_id", UUID(as_uuid=True), sa.ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("token_count", sa.Integer),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_ai_messages_conversation_id", "ai_messages", ["conversation_id"])

    # ── budget ─────────────────────────────────────────────────────────────────
    op.create_table(
        "budget_plans",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("month", sa.Date, nullable=False),
        sa.Column("monthly_income", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(10), server_default="INR"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "month", name="uq_user_budget_month"),
    )
    op.create_index("ix_budget_plans_user_id", "budget_plans", ["user_id"])

    op.create_table(
        "budget_entries",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("plan_id", UUID(as_uuid=True), sa.ForeignKey("budget_plans.id", ondelete="CASCADE"), nullable=False),
        sa.Column("category", sa.String(20), nullable=False),
        sa.Column("label", sa.String(200), nullable=False),
        sa.Column("budgeted", sa.Numeric(12, 2), nullable=False),
        sa.Column("actual", sa.Numeric(12, 2), server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_budget_entries_plan_id", "budget_entries", ["plan_id"])

    # ── calculator_history ─────────────────────────────────────────────────────
    op.create_table(
        "calculator_history",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("calculator_type", sa.String(20), nullable=False),
        sa.Column("params", JSONB, nullable=False),
        sa.Column("result_maturity", sa.Numeric(15, 2), nullable=False),
        sa.Column("result_total_invested", sa.Numeric(15, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_calculator_history_user_id", "calculator_history", ["user_id"])

    # ── watchlist ──────────────────────────────────────────────────────────────
    op.create_table(
        "watchlist_items",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("symbol", sa.String(20), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("exchange", sa.String(10), server_default="NSE"),
        sa.Column("notes", sa.String(500)),
        sa.Column("added_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "symbol", name="uq_user_symbol"),
    )
    op.create_index("ix_watchlist_items_user_id", "watchlist_items", ["user_id"])


def downgrade() -> None:
    op.drop_table("watchlist_items")
    op.drop_table("calculator_history")
    op.drop_table("budget_entries")
    op.drop_table("budget_plans")
    op.drop_table("ai_messages")
    op.drop_table("ai_conversations")
    op.drop_table("user_badges")
    op.drop_table("badges")
    op.drop_table("streaks")
    op.drop_table("user_xp")
    op.drop_table("user_progress")
    op.drop_table("user_quiz_attempts")
    op.drop_table("questions")
    op.drop_table("quizzes")
    op.drop_table("lessons")
    op.drop_table("modules")
    op.drop_table("users")
