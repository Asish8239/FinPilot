"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  format,
  isSameMonth,
  parseISO,
  subMonths,
} from "date-fns";

import {
  useBudget,
  useCreateBudget,
  useAddBudgetEntry,
  useUpdateBudgetEntry,
  useDeleteBudgetEntry,
} from "@/hooks/useApi";

import { api } from "@/lib/api";
import { formatLakh, formatCurrency } from "@/lib/utils";

import {
  Wallet,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Receipt,
  CircleDollarSign,
  AlertCircle,
  Target,
  IndianRupee,
  MoreHorizontal,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  History,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import type { BudgetPlan } from "@/types";

const CATEGORIES = [
  "needs",
  "wants",
  "savings",
  "investments",
] as const;

type Category = (typeof CATEGORIES)[number];

const CATEGORY_CONFIG: Record<
  Category,
  {
    label: string;
    description: string;
    color: string;
    bg: string;
    text: string;
    border: string;
    icon: string;
  }
> = {
  needs: {
    label: "Needs",
    description: "Essential monthly expenses",
    color: "#3b82f6",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/20",
    icon: "bg-blue-500",
  },

  wants: {
    label: "Wants",
    description: "Lifestyle and discretionary spending",
    color: "#f59e0b",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
    icon: "bg-amber-500",
  },

  savings: {
    label: "Savings",
    description: "Emergency fund and savings goals",
    color: "#10b981",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
    icon: "bg-emerald-500",
  },

  investments: {
    label: "Investments",
    description: "Long-term wealth building",
    color: "#8b5cf6",
    bg: "bg-violet-500/10",
    text: "text-violet-400",
    border: "border-violet-500/20",
    icon: "bg-violet-500",
  },
};

type HistoryItem = {
  month: string;
  plan: BudgetPlan | null;
};

export default function BudgetPage() {
  const today = new Date();
  const currentMonth = format(today, "yyyy-MM");

  /*
   * Selected month.
   *
   * Previously this page always used the current month.
   * Now the user can move backward and forward through months.
   */
  const [selectedMonth, setSelectedMonth] =
    useState(currentMonth);

  const {
    data: plan,
    isLoading,
    error,
    refetch,
  } = useBudget(selectedMonth) as {
    data: BudgetPlan | null | undefined;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<unknown>;
  };

  const createBudget = useCreateBudget();
  const addEntry = useAddBudgetEntry();
  const updateEntry = useUpdateBudgetEntry();
  const deleteEntry = useDeleteBudgetEntry();

  const [income, setIncome] = useState("");
  const [showForm, setShowForm] =
    useState<Category | null>(null);

  const [newLabel, setNewLabel] = useState("");
  const [newBudgeted, setNewBudgeted] = useState("");

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [editActual, setEditActual] = useState("");

  const [deleteConfirm, setDeleteConfirm] =
    useState<string | null>(null);

  /*
   * Historical monthly budgets.
   *
   * We load the most recent 12 months so the user can see
   * spending and savings across months.
   */
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] =
    useState(true);

  async function loadHistory() {
    setHistoryLoading(true);

    const months: string[] = [];

    for (let i = 11; i >= 0; i--) {
      months.push(
        format(subMonths(today, i), "yyyy-MM")
      );
    }

    const results = await Promise.all(
      months.map(async (month) => {
        try {
          const data =
            (await api.budget.get(month)) as BudgetPlan;

          return {
            month,
            plan: data ?? null,
          };
        } catch {
          return {
            month,
            plan: null,
          };
        }
      })
    );

    setHistory(results);
    setHistoryLoading(false);
  }

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  /*
   * Reset transient editing state whenever the user
   * changes month.
   */
  useEffect(() => {
    setShowForm(null);
    setNewLabel("");
    setNewBudgeted("");
    setEditingId(null);
    setEditActual("");
    setDeleteConfirm(null);
  }, [selectedMonth]);

  /*
   * Month navigation.
   */
  function goPreviousMonth() {
    setSelectedMonth((current) =>
      format(subMonths(parseISO(`${current}-01`), 1), "yyyy-MM")
    );
  }

  function goNextMonth() {
    setSelectedMonth((current) =>
      format(addMonths(parseISO(`${current}-01`), 1), "yyyy-MM")
    );
  }

  function goToday() {
    setSelectedMonth(currentMonth);
  }

  function handleMonthInput(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    if (e.target.value) {
      setSelectedMonth(e.target.value);
    }
  }

  /*
   * Category statistics.
   *
   * IMPORTANT:
   * This hook runs on every render and is intentionally
   * placed before conditional returns.
   */
  const categoryStats = useMemo(() => {
    const entries = plan?.entries ?? [];

    return CATEGORIES.map((category) => {
      const categoryEntries = entries.filter(
        (entry) => entry.category === category
      );

      const budgeted = categoryEntries.reduce(
        (sum, entry) =>
          sum + Number(entry.budgeted || 0),
        0
      );

      const actual = categoryEntries.reduce(
        (sum, entry) =>
          sum + Number(entry.actual || 0),
        0
      );

      const difference = budgeted - actual;

      const percentage =
        budgeted > 0
          ? Math.min(
              (actual / budgeted) * 100,
              100
            )
          : 0;

      return {
        category,
        entries: categoryEntries,
        budgeted,
        actual,
        difference,
        percentage,
      };
    });
  }, [plan?.entries]);

  /*
   * Create budget.
   */
  async function handleCreatePlan(
    e: React.FormEvent
  ) {
    e.preventDefault();

    const monthlyIncome = Number(income);

    if (
      !monthlyIncome ||
      monthlyIncome <= 0
    ) {
      return;
    }

    try {
      await createBudget.mutateAsync({
        month: selectedMonth,
        monthly_income: monthlyIncome,
      });

      setIncome("");

      await refetch();
      await loadHistory();
    } catch {
      // React Query exposes the error through createBudget.error.
    }
  }

  /*
   * Add budget entry.
   */
  async function handleAddEntry(
    category: Category
  ) {
    if (!plan) return;

    const label = newLabel.trim();
    const budgeted = Number(newBudgeted);

    if (
      !label ||
      Number.isNaN(budgeted) ||
      budgeted <= 0
    ) {
      return;
    }

    try {
      await addEntry.mutateAsync({
        planId: plan.id,
        body: {
          category,
          label,
          budgeted,
        },
      });

      setNewLabel("");
      setNewBudgeted("");
      setShowForm(null);

      await refetch();
      await loadHistory();
    } catch {
      // Mutation error handled by React Query.
    }
  }

  /*
   * Update actual spending.
   */
  async function handleUpdateActual(
    entryId: string
  ) {
    const actual = Number(editActual);

    if (
      Number.isNaN(actual) ||
      actual < 0
    ) {
      return;
    }

    try {
      await updateEntry.mutateAsync({
        entryId,
        body: {
          actual,
        },
      });

      setEditingId(null);
      setEditActual("");

      await refetch();
      await loadHistory();
    } catch {
      // Mutation error handled by React Query.
    }
  }

  /*
   * Delete entry.
   */
  async function handleDelete(
    entryId: string
  ) {
    if (deleteConfirm !== entryId) {
      setDeleteConfirm(entryId);
      return;
    }

    try {
      await deleteEntry.mutateAsync(entryId);

      setDeleteConfirm(null);

      await refetch();
      await loadHistory();
    } catch {
      // Mutation error handled by React Query.
    }
  }

  /*
   * Loading state.
   */
  if (isLoading) {
    return (
      <div className="min-h-full bg-slate-950 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
          <div className="h-10 w-64 rounded-xl bg-slate-900" />

          <div className="h-16 rounded-2xl bg-slate-900 border border-slate-800" />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 rounded-2xl bg-slate-900 border border-slate-800"
              />
            ))}
          </div>

          <div className="h-32 rounded-2xl bg-slate-900 border border-slate-800" />

          <div className="grid xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 h-[600px] rounded-2xl bg-slate-900 border border-slate-800" />

            <div className="h-[600px] rounded-2xl bg-slate-900 border border-slate-800" />
          </div>
        </div>
      </div>
    );
  }

  const errorMessage =
    error instanceof Error
      ? error.message.toLowerCase()
      : "";

  const isMissingBudget =
    !plan &&
    (
      errorMessage.includes("404") ||
      errorMessage.includes("not found") ||
      errorMessage.includes("budget plan")
    );

  /*
   * Genuine API error.
   */
  if (
    error &&
    !plan &&
    !isMissingBudget
  ) {
    return (
      <div className="min-h-full bg-slate-950 p-4 sm:p-6">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8 sm:p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>

            <h1 className="text-xl sm:text-2xl font-semibold text-white mt-5">
              Unable to load your budget
            </h1>

            <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto leading-6">
              We couldn't retrieve your budget data right now.
              Please check that the FinPilot backend is running
              and try again.
            </p>

            {error.message && (
              <div className="mt-4 px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-500">
                {error.message}
              </div>
            )}

            <button
              onClick={() => refetch()}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-semibold text-slate-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  /*
   * No budget exists for selected month.
   */
  if (!plan) {
    return (
      <div className="min-h-full bg-slate-950 p-4 sm:p-6 pb-12">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* HEADER */}
          <header className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-emerald-400" />
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">
                    Money management
                  </p>

                  <h1 className="text-3xl sm:text-4xl font-bold text-white">
                    Budget
                  </h1>

                  <p className="text-sm text-slate-400 mt-1">
                    Build a clear plan for your money every month.
                  </p>
                </div>
              </div>
            </div>

            <MonthNavigator
              selectedMonth={selectedMonth}
              currentMonth={currentMonth}
              onPrevious={goPreviousMonth}
              onNext={goNextMonth}
              onToday={goToday}
              onMonthChange={handleMonthInput}
            />
          </header>

          {/* CREATE BUDGET */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden">
            <div className="p-8 sm:p-12 text-center">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <PiggyBank className="w-10 h-10 text-emerald-400" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-6">
                Start your {format(parseISO(`${selectedMonth}-01`), "MMMM yyyy")} budget
              </h2>

              <p className="max-w-xl mx-auto text-sm leading-6 text-slate-400 mt-3">
                Enter your monthly income and organize it into
                needs, wants, savings, and investments. You can
                then track your actual spending throughout the month.
              </p>

              <form
                onSubmit={handleCreatePlan}
                className="max-w-lg mx-auto mt-8"
              >
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />

                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      required
                      value={income}
                      onChange={(e) =>
                        setIncome(e.target.value)
                      }
                      placeholder="Enter monthly income"
                      className="w-full h-12 rounded-xl bg-slate-800 border border-slate-700 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={
                      createBudget.isPending ||
                      !income ||
                      Number(income) <= 0
                    }
                    className="h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
                  >
                    {createBudget.isPending
                      ? "Creating..."
                      : "Create Budget"}
                  </button>
                </div>

                {createBudget.error && (
                  <div className="mt-4 px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/10">
                    <p className="text-xs text-red-400">
                      {createBudget.error instanceof Error
                        ? createBudget.error.message
                        : "Unable to create your budget."}
                    </p>
                  </div>
                )}
              </form>

              <p className="text-xs text-slate-600 mt-5">
                Creating a budget for{" "}
                {format(
                  parseISO(`${selectedMonth}-01`),
                  "MMMM yyyy"
                )}
              </p>
            </div>

            <div className="grid sm:grid-cols-4 border-t border-slate-800">
              {CATEGORIES.map((category) => {
                const config =
                  CATEGORY_CONFIG[category];

                return (
                  <div
                    key={category}
                    className="p-5 border-b sm:border-b-0 sm:border-r last:border-0 border-slate-800"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${config.icon}`}
                      />
                    </div>

                    <p className="text-sm font-semibold text-white mt-3">
                      {config.label}
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      {config.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* HISTORY */}
          <HistorySection
            history={history}
            historyLoading={historyLoading}
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
          />
        </div>
      </div>
    );
  }

  const totalIncome =
    Number(plan.monthly_income || 0);

  const totalBudgeted =
    Number(plan.total_budgeted || 0);

  const totalActual =
    Number(plan.total_actual || 0);

  const remaining =
    totalIncome - totalActual;

  const plannedRemaining =
    totalIncome - totalBudgeted;

  const budgetUtilization =
    totalBudgeted > 0
      ? Math.min(
          (totalActual / totalBudgeted) * 100,
          100
        )
      : 0;

  const incomeUtilization =
    totalIncome > 0
      ? Math.min(
          (totalActual / totalIncome) * 100,
          100
        )
      : 0;

  const plannedPercentage =
    totalIncome > 0
      ? Math.min(
          (totalBudgeted / totalIncome) * 100,
          100
        )
      : 0;

  const savingsRate =
    totalIncome > 0
      ? Math.max(
          (remaining / totalIncome) * 100,
          0
        )
      : 0;

  const pieData = categoryStats
    .filter((item) => item.actual > 0)
    .map((item) => ({
      name:
        CATEGORY_CONFIG[item.category].label,
      category: item.category,
      value: item.actual,
    }));

  const selectedDate =
    parseISO(`${selectedMonth}-01`);

  const monthLabel =
    format(selectedDate, "MMMM yyyy");

  const isCurrentMonth =
    selectedMonth === currentMonth;

  return (
    <div className="min-h-full bg-slate-950 p-4 sm:p-6 pb-12">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <header className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-emerald-400" />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">
                  Money management
                </p>

                <h1 className="text-3xl sm:text-4xl font-bold text-white">
                  Budget
                </h1>
              </div>
            </div>

            <p className="text-sm text-slate-400 mt-3 max-w-2xl">
              Plan your income, track your spending,
              and understand where your money is going.
            </p>
          </div>

          {/* MONTH NAVIGATION */}
          <MonthNavigator
            selectedMonth={selectedMonth}
            currentMonth={currentMonth}
            onPrevious={goPreviousMonth}
            onNext={goNextMonth}
            onToday={goToday}
            onMonthChange={handleMonthInput}
          />
        </header>

        {/* MONTH STATUS */}
        <section className="rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-emerald-400" />
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-600">
                  Selected month
                </p>

                <p className="text-base font-semibold text-white">
                  {monthLabel}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isCurrentMonth && (
                <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-400">
                  Current month
                </span>
              )}

              <button
                onClick={() => refetch()}
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                title="Refresh month"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* SUMMARY */}
        <section className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <SummaryCard
            label="Monthly income"
            value={formatLakh(totalIncome)}
            subtitle="Your available income"
            icon={
              <CircleDollarSign className="w-4 h-4" />
            }
            tone="emerald"
          />

          <SummaryCard
            label="Planned"
            value={formatLakh(totalBudgeted)}
            subtitle={`${plannedPercentage.toFixed(0)}% of income`}
            icon={<Target className="w-4 h-4" />}
            tone="blue"
          />

          <SummaryCard
            label="Spent"
            value={formatLakh(totalActual)}
            subtitle={`${incomeUtilization.toFixed(0)}% of income`}
            icon={
              <TrendingUp className="w-4 h-4" />
            }
            tone="red"
          />

          <SummaryCard
            label="Available"
            value={formatLakh(remaining)}
            subtitle={
              remaining >= 0
                ? `${savingsRate.toFixed(0)}% remaining`
                : "Budget exceeded"
            }
            icon={
              <PiggyBank className="w-4 h-4" />
            }
            tone={
              remaining >= 0
                ? "violet"
                : "red"
            }
          />
        </section>

        {/* OVERVIEW */}
        <section className="rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white">
                  Monthly spending
                </h2>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    budgetUtilization >= 100
                      ? "bg-red-500/10 text-red-400"
                      : budgetUtilization >= 80
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-emerald-500/10 text-emerald-400"
                  }`}
                >
                  {budgetUtilization.toFixed(0)}%
                </span>
              </div>

              <p className="text-xs text-slate-500 mt-1">
                Actual spending compared with your planned budget
              </p>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-sm font-bold text-white">
                {formatLakh(totalActual)}
              </p>

              <p className="text-xs text-slate-600">
                of {formatLakh(totalBudgeted)} planned
              </p>
            </div>
          </div>

          <div className="mt-5 h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                budgetUtilization >= 100
                  ? "bg-red-500"
                  : budgetUtilization >= 80
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
              style={{
                width: `${budgetUtilization}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-slate-600">
              ₹0
            </span>

            <span
              className={`text-[11px] font-medium ${
                plannedRemaining >= 0
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            >
              {plannedRemaining >= 0
                ? `${formatLakh(plannedRemaining)} of income unplanned`
                : `${formatLakh(
                    Math.abs(plannedRemaining)
                  )} above income`}
            </span>

            <span className="text-[11px] text-slate-600">
              {formatLakh(totalBudgeted)}
            </span>
          </div>
        </section>

        {/* MAIN CONTENT */}
        <div className="grid xl:grid-cols-3 gap-6">

          {/* CATEGORIES */}
          <section className="xl:col-span-2 space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Your spending plan
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Add expenses and update them as you spend.
                </p>
              </div>

              <span className="text-xs text-slate-600">
                {plan.entries.length}{" "}
                {plan.entries.length === 1
                  ? "item"
                  : "items"}
              </span>
            </div>

            {categoryStats.map(
              ({
                category,
                entries,
                budgeted,
                actual,
                difference,
                percentage,
              }) => {
                const config =
                  CATEGORY_CONFIG[category];

                return (
                  <div
                    key={category}
                    className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden"
                  >
                    {/* CATEGORY HEADER */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}
                          >
                            <span
                              className={`w-3 h-3 rounded-full ${config.icon}`}
                            />
                          </div>

                          <div>
                            <h3 className="text-sm font-semibold text-white">
                              {config.label}
                            </h3>

                            <p className="text-xs text-slate-500 mt-0.5">
                              {config.description}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            setShowForm(
                              showForm === category
                                ? null
                                : category
                            )
                          }
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 text-xs font-semibold text-emerald-400 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add
                        </button>
                      </div>

                      <div className="mt-5">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <span className="text-xs text-slate-500">
                              Spent{" "}
                            </span>

                            <span
                              className={`text-xs font-semibold ${
                                actual > budgeted &&
                                budgeted > 0
                                  ? "text-red-400"
                                  : "text-slate-300"
                              }`}
                            >
                              {formatLakh(actual)}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-xs text-slate-500">
                              Planned{" "}
                            </span>

                            <span className="text-xs font-semibold text-slate-300">
                              {formatLakh(budgeted)}
                            </span>
                          </div>
                        </div>

                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              actual > budgeted &&
                              budgeted > 0
                                ? "bg-red-500"
                                : ""
                            }`}
                            style={{
                              width: `${percentage}%`,
                              backgroundColor:
                                actual > budgeted &&
                                budgeted > 0
                                  ? undefined
                                  : config.color,
                            }}
                          />
                        </div>

                        <div className="flex justify-between mt-2">
                          <span className="text-[10px] text-slate-600">
                            {percentage.toFixed(0)}% used
                          </span>

                          <span
                            className={`text-[10px] ${
                              difference >= 0
                                ? "text-slate-600"
                                : "text-red-400"
                            }`}
                          >
                            {difference >= 0
                              ? `${formatLakh(
                                  difference
                                )} remaining`
                              : `${formatLakh(
                                  Math.abs(
                                    difference
                                  )
                                )} over`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ADD FORM */}
                    {showForm === category && (
                      <div className="px-5 py-4 bg-slate-800/40 border-t border-b border-slate-800">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            autoFocus
                            value={newLabel}
                            onChange={(e) =>
                              setNewLabel(
                                e.target.value
                              )
                            }
                            placeholder="Expense name"
                            className="flex-1 h-10 rounded-lg bg-slate-800 border border-slate-700 px-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/50"
                          />

                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={newBudgeted}
                            onChange={(e) =>
                              setNewBudgeted(
                                e.target.value
                              )
                            }
                            placeholder="Planned ₹"
                            className="sm:w-32 h-10 rounded-lg bg-slate-800 border border-slate-700 px-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/50"
                          />

                          <button
                            onClick={() =>
                              handleAddEntry(
                                category
                              )
                            }
                            disabled={
                              addEntry.isPending
                            }
                            className="h-10 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-semibold"
                          >
                            {addEntry.isPending
                              ? "Adding..."
                              : "Add"}
                          </button>

                          <button
                            onClick={() => {
                              setShowForm(null);
                              setNewLabel("");
                              setNewBudgeted("");
                            }}
                            className="h-10 w-10 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {addEntry.error && (
                          <p className="text-xs text-red-400 mt-2">
                            {addEntry.error instanceof Error
                              ? addEntry.error.message
                              : "Unable to add entry."}
                          </p>
                        )}
                      </div>
                    )}

                    {/* ENTRIES */}
                    {entries.length === 0 ? (
                      <div className="px-5 py-7 text-center border-t border-slate-800">
                        <Receipt className="w-5 h-5 text-slate-700 mx-auto mb-2" />

                        <p className="text-xs text-slate-600">
                          Nothing added here yet.
                        </p>

                        <button
                          onClick={() =>
                            setShowForm(category)
                          }
                          className="text-xs text-emerald-400 hover:text-emerald-300 mt-2"
                        >
                          Add an expense
                        </button>
                      </div>
                    ) : (
                      <div className="border-t border-slate-800">
                        {entries.map((entry) => {
                          const entryBudgeted =
                            Number(
                              entry.budgeted || 0
                            );

                          const entryActual =
                            Number(
                              entry.actual || 0
                            );

                          const entryPercentage =
                            entryBudgeted > 0
                              ? Math.min(
                                  (entryActual /
                                    entryBudgeted) *
                                    100,
                                  100
                                )
                              : 0;

                          const overBudget =
                            entryBudgeted > 0 &&
                            entryActual >
                              entryBudgeted;

                          return (
                            <div
                              key={entry.id}
                              className="px-5 py-4 border-b border-slate-800 last:border-0 hover:bg-slate-800/20 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                    overBudget
                                      ? "bg-red-500"
                                      : config.icon
                                  }`}
                                />

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-slate-200 truncate">
                                      {entry.label}
                                    </p>

                                    {overBudget && (
                                      <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded bg-red-500/10 text-[9px] font-semibold text-red-400">
                                        OVER
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-slate-600">
                                      Planned{" "}
                                      {formatCurrency(
                                        entryBudgeted
                                      )}
                                    </span>

                                    {entryBudgeted >
                                      0 && (
                                      <div className="w-20 h-1 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full rounded-full ${
                                            overBudget
                                              ? "bg-red-500"
                                              : ""
                                          }`}
                                          style={{
                                            width: `${entryPercentage}%`,
                                            backgroundColor:
                                              overBudget
                                                ? undefined
                                                : config.color,
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {editingId ===
                                entry.id ? (
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={editActual}
                                      onChange={(e) =>
                                        setEditActual(
                                          e.target.value
                                        )
                                      }
                                      autoFocus
                                      className="w-28 h-9 rounded-lg bg-slate-800 border border-slate-700 px-2.5 text-xs text-white outline-none focus:border-emerald-500/50"
                                    />

                                    <button
                                      onClick={() =>
                                        handleUpdateActual(
                                          entry.id
                                        )
                                      }
                                      disabled={
                                        updateEntry.isPending
                                      }
                                      className="w-9 h-9 rounded-lg flex items-center justify-center text-emerald-400 hover:bg-emerald-500/10"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>

                                    <button
                                      onClick={() => {
                                        setEditingId(null);
                                        setEditActual("");
                                      }}
                                      className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-800"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <div className="text-right mr-1">
                                      <p
                                        className={`text-sm font-semibold ${
                                          overBudget
                                            ? "text-red-400"
                                            : "text-slate-200"
                                        }`}
                                      >
                                        {formatCurrency(
                                          entryActual
                                        )}
                                      </p>

                                      <p className="text-[9px] text-slate-600">
                                        actual
                                      </p>
                                    </div>

                                    <button
                                      onClick={() => {
                                        setEditingId(
                                          entry.id
                                        );
                                        setEditActual(
                                          entryActual.toString()
                                        );
                                      }}
                                      title="Update actual spending"
                                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-emerald-400 hover:bg-emerald-500/10"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      onClick={() =>
                                        handleDelete(
                                          entry.id
                                        )
                                      }
                                      disabled={
                                        deleteEntry.isPending
                                      }
                                      title={
                                        deleteConfirm ===
                                        entry.id
                                          ? "Click again to confirm"
                                          : "Delete"
                                      }
                                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                        deleteConfirm ===
                                        entry.id
                                          ? "text-red-400 bg-red-500/10"
                                          : "text-slate-600 hover:text-red-400 hover:bg-red-500/10"
                                      }`}
                                    >
                                      {deleteConfirm ===
                                      entry.id ? (
                                        <Check className="w-3.5 h-3.5" />
                                      ) : (
                                        <Trash2 className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>

                              {deleteConfirm ===
                                entry.id && (
                                <div className="ml-5 mt-2 text-[10px] text-red-400">
                                  Click the delete button again to confirm.
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </section>

          {/* SIDEBAR */}
          <aside className="space-y-5">

            {/* SPENDING CHART */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-white">
                    Spending breakdown
                  </h2>

                  <p className="text-xs text-slate-500 mt-1">
                    Your actual spending by category
                  </p>
                </div>

                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-slate-400" />
                </div>
              </div>

              {pieData.length > 0 ? (
                <>
                  <div className="h-[240px] mt-2">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={58}
                          outerRadius={86}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieData.map(
                            (entry) => (
                              <Cell
                                key={
                                  entry.category
                                }
                                fill={
                                  CATEGORY_CONFIG[
                                    entry.category as Category
                                  ].color
                                }
                              />
                            )
                          )}
                        </Pie>

                        <Tooltip
                          formatter={(
                            value: number
                          ) =>
                            formatLakh(value)
                          }
                          contentStyle={{
                            backgroundColor:
                              "#0f172a",
                            border:
                              "1px solid #334155",
                            borderRadius: 12,
                            fontSize: 12,
                            color: "#e2e8f0",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2 border-t border-slate-800 pt-4">
                    {categoryStats
                      .filter(
                        (item) =>
                          item.actual > 0
                      )
                      .map((item) => {
                        const config =
                          CATEGORY_CONFIG[
                            item.category
                          ];

                        const share =
                          totalActual > 0
                            ? (item.actual /
                                totalActual) *
                              100
                            : 0;

                        return (
                          <div
                            key={
                              item.category
                            }
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2 h-2 rounded-full ${config.icon}`}
                              />

                              <span className="text-xs text-slate-400">
                                {config.label}
                              </span>
                            </div>

                            <span className="text-xs font-semibold text-slate-300">
                              {share.toFixed(0)}%
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </>
              ) : (
                <div className="py-14 text-center">
                  <Receipt className="w-8 h-8 text-slate-700 mx-auto mb-3" />

                  <p className="text-sm text-slate-500">
                    No spending recorded yet.
                  </p>

                  <p className="text-xs text-slate-600 mt-1">
                    Update actual amounts to see your breakdown.
                  </p>
                </div>
              )}
            </div>

            {/* SAVINGS */}
            <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-900 border border-emerald-500/20 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-400">
                    {monthLabel} savings rate
                  </p>

                  <p className="text-3xl font-bold text-white mt-1">
                    {savingsRate.toFixed(0)}%
                  </p>
                </div>

                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <PiggyBank className="w-5 h-5 text-emerald-400" />
                </div>
              </div>

              <div className="h-2 bg-slate-800 rounded-full mt-5 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${Math.min(
                      savingsRate,
                      100
                    )}%`,
                  }}
                />
              </div>

              <p className="text-xs text-slate-500 mt-3 leading-5">
                Based on income remaining after your recorded spending.
              </p>
            </div>

            {/* 50/30/20 */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-white">
                    Suggested allocation
                  </h2>

                  <p className="text-xs text-slate-500 mt-1">
                    A simple starting framework
                  </p>
                </div>

                <MoreHorizontal className="w-4 h-4 text-slate-600" />
              </div>

              <div className="space-y-5 mt-5">
                <AllocationRow
                  label="Needs"
                  percentage="50%"
                  amount={Number(
                    plan.suggested_allocation?.needs ||
                      0
                  )}
                  color="bg-blue-500"
                />

                <AllocationRow
                  label="Wants"
                  percentage="30%"
                  amount={Number(
                    plan.suggested_allocation?.wants ||
                      0
                  )}
                  color="bg-amber-500"
                />

                <AllocationRow
                  label="Savings + investments"
                  percentage="20%"
                  amount={Number(
                    plan.suggested_allocation
                      ?.savings_investments ||
                      0
                  )}
                  color="bg-emerald-500"
                />
              </div>

              <p className="text-[10px] leading-5 text-slate-600 mt-5 pt-4 border-t border-slate-800">
                This is a general guideline, not a rule.
                Adjust it according to your income, obligations,
                goals, and priorities.
              </p>
            </div>

            {/* FINANCIAL HEALTH */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                  <Target className="w-4 h-4 text-slate-400" />
                </div>

                <div>
                  <h2 className="font-semibold text-white">
                    Budget health
                  </h2>

                  <p className="text-[10px] text-slate-600">
                    Quick financial snapshot
                  </p>
                </div>
              </div>

              <div className="space-y-4 mt-5">
                <HealthRow
                  label="Income"
                  value={formatLakh(
                    totalIncome
                  )}
                  status="Available"
                  positive
                />

                <HealthRow
                  label="Planned"
                  value={formatLakh(
                    totalBudgeted
                  )}
                  status={
                    totalBudgeted <=
                    totalIncome
                      ? "Within income"
                      : "Above income"
                  }
                  positive={
                    totalBudgeted <=
                    totalIncome
                  }
                />

                <HealthRow
                  label="Spent"
                  value={formatLakh(
                    totalActual
                  )}
                  status={
                    totalActual <=
                    totalBudgeted
                      ? "Within plan"
                      : "Over plan"
                  }
                  positive={
                    totalActual <=
                    totalBudgeted
                  }
                />

                <HealthRow
                  label="Available"
                  value={formatLakh(
                    Math.abs(
                      remaining
                    )
                  )}
                  status={
                    remaining >= 0
                      ? "Positive balance"
                      : "Deficit"
                  }
                  positive={
                    remaining >= 0
                  }
                />
              </div>
            </div>
          </aside>
        </div>

        {/* MONTHLY HISTORY */}
        <HistorySection
          history={history}
          historyLoading={historyLoading}
          selectedMonth={selectedMonth}
          onSelectMonth={setSelectedMonth}
        />
      </div>
    </div>
  );
}

/* ============================================================
   MONTH NAVIGATOR
   ============================================================ */

function MonthNavigator({
  selectedMonth,
  currentMonth,
  onPrevious,
  onNext,
  onToday,
  onMonthChange,
}: {
  selectedMonth: string;
  currentMonth: string;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onMonthChange: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
}) {
  const date = parseISO(
    `${selectedMonth}-01`
  );

  const isCurrent =
    selectedMonth === currentMonth;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <button
          onClick={onPrevious}
          className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="relative border-x border-slate-800">
          <div className="flex items-center gap-2 px-4">
            <CalendarDays className="w-4 h-4 text-emerald-400" />

            <span className="text-sm font-semibold text-white whitespace-nowrap">
              {format(date, "MMMM yyyy")}
            </span>
          </div>

          <input
            type="month"
            value={selectedMonth}
            onChange={onMonthChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Select budget month"
          />
        </div>

        <button
          onClick={onNext}
          className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {!isCurrent && (
        <button
          onClick={onToday}
          className="h-11 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-xs font-semibold text-emerald-400 transition-colors"
        >
          Today
        </button>
      )}
    </div>
  );
}

/* ============================================================
   HISTORY SECTION
   ============================================================ */

function HistorySection({
  history,
  historyLoading,
  selectedMonth,
  onSelectMonth,
}: {
  history: HistoryItem[];
  historyLoading: boolean;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
}) {
  const availableHistory = history.filter(
    (item) => item.plan
  );

  const chartData = availableHistory.map(
    ({ month, plan }) => {
      const income = Number(
        plan?.monthly_income || 0
      );

      const spent = Number(
        plan?.total_actual || 0
      );

      const planned = Number(
        plan?.total_budgeted || 0
      );

      return {
        month,
        label: format(
          parseISO(`${month}-01`),
          "MMM"
        ),
        income,
        spent,
        planned,
        saved: Math.max(
          income - spent,
          0
        ),
      };
    }
  );

  const totals = availableHistory.reduce(
    (acc, item) => {
      const income = Number(
        item.plan?.monthly_income || 0
      );

      const spent = Number(
        item.plan?.total_actual || 0
      );

      acc.income += income;
      acc.spent += spent;
      acc.saved += Math.max(
        income - spent,
        0
      );

      return acc;
    },
    {
      income: 0,
      spent: 0,
      saved: 0,
    }
  );

  return (
    <section className="space-y-5">

      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <History className="w-4 h-4 text-emerald-400" />
            </div>

            <h2 className="text-lg font-semibold text-white">
              Expense history
            </h2>
          </div>

          <p className="text-xs text-slate-500 mt-2">
            Review your budgets, spending and savings across the last 12 months.
          </p>
        </div>

        <span className="text-[10px] uppercase tracking-wider text-slate-600">
          12-month history
        </span>
      </div>

      {/* HISTORY SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <HistoryMetric
          label="Total income"
          value={formatLakh(
            totals.income
          )}
          icon={
            <CircleDollarSign className="w-4 h-4" />
          }
          tone="emerald"
        />

        <HistoryMetric
          label="Total spending"
          value={formatLakh(
            totals.spent
          )}
          icon={
            <TrendingDown className="w-4 h-4" />
          }
          tone="red"
        />

        <HistoryMetric
          label="Total retained"
          value={formatLakh(
            totals.saved
          )}
          icon={
            <PiggyBank className="w-4 h-4" />
          }
          tone="violet"
        />
      </div>

      {/* HISTORY CONTENT */}
      <div className="grid xl:grid-cols-3 gap-5">

        {/* CHART */}
        <div className="xl:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-slate-400" />

                <h3 className="font-semibold text-white">
                  Monthly spending trend
                </h3>
              </div>

              <p className="text-xs text-slate-500 mt-1">
                Income, planned spending and actual spending
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-3 text-[10px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Income
              </span>

              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Spent
              </span>
            </div>
          </div>

          {historyLoading ? (
            <div className="h-[300px] mt-5 animate-pulse rounded-xl bg-slate-800/50" />
          ) : chartData.length > 0 ? (
            <div className="h-[300px] mt-5">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 5,
                    left: -15,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid
                    stroke="#1e293b"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="label"
                    tick={{
                      fill: "#64748b",
                      fontSize: 10,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    tick={{
                      fill: "#64748b",
                      fontSize: 10,
                    }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) =>
                      value >= 100000
                        ? `₹${(
                            value / 100000
                          ).toFixed(1)}L`
                        : value >= 1000
                        ? `₹${(
                            value / 1000
                          ).toFixed(0)}K`
                        : `₹${value}`
                    }
                  />

                  <Tooltip
                    formatter={(
                      value: number,
                      name: string
                    ) => [
                      formatLakh(value),
                      name === "income"
                        ? "Income"
                        : name === "spent"
                        ? "Spent"
                        : "Planned",
                    ]}
                    contentStyle={{
                      backgroundColor:
                        "#0f172a",
                      border:
                        "1px solid #334155",
                      borderRadius: 12,
                      fontSize: 11,
                      color: "#e2e8f0",
                    }}
                    labelStyle={{
                      color: "#94a3b8",
                      marginBottom: 4,
                    }}
                  />

                  <Bar
                    dataKey="income"
                    fill="#10b981"
                    radius={[
                      4,
                      4,
                      0,
                      0,
                    ]}
                    maxBarSize={20}
                  />

                  <Bar
                    dataKey="spent"
                    fill="#ef4444"
                    radius={[
                      4,
                      4,
                      0,
                      0,
                    ]}
                    maxBarSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyHistory />
          )}
        </div>

        {/* MONTH LIST */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-slate-400" />

              <h3 className="font-semibold text-white">
                Monthly records
              </h3>
            </div>

            <p className="text-xs text-slate-500 mt-1">
              Select a month to open its budget.
            </p>
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {historyLoading ? (
              <div className="p-5 space-y-3">
                {[
                  1, 2, 3, 4, 5, 6,
                ].map((item) => (
                  <div
                    key={item}
                    className="h-16 rounded-xl bg-slate-800/50 animate-pulse"
                  />
                ))}
              </div>
            ) : history.length === 0 ? (
              <EmptyHistory />
            ) : (
              history
                .slice()
                .reverse()
                .map((item) => {
                  const itemPlan =
                    item.plan;

                  const monthDate =
                    parseISO(
                      `${item.month}-01`
                    );

                  const income =
                    Number(
                      itemPlan?.monthly_income ||
                        0
                    );

                  const spent =
                    Number(
                      itemPlan?.total_actual ||
                        0
                    );

                  const saved =
                    Math.max(
                      income - spent,
                      0
                    );

                  const selected =
                    item.month ===
                    selectedMonth;

                  return (
                    <button
                      key={item.month}
                      onClick={() =>
                        onSelectMonth(
                          item.month
                        )
                      }
                      className={`w-full text-left px-5 py-4 border-b border-slate-800 last:border-0 transition-colors ${
                        selected
                          ? "bg-emerald-500/5"
                          : "hover:bg-slate-800/30"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                              selected
                                ? "bg-emerald-500/10 border-emerald-500/20"
                                : "bg-slate-800 border-slate-700"
                            }`}
                          >
                            <CalendarDays
                              className={`w-4 h-4 ${
                                selected
                                  ? "text-emerald-400"
                                  : "text-slate-500"
                              }`}
                            />
                          </div>

                          <div className="min-w-0">
                            <p
                              className={`text-xs font-semibold ${
                                selected
                                  ? "text-emerald-400"
                                  : "text-slate-300"
                              }`}
                            >
                              {format(
                                monthDate,
                                "MMMM yyyy"
                              )}
                            </p>

                            {itemPlan ? (
                              <p className="text-[10px] text-slate-600 mt-0.5">
                                Spent{" "}
                                {formatLakh(
                                  spent
                                )}
                              </p>
                            ) : (
                              <p className="text-[10px] text-slate-700 mt-0.5">
                                No budget created
                              </p>
                            )}
                          </div>
                        </div>

                        {itemPlan ? (
                          <div className="text-right shrink-0">
                            <p className="text-xs font-semibold text-slate-200">
                              {formatLakh(
                                saved
                              )}
                            </p>

                            <p className="text-[9px] text-slate-600">
                              retained
                            </p>
                          </div>
                        ) : (
                          <span className="text-[9px] text-slate-700">
                            —
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {/* MONTH COMPARISON TABLE */}
      {!historyLoading &&
        availableHistory.length > 0 && (
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-slate-400" />

                <h3 className="font-semibold text-white">
                  Monthly comparison
                </h3>
              </div>

              <p className="text-xs text-slate-500 mt-1">
                Compare income, planned spending, actual spending and remaining money.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px]">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-slate-600 font-semibold">
                      Month
                    </th>

                    <th className="text-right px-5 py-3 text-[10px] uppercase tracking-wider text-slate-600 font-semibold">
                      Income
                    </th>

                    <th className="text-right px-5 py-3 text-[10px] uppercase tracking-wider text-slate-600 font-semibold">
                      Planned
                    </th>

                    <th className="text-right px-5 py-3 text-[10px] uppercase tracking-wider text-slate-600 font-semibold">
                      Spent
                    </th>

                    <th className="text-right px-5 py-3 text-[10px] uppercase tracking-wider text-slate-600 font-semibold">
                      Remaining
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {availableHistory
                    .slice()
                    .reverse()
                    .map((item) => {
                      const itemPlan =
                        item.plan!;

                      const income =
                        Number(
                          itemPlan.monthly_income ||
                            0
                        );

                      const planned =
                        Number(
                          itemPlan.total_budgeted ||
                            0
                        );

                      const spent =
                        Number(
                          itemPlan.total_actual ||
                            0
                        );

                      const remaining =
                        income - spent;

                      const selected =
                        item.month ===
                        selectedMonth;

                      return (
                        <tr
                          key={item.month}
                          onClick={() =>
                            onSelectMonth(
                              item.month
                            )
                          }
                          className={`border-b border-slate-800 last:border-0 cursor-pointer transition-colors ${
                            selected
                              ? "bg-emerald-500/5"
                              : "hover:bg-slate-800/20"
                          }`}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              {selected && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              )}

                              <span className="text-xs font-semibold text-slate-300">
                                {format(
                                  parseISO(
                                    `${item.month}-01`
                                  ),
                                  "MMM yyyy"
                                )}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-right text-xs text-slate-300">
                            {formatLakh(
                              income
                            )}
                          </td>

                          <td className="px-5 py-4 text-right text-xs text-slate-400">
                            {formatLakh(
                              planned
                            )}
                          </td>

                          <td className="px-5 py-4 text-right text-xs font-semibold text-slate-200">
                            {formatLakh(
                              spent
                            )}
                          </td>

                          <td
                            className={`px-5 py-4 text-right text-xs font-semibold ${
                              remaining >= 0
                                ? "text-emerald-400"
                                : "text-red-400"
                            }`}
                          >
                            {formatLakh(
                              Math.abs(
                                remaining
                              )
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
    </section>
  );
}

/* ============================================================
   HISTORY METRIC
   ============================================================ */

function HistoryMetric({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "emerald" | "red" | "violet";
}) {
  const styles = {
    emerald: {
      wrapper:
        "bg-emerald-500/5 border-emerald-500/15",
      icon:
        "bg-emerald-500/10 text-emerald-400",
      value: "text-emerald-300",
    },

    red: {
      wrapper:
        "bg-red-500/5 border-red-500/15",
      icon:
        "bg-red-500/10 text-red-400",
      value: "text-red-300",
    },

    violet: {
      wrapper:
        "bg-violet-500/5 border-violet-500/15",
      icon:
        "bg-violet-500/10 text-violet-400",
      value: "text-violet-300",
    },
  };

  const style = styles[tone];

  return (
    <div
      className={`rounded-2xl border p-4 ${style.wrapper}`}
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center ${style.icon}`}
      >
        {icon}
      </div>

      <p className="text-[10px] uppercase tracking-wider text-slate-600 mt-3">
        {label}
      </p>

      <p
        className={`text-lg font-bold mt-1 ${style.value}`}
      >
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   EMPTY HISTORY
   ============================================================ */

function EmptyHistory() {
  return (
    <div className="h-[220px] flex flex-col items-center justify-center text-center px-5">
      <History className="w-8 h-8 text-slate-700 mb-3" />

      <p className="text-sm text-slate-500">
        No historical budgets yet.
      </p>

      <p className="text-xs text-slate-600 mt-1 max-w-xs">
        Create budgets for different months to build your spending history.
      </p>
    </div>
  );
}

/* ============================================================
   SUMMARY CARD
   ============================================================ */

function SummaryCard({
  label,
  value,
  subtitle,
  icon,
  tone,
}: {
  label: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  tone:
    | "emerald"
    | "blue"
    | "red"
    | "violet";
}) {
  const styles = {
    emerald: {
      wrapper:
        "bg-emerald-500/5 border-emerald-500/15",
      icon:
        "bg-emerald-500/10 text-emerald-400",
      value: "text-emerald-300",
    },

    blue: {
      wrapper:
        "bg-blue-500/5 border-blue-500/15",
      icon:
        "bg-blue-500/10 text-blue-400",
      value: "text-blue-300",
    },

    red: {
      wrapper:
        "bg-red-500/5 border-red-500/15",
      icon:
        "bg-red-500/10 text-red-400",
      value: "text-red-300",
    },

    violet: {
      wrapper:
        "bg-violet-500/5 border-violet-500/15",
      icon:
        "bg-violet-500/10 text-violet-400",
      value: "text-violet-300",
    },
  };

  const style = styles[tone];

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 ${style.wrapper}`}
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center ${style.icon}`}
      >
        {icon}
      </div>

      <p className="text-[11px] uppercase tracking-wide text-slate-600 mt-4">
        {label}
      </p>

      <p
        className={`text-lg sm:text-xl font-bold mt-1 ${style.value}`}
      >
        {value}
      </p>

      <p className="text-[10px] text-slate-600 mt-1">
        {subtitle}
      </p>
    </div>
  );
}

/* ============================================================
   ALLOCATION ROW
   ============================================================ */

function AllocationRow({
  label,
  percentage,
  amount,
  color,
}: {
  label: string;
  percentage: string;
  amount: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${color}`}
          />

          <span className="text-xs text-slate-300">
            {label}
          </span>
        </div>

        <div>
          <span className="text-xs font-semibold text-slate-300">
            {percentage}
          </span>

          <span className="text-[10px] text-slate-600 ml-2">
            {formatLakh(amount)}
          </span>
        </div>
      </div>

      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{
            width: percentage,
          }}
        />
      </div>
    </div>
  );
}

/* ============================================================
   HEALTH ROW
   ============================================================ */

function HealthRow({
  label,
  value,
  status,
  positive,
}: {
  label: string;
  value: string;
  status: string;
  positive: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-xs text-slate-300">
          {label}
        </p>

        <p
          className={`text-[10px] mt-0.5 ${
            positive
              ? "text-emerald-500"
              : "text-red-400"
          }`}
        >
          {status}
        </p>
      </div>

      <span className="text-sm font-semibold text-white">
        {value}
      </span>
    </div>
  );
}