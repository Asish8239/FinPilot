"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Calculator,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Info,
  Landmark,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

type FireType = {
  name: string;
  multiplier: number;
  description: string;
  target: number;
  years: number | null;
};

type ProjectionPoint = {
  year: number;
  age: number;
  portfolio: number;
  invested: number;
  gains: number;
};

const CURRENT_YEAR = new Date().getFullYear();

export default function FinancialIndependencePage() {
  const [age, setAge] = useState(25);
  const [monthlyIncome, setMonthlyIncome] = useState(100000);
  const [monthlyExpenses, setMonthlyExpenses] = useState(30000);
  const [currentPortfolio, setCurrentPortfolio] = useState(500000);

  const [expectedReturn, setExpectedReturn] = useState(12);
  const [inflation, setInflation] = useState(6);
  const [withdrawalRate, setWithdrawalRate] = useState(4);

  const [activeTab, setActiveTab] = useState<"planner" | "education">(
    "planner",
  );

  const calculations = useMemo(() => {
    const annualExpenses = monthlyExpenses * 12;
    const annualIncome = monthlyIncome * 12;
    const monthlySavings = Math.max(monthlyIncome - monthlyExpenses, 0);
    const annualSavings = monthlySavings * 12;
    const savingsRate =
      monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

    const fiTarget =
      withdrawalRate > 0 ? annualExpenses / (withdrawalRate / 100) : 0;

    const currentProgress =
      fiTarget > 0
        ? Math.min((currentPortfolio / fiTarget) * 100, 100)
        : 0;

    const realReturn =
      (1 + expectedReturn / 100) / (1 + inflation / 100) - 1;

    let yearsToFi: number | null = null;

    if (currentPortfolio >= fiTarget && fiTarget > 0) {
      yearsToFi = 0;
    } else if (monthlySavings > 0 && fiTarget > currentPortfolio) {
      const monthlyRate = realReturn / 12;

      if (Math.abs(monthlyRate) < 0.0000001) {
        yearsToFi =
          (fiTarget - currentPortfolio) / monthlySavings / 12;
      } else {
        const numerator =
          fiTarget * monthlyRate + monthlySavings;
        const denominator =
          currentPortfolio * monthlyRate + monthlySavings;

        if (numerator > 0 && denominator > 0) {
          const months = Math.log(numerator / denominator) /
            Math.log(1 + monthlyRate);
          yearsToFi = months / 12;
        }
      }
    }

    const fiAge =
      yearsToFi !== null ? age + Math.max(yearsToFi, 0) : null;

    const annualPassiveIncome = currentPortfolio * (withdrawalRate / 100);

    const fireTypes: FireType[] = [
      {
        name: "Lean FIRE",
        multiplier: 20,
        description:
          "A lean lifestyle with lower annual spending and a 5% withdrawal assumption.",
        target: annualExpenses * 20,
        years: null,
      },
      {
        name: "Traditional FIRE",
        multiplier: 25,
        description:
          "The classic 4% rule approach for financial independence.",
        target: annualExpenses * 25,
        years: null,
      },
      {
        name: "Fat FIRE",
        multiplier: 33.33,
        description:
          "A larger portfolio designed to support a higher-spending lifestyle.",
        target: annualExpenses * 33.33,
        years: null,
      },
    ];

    const projection: ProjectionPoint[] = [];
    const projectionYears = 30;
    const monthlyNominalReturn = expectedReturn / 100 / 12;

    let portfolio = currentPortfolio;
    let invested = currentPortfolio;

    projection.push({
      year: CURRENT_YEAR,
      age,
      portfolio,
      invested,
      gains: Math.max(portfolio - invested, 0),
    });

    for (let month = 1; month <= projectionYears * 12; month += 1) {
      portfolio =
        portfolio * (1 + monthlyNominalReturn) + monthlySavings;
      invested += monthlySavings;

      if (month % 12 === 0) {
        projection.push({
          year: CURRENT_YEAR + month / 12,
          age: age + month / 12,
          portfolio,
          invested,
          gains: Math.max(portfolio - invested, 0),
        });
      }
    }

    const monthlyInvestmentNeeded = (() => {
      if (fiTarget <= currentPortfolio) return 0;

      const years = 10;
      const months = years * 12;
      const monthlyRate = expectedReturn / 100 / 12;

      if (Math.abs(monthlyRate) < 0.0000001) {
        return Math.max((fiTarget - currentPortfolio) / months, 0);
      }

      const futureCurrent =
        currentPortfolio * Math.pow(1 + monthlyRate, months);

      const annuityFactor =
        (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;

      return Math.max(
        (fiTarget - futureCurrent) / annuityFactor,
        0,
      );
    })();

    const expenseAtFi =
      monthlyExpenses *
      Math.pow(1 + inflation / 100, Math.max(yearsToFi ?? 0, 0));

    const inflationAdjustedTarget =
      expenseAtFi * 12 / (withdrawalRate / 100);

    const emergencyFund =
      monthlyExpenses * 6;

    return {
      annualExpenses,
      annualIncome,
      monthlySavings,
      annualSavings,
      savingsRate,
      fiTarget,
      currentProgress,
      realReturn,
      yearsToFi,
      fiAge,
      annualPassiveIncome,
      fireTypes,
      projection,
      monthlyInvestmentNeeded,
      expenseAtFi,
      inflationAdjustedTarget,
      emergencyFund,
    };
  }, [
    age,
    monthlyIncome,
    monthlyExpenses,
    currentPortfolio,
    expectedReturn,
    inflation,
    withdrawalRate,
  ]);

  const {
    annualExpenses,
    annualIncome,
    monthlySavings,
    savingsRate,
    fiTarget,
    currentProgress,
    realReturn,
    yearsToFi,
    fiAge,
    annualPassiveIncome,
    fireTypes,
    projection,
    monthlyInvestmentNeeded,
    expenseAtFi,
    inflationAdjustedTarget,
    emergencyFund,
  } = calculations;

  const formatYears = (years: number | null) => {
    if (years === null || !Number.isFinite(years)) return "—";
    if (years <= 0) return "Now";

    const wholeYears = Math.floor(years);
    const months = Math.round((years - wholeYears) * 12);

    if (wholeYears === 0) {
      return `${months} mo`;
    }

    if (months === 0) {
      return `${wholeYears} yr`;
    }

    return `${wholeYears} yr ${months} mo`;
  };

  const formatAge = (value: number | null) => {
    if (value === null || !Number.isFinite(value)) return "—";
    return `${value.toFixed(1)} yrs`;
  };

  const getFireYears = (target: number) => {
    if (currentPortfolio >= target) return 0;
    if (monthlySavings <= 0) return null;

    const monthlyRate = realReturn / 12;

    if (Math.abs(monthlyRate) < 0.0000001) {
      return (target - currentPortfolio) / monthlySavings / 12;
    }

    const numerator = target * monthlyRate + monthlySavings;
    const denominator =
      currentPortfolio * monthlyRate + monthlySavings;

    if (numerator <= 0 || denominator <= 0) return null;

    const months =
      Math.log(numerator / denominator) /
      Math.log(1 + monthlyRate);

    return months > 0 ? months / 12 : null;
  };

  const getProgressWidth = (value: number) =>
    `${Math.min(Math.max(value, 0), 100)}%`;

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  const cardClass =
    "rounded-2xl border border-slate-200 bg-white shadow-sm";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
              <Sparkles className="h-3.5 w-3.5" />
              Financial Independence Planner
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Build your path to financial independence
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
              Model your savings, investment growth, spending, and target
              financial independence date using your own numbers.
            </p>
          </div>

          <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab("planner")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeTab === "planner"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Planner
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("education")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeTab === "education"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Learn FIRE
            </button>
          </div>
        </div>

        {activeTab === "planner" ? (
          <>
            <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
              <section className={`${cardClass} p-5`}>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Calculator className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900">
                      Your assumptions
                    </h2>
                    <p className="text-xs text-slate-500">
                      Adjust the inputs to model your plan.
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      Current age
                    </span>
                    <input
                      type="number"
                      min={18}
                      max={100}
                      value={age}
                      onChange={(event) =>
                        setAge(Number(event.target.value))
                      }
                      className={inputClass}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      Monthly income
                    </span>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                        ₹
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={monthlyIncome}
                        onChange={(event) =>
                          setMonthlyIncome(Number(event.target.value))
                        }
                        className={`${inputClass} pl-8`}
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      Monthly expenses
                    </span>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                        ₹
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={monthlyExpenses}
                        onChange={(event) =>
                          setMonthlyExpenses(Number(event.target.value))
                        }
                        className={`${inputClass} pl-8`}
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      Current investments
                    </span>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                        ₹
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={currentPortfolio}
                        onChange={(event) =>
                          setCurrentPortfolio(Number(event.target.value))
                        }
                        className={`${inputClass} pl-8`}
                      />
                    </div>
                  </label>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">
                        Expected return
                      </span>
                      <span className="text-sm font-bold text-indigo-600">
                        {expectedReturn}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={20}
                      step={0.5}
                      value={expectedReturn}
                      onChange={(event) =>
                        setExpectedReturn(Number(event.target.value))
                      }
                      className="w-full accent-indigo-600"
                    />
                    <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                      <span>1%</span>
                      <span>20%</span>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">
                        Inflation
                      </span>
                      <span className="text-sm font-bold text-amber-600">
                        {inflation}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={12}
                      step={0.5}
                      value={inflation}
                      onChange={(event) =>
                        setInflation(Number(event.target.value))
                      }
                      className="w-full accent-amber-500"
                    />
                    <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                      <span>0%</span>
                      <span>12%</span>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">
                        Withdrawal rate
                      </span>
                      <span className="text-sm font-bold text-emerald-600">
                        {withdrawalRate}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={8}
                      step={0.5}
                      value={withdrawalRate}
                      onChange={(event) =>
                        setWithdrawalRate(Number(event.target.value))
                      }
                      className="w-full accent-emerald-600"
                    />
                    <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                      <span>2%</span>
                      <span>8%</span>
                    </div>
                  </div>
                </div>
              </section>

              <div className="space-y-6">
                <section className={`${cardClass} overflow-hidden`}>
                  <div className="border-b border-slate-100 p-5 sm:p-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500">
                          Financial independence target
                        </p>
                        <div className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                          {formatCurrency(fiTarget)}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Based on annual expenses of{" "}
                          {formatCurrency(annualExpenses)} and a{" "}
                          {withdrawalRate}% withdrawal rate.
                        </p>
                      </div>

                      <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full border-8 border-indigo-100 bg-indigo-50">
                        <span className="text-xl font-bold text-indigo-700">
                          {currentProgress.toFixed(0)}%
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-indigo-500">
                          funded
                        </span>
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-500">
                          Current portfolio
                        </span>
                        <span className="text-slate-900">
                          {formatCurrency(currentPortfolio)}
                        </span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-indigo-600 transition-all"
                          style={{
                            width: getProgressWidth(currentProgress),
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid divide-y border-b border-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                    <div className="p-5">
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <Clock3 className="h-4 w-4" />
                        Estimated time
                      </div>
                      <div className="text-2xl font-bold text-slate-900">
                        {formatYears(yearsToFi)}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Estimated age {formatAge(fiAge)}
                      </p>
                    </div>

                    <div className="p-5">
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <PiggyBank className="h-4 w-4" />
                        Monthly savings
                      </div>
                      <div className="text-2xl font-bold text-slate-900">
                        {formatCurrency(monthlySavings)}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {savingsRate.toFixed(1)}% savings rate
                      </p>
                    </div>

                    <div className="p-5">
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <CircleDollarSign className="h-4 w-4" />
                        Passive income
                      </div>
                      <div className="text-2xl font-bold text-slate-900">
                        {formatCurrency(annualPassiveIncome)}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Current annual withdrawal capacity
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-5 sm:p-6">
                    <div className="flex items-start gap-3">
                      {monthlySavings > 0 ? (
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                      ) : (
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {monthlySavings > 0
                            ? "You currently have positive monthly cash flow."
                            : "Your current plan has no monthly surplus."}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {monthlySavings > 0
                            ? `At your current savings rate, you are investing approximately ${formatCurrency(
                                monthlySavings,
                              )} every month toward financial independence.`
                            : "Increasing income, reducing expenses, or both can create the savings capacity needed to accelerate your path."}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className={`${cardClass} p-5 sm:p-6`}>
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-bold text-slate-900">
                        Portfolio projection
                      </h2>
                      <p className="mt-1 text-xs text-slate-500">
                        Illustrative growth based on your assumptions.
                      </p>
                    </div>
                    <div className="hidden items-center gap-4 text-xs font-medium text-slate-500 sm:flex">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                        Portfolio
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                        Invested
                      </span>
                    </div>
                  </div>

                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={projection}
                        margin={{
                          top: 10,
                          right: 10,
                          left: 0,
                          bottom: 0,
                        }}
                      >
                        <defs>
                          <linearGradient
                            id="portfolioGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#6366f1"
                              stopOpacity={0.25}
                            />
                            <stop
                              offset="95%"
                              stopColor="#6366f1"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="year"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 11 }}
                          tickFormatter={(value) =>
                            `₹${(value / 100000).toFixed(0)}L`
                          }
                        />
                        <Tooltip
                          formatter={(value, name) => [
                            formatCurrency(Number(value)),
                            name === "portfolio"
                              ? "Portfolio"
                              : "Invested",
                          ]}
                          labelFormatter={(label) => `Year ${label}`}
                        />
                        <Legend
                          verticalAlign="top"
                          height={30}
                          wrapperStyle={{
                            fontSize: 12,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="portfolio"
                          name="Portfolio"
                          stroke="#6366f1"
                          fill="url(#portfolioGradient)"
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="invested"
                          name="Invested"
                          stroke="#94a3b8"
                          fill="transparent"
                          strokeWidth={1.5}
                        />
                        {fiTarget > 0 && (
                          <ReferenceLine
                            y={fiTarget}
                            stroke="#10b981"
                            strokeDasharray="6 6"
                            label={{
                              value: "FI Target",
                              position: "insideTopRight",
                              fontSize: 11,
                            }}
                          />
                        )}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              </div>
            </div>

            <section className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className={`${cardClass} p-5`}>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-900">
                  Real return
                </h3>
                <div className="mt-2 text-2xl font-bold text-emerald-600">
                  {(realReturn * 100).toFixed(2)}%
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Your estimated return after accounting for the inflation
                  assumption.
                </p>
              </div>

              <div className={`${cardClass} p-5`}>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-900">
                  Emergency fund
                </h3>
                <div className="mt-2 text-2xl font-bold text-slate-900">
                  {formatCurrency(emergencyFund)}
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  A six-month baseline based on your current monthly expenses.
                </p>
              </div>

              <div className={`${cardClass} p-5`}>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Target className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-900">
                  10-year monthly target
                </h3>
                <div className="mt-2 text-2xl font-bold text-slate-900">
                  {formatCurrency(monthlyInvestmentNeeded)}
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Approximate monthly investment needed to reach today&apos;s FI
                  target within ten years under the assumed return.
                </p>
              </div>
            </section>

            <section className="mt-6">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-900">
                  Different FIRE targets
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Your target changes depending on the spending level and
                  withdrawal rate you want to support.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {fireTypes.map((fire) => {
                  const fireYears = getFireYears(fire.target);

                  return (
                    <div
                      key={fire.name}
                      className={`${cardClass} p-5`}
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-slate-900">
                            {fire.name}
                          </h3>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {fire.description}
                          </p>
                        </div>
                        <Zap className="h-5 w-5 shrink-0 text-indigo-500" />
                      </div>

                      <div className="text-2xl font-bold text-slate-900">
                        {formatCurrency(fire.target)}
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                        <span className="text-xs font-medium text-slate-500">
                          Estimated time
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          {formatYears(fireYears)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className={`${cardClass} p-5 sm:p-6`}>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900">
                      What your future expenses may look like
                    </h2>
                    <p className="text-xs text-slate-500">
                      Inflation-adjusted planning estimate.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Monthly expenses at estimated FI
                    </div>
                    <div className="mt-1 text-2xl font-bold text-slate-900">
                      {formatCurrency(expenseAtFi)}
                    </div>
                  </div>

                  <div className="rounded-xl bg-indigo-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
                      Inflation-adjusted FI target
                    </div>
                    <div className="mt-1 text-2xl font-bold text-indigo-700">
                      {formatCurrency(inflationAdjustedTarget)}
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <p className="text-xs leading-5 text-slate-500">
                      Inflation can materially increase the amount you need
                      in the future. This is an illustration rather than a
                      guaranteed forecast.
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${cardClass} p-5 sm:p-6`}>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900">
                      Savings capacity
                    </h2>
                    <p className="text-xs text-slate-500">
                      The biggest controllable driver in this model.
                    </p>
                  </div>
                </div>

                <div className="mb-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">
                      Savings rate
                    </span>
                    <span className="text-sm font-bold text-emerald-600">
                      {savingsRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{
                        width: getProgressWidth(savingsRate),
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="text-xs text-slate-500">
                      Annual income
                    </div>
                    <div className="mt-1 text-lg font-bold text-slate-900">
                      {formatCurrency(annualIncome)}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="text-xs text-slate-500">
                      Annual savings
                    </div>
                    <div className="mt-1 text-lg font-bold text-slate-900">
                      {formatCurrency(
                        Math.max(annualIncome - annualExpenses, 0),
                      )}
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-xs leading-5 text-slate-500">
                  A higher savings rate can shorten the time required to reach
                  financial independence, but it should remain sustainable
                  alongside your current quality of life.
                </p>
              </div>
            </section>

            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <h3 className="font-semibold text-amber-900">
                    Planning note
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    FIRE calculations are highly sensitive to investment
                    returns, inflation, taxes, spending changes, sequence of
                    returns, and unexpected life events. Use this planner as
                    an educational scenario tool rather than a guarantee of
                    future results.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <section className={`${cardClass} p-6 lg:col-span-2`}>
              <div className="mb-6">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Understanding Financial Independence
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Financial independence generally means having enough
                  assets or reliable passive income to cover your required
                  living expenses without depending entirely on employment
                  income.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-slate-900">
                    1. Know your spending
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Your spending level is one of the most important variables
                    in a FIRE plan. Lower sustainable expenses reduce the
                    portfolio required to support your lifestyle.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">
                    2. Build savings capacity
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    The difference between what you earn and what you spend
                    creates the capital available for investing. Increasing
                    income and controlling expenses can both improve this
                    capacity.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">
                    3. Invest consistently
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Long-term compounding means that contributions made early
                    can have significant effects over time. Consistency is
                    generally more useful than trying to perfectly predict
                    short-term market movements.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">
                    4. Understand withdrawal risk
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    A withdrawal rate is an assumption about how much of a
                    portfolio can be withdrawn each year. Actual sustainable
                    withdrawals depend on portfolio composition, valuation,
                    inflation, taxes, market conditions, and the length of
                    retirement.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">
                    5. Revisit the plan
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Your income, expenses, goals, family circumstances, and
                    investment assumptions can change. A useful FI plan is
                    therefore something you periodically review rather than a
                    single permanent calculation.
                  </p>
                </div>
              </div>
            </section>

            <aside className="space-y-6">
              <div className={`${cardClass} p-5`}>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-900">
                  A practical checklist
                </h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    Maintain an emergency reserve.
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    Track actual spending.
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    Invest according to your risk capacity.
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    Review assumptions periodically.
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    Keep short-term needs separate from long-term goals.
                  </li>
                </ul>
              </div>

              <div className={`${cardClass} p-5`}>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Info className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-900">
                  What this planner does
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  It converts your current income, expenses, investments,
                  return assumptions, inflation, and withdrawal rate into
                  scenario-based projections. It does not predict actual
                  market returns or guarantee a particular retirement date.
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

