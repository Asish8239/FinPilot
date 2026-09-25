from __future__ import annotations

import json
import logging
import uuid

from app.core.config import settings
from app.core.exceptions import NotFoundError
from app.schemas.knowledge import (
    KnowledgeQuizQuestion,
    KnowledgeQuizRequest,
    KnowledgeQuizResponse,
)
from app.services.knowledge_service import get_related_topics, get_topic

logger = logging.getLogger(__name__)


_SYSTEM_PROMPT = """
You are FinPilot Knowledge Quiz AI.

You are an educational financial knowledge assessment engine covering Indian
and global financial markets.

Your job is to generate accurate, useful quizzes from a specified financial
knowledge topic.

You may create questions covering:
- personal finance
- Indian markets
- US markets
- European markets
- China and Japan
- emerging markets
- global markets
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
- factor investing
- portfolio management
- risk management
- behavioral finance
- ESG and sustainability
- financial independence

Rules:
1. Educational content only.
2. Never guarantee investment returns.
3. Never claim to predict future markets.
4. Never provide personalised investment advice.
5. Questions must test understanding, not memorisation alone.
6. Use realistic but clearly educational examples.
7. Adapt complexity to the requested difficulty.
8. Avoid ambiguous questions.
9. Every MCQ must have exactly four options.
10. Exactly one option must be correct.
11. The correct answer must be represented by its option key.
12. Explanations should teach why the correct answer is correct.
13. Do not reference unavailable live market data.
14. Return ONLY valid JSON matching the requested structure.
"""


def _fallback(topic, difficulty: str, question_count: int) -> dict:
    """
    Safe deterministic fallback used when the AI provider is unavailable.
    The questions are intentionally generic rather than pretending to be
    highly topic-specific AI content.
    """
    base_questions = [
        {
            "id": str(uuid.uuid4()),
            "question": f"Which statement best describes {topic.name}?",
            "options": [
                {"key": "A", "text": topic.description},
                {"key": "B", "text": "A guaranteed method of generating investment returns"},
                {"key": "C", "text": "A concept with no connection to financial markets"},
                {"key": "D", "text": "A prediction that determines future market prices"},
            ],
            "correct_answer": "A",
            "explanation": (
                f"{topic.name} is best understood through its underlying "
                "financial concepts, mechanisms, risks and market context. "
                "It should not be treated as a guarantee or prediction."
            ),
        },
        {
            "id": str(uuid.uuid4()),
            "question": f"Why is understanding {topic.name} useful?",
            "options": [
                {"key": "A", "text": "It eliminates all financial risk"},
                {"key": "B", "text": "It helps build financial knowledge and understand market relationships"},
                {"key": "C", "text": "It guarantees positive returns"},
                {"key": "D", "text": "It makes diversification unnecessary"},
            ],
            "correct_answer": "B",
            "explanation": (
                "Financial knowledge helps people understand mechanisms, "
                "trade-offs and uncertainty. It cannot eliminate risk or "
                "guarantee returns."
            ),
        },
        {
            "id": str(uuid.uuid4()),
            "question": f"What should a learner focus on first when studying {topic.name}?",
            "options": [
                {"key": "A", "text": "Guaranteed future performance"},
                {"key": "B", "text": "A specific investment recommendation"},
                {"key": "C", "text": "Definitions, mechanisms, examples and risks"},
                {"key": "D", "text": "Ignoring related financial concepts"},
            ],
            "correct_answer": "C",
            "explanation": (
                "A strong foundation starts with terminology, mechanisms, "
                "examples and risks before moving into more advanced analysis."
            ),
        },
        {
            "id": str(uuid.uuid4()),
            "question": f"How should {topic.name} be interpreted in financial markets?",
            "options": [
                {"key": "A", "text": "As one isolated concept with no relationships"},
                {"key": "B", "text": "As a guaranteed signal for buying or selling"},
                {"key": "C", "text": "As a concept that can interact with broader market forces"},
                {"key": "D", "text": "As proof that future prices can be predicted"},
            ],
            "correct_answer": "C",
            "explanation": (
                "Financial concepts interact with broader economic and market "
                "forces. Understanding those relationships is more useful than "
                "treating a topic as an isolated signal."
            ),
        },
        {
            "id": str(uuid.uuid4()),
            "question": f"Which principle is important when learning about {topic.name}?",
            "options": [
                {"key": "A", "text": "Past outcomes guarantee future outcomes"},
                {"key": "B", "text": "Financial markets involve uncertainty and risk"},
                {"key": "C", "text": "Every market movement has one certain cause"},
                {"key": "D", "text": "Risk can always be completely removed"},
            ],
            "correct_answer": "B",
            "explanation": (
                "Markets involve uncertainty and multiple interacting factors. "
                "Understanding risk is therefore a fundamental part of financial education."
            ),
        },
    ]

    return {
        "title": f"{topic.name} ? {difficulty.title()} Knowledge Quiz",
        "level": difficulty,
        "questions": base_questions[:question_count],
        "generated_by": "FinPilot fallback knowledge engine",
    }


async def generate_quiz(
    request: KnowledgeQuizRequest,
) -> KnowledgeQuizResponse:
    topic = get_topic(request.topic_slug)

    if topic is None:
        raise NotFoundError("Knowledge topic")

    if not settings.groq_configured:
        generated = _fallback(
            topic,
            request.difficulty,
            request.question_count,
        )
        return KnowledgeQuizResponse(
            topic=topic,
            **generated,
            educational_notice=(
                "This quiz was generated by the local fallback engine. "
                "It is educational and is not investment advice."
            ),
        )

    related = get_related_topics(topic)

    try:
        from groq import Groq

        client = Groq(api_key=settings.GROQ_API_KEY)

        related_names = ", ".join(
            getattr(item, "name", str(item))
            for item in related[:8]
        )

        user_prompt = f"""
Create a financial knowledge quiz for this topic.

Topic:
- Name: {topic.name}
- Category: {topic.category}
- Region: {topic.region}
- Description: {topic.description}
- Difficulty: {request.difficulty}
- Number of questions: {request.question_count}
- Optional focus: {request.focus or "None"}
- Related topics: {related_names or "None"}

Return JSON with EXACTLY these keys:

{{
  "title": "string",
  "level": "{request.difficulty}",
  "questions": [
    {{
      "id": "q1",
      "question": "string",
      "options": [
        {{"key": "A", "text": "string"}},
        {{"key": "B", "text": "string"}},
        {{"key": "C", "text": "string"}},
        {{"key": "D", "text": "string"}}
      ],
      "correct_answer": "A",
      "explanation": "string"
    }}
  ]
}}

Requirements:
- Generate exactly {request.question_count} questions.
- Every question must have exactly four options.
- Exactly one option must be correct.
- correct_answer must be one of A, B, C or D.
- Questions must be relevant to {topic.name}.
- Explanations should reinforce learning.
- Avoid trick questions and ambiguous wording.
- Do not provide personalised investment advice.
- Do not claim future market outcomes.
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

        raw_questions = generated.get("questions", [])

        if not isinstance(raw_questions, list):
            raise ValueError("AI returned an invalid questions payload")

        questions: list[KnowledgeQuizQuestion] = []

        for index, item in enumerate(raw_questions[: request.question_count]):
            if not isinstance(item, dict):
                continue

            options = item.get("options", [])
            if not isinstance(options, list) or len(options) != 4:
                continue

            normalized_options = []
            for option in options:
                if not isinstance(option, dict):
                    continue

                key = str(option.get("key", "")).strip().upper()
                option_text = str(option.get("text", "")).strip()

                if key in {"A", "B", "C", "D"} and option_text:
                    normalized_options.append(
                        {
                            "key": key,
                            "text": option_text,
                        }
                    )

            if len(normalized_options) != 4:
                continue

            correct_answer = (
                str(item.get("correct_answer", "")).strip().upper()
            )

            if correct_answer not in {"A", "B", "C", "D"}:
                continue

            questions.append(
                KnowledgeQuizQuestion(
                    id=str(item.get("id") or f"q{index + 1}"),
                    question=str(item.get("question") or "").strip(),
                    options=normalized_options,
                    correct_answer=correct_answer,
                    explanation=str(
                        item.get("explanation")
                        or "Review the lesson concepts and reasoning behind this answer."
                    ).strip(),
                )
            )

        if len(questions) < 3:
            raise ValueError(
                "AI generated fewer than three valid quiz questions"
            )

        questions = questions[: request.question_count]

        return KnowledgeQuizResponse(
            topic=topic,
            title=str(
                generated.get("title")
                or f"{topic.name} ? {request.difficulty.title()} Knowledge Quiz"
            ),
            level=str(generated.get("level") or request.difficulty),
            questions=questions,
            generated_by=f"Groq / {settings.GROQ_MODEL}",
            educational_notice=(
                "This quiz is for financial education only. "
                "It does not constitute personalised investment advice."
            ),
        )

    except Exception as exc:
        logger.exception(
            "Knowledge quiz generation failed for %s: %s",
            topic.slug,
            exc,
        )

        generated = _fallback(
            topic,
            request.difficulty,
            request.question_count,
        )

        return KnowledgeQuizResponse(
            topic=topic,
            **generated,
            educational_notice=(
                "AI quiz generation was temporarily unavailable, so "
                "FinPilot used its educational fallback engine."
            ),
        )
