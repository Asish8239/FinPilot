"""
Quiz schemas.
SECURITY: correct_answer is intentionally absent from QuestionResponse so it is
never sent to the client during an active quiz attempt.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, field_validator, model_validator


class QuestionResponse(BaseModel):
    """Safe question representation — no correct_answer field."""
    id: uuid.UUID
    question_text: str
    question_type: str          # mcq | true_false | fill_blank
    options: list[dict] | None  # [{"key": "A", "text": "..."}]
    difficulty: str
    points: int
    order_index: int
    # NOTE: correct_answer is deliberately excluded here

    model_config = {"from_attributes": True}


class QuizResponse(BaseModel):
    id: uuid.UUID
    lesson_id: uuid.UUID
    title: str
    passing_score: int
    max_attempts: int
    questions: list[QuestionResponse]
    attempts_used: int = 0

    model_config = {"from_attributes": True}


class QuizSubmissionRequest(BaseModel):
    answers: dict[str, str]   # {question_id: answer_value}
    time_taken_sec: int = 0

    @field_validator("answers")
    @classmethod
    def answers_not_empty(cls, v: dict) -> dict:
        if not v:
            raise ValueError("answers must not be empty")
        return v

    @field_validator("time_taken_sec")
    @classmethod
    def non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("time_taken_sec must be >= 0")
        return v


class QuestionFeedback(BaseModel):
    correct: bool
    user_answer: str
    correct_answer: str    # revealed only in the result, not during the quiz
    explanation: str | None
    points_earned: int


class QuizResultResponse(BaseModel):
    attempt_id: uuid.UUID
    score: int
    max_score: int
    percentage: float
    passed: bool
    attempt_number: int
    feedback: dict[str, QuestionFeedback]
    time_taken_sec: int


class QuizAttemptSummary(BaseModel):
    id: uuid.UUID
    score: int
    max_score: int
    percentage: float
    passed: bool
    attempt_number: int
    attempted_at: datetime

    model_config = {"from_attributes": True}
