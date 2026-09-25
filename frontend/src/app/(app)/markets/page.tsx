"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Brain,
  ChevronDown,
  Clock3,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Quote = {
  symbol: string;
  name: string;
  exchange: string;
  current_price: number | null;
  previous_close: number | null;
  change: number | null;
  change_pct: number | null;
  market_cap: number | null;
  day_high: number | null;
  day_low: number | null;
  volume: number | null;
  currency: string;
  data_source: string;
  is_simulated: boolean;
  disclaimer: string;
  as_of: string;
};

type HistoricalPoint = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type HistoricalResponse = {
  symbol: string;
  points: HistoricalPoint[];
  is_simulated: boolean;
  disclaimer: string;
};

type IndexCard = {
  symbol: string;
  name: string;
  demoPrice: number;
  demoChange: number;
  demoChangePct: number;
};

const INDEXES: IndexCard[] = [
  {
    symbol: "NIFTY50",
    name: "Nifty 50",
    demoPrice: 24567,
    demoChange: 156,
    demoChangePct: 0.64,
  },
  {
    symbol: "SENSEX",
    name: "BSE Sensex",
    demoPrice: 81234,
    demoChange: 423,
    demoChangePct: 0.52,
  },
  {
    symbol: "GSPC",
    name: "S&P 500",
    demoPrice: 5894,
    demoChange: -12,
    demoChangePct: -0.2,
  },
  {
    symbol: "CCMP",
    name: "Nasdaq",
    demoPrice: 20156,
    demoChange: 145,
    demoChangePct: 0.72,
  },
  {
    symbol: "DJIA",
    name: "Dow Jones",
    demoPrice: 43567,
    demoChange: -89,
    demoChangePct: -0.2,
  },
];

const STOCKS = [
  "RELIANCE.NS",
  "TCS.NS",
  "INFY.NS",
  "HDFCBANK.NS",
  "ICICIBANK.NS",
  "WIPRO.NS",
  "BAJFINANCE.NS",
  "AXISBANK.NS",
  "LT.NS",
  "SBIN.NS",
];

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  return value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

function formatPrice(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatCompact(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  if (value >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(2)}T`;
  }

  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }

  return value.toFixed(0);
}

function shortSymbol(symbol: string) {
  return symbol.replace(".NS", "").replace(".BO", "");
}

function makeDemoChart(
  base: number,
  positive: boolean,
  count = 30
): HistoricalPoint[] {
  const points: HistoricalPoint[] = [];
  let price = base * (positive ? 0.96 : 1.04);

  for (let i = count; i > 0; i--) {
    const drift = positive ? 0.002 : -0.001;
    const movement = (Math.random() - 0.48) * 0.018;

    const open = price;
    const close = price * (1 + drift + movement);
    const high = Math.max(open, close) * (1 + Math.random() * 0.012);
    const low = Math.min(open, close) * (1 - Math.random() * 0.012);

    points.push({
      date: new Date(
        Date.now() - i * 24 * 60 * 60 * 1000
      ).toISOString(),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Math.floor(300000 + Math.random() * 2500000),
    });

    price = close;
  }

  return points;
}

type CandlePayload = {
  open?: number | string;
  close?: number | string;
  high?: number | string;
  low?: number | string;
};

type CandleProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: CandlePayload;
};

function CustomCandle(props: CandleProps) {
  const { x, y, width, height, payload } = props;

  if (
    x === undefined ||
    y === undefined ||
    width === undefined ||
    height === undefined ||
    !payload
  ) {
    return null;
  }

  const open = Number(payload.open);
  const close = Number(payload.close);
  const high = Number(payload.high);
  const low = Number(payload.low);

  const chartTop = y - Math.max(height, 1);
  const chartBottom = y;

  const range = Math.max(high - low, 0.0001);

  const mapY = (price: number) => {
    const ratio = (high - price) / range;
    return chartTop + ratio * (chartBottom - chartTop);
  };

  const highY = mapY(high);
  const lowY = mapY(low);
  const openY = mapY(open);
  const closeY = mapY(close);

  const center = x + width / 2;
  const candleWidth = Math.max(3, width * 0.55);
  const bodyTop = Math.min(openY, closeY);
  const bodyHeight = Math.max(2, Math.abs(openY - closeY));
  const positive = close >= open;

  return (
    <g>
      <line
        x1={center}
        x2={center}
        y1={highY}
        y2={lowY}
        stroke={positive ? "#34d399" : "#f87171"}
        strokeWidth={1.2}
      />
      <rect
        x={center - candleWidth / 2}
        y={bodyTop}
        width={candleWidth}
        height={bodyHeight}
        rx={1}
        fill={positive ? "#10b981" : "#ef4444"}
      />
    </g>
  );
}

function MiniSparkline({
  data,
  positive,
}: {
  data: number[];
  positive: boolean;
}) {
  const chartData = data.map((value, index) => ({
    index,
    value,
  }));

  return (
    <div className="h-12 w-28">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient
              id={`spark-${positive ? "up" : "down"}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor={positive ? "#10b981" : "#ef4444"}
                stopOpacity={0.3}
              />
              <stop
                offset="100%"
                stopColor={positive ? "#10b981" : "#ef4444"}
                stopOpacity={0}
              />
            </linearGradient>
          </defs>

          <Area
            type="monotone"
            dataKey="value"
            stroke={positive ? "#34d399" : "#f87171"}
            fill={`url(#spark-${positive ? "up" : "down"})`}
            strokeWidth={2}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function MarketsPage() {
  const [selectedSymbol, setSelectedSymbol] =
    useState("RELIANCE.NS");

  const [quote, setQuote] = useState<Quote | null>(null);
  const [history, setHistory] = useState<HistoricalPoint[]>([]);
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [range, setRange] = useState(30);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [allQuotes, setAllQuotes] = useState<Record<string, Quote>>(
    {}
  );

  async function fetchQuote(symbol: string) {
    setLoadingQuote(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/v1/watchlist/search?q=${encodeURIComponent(
          symbol
        )}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("Unable to connect to market data service.");
      }

      const searchData = await response.json();

      const results = Array.isArray(searchData?.results)
        ? searchData.results
        : [];

      const match = results.find(
        (item: unknown) =>
          typeof item === "object" &&
          item !== null &&
          "symbol" in item &&
          String(item.symbol).toUpperCase() ===
            symbol.toUpperCase()
      );

      if (!match) {
        throw new Error("Symbol is not available.");
      }

      /*
       * Quote endpoint requires a watchlist item ID.
       * For the public market dashboard we therefore use the
       * provider endpoint through a lightweight fallback route
       * when available.
       */
      const directResponse = await fetch(
        `${API_URL}/api/v1/markets/quote/${encodeURIComponent(
          symbol
        )}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      if (directResponse.ok) {
        const data = await directResponse.json();
        setQuote(data);
        setAllQuotes((prev) => ({
          ...prev,
          [symbol]: data,
        }));
      } else {
        /*
         * If the optional public markets route does not exist,
         * create a clearly labelled demo quote from the known
         * stock catalogue. This keeps the page functional without
         * pretending it is live.
         */
        const fallbackBases: Record<string, number> = {
          "RELIANCE.NS": 2850,
          "TCS.NS": 3720,
          "INFY.NS": 1550,
          "HDFCBANK.NS": 1680,
          "ICICIBANK.NS": 1140,
          "WIPRO.NS": 490,
          "BAJFINANCE.NS": 7200,
          "AXISBANK.NS": 1100,
          "LT.NS": 3600,
          "SBIN.NS": 820,
        };

        const base = fallbackBases[symbol] ?? 1000;
        const current = base * (1 + (Math.random() - 0.5) * 0.04);
        const previous =
          base * (1 + (Math.random() - 0.5) * 0.02);
        const change = current - previous;

        const fallbackQuote: Quote = {
          symbol,
          name:
            match.name ||
            shortSymbol(symbol),
          exchange:
            match.exchange ||
            "NSE",
          current_price: Number(current.toFixed(2)),
          previous_close: Number(previous.toFixed(2)),
          change: Number(change.toFixed(2)),
          change_pct: Number(
            ((change / previous) * 100).toFixed(2)
          ),
          market_cap: null,
          day_high: Number(
            (current * 1.015).toFixed(2)
          ),
          day_low: Number(
            (current * 0.985).toFixed(2)
          ),
          volume: Math.floor(
            500000 + Math.random() * 4500000
          ),
          currency: "INR",
          data_source: "DEMO",
          is_simulated: true,
          disclaimer:
            "⚠️ SIMULATED DATA — Not real market data. Do not use for investment decisions.",
          as_of: new Date().toISOString(),
        };

        setQuote(fallbackQuote);
        setAllQuotes((prev) => ({
          ...prev,
          [symbol]: fallbackQuote,
        }));
      }

      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load market data."
      );
    } finally {
      setLoadingQuote(false);
    }
  }

  async function fetchHistory(symbol: string, days: number) {
    setLoadingHistory(true);

    try {
      const response = await fetch(
        `${API_URL}/api/v1/markets/historical/${encodeURIComponent(
          symbol
        )}?days=${days}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      if (response.ok) {
        const data: HistoricalResponse =
          await response.json();

        setHistory(data.points || []);
        return;
      }

      /*
       * The existing backend provider already exposes historical
       * OHLCV internally. Until a public markets historical route
       * is wired, generate an explicitly simulated educational
       * candlestick series.
       */
      const bases: Record<string, number> = {
        "RELIANCE.NS": 2850,
        "TCS.NS": 3720,
        "INFY.NS": 1550,
        "HDFCBANK.NS": 1680,
        "ICICIBANK.NS": 1140,
        "WIPRO.NS": 490,
        "BAJFINANCE.NS": 7200,
        "AXISBANK.NS": 1100,
        "LT.NS": 3600,
        "SBIN.NS": 820,
      };

      const currentQuote =
        allQuotes[symbol]?.current_price ??
        bases[symbol] ??
        1000;

      const positive =
        (allQuotes[symbol]?.change_pct ?? 0) >= 0;

      setHistory(
        makeDemoChart(
          currentQuote,
          positive,
          days
        )
      );
    } catch {
      const bases: Record<string, number> = {
        "RELIANCE.NS": 2850,
        "TCS.NS": 3720,
        "INFY.NS": 1550,
        "HDFCBANK.NS": 1680,
        "ICICIBANK.NS": 1140,
        "WIPRO.NS": 490,
        "BAJFINANCE.NS": 7200,
        "AXISBANK.NS": 1100,
        "LT.NS": 3600,
        "SBIN.NS": 820,
      };

      const base =
        allQuotes[symbol]?.current_price ??
        bases[symbol] ??
        1000;

      setHistory(
        makeDemoChart(
          base,
          (allQuotes[symbol]?.change_pct ?? 0) >= 0,
          days
        )
      );
    } finally {
      setLoadingHistory(false);
    }
  }

  async function refresh() {
    await fetchQuote(selectedSymbol);
    await fetchHistory(selectedSymbol, range);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSymbol = params.get("symbol")?.toUpperCase();

    if (urlSymbol && STOCKS.includes(urlSymbol)) {
      setSelectedSymbol(urlSymbol);
      return;
    }

    fetchQuote(selectedSymbol);
    fetchHistory(selectedSymbol, range);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSymbol, range]);

  const filteredStocks = STOCKS.filter((symbol) =>
    symbol
      .replace(".NS", "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const chartData = useMemo(() => {
    return history.map((point) => ({
      ...point,
      label: new Date(point.date).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
        }
      ),
      direction:
        point.close >= point.open ? "up" : "down",
    }));
  }, [history]);

  const visibleHistory = chartData.slice(-range);

  const chartMin = useMemo(() => {
    if (!visibleHistory.length) return 0;

    const lows = visibleHistory.map((p) => p.low);

    return Math.min(...lows) * 0.985;
  }, [visibleHistory]);

  const chartMax = useMemo(() => {
    if (!visibleHistory.length) return 100;

    const highs = visibleHistory.map((p) => p.high);

    return Math.max(...highs) * 1.015;
  }, [visibleHistory]);

  const aiInsight = useMemo(() => {
    if (!quote) {
      return {
        title: "Market AI is analysing",
        text: "Load a market to generate an educational summary.",
        signal: "Neutral",
      };
    }

    const pct = quote.change_pct ?? 0;

    if (pct >= 1) {
      return {
        title: "Positive momentum",
        text: `${quote.name} is currently showing positive price momentum. Review the trend, volume and recent candles together before drawing conclusions.`,
        signal: "Positive",
      };
    }

    if (pct <= -1) {
      return {
        title: "Negative momentum",
        text: `${quote.name} is currently under pressure. Look for confirmation from volume and subsequent candles rather than relying on a single move.`,
        signal: "Caution",
      };
    }

    return {
      title: "Mixed / sideways movement",
      text: `${quote.name} is showing a relatively modest move. This can indicate consolidation, but more price and volume data is needed to identify a stronger trend.`,
      signal: "Neutral",
    };
  }, [quote]);

  return (
    <div className="min-h-full bg-slate-950 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <BarChart3 className="h-5 w-5 text-cyan-400" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
                FinPilot Markets
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Market Overview
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Explore market indices, stock prices, OHLC charts,
              volume and AI-powered educational insights.
            </p>
          </div>

          <button
            onClick={refresh}
            disabled={loadingQuote || loadingHistory}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-cyan-500/40 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={cn(
                "h-4 w-4",
                (loadingQuote || loadingHistory) &&
                  "animate-spin"
              )}
            />
            Refresh Market
          </button>
        </div>

        {/* Data status */}
        <div
          className={cn(
            "flex items-start gap-3 rounded-xl border p-4",
            quote?.is_simulated
              ? "border-amber-500/30 bg-amber-500/10"
              : "border-emerald-500/30 bg-emerald-500/10"
          )}
        >
          {quote?.is_simulated ? (
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          ) : (
            <Activity className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
          )}

          <div className="min-w-0">
            <p
              className={cn(
                "text-sm font-semibold",
                quote?.is_simulated
                  ? "text-amber-300"
                  : "text-emerald-300"
              )}
            >
              {quote?.is_simulated
                ? "Simulated / Educational Market Data"
                : "Real Market Data"}
            </p>

            <p
              className={cn(
                "mt-1 text-xs leading-5",
                quote?.is_simulated
                  ? "text-amber-200/80"
                  : "text-emerald-200/80"
              )}
            >
              {quote?.is_simulated
                ? "The current backend is using simulated fallback data. It is not suitable for investment decisions."
                : "Prices are supplied by the configured market-data provider."}
            </p>
          </div>

          {lastUpdated && (
            <div className="ml-auto hidden shrink-0 items-center gap-1 text-xs text-slate-500 sm:flex">
              <Clock3 className="h-3.5 w-3.5" />
              {lastUpdated.toLocaleTimeString("en-IN")}
            </div>
          )}
        </div>

        {/* Major indices */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Global Markets
              </h2>
              <p className="text-xs text-slate-500">
                Major benchmark indices
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {INDEXES.map((index) => {
              const positive =
                index.demoChange >= 0;

              const spark = Array.from(
                { length: 18 },
                (_, i) =>
                  index.demoPrice *
                  (1 +
                    (positive ? i : -i) *
                      0.001 +
                    (Math.random() - 0.5) *
                      0.008)
              );

              return (
                <div
                  key={index.symbol}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 transition hover:border-slate-700 hover:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">
                        {index.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {index.symbol}
                      </p>
                    </div>

                    {positive ? (
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-400" />
                    )}
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-2">
                    <div>
                      <p className="text-xl font-bold text-white">
                        {formatNumber(index.demoPrice)}
                      </p>

                      <p
                        className={cn(
                          "mt-1 text-xs font-medium",
                          positive
                            ? "text-emerald-400"
                            : "text-red-400"
                        )}
                      >
                        {positive ? "+" : ""}
                        {index.demoChange}{" "}
                        ({positive ? "+" : ""}
                        {index.demoChangePct}%)
                      </p>
                    </div>

                    <MiniSparkline
                      data={spark}
                      positive={positive}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Main market area */}
        <div className="grid gap-6 xl:grid-cols-[250px_minmax(0,1fr)]">
          {/* Stock selector */}
          <aside className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-white">
                Indian Stocks
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Select a stock to inspect
              </p>
            </div>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search symbol..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-500/50"
              />
            </div>

            <div className="space-y-1.5">
              {filteredStocks.map((symbol) => {
                const active =
                  selectedSymbol === symbol;
                const itemQuote =
                  allQuotes[symbol];

                return (
                  <button
                    key={symbol}
                    onClick={() => {
                      setSelectedSymbol(symbol);
                      window.history.replaceState(
                        null,
                        "",
                        `/markets?symbol=${encodeURIComponent(symbol)}`
                      );
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition",
                      active
                        ? "border-cyan-500/30 bg-cyan-500/10"
                        : "border-transparent hover:border-slate-800 hover:bg-slate-800/70"
                    )}
                  >
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          active
                            ? "text-cyan-300"
                            : "text-slate-200"
                        )}
                      >
                        {shortSymbol(symbol)}
                      </p>

                      <p className="truncate text-[10px] text-slate-500">
                        {itemQuote?.name ??
                          "NSE Listed Stock"}
                      </p>
                    </div>

                    {itemQuote?.change_pct !==
                    undefined ? (
                      <span
                        className={cn(
                          "text-[11px] font-medium",
                          (itemQuote.change_pct ??
                            0) >= 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        )}
                      >
                        {(itemQuote.change_pct ??
                          0) >= 0
                          ? "+"
                          : ""}
                        {itemQuote.change_pct}%
                      </span>
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 -rotate-90 text-slate-700" />
                    )}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Selected stock */}
          <main className="min-w-0 space-y-5">
            {/* Quote header */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              {loadingQuote && !quote ? (
                <div className="animate-pulse">
                  <div className="h-5 w-48 rounded bg-slate-800" />
                  <div className="mt-4 h-10 w-40 rounded bg-slate-800" />
                </div>
              ) : quote ? (
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-bold text-white">
                        {quote.name}
                      </h2>

                      <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] font-semibold text-slate-400">
                        {quote.exchange}
                      </span>

                      <span className="rounded-md border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-[10px] font-semibold text-cyan-300">
                        {shortSymbol(quote.symbol)}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-end gap-4">
                      <span className="text-4xl font-bold tracking-tight text-white">
                        {quote.current_price !==
                        null
                          ? `₹${formatPrice(
                              quote.current_price
                            )}`
                          : "—"}
                      </span>

                      <span
                        className={cn(
                          "mb-1 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-semibold",
                          (quote.change_pct ??
                            0) >= 0
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                        )}
                      >
                        {(quote.change_pct ??
                          0) >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}

                        {(quote.change ?? 0) >=
                        0
                          ? "+"
                          : ""}
                        {formatPrice(
                          quote.change
                        )}{" "}
                        (
                        {(quote.change_pct ??
                          0) >= 0
                          ? "+"
                          : ""}
                        {quote.change_pct ?? 0}
                        %)
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      {quote.is_simulated
                        ? "Simulated quote"
                        : `Data source: ${quote.data_source}`}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[470px]">
                    <Metric
                      label="Day High"
                      value={`₹${formatPrice(
                        quote.day_high
                      )}`}
                    />
                    <Metric
                      label="Day Low"
                      value={`₹${formatPrice(
                        quote.day_low
                      )}`}
                    />
                    <Metric
                      label="Volume"
                      value={formatCompact(
                        quote.volume
                      )}
                    />
                    <Metric
                      label="Prev Close"
                      value={`₹${formatPrice(
                        quote.previous_close
                      )}`}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-400">
                  No quote available.
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Chart */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">
                      Price Chart
                    </h3>

                    <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                      OHLC
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    Candlestick view with daily volume
                  </p>
                </div>

                <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1">
                  {[7, 30, 90].map(
                    (days) => (
                      <button
                        key={days}
                        onClick={() =>
                          setRange(days)
                        }
                        className={cn(
                          "rounded-md px-3 py-1.5 text-xs font-medium transition",
                          range === days
                            ? "bg-slate-800 text-white"
                            : "text-slate-500 hover:text-slate-300"
                        )}
                      >
                        {days}D
                      </button>
                    )
                  )}
                </div>
              </div>

              {loadingHistory ? (
                <div className="flex h-[430px] animate-pulse items-center justify-center rounded-xl bg-slate-950/50">
                  <div className="text-sm text-slate-600">
                    Loading market history...
                  </div>
                </div>
              ) : visibleHistory.length > 0 ? (
                <div className="h-[430px] w-full">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <ComposedChart
                      data={visibleHistory}
                      margin={{
                        top: 10,
                        right: 10,
                        left: 0,
                        bottom: 10,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#1e293b"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="label"
                        tick={{
                          fill: "#64748b",
                          fontSize: 10,
                        }}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={28}
                      />

                      <YAxis
                        domain={[
                          chartMin,
                          chartMax,
                        ]}
                        tick={{
                          fill: "#64748b",
                          fontSize: 10,
                        }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) =>
                          `₹${Number(v).toLocaleString(
                            "en-IN",
                            {
                              maximumFractionDigits: 0,
                            }
                          )}`
                        }
                        width={65}
                      />

                      <Tooltip
                        content={({ active, payload }) => {
                          if (
                            !active ||
                            !payload?.length
                          ) {
                            return null;
                          }

                          const point =
                            payload[0]
                              ?.payload as HistoricalPoint & {
                              label: string;
                            };

                          if (!point) return null;

                          const positive =
                            point.close >=
                            point.open;

                          return (
                            <div className="rounded-xl border border-slate-700 bg-slate-950/95 p-3 shadow-2xl">
                              <p className="mb-2 text-xs font-semibold text-slate-200">
                                {point.label}
                              </p>

                              <div className="grid grid-cols-2 gap-x-5 gap-y-1 text-xs">
                                <span className="text-slate-500">
                                  Open
                                </span>
                                <span className="text-right text-slate-200">
                                  ₹
                                  {formatPrice(
                                    point.open
                                  )}
                                </span>

                                <span className="text-slate-500">
                                  High
                                </span>
                                <span className="text-right text-emerald-400">
                                  ₹
                                  {formatPrice(
                                    point.high
                                  )}
                                </span>

                                <span className="text-slate-500">
                                  Low
                                </span>
                                <span className="text-right text-red-400">
                                  ₹
                                  {formatPrice(
                                    point.low
                                  )}
                                </span>

                                <span className="text-slate-500">
                                  Close
                                </span>
                                <span
                                  className={cn(
                                    "text-right font-semibold",
                                    positive
                                      ? "text-emerald-400"
                                      : "text-red-400"
                                  )}
                                >
                                  ₹
                                  {formatPrice(
                                    point.close
                                  )}
                                </span>

                                <span className="text-slate-500">
                                  Volume
                                </span>
                                <span className="text-right text-slate-300">
                                  {formatCompact(
                                    point.volume
                                  )}
                                </span>
                              </div>
                            </div>
                          );
                        }}
                      />

                      <Line
                        type="monotone"
                        dataKey="close"
                        stroke="#22d3ee"
                        strokeWidth={1.5}
                        dot={false}
                        activeDot={{
                          r: 4,
                          fill: "#22d3ee",
                        }}
                        opacity={0.35}
                      />

                      <Bar
                        dataKey="close"
                        barSize={5}
                        fill="#22d3ee"
                        opacity={0}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>

                  {/* Candle overlay */}
                  <div className="-mt-[430px] pointer-events-none h-[430px] w-full opacity-90">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <ComposedChart
                        data={visibleHistory}
                        margin={{
                          top: 10,
                          right: 10,
                          left: 65,
                          bottom: 10,
                        }}
                      >
                        <XAxis
                          dataKey="label"
                          hide
                        />

                        <YAxis
                          domain={[
                            chartMin,
                            chartMax,
                          ]}
                          hide
                        />

                        <Bar
                          dataKey="close"
                          barSize={12}
                          shape={
                            <CustomCandle />
                          }
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="flex h-[430px] items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/40">
                  <div className="text-center">
                    <BarChart3 className="mx-auto h-8 w-8 text-slate-700" />
                    <p className="mt-3 text-sm text-slate-500">
                      No historical data available.
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                  Bullish candle
                </span>

                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-red-500" />
                  Bearish candle
                </span>

                <span>
                  Each candle represents one trading day.
                </span>
              </div>
            </div>

            {/* Volume */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="mb-4">
                <h3 className="font-semibold text-white">
                  Trading Volume
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Daily volume helps interpret price moves.
                </p>
              </div>

              <div className="h-[180px] w-full">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart
                    data={visibleHistory}
                    margin={{
                      top: 5,
                      right: 5,
                      left: 0,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#1e293b"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="label"
                      tick={{
                        fill: "#64748b",
                        fontSize: 9,
                      }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={30}
                    />

                    <YAxis
                      tick={{
                        fill: "#64748b",
                        fontSize: 9,
                      }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={formatCompact}
                      width={45}
                    />

                    <Tooltip
                      content={({ active, payload }) => {
                        if (
                          !active ||
                          !payload?.length
                        ) {
                          return null;
                        }

                        const point =
                          payload[0]?.payload;

                        return (
                          <div className="rounded-lg border border-slate-700 bg-slate-950 p-2.5">
                            <p className="text-xs text-slate-400">
                              {point.label}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-white">
                              {formatCompact(
                                point.volume
                              )}
                            </p>
                          </div>
                        );
                      }}
                    />

                    <Bar dataKey="volume">
                      {visibleHistory.map(
                        (point, index) => (
                          <Cell
                            key={index}
                            fill={
                              point.close >=
                              point.open
                                ? "#10b981"
                                : "#ef4444"
                            }
                            fillOpacity={0.55}
                          />
                        )
                      )}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </main>
        </div>

        {/* AI section */}
        <section className="grid gap-5 lg:grid-cols-[1fr_330px]">
          <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-slate-900/80 to-cyan-500/10 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-purple-400/20 bg-purple-500/10">
                <Brain className="h-5 w-5 text-purple-300" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-white">
                    AI Market Insight
                  </h2>

                  <span className="rounded-full border border-purple-400/20 bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-purple-300">
                    Educational
                  </span>
                </div>

                <h3 className="mt-4 text-base font-semibold text-purple-200">
                  {aiInsight.title}
                </h3>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                  {aiInsight.text}
                </p>

                <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    AI signal
                  </p>

                  <p
                    className={cn(
                      "mt-1 text-sm font-semibold",
                      aiInsight.signal ===
                        "Positive"
                        ? "text-emerald-400"
                        : aiInsight.signal ===
                            "Caution"
                          ? "text-red-400"
                          : "text-amber-400"
                    )}
                  >
                    {aiInsight.signal}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">
                How to read candles
              </h3>
            </div>

            <div className="mt-4 space-y-3 text-xs leading-5 text-slate-400">
              <p>
                <strong className="text-slate-200">
                  Open:
                </strong>{" "}
                price at the beginning of the session.
              </p>

              <p>
                <strong className="text-slate-200">
                  Close:
                </strong>{" "}
                price at the end of the session.
              </p>

              <p>
                <strong className="text-slate-200">
                  High / Low:
                </strong>{" "}
                highest and lowest traded prices.
              </p>

              <p>
                <strong className="text-slate-200">
                  Volume:
                </strong>{" "}
                number of shares traded.
              </p>
            </div>
          </div>
        </section>

        {/* Indian market timings */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-semibold text-white">
                Indian Market Timings
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Standard NSE / BSE equity market schedule
              </p>
            </div>

            <div className="grid gap-3 text-xs sm:grid-cols-3">
              <Timing
                label="Pre-open"
                value="09:00 – 09:15 IST"
              />
              <Timing
                label="Regular Session"
                value="09:15 – 15:30 IST"
              />
              <Timing
                label="Exchanges"
                value="NSE • BSE"
              />
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-xs leading-5 text-amber-200/80">
            <strong className="text-amber-300">
              Educational purpose only.
            </strong>{" "}
            Market charts and AI insights are intended to
            help users learn how financial markets work. They
            are not investment advice, recommendations, or a
            guarantee of future performance. Verify prices with
            an official market-data source before making any
            financial decision.
          </p>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-600">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-200">
        {value}
      </p>
    </div>
  );
}

function Timing({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-600">
        {label}
      </p>
      <p className="mt-1 font-medium text-slate-300">
        {value}
      </p>
    </div>
  );
}
