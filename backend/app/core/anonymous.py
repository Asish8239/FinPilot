from __future__ import annotations

import logging
import uuid

from fastapi import Depends, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import verify_supabase_access_token
from app.services.auth_service import get_or_create_user

logger = logging.getLogger(__name__)

_FALLBACK_UUID = uuid.UUID("00000000-0000-0000-0000-000000000000")


def _parse_session_header(
    x_session_id: str | None = Header(
        default=None,
        alias="X-Session-ID",
    ),
) -> uuid.UUID:
    """
    Parse the browser's anonymous session identifier.

    Invalid or missing session IDs resolve to the fallback UUID.
    """
    if not x_session_id:
        return _FALLBACK_UUID

    try:
        return uuid.UUID(x_session_id)
    except (ValueError, AttributeError):
        return _FALLBACK_UUID


def _extract_bearer_token(
    authorization: str | None,
) -> str | None:
    """
    Extract a Bearer token from the Authorization header.

    Returns None when the request is anonymous.
    """
    if not authorization:
        return None

    scheme, _, token = authorization.partition(" ")

    if scheme.lower() != "bearer" or not token.strip():
        return None

    return token.strip()


async def get_anonymous_id(
    session_uuid: uuid.UUID = Depends(_parse_session_header),
    authorization: str | None = Header(
        default=None,
        alias="Authorization",
    ),
    db: AsyncSession = Depends(get_db),
) -> uuid.UUID:
    """
    Resolve the application's effective user ID.

    Authenticated requests:
        Supabase Bearer token -> authenticated FinPilot user ID.

    Anonymous requests:
        X-Session-ID -> anonymous FinPilot user ID.

    This keeps the existing anonymous-session architecture while ensuring
    that authenticated users never fall back to their old anonymous account.
    """

    token = _extract_bearer_token(authorization)

    # ---------------------------------------------------------
    # AUTHENTICATED REQUEST
    # ---------------------------------------------------------
    if token:
        identity = await verify_supabase_access_token(token)

        user = await get_or_create_user(
            db=db,
            supabase_uid=identity.supabase_uid,
            email=identity.email or "",
        )

        return user.id

    # ---------------------------------------------------------
    # ANONYMOUS REQUEST
    # ---------------------------------------------------------
    await _ensure_session_user(
        db=db,
        session_id=session_uuid,
    )

    return session_uuid


async def _ensure_session_user(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> None:
    """
    Ensure an anonymous browser session has a corresponding User row.

    The fallback UUID is intentionally ignored because it represents
    requests where no usable anonymous session identifier was supplied.
    """
    if session_id == _FALLBACK_UUID:
        return

    try:
        from app.models.user import User

        existing = await db.scalar(
            select(User).where(User.id == session_id)
        )

        if existing is not None:
            return

        user = User(
            id=session_id,
            supabase_uid=None,
            email=None,
            role="student",
            onboarding_done=False,
        )

        db.add(user)
        await db.flush()

    except Exception as exc:
        logger.debug(
            "Could not create anonymous session user %s: %s",
            session_id,
            exc,
        )