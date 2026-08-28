"use client";

import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Save,
  Loader2,
  IndianRupee,
  Percent,
  CalendarDays,
  ArrowUpRight,
  Wallet,
  PiggyBank,
  ShieldCheck,
  Info,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type Mode = "sip" | "lumpsum";

type Projection = {
  year: number;
  invested: number;
  value: number;
};

type CalculatorResult = {
  total_invested: number;
  maturity_value: number;
  wealth_gained: number;
  inflation_adjusted_value: number;
  yearly_projections: Projection[];
};

/* ================================================================
   FORMATTERS
================================================================ */

function formatINR(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;

  return `₹${safe.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

function formatLakh(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;

  if (safe >= 10000000) {
    return `₹${(safe / 10000000).toFixed(2)} Cr`;
  }

  if (safe >= 100000) {
    return `₹${(safe / 100000).toFixed(2)} L`;
  }

  if (safe >= 1000) {
    return `₹${Math.round(safe).toLocaleString("en-IN")}`;
  }

  return `₹${Math.round(safe).toLocaleString("en-IN")}`;
}

/* ================================================================
   LOCAL CALCULATOR
================================================================ */

function calculateProjection(
  mode: Mode,
  monthly: number,
  principal: number,
  annualRate: number,
  years: number,
  inflation: number
): CalculatorResult {
  const safeMonthly = Number.isFinite(monthly)
    ? Math.max(0, monthly)
    : 0;

  const safePrincipal = Number.isFinite(principal)
    ? Math.max(0, principal)
    : 0;

  const safeRate = Number.isFinite(annualRate)
    ? Math.max(0, annualRate)
    : 0;

  const safeYears = Number.isFinite(years)
    ? Math.max(1, Math.floor(years))
    : 1;

  const safeInflation = Number.isFinite(inflation)
    ? Math.max(0, inflation)
    : 0;

  const monthlyRate = safeRate / 100 / 12;

  const yearlyProjections: Projection[] = [];

  let totalValue = 0;

  for (let year = 1; year <= safeYears; year++) {
    const months = year * 12;

    let value: number;
    let invested: number;

    if (mode === "sip") {
      invested = safeMonthly * months;

      if (monthlyRate === 0) {
        value = invested;
      } else {
        value =
          safeMonthly *
          (((1 + monthlyRate) ** months - 1) /
            monthlyRate) *
          (1 + monthlyRate);
      }
    } else {
      invested = safePrincipal;

      value =
        safeRate === 0
          ? safePrincipal
          : safePrincipal *
            (1 + safeRate / 100) ** year;
    }

    if (!Number.isFinite(value)) {
      value = invested;
    }

    yearlyProjections.push({
      year,
      invested,
      value,
    });

    totalValue = value;
  }

  const totalInvested =
    mode === "sip"
      ? safeMonthly * 12 * safeYears
      : safePrincipal;

  const maturityValue = Number.isFinite(totalValue)
    ? totalValue
    : totalInvested;

  const wealthGained = Math.max(
    0,
    maturityValue - totalInvested
  );

  const inflationAdjustedValue =
    safeInflation === 0
      ? maturityValue
      : maturityValue /
        (1 + safeInflation / 100) ** safeYears;

  return {
    total_invested: totalInvested,
    maturity_value: maturityValue,
    wealth_gained: wealthGained,
    inflation_adjusted_value:
      Number.isFinite(inflationAdjustedValue)
        ? inflationAdjustedValue
        : maturityValue,
    yearly_projections: yearlyProjections,
  };
}

/* ================================================================
   PAGE
================================================================ */

export default function CalculatorPage() {
  const [mode, setMode] = useState<Mode>("sip");

  const [monthly, setMonthly] = useState(5000);
  const [principal, setPrincipal] = useState(100000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(10);
  const [inflation, setInflation] = useState(6);

  const [result, setResult] =
    useState<CalculatorResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const investmentAmount =
    mode === "sip" ? monthly : principal;

  const estimatedInvested = useMemo(() => {
    if (mode === "sip") {
      return monthly * 12 * years;
    }

    return principal;
  }, [mode, monthly, principal, years]);

  const resetCalculator = () => {
    setMode("sip");
    setMonthly(5000);
    setPrincipal(100000);
    setRate(12);
    setYears(10);
    setInflation(6);
    setResult(null);
    setSaved(false);
    setError("");
  };

  const validate = () => {
    if (!Number.isFinite(monthly) || monthly < 500) {
      return "Monthly SIP should be at least ₹500.";
    }

    if (
      mode === "lumpsum" &&
      (!Number.isFinite(principal) || principal < 10000)
    ) {
      return "Lumpsum investment should be at least ₹10,000.";
    }

    if (
      !Number.isFinite(rate) ||
      rate < 0 ||
      rate > 30
    ) {
      return "Expected return should be between 0% and 30%.";
    }

    if (
      !Number.isFinite(years) ||
      years < 1 ||
      years > 40
    ) {
      return "Investment period should be between 1 and 40 years.";
    }

    if (
      !Number.isFinite(inflation) ||
      inflation < 0 ||
      inflation > 15
    ) {
      return "Inflation should be between 0% and 15%.";
    }

    return "";
  };

  async function calculate() {
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setSaved(false);
    setError("");

    try {
      /*
       * Calculate locally first.
       * This guarantees the calculator remains functional even
       * when the backend is unavailable or returns an unexpected
       * response shape.
       */
      const localResult = calculateProjection(
        mode,
        monthly,
        principal,
        rate,
        years,
        inflation
      );

      setResult(localResult);

      /*
       * Also call the backend so the API remains exercised.
       * We intentionally do not replace the reliable local result
       * with an unknown backend response shape.
       */
      try {
        const body =
          mode === "sip"
            ? {
                monthly_investment: monthly,
                annual_rate: rate,
                years,
                inflation_rate: inflation,
              }
            : {
                principal,
                annual_rate: rate,
                years,
                inflation_rate: inflation,
              };

        await (
          mode === "sip"
            ? api.calculator.sip(body)
            : api.calculator.lumpsum(body)
        );
      } catch (backendError) {
        console.warn(
          "Backend calculator unavailable. Local calculation used.",
          backendError
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        "Unable to calculate your projection. Please check your inputs and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveToHistory() {
    if (!result || saved || saving) return;

    setSaving(true);
    setError("");

    try {
      const body =
        mode === "sip"
          ? {
              monthly_investment: monthly,
              annual_rate: rate,
              years,
              inflation_rate: inflation,
              save_to_history: true,
            }
          : {
              principal,
              annual_rate: rate,
              years,
              inflation_rate: inflation,
              save_to_history: true,
            };

      await (
        mode === "sip"
          ? api.calculator.sip(body)
          : api.calculator.lumpsum(body)
      );

      setSaved(true);
    } catch (err) {
      console.error(err);

      setError(
        "The calculation is complete, but it could not be saved to history."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-full bg-slate-950 text-white">

      {/* ==========================================================
          HEADER
      ========================================================== */}

      <section className="border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">

            <div>

              <div className="flex items-center gap-3 mb-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30">
                  <Calculator className="w-5 h-5 text-orange-400" />
                </div>

                <div>

                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-400">
                    FinPilot Tools
                  </p>

                  <h1 className="text-3xl md:text-4xl font-bold text-white">
                    Investment Calculator
                  </h1>

                </div>

              </div>

              <p className="max-w-2xl text-sm md:text-base leading-relaxed text-slate-400">
                Estimate how your money could grow through regular
                investing or a one-time investment. Adjust the
                assumptions to understand the effect of time,
                returns and inflation.
              </p>

            </div>

            <div className="flex items-center gap-2 self-start lg:self-auto rounded-lg border border-orange-500/20 bg-orange-500/10 px-3 py-2">

              <Info className="w-4 h-4 text-orange-400" />

              <span className="text-xs text-orange-300">
                Estimates only — actual returns may vary.
              </span>

            </div>

          </div>

        </div>
      </section>

      {/* ==========================================================
          MAIN
      ========================================================== */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        <div className="grid xl:grid-cols-[410px_1fr] gap-6">

          {/* ======================================================
              INPUT PANEL
          ====================================================== */}

          <section className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl overflow-hidden">

            <div className="p-6 border-b border-slate-800">

              <div className="flex items-center justify-between">

                <div>

                  <h2 className="text-lg font-semibold text-white">
                    Investment Inputs
                  </h2>

                  <p className="text-xs text-slate-500 mt-1">
                    Set your assumptions
                  </p>

                </div>

                <button
                  type="button"
                  onClick={resetCalculator}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>

              </div>

            </div>

            <div className="p-6 space-y-6">

              {/* INVESTMENT TYPE */}

              <div>

                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Investment type
                </p>

                <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-950 p-1 border border-slate-800">

                  <button
                    type="button"
                    onClick={() => {
                      setMode("sip");
                      setResult(null);
                      setSaved(false);
                      setError("");
                    }}
                    className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                      mode === "sip"
                        ? "bg-orange-500 text-white shadow-lg"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    SIP

                    <span className="block text-[10px] font-normal opacity-70">
                      Monthly investing
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode("lumpsum");
                      setResult(null);
                      setSaved(false);
                      setError("");
                    }}
                    className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                      mode === "lumpsum"
                        ? "bg-orange-500 text-white shadow-lg"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    Lumpsum

                    <span className="block text-[10px] font-normal opacity-70">
                      One-time investment
                    </span>
                  </button>

                </div>

              </div>

              {/* AMOUNT */}

              <InputField
                icon={<IndianRupee className="w-4 h-4" />}
                label={
                  mode === "sip"
                    ? "Monthly Investment"
                    : "Initial Investment"
                }
                value={investmentAmount}
                onChange={(value) => {
                  if (mode === "sip") {
                    setMonthly(value);
                  } else {
                    setPrincipal(value);
                  }

                  setResult(null);
                  setSaved(false);
                }}
                min={mode === "sip" ? 500 : 10000}
                max={mode === "sip" ? 100000 : 10000000}
                step={mode === "sip" ? 500 : 10000}
                formatValue={formatLakh}
              />

              {/* RETURN */}

              <InputField
                icon={<Percent className="w-4 h-4" />}
                label="Expected Annual Return"
                value={rate}
                onChange={(value) => {
                  setRate(value);
                  setResult(null);
                  setSaved(false);
                }}
                min={0}
                max={30}
                step={0.5}
                formatValue={(value) =>
                  `${value.toFixed(1)}%`
                }
              />

              {/* PERIOD */}

              <InputField
                icon={<CalendarDays className="w-4 h-4" />}
                label="Investment Period"
                value={years}
                onChange={(value) => {
                  setYears(value);
                  setResult(null);
                  setSaved(false);
                }}
                min={1}
                max={40}
                step={1}
                formatValue={(value) =>
                  `${value} ${
                    value === 1 ? "year" : "years"
                  }`
                }
              />

              {/* INFLATION */}

              <InputField
                icon={<TrendingUp className="w-4 h-4" />}
                label="Expected Inflation"
                value={inflation}
                onChange={(value) => {
                  setInflation(value);
                  setResult(null);
                  setSaved(false);
                }}
                min={0}
                max={15}
                step={0.5}
                formatValue={(value) =>
                  `${value.toFixed(1)}%`
                }
              />

              {/* QUICK OVERVIEW */}

              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">

                <p className="text-xs font-semibold text-slate-400 mb-3">
                  Quick overview
                </p>

                <div className="space-y-3">

                  <SummaryRow
                    label={
                      mode === "sip"
                        ? "Monthly contribution"
                        : "Initial investment"
                    }
                    value={formatLakh(
                      investmentAmount
                    )}
                  />

                  <SummaryRow
                    label="Estimated amount invested"
                    value={formatLakh(
                      estimatedInvested
                    )}
                  />

                  <SummaryRow
                    label="Expected return"
                    value={`${rate.toFixed(1)}% p.a.`}
                  />

                  <SummaryRow
                    label="Time horizon"
                    value={`${years} ${
                      years === 1 ? "year" : "years"
                    }`}
                  />

                  <SummaryRow
                    label="Inflation assumption"
                    value={`${inflation.toFixed(1)}%`}
                  />

                </div>

              </div>

              {/* CALCULATE */}

              <button
                type="button"
                onClick={calculate}
                disabled={loading}
                className="w-full rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    Calculate Projection
                  </>
                )}
              </button>

              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                >
                  {error}
                </div>
              )}

            </div>

          </section>

          {/* ======================================================
              RESULTS
          ====================================================== */}

          <section>

            {result ? (

              <div className="space-y-6">

                {/* HERO */}

                <div className="rounded-2xl border border-orange-500/25 bg-gradient-to-br from-orange-500/10 via-slate-900 to-slate-900 overflow-hidden">

                  <div className="p-6 md:p-7">

                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

                      <div>

                        <p className="text-xs uppercase tracking-wider font-semibold text-orange-400">
                          Projected outcome
                        </p>

                        <h2 className="text-2xl font-bold text-white mt-1">
                          Your investment projection
                        </h2>

                        <p className="text-xs text-slate-500 mt-2">
                          {mode === "sip"
                            ? `${formatINR(
                                monthly
                              )} invested every month`
                            : `${formatINR(
                                principal
                              )} invested once`}{" "}
                          for {years}{" "}
                          {years === 1
                            ? "year"
                            : "years"}{" "}
                          at {rate.toFixed(1)}%
                          expected annual return.
                        </p>

                      </div>

                      <button
                        type="button"
                        onClick={saveToHistory}
                        disabled={saved || saving}
                        className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                          saved
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : "border-slate-700 bg-slate-900 text-slate-300 hover:border-orange-500/40 hover:text-orange-400"
                        }`}
                      >

                        {saving ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : saved ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}

                        {saving
                          ? "Saving..."
                          : saved
                          ? "Saved"
                          : "Save Calculation"}

                      </button>

                    </div>

                    <div className="mt-7">

                      <p className="text-sm text-slate-400">
                        Estimated maturity value
                      </p>

                      <p className="text-4xl md:text-5xl font-bold text-orange-400 mt-1">
                        {formatLakh(
                          result.maturity_value
                        )}
                      </p>

                    </div>

                  </div>

                </div>

                {/* STATS */}

                <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">

                  <ResultCard
                    icon={
                      <Wallet className="w-4 h-4" />
                    }
                    label="Total Invested"
                    value={formatLakh(
                      result.total_invested
                    )}
                  />

                  <ResultCard
                    icon={
                      <ArrowUpRight className="w-4 h-4" />
                    }
                    label="Wealth Gained"
                    value={formatLakh(
                      result.wealth_gained
                    )}
                    positive
                  />

                  <ResultCard
                    icon={
                      <PiggyBank className="w-4 h-4" />
                    }
                    label="Maturity Value"
                    value={formatLakh(
                      result.maturity_value
                    )}
                    highlight
                  />

                  <ResultCard
                    icon={
                      <ShieldCheck className="w-4 h-4" />
                    }
                    label="Inflation Adjusted"
                    value={formatLakh(
                      result.inflation_adjusted_value
                    )}
                  />

                </div>

                {/* CHART */}

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

                  <div className="mb-5">

                    <h2 className="text-lg font-semibold text-white">
                      Growth Projection
                    </h2>

                    <p className="text-xs text-slate-500 mt-1">
                      Estimated portfolio growth over your investment horizon.
                    </p>

                  </div>

                  <div className="h-[320px] w-full">

                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >

                      <LineChart
                        data={result.yearly_projections}
                        margin={{
                          top: 10,
                          right: 10,
                          left: 5,
                          bottom: 5,
                        }}
                      >

                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#1e293b"
                        />

                        <XAxis
                          dataKey="year"
                          tick={{
                            fontSize: 11,
                            fill: "#64748b",
                          }}
                          tickFormatter={(value) =>
                            `Y${value}`
                          }
                          axisLine={{
                            stroke: "#334155",
                          }}
                          tickLine={false}
                        />

                        <YAxis
                          tick={{
                            fontSize: 10,
                            fill: "#64748b",
                          }}
                          tickFormatter={(value) =>
                            formatLakh(
                              Number(value)
                            )
                          }
                          width={75}
                          axisLine={false}
                          tickLine={false}
                        />

                        <Tooltip
                          formatter={(
                            value: number | string,
                            name: string
                          ) => [
                            formatLakh(
                              Number(value)
                            ),
                            name === "value"
                              ? "Portfolio Value"
                              : "Amount Invested",
                          ]}
                          labelFormatter={(year) =>
                            `Year ${year}`
                          }
                          contentStyle={{
                            backgroundColor:
                              "#0f172a",
                            border:
                              "1px solid #334155",
                            borderRadius: 10,
                            fontSize: 12,
                          }}
                        />

                        <Legend
                          formatter={(value) =>
                            value === "value"
                              ? "Portfolio Value"
                              : "Amount Invested"
                          }
                        />

                        <Line
                          type="monotone"
                          dataKey="invested"
                          stroke="#64748b"
                          strokeWidth={2}
                          dot={false}
                        />

                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#f97316"
                          strokeWidth={3}
                          dot={false}
                          activeDot={{
                            r: 5,
                          }}
                        />

                      </LineChart>

                    </ResponsiveContainer>

                  </div>

                </div>

                {/* INSIGHTS */}

                <div className="grid md:grid-cols-2 gap-4">

                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">

                    <div className="flex items-center gap-2 mb-3">

                      <TrendingUp className="w-4 h-4 text-emerald-400" />

                      <h3 className="font-semibold text-white">
                        Wealth created
                      </h3>

                    </div>

                    <p className="text-sm text-slate-400 leading-relaxed">

                      Your projected wealth gain is{" "}

                      <span className="text-emerald-400 font-semibold">
                        {formatLakh(
                          result.wealth_gained
                        )}
                      </span>{" "}

                      over the selected investment period.

                    </p>

                  </div>

                  <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">

                    <div className="flex items-center gap-2 mb-3">

                      <ShieldCheck className="w-4 h-4 text-blue-400" />

                      <h3 className="font-semibold text-white">
                        Purchasing power
                      </h3>

                    </div>

                    <p className="text-sm text-slate-400 leading-relaxed">

                      At the assumed{" "}

                      <span className="text-blue-400 font-semibold">
                        {inflation.toFixed(1)}%
                      </span>{" "}

                      inflation rate, your projected value in
                      today&apos;s purchasing power is{" "}

                      <span className="text-blue-400 font-semibold">
                        {formatLakh(
                          result.inflation_adjusted_value
                        )}
                      </span>
                      .

                    </p>

                  </div>

                </div>

                {/* EDUCATION */}

                <div className="grid md:grid-cols-3 gap-4">

                  <InfoCard
                    title="SIP"
                    icon={
                      <Wallet className="w-4 h-4" />
                    }
                    text="A Systematic Investment Plan lets you invest a fixed amount regularly. Consistency can make long-term investing easier to maintain."
                  />

                  <InfoCard
                    title="Compounding"
                    icon={
                      <TrendingUp className="w-4 h-4" />
                    }
                    text="Returns can themselves generate additional returns. Over long periods, compounding can become a major contributor to portfolio growth."
                  />

                  <InfoCard
                    title="Inflation"
                    icon={
                      <TrendingDown className="w-4 h-4" />
                    }
                    text="Inflation reduces purchasing power over time. The inflation-adjusted result estimates the future amount in today's purchasing-power terms."
                  />

                </div>

                {/* DISCLAIMER */}

                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">

                  <div className="flex items-start gap-3">

                    <Info className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />

                    <p className="text-xs text-amber-200/70 leading-relaxed">
                      This calculator provides educational estimates only.
                      It does not guarantee investment returns or constitute
                      investment advice. Actual returns can vary because of
                      market conditions, taxes, fees and other factors.
                    </p>

                  </div>

                </div>

              </div>

            ) : (

              <EmptyResults />

            )}

          </section>

        </div>

      </main>

    </div>
  );
}

/* ================================================================
   INPUT FIELD
================================================================ */

function InputField({
  icon,
  label,
  value,
  onChange,
  min,
  max,
  step,
  formatValue,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  formatValue: (value: number) => string;
}) {
  const percentage =
    ((value - min) / (max - min)) * 100;

  const safePercentage = Math.min(
    100,
    Math.max(
      0,
      Number.isFinite(percentage)
        ? percentage
        : 0
    )
  );

  return (
    <div>

      <div className="flex items-center justify-between gap-3 mb-3">

        <label className="flex items-center gap-2 text-sm font-medium text-slate-300">

          <span className="text-orange-400">
            {icon}
          </span>

          {label}

        </label>

        <span className="rounded-md bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 text-sm font-bold text-orange-400 whitespace-nowrap">
          {formatValue(value)}
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
        aria-label={label}
        className="w-full h-2 rounded-full appearance-none cursor-pointer accent-orange-500"
        style={{
          background: `linear-gradient(
            to right,
            #f97316 0%,
            #f97316 ${safePercentage}%,
            #334155 ${safePercentage}%,
            #334155 100%
          )`,
        }}
      />

      <div className="flex justify-between mt-2 text-[10px] text-slate-600">

        <span>
          {formatValue(min)}
        </span>

        <span>
          {formatValue(max)}
        </span>

      </div>

    </div>
  );
}

/* ================================================================
   SUMMARY ROW
================================================================ */

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-xs">

      <span className="text-slate-500">
        {label}
      </span>

      <span className="font-semibold text-slate-300 text-right">
        {value}
      </span>

    </div>
  );
}

/* ================================================================
   RESULT CARD
================================================================ */

function ResultCard({
  icon,
  label,
  value,
  positive,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  positive?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? "border-orange-500/30 bg-orange-500/10"
          : "border-slate-800 bg-slate-900"
      }`}
    >

      <div className="flex items-center gap-2 mb-3">

        <span
          className={
            highlight
              ? "text-orange-400"
              : positive
              ? "text-emerald-400"
              : "text-slate-400"
          }
        >
          {icon}
        </span>

        <span className="text-xs text-slate-500">
          {label}
        </span>

      </div>

      <p
        className={`text-lg font-bold ${
          highlight
            ? "text-orange-400"
            : positive
            ? "text-emerald-400"
            : "text-white"
        }`}
      >
        {value}
      </p>

    </div>
  );
}

/* ================================================================
   EMPTY RESULTS
================================================================ */

function EmptyResults() {
  return (
    <div className="min-h-[620px] rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 flex items-center justify-center">

      <div className="max-w-sm text-center px-8">

        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-5">

          <Calculator className="w-7 h-7 text-orange-400" />

        </div>

        <h2 className="text-xl font-semibold text-white">
          See your money grow
        </h2>

        <p className="text-sm text-slate-500 leading-relaxed mt-2">
          Choose SIP or Lumpsum, adjust your assumptions,
          and calculate a projection to see your estimated
          wealth growth.
        </p>

        <div className="grid grid-cols-3 gap-2 mt-7">

          <MiniFeature
            icon={
              <Wallet className="w-4 h-4" />
            }
            text="Invest"
          />

          <MiniFeature
            icon={
              <TrendingUp className="w-4 h-4" />
            }
            text="Grow"
          />

          <MiniFeature
            icon={
              <PiggyBank className="w-4 h-4" />
            }
            text="Plan"
          />

        </div>

      </div>

    </div>
  );
}

/* ================================================================
   MINI FEATURE
================================================================ */

function MiniFeature({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/60 py-3">

      <div className="flex justify-center text-orange-400 mb-1">
        {icon}
      </div>

      <p className="text-[10px] text-slate-500">
        {text}
      </p>

    </div>
  );
}

/* ================================================================
   INFO CARD
================================================================ */

function InfoCard({
  title,
  text,
  icon,
}: {
  title: string;
  text: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 hover:border-slate-700 transition-colors">

      <div className="flex items-center gap-2">

        <span className="text-orange-400">
          {icon}
        </span>

        <h3 className="font-semibold text-white">
          {title}
        </h3>

      </div>

      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        {text}
      </p>

    </div>
  );
}