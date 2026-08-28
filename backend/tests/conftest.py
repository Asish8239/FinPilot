"""
Shared pytest fixtures for FinPilot AI backend tests.

Uses SQLite in-memory via aiosqlite so tests run without a PostgreSQL instance.
The engine is created fresh for every test function to ensure full isolation.
"""
from __future__ import annotations

import uuid
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

# Override DATABASE_URL before any app modules are imported
import os
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-secret-32-chars-minimum-here!!")
os.environ.setdefault("OPENAI_API_KEY", "")  # intentionally blank for tests

from app.core.database import Base
import app.models  # noqa: F401 — registers all ORM models with Base


# ── SQLite async engine (in-memory, per-test) ──────────────────────────────────

@pytest.fixture
async def db() -> AsyncGenerator[AsyncSession, None]:
    """
    Fresh in-memory SQLite database for each test.
    All tables are created, test runs, tables are dropped.
    """
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False, autoflush=False)

    async with factory() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


# ── Model factories ────────────────────────────────────────────────────────────

@pytest.fixture
async def student_user(db: AsyncSession):
    from app.models.user import User
    from app.models.progress import UserXP, Streak
    user = User(
        supabase_uid=str(uuid.uuid4()),
        email="student@test.com",
        full_name="Test Student",
        role="student",
    )
    db.add(user)
    await db.flush()
    db.add(UserXP(user_id=user.id))
    db.add(Streak(user_id=user.id))
    await db.flush()
    return user


@pytest.fixture
async def admin_user(db: AsyncSession):
    from app.models.user import User
    from app.models.progress import UserXP, Streak
    user = User(
        supabase_uid=str(uuid.uuid4()),
        email="admin@test.com",
        full_name="Admin User",
        role="admin",
    )
    db.add(user)
    await db.flush()
    db.add(UserXP(user_id=user.id))
    db.add(Streak(user_id=user.id))
    await db.flush()
    return user


@pytest.fixture
async def module_with_lesson(db: AsyncSession):
    from app.models.learning import Module, Lesson
    mod = Module(
        title="Test Module",
        slug="test-module",
        description="A test module",
        level="beginner",
        track="C",
        order_index=0,
        is_published=True,
    )
    db.add(mod)
    await db.flush()

    lesson = Lesson(
        module_id=mod.id,
        title="Test Lesson",
        slug="test-lesson",
        content_type="markdown",
        content_markdown="## Test\nThis is test content.",
        order_index=0,
        estimated_minutes=5,
        xp_reward=10,
        is_published=True,
    )
    db.add(lesson)
    await db.flush()
    return mod, lesson


@pytest.fixture
async def quiz_with_questions(db: AsyncSession, module_with_lesson):
    from app.models.quiz import Quiz, Question
    _mod, lesson = module_with_lesson

    quiz = Quiz(
        lesson_id=lesson.id,
        title="Test Quiz",
        passing_score=70,
        max_attempts=3,
    )
    db.add(quiz)
    await db.flush()

    questions = [
        Question(
            quiz_id=quiz.id,
            question_text="What is 2 + 2?",
            question_type="mcq",
            options=[{"key": "A", "text": "3"}, {"key": "B", "text": "4"}, {"key": "C", "text": "5"}],
            correct_answer="B",
            explanation="2 + 2 = 4",
            difficulty="easy",
            points=10,
            order_index=0,
        ),
        Question(
            quiz_id=quiz.id,
            question_text="The sky is blue.",
            question_type="true_false",
            options=None,
            correct_answer="true",
            explanation="The sky appears blue due to Rayleigh scattering.",
            difficulty="easy",
            points=10,
            order_index=1,
        ),
        Question(
            quiz_id=quiz.id,
            question_text="The capital of India is ___.",
            question_type="fill_blank",
            options=None,
            correct_answer="New Delhi",
            explanation="New Delhi is the capital of India.",
            difficulty="easy",
            points=10,
            order_index=2,
        ),
    ]
    for q in questions:
        db.add(q)
    await db.flush()
    return quiz, questions
