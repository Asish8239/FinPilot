"""
Unit tests for quiz grading logic — pure functions, no DB.
"""
from __future__ import annotations

import uuid
from unittest.mock import MagicMock

import pytest

from app.services.quiz_service import grade_quiz, _normalize


def _make_question(qtype: str, correct: str, points: int = 10) -> MagicMock:
    q = MagicMock()
    q.id = uuid.uuid4()
    q.question_type = qtype
    q.correct_answer = correct
    q.explanation = "Explanation text."
    q.points = points
    return q


class TestNormalize:
    def test_strips_punctuation(self):
        assert _normalize("New Delhi!") == "newdelhi"

    def test_lowercases(self):
        assert _normalize("INDIA") == "india"

    def test_strips_spaces(self):
        assert _normalize("New   Delhi") == "newdelhi"

    def test_keeps_numbers(self):
        assert _normalize("Answer42") == "answer42"


class TestGradeQuiz:

    def test_all_correct_mcq(self):
        q = _make_question("mcq", "B")
        answers = {str(q.id): "B"}
        result = grade_quiz([q], answers)
        assert result["score"] == 10
        assert result["max_score"] == 10
        assert result["feedback"][str(q.id)].correct is True

    def test_wrong_mcq(self):
        q = _make_question("mcq", "B")
        answers = {str(q.id): "A"}
        result = grade_quiz([q], answers)
        assert result["score"] == 0
        assert result["feedback"][str(q.id)].correct is False
        assert result["feedback"][str(q.id)].points_earned == 0

    def test_true_false_correct(self):
        q = _make_question("true_false", "true")
        answers = {str(q.id): "true"}
        result = grade_quiz([q], answers)
        assert result["score"] == 10

    def test_true_false_wrong(self):
        q = _make_question("true_false", "true")
        answers = {str(q.id): "false"}
        result = grade_quiz([q], answers)
        assert result["score"] == 0

    def test_fill_blank_exact_match(self):
        q = _make_question("fill_blank", "New Delhi")
        answers = {str(q.id): "New Delhi"}
        result = grade_quiz([q], answers)
        assert result["score"] == 10

    def test_fill_blank_case_insensitive(self):
        q = _make_question("fill_blank", "New Delhi")
        answers = {str(q.id): "new delhi"}
        result = grade_quiz([q], answers)
        assert result["score"] == 10

    def test_fill_blank_punctuation_stripped(self):
        q = _make_question("fill_blank", "New Delhi")
        answers = {str(q.id): "New Delhi!"}
        result = grade_quiz([q], answers)
        assert result["score"] == 10

    def test_fill_blank_wrong(self):
        q = _make_question("fill_blank", "New Delhi")
        answers = {str(q.id): "Mumbai"}
        result = grade_quiz([q], answers)
        assert result["score"] == 0

    def test_missing_answer_treated_as_wrong(self):
        q = _make_question("mcq", "A")
        result = grade_quiz([q], {})   # no answer provided
        assert result["score"] == 0
        assert result["feedback"][str(q.id)].correct is False

    def test_multiple_questions_partial_score(self):
        q1 = _make_question("mcq", "A", points=10)
        q2 = _make_question("mcq", "B", points=20)
        q3 = _make_question("true_false", "false", points=10)

        answers = {str(q1.id): "A", str(q2.id): "C", str(q3.id): "false"}
        result = grade_quiz([q1, q2, q3], answers)

        assert result["score"] == 20   # q1 + q3
        assert result["max_score"] == 40
        assert result["feedback"][str(q1.id)].correct is True
        assert result["feedback"][str(q2.id)].correct is False
        assert result["feedback"][str(q3.id)].correct is True

    def test_score_bounds(self):
        questions = [_make_question("mcq", "A") for _ in range(5)]
        answers = {str(q.id): "A" for q in questions}
        result = grade_quiz(questions, answers)
        assert 0 <= result["score"] <= result["max_score"]

    def test_feedback_has_entry_for_every_question(self):
        questions = [_make_question("mcq", "A") for _ in range(4)]
        answers = {}
        result = grade_quiz(questions, answers)
        assert len(result["feedback"]) == 4

    def test_correct_answer_revealed_in_feedback(self):
        q = _make_question("mcq", "B")
        result = grade_quiz([q], {str(q.id): "A"})
        assert result["feedback"][str(q.id)].correct_answer == "B"
