"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Landmark,
  PiggyBank,
  Save,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import {
  useFinancialHealth,
  useFinancialHealthSummary,
  useSaveFinancialHealth,
} from "@/hooks/useApi";

type FormState = {
  monthly_income: string;
  monthly_expenses: string;
  monthly_debt_payment: string;
  cash_balance: string;
  emergency_fund: string;
  investments_value: string;
  total_debt: string;
  monthly_investment: string;
  target_monthly_expenses: string;
};

const EMPTY_FORM: FormState = {
  monthly_income: "",
  monthly_expenses: "",
  monthly_debt_payment: "",
  cash_balance: "",
  emergency_fund: "",
  investments_value: "",
  total_debt: "",
  monthly_investment: "",
  target_monthly_expenses: "",
};

function toInputValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function formatMoney(value: string | number | undefined, currency = "INR") {
  const numericValue = Number(value ?? 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
}

function formatPercent(value: string | number | undefined) {
  const numericValue = Number(value ?? 0);

  if (!Number.isFinite(numericValue)) return "0%";

  return `${numericValue.toFixed(1)}%`;
}

function formatMonths(value: string | number | undefined) {
  const numericValue = Number(value ?? 0);

  if (!Number.isFinite(numericValue)) return "0.0 months";

  return `${numericValue.toFixed(1)} months`;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            {value}
          </p>
        </div>

        <div className="rounded-xl bg-slate-100 p-3">
          <Icon className="h-5 w-5 text-slate-700" />
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder = "0",
  help,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  help?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-800">{label}</span>

      <div className="relative mt-2">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
          ₹
        </span>

        <input
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-8 pr-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-300 focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
        />
      </div>

      {help ? (
        <span className="mt-1.5 block text-xs text-slate-500">{help}</span>
      ) : null}
    </label>
  );
}

export default function FinancialHealthPage() {
  const profileQuery = useFinancialHealth();
  const summaryQuery = useFinancialHealthSummary();
  const saveMutation = useSaveFinancialHealth();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;

    if (profileQuery.data) {
      setForm({
        monthly_income: toInputValue(profileQuery.data.monthly_income),
        monthly_expenses: toInputValue(profileQuery.data.monthly_expenses),
        monthly_debt_payment: toInputValue(
          profileQuery.data.monthly_debt_payment,
        ),
        cash_balance: toInputValue(profileQuery.data.cash_balance),
        emergency_fund: toInputValue(profileQuery.data.emergency_fund),
        investments_value: toInputValue(
          profileQuery.data.investments_value,
        ),
        total_debt: toInputValue(profileQuery.data.total_debt),
        monthly_investment: toInputValue(
          profileQuery.data.monthly_investment,
        ),
        target_monthly_expenses: toInputValue(
          profileQuery.data.target_monthly_expenses,
        ),
      });

      setInitialized(true);
      return;
    }

    if (profileQuery.isError) {
      setInitialized(true);
    }
  }, [
    initialized,
    profileQuery.data,
    profileQuery.isError,
  ]);

  const currency = profileQuery.data?.currency ?? "INR";

  const preview = useMemo(() => {
    const income = Number(form.monthly_income || 0);
    const expenses = Number(form.monthly_expenses || 0);
    const debtPayment = Number(form.monthly_debt_payment || 0);
    const cash = Number(form.cash_balance || 0);
    const investments = Number(form.investments_value || 0);
    const debt = Number(form.total_debt || 0);
    const emergency = Number(form.emergency_fund || 0);

    const savings = income - expenses - debtPayment;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;
    const netWorth = cash + investments - debt;
    const emergencyMonths = expenses > 0 ? emergency / expenses : 0;
    const debtToIncome = income > 0 ? (debtPayment / income) * 100 : 0;

    return {
      savings,
      savingsRate,
      netWorth,
      emergencyMonths,
      debtToIncome,
    };
  }, [form]);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await saveMutation.mutateAsync({
      currency: "INR",
      monthly_income: Number(form.monthly_income || 0),
      monthly_expenses: Number(form.monthly_expenses || 0),
      monthly_debt_payment: Number(form.monthly_debt_payment || 0),
      cash_balance: Number(form.cash_balance || 0),
      emergency_fund: Number(form.emergency_fund || 0),
      investments_value: Number(form.investments_value || 0),
      total_debt: Number(form.total_debt || 0),
      monthly_investment: Number(form.monthly_investment || 0),
      target_monthly_expenses: Number(
        form.target_monthly_expenses || 0,
      ),
    });

    setInitialized(false);
  }

  const isLoading =
    profileQuery.isLoading ||
    (!initialized && profileQuery.isFetching);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 rounded bg-slate-200" />
            <div className="h-4 w-96 rounded bg-slate-200" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-32 rounded-2xl bg-slate-200"
                />
              ))}
            </div>
            <div className="h-[500px] rounded-2xl bg-slate-200" />
          </div>
        </div>
      </main>
    );
  }

  const hasProfile = Boolean(profileQuery.data);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                <Activity className="h-3.5 w-3.5" />
                Financial Intelligence
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Financial Health
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Build your financial snapshot once and let FinPilot use it
                as the foundation for health metrics, goals, cash-flow
                intelligence, and future insights.
              </p>
            </div>

            {hasProfile ? (
              <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 md:self-auto">
                <CheckCircle2 className="h-4 w-4" />
                Profile saved
              </div>
            ) : null}
          </div>
        </div>

        {/* Error */}
        {profileQuery.isError &&
        (profileQuery.error as { status?: number } | null)?.status !==
          404 ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            We couldn&apos;t load your financial profile. Please try again.
          </div>
        ) : null}

        {/* Live summary */}
        {summaryQuery.data ? (
          <section className="mb-8">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-950">
                Your current snapshot
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Calculated from the financial information you saved.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                icon={TrendingUp}
                label="Monthly savings"
                value={formatMoney(
                  summaryQuery.data.monthly_savings,
                  currency,
                )}
                description="Income minus monthly expenses and debt payments."
              />

              <MetricCard
                icon={Activity}
                label="Savings rate"
                value={formatPercent(summaryQuery.data.savings_rate)}
                description="Percentage of monthly income remaining after core outflows."
              />

              <MetricCard
                icon={Wallet}
                label="Net worth"
                value={formatMoney(
                  summaryQuery.data.net_worth,
                  currency,
                )}
                description="Cash plus investments minus total debt."
              />

              <MetricCard
                icon={ShieldCheck}
                label="Emergency runway"
                value={formatMonths(
                  summaryQuery.data.emergency_fund_months,
                )}
                description="Emergency-fund coverage based on monthly expenses."
              />
            </div>
          </section>
        ) : null}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-6">
                <h2 className="text-lg font-bold text-slate-950">
                  Financial snapshot
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter your current monthly and balance-sheet numbers.
                  Estimates are fine; you can update them whenever they
                  change.
                </p>
              </div>

              <div className="space-y-8 p-6">
                {/* Income & spending */}
                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-xl bg-slate-100 p-2.5">
                      <Banknote className="h-5 w-5 text-slate-700" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-950">
                        Monthly cash flow
                      </h3>
                      <p className="text-xs text-slate-500">
                        Your recurring income and essential outflows.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                      label="Monthly income"
                      value={form.monthly_income}
                      onChange={(value) =>
                        updateField("monthly_income", value)
                      }
                      help="Total take-home income per month."
                    />

                    <Field
                      label="Monthly expenses"
                      value={form.monthly_expenses}
                      onChange={(value) =>
                        updateField("monthly_expenses", value)
                      }
                      help="Your normal monthly spending."
                    />

                    <Field
                      label="Monthly debt payment"
                      value={form.monthly_debt_payment}
                      onChange={(value) =>
                        updateField("monthly_debt_payment", value)
                      }
                      help="EMIs and other recurring debt payments."
                    />

                    <Field
                      label="Monthly investment"
                      value={form.monthly_investment}
                      onChange={(value) =>
                        updateField("monthly_investment", value)
                      }
                      help="Amount you currently invest each month."
                    />
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Assets */}
                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-xl bg-slate-100 p-2.5">
                      <PiggyBank className="h-5 w-5 text-slate-700" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-950">
                        Cash & assets
                      </h3>
                      <p className="text-xs text-slate-500">
                        Current balances that contribute to your financial
                        position.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                      label="Cash balance"
                      value={form.cash_balance}
                      onChange={(value) =>
                        updateField("cash_balance", value)
                      }
                      help="Cash and bank balances available to you."
                    />

                    <Field
                      label="Emergency fund"
                      value={form.emergency_fund}
                      onChange={(value) =>
                        updateField("emergency_fund", value)
                      }
                      help="Money specifically reserved for emergencies."
                    />

                    <Field
                      label="Investments value"
                      value={form.investments_value}
                      onChange={(value) =>
                        updateField("investments_value", value)
                      }
                      help="Approximate current value of your investments."
                    />
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Debt & goals */}
                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-xl bg-slate-100 p-2.5">
                      <Landmark className="h-5 w-5 text-slate-700" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-950">
                        Debt & planning baseline
                      </h3>
                      <p className="text-xs text-slate-500">
                        Numbers FinPilot can use for future planning
                        intelligence.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                      label="Total debt"
                      value={form.total_debt}
                      onChange={(value) =>
                        updateField("total_debt", value)
                      }
                      help="Outstanding principal across your debts."
                    />

                    <Field
                      label="Target monthly expenses"
                      value={form.target_monthly_expenses}
                      onChange={(value) =>
                        updateField(
                          "target_monthly_expenses",
                          value,
                        )
                      }
                      help="Monthly spending target for future planning."
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 bg-slate-50/70 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Ready to update your snapshot?
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      FinPilot will recalculate your health metrics after
                      saving.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={saveMutation.isPending}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {saveMutation.isPending
                      ? "Saving..."
                      : "Save financial snapshot"}
                  </button>
                </div>

                {saveMutation.isSuccess ? (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Your financial snapshot has been saved successfully.
                  </div>
                ) : null}

                {saveMutation.isError ? (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    We couldn&apos;t save your financial snapshot. Please try
                    again.
                  </div>
                ) : null}
              </div>
            </section>

            {/* Preview */}
            <aside className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white/10 p-2.5">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold">Live preview</h2>
                    <p className="text-xs text-slate-400">
                      Based on your current inputs
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  <div>
                    <p className="text-xs text-slate-400">
                      Monthly savings
                    </p>
                    <p
                      className={`mt-1 text-2xl font-bold ${
                        preview.savings < 0
                          ? "text-red-300"
                          : "text-white"
                      }`}
                    >
                      {formatMoney(preview.savings, currency)}
                    </p>
                  </div>

                  <div className="h-px bg-white/10" />

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-400">
                      Savings rate
                    </span>
                    <span className="font-semibold">
                      {formatPercent(preview.savingsRate)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-400">
                      Net worth
                    </span>
                    <span className="font-semibold">
                      {formatMoney(preview.netWorth, currency)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-400">
                      Emergency runway
                    </span>
                    <span className="font-semibold">
                      {formatMonths(preview.emergencyMonths)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-400">
                      Debt-to-income
                    </span>
                    <span className="font-semibold">
                      {formatPercent(preview.debtToIncome)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-slate-100 p-2.5">
                    <TrendingUp className="h-5 w-5 text-slate-700" />
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-950">
                      Why this matters
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      This snapshot is the foundation for FinPilot&apos;s
                      next financial-intelligence layers. It can eventually
                      power goal planning, cash-flow analysis, financial
                      health scoring, and personalized educational insights.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-slate-100 p-2.5">
                    <ShieldCheck className="h-5 w-5 text-slate-700" />
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-950">
                      Your numbers, your control
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      You can update this information whenever your income,
                      spending, savings, assets, or debt changes.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </form>
      </div>
    </main>
  );
}

