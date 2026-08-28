"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock,
  GraduationCap,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { useModules } from "@/hooks/useApi";
import { demoModules } from "@/lib/demo-data";
import { cn } from "@/lib/utils";
import type { ModuleSummary } from "@/types";

const LEVELS = [
  { id: "all", label: "All Topics" },
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

const LEVEL_META = {
  beginner: {
    label: "Beginner",
    description: "Build your financial foundation",
    badge:
      "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300",
    accent: "from-emerald-400 to-teal-300",
    number: "01",
  },
  intermediate: {
    label: "Intermediate",
    description: "Develop practical financial knowledge",
    badge:
      "border-amber-400/20 bg-amber-400/[0.06] text-amber-300",
    accent: "from-amber-400 to-orange-300",
    number: "02",
  },
  advanced: {
    label: "Advanced",
    description: "Explore deeper investing concepts",
    badge:
      "border-rose-400/20 bg-rose-400/[0.06] text-rose-300",
    accent: "from-rose-400 to-pink-300",
    number: "03",
  },
};

export default function LearnPage() {
  const [level, setLevel] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  const query = useModules(
    level === "all" ? undefined : level
  ) as {
    data?: ModuleSummary[];
    isLoading: boolean;
  };

  const apiModules = query.data ?? [];

  const modules = useMemo(() => {
    const source =
      apiModules.length > 0
        ? apiModules
        : (demoModules as ModuleSummary[]);

    return source.filter((module) => {
      if (level !== "all" && module.level !== level) {
        return false;
      }

      if (!searchQuery.trim()) {
        return true;
      }

      const search = searchQuery.toLowerCase();

      const moduleMatch =
        module.title.toLowerCase().includes(search) ||
        module.description?.toLowerCase().includes(search);

      const lessonMatch = module.lessons?.some((lesson) =>
        lesson.title.toLowerCase().includes(search)
      );

      return Boolean(moduleMatch || lessonMatch);
    });
  }, [apiModules, level, searchQuery]);

  const totalLessons = modules.reduce(
    (sum, module) => sum + (module.lesson_count ?? 0),
    0
  );

  const completedLessons = modules.reduce(
    (sum, module) => sum + (module.completed_count ?? 0),
    0
  );

  const overallProgress =
    totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

  const continueLearning = useMemo(() => {
    return modules.find(
      (module) =>
        (module.completed_count ?? 0) > 0 &&
        (module.completed_count ?? 0) <
          (module.lesson_count ?? 0)
    );
  }, [modules]);

  return (
    <div className="relative min-h-full overflow-hidden bg-[#060a0f] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.5) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage:
              "radial-gradient(circle at center, black 0%, transparent 80%)",
          }}
        />

        <div className="absolute -left-40 -top-32 h-[440px] w-[440px] rounded-full bg-cyan-500/[0.035] blur-[140px]" />

        <div className="absolute right-[-180px] top-[20%] h-[480px] w-[480px] rounded-full bg-blue-500/[0.025] blur-[150px]" />

        <div className="absolute bottom-[-200px] left-[30%] h-[420px] w-[420px] rounded-full bg-emerald-500/[0.02] blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-[1450px] p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <header className="border-b border-white/[0.06] pb-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-5 flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-cyan-300" />

                <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-cyan-300/80">
                  Finance Library
                </span>

                <span className="text-[9px] text-slate-700">
                  /
                </span>

                <span className="text-[9px] uppercase tracking-[0.18em] text-slate-600">
                  Learn
                </span>
              </div>

              <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                Learn finance.
                <span className="bg-gradient-to-r from-cyan-300 via-white to-emerald-300 bg-clip-text text-transparent">
                  {" "}
                  One concept at a time.
                </span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">
                A structured finance library designed to take you from the
                fundamentals of money management to investing and financial
                planning. Read, understand, and apply each concept at your own
                pace.
              </p>
            </div>

            {/* Library summary */}
            <div className="w-full shrink-0 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 lg:w-[300px]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.06]">
                  <BookOpen className="h-4 w-4 text-cyan-300" />
                </div>

                <div>
                  <p className="text-[9px] uppercase tracking-[0.18em] text-slate-600">
                    Your library
                  </p>

                  <p className="mt-1 text-sm font-semibold text-white">
                    {modules.length}{" "}
                    {modules.length === 1 ? "course" : "courses"}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-5">
                <div>
                  <p className="text-2xl font-semibold text-white">
                    {totalLessons}
                  </p>

                  <p className="mt-1 text-[9px] uppercase tracking-[0.15em] text-slate-600">
                    Lessons
                  </p>
                </div>

                <div>
                  <p className="text-2xl font-semibold text-cyan-300">
                    {overallProgress}%
                  </p>

                  <p className="mt-1 text-[9px] uppercase tracking-[0.15em] text-slate-600">
                    Progress
                  </p>
                </div>
              </div>

              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300 transition-all duration-700"
                  style={{
                    width: `${overallProgress}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Continue Learning */}
        {continueLearning &&
          !searchQuery &&
          level === "all" && (
            <section className="mt-7 overflow-hidden rounded-2xl border border-cyan-400/15 bg-gradient-to-r from-cyan-400/[0.06] via-white/[0.02] to-emerald-400/[0.035]">
              <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.07]">
                    <GraduationCap className="h-5 w-5 text-cyan-300" />
                  </div>

                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-cyan-300/70">
                      Continue reading
                    </p>

                    <h2 className="mt-1 text-base font-semibold text-white">
                      {continueLearning.title}
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      {continueLearning.completed_count ?? 0} of{" "}
                      {continueLearning.lesson_count ?? 0} lessons completed
                    </p>
                  </div>
                </div>

                <Link
                  href={`/learn/${continueLearning.slug}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.08] px-4 py-2.5 text-xs font-semibold text-cyan-200 transition-all hover:bg-cyan-400/[0.14]"
                >
                  Continue reading
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </section>
          )}

        {/* Search and filters */}
        <section className="mt-7 rounded-2xl border border-white/[0.07] bg-white/[0.018] p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

              <input
                type="text"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                placeholder="Search courses or lessons..."
                className="w-full rounded-xl border border-white/[0.07] bg-black/20 py-3 pl-11 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-700 focus:border-cyan-400/25 focus:bg-white/[0.025]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="mr-1 hidden items-center gap-2 sm:flex">
                <SlidersHorizontal className="h-3.5 w-3.5 text-slate-600" />

                <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                  Level
                </span>
              </div>

              {LEVELS.map((item) => {
                const active = level === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLevel(item.id)}
                    className={cn(
                      "rounded-lg border px-3.5 py-2 text-[11px] font-semibold transition-all duration-200",
                      active
                        ? "border-cyan-400/25 bg-cyan-400/[0.09] text-cyan-200"
                        : "border-white/[0.07] bg-white/[0.02] text-slate-500 hover:border-white/[0.13] hover:bg-white/[0.04] hover:text-slate-300"
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Course library */}
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-cyan-300/60">
                Curriculum
              </p>

              <h2 className="mt-1 text-lg font-semibold text-white">
                Finance courses
              </h2>

              <p className="mt-1 text-xs text-slate-600">
                Work through the material in order or choose a topic that
                interests you.
              </p>
            </div>

            <p className="text-[10px] uppercase tracking-[0.15em] text-slate-700">
              {modules.length}{" "}
              {modules.length === 1 ? "course" : "courses"}
            </p>
          </div>

          {query.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-32 animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.025]"
                />
              ))}
            </div>
          ) : modules.length > 0 ? (
            <div className="space-y-3">
              {modules.map((module, index) => (
                <CourseCard
                  key={module.id}
                  module={module}
                  index={index}
                  expanded={expandedModule === module.id}
                  onToggle={() =>
                    setExpandedModule((current) =>
                      current === module.id
                        ? null
                        : module.id
                    )
                  }
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06]">
                <Search className="h-6 w-6 text-cyan-300/70" />
              </div>

              <h2 className="mt-5 text-sm font-semibold text-white">
                No courses found
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-slate-600">
                Try a different search term or choose another learning level.
              </p>

              {(searchQuery || level !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setLevel("all");
                  }}
                  className="mt-5 rounded-lg border border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-2 text-xs font-medium text-cyan-300 transition-colors hover:bg-cyan-400/[0.1]"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </section>

        {/* Learning philosophy */}
        {modules.length > 0 && (
          <section className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.018] p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-400/[0.05]">
                <BookOpen className="h-4 w-4 text-emerald-300" />
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-200">
                  Learn like you are reading a good finance book
                </h3>

                <p className="mt-1 max-w-3xl text-xs leading-6 text-slate-600">
                  Start with the fundamentals. Understand the terminology.
                  Read the examples carefully. Then use FinPilot&apos;s
                  calculators and financial tools to apply what you have
                  learned to real situations.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-8 flex flex-col gap-2 border-t border-white/[0.05] py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-700">
              FinPilot Finance Library
            </span>
          </div>

          <div className="flex items-center gap-4 text-[9px] uppercase tracking-[0.15em] text-slate-800">
            <span>Learn</span>
            <span>Understand</span>
            <span>Apply</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function CourseCard({
  module,
  index,
  expanded,
  onToggle,
}: {
  module: ModuleSummary;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const completed = module.completion_pct >= 100;

  const completionPct = Math.min(
    Math.max(module.completion_pct ?? 0, 0),
    100
  );

  const level =
    module.level in LEVEL_META
      ? LEVEL_META[
          module.level as keyof typeof LEVEL_META
        ]
      : LEVEL_META.beginner;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-white/[0.025] transition-all duration-300",
        expanded
          ? "border-cyan-400/15 bg-white/[0.035]"
          : "border-white/[0.07] hover:border-white/[0.12] hover:bg-white/[0.035]"
      )}
    >
      {/* Accent */}
      <div
        className={cn(
          "absolute left-0 top-0 h-full w-0.5 bg-gradient-to-b opacity-50",
          level.accent
        )}
      />

      <div className="relative">
        <button
          type="button"
          onClick={onToggle}
          className="w-full p-5 text-left sm:p-6"
        >
          <div className="flex items-center gap-4">
            {/* Course number */}
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-black/20 sm:flex">
              <span className="text-xs font-bold text-slate-500">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>

            {/* Course information */}
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded-md border px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.15em]",
                    level.badge
                  )}
                >
                  {level.label}
                </span>

                {completed && (
                  <span className="flex items-center gap-1 text-[8px] font-semibold uppercase tracking-wider text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Completed
                  </span>
                )}
              </div>

              <h3 className="truncate text-sm font-semibold text-white sm:text-base">
                {module.title}
              </h3>

              {module.description && (
                <p className="mt-1 line-clamp-2 max-w-3xl text-[10px] leading-5 text-slate-600 sm:text-xs">
                  {module.description}
                </p>
              )}

              <p className="mt-2 hidden text-[9px] text-slate-700 sm:block">
                {level.description}
              </p>
            </div>

            {/* Course statistics */}
            <div className="hidden items-center gap-6 sm:flex">
              <div className="text-right">
                <p className="text-xs font-medium text-slate-300">
                  {module.completed_count ?? 0}/
                  {module.lesson_count ?? 0}
                </p>

                <p className="mt-1 text-[8px] uppercase tracking-wider text-slate-700">
                  lessons
                </p>
              </div>

              <div className="w-24">
                <div className="mb-1 flex justify-end">
                  <span className="text-[8px] font-semibold text-slate-600">
                    {completionPct}%
                  </span>
                </div>

                <div className="h-1 overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300 transition-all duration-700"
                    style={{
                      width: `${completionPct}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Expand */}
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.025] text-slate-600 transition-all duration-300",
                expanded &&
                  "rotate-180 border-cyan-400/15 text-cyan-300"
              )}
            >
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>

          {/* Mobile progress */}
          <div className="mt-4 sm:hidden">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[9px] text-slate-600">
                {module.completed_count ?? 0}/
                {module.lesson_count ?? 0} lessons
              </span>

              <span className="text-[9px] font-semibold text-slate-500">
                {completionPct}%
              </span>
            </div>

            <div className="h-1 overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300"
                style={{
                  width: `${completionPct}%`,
                }}
              />
            </div>
          </div>
        </button>

        {/* Lessons */}
        {expanded && (
          <div className="border-t border-white/[0.06] bg-black/10">
            {module.lessons.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <BookOpen className="mx-auto h-5 w-5 text-slate-700" />

                <p className="mt-3 text-xs text-slate-600">
                  Lessons are not available yet.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.045]">
                {module.lessons.map((lesson, lessonIndex) => (
                  <Link
                    key={lesson.id}
                    href={`/learn/${module.slug}/${lesson.slug}`}
                    className="group/lesson flex items-center gap-3 px-5 py-4 transition-all duration-200 hover:bg-white/[0.035] sm:px-6"
                  >
                    {/* Lesson status */}
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-[10px] font-semibold",
                        lesson.completed
                          ? "border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300"
                          : "border-white/[0.07] bg-white/[0.025] text-slate-500"
                      )}
                    >
                      {lesson.completed ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        lessonIndex + 1
                      )}
                    </div>

                    {/* Lesson information */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-slate-300 transition-colors group-hover/lesson:text-white">
                        {lesson.title}
                      </p>

                      <div className="mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[9px] text-slate-600">
                          <Clock className="h-3 w-3" />
                          {lesson.estimated_minutes} min
                        </span>

                        <span className="text-[9px] text-slate-700">
                          Reading lesson
                        </span>
                      </div>
                    </div>

                    <span className="hidden text-[9px] font-medium uppercase tracking-[0.15em] text-slate-700 transition-colors group-hover/lesson:text-cyan-300 sm:block">
                      {lesson.completed ? "Review" : "Read"}
                    </span>

                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-700 transition-all group-hover/lesson:translate-x-1 group-hover/lesson:text-cyan-300" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}