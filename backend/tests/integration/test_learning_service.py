"""
Integration tests for learning service — lesson retrieval, completion,
idempotent XP, streak updates, and badge awarding.
"""
from __future__ import annotations

import uuid

import pytest
from sqlalchemy import select

from app.services import learning_service
from app.models.progress import UserXP, Streak, UserBadge, Badge


class TestLessonCompletion:

    async def test_complete_lesson_awards_xp(self, db, student_user, module_with_lesson):
        _mod, lesson = module_with_lesson
        result = await learning_service.complete_lesson(db, lesson.id, student_user.id, 120)

        assert result.xp_earned == lesson.xp_reward
        assert result.total_xp == lesson.xp_reward
        assert result.already_completed is False

    async def test_complete_lesson_idempotent_no_double_xp(self, db, student_user, module_with_lesson):
        """Completing the same lesson twice must not award XP twice."""
        _mod, lesson = module_with_lesson

        r1 = await learning_service.complete_lesson(db, lesson.id, student_user.id, 60)
        r2 = await learning_service.complete_lesson(db, lesson.id, student_user.id, 60)

        assert r1.already_completed is False
        assert r2.already_completed is True
        assert r2.total_xp == r1.total_xp   # XP did not increase on second call

    async def test_complete_lesson_updates_xp_row(self, db, student_user, module_with_lesson):
        _mod, lesson = module_with_lesson
        await learning_service.complete_lesson(db, lesson.id, student_user.id, 0)

        xp_row = await db.scalar(select(UserXP).where(UserXP.user_id == student_user.id))
        assert xp_row.total_xp == lesson.xp_reward

    async def test_complete_lesson_updates_streak(self, db, student_user, module_with_lesson):
        _mod, lesson = module_with_lesson
        await learning_service.complete_lesson(db, lesson.id, student_user.id, 0)

        streak_row = await db.scalar(select(Streak).where(Streak.user_id == student_user.id))
        assert streak_row.current_streak == 1
        assert streak_row.last_activity_date is not None

    async def test_complete_nonexistent_lesson_raises_not_found(self, db, student_user):
        from app.core.exceptions import NotFoundError
        with pytest.raises(NotFoundError):
            await learning_service.complete_lesson(db, uuid.uuid4(), student_user.id, 0)

    async def test_complete_lesson_returns_new_badges(self, db, student_user, module_with_lesson):
        # Add a badge that should be awarded on first lesson completion
        badge = Badge(
            name="First Step Test",
            description="Complete your first lesson",
            icon_url="🎯",
            criteria_type="lessons_completed",
            criteria_value=1,
        )
        db.add(badge)
        await db.flush()

        _mod, lesson = module_with_lesson
        result = await learning_service.complete_lesson(db, lesson.id, student_user.id, 0)

        assert "First Step Test" in result.new_badges

    async def test_badge_not_awarded_twice(self, db, student_user, module_with_lesson):
        """The same badge must not appear in new_badges on re-completion."""
        badge = Badge(
            name="Unique Badge",
            description="Test",
            icon_url="⭐",
            criteria_type="lessons_completed",
            criteria_value=1,
        )
        db.add(badge)
        await db.flush()

        _mod, lesson = module_with_lesson
        r1 = await learning_service.complete_lesson(db, lesson.id, student_user.id, 0)
        assert "Unique Badge" in r1.new_badges

        # Second call — already_completed, badge already earned
        r2 = await learning_service.complete_lesson(db, lesson.id, student_user.id, 0)
        assert "Unique Badge" not in r2.new_badges


class TestListModules:

    async def test_list_modules_returns_published_only(self, db, student_user, module_with_lesson):
        from app.models.learning import Module
        # Add an unpublished module
        unpublished = Module(
            title="Hidden Module",
            slug="hidden-module",
            level="beginner",
            order_index=99,
            is_published=False,
        )
        db.add(unpublished)
        await db.flush()

        modules = await learning_service.list_modules(db, student_user.id)
        slugs = [m.slug for m in modules]
        assert "hidden-module" not in slugs
        assert "test-module" in slugs

    async def test_list_modules_includes_completion_pct(self, db, student_user, module_with_lesson):
        _mod, lesson = module_with_lesson
        await learning_service.complete_lesson(db, lesson.id, student_user.id, 0)

        modules = await learning_service.list_modules(db, student_user.id)
        test_mod = next(m for m in modules if m.slug == "test-module")
        assert test_mod.completion_pct == 100.0
        assert test_mod.completed_count == 1


class TestGetLesson:

    async def test_get_lesson_returns_lesson_and_progress(self, db, student_user, module_with_lesson):
        _mod, lesson = module_with_lesson
        fetched_lesson, progress = await learning_service.get_lesson(db, lesson.id, student_user.id)
        assert fetched_lesson.id == lesson.id
        assert progress is None  # not started yet

    async def test_get_lesson_shows_progress_after_completion(self, db, student_user, module_with_lesson):
        _mod, lesson = module_with_lesson
        await learning_service.complete_lesson(db, lesson.id, student_user.id, 60)

        _fetched, progress = await learning_service.get_lesson(db, lesson.id, student_user.id)
        assert progress is not None
        assert progress.completed is True
