"""Make users table compatible with anonymous sessions.

Anonymous sessions use a browser-generated UUID as user_id.
The supabase_uid and email columns must be nullable since anonymous
sessions don't have Supabase credentials.

Also removes unused SUPABASE_JWT_SECRET-dependent constraints.

Revision ID: 0003
Revises: 0002
Create Date: 2026-08-24
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Make supabase_uid nullable — anonymous sessions don't have a Supabase UID
    op.alter_column(
        "users",
        "supabase_uid",
        existing_type=sa.String(),
        nullable=True,
    )

    # Make email nullable — anonymous sessions use a placeholder email
    # but we want real accounts to be optional too
    op.alter_column(
        "users",
        "email",
        existing_type=sa.String(),
        nullable=True,
    )

    # Drop the unique constraint on supabase_uid (was NOT NULL UNIQUE)
    # Re-create as a partial unique index (NULL values are excluded from UNIQUE in Postgres)
    op.execute(
        "ALTER TABLE users DROP CONSTRAINT IF EXISTS users_supabase_uid_key"
    )
    op.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_supabase_uid_unique "
        "ON users(supabase_uid) WHERE supabase_uid IS NOT NULL"
    )

    # Drop the unique constraint on email
    # Re-create as partial index (anon emails are unique per session but share domain)
    op.execute(
        "ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key"
    )
    op.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email_unique "
        "ON users(email) WHERE email IS NOT NULL AND email NOT LIKE '%@anon.local'"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_users_email_unique")
    op.execute("DROP INDEX IF EXISTS ix_users_supabase_uid_unique")
    op.alter_column("users", "email", existing_type=sa.String(), nullable=False)
    op.alter_column("users", "supabase_uid", existing_type=sa.String(), nullable=False)
