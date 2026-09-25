"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  IndianRupee,
  Loader2,
  Target,
  TrendingUp,
  Wallet,
  AlertTriangle,
  CircleDollarSign,
} from "lucide-react";

import {
  useFinancialGoal,
  useFinancialGoalAnalysis,
} from "@/hooks/useApi";

function formatCurrency(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatCompactCurrency(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    return "₹0";
  }

  if (Math.abs(amount) >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }

  if (Math.abs(amount) >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }

  if (Math.abs(amount) >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }

  return formatCurrency(amount);
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "No target date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function titleCase(value: string | null | undefined) {
  if (!value) {
    return "General";
  }

  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.07] bg-white/[0.025] shadow-[0_20px_70px_-35px_rgba(0,0,0,0.8)] ${className}`}
    >
      {children}
    </div>
  );
}

function ProgressBar({
  progress,
  compact = false,
}: {
  progress: number;
  compact?: boolean;
}) {
  const safeProgress = Math.min(100, Math.max(0, progress));

  return (
    <div
      className={`overflow-hidden rounded-full bg-white/[0.06] ${
        compact ? "h-1.5" : "h-2.5"
      }`}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-emerald-300 transition-all"
        style={{ width: `${safeProgress}%` }}
      />
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: typeof Target;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {label}
          </p>

          <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.07]">
          <Icon className="h-5 w-5 text-cyan-300" />
        </div>
      </div>
    </GlassCard>
  );
}

export default function GoalDetailPage() {
  const params = useParams();
  const router = useRouter();

  const rawGoalId = params?.goalId;

  const goalId =
    typeof rawGoalId === "string"
      ? rawGoalId
      : Array.isArray(rawGoalId)
        ? rawGoalId[0]
        : "";

  const goalQuery = useFinancialGoal(goalId);
  const analysisQuery = useFinancialGoalAnalysis(goalId);

  const goal = goalQuery.data;
  const analysis = analysisQuery.data;

  const isLoading =
    goalQuery.isLoading ||
    analysisQuery.isLoading;

  const error =
    goalQuery.error ||
    analysisQuery.error;

  if (!goalId) {
    return (
      <main className="min-h-screen bg-[#05070b] px-4 py-8 text-white">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/goals"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to goals
          </Link>

          <div className="mt-8 rounded-2xl border border-red-400/15 bg-red-400/[0.05] p-6">
            <h1 className="text-lg font-semibold">
              Goal not found
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              The requested financial goal could not be identified.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#05070b] px-4 py-8 text-white">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/goals"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to goals
          </Link>

          <div className="mt-8 flex min-h-[420px] items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.025]">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-300" />

              <p className="mt-4 text-sm font-medium text-slate-300">
                Building your goal analysis...
              </p>

              <p className="mt-1 text-xs text-slate-600">
                FinPilot is calculating progress and target requirements.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !goal || !analysis) {
    return (
      <main className="min-h-screen bg-[#05070b] px-4 py-8 text-white">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/goals"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to goals
          </Link>

          <div className="mt-8 rounded-2xl border border-red-400/15 bg-red-400/[0.05] p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />

              <div>
                <h1 className="text-lg font-semibold">
                  Unable to load this goal
                </h1>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  FinPilot could not retrieve the goal analysis right now.
                  Please return to the Goals page and try again.
                </p>

                <Link
                  href="/goals"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.09]"
                >
                  Return to Goals
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const progress = Number(analysis.progress_percent ?? 0);
  const target = Number(analysis.target_amount ?? 0);
  const current = Number(analysis.current_amount ?? 0);
  const remaining = Number(analysis.remaining_amount ?? 0);
  const contribution = Number(
    analysis.monthly_contribution ?? 0
  );
  const requiredContribution = Number(
    analysis.required_monthly_contribution ?? 0
  );

  const monthsRemaining =
    analysis.months_remaining === null ||
    analysis.months_remaining === undefined
      ? null
      : Number(analysis.months_remaining);

  const completed =
    Boolean(analysis.completed) ||
    goal.status === "completed";

  const onTrack = Boolean(analysis.on_track);

  const contributionGap = Math.max(
    0,
    requiredContribution - contribution
  );

  return (
    <main className="min-h-screen bg-[#05070b] px-4 py-7 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href="/goals"
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              All financial goals
            </Link>

            <div className="mt-5 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.07]">
                {completed ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-300" />
                ) : (
                  <Target className="h-6 w-6 text-cyan-300" />
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300/70">
                    {titleCase(goal.category)}
                  </p>

                  <span
                    className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] ${
                      completed
                        ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300"
                        : onTrack
                          ? "border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-300"
                          : "border-orange-400/20 bg-orange-400/[0.07] text-orange-300"
                    }`}
                  >
                    {completed
                      ? "Completed"
                      : onTrack
                        ? "On track"
                        : "Needs attention"}
                  </span>
                </div>

                <h1 className="mt-1 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  {goal.name}
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Track your progress, understand the monthly requirement,
                  and see whether your current contribution is sufficient
                  for the target date.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push("/goals")}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08]"
          >
            <Edit3 className="h-4 w-4" />
            Manage goal
          </button>
        </div>

        {/* HERO PROGRESS */}
        <GlassCard className="mt-7 overflow-hidden p-5 sm:p-7">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Goal progress
                  </p>

                  <p className="mt-2 text-5xl font-bold tracking-[-0.05em] text-white">
                    {progress.toFixed(1)}%
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-500">
                    Current
                  </p>

                  <p className="mt-1 text-lg font-semibold text-white">
                    {formatCompactCurrency(current)}
                  </p>

                  <p className="mt-1 text-[11px] text-slate-600">
                    of {formatCompactCurrency(target)}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <ProgressBar progress={progress} />
              </div>

              <div className="mt-3 flex justify-between gap-4 text-[11px] text-slate-600">
                <span>
                  {formatCompactCurrency(current)} accumulated
                </span>

                <span>
                  {formatCompactCurrency(remaining)} remaining
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:w-[390px]">
              <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                <p className="text-[9px] uppercase tracking-[0.15em] text-slate-600">
                  Target
                </p>

                <p className="mt-2 text-sm font-semibold text-white">
                  {formatCompactCurrency(target)}
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                <p className="text-[9px] uppercase tracking-[0.15em] text-slate-600">
                  Remaining
                </p>

                <p className="mt-2 text-sm font-semibold text-white">
                  {formatCompactCurrency(remaining)}
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                <p className="text-[9px] uppercase tracking-[0.15em] text-slate-600">
                  Monthly
                </p>

                <p className="mt-2 text-sm font-semibold text-white">
                  {formatCompactCurrency(contribution)}
                </p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* METRICS */}
        <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={CircleDollarSign}
            label="Current amount"
            value={formatCompactCurrency(current)}
            description="Already allocated toward this goal"
          />

          <MetricCard
            icon={Wallet}
            label="Monthly contribution"
            value={formatCompactCurrency(contribution)}
            description="Your current planned contribution"
          />

          <MetricCard
            icon={TrendingUp}
            label="Required monthly"
            value={
              requiredContribution > 0
                ? formatCompactCurrency(requiredContribution)
                : completed
                  ? "Completed"
                  : "Not calculated"
            }
            description={
              requiredContribution > 0
                ? "Estimated contribution needed"
                : "Target date is not available"
            }
          />

          <MetricCard
            icon={CalendarDays}
            label="Target date"
            value={formatDate(analysis.target_date)}
            description={
              monthsRemaining !== null
                ? `${monthsRemaining} month${monthsRemaining === 1 ? "" : "s"} remaining`
                : "No deadline configured"
            }
          />
        </section>

        {/* INTELLIGENCE */}
        <section className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <GlassCard className="p-5 sm:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.07]">
                <TrendingUp className="h-5 w-5 text-cyan-300" />
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300/70">
                  Goal intelligence
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  {completed
                    ? "Goal successfully completed"
                    : onTrack
                      ? "Your contribution is on track"
                      : "Your contribution needs attention"}
                </h2>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/[0.06] bg-black/20 p-5">
              {completed ? (
                <p className="text-sm leading-7 text-slate-300">
                  You have reached the target amount for this goal.
                  FinPilot has marked it as completed.
                </p>
              ) : analysis.target_date ? (
                onTrack ? (
                  <p className="text-sm leading-7 text-slate-300">
                    Your current monthly contribution of{" "}
                    <span className="font-semibold text-white">
                      {formatCompactCurrency(contribution)}
                    </span>{" "}
                    is at or above the estimated{" "}
                    <span className="font-semibold text-white">
                      {formatCompactCurrency(requiredContribution)}
                    </span>{" "}
                    monthly contribution required to reach this goal by{" "}
                    <span className="font-semibold text-white">
                      {formatDate(analysis.target_date)}
                    </span>
                    .
                  </p>
                ) : (
                  <p className="text-sm leading-7 text-slate-300">
                    Your current contribution of{" "}
                    <span className="font-semibold text-white">
                      {formatCompactCurrency(contribution)}
                    </span>{" "}
                    is approximately{" "}
                    <span className="font-semibold text-orange-300">
                      {formatCompactCurrency(contributionGap)}
                    </span>{" "}
                    below the estimated monthly contribution required to
                    reach the target by{" "}
                    <span className="font-semibold text-white">
                      {formatDate(analysis.target_date)}
                    </span>
                    .
                  </p>
                )
              ) : (
                <p className="text-sm leading-7 text-slate-300">
                  This goal does not currently have a target date. Your
                  planned contribution is being tracked, but FinPilot
                  cannot determine a deadline-based monthly requirement
                  until a target date is configured.
                </p>
              )}
            </div>

            {!completed && requiredContribution > 0 && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="text-[9px] uppercase tracking-[0.15em] text-slate-600">
                    Current monthly
                  </p>

                  <p className="mt-2 text-lg font-semibold text-white">
                    {formatCurrency(contribution)}
                  </p>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="text-[9px] uppercase tracking-[0.15em] text-slate-600">
                    Required monthly
                  </p>

                  <p className="mt-2 text-lg font-semibold text-cyan-300">
                    {formatCurrency(requiredContribution)}
                  </p>
                </div>
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-5 sm:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-orange-400/15 bg-orange-400/[0.07]">
                <Clock3 className="h-5 w-5 text-orange-300" />
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-300/70">
                  Timeline
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  Target timeline
                </h2>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-slate-600">
                    Target date
                  </p>

                  <p className="mt-1 text-sm font-semibold text-white">
                    {formatDate(analysis.target_date)}
                  </p>
                </div>

                <CalendarDays className="h-5 w-5 text-slate-500" />
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-slate-600">
                    Time remaining
                  </p>

                  <p className="mt-1 text-sm font-semibold text-white">
                    {monthsRemaining !== null
                      ? `${monthsRemaining} month${monthsRemaining === 1 ? "" : "s"}`
                      : "No deadline"}
                  </p>
                </div>

                <Clock3 className="h-5 w-5 text-slate-500" />
              </div>

              <div
                className={`rounded-xl border p-4 ${
                  completed
                    ? "border-emerald-400/15 bg-emerald-400/[0.05]"
                    : onTrack
                      ? "border-cyan-400/15 bg-cyan-400/[0.05]"
                      : "border-orange-400/15 bg-orange-400/[0.05]"
                }`}
              >
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Status
                </p>

                <p
                  className={`mt-2 text-sm font-semibold ${
                    completed
                      ? "text-emerald-300"
                      : onTrack
                        ? "text-cyan-300"
                        : "text-orange-300"
                  }`}
                >
                  {completed
                    ? "Completed"
                    : onTrack
                      ? "On track"
                      : "Contribution needs attention"}
                </p>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* TARGET BREAKDOWN */}
        <section className="mt-5">
          <GlassCard className="p-5 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Capital breakdown
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  How far you are from the target
                </h2>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <IndianRupee className="h-4 w-4" />
                INR
              </div>
            </div>

            <div className="mt-7 grid gap-5 md:grid-cols-3">
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Current
                  </span>

                  <span className="font-semibold text-white">
                    {formatCurrency(current)}
                  </span>
                </div>

                <div className="mt-3">
                  <ProgressBar
                    progress={
                      target > 0
                        ? (current / target) * 100
                        : 0
                    }
                    compact
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Remaining
                  </span>

                  <span className="font-semibold text-white">
                    {formatCurrency(remaining)}
                  </span>
                </div>

                <div className="mt-3">
                  <ProgressBar
                    progress={
                      target > 0
                        ? (remaining / target) * 100
                        : 0
                    }
                    compact
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Completion
                  </span>

                  <span className="font-semibold text-white">
                    {progress.toFixed(1)}%
                  </span>
                </div>

                <div className="mt-3">
                  <ProgressBar
                    progress={progress}
                    compact
                  />
                </div>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* NOTES */}
        {goal.notes && (
          <section className="mt-5">
            <GlassCard className="p-5 sm:p-7">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Your notes
              </p>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-400">
                {goal.notes}
              </p>
            </GlassCard>
          </section>
        )}

        {/* EDUCATIONAL NOTICE */}
        <div className="mt-5 rounded-2xl border border-white/[0.06] bg-white/[0.018] p-5">
          <div className="flex items-start gap-3">
            <Target className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300/70" />

            <p className="text-[11px] leading-6 text-slate-600">
              Goal analysis is based on the amounts and target dates you
              provide. Required monthly contributions are planning
              calculations, not guaranteed investment returns or financial
              advice.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}