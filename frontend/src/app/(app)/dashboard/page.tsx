"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Bot,
  Calculator,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  GraduationCap,
  Landmark,
  LineChart,
  PiggyBank,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";

import {
  useDashboard,
  useFinancialGoals,
  useFinancialGoalsSummary,
  useFinancialHealthSummary,
  useModules,
  useWatchlist,
} from "@/hooks/useApi";

import { demoDashboard, demoModules } from "@/lib/demo-data";

/* ============================================================
   TYPES
============================================================ */

type DashboardData = Record<string, unknown>;

type WatchlistItem = {
  id: string;
  symbol?: string;
  name?: string;
  company_name?: string;
  notes?: string;
};

type DashboardGoal = {
  id: string;
  name: string;
  category: string;
  target_amount: string | number;
  current_amount: string | number;
  monthly_contribution: string | number;
  target_date?: string | null;
  priority?: number;
  status?: string;
  notes?: string | null;
};

/* ============================================================
   HELPERS
============================================================ */

function formatCurrency(value: unknown): string {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "â‚¹0";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatCompactCurrency(value: unknown): string {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "â‚¹0";
  }

  if (Math.abs(amount) >= 10000000) {
    return `â‚¹${(amount / 10000000).toFixed(1)}Cr`;
  }

  if (Math.abs(amount) >= 100000) {
    return `â‚¹${(amount / 100000).toFixed(1)}L`;
  }

  if (Math.abs(amount) >= 1000) {
    return `â‚¹${(amount / 1000).toFixed(1)}K`;
  }

  return `â‚¹${Math.round(amount)}`;
}

function firstNumber(
  source: DashboardData,
  keys: string[],
  fallback = 0
): number {
  for (const key of keys) {
    const value = Number(source?.[key]);

    if (Number.isFinite(value)) {
      return value;
    }
  }

  return fallback;
}

function firstString(
  source: DashboardData,
  keys: string[],
  fallback = ""
): string {
  for (const key of keys) {
    const value = source?.[key];

    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value;
    }
  }

  return fallback;
}

function getLevelLabel(level: string) {
  switch (level) {
    case "beginner":
      return "Beginner";

    case "intermediate":
      return "Intermediate";

    case "advanced":
      return "Advanced";

    default:
      return level;
  }
}

function getLevelStyle(level: string) {
  switch (level) {
    case "beginner":
      return {
        badge:
          "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
        icon:
          "bg-emerald-400/10 text-emerald-300",
      };

    case "intermediate":
      return {
        badge:
          "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
        icon:
          "bg-cyan-400/10 text-cyan-300",
      };

    case "advanced":
      return {
        badge:
          "border-violet-400/20 bg-violet-400/10 text-violet-300",
        icon:
          "bg-violet-400/10 text-violet-300",
      };

    default:
      return {
        badge:
          "border-slate-400/20 bg-slate-400/10 text-slate-300",
        icon:
          "bg-slate-400/10 text-slate-300",
      };
  }
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
   SECTION HEADER
============================================================ */

function SectionHeader({
  icon: Icon,
  eyebrow,
  title,
}: {
  icon: React.ElementType;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.07]">
        <Icon className="h-4 w-4 text-cyan-300" />
      </div>

      <div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-cyan-300/70">
          {eyebrow}
        </p>

        <h2 className="mt-0.5 text-sm font-semibold text-white">
          {title}
        </h2>
      </div>
    </div>
  );
}

/* ============================================================
   QUICK ACTION
============================================================ */

function QuickAction({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-400/20 hover:bg-white/[0.05]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.07]">
        <Icon className="h-4 w-4 text-cyan-300" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-white">
          {title}
        </p>

        <p className="mt-0.5 text-[10px] text-slate-500">
          {description}
        </p>
      </div>

      <ArrowRight className="h-3.5 w-3.5 text-slate-700 transition-all group-hover:translate-x-1 group-hover:text-cyan-300" />
    </Link>
  );
}

/* ============================================================
   OVERVIEW METRIC
============================================================ */

function OverviewMetric({
  icon: Icon,
  label,
  value,
  description,
  tone = "cyan",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  description: string;
  tone?: "cyan" | "emerald" | "orange" | "violet";
}) {
  const styles = {
    cyan:
      "border-cyan-400/15 bg-cyan-400/[0.07] text-cyan-300",
    emerald:
      "border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300",
    orange:
      "border-orange-400/15 bg-orange-400/[0.07] text-orange-300",
    violet:
      "border-violet-400/15 bg-violet-400/[0.07] text-violet-300",
  };

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            {label}
          </p>

          <p className="mt-2 text-xl font-bold text-white">
            {value}
          </p>

          <p className="mt-1 text-[10px] text-slate-600">
            {description}
          </p>
        </div>

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl border ${styles[tone]}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PROGRESS BAR
============================================================ */

function ProgressBar({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  return (
    <div
      className={`h-2 overflow-hidden rounded-full bg-white/[0.06] ${className}`}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-cyan-300 to-emerald-300 transition-all duration-700"
        style={{
          width: `${Math.min(
            100,
            Math.max(0, value)
          )}%`,
        }}
      />
    </div>
  );
}

/* ============================================================
   MODULE CARD
============================================================ */

function ModuleCard({
  module,
}: {
  module: (typeof demoModules)[number];
}) {
  const completed =
    module.completed_count ?? 0;

  const total =
    module.lesson_count ??
    module.lessons?.length ??
    0;

  const percentage =
    total > 0
      ? Math.round(
          (completed / total) * 100
        )
      : 0;

  const style = getLevelStyle(
    module.level
  );

  const firstLesson =
    module.lessons?.find(
      (lesson) => !lesson.completed
    ) ?? module.lessons?.[0];

  return (
    <Link
      href={`/learn/${module.slug}`}
      className="group block"
    >
      <GlassCard className="h-full p-5 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-cyan-400/20">
        <div className="flex items-start justify-between gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.icon}`}
          >
            <BookOpen className="h-5 w-5" />
          </div>

          <span
            className={[
              "rounded-full border px-2.5 py-1",
              "text-[9px] font-semibold uppercase tracking-wider",
              style.badge,
            ].join(" ")}
          >
            {getLevelLabel(
              module.level
            )}
          </span>
        </div>

        <h3 className="mt-5 text-sm font-semibold text-white transition-colors group-hover:text-cyan-200">
          {module.title}
        </h3>

        <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
          {module.description}
        </p>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-wider text-slate-600">
              Progress
            </span>

            <span className="text-[9px] font-semibold text-slate-400">
              {completed}/{total} lessons
            </span>
          </div>

          <ProgressBar
            value={percentage}
          />
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
          <span className="line-clamp-1 text-[10px] text-slate-600">
            {firstLesson?.title ??
              "View lessons"}
          </span>

          <ChevronRight className="h-4 w-4 text-slate-700 transition-transform group-hover:translate-x-1 group-hover:text-cyan-300" />
        </div>
      </GlassCard>
    </Link>
  );
}

/* ============================================================
   WATCHLIST PREVIEW
============================================================ */

function WatchlistPreview({
  items,
}: {
  items: WatchlistItem[];
}) {
  if (!items.length) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
        <TrendingUp className="mx-auto h-7 w-7 text-slate-700" />

        <p className="mt-3 text-sm font-medium text-white">
          Your watchlist is empty
        </p>

        <p className="mt-1 text-xs text-slate-600">
          Add companies from Markets to start tracking them.
        </p>

        <Link
          href="/markets"
          className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-cyan-300"
        >
          Explore markets
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.slice(0, 5).map((item) => (
        <Link
          key={item.id}
          href="/watchlist"
          className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.018] p-3 transition hover:border-cyan-400/15 hover:bg-white/[0.035]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-400/10 text-violet-300">
            <TrendingUp className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-200">
              {item.symbol ??
                item.company_name ??
                item.name ??
                "Market instrument"}
            </p>

            <p className="mt-0.5 truncate text-[10px] text-slate-600">
              {item.name ??
                item.company_name ??
                "Tracked in your watchlist"}
            </p>
          </div>

          <ChevronRight className="h-4 w-4 text-slate-700 transition-transform group-hover:translate-x-1 group-hover:text-cyan-300" />
        </Link>
      ))}

      <Link
        href="/watchlist"
        className="flex items-center justify-center gap-2 pt-2 text-[10px] font-semibold text-cyan-300"
      >
        View complete watchlist
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

/* ============================================================
   DASHBOARD
============================================================ */

export default function DashboardPage() {
  const {
    data: dashboardQuery,
    isLoading: dashboardLoading,
  } = useDashboard();

  const {
    data: modulesQuery,
    isLoading: modulesLoading,
  } = useModules();

  const {
    data: watchlistQuery,
    isLoading: watchlistLoading,
  } = useWatchlist();

  const {
    data: financialHealthSummary,
    isLoading: financialHealthLoading,
  } = useFinancialHealthSummary();

  const {
    data: financialGoalsQuery,
    isLoading: financialGoalsLoading,
  } = useFinancialGoals();

  const {
    data: financialGoalsSummary,
    isLoading: financialGoalsSummaryLoading,
  } = useFinancialGoalsSummary();

  const dashboard =
    (dashboardQuery ??
      demoDashboard ??
      {}) as DashboardData;

  const modules =
    (modulesQuery ??
      demoModules) as typeof demoModules;

  const watchlist =
    (Array.isArray(watchlistQuery)
      ? watchlistQuery
      : []) as WatchlistItem[];

  /* ----------------------------------------------------------
     LEARNING DATA
  ---------------------------------------------------------- */

  const totalLessons = modules.reduce(
    (sum, module) =>
      sum +
      (module.lesson_count ??
        module.lessons?.length ??
        0),
    0
  );

  const completedLessons = modules.reduce(
    (sum, module) =>
      sum +
      (module.completed_count ?? 0),
    0
  );

  const overallProgress =
    totalLessons > 0
      ? Math.round(
          (completedLessons /
            totalLessons) *
            100
        )
      : 0;

  const currentModule =
    modules.find(
      (module) =>
        (module.completed_count ?? 0) <
        (module.lesson_count ??
          module.lessons?.length ??
          0)
    ) ?? modules[0];

  const currentLesson =
    currentModule?.lessons?.find(
      (lesson) => !lesson.completed
    ) ??
    currentModule?.lessons?.[0];

  /* ----------------------------------------------------------
     FINANCIAL DATA
  ---------------------------------------------------------- */

  const portfolio =
    financialHealthSummary
      ? Number(financialHealthSummary.investments_value)
      : firstNumber(
          dashboard,
          [
            "current_portfolio",
            "portfolio_value",
            "investment_value",
            "investments",
            "corpus",
            "current_corpus",
          ]
        );

  const fiTarget = firstNumber(
    dashboard,
    [
      "fi_number",
      "fi_target",
      "financial_independence_target",
      "target_corpus",
    ]
  );

  const monthlyIncome =
    financialHealthSummary
      ? Number(financialHealthSummary.monthly_income)
      : firstNumber(
          dashboard,
          [
            "monthly_income",
            "income",
          ]
        );

  const monthlyExpenses =
    financialHealthSummary
      ? Number(financialHealthSummary.monthly_expenses)
      : firstNumber(
          dashboard,
          [
            "monthly_expenses",
            "expenses",
          ]
        );

  const monthlySavings =
    financialHealthSummary
      ? Number(financialHealthSummary.monthly_savings)
      : firstNumber(
          dashboard,
          [
            "monthly_savings",
            "savings",
          ],
          Math.max(
            0,
            monthlyIncome - monthlyExpenses
          )
        );

  const savingsRate =
    financialHealthSummary
      ? Number(financialHealthSummary.savings_rate)
      : monthlyIncome > 0
        ? (monthlySavings /
            monthlyIncome) *
          100
        : firstNumber(
            dashboard,
            [
              "savings_rate",
              "savings_percentage",
            ]
          );

  const fiProgress =
    fiTarget > 0
      ? Math.min(
          100,
          (portfolio / fiTarget) *
            100
        )
      : firstNumber(
          dashboard,
          [
            "fi_progress",
            "financial_independence_progress",
          ]
        );

  const estimatedFiAge = firstNumber(
    dashboard,
    [
      "estimated_fi_age",
      "fi_age",
      "financial_independence_age",
    ]
  );

  const estimatedFiYear = firstNumber(
    dashboard,
    [
      "estimated_fi_year",
      "fi_year",
    ]
  );

  const hasFinancialData =
    Boolean(financialHealthSummary) ||
    portfolio > 0 ||
    fiTarget > 0 ||
    monthlyIncome > 0 ||
    monthlyExpenses > 0;

  /* ----------------------------------------------------------
     FINANCIAL GOALS INTELLIGENCE
  ---------------------------------------------------------- */

  const financialGoals = (
    Array.isArray(financialGoalsQuery)
      ? financialGoalsQuery
      : []
  ) as DashboardGoal[];

  const goalsSummary = financialGoalsSummary;

  const goalMonthlyContribution = financialGoals.reduce(
    (sum, goal) =>
      sum + Math.max(0, Number(goal.monthly_contribution) || 0),
    0
  );

  const goalContributionCoverage =
    monthlySavings > 0
      ? Math.min(
          100,
          (goalMonthlyContribution / monthlySavings) * 100
        )
      : goalMonthlyContribution > 0
        ? 100
        : 0;

  const goalSavingsGap =
    monthlySavings - goalMonthlyContribution;

  const goalCapacityStatus =
    goalMonthlyContribution <= 0
      ? "not-configured"
      : goalSavingsGap >= 0
        ? "healthy"
        : "attention";

  const activeGoals =
    Number(goalsSummary?.active_goals) ||
    financialGoals.filter(
      (goal) =>
        (goal.status ?? "").toLowerCase() !== "completed"
    ).length;

  const completedGoals =
    Number(goalsSummary?.completed_goals) ||
    financialGoals.filter(
      (goal) =>
        (goal.status ?? "").toLowerCase() === "completed"
    ).length;

  const totalGoals =
    Number(goalsSummary?.total_goals) ||
    financialGoals.length;

  const goalProgress = Number(
    goalsSummary?.overall_progress_percent
  ) || 0;

  const goalRemaining = Number(
    goalsSummary?.total_remaining_amount
  ) || 0;

  const goalTarget = Number(
    goalsSummary?.total_target_amount
  ) || 0;

  const goalCurrent = Number(
    goalsSummary?.total_current_amount
  ) || 0;

  const goalsLoadingState =
    financialGoalsLoading &&
    !financialGoalsQuery &&
    financialGoalsSummaryLoading &&
    !financialGoalsSummary;

  /* ----------------------------------------------------------
     AI / DASHBOARD INSIGHT
  ---------------------------------------------------------- */

  const dashboardInsight =
    firstString(
      dashboard,
      [
        "ai_insight",
        "financial_insight",
        "insight",
        "recommendation",
        "message",
      ]
    );

  const insight =
    dashboardInsight ||
    (hasFinancialData
      ? savingsRate >= 35
        ? "Your savings rate is strong. Keep protecting your savings gap while investing consistently."
        : savingsRate >= 20
        ? "You have a solid foundation. Increasing your savings rate could meaningfully accelerate your financial goals."
        : "Your biggest opportunity right now is improving your monthly savings gap before depending heavily on investment returns."
      : "Start by setting up your budget and FI plan. FinPilot will turn those inputs into a clearer financial roadmap.");

  const dashboardLoadingState =
    (dashboardLoading &&
      !dashboardQuery) ||
    (financialHealthLoading &&
      !financialHealthSummary);

  const marketLoadingState =
    watchlistLoading &&
    !watchlistQuery;

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
            backgroundSize:
              "42px 42px",
            maskImage:
              "radial-gradient(circle at center, black 0%, transparent 78%)",
          }}
        />

        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-cyan-500/[0.055] blur-[120px]" />

        <div className="absolute right-[-180px] top-[20%] h-[480px] w-[480px] rounded-full bg-violet-500/[0.045] blur-[130px]" />

        <div className="absolute bottom-[-200px] left-[35%] h-[400px] w-[400px] rounded-full bg-emerald-500/[0.035] blur-[120px]" />
      </div>

      {/* ========================================================
          CONTENT
      ======================================================== */}

      <div className="relative mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <header>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />

                <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-emerald-300/80">
                  FinPilot Command Center
                </span>
              </div>

              <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl lg:text-[3.4rem]">
                Your financial{" "}
                <span className="bg-gradient-to-r from-cyan-300 via-white to-emerald-300 bg-clip-text text-transparent">
                  cockpit.
                </span>
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Track your financial progress, continue learning,
                explore markets, and turn financial knowledge into
                better decisions.
              </p>
            </div>

            <Link
              href="/financial-independence"
              className="group flex w-fit items-center gap-2 rounded-xl border border-orange-400/20 bg-orange-400/[0.07] px-4 py-2.5 text-xs font-semibold text-orange-200 transition-all duration-300 hover:border-orange-300/40 hover:bg-orange-400/[0.12]"
            >
              <Target className="h-4 w-4" />

              Plan Financial Independence

              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </header>

        {/* ======================================================
            FINANCIAL OVERVIEW
        ====================================================== */}

        <section>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-400/[0.07]">
              <Landmark className="h-4 w-4 text-emerald-300" />
            </div>

            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-emerald-300/70">
                Financial overview
              </p>

              <h2 className="mt-0.5 text-sm font-semibold text-white">
                Your money at a glance
              </h2>
            </div>
          </div>

          {!hasFinancialData &&
          !dashboardLoadingState ? (
            <GlassCard className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/15 bg-amber-400/[0.07]">
                    <CircleDollarSign className="h-5 w-5 text-amber-300" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-white">
                      Set up your financial profile
                    </p>

                    <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
                      Add your income, expenses and investments
                      through FinPilot&apos;s planning tools to unlock
                      personalized financial metrics here.
                    </p>
                  </div>
                </div>

                <Link
                  href="/budget"
                  className="inline-flex w-fit items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300"
                >
                  Set up budget
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </GlassCard>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <OverviewMetric
                icon={PiggyBank}
                label="Investment corpus"
                value={
                  dashboardLoadingState
                    ? "Loading..."
                    : formatCompactCurrency(
                        portfolio
                      )
                }
                description={
                  fiTarget > 0
                    ? `FI target ${formatCompactCurrency(
                        fiTarget
                      )}`
                    : "Current investment value"
                }
                tone="cyan"
              />

              <OverviewMetric
                icon={Target}
                label="FI progress"
                value={
                  dashboardLoadingState
                    ? "Loading..."
                    : `${fiProgress.toFixed(
                        1
                      )}%`
                }
                description={
                  fiTarget > 0
                    ? `${formatCompactCurrency(
                        Math.max(
                          0,
                          fiTarget -
                            portfolio
                        )
                      )} remaining`
                    : "Set an FI target"
                }
                tone="orange"
              />

              <OverviewMetric
                icon={Wallet}
                label="Monthly savings"
                value={
                  dashboardLoadingState
                    ? "Loading..."
                    : formatCurrency(
                        monthlySavings
                      )
                }
                description={`${savingsRate.toFixed(
                  1
                )}% savings rate`}
                tone="emerald"
              />

              <OverviewMetric
                icon={Clock3}
                label="Estimated FI"
                value={
                  dashboardLoadingState
                    ? "Loading..."
                    : estimatedFiAge > 0
                    ? `Age ${estimatedFiAge}`
                    : estimatedFiYear > 0
                    ? `${estimatedFiYear}`
                    : "Not calculated"
                }
                description={
                  estimatedFiYear > 0
                    ? `Around ${estimatedFiYear}`
                    : "Open the FI Planner"
                }
                tone="violet"
              />
            </div>
          )}
        </section>

        {/* ======================================================
            GOALS INTELLIGENCE
        ====================================================== */}

        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.07]">
                <Target className="h-4 w-4 text-cyan-300" />
              </div>

              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-cyan-300/70">
                  Goals intelligence
                </p>

                <h2 className="mt-0.5 text-sm font-semibold text-white">
                  Turn savings into defined outcomes
                </h2>
              </div>
            </div>

            <Link
              href="/goals"
              className="group inline-flex items-center gap-1.5 text-[10px] font-semibold text-cyan-300"
            >
              Manage goals
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {goalsLoadingState ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-28 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03]"
                />
              ))}
            </div>
          ) : totalGoals === 0 ? (
            <GlassCard className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.07]">
                    <Target className="h-5 w-5 text-cyan-300" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-white">
                      No financial goals yet
                    </p>

                    <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
                      Define what you are saving for and FinPilot will
                      connect those goals with your monthly savings capacity.
                    </p>
                  </div>
                </div>

                <Link
                  href="/goals"
                  className="inline-flex w-fit items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300"
                >
                  Create a goal
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </GlassCard>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <OverviewMetric
                icon={Target}
                label="Goal progress"
                value={`${goalProgress.toFixed(1)}%`}
                description={`${activeGoals} active · ${completedGoals} completed`}
                tone="cyan"
              />

              <OverviewMetric
                icon={CircleDollarSign}
                label="Goal corpus"
                value={formatCompactCurrency(goalCurrent)}
                description={
                  goalTarget > 0
                    ? `${formatCompactCurrency(goalRemaining)} remaining`
                    : "Current goal funding"
                }
                tone="violet"
              />

              <OverviewMetric
                icon={Wallet}
                label="Monthly goal funding"
                value={formatCurrency(goalMonthlyContribution)}
                description={
                  monthlySavings > 0
                    ? `${goalContributionCoverage.toFixed(0)}% of monthly savings`
                    : "Monthly savings not configured"
                }
                tone="emerald"
              />

              <OverviewMetric
                icon={ShieldCheck}
                label="Savings capacity"
                value={
                  goalCapacityStatus === "healthy"
                    ? formatCurrency(goalSavingsGap)
                    : goalCapacityStatus === "attention"
                      ? formatCurrency(
                          Math.abs(goalSavingsGap)
                        )
                      : "Not set"
                }
                description={
                  goalCapacityStatus === "healthy"
                    ? "Savings remaining after goals"
                    : goalCapacityStatus === "attention"
                      ? "More goal funding than savings"
                      : "Add monthly goal contributions"
                }
                tone={
                  goalCapacityStatus === "attention"
                    ? "orange"
                    : "emerald"
                }
              />
            </div>
          )}

          {totalGoals > 0 && !goalsLoadingState && (
            <GlassCard className="mt-3 p-5">
              <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                        Funding progress
                      </p>

                      <p className="mt-1 text-sm font-semibold text-white">
                        {formatCompactCurrency(goalCurrent)} of{" "}
                        {formatCompactCurrency(goalTarget)}
                      </p>
                    </div>

                    <span className="text-xs font-semibold text-cyan-300">
                      {goalProgress.toFixed(1)}%
                    </span>
                  </div>

                  <div className="mt-3">
                    <ProgressBar value={goalProgress} />
                  </div>

                  <p className="mt-2 text-[10px] leading-5 text-slate-600">
                    {formatCompactCurrency(goalRemaining)} remains across
                    your active goal plan.
                  </p>
                </div>

                <div
                  className={[
                    "rounded-xl border p-4",
                    goalCapacityStatus === "attention"
                      ? "border-orange-400/15 bg-orange-400/[0.04]"
                      : "border-emerald-400/15 bg-emerald-400/[0.04]",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3">
                    <ShieldCheck
                      className={[
                        "mt-0.5 h-4 w-4 shrink-0",
                        goalCapacityStatus === "attention"
                          ? "text-orange-300"
                          : "text-emerald-300",
                      ].join(" ")}
                    />

                    <div>
                      <p className="text-xs font-semibold text-white">
                        {goalCapacityStatus === "attention"
                          ? "Goal funding needs attention"
                          : "Goal funding fits your savings"}
                      </p>

                      <p className="mt-1 text-[10px] leading-5 text-slate-500">
                        {goalCapacityStatus === "attention"
                          ? `Your planned goal contributions exceed monthly savings by ${formatCurrency(
                              Math.abs(goalSavingsGap)
                            )}. Review your goal contributions before committing to them.`
                          : goalCapacityStatus === "healthy"
                            ? `${formatCurrency(
                                goalSavingsGap
                              )} of monthly savings remains after planned goal contributions.`
                            : "Set monthly savings and goal contributions to see how your plan fits together."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Link
                href="/goals"
                className="mt-4 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition hover:border-cyan-400/20 hover:bg-white/[0.035]"
              >
                <span className="text-xs font-semibold text-slate-300">
                  Open Goals Intelligence
                </span>

                <ArrowRight className="h-4 w-4 text-slate-600" />
              </Link>
            </GlassCard>
          )}
        </section>

        {/* ======================================================
            FI PROGRESS + AI INSIGHT
        ====================================================== */}

        <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">

          <GlassCard className="overflow-hidden p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-orange-300/70">
                  Financial independence
                </p>

                <h2 className="mt-1 text-xl font-semibold text-white">
                  Your path to FI
                </h2>

                <p className="mt-2 max-w-xl text-xs leading-5 text-slate-500">
                  Your financial independence target shows how
                  your current position compares with the portfolio
                  required to support your planned lifestyle.
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-400/15 bg-orange-400/[0.07]">
                <Target className="h-5 w-5 text-orange-300" />
              </div>
            </div>

            <div className="mt-7">
              <div className="mb-2 flex items-end justify-between gap-4">
                <div>
                  <p className="text-3xl font-bold text-white">
                    {fiProgress.toFixed(1)}%
                  </p>

                  <p className="mt-1 text-[10px] text-slate-600">
                    FI progress
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-300">
                    {formatCompactCurrency(
                      portfolio
                    )}
                  </p>

                  <p className="text-[10px] text-slate-600">
                    of{" "}
                    {formatCompactCurrency(
                      fiTarget
                    )}
                  </p>
                </div>
              </div>

              <ProgressBar
                value={fiProgress}
              />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <DashboardMiniMetric
                label="Current corpus"
                value={formatCompactCurrency(
                  portfolio
                )}
              />

              <DashboardMiniMetric
                label="FI target"
                value={formatCompactCurrency(
                  fiTarget
                )}
              />

              <DashboardMiniMetric
                label="Monthly savings"
                value={formatCompactCurrency(
                  monthlySavings
                )}
              />
            </div>

            <Link
              href="/financial-independence"
              className="mt-5 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition hover:border-orange-400/20 hover:bg-white/[0.035]"
            >
              <span className="text-xs font-semibold text-slate-300">
                Open complete FI Planner
              </span>

              <ArrowRight className="h-4 w-4 text-slate-600" />
            </Link>
          </GlassCard>

          <GlassCard className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-purple-400/15 bg-purple-400/[0.07]">
                <Sparkles className="h-5 w-5 text-purple-300" />
              </div>

              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-purple-300/70">
                  FinPilot insight
                </p>

                <h2 className="mt-1 text-sm font-semibold text-white">
                  One thing to focus on
                </h2>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-purple-400/10 bg-purple-400/[0.04] p-4">
              <p className="text-sm leading-6 text-slate-300">
                {insight}
              </p>
            </div>

            <div className="mt-5 space-y-3">
              <InsightLine
                icon={ShieldCheck}
                title="Savings rate"
                value={`${savingsRate.toFixed(
                  1
                )}%`}
              />

              <InsightLine
                icon={TrendingUp}
                title="Portfolio"
                value={formatCompactCurrency(
                  portfolio
                )}
              />

              <InsightLine
                icon={Target}
                title="FI progress"
                value={`${fiProgress.toFixed(
                  1
                )}%`}
              />
            </div>

            <Link
              href="/tutor"
              className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-purple-400/15 bg-purple-400/[0.06] px-4 py-3 text-xs font-semibold text-purple-200 transition hover:bg-purple-400/[0.1]"
            >
              <Bot className="h-4 w-4" />
              Discuss this with AI Tutor
            </Link>
          </GlassCard>
        </section>

        {/* ======================================================
            QUICK ACTIONS
        ====================================================== */}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction
            href="/financial-independence"
            icon={Target}
            title="Plan FI"
            description="Build your independence roadmap"
          />

          <QuickAction
            href="/calculator"
            icon={Calculator}
            title="Calculate"
            description="Model your financial scenarios"
          />

          <QuickAction
            href="/markets"
            icon={TrendingUp}
            title="Markets"
            description="Explore real market data"
          />

          <QuickAction
            href="/tutor"
            icon={Bot}
            title="Ask AI Tutor"
            description="Get financial concepts explained"
          />
        </section>

        {/* ======================================================
            MARKETS + LEARNING
        ====================================================== */}

        <section className="grid gap-5 lg:grid-cols-2">

          {/* WATCHLIST */}

          <GlassCard className="p-5 sm:p-6">
            <SectionHeader
              eyebrow="Markets"
              title="Your watchlist"
              icon={TrendingUp}
            />

            {marketLoadingState ? (
              <div className="space-y-2">
                {[1, 2, 3].map(
                  (item) => (
                    <div
                      key={item}
                      className="h-14 animate-pulse rounded-xl bg-white/[0.04]"
                    />
                  )
                )}
              </div>
            ) : (
              <WatchlistPreview
                items={watchlist}
              />
            )}
          </GlassCard>

          {/* CONTINUE LEARNING */}

          <GlassCard className="p-5 sm:p-6">
            <SectionHeader
              eyebrow="Continue learning"
              title="Pick up where you left off"
              icon={PlayCircle}
            />

            {modulesLoading && !modulesQuery ? (
              <div className="h-32 animate-pulse rounded-xl bg-white/[0.04]" />
            ) : currentModule &&
              currentLesson ? (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.07]">
                    <BookOpen className="h-5 w-5 text-cyan-300" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-cyan-300/70">
                      {currentModule.title}
                    </p>

                    <h3 className="mt-1 text-sm font-semibold text-white">
                      {currentLesson.title}
                    </h3>

                    <p className="mt-1 text-[10px] text-slate-600">
                      {currentModule.completed_count ??
                        0}{" "}
                      of{" "}
                      {currentModule.lesson_count ??
                        currentModule.lessons?.length ??
                        0}{" "}
                      lessons completed
                    </p>
                  </div>
                </div>

                <Link
                  href={`/learn/${currentModule.slug}/${currentLesson.slug}`}
                  className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300"
                >
                  Continue Lesson
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-center">
                <p className="text-sm font-medium text-white">
                  Your learning library is ready.
                </p>

                <Link
                  href="/learn"
                  className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-cyan-300"
                >
                  Browse lessons
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </GlassCard>
        </section>

        {/* ======================================================
            LEARNING PROGRESS
        ====================================================== */}

        <section>
          <GlassCard className="p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-400/[0.07]">
                  <GraduationCap className="h-5 w-5 text-emerald-300" />
                </div>

                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-emerald-300/70">
                    Learning progress
                  </p>

                  <h2 className="mt-1 text-lg font-semibold text-white">
                    {overallProgress}% of your curriculum
                  </h2>

                  <p className="mt-1 text-xs text-slate-600">
                    {completedLessons} of{" "}
                    {totalLessons} lessons completed
                  </p>
                </div>
              </div>

              <div className="w-full max-w-md">
                <div className="mb-2 flex justify-between text-[10px]">
                  <span className="text-slate-600">
                    Overall progress
                  </span>

                  <span className="font-semibold text-emerald-300">
                    {overallProgress}%
                  </span>
                </div>

                <ProgressBar
                  value={overallProgress}
                />
              </div>

              <Link
                href="/learn"
                className="flex w-fit shrink-0 items-center gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.06] px-4 py-2.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/[0.1]"
              >
                Open Learning
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </GlassCard>
        </section>

        {/* ======================================================
            CURRICULUM
        ====================================================== */}

        <section>
          <SectionHeader
            eyebrow="Finance curriculum"
            title="Continue building financial knowledge"
            icon={GraduationCap}
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {modules
              .slice(0, 6)
              .map((module) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                />
              ))}
          </div>

          {modules.length > 6 && (
            <div className="mt-4 flex justify-center">
              <Link
                href="/learn"
                className="group inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-5 py-3 text-xs font-semibold text-slate-400 transition hover:border-cyan-400/20 hover:text-cyan-300"
              >
                View complete curriculum
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          )}
        </section>

        {/* ======================================================
            TOOLS
        ====================================================== */}

        <section className="grid gap-5 lg:grid-cols-2">

          <GlassCard className="p-5 sm:p-6">
            <SectionHeader
              eyebrow="Financial tools"
              title="Turn knowledge into action"
              icon={Calculator}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <ToolCard
                href="/calculator"
                icon={Calculator}
                title="Financial Calculator"
                description="Calculate returns, SIPs and financial scenarios."
              />

              <ToolCard
                href="/financial-independence"
                icon={Target}
                title="FI Planner"
                description="Build and stress-test your independence plan."
              />

              <ToolCard
                href="/budget"
                icon={Wallet}
                title="Budget Planner"
                description="Organize income, spending and savings."
              />

              <ToolCard
                href="/watchlist"
                icon={LineChart}
                title="Watchlist"
                description="Track companies and market instruments."
              />
            </div>
          </GlassCard>

          <GlassCard className="p-5 sm:p-6">
            <SectionHeader
              eyebrow="Learning + AI"
              title="Learn with FinPilot"
              icon={Bot}
            />

            <div className="space-y-3">
              <FeatureRow
                href="/learn"
                icon={BookOpen}
                title="Structured learning"
                description="Build financial knowledge from fundamentals to advanced topics."
              />

              <FeatureRow
                href="/tutor"
                icon={Bot}
                title="AI financial tutor"
                description="Ask questions and get concepts explained in simpler terms."
              />

              <FeatureRow
                href="/glossary"
                icon={GraduationCap}
                title="Finance glossary"
                description="Quickly understand unfamiliar financial terminology."
              />
            </div>
          </GlassCard>
        </section>

        {/* ======================================================
            EDUCATIONAL NOTICE
        ====================================================== */}

        <section className="rounded-2xl border border-blue-400/10 bg-blue-400/[0.025] p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />

            <div>
              <p className="text-xs font-semibold text-slate-300">
                Dashboard data note
              </p>

              <p className="mt-1 text-[10px] leading-5 text-slate-600">
                FinPilot uses the connected backend wherever data is
                available. Areas that have not yet been configured use
                safe empty states rather than pretending that generated
                numbers are real financial data.
              </p>
            </div>
          </div>
        </section>

        {/* ======================================================
            FOOTER
        ====================================================== */}

        <footer className="flex flex-col gap-2 border-t border-white/[0.05] py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

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

/* ============================================================
   MINI METRIC
============================================================ */

function DashboardMiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/10 p-3">
      <p className="text-[9px] uppercase tracking-wider text-slate-600">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-white">
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   INSIGHT LINE
============================================================ */

function InsightLine({
  icon: Icon,
  title,
  value,
}: {
  icon: React.ElementType;
  title: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.018] p-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04]">
        <Icon className="h-4 w-4 text-slate-400" />
      </div>

      <span className="flex-1 text-xs text-slate-500">
        {title}
      </span>

      <span className="text-xs font-semibold text-white">
        {value}
      </span>
    </div>
  );
}

/* ============================================================
   TOOL CARD
============================================================ */

function ToolCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-white/[0.06] bg-white/[0.018] p-4 transition hover:border-cyan-400/20 hover:bg-white/[0.035]"
    >
      <Icon className="h-5 w-5 text-cyan-300 transition-transform group-hover:scale-110" />

      <p className="mt-4 text-xs font-semibold text-white">
        {title}
      </p>

      <p className="mt-1 text-[10px] leading-4 text-slate-600">
        {description}
      </p>
    </Link>
  );
}

/* ============================================================
   FEATURE ROW
============================================================ */

function FeatureRow({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.018] p-3 transition hover:border-cyan-400/15 hover:bg-white/[0.035]"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-200">
          {title}
        </p>

        <p className="mt-0.5 text-[10px] leading-4 text-slate-600">
          {description}
        </p>
      </div>

      <ChevronRight className="h-4 w-4 text-slate-700 transition-transform group-hover:translate-x-1 group-hover:text-cyan-300" />
    </Link>
  );
}
