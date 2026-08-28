"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
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

  const [targetYears, setTargetYears] = useState(15);

  /* ----------------------------------------------------------
     BASIC FINANCIAL METRICS
  ---------------------------------------------------------- */

  const monthlySavings = Math.max(
    0,
    monthlyIncome - monthlyExpenses
  );

  const annualIncome = monthlyIncome * 12;
  const annualExpenses = monthlyExpenses * 12;
  const annualSavings = monthlySavings * 12;

  const savingsRate =
    monthlyIncome > 0
      ? (monthlySavings / monthlyIncome) * 100
      : 0;

  /*
   * Real return:
   *
   * (1 + nominal return)
   * -------------------- - 1
   * (1 + inflation)
   */
  const realReturn =
    ((1 + expectedReturn / 100) /
      (1 + inflation / 100) -
      1) *
    100;

  /*
   * Present-day FI number.
   */
  const fiNumber =
    withdrawalRate > 0
      ? annualExpenses / (withdrawalRate / 100)
      : 0;

  /*
   * Future annual expenses after inflation.
   */
  const futureAnnualExpenses =
    annualExpenses *
    Math.pow(1 + inflation / 100, targetYears);

  /*
   * Future FI target.
   *
   * This is the amount required at the target date
   * to support the inflation-adjusted lifestyle.
   */
  const futureFiNumber =
    withdrawalRate > 0
      ? futureAnnualExpenses / (withdrawalRate / 100)
      : 0;

  /* ----------------------------------------------------------
     PROJECTION ENGINE
  ---------------------------------------------------------- */

  const projection = useMemo<ProjectionPoint[]>(() => {
    const points: ProjectionPoint[] = [];

    let portfolio = Math.max(0, currentPortfolio);
    let invested = Math.max(0, currentPortfolio);

    const monthlyRate =
      Math.pow(1 + expectedReturn / 100, 1 / 12) - 1;

    for (let year = 0; year <= 50; year++) {
      points.push({
        year,
        age: age + year,
        portfolio: Math.round(portfolio),
        invested: Math.round(invested),
        gains: Math.round(
          Math.max(0, portfolio - invested)
        ),
      });

      for (let month = 0; month < 12; month++) {
        portfolio =
          portfolio * (1 + monthlyRate) +
          monthlySavings;

        invested += monthlySavings;
      }
    }

    return points;
  }, [
    age,
    currentPortfolio,
    expectedReturn,
    monthlySavings,
  ]);

  /* ----------------------------------------------------------
     FUTURE TARGET POSITION
  ---------------------------------------------------------- */

  const targetProjection =
    projection.find(
      (item) => item.year === targetYears
    ) ?? projection[projection.length - 1];

  const projectedPortfolio =
    targetProjection?.portfolio ?? 0;

  const projectedInvested =
    targetProjection?.invested ?? 0;

  const projectedGains =
    targetProjection?.gains ?? 0;

  const targetGap =
    projectedPortfolio - futureFiNumber;

  /* ----------------------------------------------------------
     FI YEAR
  ---------------------------------------------------------- */

  const fiPoint =
    projection.find(
      (item) => item.portfolio >= fiNumber
    ) ?? null;

  const yearsToFI = fiPoint?.year ?? null;

  const estimatedFiYear =
    yearsToFI !== null
      ? CURRENT_YEAR + yearsToFI
      : null;

  const estimatedFiAge =
    fiPoint?.age ?? null;

  /* ----------------------------------------------------------
     REQUIRED MONTHLY INVESTMENT
  ---------------------------------------------------------- */

  const requiredMonthlyInvestment = useMemo(() => {
    if (targetYears <= 0) {
      return currentPortfolio >= futureFiNumber
        ? 0
        : null;
    }

    if (currentPortfolio >= futureFiNumber) {
      return 0;
    }

    const months = targetYears * 12;

    const monthlyRate =
      Math.pow(1 + expectedReturn / 100, 1 / 12) - 1;

    const futureValueOfCurrentPortfolio =
      currentPortfolio *
      Math.pow(1 + monthlyRate, months);

    const amountRequired = Math.max(
      0,
      futureFiNumber -
        futureValueOfCurrentPortfolio
    );

    if (amountRequired <= 0) {
      return 0;
    }

    if (Math.abs(monthlyRate) < 0.0000001) {
      return amountRequired / months;
    }

    const annuityFactor =
      (Math.pow(1 + monthlyRate, months) - 1) /
      monthlyRate;

    if (annuityFactor <= 0) {
      return null;
    }

    return amountRequired / annuityFactor;
  }, [
    currentPortfolio,
    expectedReturn,
    futureFiNumber,
    targetYears,
  ]);

  const monthlyInvestmentGap =
    requiredMonthlyInvestment !== null
      ? monthlySavings - requiredMonthlyInvestment
      : null;

  /* ----------------------------------------------------------
     COAST FIRE
  ---------------------------------------------------------- */

  const coastFireNumber = useMemo(() => {
    const growthFactor = Math.pow(
      1 + expectedReturn / 100,
      targetYears
    );

    return growthFactor > 0
      ? futureFiNumber / growthFactor
      : futureFiNumber;
  }, [
    expectedReturn,
    futureFiNumber,
    targetYears,
  ]);

  const coastProgress =
    coastFireNumber > 0
      ? Math.min(
          100,
          (currentPortfolio / coastFireNumber) *
            100
        )
      : 0;

  const coastReached =
    currentPortfolio >= coastFireNumber;

  /* ----------------------------------------------------------
     FIRE VARIANTS
  ---------------------------------------------------------- */

  const fireTargets = useMemo<FireType[]>(() => {
    const variants = [
      {
        name: "Lean FIRE",
        multiplier: 0.75,
        description:
          "A lower-cost lifestyle requiring about 75% of your current spending.",
      },
      {
        name: "Regular FIRE",
        multiplier: 1,
        description:
          "Your current lifestyle supported by the selected withdrawal rate.",
      },
      {
        name: "Fat FIRE",
        multiplier: 1.5,
        description:
          "A higher-spending lifestyle with approximately 50% more annual expenses.",
      },
    ];

    return variants.map((variant) => {
      const target =
        fiNumber * variant.multiplier;

      const years =
        calculateYearsToTarget(
          currentPortfolio,
          target,
          monthlySavings,
          expectedReturn
        );

      return {
        ...variant,
        target,
        years,
      };
    });
  }, [
    currentPortfolio,
    expectedReturn,
    fiNumber,
    monthlySavings,
  ]);

  /* ----------------------------------------------------------
     HEALTH / STATUS
  ---------------------------------------------------------- */

  const savingsHealth =
    savingsRate >= 50
      ? "Exceptional"
      : savingsRate >= 35
      ? "Excellent"
      : savingsRate >= 20
      ? "Strong"
      : savingsRate >= 10
      ? "Moderate"
      : "Needs attention";

  const progress =
    fiNumber > 0
      ? Math.min(
          100,
          (currentPortfolio / fiNumber) * 100
        )
      : 0;

  const targetStatus =
    targetGap >= 0
      ? "Target covered"
      : "Target gap";

  /* ----------------------------------------------------------
     RENDER
  ---------------------------------------------------------- */

  return (
    <main className="min-h-full">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">

        {/* HEADER */}

        <section>
          <div className="mb-3 flex items-center gap-2 text-orange-400">
            <Target className="h-5 w-5" />

            <span className="text-xs font-bold uppercase tracking-[0.18em]">
              Financial Planning
            </span>
          </div>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Financial Independence Planner
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
                Build a personalized path to financial independence
                using your income, spending, savings, inflation and
                investment assumptions.
              </p>
            </div>

            <div className="flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300">
              <Zap className="h-3.5 w-3.5" />
              Live model
            </div>
          </div>
        </section>

        {/* DISCLAIMER */}

        <section className="flex gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />

          <div>
            <p className="text-sm font-semibold text-amber-300">
              Educational projection only
            </p>

            <p className="mt-1 text-xs leading-5 text-amber-200/60">
              This planner uses mathematical assumptions and is not
              financial advice. Actual returns, inflation, taxes,
              fees, spending and market conditions can differ
              significantly.
            </p>
          </div>
        </section>

        {/* TOP METRICS */}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<Target className="h-5 w-5" />}
            title="FI Number"
            value={formatCurrency(fiNumber)}
            subtitle={`${withdrawalRate.toFixed(
              2
            )}% withdrawal rate`}
            tone="orange"
          />

          <MetricCard
            icon={<PiggyBank className="h-5 w-5" />}
            title="Monthly Savings"
            value={formatCurrency(monthlySavings)}
            subtitle={`${savingsRate.toFixed(
              1
            )}% savings rate`}
            tone="emerald"
          />

          <MetricCard
            icon={<Clock3 className="h-5 w-5" />}
            title="Estimated FI"
            value={
              yearsToFI !== null
                ? `${yearsToFI} yrs`
                : "40+ yrs"
            }
            subtitle={
              estimatedFiAge !== null
                ? `Around age ${estimatedFiAge}`
                : "Beyond projection"
            }
            tone="blue"
          />

          <MetricCard
            icon={<TrendingUp className="h-5 w-5" />}
            title="Real Return"
            value={`${realReturn.toFixed(2)}%`}
            subtitle="After inflation"
            tone="purple"
          />
        </section>

        {/* INPUTS + PROGRESS */}

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">

          {/* INPUT PANEL */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
            <div className="mb-7 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10">
                <Calculator className="h-5 w-5 text-orange-400" />
              </div>

              <div>
                <h2 className="font-semibold text-white">
                  Your assumptions
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Change a value to instantly recalculate your plan.
                </p>
              </div>
            </div>

            <div className="space-y-7">
              <SliderInput
                label="Current Age"
                value={age}
                onChange={setAge}
                min={18}
                max={70}
                step={1}
                suffix=" years"
              />

              <SliderInput
                label="Monthly Income"
                value={monthlyIncome}
                onChange={setMonthlyIncome}
                min={10000}
                max={1000000}
                step={5000}
              />

              <SliderInput
                label="Monthly Expenses"
                value={monthlyExpenses}
                onChange={setMonthlyExpenses}
                min={5000}
                max={500000}
                step={5000}
              />

              <SliderInput
                label="Current Investments"
                value={currentPortfolio}
                onChange={setCurrentPortfolio}
                min={0}
                max={50000000}
                step={50000}
              />

              <SliderInput
                label="Expected Annual Return"
                value={expectedReturn}
                onChange={setExpectedReturn}
                min={4}
                max={20}
                step={0.5}
                suffix="%"
              />

              <SliderInput
                label="Expected Inflation"
                value={inflation}
                onChange={setInflation}
                min={2}
                max={12}
                step={0.5}
                suffix="%"
              />

              <SliderInput
                label="Withdrawal Rate"
                value={withdrawalRate}
                onChange={setWithdrawalRate}
                min={2.5}
                max={6}
                step={0.25}
                suffix="%"
              />

              <SliderInput
                label="Target Horizon"
                value={targetYears}
                onChange={setTargetYears}
                min={1}
                max={40}
                step={1}
                suffix=" years"
              />
            </div>
          </div>

          {/* SUMMARY PANEL */}

          <div className="space-y-4">

            {/* FI PROGRESS */}

            <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/[0.12] via-slate-900 to-slate-900 p-6">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-orange-400">
                    FI progress
                  </p>

                  <p className="mt-2 text-4xl font-bold text-white">
                    {progress.toFixed(1)}%
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    {formatCurrency(currentPortfolio)} of{" "}
                    {formatCurrency(fiNumber)}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10">
                  <Target className="h-6 w-6 text-orange-400" />
                </div>
              </div>

              <div className="mt-6">
                <ProgressBar value={progress} />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <MiniMetric
                  label="Remaining"
                  value={formatCurrency(
                    Math.max(
                      0,
                      fiNumber - currentPortfolio
                    )
                  )}
                />

                <MiniMetric
                  label="Annual spending"
                  value={formatCurrency(
                    annualExpenses
                  )}
                />
              </div>
            </div>

            {/* SAVINGS HEALTH */}

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500">
                    Savings health
                  </p>

                  <p className="mt-1 text-xl font-bold text-white">
                    {savingsHealth}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                </div>
              </div>

              <div className="mt-5">
                <ProgressBar value={savingsRate} />
              </div>

              <div className="mt-2 flex justify-between text-[11px] text-slate-600">
                <span>0%</span>
                <span className="font-semibold text-emerald-400">
                  {savingsRate.toFixed(1)}%
                </span>
                <span>100%</span>
              </div>

              <p className="mt-4 text-xs leading-5 text-slate-500">
                {getSavingsMessage(savingsRate)}
              </p>
            </div>

            {/* INCOME / EXPENSE */}

            <div className="grid grid-cols-2 gap-4">
              <SmallCard
                icon={
                  <CircleDollarSign className="h-4 w-4" />
                }
                label="Annual income"
                value={formatCurrency(
                  annualIncome
                )}
              />

              <SmallCard
                icon={
                  <Wallet className="h-4 w-4" />
                }
                label="Annual savings"
                value={formatCurrency(
                  annualSavings
                )}
              />
            </div>
          </div>
        </section>

        {/* FUTURE TARGET */}

        <section>
          <SectionHeader
            icon={
              <Clock3 className="h-5 w-5 text-blue-400" />
            }
            title="Your future FI target"
            description="Inflation changes the amount required to maintain the same lifestyle."
          />

          <div className="grid gap-4 md:grid-cols-3">
            <InsightMetric
              title="FI number today"
              value={formatCurrency(fiNumber)}
              description="Portfolio required using today's spending."
            />

            <InsightMetric
              title={`Annual spending in ${targetYears} years`}
              value={formatCurrency(
                futureAnnualExpenses
              )}
              description={`Assuming ${inflation.toFixed(
                1
              )}% annual inflation.`}
            />

            <InsightMetric
              title={`FI number in ${targetYears} years`}
              value={formatCurrency(
                futureFiNumber
              )}
              description="Inflation-adjusted portfolio target."
              highlight
            />
          </div>
        </section>

        {/* TARGET HORIZON + SIP */}

        <section className="grid gap-6 lg:grid-cols-2">

          {/* TARGET RESULT */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                  Target horizon
                </p>

                <h2 className="mt-2 text-xl font-bold text-white">
                  {targetYears} years
                </h2>
              </div>

              <div
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  targetGap >= 0
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                    : "border-orange-500/20 bg-orange-500/10 text-orange-300"
                }`}
              >
                {targetStatus}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <MiniMetric
                label="Projected portfolio"
                value={formatCurrency(
                  projectedPortfolio
                )}
              />

              <MiniMetric
                label="Required target"
                value={formatCurrency(
                  futureFiNumber
                )}
              />
            </div>

            <div
              className={`mt-4 rounded-xl border p-4 ${
                targetGap >= 0
                  ? "border-emerald-500/20 bg-emerald-500/[0.06]"
                  : "border-orange-500/20 bg-orange-500/[0.06]"
              }`}
            >
              <div className="flex items-center gap-2">
                {targetGap >= 0 ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-400" />
                )}

                <span
                  className={`text-sm font-semibold ${
                    targetGap >= 0
                      ? "text-emerald-300"
                      : "text-orange-300"
                  }`}
                >
                  {targetGap >= 0
                    ? `${formatCurrency(
                        targetGap
                      )} projected surplus`
                    : `${formatCurrency(
                        Math.abs(targetGap)
                      )} projected gap`}
                </span>
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                This compares your projected portfolio with
                the inflation-adjusted FI target at the end
                of your selected horizon.
              </p>
            </div>
          </div>

          {/* REQUIRED SIP */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10">
                <Calculator className="h-5 w-5 text-purple-400" />
              </div>

              <div>
                <h2 className="font-semibold text-white">
                  Required monthly investment
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Contribution needed to reach the future target.
                </p>
              </div>
            </div>

            <p className="text-3xl font-bold text-white">
              {requiredMonthlyInvestment !== null
                ? formatCurrency(
                    requiredMonthlyInvestment
                  )
                : "—"}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              estimated monthly contribution
            </p>

            <div className="mt-5 space-y-3">
              <InfoRow
                label="Current monthly savings"
                value={formatCurrency(
                  monthlySavings
                )}
              />

              <InfoRow
                label="Difference"
                value={
                  monthlyInvestmentGap === null
                    ? "—"
                    : monthlyInvestmentGap >= 0
                    ? `+${formatCurrency(
                        monthlyInvestmentGap
                      )}`
                    : `-${formatCurrency(
                        Math.abs(
                          monthlyInvestmentGap
                        )
                      )}`
                }
              />
            </div>

            {monthlyInvestmentGap !== null && (
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="text-xs leading-5 text-slate-500">
                  {monthlyInvestmentGap >= 0
                    ? "Your current monthly savings are above the estimated contribution required for this target."
                    : "Increasing your monthly investment could help close the gap while keeping the same target horizon."}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* COAST FIRE */}

        <section className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.08] via-slate-900 to-slate-900 p-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_300px] lg:items-center">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-cyan-400" />

                <h2 className="text-lg font-semibold text-white">
                  Coast FIRE
                </h2>
              </div>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                Coast FIRE is the estimated amount you need invested
                today for that portfolio to potentially grow into
                your future FI target without additional contributions,
                assuming the selected return.
              </p>

              <div className="mt-5 max-w-xl">
                <ProgressBar value={coastProgress} />

                <div className="mt-2 flex justify-between text-xs">
                  <span className="text-slate-600">
                    Current portfolio
                  </span>

                  <span className="font-semibold text-cyan-300">
                    {coastProgress.toFixed(1)}%
                  </span>

                  <span className="text-slate-600">
                    Coast target
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-500/15 bg-slate-950/50 p-5">
              <p className="text-xs text-slate-500">
                Coast FIRE number
              </p>

              <p className="mt-2 text-2xl font-bold text-cyan-300">
                {formatCurrency(
                  coastFireNumber
                )}
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                {coastReached
                  ? "Your current portfolio is already above this estimate."
                  : `You need approximately ${formatCurrency(
                      Math.max(
                        0,
                        coastFireNumber -
                          currentPortfolio
                      )
                    )} more.`}
              </p>
            </div>
          </div>
        </section>

        {/* FIRE VARIANTS */}

        <section>
          <SectionHeader
            icon={
              <Landmark className="h-5 w-5 text-orange-400" />
            }
            title="FIRE scenarios"
            description="Different lifestyles produce different financial independence targets."
          />

          <div className="grid gap-4 md:grid-cols-3">
            {fireTargets.map((item) => (
              <FireCard
                key={item.name}
                item={item}
              />
            ))}
          </div>
        </section>

        {/* CHART */}

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-cyan-400" />

                <h2 className="text-lg font-semibold text-white">
                  Wealth projection
                </h2>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                Estimated portfolio growth based on your current assumptions.
              </p>
            </div>

            {estimatedFiYear !== null && (
              <div className="w-fit rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                FI around {estimatedFiYear}
              </div>
            )}
          </div>

          <div className="h-[380px] w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <AreaChart
                data={projection}
                margin={{
                  top: 10,
                  right: 15,
                  left: 0,
                  bottom: 10,
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
                      stopColor="#22d3ee"
                      stopOpacity={0.25}
                    />

                    <stop
                      offset="95%"
                      stopColor="#22d3ee"
                      stopOpacity={0}
                    />
                  </linearGradient>

                  <linearGradient
                    id="investedGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#a78bfa"
                      stopOpacity={0.16}
                    />

                    <stop
                      offset="95%"
                      stopColor="#a78bfa"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="age"
                  tick={{
                    fill: "#64748b",
                    fontSize: 11,
                  }}
                  axisLine={{
                    stroke: "#334155",
                  }}
                  tickLine={false}
                  minTickGap={25}
                />

                <YAxis
                  width={72}
                  tick={{
                    fill: "#64748b",
                    fontSize: 11,
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) =>
                    formatCompactCurrency(
                      Number(value)
                    )
                  }
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#020617",
                    border: "1px solid #334155",
                    borderRadius: "12px",
                  }}
                  labelStyle={{
                    color: "#94a3b8",
                    marginBottom: 8,
                  }}
                  formatter={(value, name) => {
                    const labels: Record<
                      string,
                      string
                    > = {
                      portfolio:
                        "Portfolio",
                      invested:
                        "Invested",
                    };

                    return [
                      formatCurrency(
                        Number(value)
                      ),
                      labels[
                        String(name)
                      ] ??
                        String(name),
                    ];
                  }}
                  labelFormatter={(label) =>
                    `Age ${label}`
                  }
                />

                <Legend
                  wrapperStyle={{
                    color: "#94a3b8",
                    fontSize: "12px",
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="portfolio"
                  name="Portfolio"
                  stroke="#22d3ee"
                  strokeWidth={3}
                  fill="url(#portfolioGradient)"
                />

                <Area
                  type="monotone"
                  dataKey="invested"
                  name="Invested"
                  stroke="#a78bfa"
                  strokeWidth={2}
                  fill="url(#investedGradient)"
                />

                {fiNumber > 0 && (
                  <ReferenceLine
                    y={fiNumber}
                    stroke="#fb923c"
                    strokeDasharray="7 7"
                    label={{
                      value: "FI number today",
                      position:
                        "insideTopRight",
                      fill: "#fb923c",
                      fontSize: 11,
                    }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* COMPOUNDING BREAKDOWN */}

        <section>
          <SectionHeader
            icon={
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            }
            title={`After ${targetYears} years`}
            description="Understand how much comes from your contributions versus compounding."
          />

          <div className="grid gap-4 md:grid-cols-3">
            <InsightMetric
              title="Invested capital"
              value={formatCurrency(
                projectedInvested
              )}
              description="Current portfolio plus future contributions."
            />

            <InsightMetric
              title="Estimated investment gains"
              value={formatCurrency(
                projectedGains
              )}
              description="Estimated growth under the selected return."
            />

            <InsightMetric
              title="Projected portfolio"
              value={formatCurrency(
                projectedPortfolio
              )}
              description="Estimated total portfolio value."
              highlight
            />
          </div>
        </section>

        {/* SMART INSIGHTS */}

        <section className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.04] p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10">
              <Sparkles className="h-5 w-5 text-purple-400" />
            </div>

            <div>
              <h2 className="font-semibold text-white">
                FinPilot insights
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Generated from the assumptions currently entered.
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <InsightRow>
              You currently save{" "}
              <strong className="text-white">
                {savingsRate.toFixed(1)}%
              </strong>{" "}
              of your monthly income.
            </InsightRow>

            <InsightRow>
              Your nominal return assumption of{" "}
              <strong className="text-white">
                {expectedReturn.toFixed(1)}%
              </strong>{" "}
              becomes approximately{" "}
              <strong className="text-white">
                {realReturn.toFixed(1)}%
              </strong>{" "}
              after {inflation.toFixed(1)}% inflation.
            </InsightRow>

            <InsightRow>
              Your current annual lifestyle costs{" "}
              <strong className="text-white">
                {formatCurrency(
                  annualExpenses
                )}
              </strong>
              . At the selected inflation rate, that could become
              approximately{" "}
              <strong className="text-white">
                {formatCurrency(
                  futureAnnualExpenses
                )}
              </strong>{" "}
              per year in {targetYears} years.
            </InsightRow>

            <InsightRow>
              {yearsToFI !== null
                ? `Under the current model, you cross today's FI number around age ${estimatedFiAge}.`
                : "Your current assumptions do not reach today's FI number within the 50-year projection."}
            </InsightRow>
          </div>
        </section>

        {/* ACTION AREAS */}

        <section className="grid gap-6 md:grid-cols-2">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-5 flex items-center gap-3">
              <Zap className="h-5 w-5 text-emerald-400" />

              <h2 className="font-semibold text-white">
                Levers that can accelerate FI
              </h2>
            </div>

            <div className="space-y-3">
              <ActionRow>
                Increase the difference between your income and
                expenses.
              </ActionRow>

              <ActionRow>
                Invest a portion of future income increases rather
                than allowing all of them to become lifestyle inflation.
              </ActionRow>

              <ActionRow>
                Review recurring expenses and eliminate low-value
                spending.
              </ActionRow>

              <ActionRow>
                Keep your investment strategy diversified and aligned
                with your risk tolerance.
              </ActionRow>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-5 flex items-center gap-3">
              <Info className="h-5 w-5 text-blue-400" />

              <h2 className="font-semibold text-white">
                Model assumptions
              </h2>
            </div>

            <div className="space-y-3">
              <InfoRow
                label="Current age"
                value={`${age} years`}
              />

              <InfoRow
                label="Monthly income"
                value={formatCurrency(
                  monthlyIncome
                )}
              />

              <InfoRow
                label="Monthly expenses"
                value={formatCurrency(
                  monthlyExpenses
                )}
              />

              <InfoRow
                label="Expected return"
                value={`${expectedReturn.toFixed(
                  1
                )}%`}
              />

              <InfoRow
                label="Inflation"
                value={`${inflation.toFixed(
                  1
                )}%`}
              />

              <InfoRow
                label="Withdrawal rate"
                value={`${withdrawalRate.toFixed(
                  2
                )}%`}
              />
            </div>
          </div>
        </section>

        {/* EDUCATIONAL FOOTER */}

        <section className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.05] p-6">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-400" />

            <div>
              <h3 className="font-semibold text-white">
                How to use this planner
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Start with realistic income and spending figures.
                Then test conservative and optimistic return and
                inflation assumptions. Compare your target horizon,
                required monthly investment and FIRE scenarios instead
                of relying on a single projected outcome.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ============================================================
   METRIC CARD
============================================================ */

function MetricCard({
  icon,
  title,
  value,
  subtitle,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  tone:
    | "orange"
    | "emerald"
    | "blue"
    | "purple";
}) {
  const styles = {
    orange:
      "border-orange-500/20 bg-orange-500/10 text-orange-400",
    emerald:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    blue:
      "border-blue-500/20 bg-blue-500/10 text-blue-400",
    purple:
      "border-purple-500/20 bg-purple-500/10 text-purple-400",
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border ${styles[tone]}`}
        >
          {icon}
        </div>

        <span className="text-xs text-slate-500">
          {title}
        </span>
      </div>

      <p className="text-xl font-bold text-white">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {subtitle}
      </p>
    </div>
  );
}

/* ============================================================
   SLIDER
============================================================ */

function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix = "",
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
}) {
  const displayValue =
    suffix === "%"
      ? `${value.toFixed(
          step < 1 ? 2 : 1
        )}%`
      : suffix === " years"
      ? `${value} years`
      : formatCurrency(value);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <label className="text-sm font-medium text-slate-300">
          {label}
        </label>

        <span className="text-sm font-bold text-orange-400">
          {displayValue}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) =>
          onChange(
            Number(event.target.value)
          )
        }
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-orange-500"
      />

      <div className="mt-2 flex justify-between text-[11px] text-slate-600">
        <span>
          {suffix === "%"
            ? `${min}%`
            : suffix === " years"
            ? `${min} yr`
            : formatCurrency(min)}
        </span>

        <span>
          {suffix === "%"
            ? `${max}%`
            : suffix === " years"
            ? `${max} yrs`
            : formatCurrency(max)}
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   PROGRESS
============================================================ */

function ProgressBar({
  value,
}: {
  value: number;
}) {
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
      <div
        className="h-full rounded-full bg-gradient-to-r from-orange-500 via-cyan-400 to-emerald-400 transition-all duration-500"
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
   MINI METRIC
============================================================ */

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
      <p className="text-[11px] text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-white">
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   SMALL CARD
============================================================ */

function SmallCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
        {icon}
      </div>

      <p className="text-[11px] text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-white sm:text-base">
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   SECTION HEADER
============================================================ */

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        {icon}

        <h2 className="text-lg font-semibold text-white">
          {title}
        </h2>
      </div>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

/* ============================================================
   INSIGHT METRIC
============================================================ */

function InsightMetric({
  title,
  value,
  description,
  highlight = false,
}: {
  title: string;
  value: string;
  description: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        highlight
          ? "border-orange-500/25 bg-orange-500/[0.07]"
          : "border-slate-800 bg-slate-900"
      }`}
    >
      <p className="text-xs text-slate-500">
        {title}
      </p>

      <p
        className={`mt-2 text-xl font-bold ${
          highlight
            ? "text-orange-300"
            : "text-white"
        }`}
      >
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

/* ============================================================
   FIRE CARD
============================================================ */

function FireCard({
  item,
}: {
  item: FireType;
}) {
  const tone =
    item.name === "Lean FIRE"
      ? "emerald"
      : item.name === "Fat FIRE"
      ? "purple"
      : "orange";

  const styles = {
    emerald:
      "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-300",
    orange:
      "border-orange-500/20 bg-orange-500/[0.06] text-orange-300",
    purple:
      "border-purple-500/20 bg-purple-500/[0.06] text-purple-300",
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">
            {item.name}
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            {item.multiplier.toFixed(2)}× current FI target
          </p>
        </div>

        <span
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${styles[tone]}`}
        >
          FIRE
        </span>
      </div>

      <p className="mt-5 text-2xl font-bold text-white">
        {formatCurrency(item.target)}
      </p>

      <p className="mt-2 min-h-[50px] text-xs leading-5 text-slate-500">
        {item.description}
      </p>

      <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
        <span className="text-xs text-slate-500">
          Timeline
        </span>

        <span className="text-sm font-semibold text-slate-200">
          {item.years !== null
            ? `${item.years} years`
            : "40+ years"}
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   INFO ROW
============================================================ */

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
      <span className="text-xs text-slate-400">
        {label}
      </span>

      <span className="text-right text-xs font-semibold text-white">
        {value}
      </span>
    </div>
  );
}

/* ============================================================
   ACTION ROW
============================================================ */

function ActionRow({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />

      <p className="text-sm leading-5 text-slate-400">
        {children}
      </p>
    </div>
  );
}

/* ============================================================
   INSIGHT ROW
============================================================ */

function InsightRow({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-purple-500/10 bg-slate-950/30 p-4">
      <p className="text-sm leading-6 text-slate-400">
        {children}
      </p>
    </div>
  );
}

/* ============================================================
   YEARS TO TARGET
============================================================ */

function calculateYearsToTarget(
  initialPortfolio: number,
  target: number,
  monthlyContribution: number,
  annualReturn: number
): number | null {
  if (initialPortfolio >= target) {
    return 0;
  }

  if (
    monthlyContribution <= 0 &&
    annualReturn <= 0
  ) {
    return null;
  }

  let portfolio = Math.max(
    0,
    initialPortfolio
  );

  const monthlyRate =
    Math.pow(
      1 + annualReturn / 100,
      1 / 12
    ) - 1;

  for (
    let month = 1;
    month <= 60 * 12;
    month++
  ) {
    portfolio =
      portfolio *
        (1 + monthlyRate) +
      Math.max(
        0,
        monthlyContribution
      );

    if (portfolio >= target) {
      return Math.ceil(month / 12);
    }
  }

  return null;
}

/* ============================================================
   SAVINGS MESSAGE
============================================================ */

function getSavingsMessage(
  savingsRate: number
): string {
  if (savingsRate >= 50) {
    return "Exceptional savings rate. Maintaining this gap can significantly accelerate wealth accumulation.";
  }

  if (savingsRate >= 35) {
    return "Excellent savings rate. You are directing a substantial portion of income toward future wealth.";
  }

  if (savingsRate >= 20) {
    return "Strong foundation. Increasing the savings rate gradually could shorten your FI timeline.";
  }

  if (savingsRate >= 10) {
    return "Moderate savings rate. Look for opportunities to increase income or reduce recurring expenses.";
  }

  return "Your current savings gap is relatively small. Improving cash-flow surplus should be a priority before relying heavily on investment returns.";
}

/* ============================================================
   COMPACT CURRENCY
============================================================ */

function formatCompactCurrency(
  value: number
): string {
  if (!Number.isFinite(value)) {
    return "₹0";
  }

  if (Math.abs(value) >= 10000000) {
    return `₹${(
      value / 10000000
    ).toFixed(1)}Cr`;
  }

  if (Math.abs(value) >= 100000) {
    return `₹${(
      value / 100000
    ).toFixed(1)}L`;
  }

  if (Math.abs(value) >= 1000) {
    return `₹${(
      value / 1000
    ).toFixed(0)}K`;
  }

  return `₹${Math.round(value)}`;
}