"""
Unit tests for AI tutor service — specifically the graceful-degradation and
rate-limiting paths that don't require a real OpenAI key.
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services import ai_tutor_service


class TestAITutorGracefulDegradation:
    """When OPENAI_API_KEY is blank, the tutor must return a useful fallback."""

    async def test_stream_returns_fallback_when_no_key(self, db, student_user):
        from app.models.ai_tutor import AIConversation, AIMessage

        conv = AIConversation(user_id=student_user.id, title="Test")
        db.add(conv)
        await db.flush()

        # Patch the client to return None (simulates missing key)
        with patch.object(ai_tutor_service, "_get_client", return_value=None):
            chunks = []
            async for chunk in ai_tutor_service.stream_response(
                db, conv, student_user, "What is a SIP?"
            ):
                chunks.append(chunk)

        full = "".join(chunks)
        assert "[DONE]" in full
        # The fallback message should be in the stream
        assert "unavailable" in full.lower() or "not configured" in full.lower()

    async def test_stream_persists_fallback_message(self, db, student_user):
        from app.models.ai_tutor import AIConversation, AIMessage
        from sqlalchemy import select

        conv = AIConversation(user_id=student_user.id, title="Test")
        db.add(conv)
        await db.flush()

        with patch.object(ai_tutor_service, "_get_client", return_value=None):
            async for _ in ai_tutor_service.stream_response(
                db, conv, student_user, "Hello"
            ):
                pass

        messages = (await db.execute(
            select(AIMessage).where(AIMessage.conversation_id == conv.id)
        )).scalars().all()
        roles = [m.role for m in messages]
        assert "user" in roles
        assert "assistant" in roles


class TestRateLimit:

    async def test_rate_limit_raises_after_30_messages(self, db, student_user):
        from app.models.ai_tutor import AIConversation, AIMessage
        from app.core.exceptions import RateLimitError

        conv = AIConversation(user_id=student_user.id, title="Rate test")
        db.add(conv)
        await db.flush()

        # Add 30 user messages within the last hour
        now = datetime.now(timezone.utc)
        for _ in range(30):
            db.add(AIMessage(
                conversation_id=conv.id,
                role="user",
                content="test",
            ))
        await db.flush()

        with pytest.raises(RateLimitError):
            await ai_tutor_service._check_rate_limit(db, conv.id)


class TestConversationOwnership:

    async def test_get_conversation_raises_forbidden_for_wrong_user(self, db, student_user):
        from app.models.ai_tutor import AIConversation
        from app.core.exceptions import ForbiddenError

        conv = AIConversation(user_id=student_user.id, title="Private")
        db.add(conv)
        await db.flush()

        other_user_id = uuid.uuid4()
        with pytest.raises(ForbiddenError):
            await ai_tutor_service.get_conversation(db, conv.id, other_user_id)

    async def test_get_conversation_raises_not_found_for_missing(self, db, student_user):
        from app.core.exceptions import NotFoundError

        with pytest.raises(NotFoundError):
            await ai_tutor_service.get_conversation(db, uuid.uuid4(), student_user.id)


class TestConversationCRUD:

    async def test_create_conversation_sets_title_from_message(self, db, student_user):
        conv = await ai_tutor_service.create_conversation(
            db, student_user, "What is compound interest?", None
        )
        assert "What is compound interest" in conv.title

    async def test_create_conversation_title_truncated_at_60(self, db, student_user):
        long_message = "A" * 100
        conv = await ai_tutor_service.create_conversation(db, student_user, long_message, None)
        assert len(conv.title) <= 63  # 60 chars + "…"

    async def test_list_conversations_returns_user_convs(self, db, student_user):
        await ai_tutor_service.create_conversation(db, student_user, "Hello", None)
        await ai_tutor_service.create_conversation(db, student_user, "World", None)
        convs = await ai_tutor_service.list_conversations(db, student_user.id)
        assert len(convs) == 2

    async def test_list_conversations_excludes_other_users(self, db, student_user, admin_user):
        await ai_tutor_service.create_conversation(db, student_user, "Mine", None)
        admin_convs = await ai_tutor_service.list_conversations(db, admin_user.id)
        assert len(admin_convs) == 0
