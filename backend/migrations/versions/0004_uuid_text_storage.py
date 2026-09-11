"""Convert SQLite UUID columns to text storage.

SQLite does not have a native UUID type. Columns declared as UUID can
receive NUMERIC affinity, which can corrupt UUIDs containing only digits
by converting them to floating-point values.

This migration reads the original SQLite column declarations directly
using PRAGMA table_info(), then rebuilds affected tables with VARCHAR(32)
UUID storage.

Revision ID: 0004
Revises: 0003
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def _find_uuid_columns(bind) -> dict[str, list[str]]:
    """Find columns whose physical SQLite declaration is UUID."""

    tables: dict[str, list[str]] = {}

    table_rows = bind.exec_driver_sql(
        """
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name NOT LIKE 'sqlite_%'
        ORDER BY name
        """
    ).fetchall()

    for (table_name,) in table_rows:
        column_rows = bind.exec_driver_sql(
            f'PRAGMA table_info("{table_name}")'
        ).fetchall()

        uuid_columns = []

        for row in column_rows:
            # PRAGMA table_info columns:
            # cid, name, type, notnull, dflt_value, pk
            column_name = row[1]
            declared_type = (row[2] or "").strip().upper()

            if declared_type == "UUID":
                uuid_columns.append(column_name)

        if uuid_columns:
            tables[table_name] = uuid_columns

    return tables


def upgrade() -> None:
    bind = op.get_bind()

    if bind.dialect.name != "sqlite":
        return

    tables_with_uuid_columns = _find_uuid_columns(bind)

    if not tables_with_uuid_columns:
        return

    # SQLite foreign keys can prevent a table from being rebuilt while
    # another table references it. Disable enforcement temporarily.
    bind.exec_driver_sql("PRAGMA foreign_keys=OFF")

    try:
        for table_name, uuid_columns in tables_with_uuid_columns.items():
            with op.batch_alter_table(
                table_name,
                recreate="always",
            ) as batch_op:
                for column_name in uuid_columns:
                    batch_op.alter_column(
                        column_name,
                        existing_type=sa.String(),
                        type_=sa.String(32),
                    )
    finally:
        bind.exec_driver_sql("PRAGMA foreign_keys=ON")


def downgrade() -> None:
    bind = op.get_bind()

    if bind.dialect.name != "sqlite":
        return

    table_rows = bind.exec_driver_sql(
        """
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name NOT LIKE 'sqlite_%'
        ORDER BY name
        """
    ).fetchall()

    tables_with_text_uuid_columns: dict[str, list[str]] = {}

    for (table_name,) in table_rows:
        column_rows = bind.exec_driver_sql(
            f'PRAGMA table_info("{table_name}")'
        ).fetchall()

        text_uuid_columns = []

        for row in column_rows:
            column_name = row[1]
            declared_type = (row[2] or "").strip().upper()

            if declared_type in {"VARCHAR(32)", "CHAR(32)"}:
                text_uuid_columns.append(column_name)

        if text_uuid_columns:
            tables_with_text_uuid_columns[table_name] = text_uuid_columns

    if not tables_with_text_uuid_columns:
        return

    bind.exec_driver_sql("PRAGMA foreign_keys=OFF")

    try:
        for table_name, columns in tables_with_text_uuid_columns.items():
            with op.batch_alter_table(
                table_name,
                recreate="always",
            ) as batch_op:
                for column_name in columns:
                    batch_op.alter_column(
                        column_name,
                        existing_type=sa.String(32),
                        type_=sa.Uuid(as_uuid=True),
                    )
    finally:
        bind.exec_driver_sql("PRAGMA foreign_keys=ON")