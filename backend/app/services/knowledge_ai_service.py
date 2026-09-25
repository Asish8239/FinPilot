from __future__ import annotations

import json
import logging

from app.core.config import settings
from app.core.exceptions import NotFoundError
from app.schemas.knowledge import KnowledgeLessonRequest, KnowledgeLessonResponse
from app.services.knowledge_service import (
    get_related_topics,
    get_topic,
)

logger = logging.getLogger(__name__)


_SYSTEM_PROMPT = """
You are FinPilot Knowledge AI.

You are an educational financial knowledge engine covering Indian and global
financial markets.

Your job is to create accurate, structured educational lessons on demand.

You may explain:
- India
- United States
- Europe
- China
- Japan
- emerging markets
- stocks
- ETFs
- mutual funds
- bonds
- commodities
- currencies
- crypto
- derivatives
- macroeconomics
- central banks
- monetary policy
- fundamental analysis
- technical analysis
- quantitative finance
- algorithmic trading
- portfolio management
- risk management
- behavioral finance
- ESG and sustainability
- financial independence
- personal finance

Rules:
1. Educational content only.
2. Never guarantee returns.
3. Never claim to predict markets.
4. Do not provide personalised investment advice.
5. Clearly distinguish historical facts, concepts, examples and uncertainty.
6. When discussing historical performance, state that past performance does not
   guarantee future results.
7. Use practical examples.
8. Explain connections between markets rather than treating topics in isolation.
9. Adapt the lesson to the requested difficulty.
10. Return ONLY valid JSON matching the requested structure.
"""


def _fallback(topic, difficulty: str) -> dict:
    return {
        "title": f"{topic.name}: an introduction",
        "level": difficulty,
        "overview": topic.description,
        "key_concepts": [
            topic.name,
            topic.category,
            topic.region,
            "Risk and uncertainty",
            "Market context",
        ],
        "lesson": (
            f"{topic.name} is an important concept within {topic.category}. "
            f"This topic is particularly relevant when studying {topic.region} "
            "financial markets. Start by understanding the terminology, the "
            "economic mechanism behind it, and how it connects with related "
            "financial concepts."
        ),
        "examples": [
            f"A practical example involving {topic.name}.",
            f"How {topic.name} can connect with another market concept.",
        ],
        "market_connection": (
            f"{topic.name} should be understood in the wider context of "
            f"{topic.category} and the {topic.region} financial system."
        ),
    }


async def generate_lesson(
    request: KnowledgeLessonRequest,
) -> KnowledgeLessonResponse:
    topic = get_topic(request.topic_slug)

    if topic is None:
        raise NotFoundError("Knowledge topic")

    related = get_related_topics(topic)

    if not settings.groq_configured:
        generated = _fallback(topic, request.difficulty)
        return KnowledgeLessonResponse(
            topic=topic,
            related_topics=related,
            **generated,
        )

    try:
        from groq import Groq

        client = Groq(api_key=settings.GROQ_API_KEY)

        user_prompt = f"""
Create an educational finance lesson for this topic.

Topic:
- Name: {topic.name}
- Category: {topic.category}
- Region: {topic.region}
- Description: {topic.description}
- Difficulty requested: {request.difficulty}
- Optional focus: {request.focus or "None"}

Return JSON with EXACTLY these keys:

{{
  "title": "string",
  "level": "string",
  "overview": "string",
  "key_concepts": ["string"],
  "lesson": "string",
  "examples": ["string"],
  "market_connection": "string"
}}

Requirements:
- overview: 2-4 sentences
- key_concepts: 4-7 concepts
- lesson: detailed but readable educational explanation
- examples: 2-4 practical examples
- market_connection: explain how this topic connects to other markets
- no personalised investment advice
"""

        response = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=settings.GROQ_TEMPERATURE,
            max_tokens=settings.GROQ_MAX_TOKENS,
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content or ""
        generated = json.loads(content)

        return KnowledgeLessonResponse(
            topic=topic,
            title=str(generated.get("title") or f"{topic.name}: an introduction"),
            level=str(generated.get("level") or request.difficulty),
            overview=str(generated.get("overview") or topic.description),
            key_concepts=[
                str(item)
                for item in generated.get("key_concepts", [])
            ],
            lesson=str(generated.get("lesson") or ""),
            examples=[
                str(item)
                for item in generated.get("examples", [])
            ],
            market_connection=str(
                generated.get("market_connection") or ""
            ),
            related_topics=related,
        )

    except Exception as exc:
        logger.exception(
            "Knowledge lesson generation failed for %s: %s",
            topic.slug,
            exc,
        )

        generated = _fallback(topic, request.difficulty)

        return KnowledgeLessonResponse(
            topic=topic,
            related_topics=related,
            **generated,
        )
