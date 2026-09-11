from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.progress import Streak, UserXP
from app.models.user import User
from app.schemas.user import UpdateProfileRequest


async def get_or_create_user(
    db: AsyncSession,
    supabase_uid: str,
    email: str,
) -> User:
    """
    Get the local FinPilot user corresponding to a Supabase identity.

    If this is the first authenticated request, create the local user
    and bootstrap the XP/streak records.
    """

    result = await db.execute(
        select(User).where(User.supabase_uid == supabase_uid)
    )

    user = result.scalar_one_or_none()

    if user is None:
        user = User(
            supabase_uid=supabase_uid,
            email=email,
        )

        db.add(user)
        await db.flush()

        db.add(UserXP(user_id=user.id))
        db.add(Streak(user_id=user.id))

        await db.flush()

    else:
        # Keep the local email synchronized with the verified
        # Supabase identity when an email is available.
        if email and user.email != email:
            user.email = email
            await db.flush()

    return user


async def get_user_by_supabase_uid(
    db: AsyncSession,
    supabase_uid: str,
) -> User | None:
    result = await db.execute(
        select(User).where(User.supabase_uid == supabase_uid)
    )

    return result.scalar_one_or_none()


async def update_user_profile(
    db: AsyncSession,
    user: User,
    data: UpdateProfileRequest,
) -> User:
    if data.full_name is not None:
        user.full_name = data.full_name

    if data.avatar_url is not None:
        user.avatar_url = data.avatar_url

    if data.onboarding_done is not None:
        user.onboarding_done = data.onboarding_done

    await db.flush()

    return user