"""
Integration tests for auth service — uses in-memory SQLite DB.
"""
from __future__ import annotations

import uuid

import pytest

from app.services import auth_service
from app.schemas.user import UpdateProfileRequest


class TestGetOrCreateUser:

    async def test_creates_user_on_first_call(self, db):
        uid = str(uuid.uuid4())
        user = await auth_service.get_or_create_user(db, uid, "new@test.com")
        assert user.supabase_uid == uid
        assert user.email == "new@test.com"
        assert user.role == "student"

    async def test_bootstraps_xp_and_streak(self, db):
        from sqlalchemy import select
        from app.models.progress import UserXP, Streak

        uid = str(uuid.uuid4())
        user = await auth_service.get_or_create_user(db, uid, "bootstrap@test.com")

        xp = await db.scalar(select(UserXP).where(UserXP.user_id == user.id))
        streak = await db.scalar(select(Streak).where(Streak.user_id == user.id))

        assert xp is not None
        assert xp.total_xp == 0
        assert streak is not None
        assert streak.current_streak == 0

    async def test_second_call_returns_same_user(self, db):
        uid = str(uuid.uuid4())
        u1 = await auth_service.get_or_create_user(db, uid, "same@test.com")
        u2 = await auth_service.get_or_create_user(db, uid, "same@test.com")
        assert u1.id == u2.id

    async def test_get_user_by_supabase_uid(self, db):
        uid = str(uuid.uuid4())
        created = await auth_service.get_or_create_user(db, uid, "find@test.com")
        found = await auth_service.get_user_by_supabase_uid(db, uid)
        assert found is not None
        assert found.id == created.id

    async def test_get_user_returns_none_for_missing(self, db):
        result = await auth_service.get_user_by_supabase_uid(db, "nonexistent-uid")
        assert result is None

    async def test_update_profile_full_name(self, db, student_user):
        updated = await auth_service.update_user_profile(
            db, student_user, UpdateProfileRequest(full_name="Updated Name")
        )
        assert updated.full_name == "Updated Name"

    async def test_update_profile_onboarding_done(self, db, student_user):
        assert student_user.onboarding_done is False
        await auth_service.update_user_profile(
            db, student_user, UpdateProfileRequest(onboarding_done=True)
        )
        assert student_user.onboarding_done is True

    async def test_update_profile_partial_update(self, db, student_user):
        """Passing None fields should not overwrite existing values."""
        student_user.full_name = "Original Name"
        await auth_service.update_user_profile(
            db, student_user, UpdateProfileRequest(onboarding_done=True)
        )
        assert student_user.full_name == "Original Name"
        assert student_user.onboarding_done is True
