"""
Quiz service — retrieval, grading, attempt enforcement, feedback.

Security:
  - correct_answer is never returned to the client during an active attempt.
  - Question ownership is validated before grading (answers must belong to quiz).
  - Attempt limits are enforced before any grading takes place.
"""
from __future__ import annotations

import logging
import re
import uuid

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError, RateLimitError, ValidationError
from app.models.quiz import Question, Quiz, UserQuizAttempt
from app.schemas.quiz import QuestionFeedback, QuizAttemptSummary, QuizResultResponse

logger = logging.getLogger(__name__)


def _normalize(s: str) -> str:
    """Strip non-alphanumeric characters and lowercase for fill-blank comparison."""
    return re.sub(r"[^a-z0-9]", "", s.lower())


# ── Pure grading logic (testable without DB) ───────────────────────────────────

def grade_quiz(
    questions: list[Question],
    answers: dict[str, str],
) -> dict:
    """
    Grade a quiz submission.

    Returns {"score": int, "max_score": int, "feedback": dict[str, QuestionFeedback]}

    Preconditions:
      - All question IDs are unique.
      - answers keys are a subset of question IDs (extras are silently ignored).
      - Each question has points > 0.

    Postconditions:
      - 0 <= score <= max_score
      - feedback has an entry for every question
    """
    score = 0
    max_score = sum(q.points for q in questions)
    feedback: dict[str, QuestionFeedback] = {}

    for q in questions:
        qid = str(q.id)
        raw_answer = answers.get(qid, "")
        user_ans = raw_answer.strip().lower()
        correct = q.correct_answer.strip().lower()

        if q.question_type in ("mcq", "true_false"):
            is_correct = user_ans == correct
        else:  # fill_blank
            is_correct = _normalize(user_ans) == _normalize(correct)

        if is_correct:
            score += q.points

        feedback[qid] = QuestionFeedback(
            correct=is_correct,
            user_answer=raw_answer,
            correct_answer=q.correct_answer,   # revealed only in the result payload
            explanation=q.explanation,
            points_earned=q.points if is_correct else 0,
        )

    return {"score": score, "max_score": max_score, "feedback": feedback}


# ── DB-backed operations ───────────────────────────────────────────────────────

async def get_quiz(
    db: AsyncSession,
    quiz_id: uuid.UUID,
    user_id: uuid.UUID,
) -> tuple[Quiz, int]:
    """
    Return the quiz and how many attempts the user has already used.
    Questions are loaded but correct_answer is NOT sent to the client —
    that stripping happens in the route schema (QuestionResponse excludes the field).
    """
    quiz = await db.scalar(
        select(Quiz)
        .where(Quiz.id == quiz_id)
        .options(selectinload(Quiz.questions))
    )
    if not quiz:
        raise NotFoundError("Quiz")

    attempts_used: int = await db.scalar(
        select(func.count(UserQuizAttempt.id)).where(
            UserQuizAttempt.user_id == user_id,
            UserQuizAttempt.quiz_id == quiz_id,
        )
    ) or 0

    return quiz, attempts_used


async def submit_quiz(
    db: AsyncSession,
    quiz_id: uuid.UUID,
    user_id: uuid.UUID,
    answers: dict[str, str],
    time_taken_sec: int,
) -> QuizResultResponse:
    """
    Validate, grade and persist a quiz submission.

    Security checks (in order):
      1. Quiz exists.
      2. Attempt limit not exceeded.
      3. Every submitted answer key belongs to this quiz (ownership validation).
    """
    quiz = await db.scalar(
        select(Quiz)
        .where(Quiz.id == quiz_id)
        .options(selectinload(Quiz.questions))
    )
    if not quiz:
        raise NotFoundError("Quiz")

    # ── Attempt limit ──────────────────────────────────────────────────────────
    attempts_used: int = await db.scalar(
        select(func.count(UserQuizAttempt.id)).where(
            UserQuizAttempt.user_id == user_id,
            UserQuizAttempt.quiz_id == quiz_id,
        )
    ) or 0

    if attempts_used >= quiz.max_attempts:
        raise RateLimitError(
            f"Maximum {quiz.max_attempts} attempt(s) reached for this quiz"
        )

    # ── Question ownership validation ──────────────────────────────────────────
    valid_question_ids = {str(q.id) for q in quiz.questions}
    invalid_keys = set(answers.keys()) - valid_question_ids
    if invalid_keys:
        raise ValidationError(
            f"Answer keys do not belong to this quiz: {invalid_keys}"
        )

    questions = sorted(quiz.questions, key=lambda q: q.order_index)

    # ── Grade ──────────────────────────────────────────────────────────────────
    graded = grade_quiz(questions, answers)
    percentage = (
        round(graded["score"] / graded["max_score"] * 100, 2)
        if graded["max_score"] else 0.0
    )
    passed = percentage >= quiz.passing_score

    attempt = UserQuizAttempt(
        user_id=user_id,
        quiz_id=quiz_id,
        score=graded["score"],
        max_score=graded["max_score"],
        percentage=percentage,
        passed=passed,
        answers=answers,
        feedback={k: v.model_dump() for k, v in graded["feedback"].items()},
        time_taken_sec=max(0, time_taken_sec),
        attempt_number=attempts_used + 1,
    )
    db.add(attempt)
    await db.flush()

    logger.info(
        "Quiz %s submitted by user %s — %.1f%% (%s) attempt #%d",
        quiz_id, user_id, percentage, "PASS" if passed else "FAIL",
        attempts_used + 1,
    )

    return QuizResultResponse(
        attempt_id=attempt.id,
        score=graded["score"],
        max_score=graded["max_score"],
        percentage=percentage,
        passed=passed,
        attempt_number=attempts_used + 1,
        feedback=graded["feedback"],
        time_taken_sec=time_taken_sec,
    )


async def get_attempts(
    db: AsyncSession,
    quiz_id: uuid.UUID,
    user_id: uuid.UUID,
) -> list[QuizAttemptSummary]:
    result = await db.execute(
        select(UserQuizAttempt)
        .where(
            UserQuizAttempt.user_id == user_id,
            UserQuizAttempt.quiz_id == quiz_id,
        )
        .order_by(UserQuizAttempt.attempted_at.desc())
    )
    return [QuizAttemptSummary.model_validate(a) for a in result.scalars()]
