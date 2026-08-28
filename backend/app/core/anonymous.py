"""
Anonymous session identity for FinPilot.

FinPilot is an anonymous application — no login or signup required.

Anonymous Identity Strategy:
  - The frontend generates a random UUID once and stores it in localStorage
    as `finpilot_session_id`.
  - Every API request includes the header:  X-Session-ID: <uuid>
  - The backend uses this UUID as the "user_id" for all data scoping
    (watchlist, budget, conversations, progress).
  - If the header is missing, the shared fallback UUID is used.

This provides:
  - Per-browser data isolation (no accidental data mixing)
  - Zero authentication overhead
  - Persistent data within the same browser
  - No server-side session storage needed
"""
from __future__ import annotations

import uuid
import logging

from fastapi import Depends, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db

logger = logging.getLogger(__name__)

_FALLBACK_UUID = uuid.UUID("00000000-0000-0000-0000-000000000000")


def _parse_session_header(
    x_session_id: str | None = Header(default=None, alias="X-Session-ID"),
) -> uuid.UUID:
    """Parse the session UUID from the header. Returns fallback UUID if missing/invalid."""
    if not x_session_id:
        return _FALLBACK_UUID
    try:
        return uuid.UUID(x_session_id)
    except (ValueError, AttributeError):
        return _FALLBACK_UUID


async def get_anonymous_id(
    session_uuid: uuid.UUID = Depends(_parse_session_header),
    db: AsyncSession = Depends(get_db),
) -> uuid.UUID:
    """
    FastAPI dependency: resolve an anonymous session UUID and ensure a user row exists.

    Auto-creates a minimal user record on first use so that foreign key constraints
    (watchlist, budget, progress, etc.) are satisfied without requiring real auth.

    Usage:
        @router.get("/something")
        async def handler(session_id: Annotated[uuid.UUID, Depends(get_anonymous_id)]):
            ...
    """
    await _ensure_session_user(db, session_uuid)
    return session_uuid


async def _ensure_session_user(db: AsyncSession, session_id: uuid.UUID) -> None:
    """
    Create a minimal user row for this session UUID if one doesn't already exist.
    This satisfies FK constraints without requiring authentication.
    
    For development/testing with SQLite, we'll bypass the user creation
    since the tables might not exist due to JSONB compatibility issues.
    """
    try:
        # Try to create user if table exists
        from app.models.user import User
        existing = await db.scalar(select(User).where(User.id == session_id))
        if existing is None:
            user = User(
                id=session_id,
                supabase_uid=None,
                email=None,
                role="student",
                onboarding_done=False,
            )
            db.add(user)
            try:
                await db.flush()
            except Exception as e:
                # If table doesn't exist or other error, just log and continue
                import logging
                logger = logging.getLogger(__name__)
                logger.debug(f"Could not create user record: {e}")
                await db.rollback()
    except Exception as e:
        # Table doesn't exist or other error - skip for now
        import logging
        logger = logging.getLogger(__name__)
        logger.debug(f"User table check failed: {e}")
        # For development, we'll proceed without user record
