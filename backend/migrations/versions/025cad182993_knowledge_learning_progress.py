from alembic import op
import sqlalchemy as sa

revision = "knowledge_learning_progress"
down_revision = "025cad182993"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "knowledge_learning_progress",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("session_id", sa.String(length=128), nullable=False),
        sa.Column("topic_slug", sa.String(length=160), nullable=False),
        sa.Column("topic_name", sa.String(length=255), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False),
        sa.Column("completed_attempts", sa.Integer(), nullable=False),
        sa.Column("best_score", sa.Integer(), nullable=False),
        sa.Column("best_percentage", sa.Float(), nullable=False),
        sa.Column("average_percentage", sa.Float(), nullable=False),
        sa.Column("mastery", sa.Float(), nullable=False),
        sa.Column("current_difficulty", sa.String(length=32), nullable=False),
        sa.Column("last_percentage", sa.Float(), nullable=False),
        sa.Column("last_result", sa.String(length=32), nullable=True),
        sa.Column("last_feedback", sa.Text(), nullable=True),
        sa.Column("last_attempt_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "session_id",
            "topic_slug",
            name="uq_knowledge_progress_session_topic",
        ),
    )

    op.create_index(
        "ix_knowledge_progress_session_id",
        "knowledge_learning_progress",
        ["session_id"],
    )

    op.create_index(
        "ix_knowledge_progress_topic_slug",
        "knowledge_learning_progress",
        ["topic_slug"],
    )

    op.create_index(
        "ix_knowledge_progress_mastery",
        "knowledge_learning_progress",
        ["mastery"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_knowledge_progress_mastery",
        table_name="knowledge_learning_progress",
    )
    op.drop_index(
        "ix_knowledge_progress_topic_slug",
        table_name="knowledge_learning_progress",
    )
    op.drop_index(
        "ix_knowledge_progress_session_id",
        table_name="knowledge_learning_progress",
    )
    op.drop_table("knowledge_learning_progress")
