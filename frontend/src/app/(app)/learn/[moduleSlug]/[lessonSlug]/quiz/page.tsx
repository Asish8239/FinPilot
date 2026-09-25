"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  ClipboardCheck,
  ShieldCheck,
} from "lucide-react";

import { QuizSection } from "@/components/quiz/QuizSection";
import { getDemoQuiz } from "@/lib/demo-quizzes";
import { demoModules } from "@/lib/demo-data";

import type { ModuleSummary } from "@/types";

export default function LessonQuizPage() {
  const params = useParams<{
    moduleSlug: string;
    lessonSlug: string;
  }>();

  const moduleSlug = params.moduleSlug;
  const lessonSlug = params.lessonSlug;

  const learningModule = (
    demoModules as ModuleSummary[]
  ).find(
    (item) => item.slug === moduleSlug
  );

  const lesson = learningModule?.lessons?.find(
    (item) => item.slug === lessonSlug
  );

  const quiz = getDemoQuiz(lessonSlug);

  /* ============================================================
     QUIZ NOT AVAILABLE
  ============================================================ */

  if (!quiz) {
    return (
      <div className="min-h-full bg-[#05090d] text-slate-100">
        <div className="mx-auto flex min-h-[75vh] max-w-3xl items-center justify-center px-5 py-10">
          <div className="w-full overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0a1015] shadow-2xl shadow-black/20">
            <div className="h-1 bg-gradient-to-r from-cyan-400 via-cyan-300 to-emerald-400" />

            <div className="p-8 text-center sm:p-12">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.07]">
                <ClipboardCheck className="h-7 w-7 text-cyan-300" />
              </div>

              <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">
                Knowledge Check
              </p>

              <h1 className="mt-3 text-2xl font-bold tracking-tight text-white">
                Quiz coming soon
              </h1>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                This lesson does not have a knowledge check yet.
                You can continue reading the lesson or explore
                other topics in the FinPilot learning library.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href={`/learn/${moduleSlug}/${lessonSlug}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Lesson
                </Link>

                <Link
                  href="/learn"
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.08] px-4 py-2.5 text-sm font-bold text-cyan-300 transition hover:bg-cyan-400/[0.13]"
                >
                  <BookOpen className="h-4 w-4" />
                  Learning Library
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#05090d] text-slate-100">
      {/* ========================================================
          TOP BAR
      ======================================================== */}

      <div className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#05090d]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href={`/learn/${moduleSlug}/${lessonSlug}`}
            className="group inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-cyan-300"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />

            <span className="hidden sm:inline">
              Back to Lesson
            </span>

            <span className="sm:hidden">
              Lesson
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-cyan-300" />

            <span className="text-xs font-semibold text-slate-500">
              Knowledge Check
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================
          PAGE
      ======================================================== */}

      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-0 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-400/[0.025] blur-3xl" />

        {/* ======================================================
            BREADCRUMB
        ====================================================== */}

        <div className="relative z-10 mb-7 flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <Link
            href="/learn"
            className="transition hover:text-cyan-300"
          >
            Learning Library
          </Link>

          <span>/</span>

          <Link
            href={`/learn/${moduleSlug}`}
            className="max-w-[220px] truncate transition hover:text-cyan-300"
          >
            {learningModule?.title ?? "Course"}
          </Link>

          <span>/</span>

          <Link
            href={`/learn/${moduleSlug}/${lessonSlug}`}
            className="max-w-[220px] truncate transition hover:text-cyan-300"
          >
            {lesson?.title ?? "Lesson"}
          </Link>

          <span>/</span>

          <span className="font-medium text-slate-400">
            Knowledge Check
          </span>
        </div>

        {/* ======================================================
            HEADER
        ====================================================== */}

        <header className="relative z-10 overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0a1015] shadow-2xl shadow-black/20">
          <div className="h-1 bg-gradient-to-r from-cyan-400 via-cyan-300 to-emerald-400" />

          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">
                <ClipboardCheck className="h-3.5 w-3.5" />
                Knowledge Check
              </div>

              <div className="mt-5 flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/[0.07]">
                  <Brain className="h-5 w-5 text-cyan-300" />
                </div>

                <div className="min-w-0">
                  <h1 className="text-3xl font-bold tracking-[-0.03em] text-white sm:text-4xl">
                    {quiz.title}
                  </h1>

                  {lesson?.title && (
                    <p className="mt-2 text-sm text-slate-500">
                      Based on{" "}
                      <span className="font-semibold text-slate-300">
                        {lesson.title}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <p className="mt-6 max-w-2xl text-sm leading-6 text-slate-500">
                Test your understanding of the concepts covered
                in this lesson. Take your time and think through
                each question carefully.
              </p>
            </div>

            {/* ==================================================
                QUIZ META
            ================================================== */}

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <QuizMeta
                label="Questions"
                value={String(quiz.questions.length)}
              />

              <QuizMeta
                label="Pass Mark"
                value={`${quiz.passing_score}%`}
              />

              <QuizMeta
                label="Attempts Remaining"
                value={`${Math.max(
                  0,
                  quiz.max_attempts -
                    quiz.attempts_used
                )}`}
                className="col-span-2 sm:col-span-1"
              />
            </div>
          </div>
        </header>

        {/* ======================================================
            QUIZ CONTENT
        ====================================================== */}

        <main className="relative z-10 mt-7">
          <div className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0a1015] shadow-2xl shadow-black/20">
            <div className="border-b border-white/[0.06] px-6 py-5 sm:px-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03]">
                  <ClipboardCheck className="h-4 w-4 text-cyan-300" />
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-200">
                    Assessment
                  </p>

                  <p className="mt-0.5 text-[11px] text-slate-600">
                    Answer each question to the best of your understanding.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-8">
              <QuizSection
                quiz={quiz}
                onComplete={() => {
                  /*
                   * QuizSection manages the result state.
                   * The learner remains on this page so the
                   * result and answers can be reviewed.
                   */
                }}
              />
            </div>
          </div>
        </main>

        {/* ======================================================
            EDUCATIONAL NOTICE
        ====================================================== */}

        <div className="relative z-10 mt-5 rounded-2xl border border-white/[0.07] bg-[#0a1015] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03]">
              <ShieldCheck className="h-4 w-4 text-slate-500" />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-300">
                Educational assessment
              </p>

              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                This quiz is intended to help you understand
                financial concepts. Your score is a learning
                indicator and does not constitute investment
                advice or a recommendation to buy or sell any
                financial product.
              </p>
            </div>
          </div>
        </div>

        {/* ======================================================
            NAVIGATION
        ====================================================== */}

        <div className="relative z-10 mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            href={`/learn/${moduleSlug}/${lessonSlug}`}
            className="group rounded-2xl border border-white/[0.07] bg-[#0a1015] p-5 transition hover:border-white/[0.13] hover:bg-white/[0.025]"
          >
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
              Review Lesson
            </div>

            <p className="mt-2 text-sm font-bold text-slate-400 group-hover:text-slate-200">
              Go back and review the material
            </p>
          </Link>

          <Link
            href={`/learn/${moduleSlug}`}
            className="group rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.035] p-5 text-right transition hover:border-cyan-400/25 hover:bg-cyan-400/[0.055]"
          >
            <div className="flex items-center justify-end gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-400">
              Course Lessons

              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>

            <p className="mt-2 text-sm font-bold text-slate-300 group-hover:text-white">
              Continue through the course
            </p>
          </Link>
        </div>

        {/* ======================================================
            FOOTER
        ====================================================== */}

        <footer className="relative z-10 flex items-center gap-2 border-t border-white/[0.06] py-8">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700">
            FinPilot Learning Library
          </span>
        </footer>
      </div>
    </div>
  );
}

/* ============================================================
   QUIZ META CARD
============================================================ */

function QuizMeta({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 ${className}`}
    >
      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">
        {label}
      </p>

      <p className="mt-1.5 text-sm font-bold text-slate-200">
        {value}
      </p>
    </div>
  );
}