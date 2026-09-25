"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  IndianRupee,
  Loader2,
  Plus,
  Target,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  useCreateFinancialGoal,
  useDeleteFinancialGoal,
  useUpdateFinancialGoal,
  useFinancialGoals,
  useFinancialGoalsSummary,
  useFinancialHealthSummary,
} from "@/hooks/useApi";

const CATEGORIES = [
  { value: "emergency", label: "Emergency Fund" },
  { value: "home", label: "Home" },
  { value: "vehicle", label: "Vehicle" },
  { value: "education", label: "Education" },
  { value: "travel", label: "Travel" },
  { value: "retirement", label: "Retirement" },
  { value: "investment", label: "Investment" },
  { value: "general", label: "General" },
];

function formatCurrency(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatCompactCurrency(
  value: string | number | null | undefined,
) {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    return "â‚¹0";
  }

  if (Math.abs(amount) >= 10000000) {
    return `â‚¹${(amount / 10000000).toFixed(2)} Cr`;
  }

  if (Math.abs(amount) >= 100000) {
    return `â‚¹${(amount / 100000).toFixed(2)} L`;
  }

  if (Math.abs(amount) >= 1000) {
    return `â‚¹${(amount / 1000).toFixed(1)}K`;
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

function ProgressBar({ progress }: { progress: number }) {
  const safeProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
      <div
        className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-emerald-300 transition-all"
        style={{ width: `${safeProgress}%` }}
      />
    </div>
  );
}

export default function GoalsPage() {
  const goalsQuery = useFinancialGoals();
  const summaryQuery = useFinancialGoalsSummary();
  const healthQuery = useFinancialHealthSummary();

  const createGoal = useCreateFinancialGoal();
  const updateGoal = useUpdateFinancialGoal();
  const deleteGoal = useDeleteFinancialGoal();

  const [showCreate, setShowCreate] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("general");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [priority, setPriority] = useState("3");
  const [notes, setNotes] = useState("");

  const goals = useMemo(
    () => goalsQuery.data ?? [],
    [goalsQuery.data],
  );

  const health = healthQuery.data;

  const monthlyIncome = Number(health?.monthly_income ?? 0);
  const monthlyExpenses = Number(health?.monthly_expenses ?? 0);
  const monthlySavings = Number(health?.monthly_savings ?? 0);

  const totalGoalContribution = useMemo(
    () =>
      goals.reduce(
        (sum, goal) =>
          sum + Number(goal.monthly_contribution ?? 0),
        0,
      ),
    [goals],
  );

  const contributionCoverage =
    monthlySavings > 0
      ? Math.min(
          100,
          (totalGoalContribution / monthlySavings) * 100,
        )
      : 0;

  const remainingSavingsAfterGoals =
    monthlySavings - totalGoalContribution;

  const healthConfigured =
    Boolean(health) &&
    (monthlyIncome > 0 ||
      monthlyExpenses > 0 ||
      monthlySavings > 0);

  const overallProgress = Number(
    summaryQuery.data?.overall_progress_percent ?? 0,
  );

  const startEditing = (goal: (typeof goals)[number]) => {
    setEditingGoalId(goal.id);
    setName(goal.name ?? "");
    setCategory(goal.category ?? "general");
    setTargetAmount(String(goal.target_amount ?? ""));
    setCurrentAmount(String(goal.current_amount ?? ""));
    setMonthlyContribution(String(goal.monthly_contribution ?? ""));
    setTargetDate(goal.target_date ?? "");
    setPriority(String(goal.priority ?? 3));
    setNotes(goal.notes ?? "");
    setShowCreate(true);
  };

  const resetForm = () => {
    setName("");
    setCategory("general");
    setTargetAmount("");
    setCurrentAmount("");
    setMonthlyContribution("");
    setTargetDate("");
    setPriority("3");
    setNotes("");
    setEditingGoalId(null);
  };

  const handleCreate = async () => {
    const parsedTarget = Number(targetAmount);
    const parsedCurrent = Number(currentAmount || 0);
    const parsedContribution = Number(monthlyContribution || 0);
    const parsedPriority = Number(priority);

    if (!name.trim()) {
      return;
    }

    if (!Number.isFinite(parsedTarget) || parsedTarget <= 0) {
      return;
    }

    if (!Number.isFinite(parsedCurrent) || parsedCurrent < 0) {
      return;
    }

    if (
      !Number.isFinite(parsedContribution) ||
      parsedContribution < 0
    ) {
      return;
    }

    const payload = {
      name: name.trim(),
      category,
      target_amount: parsedTarget,
      current_amount: parsedCurrent,
      monthly_contribution: parsedContribution,
      target_date: targetDate || null,
      priority: Math.min(5, Math.max(1, parsedPriority || 3)),
      notes: notes.trim() || null,
    };

    if (editingGoalId) {
      await updateGoal.mutateAsync({
        goalId: editingGoalId,
        body: payload,
      });
    } else {
      await createGoal.mutateAsync(payload);
    }

    resetForm();
    setShowCreate(false);
  };

  const handleDelete = async (id: string) => {
    await deleteGoal.mutateAsync(id);
    setDeleteId(null);
  };

  return (
    <main className="min-h-screen bg-[#05070b] px-4 py-7 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-xs font-medium text-slate-500 transition hover:text-white"
            >
              â† Dashboard
            </Link>

            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300/70">
              Financial planning
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Your financial goals
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Turn your financial position into measurable targets and
              track the path toward them.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-slate-200"
          >
            <Plus className="h-4 w-4" />
            Add Goal
          </button>
        </div>

        {/* SUMMARY */}
        <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <GlassCard className="p-5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-600">
              Total goals
            </p>

            <p className="mt-3 text-3xl font-bold">
              {summaryQuery.data?.total_goals ?? goals.length}
            </p>

            <p className="mt-1 text-xs text-slate-600">
              All saved financial objectives
            </p>
          </GlassCard>

          <GlassCard className="p-5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-600">
              Active goals
            </p>

            <p className="mt-3 text-3xl font-bold">
              {summaryQuery.data?.active_goals ??
                goals.filter((goal) => goal.status !== "completed").length}
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Goals currently in progress
            </p>
          </GlassCard>

          <GlassCard className="p-5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-600">
              Remaining
            </p>

            <p className="mt-3 text-2xl font-bold">
              {formatCompactCurrency(
                summaryQuery.data?.total_remaining_amount,
              )}
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Capital still required
            </p>
          </GlassCard>

          <GlassCard className="p-5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-600">
              Overall progress
            </p>

            <p className="mt-3 text-3xl font-bold">
              {overallProgress.toFixed(1)}%
            </p>

            <div className="mt-3">
              <ProgressBar progress={overallProgress} />
            </div>
          </GlassCard>
        </section>

        {/* FINANCIAL HEALTH INTELLIGENCE */}
        <section className="mt-5">
          <GlassCard className="overflow-hidden p-5 sm:p-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-400/[0.07]">
                    <TrendingUp className="h-5 w-5 text-emerald-300" />
                  </div>

                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-emerald-300/70">
                      Financial health â†’ goals
                    </p>

                    <h2 className="mt-1 text-xl font-semibold">
                      Can your current savings support these goals?
                    </h2>
                  </div>
                </div>

                {healthConfigured ? (
                  <p className="mt-4 text-sm leading-6 text-slate-400">
                    FinPilot is comparing your current monthly savings
                    with the contributions assigned across your goals.
                    This creates a simple cash-flow check before you
                    commit to additional targets.
                  </p>
                ) : (
                  <p className="mt-4 text-sm leading-6 text-slate-400">
                    Set up your Financial Health profile first so
                    FinPilot can compare your savings capacity with
                    your goal contributions.
                  </p>
                )}
              </div>

              {!healthConfigured && (
                <Link
                  href="/financial-health"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-2.5 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/[0.1]"
                >
                  Set up Financial Health
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>

            {healthConfigured && (
              <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-cyan-300" />

                    <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-600">
                      Monthly income
                    </p>
                  </div>

                  <p className="mt-3 text-lg font-semibold text-white">
                    {formatCurrency(monthlyIncome)}
                  </p>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2">
                    <CircleDollarSign className="h-4 w-4 text-orange-300" />

                    <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-600">
                      Monthly expenses
                    </p>
                  </div>

                  <p className="mt-3 text-lg font-semibold text-white">
                    {formatCurrency(monthlyExpenses)}
                  </p>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-emerald-300" />

                    <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-600">
                      Monthly savings
                    </p>
                  </div>

                  <p className="mt-3 text-lg font-semibold text-white">
                    {formatCurrency(monthlySavings)}
                  </p>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-cyan-300" />

                    <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-600">
                      Goal contributions
                    </p>
                  </div>

                  <p className="mt-3 text-lg font-semibold text-white">
                    {formatCurrency(totalGoalContribution)}
                  </p>
                </div>
              </div>
            )}

            {healthConfigured && (
              <div className="mt-5 rounded-xl border border-white/[0.06] bg-black/20 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-300">
                      Goal contribution coverage
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-slate-600">
                      How much of your current monthly savings is already
                      assigned to financial goals.
                    </p>
                  </div>

                  <p
                    className={`text-xl font-bold ${
                      contributionCoverage > 100
                        ? "text-orange-300"
                        : "text-emerald-300"
                    }`}
                  >
                    {contributionCoverage.toFixed(1)}%
                  </p>
                </div>

                <div className="mt-4">
                  <ProgressBar progress={contributionCoverage} />
                </div>

                <div className="mt-4 flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-slate-600">
                    Assigned to goals:{" "}
                    <span className="text-slate-400">
                      {formatCurrency(totalGoalContribution)}
                    </span>
                  </span>

                  <span
                    className={
                      remainingSavingsAfterGoals >= 0
                        ? "text-emerald-300"
                        : "text-orange-300"
                    }
                  >
                    {remainingSavingsAfterGoals >= 0
                      ? `${formatCurrency(
                          remainingSavingsAfterGoals,
                        )} remains unassigned`
                      : `${formatCurrency(
                          Math.abs(remainingSavingsAfterGoals),
                        )} above current savings capacity`}
                  </span>
                </div>
              </div>
            )}

            {healthConfigured &&
              remainingSavingsAfterGoals < 0 && (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-orange-400/15 bg-orange-400/[0.05] p-4">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" />

                  <p className="text-xs leading-5 text-orange-200/80">
                    Your current goal contributions exceed the monthly
                    savings recorded in Financial Health. Consider
                    reviewing your contributions or expenses before
                    adding another recurring commitment.
                  </p>
                </div>
              )}
          </GlassCard>
        </section>

        {/* GOALS */}
        <section className="mt-7">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                Objectives
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                Your goals
              </h2>
            </div>

            <p className="text-xs text-slate-600">
              {goals.length} goal{goals.length === 1 ? "" : "s"}
            </p>
          </div>

          {goalsQuery.isLoading ? (
            <GlassCard className="flex min-h-[300px] items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-7 w-7 animate-spin text-cyan-300" />

                <p className="mt-3 text-sm text-slate-400">
                  Loading your goals...
                </p>
              </div>
            </GlassCard>
          ) : goalsQuery.error ? (
            <GlassCard className="p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-300" />

                <div>
                  <h3 className="font-semibold">
                    Unable to load goals
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Please refresh the page and try again.
                  </p>
                </div>
              </div>
            </GlassCard>
          ) : goals.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.07]">
                <Target className="h-7 w-7 text-cyan-300" />
              </div>

              <h3 className="mt-5 text-lg font-semibold">
                Start with your first financial goal
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Create a measurable objective such as an emergency
                fund, vehicle, education, travel, home, or retirement
                target.
              </p>

              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black"
              >
                <Plus className="h-4 w-4" />
                Create first goal
              </button>
            </GlassCard>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {goals.map((goal) => {
                const target = Number(goal.target_amount ?? 0);
                const current = Number(goal.current_amount ?? 0);

                const progress =
                  target > 0
                    ? Math.min(
                        100,
                        Math.max(0, (current / target) * 100),
                      )
                    : 0;

                const completed =
                  goal.status === "completed" || progress >= 100;

                return (
                  <GlassCard
                    key={goal.id}
                    className="p-5 transition hover:border-white/[0.12]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <Link
                        href={`/goals/${goal.id}`}
                        className="min-w-0 flex-1"
                      >
                        <div className="flex items-center gap-2">
                          {completed ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                          ) : (
                            <Target className="h-4 w-4 text-cyan-300" />
                          )}

                          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                            {titleCase(goal.category)}
                          </p>
                        </div>

                        <h3 className="mt-2 truncate text-lg font-semibold text-white">
                          {goal.name}
                        </h3>
                      </Link>

                      <span
                        className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] ${
                          completed
                            ? "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300"
                            : "border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-300"
                        }`}
                      >
                        {completed ? "Completed" : "Active"}
                      </span>
                    </div>

                    <Link
                      href={`/goals/${goal.id}`}
                      className="mt-5 block"
                    >
                      <div className="flex items-end justify-between gap-4">
                        <div>
                          <p className="text-2xl font-bold text-white">
                            {formatCompactCurrency(current)}
                          </p>

                          <p className="mt-1 text-[11px] text-slate-600">
                            of {formatCompactCurrency(target)}
                          </p>
                        </div>

                        <p className="text-sm font-semibold text-cyan-300">
                          {progress.toFixed(1)}%
                        </p>
                      </div>

                      <div className="mt-4">
                        <ProgressBar progress={progress} />
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div>
                          <p className="text-[9px] uppercase tracking-[0.12em] text-slate-600">
                            Monthly
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-300">
                            {formatCompactCurrency(
                              goal.monthly_contribution,
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-[9px] uppercase tracking-[0.12em] text-slate-600">
                            Target date
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-300">
                            {formatDate(goal.target_date)}
                          </p>
                        </div>

                        <div>
                          <p className="text-[9px] uppercase tracking-[0.12em] text-slate-600">
                            Priority
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-300">
                            {goal.priority}/5
                          </p>
                        </div>
                      </div>
                    </Link>

                    <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
                      <Link
                        href={`/goals/${goal.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-300 transition hover:text-cyan-200"
                      >
                        View analysis
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>

                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => startEditing(goal)}
                          className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-cyan-300"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteId(goal.id)}
                          className="inline-flex items-center gap-1.5 text-xs text-slate-600 transition hover:text-red-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </section>

        {/* EDUCATIONAL NOTICE */}
        <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.018] p-5">
          <div className="flex items-start gap-3">
            <Target className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300/70" />

            <p className="text-[11px] leading-6 text-slate-600">
              Goal planning is based on the financial information you
              provide. Contribution comparisons are planning tools and
              do not guarantee investment returns or future outcomes.
            </p>
          </div>
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#090c12] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-cyan-300/70">
                  {editingGoalId ? "Edit financial goal" : "New financial goal"}
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  {editingGoalId ? "Edit your goal" : "Create a goal"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowCreate(false);
                }}
                className="text-slate-500 transition hover:text-white"
              >
                âœ•
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="text-xs font-medium text-slate-400">
                  Goal name
                </span>

                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Emergency fund"
                  className="mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-cyan-400/30"
                />
              </label>

              <label>
                <span className="text-xs font-medium text-slate-400">
                  Category
                </span>

                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-white/[0.08] bg-[#0b0f16] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/30"
                >
                  {CATEGORIES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="text-xs font-medium text-slate-400">
                  Target amount
                </span>

                <input
                  type="number"
                  min="0"
                  value={targetAmount}
                  onChange={(event) =>
                    setTargetAmount(event.target.value)
                  }
                  placeholder="100000"
                  className="mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-cyan-400/30"
                />
              </label>

              <label>
                <span className="text-xs font-medium text-slate-400">
                  Current amount
                </span>

                <input
                  type="number"
                  min="0"
                  value={currentAmount}
                  onChange={(event) =>
                    setCurrentAmount(event.target.value)
                  }
                  placeholder="0"
                  className="mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-cyan-400/30"
                />
              </label>

              <label>
                <span className="text-xs font-medium text-slate-400">
                  Monthly contribution
                </span>

                <input
                  type="number"
                  min="0"
                  value={monthlyContribution}
                  onChange={(event) =>
                    setMonthlyContribution(event.target.value)
                  }
                  placeholder="5000"
                  className="mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-cyan-400/30"
                />
              </label>

              <label>
                <span className="text-xs font-medium text-slate-400">
                  Target date
                </span>

                <input
                  type="date"
                  value={targetDate}
                  onChange={(event) =>
                    setTargetDate(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/30"
                />
              </label>

              <label>
                <span className="text-xs font-medium text-slate-400">
                  Priority
                </span>

                <select
                  value={priority}
                  onChange={(event) =>
                    setPriority(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-white/[0.08] bg-[#0b0f16] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/30"
                >
                  <option value="1">1 â€” Highest</option>
                  <option value="2">2 â€” High</option>
                  <option value="3">3 â€” Normal</option>
                  <option value="4">4 â€” Low</option>
                  <option value="5">5 â€” Lowest</option>
                </select>
              </label>

              <label className="sm:col-span-2">
                <span className="text-xs font-medium text-slate-400">
                  Notes
                </span>

                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={4}
                  placeholder="Optional notes about this goal..."
                  className="mt-2 w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-cyan-400/30"
                />
              </label>
            </div>

            <div className="mt-6 rounded-xl border border-cyan-400/10 bg-cyan-400/[0.04] p-4">
              <p className="text-[11px] leading-5 text-slate-500">
                FinPilot will use the target amount, current amount,
                monthly contribution, and target date to calculate goal
                progress and required monthly funding.
              </p>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowCreate(false);
                }}
                className="rounded-xl border border-white/[0.08] px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  createGoal.isPending ||
                  updateGoal.isPending ||
                  !name.trim() ||
                  !targetAmount
                }
                onClick={handleCreate}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {(createGoal.isPending || updateGoal.isPending) && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                {editingGoalId ? "Save Changes" : "Create Goal"}
              </button>
            </div>

            {(createGoal.error || updateGoal.error) && (
              <p className="mt-4 text-center text-xs text-red-300">
                Unable to save the goal. Please check the values and try again.
              </p>
            )}
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#090c12] p-6 shadow-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-400/15 bg-red-400/[0.06]">
              <Trash2 className="h-5 w-5 text-red-300" />
            </div>

            <h2 className="mt-5 text-lg font-semibold">
              Delete this goal?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              This permanently removes the goal and its planning data.
              This action cannot be undone.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="rounded-xl border border-white/[0.08] px-4 py-2.5 text-sm text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleteGoal.isPending}
                onClick={() => handleDelete(deleteId)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-400 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-red-300 disabled:opacity-50"
              >
                {deleteGoal.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                Delete Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
