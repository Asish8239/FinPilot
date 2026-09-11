"""
Authentication routes for FinPilot.

Supabase Auth is the source of truth for authenticated identity.

Anonymous users continue to operate through X-Session-ID.

When an authenticated user signs in from a browser that previously used
FinPilot anonymously, their anonymous data is automatically migrated
into their authenticated account.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import (
    AuthenticatedIdentity,
    get_authenticated_identity,
)
from app.schemas.user import UserResponse
from app.services.account_migration import migrate_anonymous_account
from app.services.auth_service import get_or_create_user


router = APIRouter()


def _parse_session_id(
    x_session_id: str | None,
) -> uuid.UUID | None:
    """
    Parse X-Session-ID without falling back to the anonymous fallback UUID.

    The fallback UUID must never be used as an account-migration source.
    """

    if not x_session_id:
        return None

    try:
        session_id = uuid.UUID(x_session_id)
    except (ValueError, AttributeError):
        return None

    if session_id.int == 0:
        return None

    return session_id


@router.get(
    "/status",
    summary="Check authenticated status",
)
async def auth_status(
    identity: AuthenticatedIdentity = Depends(
        get_authenticated_identity
    ),
) -> dict:
    """
    Return the verified authentication status.

    This endpoint requires a valid Supabase access token.
    """

    return {
        "mode": "authenticated",
        "authentication": "required",
        "supabase_uid": identity.supabase_uid,
        "email": identity.email,
    }


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get the current FinPilot user",
)
async def get_current_user(
    identity: AuthenticatedIdentity = Depends(
        get_authenticated_identity
    ),
    db: AsyncSession = Depends(get_db),
    x_session_id: str | None = Header(
        default=None,
        alias="X-Session-ID",
    ),
) -> UserResponse:
    """
    Resolve the authenticated Supabase identity to a local FinPilot user.

    On first authenticated access, a local user is created.

    If X-Session-ID identifies an anonymous FinPilot account, that
    account's data is safely merged into the authenticated account.
    """

    user = await get_or_create_user(
        db=db,
        supabase_uid=identity.supabase_uid,
        email=identity.email or "",
    )

    anonymous_session_id = _parse_session_id(x_session_id)

    if anonymous_session_id is not None:
        await migrate_anonymous_account(
            db=db,
            anonymous_user_id=anonymous_session_id,
            authenticated_user=user,
        )

    await db.commit()
    await db.refresh(user)

    return UserResponse.model_validate(user)