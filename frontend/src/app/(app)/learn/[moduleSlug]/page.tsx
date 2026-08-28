"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
} from "lucide-react";

import { useModule } from "@/hooks/useApi";
import { demoModules } from "@/lib/demo-data";
import type { ModuleSummary } from "@/types";

export default function ModulePage() {
  const params = useParams<{ moduleSlug: string }>();
  const moduleSlug = params.moduleSlug;

  const { data } = useModule(moduleSlug) as {
    data?: ModuleSummary;
  };

  const module =
    data ??
    (demoModules as ModuleSummary[]).find(
      (item) => item.slug === moduleSlug
    );

  /* ============================================================
     NOT FOUND
  ============================================================ */

  if (!module) {
    return (
      <div className="min-h-full bg-[#05090d] text-slate-100">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-5 py-10">
          <div className="w-full rounded-[28px] border border-white/[0.08] bg-[#0a1015] p-10 text-center shadow-2xl shadow-black/20">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.07]">
              <BookOpen className="h-6 w-6 text-cyan-300" />
            </div>

            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">
              Learning Module
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
              Module not found
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
              We couldn't load this learning module. Please return to the
              learning library and choose another module.
            </p>

            <Link
              href="/learn"
              className="mt-7 inline-flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.08] px-4 py-2.5 text-sm font-semibold text-cyan-300 transition hover:border-cyan-400/40 hover:bg-cyan-400/[0.14] hover:text-cyan-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Learning
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const lessons = Array.isArray(module.lessons) ? module.lessons : [];

  const completedCount = module.completed_count ?? 0;
  const lessonCount = module.lesson_count ?? lessons.length;

  const progress =
    lessonCount > 0
      ? Math.min(
          100,
          Math.max(
            0,
            module.completion_pct ??
              Math.round((completedCount / lessonCount) * 100)
          )
        )
      : 0;

  const nextLesson =
    lessons.find((lesson) => !lesson.completed) ?? lessons[0] ?? null;

  return (
    <div className="min-h-full bg-[#05090d] text-slate-100">
      <div className="relative mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">

        {/* Ambient background */}
        <div className="pointer-events-none absolute left-1/2 top-0 -z-0 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-400/[0.025] blur-3xl" />

        {/* =========================================================
            BREADCRUMB
        ========================================================= */}

        <Link
          href="/learn"
          className="group relative z-10 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-cyan-300"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Learning Library
        </Link>

        {/* =========================================================
            COURSE HEADER
        ========================================================= */}

        <header className="relative z-10 mt-6 overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0a1015] shadow-2xl shadow-black/20">

          {/* Accent line */}
          <div className="h-1 bg-gradient-to-r from-cyan-400 via-cyan-300 to-emerald-400" />

          <div className="border-b border-white/[0.06] px-6 py-8 sm:px-8 sm:py-9 lg:px-10">

            <div className="flex flex-col gap-7 sm:flex-row sm:items-start sm:justify-between">

              <div className="max-w-3xl">

                {/* Module label */}
                <div className="flex flex-wrap items-center gap-2">

                  <span className="rounded-md border border-white/[0.06] bg-white/[0.035] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Chapter {String(module.order_index).padStart(2, "0")}
                  </span>

                  <span
                    className={
                      module.level === "beginner"
                        ? "rounded-md border border-emerald-400/15 bg-emerald-400/[0.07] px-2.5 py-1 text-[10px] font-bold capitalize text-emerald-300"
                        : module.level === "intermediate"
                        ? "rounded-md border border-amber-400/15 bg-amber-400/[0.07] px-2.5 py-1 text-[10px] font-bold capitalize text-amber-300"
                        : "rounded-md border border-violet-400/15 bg-violet-400/[0.07] px-2.5 py-1 text-[10px] font-bold capitalize text-violet-300"
                    }
                  >
                    {module.level}
                  </span>

                  {progress >= 100 && (
                    <span className="flex items-center gap-1 rounded-md border border-emerald-400/15 bg-emerald-400/[0.07] px-2.5 py-1 text-[10px] font-bold text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Completed
                    </span>
                  )}
                </div>

                {/* Title */}
                <h1 className="mt-5 text-3xl font-bold tracking-[-0.035em] text-white sm:text-4xl">
                  {module.title}
                </h1>

                {/* Description */}
                {module.description && (
                  <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">
                    {module.description}
                  </p>
                )}
              </div>

              {/* Course icon */}
              <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.06] sm:flex">
                <GraduationCap className="h-7 w-7 text-cyan-300" />
              </div>
            </div>
          </div>

          {/* =======================================================
              PROGRESS
          ======================================================= */}

          <div className="bg-white/[0.018] px-6 py-5 sm:px-8 lg:px-10">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">
                  Your progress
                </p>

                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">
                    {progress}%
                  </span>

                  <span className="text-sm text-slate-500">
                    {completedCount} of {lessonCount} lessons completed
                  </span>
                </div>
              </div>

              <span className="text-xs text-slate-600">
                {lessonCount} lessons in this chapter
              </span>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-[0_0_12px_rgba(34,211,238,0.25)] transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </header>

        {/* =========================================================
            LESSONS
        ========================================================= */}

        <section className="relative z-10 mt-9">

          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-400/70">
                Chapter contents
              </p>

              <h2 className="mt-1 text-xl font-bold text-white">
                Lessons
              </h2>
            </div>

            <span className="text-xs text-slate-600">
              {lessons.length} lessons
            </span>
          </div>

          {lessons.length === 0 ? (
            <div className="rounded-[24px] border border-white/[0.07] bg-[#0a1015] px-6 py-16 text-center">
              <BookOpen className="mx-auto h-7 w-7 text-slate-600" />

              <h3 className="mt-4 text-base font-semibold text-slate-200">
                No lessons available yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Lessons for this chapter are still being prepared.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#0a1015]">

              {lessons.map((lesson, index) => {
                const isNext =
                  nextLesson?.id === lesson.id && !lesson.completed;

                return (
                  <Link
                    key={lesson.id}
                    href={`/learn/${module.slug}/${lesson.slug}`}
                    className="group relative flex items-center gap-4 border-b border-white/[0.055] px-5 py-5 transition-all last:border-b-0 hover:bg-white/[0.025] sm:px-6"
                  >

                    {/* Active lesson indicator */}
                    {isNext && (
                      <div className="absolute bottom-0 left-0 top-0 w-0.5 bg-gradient-to-b from-cyan-400 to-emerald-400 shadow-[0_0_10px_rgba(34,211,238,0.35)]" />
                    )}

                    {/* Number */}
                    <div
                      className={
                        lesson.completed
                          ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300"
                          : isNext
                          ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.09] text-cyan-300"
                          : "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.025] text-slate-500"
                      }
                    >
                      {lesson.completed ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-bold">
                          {index + 1}
                        </span>
                      )}
                    </div>

                    {/* Information */}
                    <div className="min-w-0 flex-1">

                      <div className="flex flex-wrap items-center gap-2">

                        <h3 className="text-sm font-semibold text-slate-200 transition-colors group-hover:text-white sm:text-base">
                          {lesson.title}
                        </h3>

                        {isNext && (
                          <span className="rounded-md border border-cyan-400/15 bg-cyan-400/[0.06] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-cyan-300">
                            Continue
                          </span>
                        )}

                        {lesson.completed && (
                          <span className="hidden text-[9px] font-bold uppercase tracking-[0.1em] text-emerald-400 sm:inline">
                            Completed
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex items-center gap-4">
                        <span className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Clock className="h-3.5 w-3.5" />
                          {lesson.estimated_minutes} min
                        </span>

                        <span className="text-xs text-slate-600">
                          Lesson {index + 1}
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-700 transition-all group-hover:bg-cyan-400/[0.06] group-hover:text-cyan-300">
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* =========================================================
            CONTINUE READING
        ========================================================= */}

        {nextLesson?.slug && (
          <section className="relative z-10 mt-6 rounded-[24px] border border-cyan-400/10 bg-cyan-400/[0.035] p-5 shadow-lg shadow-black/10 sm:p-6">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/[0.07]">
                  <BookOpen className="h-5 w-5 text-cyan-300" />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-cyan-400/70">
                    {progress === 100
                      ? "Review chapter"
                      : "Continue reading"}
                  </p>

                  <h3 className="mt-1 text-sm font-bold text-slate-200 sm:text-base">
                    {nextLesson.title}
                  </h3>

                  <p className="mt-1 text-xs text-slate-600">
                    {nextLesson.estimated_minutes} min read
                  </p>
                </div>
              </div>

              <Link
                href={`/learn/${module.slug}/${nextLesson.slug}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.08] px-5 py-3 text-sm font-bold text-cyan-300 transition hover:border-cyan-400/40 hover:bg-cyan-400/[0.13] hover:text-cyan-200"
              >
                {progress === 100
                  ? "Review Lesson"
                  : "Continue Lesson"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="relative z-10 mt-10 border-t border-white/[0.06] py-6">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            FinPilot Financial Learning
          </div>
        </footer>
      </div>
    </div>
  );
}