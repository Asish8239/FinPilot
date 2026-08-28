"""
Integration tests for quiz service — attempt limits, ownership validation,
grading persistence, and pass/fail logic.
"""
from __future__ import annotations

import uuid

import pytest

from app.services import quiz_service
from app.core.exceptions import NotFoundError, RateLimitError, ValidationError


class TestGetQuiz:

    async def test_get_quiz_returns_quiz_and_attempts(self, db, student_user, quiz_with_questions):
        quiz, _qs = quiz_with_questions
        fetched_quiz, attempts_used = await quiz_service.get_quiz(db, quiz.id, student_user.id)
        assert fetched_quiz.id == quiz.id
        assert attempts_used == 0

    async def test_get_quiz_raises_not_found(self, db, student_user):
        with pytest.raises(NotFoundError):
            await quiz_service.get_quiz(db, uuid.uuid4(), student_user.id)

    async def test_questions_loaded(self, db, student_user, quiz_with_questions):
        quiz, questions = quiz_with_questions
        fetched_quiz, _ = await quiz_service.get_quiz(db, quiz.id, student_user.id)
        assert len(fetched_quiz.questions) == len(questions)


class TestSubmitQuiz:

    async def test_all_correct_submission(self, db, student_user, quiz_with_questions):
        quiz, questions = quiz_with_questions
        answers = {
            str(questions[0].id): "B",         # mcq correct
            str(questions[1].id): "true",      # true_false correct
            str(questions[2].id): "New Delhi", # fill_blank correct
        }
        result = await quiz_service.submit_quiz(db, quiz.id, student_user.id, answers, 60)
        assert result.score == 30   # 10 + 10 + 10
        assert result.max_score == 30
        assert result.percentage == 100.0
        assert result.passed is True

    async def test_all_wrong_submission(self, db, student_user, quiz_with_questions):
        quiz, questions = quiz_with_questions
        answers = {
            str(questions[0].id): "A",       # wrong
            str(questions[1].id): "false",   # wrong
            str(questions[2].id): "Mumbai",  # wrong
        }
        result = await quiz_service.submit_quiz(db, quiz.id, student_user.id, answers, 30)
        assert result.score == 0
        assert result.passed is False

    async def test_partial_score_below_passing(self, db, student_user, quiz_with_questions):
        quiz, questions = quiz_with_questions
        # Pass threshold is 70% = 21/30 points. Only 1 correct = 33%
        answers = {
            str(questions[0].id): "B",       # correct
            str(questions[1].id): "false",   # wrong
            str(questions[2].id): "Mumbai",  # wrong
        }
        result = await quiz_service.submit_quiz(db, quiz.id, student_user.id, answers, 45)
        assert result.passed is False
        assert result.percentage == pytest.approx(33.33, abs=0.1)

    async def test_attempt_number_increments(self, db, student_user, quiz_with_questions):
        quiz, questions = quiz_with_questions
        answers = {str(q.id): "X" for q in questions}

        r1 = await quiz_service.submit_quiz(db, quiz.id, student_user.id, answers, 10)
        r2 = await quiz_service.submit_quiz(db, quiz.id, student_user.id, answers, 10)

        assert r1.attempt_number == 1
        assert r2.attempt_number == 2

    async def test_attempt_limit_enforced(self, db, student_user, quiz_with_questions):
        quiz, questions = quiz_with_questions
        answers = {str(q.id): "X" for q in questions}

        # Exhaust max_attempts (3)
        for _ in range(3):
            try:
                await quiz_service.submit_quiz(db, quiz.id, student_user.id, answers, 5)
            except RateLimitError:
                pass

        with pytest.raises(RateLimitError):
            await quiz_service.submit_quiz(db, quiz.id, student_user.id, answers, 5)

    async def test_invalid_question_key_raises_validation_error(self, db, student_user, quiz_with_questions):
        quiz, questions = quiz_with_questions
        bad_answers = {str(uuid.uuid4()): "A"}  # random UUID not in quiz
        with pytest.raises(ValidationError):
            await quiz_service.submit_quiz(db, quiz.id, student_user.id, bad_answers, 0)

    async def test_feedback_has_entry_for_every_question(self, db, student_user, quiz_with_questions):
        quiz, questions = quiz_with_questions
        answers = {str(q.id): "X" for q in questions}
        result = await quiz_service.submit_quiz(db, quiz.id, student_user.id, answers, 0)
        assert len(result.feedback) == len(questions)

    async def test_correct_answers_revealed_in_feedback(self, db, student_user, quiz_with_questions):
        quiz, questions = quiz_with_questions
        answers = {str(q.id): "X" for q in questions}
        result = await quiz_service.submit_quiz(db, quiz.id, student_user.id, answers, 0)
        # correct_answer should be in feedback (revealed after submission)
        assert result.feedback[str(questions[0].id)].correct_answer == "B"


class TestGetAttempts:

    async def test_returns_empty_before_any_attempts(self, db, student_user, quiz_with_questions):
        quiz, _ = quiz_with_questions
        attempts = await quiz_service.get_attempts(db, quiz.id, student_user.id)
        assert attempts == []

    async def test_returns_attempts_after_submission(self, db, student_user, quiz_with_questions):
        quiz, questions = quiz_with_questions
        answers = {str(q.id): "X" for q in questions}
        await quiz_service.submit_quiz(db, quiz.id, student_user.id, answers, 10)
        attempts = await quiz_service.get_attempts(db, quiz.id, student_user.id)
        assert len(attempts) == 1

    async def test_attempts_isolated_per_user(self, db, student_user, admin_user, quiz_with_questions):
        quiz, questions = quiz_with_questions
        answers = {str(q.id): "X" for q in questions}
        await quiz_service.submit_quiz(db, quiz.id, student_user.id, answers, 0)

        admin_attempts = await quiz_service.get_attempts(db, quiz.id, admin_user.id)
        assert len(admin_attempts) == 0
