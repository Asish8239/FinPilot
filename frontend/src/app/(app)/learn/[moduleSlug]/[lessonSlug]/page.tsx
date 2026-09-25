"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  Clock,
  Play,
} from "lucide-react";

import {
  useLesson,
  useCompleteLesson,
  useModule,
} from "@/hooks/useApi";

import { getDemoLessonContent } from "@/lib/demo-curriculum";
import { demoModules } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

import type {
  LessonDetail,
  ModuleSummary,
} from "@/types";

export default function LessonPage() {
  const params = useParams<{
    moduleSlug: string;
    lessonSlug: string;
  }>();

  const moduleSlug = params.moduleSlug;
  const lessonSlug = params.lessonSlug;

  const lessonQuery = useLesson(
    moduleSlug,
    lessonSlug
  ) as {
    data?: LessonDetail;
    isLoading: boolean;
    error?: unknown;
  };

  const moduleQuery = useModule(
    moduleSlug
  ) as {
    data?: ModuleSummary;
    isLoading: boolean;
  };

  const completeMutation = useCompleteLesson();

  const demoModule = (
    demoModules as ModuleSummary[]
  ).find(
    (item) => item.slug === moduleSlug
  );

  const learningModule =
    moduleQuery.data ??
    demoModule;

  const demoLesson = learningModule?.lessons?.find(
    (item) => item.slug === lessonSlug
  );

  const lesson =
    lessonQuery.data ??
    (demoLesson as LessonDetail | undefined);

  const [marked, setMarked] = useState(false);

  const startRef = useRef(Date.now());

  useEffect(() => {
    if (lesson?.completed) {
      setMarked(true);
    }
  }, [lesson]);

  async function handleComplete() {
    if (!lesson || marked) return;

    const elapsed = Math.round(
      (Date.now() - startRef.current) / 1000
    );

    try {
      await completeMutation.mutateAsync({
        moduleSlug,
        lessonSlug,
        time: elapsed,
      });

      setMarked(true);
    } catch {
      setMarked(true);
    }
  }

  if (
    lessonQuery.isLoading &&
    !lesson
  ) {
    return <LessonSkeleton />;
  }

  /* ============================================================
     NOT FOUND
  ============================================================ */

  if (!lesson) {
    return (
      <div className="min-h-full bg-[#05090d] text-slate-100">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-5 py-10">
          <div className="w-full overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0a1015] shadow-2xl shadow-black/20">
            <div className="h-1 bg-gradient-to-r from-cyan-400 via-cyan-300 to-emerald-400" />

            <div className="p-8 text-center sm:p-12">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.07]">
                <BookOpen className="h-6 w-6 text-cyan-300" />
              </div>

              <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">
                Learning Library
              </p>

              <h1 className="mt-3 text-2xl font-bold text-white">
                Lesson not found
              </h1>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                We couldn&apos;t find this lesson in the current
                FinPilot learning library.
              </p>

              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link
                  href={`/learn/${moduleSlug}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Course
                </Link>

                <Link
                  href="/learn"
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.08] px-4 py-2.5 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/[0.13]"
                >
                  Browse Library
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const lessons = learningModule?.lessons ?? [];

  const currentIndex = lessons.findIndex(
    (item) => item.slug === lessonSlug
  );

  const prevLesson =
    currentIndex > 0
      ? lessons[currentIndex - 1]
      : undefined;

  const nextLesson =
    currentIndex >= 0 &&
    currentIndex < lessons.length - 1
      ? lessons[currentIndex + 1]
      : undefined;

  const demoContent =
    getDemoLessonContent(
      moduleSlug,
      lessonSlug
    );

  const content =
    lesson.content_markdown ||
    demoContent ||
    `
# ${lesson.title}

This lesson is part of the FinPilot financial learning library.

The lesson content is currently being prepared. You can continue exploring the available courses while the complete material is loaded.
`;

  const progress =
    lessons.length > 0 && currentIndex >= 0
      ? ((currentIndex + 1) / lessons.length) * 100
      : 0;

  return (
    <div className="min-h-full bg-[#05090d] text-slate-100">

      {/* =====================================================
          TOP READING BAR
      ===================================================== */}

      <div className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#05090d]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">

          <Link
            href={`/learn/${moduleSlug}`}
            className="group inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-cyan-300"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />

            <span className="hidden sm:inline">
              Back to Course
            </span>

            <span className="sm:hidden">
              Course
            </span>
          </Link>

          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-white/[0.07] sm:block md:w-40">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-[0_0_10px_rgba(34,211,238,0.3)] transition-all duration-500"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

            <span className="whitespace-nowrap text-[11px] font-semibold text-slate-600">
              {currentIndex >= 0
                ? `${currentIndex + 1} / ${lessons.length}`
                : "Lesson"}
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================
          PAGE
      ===================================================== */}

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        <div className="pointer-events-none absolute left-1/2 top-0 -z-0 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-400/[0.025] blur-3xl" />

        {/* ===================================================
            BREADCRUMB
        =================================================== */}

        <div className="relative z-10 mb-8 flex flex-wrap items-center gap-2 text-xs text-slate-600">

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

          <span className="max-w-[240px] truncate font-medium text-slate-400">
            {lesson.title}
          </span>
        </div>

        {/* ===================================================
            LESSON HEADER
        =================================================== */}

        <header className="relative z-10 overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0a1015] shadow-2xl shadow-black/20">

          <div className="h-1 bg-gradient-to-r from-cyan-400 via-cyan-300 to-emerald-400" />

          <div className="px-6 py-8 sm:px-10 sm:py-10 lg:px-12">

            <div className="max-w-4xl">

              <div className="flex flex-wrap items-center gap-3">

                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-cyan-300">
                  <BookOpen className="h-3.5 w-3.5" />
                  Lesson
                </span>

                {lesson.estimated_minutes && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    <Clock className="h-3.5 w-3.5" />
                    {lesson.estimated_minutes} min read
                  </span>
                )}

                {marked && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Completed
                  </span>
                )}
              </div>

              {learningModule?.title && (
                <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-400/60">
                  {learningModule.title}
                </p>
              )}

              <h1 className="mt-3 max-w-4xl text-4xl font-bold leading-[1.1] tracking-[-0.035em] text-white sm:text-5xl lg:text-[52px]">
                {lesson.title}
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-500">
                Read through the lesson carefully and build
                your understanding one financial concept at a
                time.
              </p>

              {lessons.length > 0 && (
                <div className="mt-8 max-w-xl">

                  <div className="mb-2 flex items-center justify-between">

                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
                      Course Progress
                    </span>

                    <span className="text-xs font-semibold text-slate-500">
                      {Math.round(progress)}%
                    </span>

                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-[0_0_12px_rgba(34,211,238,0.25)] transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ===================================================
            READING AREA
        =================================================== */}

        <main className="relative z-10 mt-8">

          <article className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0a1015] shadow-2xl shadow-black/20">

            {/* Reading header */}

            <div className="border-b border-white/[0.06] px-6 py-5 sm:px-10">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/[0.07]">
                  <BookOpen className="h-4 w-4 text-cyan-300" />
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-200">
                    Reading Material
                  </p>

                  <p className="mt-0.5 text-[11px] text-slate-600">
                    Learn at your own pace
                  </p>
                </div>
              </div>
            </div>

            {/* Article */}

            <div className="px-6 py-9 sm:px-10 sm:py-12 lg:px-16 lg:py-14">

              <div
                className="
                  mx-auto
                  max-w-4xl
                  prose
                  prose-invert
                  max-w-none

                  prose-headings:font-bold
                  prose-headings:tracking-[-0.025em]
                  prose-headings:text-white

                  prose-h1:mb-7
                  prose-h1:text-3xl
                  prose-h1:leading-tight

                  prose-h2:mt-14
                  prose-h2:mb-5
                  prose-h2:border-b
                  prose-h2:border-white/[0.07]
                  prose-h2:pb-3
                  prose-h2:text-2xl

                  prose-h3:mt-10
                  prose-h3:mb-3
                  prose-h3:text-lg
                  prose-h3:text-slate-200

                  prose-p:text-[15px]
                  prose-p:leading-8
                  prose-p:text-slate-400

                  prose-li:text-[15px]
                  prose-li:leading-8
                  prose-li:text-slate-400

                  prose-strong:font-bold
                  prose-strong:text-slate-200

                  prose-a:font-medium
                  prose-a:text-cyan-300
                  prose-a:no-underline
                  hover:prose-a:text-cyan-200
                  hover:prose-a:underline

                  prose-blockquote:rounded-xl
                  prose-blockquote:border-l-4
                  prose-blockquote:border-cyan-400
                  prose-blockquote:bg-cyan-400/[0.045]
                  prose-blockquote:px-5
                  prose-blockquote:py-3
                  prose-blockquote:text-slate-400

                  prose-code:rounded
                  prose-code:bg-white/[0.06]
                  prose-code:px-1.5
                  prose-code:py-0.5
                  prose-code:text-cyan-300

                  prose-pre:rounded-2xl
                  prose-pre:border
                  prose-pre:border-white/[0.08]
                  prose-pre:bg-[#05090d]

                  prose-table:overflow-hidden
                  prose-table:rounded-xl
                  prose-table:border
                  prose-table:border-white/[0.08]

                  prose-th:border-white/[0.08]
                  prose-th:bg-white/[0.035]
                  prose-th:px-4
                  prose-th:py-3
                  prose-th:text-left
                  prose-th:text-sm
                  prose-th:font-bold
                  prose-th:text-slate-200

                  prose-td:border-white/[0.07]
                  prose-td:px-4
                  prose-td:py-3
                  prose-td:text-sm
                  prose-td:text-slate-400
                "
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                >
                  {content}
                </ReactMarkdown>
              </div>
            </div>
          </article>
        </main>

        {/* ===================================================
            UNDERSTANDING
        =================================================== */}

        <section className="relative z-10 mt-6 grid gap-4 md:grid-cols-2">

          <Link
            href={`/learn/${moduleSlug}/${lessonSlug}/quiz`}
            className="group rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.035] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400/25 hover:bg-cyan-400/[0.055]"
          >
            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/[0.07]">
                <BookOpen className="h-5 w-5 text-cyan-300" />
              </div>

              <div className="min-w-0 flex-1">

                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-400">
                  Check Your Understanding
                </p>

                <h3 className="mt-1 text-sm font-bold text-slate-200">
                  Review what you learned
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Answer a few questions to check your understanding
                  of this lesson.
                </p>
              </div>

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-400/[0.06]">
                <ArrowRight className="h-4 w-4 text-cyan-300 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

          <Link
            href={`/tutor?lesson=${lesson.id}`}
            className="group rounded-2xl border border-violet-400/10 bg-violet-400/[0.03] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-400/25 hover:bg-violet-400/[0.05]"
          >
            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-400/10 bg-violet-400/[0.07]">
                <Bot className="h-5 w-5 text-violet-300" />
              </div>

              <div className="min-w-0 flex-1">

                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-300">
                  FinPilot AI Tutor
                </p>

                <h3 className="mt-1 text-sm font-bold text-slate-200">
                  Need help understanding something?
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Ask the AI tutor to explain a concept in simpler
                  terms or provide another example.
                </p>
              </div>

              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-700 transition group-hover:translate-x-1 group-hover:text-violet-300" />
            </div>
          </Link>

        </section>

        {/* ===================================================
            COMPLETION
        =================================================== */}

        <section className="relative z-10 mt-6 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0a1015] shadow-xl shadow-black/10">

          <div className="p-5 sm:p-6">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center gap-4">

                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl border",
                    marked
                      ? "border-emerald-400/15 bg-emerald-400/[0.07]"
                      : "border-white/[0.07] bg-white/[0.03]"
                  )}
                >
                  {marked ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                  ) : (
                    <Play className="h-4 w-4 text-slate-500" />
                  )}
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-200">
                    {marked
                      ? "Lesson completed"
                      : "Finished reading?"}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {marked
                      ? "Your lesson progress has been recorded."
                      : "Mark this lesson as complete when you finish reading."}
                  </p>
                </div>
              </div>

              {!marked && (
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={completeMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.08] px-5 py-3 text-sm font-bold text-emerald-300 transition hover:border-emerald-400/35 hover:bg-emerald-400/[0.13] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />

                  {completeMutation.isPending
                    ? "Saving..."
                    : "Mark Lesson Complete"}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ===================================================
            PREVIOUS / NEXT
        =================================================== */}

        <div className="relative z-10 mt-6 grid gap-4 sm:grid-cols-2">

          {prevLesson ? (
            <Link
              href={`/learn/${moduleSlug}/${prevLesson.slug}`}
              className="group rounded-2xl border border-white/[0.07] bg-[#0a1015] p-5 transition hover:border-white/[0.13] hover:bg-white/[0.025]"
            >
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
                Previous Lesson
              </div>

              <p className="mt-2 truncate text-sm font-bold text-slate-400 group-hover:text-slate-200">
                {prevLesson.title}
              </p>
            </Link>
          ) : (
            <div />
          )}

          {nextLesson ? (
            <Link
              href={`/learn/${moduleSlug}/${nextLesson.slug}`}
              className="group rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.035] p-5 text-right transition hover:border-cyan-400/25 hover:bg-cyan-400/[0.055]"
            >
              <div className="flex items-center justify-end gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-400">
                Next Lesson
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>

              <p className="mt-2 truncate text-sm font-bold text-slate-300 group-hover:text-white">
                {nextLesson.title}
              </p>
            </Link>
          ) : (
            <Link
              href={`/learn/${moduleSlug}`}
              className="group rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.035] p-5 text-right transition hover:border-emerald-400/25 hover:bg-emerald-400/[0.055]"
            >
              <div className="flex items-center justify-end gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-400">
                Back to Course
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>

              <p className="mt-2 text-sm font-bold text-slate-300 group-hover:text-white">
                Return to the course
              </p>
            </Link>
          )}

        </div>

        {/* ===================================================
            FOOTER
        =================================================== */}

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
   LOADING SKELETON
============================================================ */

function LessonSkeleton() {
  return (
    <div className="min-h-full bg-[#05090d]">

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">

        <div className="h-4 w-64 animate-pulse rounded bg-white/[0.06]" />

        <div className="overflow-hidden rounded-[28px] border border-white/[0.07] bg-[#0a1015] p-8 sm:p-10">

          <div className="h-7 w-24 animate-pulse rounded-full bg-white/[0.06]" />

          <div className="mt-6 h-12 w-3/4 animate-pulse rounded bg-white/[0.06]" />

          <div className="mt-4 h-5 w-1/2 animate-pulse rounded bg-white/[0.04]" />

          <div className="mt-8 h-2 w-full max-w-xl animate-pulse rounded bg-white/[0.06]" />

        </div>

        <div className="overflow-hidden rounded-[28px] border border-white/[0.07] bg-[#0a1015] p-8 sm:p-12">

          <div className="space-y-5">

            <div className="h-6 w-1/3 animate-pulse rounded bg-white/[0.06]" />

            <div className="h-4 w-full animate-pulse rounded bg-white/[0.05]" />

            <div className="h-4 w-11/12 animate-pulse rounded bg-white/[0.05]" />

            <div className="h-4 w-10/12 animate-pulse rounded bg-white/[0.05]" />

            <div className="h-32 w-full animate-pulse rounded-xl bg-white/[0.03]" />

            <div className="h-4 w-full animate-pulse rounded bg-white/[0.05]" />

            <div className="h-4 w-9/12 animate-pulse rounded bg-white/[0.05]" />

          </div>
        </div>
      </div>
    </div>
  );
}