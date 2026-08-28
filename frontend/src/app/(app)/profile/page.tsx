"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Calculator,
  ChevronRight,
  GraduationCap,
  LineChart,
  Settings,
  ShieldCheck,
  Target,
  User,
  Wallet,
} from "lucide-react";

import { demoModules } from "@/lib/demo-data";

/* ============================================================
   HELPERS
============================================================ */

function getLessonCount(module: (typeof demoModules)[number]) {
  return module.lesson_count ?? module.lessons?.length ?? 0;
}

function getCompletedCount(module: (typeof demoModules)[number]) {
  return module.completed_count ?? 0;
}

/* ============================================================
   GLASS CARD
============================================================ */

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-2xl",
        "border border-white/[0.07]",
        "bg-white/[0.035]",
        "backdrop-blur-xl",
        "shadow-[0_20px_80px_rgba(0,0,0,0.2)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  icon,
  label,
  value,
  description,
  iconClass,
  backgroundClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
  iconClass: string;
  backgroundClass: string;
}) {
  return (
    <GlassCard className="p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.12]">
      <div
        className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl border ${backgroundClass} ${iconClass}`}
      >
        {icon}
      </div>

      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600">
        {label}
      </p>

      <div className="mt-1">
        <span className="text-3xl font-semibold tracking-tight text-white">
          {value}
        </span>
      </div>

      <p className="mt-1 text-[10px] text-slate-600">
        {description}
      </p>
    </GlassCard>
  );
}

/* ============================================================
   FEATURE CARD
============================================================ */

function FeatureCard({
  href,
  icon,
  title,
  description,
  iconClass,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  iconClass: string;
}) {
  return (
    <Link href={href} className="group block">
      <GlassCard className="h-full p-5 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-cyan-400/20">
        <div className="flex items-start justify-between gap-4">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.035] ${iconClass}`}
          >
            {icon}
          </div>

          <ChevronRight className="h-4 w-4 text-slate-700 transition-all duration-300 group-hover:translate-x-1 group-hover:text-cyan-300" />
        </div>

        <h3 className="mt-5 text-sm font-semibold text-white transition-colors group-hover:text-cyan-200">
          {title}
        </h3>

        <p className="mt-2 text-xs leading-5 text-slate-600">
          {description}
        </p>
      </GlassCard>
    </Link>
  );
}

/* ============================================================
   MODULE PROGRESS
============================================================ */

function ModuleProgress({
  module,
}: {
  module: (typeof demoModules)[number];
}) {
  const total = getLessonCount(module);
  const completed = getCompletedCount(module);

  const percentage =
    total > 0
      ? Math.min(100, Math.round((completed / total) * 100))
      : 0;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.018] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-xs font-semibold text-white">
            {module.title}
          </h3>

          <p className="mt-1 text-[10px] text-slate-600">
            {completed} of {total} lessons completed
          </p>
        </div>

        <span className="shrink-0 text-[10px] font-semibold text-cyan-300">
          {percentage}%
        </span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300 transition-all duration-700"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

/* ============================================================
   PROFILE PAGE
============================================================ */

export default function ProfilePage() {
  const totalLessons = demoModules.reduce(
    (total, module) => total + getLessonCount(module),
    0
  );

  const completedLessons = demoModules.reduce(
    (total, module) => total + getCompletedCount(module),
    0
  );

  const totalModules = demoModules.length;

  const completedModules = demoModules.filter((module) => {
    const total = getLessonCount(module);
    const completed = getCompletedCount(module);

    return total > 0 && completed >= total;
  }).length;

  const quizCount = 2;

  const completionPercentage =
    totalLessons > 0
      ? Math.min(
          100,
          Math.round((completedLessons / totalLessons) * 100)
        )
      : 0;

  const currentModule =
    demoModules.find(
      (module) =>
        getCompletedCount(module) < getLessonCount(module)
    ) ?? demoModules[0];

  return (
    <div className="relative min-h-full overflow-hidden bg-[#05090d] text-white">
      {/* ========================================================
          BACKGROUND
      ======================================================== */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.5) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
            maskImage:
              "radial-gradient(circle at center, black 0%, transparent 78%)",
          }}
        />

        <div className="absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-cyan-500/[0.055] blur-[130px]" />

        <div className="absolute right-[-180px] top-[20%] h-[500px] w-[500px] rounded-full bg-violet-500/[0.045] blur-[140px]" />

        <div className="absolute bottom-[-200px] left-[35%] h-[400px] w-[400px] rounded-full bg-emerald-500/[0.035] blur-[120px]" />
      </div>

      {/* ========================================================
          MAIN CONTENT
      ======================================================== */}

      <div className="relative mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
        {/* ======================================================
            HEADER
        ====================================================== */}

        <header>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]" />

                <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-cyan-300/70">
                  FinPilot Account
                </span>
              </div>

              <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                Your{" "}
                <span className="bg-gradient-to-r from-cyan-300 via-white to-emerald-300 bg-clip-text text-transparent">
                  profile.
                </span>
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Track your financial learning journey and progress.
              </p>
            </div>

            <Link
              href="/settings"
              className="group inline-flex w-fit items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-2.5 text-xs font-semibold text-slate-400 transition-all hover:border-cyan-400/20 hover:text-cyan-300"
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </header>

        {/* ======================================================
            PROFILE HERO
        ====================================================== */}

        <section>
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-cyan-500/[0.065] via-white/[0.025] to-violet-500/[0.035] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.28)] sm:p-8">
            <div className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full border border-cyan-400/[0.05]" />

            <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full border border-cyan-400/[0.04]" />

            <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-5">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.08] shadow-[0_0_40px_rgba(34,211,238,0.06)]">
                  <User className="h-9 w-9 text-cyan-300" />
                </div>

                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-cyan-300/70">
                    FinPilot Learner
                  </p>

                  <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    Welcome back
                  </h2>

                  <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">
                    Keep building your financial knowledge one
                    concept at a time. Learn, practise, and use
                    FinPilot&apos;s tools to understand finance in
                    the real world.
                  </p>
                </div>
              </div>

              <Link
                href={
                  currentModule
                    ? `/learn/${currentModule.slug}`
                    : "/learn"
                }
                className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-xs font-semibold text-slate-950 transition-all hover:bg-cyan-300 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]"
              >
                <GraduationCap className="h-4 w-4" />
                Continue Learning
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>

        {/* ======================================================
            STATISTICS
        ====================================================== */}

        <section>
          <div className="mb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.07]">
                <Target className="h-4 w-4 text-cyan-300" />
              </div>

              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-cyan-300/70">
                  Progress
                </p>

                <h2 className="mt-0.5 text-sm font-semibold text-white">
                  Learning Overview
                </h2>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-600">
              A quick view of your progress through the FinPilot
              learning library.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<BookOpen className="h-5 w-5" />}
              label="Lessons Completed"
              value={completedLessons}
              description={`of ${totalLessons} lessons`}
              iconClass="text-cyan-300"
              backgroundClass="bg-cyan-400/10 border-cyan-400/15"
            />

            <StatCard
              icon={<GraduationCap className="h-5 w-5" />}
              label="Modules Completed"
              value={completedModules}
              description={`of ${totalModules} modules`}
              iconClass="text-violet-300"
              backgroundClass="bg-violet-400/10 border-violet-400/15"
            />

            <StatCard
              icon={<Brain className="h-5 w-5" />}
              label="Knowledge Checks"
              value={quizCount}
              description="Available demo quizzes"
              iconClass="text-amber-300"
              backgroundClass="bg-amber-400/10 border-amber-400/15"
            />

            <StatCard
              icon={<Target className="h-5 w-5" />}
              label="Curriculum"
              value={totalModules}
              description="Finance modules"
              iconClass="text-emerald-300"
              backgroundClass="bg-emerald-400/10 border-emerald-400/15"
            />
          </div>
        </section>

        {/* ======================================================
            OVERALL PROGRESS
        ====================================================== */}

        <section>
          <GlassCard className="overflow-hidden">
            <div className="p-6 sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-cyan-300" />

                    <h2 className="text-sm font-semibold text-white">
                      Overall Learning Progress
                    </h2>
                  </div>

                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    Your current position across the complete
                    FinPilot curriculum.
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-2xl font-semibold text-white">
                    {completionPercentage}%
                  </p>

                  <p className="text-[9px] uppercase tracking-[0.15em] text-slate-700">
                    Complete
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-cyan-300 to-emerald-300 shadow-[0_0_18px_rgba(34,211,238,0.2)] transition-all duration-700"
                    style={{
                      width: `${completionPercentage}%`,
                    }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[9px] text-slate-700">
                    {completedLessons} lessons completed
                  </span>

                  <span className="text-[9px] text-slate-700">
                    {totalLessons} total lessons
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* ======================================================
            MODULE PROGRESS
        ====================================================== */}

        <section>
          <div className="mb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-400/15 bg-violet-400/[0.07]">
                <GraduationCap className="h-4 w-4 text-violet-300" />
              </div>

              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-violet-300/70">
                  Curriculum
                </p>

                <h2 className="mt-0.5 text-sm font-semibold text-white">
                  Module Progress
                </h2>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {demoModules.map((module) => (
              <ModuleProgress
                key={module.id}
                module={module}
              />
            ))}
          </div>
        </section>

        {/* ======================================================
            TOOLS
        ====================================================== */}

        <section>
          <div className="mb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-400/[0.07]">
                <Wallet className="h-4 w-4 text-emerald-300" />
              </div>

              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-emerald-300/70">
                  FinPilot ecosystem
                </p>

                <h2 className="mt-0.5 text-sm font-semibold text-white">
                  Learning & Financial Tools
                </h2>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-600">
              Learn the concept, then use the tools to understand
              how it works in practice.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <FeatureCard
              href="/learn"
              icon={<BookOpen className="h-5 w-5" />}
              title="Finance Lessons"
              description="Study structured lessons covering personal finance, investing, markets, and financial planning."
              iconClass="text-cyan-300"
            />

            <FeatureCard
              href="/calculator"
              icon={<Calculator className="h-5 w-5" />}
              title="Financial Calculators"
              description="Apply financial concepts using practical calculators and real numbers."
              iconClass="text-amber-300"
            />

            <FeatureCard
              href="/markets"
              icon={<LineChart className="h-5 w-5" />}
              title="Market Learning"
              description="Explore market information, charts, and financial markets in a practical environment."
              iconClass="text-emerald-300"
            />

            <FeatureCard
              href="/budget"
              icon={<Wallet className="h-5 w-5" />}
              title="Budget Planner"
              description="Organize income and expenses while building better financial planning habits."
              iconClass="text-violet-300"
            />

            <FeatureCard
              href="/watchlist"
              icon={<LineChart className="h-5 w-5" />}
              title="Market Watchlist"
              description="Track companies and market instruments you want to understand more closely."
              iconClass="text-cyan-300"
            />

            <FeatureCard
              href="/tutor"
              icon={<Brain className="h-5 w-5" />}
              title="AI Tutor"
              description="Ask questions and get financial concepts explained in a simpler, learning-focused way."
              iconClass="text-orange-300"
            />
          </div>
        </section>

        {/* ======================================================
            LEARNING PRINCIPLE
        ====================================================== */}

        <section>
          <GlassCard className="p-6 sm:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.07]">
                <ShieldCheck className="h-5 w-5 text-cyan-300" />
              </div>

              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-cyan-300/70">
                  Learning philosophy
                </p>

                <h2 className="mt-1 text-base font-semibold text-white">
                  Learn at your own pace
                </h2>

                <p className="mt-2 max-w-4xl text-xs leading-6 text-slate-600 sm:text-sm">
                  FinPilot is designed as a practical financial
                  education platform. There are no artificial
                  progression requirements. Read the material,
                  understand the concepts, take the knowledge
                  checks, and use the tools whenever they are
                  useful to you.
                </p>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* ======================================================
            SETTINGS
        ====================================================== */}

        <section className="flex justify-end">
          <Link
            href="/settings"
            className="group inline-flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600 transition-all hover:border-cyan-400/15 hover:text-cyan-300"
          >
            <Settings className="h-3.5 w-3.5" />
            Profile & App Settings
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </section>

        {/* ======================================================
            FOOTER
        ====================================================== */}

        <footer className="flex flex-col gap-2 border-t border-white/[0.05] py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />

            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-700">
              FinPilot Finance Learning Platform
            </span>
          </div>

          <div className="flex gap-4 text-[9px] uppercase tracking-[0.15em] text-slate-800">
            <span>Learn</span>
            <span>Plan</span>
            <span>Invest</span>
            <span>Understand</span>
          </div>
        </footer>
      </div>
    </div>
  );
}