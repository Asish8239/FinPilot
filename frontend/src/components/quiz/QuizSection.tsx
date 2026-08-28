 "use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  RotateCcw,
  Trophy,
  XCircle,
} from "lucide-react";

import type { Quiz, QuizResult, Question } from "@/types";

type DemoQuestion = Question & {
  correct_answer?: string;
};

interface QuizSectionProps {
  quiz: Quiz;
  onComplete?: (result: QuizResult) => void;
}

export function QuizSection({
  quiz,
  onComplete,
}: QuizSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const questions = useMemo(
    () =>
      [...quiz.questions].sort(
        (a, b) => a.order_index - b.order_index
      ) as DemoQuestion[],
    [quiz.questions]
  );

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (submitted) return;

    const timer = window.setInterval(() => {
      setTimeElapsed((time) => time + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [submitted]);

  useEffect(() => {
    setCurrentIndex(0);
    setAnswers({});
    setSubmitted(false);
    setResult(null);
    setTimeElapsed(0);
  }, [quiz.id]);

  if (!currentQuestion) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-8 text-center">
        <p className="text-sm text-slate-400">
          No questions are available for this quiz.
        </p>
      </div>
    );
  }

  function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60)
      .toString()
      .padStart(2, "0");

    return `${minutes}:${secs}`;
  }

  function normalizeAnswer(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function getCorrectAnswer(question: DemoQuestion) {
    return question.correct_answer?.trim() ?? "";
  }

  function isAnswerCorrect(question: DemoQuestion, answer: string) {
    const correct = getCorrectAnswer(question);

    if (!correct) return false;

    const user = normalizeAnswer(answer);
    const expected = normalizeAnswer(correct);

    if (user === expected) return true;

    // Fill-in-the-blank answers can be entered with
    // slightly different punctuation/spacing.
    if (question.question_type === "fill_blank") {
      return user.replace(/\s+/g, "") === expected.replace(/\s+/g, "");
    }

    return false;
  }

  function selectAnswer(answer: string) {
    if (submitted) return;

    setAnswers((previous) => ({
      ...previous,
      [currentQuestion.id]: answer,
    }));
  }

  function nextQuestion() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((index) => index + 1);
    }
  }

  function previousQuestion() {
    if (currentIndex > 0) {
      setCurrentIndex((index) => index - 1);
    }
  }

  function submitQuiz() {
    const feedback: QuizResult["feedback"] = {};
    let score = 0;

    questions.forEach((question) => {
      const userAnswer = answers[question.id] ?? "";
      const correct = isAnswerCorrect(question, userAnswer);
      const pointsEarned = correct ? question.points : 0;

      if (correct) {
        score += pointsEarned;
      }

      feedback[question.id] = {
        correct,
        user_answer: userAnswer,
        correct_answer: getCorrectAnswer(question),
        explanation: correct
          ? "Your answer matches the expected answer."
          : "Review this concept in the lesson and try again.",
        points_earned: pointsEarned,
      };
    });

    const maxScore = questions.reduce(
      (total, question) => total + question.points,
      0
    );

    const percentage = maxScore
      ? Math.round((score / maxScore) * 100 * 100) / 100
      : 0;

    const passed = percentage >= quiz.passing_score;

    const quizResult: QuizResult = {
      attempt_id: `local-${quiz.id}-${Date.now()}`,
      score,
      max_score: maxScore,
      percentage,
      passed,
      attempt_number: 1,
      feedback,
      time_taken_sec: timeElapsed,
    };

    setResult(quizResult);
    setSubmitted(true);
    onComplete?.(quizResult);
  }

  function restartQuiz() {
    setCurrentIndex(0);
    setAnswers({});
    setSubmitted(false);
    setResult(null);
    setTimeElapsed(0);
  }

  const selectedAnswer = answers[currentQuestion.id] ?? "";
  const answeredCount = questions.filter(
    (question) => (answers[question.id] ?? "").trim()
  ).length;
  const isLast = currentIndex === questions.length - 1;

  if (submitted && result) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
          <div className="flex items-center gap-3">
            <div
              className={`grid h-12 w-12 place-items-center rounded-xl ${
                result.passed
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-amber-500/15 text-amber-400"
              }`}
            >
              {result.passed ? (
                <Trophy className="h-6 w-6" />
              ) : (
                <RotateCcw className="h-6 w-6" />
              )}
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Quiz Result
              </p>
              <h2 className="mt-1 text-xl font-semibold text-white">
                {result.passed
                  ? "Knowledge check passed!"
                  : "Keep learning and try again"}
              </h2>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
              <p className="text-[9px] uppercase tracking-widest text-slate-600">
                Score
              </p>
              <p className="mt-1 text-2xl font-bold text-white">
                {result.score}/{result.max_score}
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
              <p className="text-[9px] uppercase tracking-widest text-slate-600">
                Percentage
              </p>
              <p className="mt-1 text-2xl font-bold text-cyan-300">
                {result.percentage}%
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
              <p className="text-[9px] uppercase tracking-widest text-slate-600">
                Time
              </p>
              <p className="mt-1 text-2xl font-bold text-white">
                {formatTime(result.time_taken_sec)}
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between rounded-xl border border-cyan-500/10 bg-cyan-500/[0.04] px-4 py-3">
            <span className="text-xs text-slate-400">
              Passing score
            </span>
            <span className="font-semibold text-cyan-300">
              {quiz.passing_score}%
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]">
          <div className="border-b border-white/[0.06] px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Answer Review
            </p>
          </div>

          <div className="divide-y divide-white/[0.06]">
            {questions.map((question, index) => {
              const item = result.feedback[question.id];

              return (
                <div key={question.id} className="p-5">
                  <div className="flex gap-3">
                    {item.correct ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                    ) : (
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-300">
                        Question {index + 1}
                      </p>

                      <p className="mt-1 text-sm leading-6 text-white">
                        {question.question_text}
                      </p>

                      <div className="mt-3 rounded-xl border border-white/[0.05] bg-black/20 p-3">
                        <p className="text-[9px] uppercase tracking-widest text-slate-600">
                          Your answer
                        </p>
                        <p className="mt-1 text-sm text-slate-300">
                          {item.user_answer || "Not answered"}
                        </p>
                      </div>

                      {!item.correct && (
                        <div className="mt-2 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.04] p-3">
                          <p className="text-[9px] uppercase tracking-widest text-emerald-500/70">
                            Correct answer
                          </p>
                          <p className="mt-1 text-sm text-emerald-300">
                            {item.correct_answer}
                          </p>
                        </div>
                      )}
                    </div>

                    <span
                      className={
                        item.correct
                          ? "text-xs font-semibold text-emerald-400"
                          : "text-xs font-semibold text-red-400"
                      }
                    >
                      +{item.points_earned} pts
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={restartQuiz}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:border-cyan-400/30 hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
            Retake Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Question {currentIndex + 1} of {questions.length}
          </span>

          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            {formatTime(timeElapsed)}
          </span>
        </div>

        <div className="mt-3 flex gap-1.5">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className={`h-1 flex-1 rounded-full transition ${
                index < currentIndex
                  ? "bg-cyan-400"
                  : index === currentIndex
                    ? "bg-cyan-300"
                    : "bg-slate-800"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-cyan-300/70">
              Question {currentIndex + 1}
            </p>

            <h2 className="mt-3 text-lg font-semibold leading-7 text-white">
              {currentQuestion.question_text}
            </h2>
          </div>

          <span className="shrink-0 rounded-full border border-white/[0.07] px-2 py-1 text-[9px] uppercase tracking-wider text-slate-600">
            {currentQuestion.difficulty}
          </span>
        </div>

        {currentQuestion.question_type === "mcq" &&
          currentQuestion.options && (
            <div className="mt-6 space-y-2.5">
              {currentQuestion.options.map((option) => {
                const selected = selectedAnswer === option.key;

                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => selectAnswer(option.key)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${
                      selected
                        ? "border-cyan-400/50 bg-cyan-400/[0.08] text-white"
                        : "border-white/[0.07] bg-black/10 text-slate-300 hover:border-white/[0.14] hover:bg-white/[0.03]"
                    }`}
                  >
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border text-xs font-semibold ${
                        selected
                          ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-300"
                          : "border-white/[0.08] bg-white/[0.02] text-slate-500"
                      }`}
                    >
                      {option.key}
                    </span>

                    <span className="text-sm leading-6">
                      {option.text}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

        {currentQuestion.question_type === "true_false" && (
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              { key: "true", label: "True" },
              { key: "false", label: "False" },
            ].map((option) => {
              const selected = selectedAnswer === option.key;

              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => selectAnswer(option.key)}
                  className={`rounded-xl border p-5 text-sm font-semibold transition ${
                    selected
                      ? "border-cyan-400/50 bg-cyan-400/[0.08] text-cyan-300"
                      : "border-white/[0.07] bg-black/10 text-slate-300 hover:border-white/[0.14]"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        )}

        {currentQuestion.question_type === "fill_blank" && (
          <div className="mt-6">
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              Type your answer
            </label>

            <input
              type="text"
              value={selectedAnswer}
              onChange={(event) => selectAnswer(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !isLast &&
                  selectedAnswer.trim()
                ) {
                  nextQuestion();
                }
              }}
              placeholder="Type your answer here..."
              className="w-full rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-700 transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
            />

            <p className="mt-2 text-[10px] text-slate-600">
              Type your answer in your own words and continue.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={previousQuestion}
          disabled={currentIndex === 0}
          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.07] px-4 py-2.5 text-xs font-semibold text-slate-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        <span className="text-[10px] text-slate-600">
          {answeredCount}/{questions.length} answered
        </span>

        {!isLast ? (
          <button
            type="button"
            onClick={nextQuestion}
            disabled={!selectedAnswer.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={submitQuiz}
            disabled={answeredCount !== questions.length}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <CheckCircle2 className="h-4 w-4" />
            Submit Quiz
          </button>
        )}
      </div>
    </div>
  );
}
