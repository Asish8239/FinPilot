"""Quiz routes — retrieve quizzes, submit answers, view attempt history. Anonymous."""
from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.anonymous import get_anonymous_id
from app.schemas.quiz import (
    QuestionResponse,
    QuizAttemptSummary,
    QuizResponse,
    QuizResultResponse,
    QuizSubmissionRequest,
)
from app.services import quiz_service

router = APIRouter()


@router.get(
    "/{quiz_id}",
    response_model=QuizResponse,
    summary="Get a quiz (questions without correct answers)",
)
async def get_quiz(
    quiz_id: uuid.UUID,
    session_id: Annotated[uuid.UUID, Depends(get_anonymous_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> QuizResponse:
    quiz, attempts_used = await quiz_service.get_quiz(db, quiz_id, session_id)
    return QuizResponse(
        id=quiz.id,
        lesson_id=quiz.lesson_id,
        title=quiz.title,
        passing_score=quiz.passing_score,
        max_attempts=quiz.max_attempts,
        questions=[QuestionResponse.model_validate(q) for q in quiz.questions],
        attempts_used=attempts_used,
    )


@router.post(
    "/{quiz_id}/submit",
    response_model=QuizResultResponse,
    summary="Submit quiz answers",
)
async def submit_quiz(
    quiz_id: uuid.UUID,
    body: QuizSubmissionRequest,
    session_id: Annotated[uuid.UUID, Depends(get_anonymous_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> QuizResultResponse:
    return await quiz_service.submit_quiz(
        db, quiz_id, session_id, body.answers, body.time_taken_sec
    )


@router.get(
    "/{quiz_id}/attempts",
    response_model=list[QuizAttemptSummary],
    summary="List attempts for a quiz in this session",
)
async def get_attempts(
    quiz_id: uuid.UUID,
    session_id: Annotated[uuid.UUID, Depends(get_anonymous_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[QuizAttemptSummary]:
    return await quiz_service.get_attempts(db, quiz_id, session_id)
