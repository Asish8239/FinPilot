"""Persistence and secure grading for dynamic Knowledge quizzes."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.knowledge_quiz import KnowledgeQuizQuestion, KnowledgeQuizSession
from app.schemas.knowledge import (
    KnowledgeQuizQuestionResult,
    KnowledgeQuizResultResponse,
    KnowledgeQuizSubmitRequest,
)
from app.services.knowledge_ai_quiz_service import generate_quiz


async def create_quiz(
    db: AsyncSession,
    session_id: str,
    topic_slug: str,
    difficulty: str = "beginner",
    question_count: int = 5,
    focus: str | None = None,
) -> KnowledgeQuizSession:
    from app.schemas.knowledge import KnowledgeQuizRequest

    generated = await generate_quiz(
        KnowledgeQuizRequest(
            topic_slug=topic_slug,
            difficulty=difficulty,
            question_count=question_count,
            focus=focus,
        )
    )

    quiz = KnowledgeQuizSession(
        session_id=session_id,
        topic_slug=generated.topic.slug,
        topic_name=generated.topic.name,
        difficulty=generated.level,
        title=generated.title,
        generated_by=generated.generated_by,
        status="open",
    )

    db.add(quiz)
    await db.flush()

    for position, item in enumerate(generated.questions, start=1):
        option_map = {
            option["key"]: option["text"]
            for option in item.options
            if option.get("key") in {"A", "B", "C", "D"}
        }

        missing_options = [
            key for key in ("A", "B", "C", "D")
            if not option_map.get(key)
        ]

        if missing_options:
            raise ValueError(
                f"Generated quiz question is missing options: "
                f"{', '.join(missing_options)}"
            )

        correct_answer = (item.correct_answer or "A").strip().upper()

        if correct_answer not in {"A", "B", "C", "D"}:
            raise ValueError(
                f"Generated quiz question has invalid correct answer: "
                f"{correct_answer}"
            )

        explanation = (
            item.explanation
            or "Review the lesson concepts for this question."
        )

        question = KnowledgeQuizQuestion(
            quiz_id=quiz.id,
            position=position,
            question=item.question,
            option_a=option_map["A"],
            option_b=option_map["B"],
            option_c=option_map["C"],
            option_d=option_map["D"],
            correct_answer=correct_answer,
            explanation=explanation,
        )
        db.add(question)

    await db.flush()
    await db.refresh(quiz)
    return quiz


async def get_quiz(
    db: AsyncSession,
    quiz_id: uuid.UUID,
    session_id: str,
) -> KnowledgeQuizSession | None:
    result = await db.execute(
        select(KnowledgeQuizSession)
        .where(
            KnowledgeQuizSession.id == quiz_id,
            KnowledgeQuizSession.session_id == session_id,
        )
    )
    return result.scalar_one_or_none()


async def submit_quiz(
    db: AsyncSession,
    request: KnowledgeQuizSubmitRequest,
    session_id: str,
) -> KnowledgeQuizResultResponse:
    try:
        quiz_id = uuid.UUID(request.quiz_id)
    except ValueError as exc:
        raise ValueError("Invalid quiz_id") from exc

    quiz = await get_quiz(db, quiz_id, session_id)

    if quiz is None:
        raise LookupError("Knowledge quiz not found")

    if quiz.status == "completed":
        raise ValueError("This knowledge quiz has already been completed")

    result = await db.execute(
        select(KnowledgeQuizQuestion)
        .where(KnowledgeQuizQuestion.quiz_id == quiz.id)
        .order_by(KnowledgeQuizQuestion.position)
    )
    questions = list(result.scalars().all())

    if not questions:
        raise ValueError("Knowledge quiz contains no questions")

    score = 0.0
    result_items: list[KnowledgeQuizQuestionResult] = []

    valid_ids = {str(question.id) for question in questions}

    for question in questions:
        question_id = str(question.id)
        selected = request.answers.get(question_id)

        if selected is not None:
            selected = selected.strip().upper()

        is_correct = (
            selected in {"A", "B", "C", "D"}
            and selected == question.correct_answer
        )

        question.selected_answer = selected
        question.is_correct = is_correct

        if is_correct:
            score += 1.0

        result_items.append(
            KnowledgeQuizQuestionResult(
                id=question_id,
                question=question.question,
                selected_answer=selected,
                correct_answer=question.correct_answer,
                is_correct=is_correct,
                explanation=question.explanation,
            )
        )

    unknown_ids = set(request.answers.keys()) - valid_ids

    if unknown_ids:
        raise ValueError("Submission contains an unknown question id")

    max_score = float(len(questions))
    percentage = round((score / max_score) * 100.0, 2)
    passed = percentage >= 70.0

    if percentage >= 90:
        feedback = (
            "Excellent work. You have a strong grasp of this topic."
        )
    elif percentage >= 70:
        feedback = (
            "Good work. Review the missed concepts and try another topic."
        )
    elif percentage >= 50:
        feedback = (
            "You have the basics, but a short lesson review would "
            "strengthen your understanding."
        )
    else:
        feedback = (
            "Use the lesson to rebuild the fundamentals, then retake "
            "a fresh quiz."
        )

    quiz.score = score
    quiz.max_score = max_score
    quiz.percentage = percentage
    quiz.passed = passed
    quiz.feedback = feedback
    quiz.status = "completed"
    quiz.completed_at = datetime.now(timezone.utc)

    await db.flush()

    return KnowledgeQuizResultResponse(
        quiz_id=str(quiz.id),
        topic_slug=quiz.topic_slug,
        title=quiz.title,
        score=score,
        max_score=max_score,
        percentage=percentage,
        passed=passed,
        feedback=feedback,
        questions=result_items,
    )
