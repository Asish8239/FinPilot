"""
AI Tutor service — Groq-backed educational finance assistant.

No authentication required. Uses anonymous session UUIDs for conversation isolation.

Security guarantees:
  - GROQ_API_KEY is read server-side only; it never reaches the browser.
  - Missing or empty API key produces a graceful degraded response instead of a crash.
  - Rate limit: 30 user messages per hour per conversation.
"""
from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import AsyncGenerator

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import NotFoundError, ForbiddenError, RateLimitError
from app.models.ai_tutor import AIConversation, AIMessage
from app.models.learning import Lesson
from app.models.progress import UserXP

logger = logging.getLogger(__name__)


# ── Groq client (lazy-initialised) ────────────────────────────────────────────

_groq_client = None


def _get_client():
    """Lazily initialise Groq client. Returns None if not configured."""
    global _groq_client
    if _groq_client is None:
        if not settings.groq_configured:
            return None
        try:
            from groq import Groq
            _groq_client = Groq(api_key=settings.GROQ_API_KEY)
        except ImportError:
            logger.error("groq package not installed — AI tutor disabled")
            return None
    return _groq_client


# ── System prompt ──────────────────────────────────────────────────────────────

_SYSTEM_PROMPT = """\
You are FinPilot AI, a friendly personal finance education tutor for Indian learners.

## Your expertise
- Budgeting and savings (50/30/20 rule, zero-based budgeting, emergency funds)
- Systematic Investment Plans (SIPs), rupee-cost averaging, step-up SIPs
- Mutual funds: equity, debt, hybrid, index; NAV, expense ratio, exit load
- Direct vs regular mutual fund plans; AMFI, SEBI regulations
- Stock market: NSE, BSE, Nifty 50, Sensex, P/E ratio, market capitalisation
- Index funds and ETFs; passive vs active investing
- Tax-saving instruments: ELSS, PPF, NPS, EPF; Section 80C; LTCG/STCG
- Portfolio diversification, asset allocation, rebalancing
- Retirement planning, goal-based investing, Financial Independence (FI)

## Hard rules — follow without exception
1. You are EDUCATIONAL. You explain concepts. Do NOT give personalised investment advice.
2. When discussing historical returns or projections include:
   "⚠️ Past performance does not guarantee future results."
3. Never claim to predict market movements or guarantee any rate of return.
4. Never recommend specific mutual fund schemes, stocks, or brokers by name.
5. Always recommend consulting a SEBI-registered investment advisor for personalised advice.

## Tone and style
- Use simple language suitable for a {user_level} learner.
- Use relatable Indian examples (₹ amounts, Nifty 50, NSE).
- Keep responses concise: 3–5 paragraphs unless the user asks for more detail.
- Use bullet points for lists; bold key terms.
- End explanatory responses with: 💡 **Key Takeaway:** <one-sentence summary>

## Context
- User level: {user_level}
- Current lesson: {lesson_title}
"""

_FALLBACK_MESSAGE = (
    "I'm sorry — the AI tutor is temporarily unavailable. "
    "Please ensure GROQ_API_KEY is configured on the server. "
    "Try again or refresh the page."
)


async def _build_system_prompt(
    db: AsyncSession,
    session_id: uuid.UUID,
    lesson_id: uuid.UUID | None,
) -> str:
    xp_row = await db.scalar(select(UserXP).where(UserXP.user_id == session_id))
    total_xp = xp_row.total_xp if xp_row else 0
    level = (
        "beginner" if total_xp < 300
        else "intermediate" if total_xp < 800
        else "advanced"
    )
    lesson_title = "General Finance"
    if lesson_id:
        lesson = await db.scalar(select(Lesson).where(Lesson.id == lesson_id))
        if lesson:
            lesson_title = lesson.title

    return _SYSTEM_PROMPT.format(user_level=level, lesson_title=lesson_title)


# ── CRUD operations ────────────────────────────────────────────────────────────

async def create_conversation(
    db: AsyncSession,
    session_id: uuid.UUID,
    initial_message: str,
    lesson_id: uuid.UUID | None,
) -> AIConversation:
    title = initial_message[:60].strip()
    if len(initial_message) > 60:
        title += "…"
    conv = AIConversation(user_id=session_id, lesson_id=lesson_id, title=title)
    db.add(conv)
    await db.flush()
    db.add(AIMessage(conversation_id=conv.id, role="user", content=initial_message))
    await db.flush()
    return conv


async def get_conversation(
    db: AsyncSession,
    conv_id: uuid.UUID,
    session_id: uuid.UUID,
) -> AIConversation:
    conv = await db.scalar(select(AIConversation).where(AIConversation.id == conv_id))
    if not conv:
        raise NotFoundError("Conversation")
    if conv.user_id != session_id:
        raise ForbiddenError("This conversation belongs to a different session")
    return conv


async def list_conversations(
    db: AsyncSession, session_id: uuid.UUID
) -> list[AIConversation]:
    result = await db.execute(
        select(AIConversation)
        .where(AIConversation.user_id == session_id)
        .order_by(AIConversation.updated_at.desc())
    )
    return result.scalars().all()


async def get_messages(db: AsyncSession, conv_id: uuid.UUID) -> list[AIMessage]:
    result = await db.execute(
        select(AIMessage)
        .where(AIMessage.conversation_id == conv_id)
        .order_by(AIMessage.created_at)
    )
    return result.scalars().all()


async def _persist_message(
    db: AsyncSession,
    conv_id: uuid.UUID,
    role: str,
    content: str,
) -> None:
    db.add(AIMessage(conversation_id=conv_id, role=role, content=content))
    await db.flush()


# ── Rate limiting ──────────────────────────────────────────────────────────────

async def _check_rate_limit(db: AsyncSession, conv_id: uuid.UUID) -> None:
    hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
    count: int = await db.scalar(
        select(func.count(AIMessage.id)).where(
            AIMessage.conversation_id == conv_id,
            AIMessage.role == "user",
            AIMessage.created_at >= hour_ago,
        )
    ) or 0
    if count >= settings.AI_RATE_LIMIT_PER_HOUR:
        raise RateLimitError(
            f"AI tutor limit: {settings.AI_RATE_LIMIT_PER_HOUR} messages per hour."
        )


# ── Streaming response via Groq ────────────────────────────────────────────────

async def stream_response(
    db: AsyncSession,
    conv: AIConversation,
    session_id: uuid.UUID,
    user_message: str,
    max_history: int = 20,
) -> AsyncGenerator[str, None]:
    """
    Stream the Groq AI tutor response as Server-Sent Events.

    Yields:
      data: {"token": "<chunk>"}  — one per token
      data: [DONE]                 — end of stream
      data: {"error": "<msg>"}     — on failure (graceful degradation)
    """
    await _check_rate_limit(db, conv.id)
    await _persist_message(db, conv.id, "user", user_message)

    client = _get_client()
    if client is None:
        logger.warning("Groq not configured — returning fallback message for conv %s", conv.id)
        await _persist_message(db, conv.id, "assistant", _FALLBACK_MESSAGE)
        yield f"data: {json.dumps({'token': _FALLBACK_MESSAGE})}\n\n"
        yield "data: [DONE]\n\n"
        return

    system_prompt = await _build_system_prompt(db, session_id, conv.lesson_id)
    history = await get_messages(db, conv.id)
    recent = [m for m in history if m.role != "system"][-max_history:]

    messages = [{"role": "system", "content": system_prompt}]
    messages += [{"role": m.role, "content": m.content} for m in recent]

    full_response = ""
    try:
        stream = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=messages,
            stream=True,
            temperature=settings.GROQ_TEMPERATURE,
            max_tokens=settings.GROQ_MAX_TOKENS,
        )
        for chunk in stream:
            delta = chunk.choices[0].delta.content or ""
            if delta:
                full_response += delta
                yield f"data: {json.dumps({'token': delta})}\n\n"

    except Exception as exc:
        logger.error("Groq streaming error for conv %s: %s", conv.id, exc)
        error_msg = "I encountered an error while generating a response. Please try again."
        full_response = error_msg
        yield f"data: {json.dumps({'error': error_msg})}\n\n"

    finally:
        if full_response:
            await _persist_message(db, conv.id, "assistant", full_response)
        yield "data: [DONE]\n\n"
