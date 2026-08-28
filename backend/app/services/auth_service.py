import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.models.progress import UserXP, Streak
from app.schemas.user import UpdateProfileRequest


async def get_or_create_user(db: AsyncSession, supabase_uid: str, email: str) -> User:
    """Upsert user record on first login / token sync."""
    result = await db.execute(select(User).where(User.supabase_uid == supabase_uid))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(supabase_uid=supabase_uid, email=email)
        db.add(user)
        await db.flush()

        # Bootstrap XP and streak rows
        db.add(UserXP(user_id=user.id))
        db.add(Streak(user_id=user.id))
        await db.flush()

    return user


async def get_user_by_supabase_uid(db: AsyncSession, supabase_uid: str) -> User | None:
    result = await db.execute(select(User).where(User.supabase_uid == supabase_uid))
    return result.scalar_one_or_none()


async def update_user_profile(db: AsyncSession, user: User, data: UpdateProfileRequest) -> User:
    if data.full_name is not None:
        user.full_name = data.full_name
    if data.avatar_url is not None:
        user.avatar_url = data.avatar_url
    if data.onboarding_done is not None:
        user.onboarding_done = data.onboarding_done
    await db.flush()
    return user
