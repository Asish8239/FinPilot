"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Eye,
  Plus,
  Trash2,
  Search,
  X,
  Loader2,
  BookOpen,
  Bookmark,
  Building2,
  TrendingUp,
  TrendingDown,
  BarChart3,
  RefreshCw,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

import {
  useWatchlist,
  useAddWatchlist,
  useRemoveWatchlist,
} from "@/hooks/useApi";

import type { WatchlistItem } from "@/types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const POPULAR = [
  {
    symbol: "RELIANCE.NS",
    name: "Reliance Industries",
    exchange: "NSE",
    sector: "Conglomerate",
  },
  {
    symbol: "TCS.NS",
    name: "Tata Consultancy Services",
    exchange: "NSE",
    sector: "Information Technology",
  },
  {
    symbol: "INFY.NS",
    name: "Infosys Limited",
    exchange: "NSE",
    sector: "Information Technology",
  },
  {
    symbol: "HDFCBANK.NS",
    name: "HDFC Bank",
    exchange: "NSE",
    sector: "Banking",
  },
  {
    symbol: "ICICIBANK.NS",
    name: "ICICI Bank",
    exchange: "NSE",
    sector: "Banking",
  },
  {
    symbol: "WIPRO.NS",
    name: "Wipro Limited",
    exchange: "NSE",
    sector: "Information Technology",
  },
];

type Quote = {
  symbol: string;
  name?: string;
  exchange?: string;
  current_price?: number | null;
  previous_close?: number | null;
  change?: number | null;
  change_pct?: number | null;
  market_cap?: number | null;
  day_high?: number | null;
  day_low?: number | null;
  volume?: number | null;
  currency?: string;
  data_source?: string;
  is_simulated?: boolean;
  disclaimer?: string;
  as_of?: string;
};

type SearchResult = {
  symbol?: string;
  ticker?: string;
  code?: string;
  name?: string;
  company_name?: string;
  exchange?: string;
};

type SearchResponse = {
  results?: SearchResult[];
  is_simulated?: boolean;
  disclaimer?: string;
};

function getSessionId() {
  if (typeof window === "undefined") return "";

  const key = "finpilot_session_id";

  let id = localStorage.getItem(key);

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }

  return id;
}

async function fetchQuote(symbol: string): Promise<Quote> {
  const response = await fetch(
    `${API_URL}/api/v1/markets/quote/${encodeURIComponent(symbol)}`,
    {
      headers: {
        Accept: "application/json",
        "X-Session-ID": getSessionId(),
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));

    throw new Error(
      body?.detail ?? `Unable to load quote (${response.status})`
    );
  }

  return response.json();
}

export default function WatchlistPage() {
  const {
    data: watchlist = [],
    isLoading,
  } = useWatchlist() as {
    data: WatchlistItem[];
    isLoading: boolean;
  };

  const addItem = useAddWatchlist();
  const removeItem = useRemoveWatchlist();

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [exchange, setExchange] = useState("NSE");
  const [notes, setNotes] = useState("");

  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [quoteLoading, setQuoteLoading] = useState<
    Record<string, boolean>
  >({});
  const [quoteErrors, setQuoteErrors] = useState<
    Record<string, string>
  >({});

  const [searchResults, setSearchResults] = useState<SearchResult[]>(
    []
  );
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const filteredPopular = POPULAR.filter((stock) => {
    const query = search.toLowerCase().trim();

    if (!query) return true;

    return (
      stock.symbol.toLowerCase().includes(query) ||
      stock.name.toLowerCase().includes(query) ||
      stock.sector.toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    if (!watchlist.length) return;

    let cancelled = false;

    async function loadQuotes() {
      for (const item of watchlist) {
        if (cancelled) return;

        const existing = quotes[item.symbol];

        if (existing) continue;

        setQuoteLoading((previous) => ({
          ...previous,
          [item.symbol]: true,
        }));

        try {
          const quote = await fetchQuote(item.symbol);

          if (!cancelled) {
            setQuotes((previous) => ({
              ...previous,
              [item.symbol]: quote,
            }));

            setQuoteErrors((previous) => {
              const next = { ...previous };
              delete next[item.symbol];
              return next;
            });
          }
        } catch (error) {
          if (!cancelled) {
            setQuoteErrors((previous) => ({
              ...previous,
              [item.symbol]:
                error instanceof Error
                  ? error.message
                  : "Unable to load quote",
            }));
          }
        } finally {
          if (!cancelled) {
            setQuoteLoading((previous) => ({
              ...previous,
              [item.symbol]: false,
            }));
          }
        }
      }
    }

    loadQuotes();

    return () => {
      cancelled = true;
    };
  }, [watchlist, quotes]);

  async function refreshQuote(stockSymbol: string) {
    setQuoteLoading((previous) => ({
      ...previous,
      [stockSymbol]: true,
    }));

    setQuoteErrors((previous) => {
      const next = { ...previous };
      delete next[stockSymbol];
      return next;
    });

    try {
      const quote = await fetchQuote(stockSymbol);

      setQuotes((previous) => ({
        ...previous,
        [stockSymbol]: quote,
      }));
    } catch (error) {
      setQuoteErrors((previous) => ({
        ...previous,
        [stockSymbol]:
          error instanceof Error
            ? error.message
            : "Unable to load quote",
      }));
    } finally {
      setQuoteLoading((previous) => ({
        ...previous,
        [stockSymbol]: false,
      }));
    }
  }

  async function handleSearch(value: string) {
    setSearch(value);
    setSearchError("");

    if (!value.trim() || value.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/v1/markets/search?q=${encodeURIComponent(
          value.trim()
        )}`,
        {
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("Unable to search market symbols.");
      }

      const result = (await response.json()) as SearchResponse;

      setSearchResults(
        Array.isArray(result?.results) ? result.results : []
      );
    } catch (error) {
      setSearchResults([]);

      setSearchError(
        error instanceof Error
          ? error.message
          : "Unable to search stocks."
      );
    } finally {
      setSearchLoading(false);
    }
  }

  function selectSearchResult(result: SearchResult) {
    const selectedSymbol =
      result?.symbol ??
      result?.ticker ??
      result?.code ??
      "";

    const selectedName =
      result?.name ??
      result?.company_name ??
      selectedSymbol;

    const selectedExchange =
      result?.exchange ??
      (selectedSymbol.endsWith(".BO") ? "BSE" : "NSE");

    setSymbol(selectedSymbol.toUpperCase());
    setName(selectedName);
    setExchange(selectedExchange);
    setSearchResults([]);
    setSearch("");
    setShowForm(true);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();

    if (!symbol.trim() || !name.trim()) return;

    try {
      await addItem.mutateAsync({
        symbol: symbol.trim().toUpperCase(),
        name: name.trim(),
        exchange,
        notes: notes.trim() || undefined,
      });

      setSymbol("");
      setName("");
      setExchange("NSE");
      setNotes("");
      setShowForm(false);
    } catch {
      // React Query handles the mutation error.
    }
  }

  async function handleQuickAdd(
    stock: (typeof POPULAR)[number]
  ) {
    const exists = watchlist.some(
      (item) => item.symbol === stock.symbol
    );

    if (exists || addItem.isPending) return;

    try {
      await addItem.mutateAsync({
        symbol: stock.symbol,
        name: stock.name,
        exchange: stock.exchange,
      });
    } catch {
      // React Query handles the mutation error.
    }
  }

  function handleRemove(id: string, stockSymbol: string) {
    removeItem.mutate(id);

    setQuotes((previous) => {
      const next = { ...previous };
      delete next[stockSymbol];
      return next;
    });

    setQuoteErrors((previous) => {
      const next = { ...previous };
      delete next[stockSymbol];
      return next;
    });
  }

  return (
    <div className="relative min-h-full overflow-hidden bg-[#05090d] text-white">
      {/* BACKGROUND */}
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

        <div className="absolute right-[-180px] top-[15%] h-[500px] w-[500px] rounded-full bg-violet-500/[0.045] blur-[140px]" />

        <div className="absolute bottom-[-180px] left-[35%] h-[420px] w-[420px] rounded-full bg-emerald-500/[0.03] blur-[130px]" />
      </div>

      <div className="relative mx-auto max-w-[1500px] space-y-7 p-4 sm:p-6 lg:p-8">
        {/* HEADER */}
        <section className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.07]">
                <Eye className="h-5 w-5 text-cyan-300" />
              </div>

              <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-cyan-300/70">
                Personal Market Tracker
              </span>
            </div>

            <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Your{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-white to-emerald-300 bg-clip-text text-transparent">
                watchlist.
              </span>
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              Track companies, view market quotes, study price
              movements, and open detailed charts from one place.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-xs font-semibold text-white shadow-[0_10px_35px_rgba(16,185,129,0.08)] transition hover:bg-emerald-400"
          >
            {showForm ? (
              <>
                <X className="h-4 w-4" />
                Close
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add Stock
              </>
            )}
          </button>
        </section>

        {/* SUMMARY */}
        <section className="grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Stocks tracked"
            value={watchlist.length}
            icon={<Eye className="h-5 w-5" />}
          />

          <SummaryCard
            label="Popular choices"
            value={POPULAR.length}
            icon={<Building2 className="h-5 w-5" />}
          />

          <SummaryCard
            label="Market tracking"
            value="Live"
            icon={<TrendingUp className="h-5 w-5" />}
          />
        </section>

        {/* ADD STOCK */}
        {showForm && (
          <section className="rounded-3xl border border-emerald-400/15 bg-white/[0.025] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-7">
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-400/[0.07]">
                  <Plus className="h-4 w-4 text-emerald-300" />
                </div>

                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-emerald-300/60">
                    Market tracker
                  </p>

                  <h2 className="mt-0.5 font-semibold text-white">
                    Add a company
                  </h2>

                  <p className="mt-1 text-xs text-slate-600">
                    Search a company or enter its market symbol.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                Search company
              </label>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

                <input
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search Reliance, TCS, Infosys..."
                  className="w-full rounded-xl border border-white/[0.08] bg-[#0b1118] py-3 pl-10 pr-10 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/10"
                />

                {searchLoading && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-cyan-300" />
                )}
              </div>

              {searchError && (
                <div className="mt-2 flex items-center gap-2 text-xs text-red-400">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {searchError}
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="mt-2 overflow-hidden rounded-xl border border-white/[0.08] bg-[#090f15] shadow-2xl">
                  {searchResults.slice(0, 6).map((result, index) => {
                    const resultSymbol =
                      result?.symbol ??
                      result?.ticker ??
                      result?.code ??
                      "";

                    const resultName =
                      result?.name ??
                      result?.company_name ??
                      resultSymbol;

                    return (
                      <button
                        key={`${resultSymbol}-${index}`}
                        type="button"
                        onClick={() =>
                          selectSearchResult(result)
                        }
                        className="flex w-full items-center justify-between border-b border-white/[0.05] px-4 py-3 text-left last:border-0 hover:bg-white/[0.04]"
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {resultName}
                          </p>

                          <p className="mt-1 text-xs text-slate-600">
                            {resultSymbol}
                            {result?.exchange
                              ? ` · ${result.exchange}`
                              : ""}
                          </p>
                        </div>

                        <Plus className="h-4 w-4 text-slate-600" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <form
              onSubmit={handleAdd}
              className="grid gap-4 md:grid-cols-2"
            >
              <InputField
                label="Stock Symbol"
                placeholder="e.g. RELIANCE.NS"
                value={symbol}
                onChange={(value) => setSymbol(value.toUpperCase())}
                required
              />

              <InputField
                label="Company Name"
                placeholder="e.g. Reliance Industries"
                value={name}
                onChange={setName}
                required
              />

              <div>
                <label className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                  Exchange
                </label>

                <select
                  value={exchange}
                  onChange={(e) => setExchange(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-[#0b1118] px-3 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/10"
                >
                  <option value="NSE">NSE</option>
                  <option value="BSE">BSE</option>
                </select>
              </div>

              <InputField
                label="Learning Note"
                placeholder="Why are you watching this company?"
                value={notes}
                onChange={setNotes}
              />

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={
                    addItem.isPending ||
                    !symbol.trim() ||
                    !name.trim()
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-xs font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {addItem.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Add to Watchlist
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* QUICK ADD */}
        <section className="rounded-3xl border border-white/[0.07] bg-white/[0.025] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-cyan-300/60">
                Explore
              </p>

              <h2 className="mt-1 font-semibold text-white">
                Popular companies
              </h2>

              <p className="mt-1 text-xs text-slate-600">
                Quickly add well-known Indian companies to your
                learning list.
              </p>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

              <input
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search companies..."
                className="w-full rounded-xl border border-white/[0.08] bg-[#0b1118] py-2.5 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-cyan-400/40"
              />
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPopular.map((stock) => {
              const added = watchlist.some(
                (item) => item.symbol === stock.symbol
              );

              return (
                <button
                  key={stock.symbol}
                  type="button"
                  disabled={added || addItem.isPending}
                  onClick={() => handleQuickAdd(stock)}
                  className={`group rounded-2xl border p-4 text-left transition ${
                    added
                      ? "cursor-default border-emerald-400/15 bg-emerald-400/[0.04]"
                      : "border-white/[0.06] bg-white/[0.018] hover:-translate-y-0.5 hover:border-cyan-400/20 hover:bg-white/[0.035]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-400/10 bg-cyan-400/[0.06]">
                        <span className="text-[10px] font-bold text-cyan-300">
                          {stock.symbol.slice(0, 3)}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-200">
                          {stock.name}
                        </p>

                        <p className="mt-0.5 text-[10px] text-slate-600">
                          {stock.symbol.replace(".NS", "")} ·{" "}
                          {stock.exchange}
                        </p>
                      </div>
                    </div>

                    {added ? (
                      <span className="shrink-0 rounded-full bg-emerald-400/[0.08] px-2 py-1 text-[9px] font-semibold text-emerald-300">
                        Added
                      </span>
                    ) : (
                      <Plus className="h-4 w-4 shrink-0 text-slate-700 transition group-hover:text-cyan-300" />
                    )}
                  </div>

                  <div className="mt-3">
                    <span className="rounded-full border border-white/[0.05] bg-white/[0.025] px-2 py-1 text-[9px] text-slate-600">
                      {stock.sector}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {filteredPopular.length === 0 &&
            searchResults.length === 0 && (
              <div className="py-8 text-center">
                <Search className="mx-auto h-7 w-7 text-slate-700" />

                <p className="mt-2 text-sm text-slate-500">
                  No popular companies match your search.
                </p>
              </div>
            )}
        </section>

        {/* WATCHLIST */}
        <section>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-emerald-300/60">
                Your tracker
              </p>

              <h2 className="mt-1 text-xl font-semibold text-white">
                Your Watchlist
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Track market prices and open detailed charts.
              </p>
            </div>

            {watchlist.length > 0 && (
              <span className="rounded-full border border-white/[0.07] bg-white/[0.025] px-3 py-1 text-[10px] text-slate-500">
                {watchlist.length}{" "}
                {watchlist.length === 1 ? "company" : "companies"}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-32 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.025]"
                />
              ))}
            </div>
          ) : watchlist.length === 0 ? (
            <EmptyState onAdd={() => setShowForm(true)} />
          ) : (
            <div className="overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.025] shadow-[0_20px_80px_rgba(0,0,0,0.18)]">
              {watchlist.map((item, index) => (
                <WatchlistRow
                  key={item.id}
                  item={item}
                  index={index}
                  total={watchlist.length}
                  quote={quotes[item.symbol]}
                  quoteLoading={
                    quoteLoading[item.symbol] ?? false
                  }
                  quoteError={quoteErrors[item.symbol]}
                  onRefresh={() => refreshQuote(item.symbol)}
                  onRemove={() =>
                    handleRemove(item.id, item.symbol)
                  }
                  removing={
                    removeItem.isPending &&
                    removeItem.variables === item.id
                  }
                />
              ))}
            </div>
          )}
        </section>

        {/* LEARNING SECTION */}
        <section className="rounded-3xl border border-blue-400/15 bg-gradient-to-br from-blue-400/[0.06] via-white/[0.02] to-cyan-400/[0.025] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.18)] sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-400/15 bg-blue-400/[0.07]">
              <BookOpen className="h-5 w-5 text-blue-300" />
            </div>

            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-blue-300/60">
                Learning tool
              </p>

              <h2 className="mt-1 text-lg font-semibold text-white">
                Use your watchlist as a learning tool
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                A watchlist isn&apos;t just for tracking prices.
                Pick companies you&apos;re interested in and use
                them as real-world examples while learning
                financial statements, business models, valuation,
                sectors, and investing concepts.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <LearningTip>
                  Study the company&apos;s business model
                </LearningTip>

                <LearningTip>
                  Understand its industry and competitors
                </LearningTip>

                <LearningTip>
                  Learn how financial ratios apply to it
                </LearningTip>

                <LearningTip>
                  Observe market movements without rushing to
                  invest
                </LearningTip>
              </div>
            </div>
          </div>
        </section>

        {/* DISCLAIMER */}
        <div className="border-t border-white/[0.05] pt-5 pb-4">
          <p className="text-center text-[10px] leading-5 text-slate-700">
            FinPilot&apos;s Watchlist is an educational tracking
            feature. Market prices may be delayed or simulated
            depending on the configured market-data provider. This
            feature does not provide investment recommendations or
            financial advice.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SUMMARY CARD
============================================================ */

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 shadow-[0_15px_60px_rgba(0,0,0,0.12)]">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600">
          {label}
        </span>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/[0.06] text-cyan-300">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-2xl font-semibold text-white">
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   INPUT
============================================================ */

function InputField({
  label,
  placeholder,
  value,
  onChange,
  required = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600">
        {label}

        {required && (
          <span className="ml-1 text-emerald-400">*</span>
        )}
      </label>

      <input
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/[0.08] bg-[#0b1118] px-3 py-3 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/10"
      />
    </div>
  );
}

/* ============================================================
   WATCHLIST ROW
============================================================ */

function WatchlistRow({
  item,
  index,
  total,
  quote,
  quoteLoading,
  quoteError,
  onRefresh,
  onRemove,
  removing,
}: {
  item: WatchlistItem;
  index: number;
  total: number;
  quote?: Quote;
  quoteLoading: boolean;
  quoteError?: string;
  onRefresh: () => void;
  onRemove: () => void;
  removing: boolean;
}) {
  const cleanSymbol = item.symbol
    .replace(".NS", "")
    .replace(".BO", "");

  const isPositive =
    typeof quote?.change_pct === "number"
      ? quote.change_pct >= 0
      : true;

  const currency = quote?.currency ?? "INR";

  const formattedPrice =
    typeof quote?.current_price === "number"
      ? new Intl.NumberFormat("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(quote.current_price)
      : null;

  const formattedChange =
    typeof quote?.change === "number"
      ? `${quote.change >= 0 ? "+" : ""}${quote.change.toFixed(2)}`
      : null;

  const formattedChangePct =
    typeof quote?.change_pct === "number"
      ? `${quote.change_pct >= 0 ? "+" : ""}${quote.change_pct.toFixed(
          2
        )}%`
      : null;

  return (
    <div
      className={`group p-5 transition hover:bg-white/[0.018] ${
        index < total - 1
          ? "border-b border-white/[0.05]"
          : ""
      }`}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        {/* COMPANY */}
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.06]">
            <span className="text-xs font-bold text-cyan-300">
              {cleanSymbol.slice(0, 3)}
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-white">
                {cleanSymbol}
              </p>

              <span className="rounded-md border border-white/[0.06] bg-white/[0.025] px-2 py-0.5 text-[9px] font-medium text-slate-600">
                {item.exchange}
              </span>

              {quote && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                    quote.is_simulated
                      ? "bg-amber-400/[0.08] text-amber-300"
                      : "bg-emerald-400/[0.08] text-emerald-300"
                  }`}
                >
                  {quote.is_simulated ? "SIMULATED" : "LIVE"}
                </span>
              )}
            </div>

            <p className="mt-1 truncate text-sm text-slate-500">
              {item.name}
            </p>

            {item.notes && (
              <div className="mt-2 flex items-center gap-2">
                <Bookmark className="h-3 w-3 text-slate-700" />

                <p className="truncate text-xs italic text-slate-600">
                  {item.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* PRICE */}
        <div className="min-w-[190px]">
          {quoteLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />

              <span className="text-xs text-slate-600">
                Loading quote...
              </span>
            </div>
          ) : quoteError ? (
            <div>
              <div className="flex items-center gap-2 text-xs text-red-400">
                <AlertCircle className="h-3.5 w-3.5" />
                Quote unavailable
              </div>

              <button
                type="button"
                onClick={onRefresh}
                className="mt-2 text-xs text-cyan-300 hover:text-cyan-200"
              >
                Try again
              </button>
            </div>
          ) : quote ? (
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-semibold text-white">
                  {currency === "INR" ? "₹" : currency}{" "}
                  {formattedPrice}
                </span>
              </div>

              <div
                className={`mt-1 flex items-center gap-1.5 text-xs font-medium ${
                  isPositive
                    ? "text-emerald-300"
                    : "text-red-400"
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}

                <span>
                  {formattedChange}{" "}
                  {formattedChangePct
                    ? `(${formattedChangePct})`
                    : ""}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-xs text-slate-700">
              Quote unavailable
            </span>
          )}
        </div>

        {/* DAY RANGE */}
        <div className="hidden min-w-[150px] lg:block">
          <p className="text-[9px] uppercase tracking-[0.15em] text-slate-700">
            Day range
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {typeof quote?.day_low === "number"
              ? `₹${quote.day_low.toFixed(2)}`
              : "—"}{" "}
            –{" "}
            {typeof quote?.day_high === "number"
              ? `₹${quote.day_high.toFixed(2)}`
              : "—"}
          </p>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center justify-between gap-2 lg:justify-end">
          <Link
            href={`/markets?symbol=${encodeURIComponent(
              item.symbol
            )}`}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-cyan-400/15 bg-cyan-400/[0.04] px-3 text-[10px] font-semibold text-cyan-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/[0.08]"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Chart
            <ExternalLink className="h-3 w-3" />
          </Link>

          <button
            type="button"
            onClick={onRefresh}
            disabled={quoteLoading}
            aria-label={`Refresh ${cleanSymbol}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 transition hover:bg-white/[0.04] hover:text-cyan-300 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                quoteLoading ? "animate-spin" : ""
              }`}
            />
          </button>

          <button
            type="button"
            onClick={onRemove}
            disabled={removing}
            aria-label={`Remove ${cleanSymbol}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 transition hover:bg-red-400/[0.07] hover:text-red-400 disabled:opacity-50"
          >
            {removing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {quote?.disclaimer && (
        <div className="mt-4 rounded-lg border border-amber-400/10 bg-amber-400/[0.04] px-3 py-2">
          <p className="text-[10px] leading-4 text-amber-300/60">
            {quote.disclaimer}
          </p>
        </div>
      )}

      {quote?.as_of && (
        <p className="mt-3 text-[9px] text-slate-700">
          Quote timestamp:{" "}
          {new Date(quote.as_of).toLocaleString("en-IN")}
          {quote.data_source
            ? ` · ${quote.data_source}`
            : ""}
        </p>
      )}
    </div>
  );
}

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyState({
  onAdd,
}: {
  onAdd: () => void;
}) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-white/[0.07] bg-white/[0.018] p-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.06]">
        <Eye className="h-7 w-7 text-cyan-300" />
      </div>

      <h3 className="mt-5 text-lg font-semibold text-slate-200">
        Your watchlist is empty
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        Add companies you&apos;re interested in so you can track
        market prices and use them as real-world examples while
        learning finance.
      </p>

      <button
        type="button"
        onClick={onAdd}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-400"
      >
        <Plus className="h-4 w-4" />
        Add your first stock
      </button>
    </div>
  );
}

/* ============================================================
   LEARNING TIP
============================================================ */

function LearningTip({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 text-sm text-slate-500">
      <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-300" />
      <span>{children}</span>
    </div>
  );
}