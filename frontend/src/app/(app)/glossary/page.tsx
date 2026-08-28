"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  ChevronRight,
  Search,
  X,
} from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

type GlossaryTerm = {
  slug: string;
  term: string;
  category: string;
  simple: string;
  technical: string;
  example: string;
  related: string[];
};

/* ============================================================
   GLOSSARY DATA
============================================================ */

const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    slug: "asset",
    term: "Asset",
    category: "Basics",
    simple:
      "Something you own that has financial or economic value.",
    technical:
      "An asset is a resource controlled by an individual or organization that is expected to provide future economic benefit.",
    example:
      "Savings, shares, mutual funds, gold, and property can all be assets.",
    related: ["Liability", "Net Worth", "Portfolio"],
  },
  {
    slug: "liability",
    term: "Liability",
    category: "Basics",
    simple:
      "Money that you owe to another person, bank, or organization.",
    technical:
      "A liability is a present financial obligation that requires future settlement or payment.",
    example:
      "A home loan, personal loan, or outstanding credit-card balance is a liability.",
    related: ["Asset", "Debt", "Net Worth"],
  },
  {
    slug: "net-worth",
    term: "Net Worth",
    category: "Basics",
    simple:
      "The value of everything you own minus everything you owe.",
    technical:
      "Net worth is calculated as total assets minus total liabilities.",
    example:
      "If your assets are worth ₹10 lakh and your liabilities are ₹3 lakh, your net worth is ₹7 lakh.",
    related: ["Asset", "Liability", "Portfolio"],
  },
  {
    slug: "budget",
    term: "Budget",
    category: "Personal Finance",
    simple:
      "A plan for how you will use your income.",
    technical:
      "A budget is a financial plan that allocates expected income among expenses, savings, investments, and debt payments.",
    example:
      "You might allocate 50% of your income to needs, 30% to wants, and 20% to savings and investments.",
    related: ["Emergency Fund", "Income", "Expense"],
  },
  {
    slug: "income",
    term: "Income",
    category: "Personal Finance",
    simple:
      "Money that you receive or earn.",
    technical:
      "Income represents monetary inflows received from employment, business activity, investments, or other sources.",
    example:
      "Your monthly salary is employment income.",
    related: ["Expense", "Budget", "Savings"],
  },
  {
    slug: "expense",
    term: "Expense",
    category: "Personal Finance",
    simple:
      "Money that you spend on goods, services, or obligations.",
    technical:
      "An expense is an outflow of money incurred to meet consumption needs, obligations, or other financial requirements.",
    example:
      "Rent, groceries, transport, and subscriptions are common expenses.",
    related: ["Income", "Budget", "Savings"],
  },
  {
    slug: "emergency-fund",
    term: "Emergency Fund",
    category: "Personal Finance",
    simple:
      "Money kept aside for unexpected financial situations.",
    technical:
      "An emergency fund is a liquid reserve intended to cover essential expenses during events such as job loss, medical emergencies, or major repairs.",
    example:
      "Someone with ₹30,000 of essential monthly expenses may target an emergency fund covering several months of expenses.",
    related: ["Budget", "Savings", "Liquidity"],
  },
  {
    slug: "savings",
    term: "Savings",
    category: "Personal Finance",
    simple:
      "Money you keep instead of spending immediately.",
    technical:
      "Savings represent income that is not consumed and is retained for future needs or goals.",
    example:
      "Setting aside ₹5,000 every month for a future purchase is saving.",
    related: ["Budget", "Emergency Fund", "Investment"],
  },
  {
    slug: "investment",
    term: "Investment",
    category: "Investing",
    simple:
      "Putting money into something with the expectation that it may grow or generate returns.",
    technical:
      "An investment is an allocation of capital to an asset or activity with the expectation of future income, appreciation, or another economic benefit.",
    example:
      "Buying units of a mutual fund is an investment.",
    related: ["Return", "Risk", "Portfolio"],
  },
  {
    slug: "sip",
    term: "SIP",
    category: "Investing",
    simple:
      "A way to invest a fixed amount regularly, usually in a mutual fund.",
    technical:
      "A Systematic Investment Plan allows an investor to invest a predetermined amount at regular intervals into a mutual fund scheme.",
    example:
      "Investing ₹5,000 into a mutual fund every month is an example of an SIP.",
    related: ["Mutual Fund", "NAV", "Rupee-Cost Averaging"],
  },
  {
    slug: "mutual-fund",
    term: "Mutual Fund",
    category: "Investing",
    simple:
      "An investment vehicle that pools money from many investors and invests it in a portfolio of securities.",
    technical:
      "A mutual fund pools investor capital and invests according to a defined investment objective and strategy.",
    example:
      "A mutual fund may invest across shares, bonds, or other securities depending on its mandate.",
    related: ["SIP", "NAV", "Diversification"],
  },
  {
    slug: "nav",
    term: "NAV",
    category: "Investing",
    simple:
      "The per-unit value of a mutual fund.",
    technical:
      "Net Asset Value represents the value of a mutual fund scheme's net assets divided by the number of units outstanding.",
    example:
      "If a fund's NAV is ₹100 and you invest ₹5,000, you would receive approximately 50 units before applicable charges or adjustments.",
    related: ["Mutual Fund", "SIP", "Unit"],
  },
  {
    slug: "rupee-cost-averaging",
    term: "Rupee-Cost Averaging",
    category: "Investing",
    simple:
      "Investing the same amount regularly means you buy more units when prices are lower and fewer when prices are higher.",
    technical:
      "Periodic fixed-amount investing results in varying quantities of an asset being purchased at different prices.",
    example:
      "With ₹5,000 invested each month, a lower NAV allows the investor to purchase more units than a higher NAV.",
    related: ["SIP", "NAV", "Market Volatility"],
  },
  {
    slug: "compounding",
    term: "Compounding",
    category: "Investing",
    simple:
      "Earning returns on both your original money and earlier returns.",
    technical:
      "Compounding occurs when accumulated returns generate additional returns over subsequent periods.",
    example:
      "If an investment earns returns and those returns remain invested, future returns can be earned on the accumulated amount.",
    related: ["Return", "SIP", "Time Horizon"],
  },
  {
    slug: "return",
    term: "Return",
    category: "Investing",
    simple:
      "The gain or loss produced by an investment over a period.",
    technical:
      "Investment return measures the change in value of an investment, including applicable income and capital appreciation or depreciation.",
    example:
      "If an investment increases from ₹10,000 to ₹11,000, the gain is ₹1,000 before considering costs and taxes.",
    related: ["Investment", "Risk", "Compounding"],
  },
  {
    slug: "risk",
    term: "Risk",
    category: "Investing",
    simple:
      "The possibility that an investment may produce an unexpected result, including losing money.",
    technical:
      "Investment risk refers to uncertainty surrounding future returns and the possibility of loss or underperformance.",
    example:
      "Equity investments can fluctuate significantly because their market prices change.",
    related: ["Return", "Volatility", "Diversification"],
  },
  {
    slug: "diversification",
    term: "Diversification",
    category: "Investing",
    simple:
      "Spreading investments across different assets instead of relying on one.",
    technical:
      "Diversification reduces concentration risk by allocating capital across assets, sectors, securities, or other exposures that may not move identically.",
    example:
      "Owning investments across several sectors can reduce dependence on the performance of a single company or industry.",
    related: ["Portfolio", "Risk", "Asset Allocation"],
  },
  {
    slug: "portfolio",
    term: "Portfolio",
    category: "Investing",
    simple:
      "The collection of investments owned by an investor.",
    technical:
      "An investment portfolio is the aggregate set of financial assets held by an individual or institution.",
    example:
      "A portfolio may contain mutual funds, stocks, bonds, and cash.",
    related: ["Diversification", "Asset Allocation", "Risk"],
  },
  {
    slug: "asset-allocation",
    term: "Asset Allocation",
    category: "Investing",
    simple:
      "Deciding how much money to put into different types of investments.",
    technical:
      "Asset allocation determines the distribution of capital among asset classes such as equities, fixed income, cash, and other investments.",
    example:
      "An investor may decide to hold a combination of equity, debt, and cash based on their goals and risk tolerance.",
    related: ["Portfolio", "Diversification", "Risk"],
  },
  {
    slug: "stock",
    term: "Stock",
    category: "Markets",
    simple:
      "A unit of ownership in a company.",
    technical:
      "A stock represents an ownership interest in a corporation and may provide rights such as voting or participation in economic gains.",
    example:
      "Buying shares of a listed company makes the investor a shareholder of that company.",
    related: ["Share", "Equity", "Market Capitalization"],
  },
  {
    slug: "share",
    term: "Share",
    category: "Markets",
    simple:
      "A single unit representing ownership in a company.",
    technical:
      "A share represents a proportional ownership interest in a company's equity capital.",
    example:
      "If you own 10 shares of a company, you hold ownership represented by those 10 shares.",
    related: ["Stock", "Equity", "Dividend"],
  },
  {
    slug: "stock-market",
    term: "Stock Market",
    category: "Markets",
    simple:
      "A marketplace where shares and other securities are bought and sold.",
    technical:
      "Stock markets provide organized venues and systems through which securities can be traded between buyers and sellers.",
    example:
      "Investors can buy and sell listed shares through the stock market.",
    related: ["Stock", "Index", "NSE"],
  },
  {
    slug: "index",
    term: "Index",
    category: "Markets",
    simple:
      "A measure that tracks the performance of a selected group of securities.",
    technical:
      "A market index is a statistical measure constructed from a defined basket of securities to represent the performance of a market segment.",
    example:
      "An index can be used to understand how a particular group of stocks has performed.",
    related: ["Nifty 50", "Sensex", "Stock Market"],
  },
  {
    slug: "nifty-50",
    term: "Nifty 50",
    category: "Markets",
    simple:
      "A major Indian stock-market index representing 50 large companies listed on the NSE.",
    technical:
      "Nifty 50 is a diversified benchmark index designed to represent the performance of large-cap companies listed on the National Stock Exchange of India.",
    example:
      "Financial news often reports whether the Nifty 50 rose or fell during a trading session.",
    related: ["Index", "Sensex", "NSE"],
  },
  {
    slug: "sensex",
    term: "Sensex",
    category: "Markets",
    simple:
      "A major Indian stock-market index associated with the BSE.",
    technical:
      "The S&P BSE Sensex is a benchmark index representing selected large and liquid companies listed on the Bombay Stock Exchange.",
    example:
      "The Sensex is commonly used as a broad indicator of Indian equity-market performance.",
    related: ["Index", "Nifty 50", "BSE"],
  },
  {
    slug: "market-capitalization",
    term: "Market Capitalization",
    category: "Markets",
    simple:
      "The total market value of a company's outstanding shares.",
    technical:
      "Market capitalization is calculated by multiplying the current market price per share by the number of outstanding shares.",
    example:
      "A company with 10 crore shares priced at ₹100 has a market capitalization of ₹1,000 crore.",
    related: ["Stock", "Share", "Large Cap"],
  },
  {
    slug: "volatility",
    term: "Volatility",
    category: "Markets",
    simple:
      "How much and how quickly an investment's price changes.",
    technical:
      "Volatility is a statistical measure of the dispersion or variability of an asset's returns over time.",
    example:
      "A stock whose price moves sharply up and down may be described as highly volatile.",
    related: ["Risk", "Stock Market", "Return"],
  },
  {
    slug: "liquidity",
    term: "Liquidity",
    category: "Markets",
    simple:
      "How easily an asset can be converted into cash without significantly affecting its price.",
    technical:
      "Liquidity refers to the ability to transact an asset quickly and efficiently with relatively low transaction impact.",
    example:
      "A heavily traded listed stock is generally more liquid than a specialized physical asset.",
    related: ["Asset", "Stock Market", "Cash"],
  },
  {
    slug: "dividend",
    term: "Dividend",
    category: "Markets",
    simple:
      "A distribution of part of a company's profits to eligible shareholders.",
    technical:
      "A dividend is a distribution declared by a company to shareholders, typically based on the number of shares held.",
    example:
      "A company may declare a ₹5 dividend per share to eligible shareholders.",
    related: ["Share", "Stock", "Return"],
  },
  {
    slug: "inflation",
    term: "Inflation",
    category: "Economics",
    simple:
      "A sustained increase in the general level of prices over time.",
    technical:
      "Inflation represents a persistent rise in the general price level, reducing the purchasing power of money.",
    example:
      "If everyday goods become more expensive over several years, your ₹100 buys less than it did previously.",
    related: ["Purchasing Power", "Interest Rate", "Economy"],
  },
  {
    slug: "interest-rate",
    term: "Interest Rate",
    category: "Economics",
    simple:
      "The cost of borrowing money or the return earned for lending or saving it.",
    technical:
      "An interest rate represents the percentage charge or return applied to a principal amount over a specified period.",
    example:
      "A bank may charge interest on a loan or pay interest on certain deposits.",
    related: ["Inflation", "Loan", "Compounding"],
  },
];

/* ============================================================
   CATEGORIES
============================================================ */

const CATEGORIES = [
  "Basics",
  "Personal Finance",
  "Investing",
  "Markets",
  "Economics",
];

/* ============================================================
   HELPERS
============================================================ */

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim();
}

/* ============================================================
   PAGE
============================================================ */

export default function GlossaryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<string | null>(null);
  const [selectedTerm, setSelectedTerm] =
    useState<string | null>(null);

  const results = useMemo(() => {
    const query = normalize(searchQuery);

    return GLOSSARY_TERMS
      .filter((term) => {
        const matchesSearch =
          !query ||
          normalize(term.term).includes(query) ||
          normalize(term.simple).includes(query) ||
          normalize(term.technical).includes(query) ||
          term.related.some((related) =>
            normalize(related).includes(query)
          );

        const matchesCategory =
          !selectedCategory ||
          term.category === selectedCategory;

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) =>
        a.term.localeCompare(b.term)
      );
  }, [searchQuery, selectedCategory]);

  const selectedTermData =
    GLOSSARY_TERMS.find(
      (term) => term.slug === selectedTerm
    ) ?? null;

  const selectRelatedTerm = (related: string) => {
    const normalizedRelated = normalize(related);

    const match = GLOSSARY_TERMS.find(
      (term) =>
        normalize(term.term) === normalizedRelated
    );

    if (match) {
      setSelectedTerm(match.slug);
      return;
    }

    const partialMatch = GLOSSARY_TERMS.find(
      (term) =>
        normalize(term.term).includes(
          normalizedRelated
        ) ||
        normalizedRelated.includes(
          normalize(term.term)
        )
    );

    if (partialMatch) {
      setSelectedTerm(partialMatch.slug);
    }
  };

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
            backgroundSize: "42px 42px",
            maskImage:
              "radial-gradient(circle at center, black 0%, transparent 78%)",
          }}
        />

        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-cyan-500/[0.05] blur-[130px]" />

        <div className="absolute right-[-180px] top-[30%] h-[440px] w-[440px] rounded-full bg-violet-500/[0.035] blur-[130px]" />
      </div>

      {/* ========================================================
          CONTENT
      ======================================================== */}

      <div className="relative mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        {/* ======================================================
            HEADER
        ====================================================== */}

        <header className="mb-7">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.07]">
              <BookOpen className="h-4 w-4 text-cyan-300" />
            </div>

            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-cyan-300/70">
                Finance reference
              </p>

              <p className="text-[10px] text-slate-600">
                Learn the language of money
              </p>
            </div>
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
            Financial Glossary
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            A practical reference for financial terms,
            investing concepts, market terminology, and
            personal-finance vocabulary.
          </p>
        </header>

        {/* ======================================================
            SEARCH
        ====================================================== */}

        <div className="mb-5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

            <input
              type="text"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Search terms, concepts or keywords..."
              className="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] pl-11 pr-11 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-400/30 focus:bg-white/[0.05]"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white/[0.06] hover:text-slate-300"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ======================================================
            CATEGORY FILTERS
        ====================================================== */}

        <div className="mb-7">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setSelectedCategory(null)
              }
              className={[
                "rounded-lg border px-3 py-2",
                "text-[10px] font-semibold",
                "transition-all",
                !selectedCategory
                  ? "border-cyan-400/25 bg-cyan-400/10 text-cyan-300"
                  : "border-white/[0.07] bg-white/[0.025] text-slate-500 hover:border-white/[0.12] hover:text-slate-300",
              ].join(" ")}
            >
              All Terms
            </button>

            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() =>
                  setSelectedCategory(category)
                }
                className={[
                  "rounded-lg border px-3 py-2",
                  "text-[10px] font-semibold",
                  "transition-all",
                  selectedCategory === category
                    ? "border-cyan-400/25 bg-cyan-400/10 text-cyan-300"
                    : "border-white/[0.07] bg-white/[0.025] text-slate-500 hover:border-white/[0.12] hover:text-slate-300",
                ].join(" ")}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* ======================================================
            MAIN LAYOUT
        ====================================================== */}

        <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
          {/* ====================================================
              TERM LIST
          ==================================================== */}

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3">
            <div className="flex items-center justify-between px-2 pb-3">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                  Terms
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {results.length}{" "}
                  {results.length === 1
                    ? "term"
                    : "terms"}
                </p>
              </div>

              <span className="rounded-full border border-white/[0.06] bg-white/[0.025] px-2 py-1 text-[9px] text-slate-600">
                A–Z
              </span>
            </div>

            <div className="max-h-[620px] space-y-1 overflow-y-auto pr-1">
              {results.length > 0 ? (
                results.map((term) => {
                  const active =
                    selectedTerm === term.slug;

                  return (
                    <button
                      key={term.slug}
                      type="button"
                      onClick={() =>
                        setSelectedTerm(term.slug)
                      }
                      className={[
                        "group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all",
                        active
                          ? "border border-cyan-400/15 bg-cyan-400/[0.07]"
                          : "border border-transparent hover:bg-white/[0.035]",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold",
                          active
                            ? "bg-cyan-400/10 text-cyan-300"
                            : "bg-white/[0.04] text-slate-600",
                        ].join(" ")}
                      >
                        {term.term
                          .charAt(0)
                          .toUpperCase()}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span
                          className={[
                            "block truncate text-xs font-medium",
                            active
                              ? "text-cyan-200"
                              : "text-slate-300 group-hover:text-white",
                          ].join(" ")}
                        >
                          {term.term}
                        </span>

                        <span className="mt-0.5 block truncate text-[9px] text-slate-700">
                          {term.category}
                        </span>
                      </span>

                      <ChevronRight
                        className={[
                          "h-3.5 w-3.5 shrink-0 transition-all",
                          active
                            ? "text-cyan-300"
                            : "text-slate-800 group-hover:translate-x-0.5 group-hover:text-slate-500",
                        ].join(" ")}
                      />
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-10 text-center">
                  <Search className="mx-auto h-5 w-5 text-slate-700" />

                  <p className="mt-3 text-xs font-medium text-slate-500">
                    No terms found
                  </p>

                  <p className="mt-1 text-[10px] text-slate-700">
                    Try another search or category.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ====================================================
              DETAIL
          ==================================================== */}

          <div>
            {selectedTermData ? (
              <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.035]">
                {/* Detail header */}

                <div className="border-b border-white/[0.06] p-5 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="inline-flex rounded-full border border-cyan-400/15 bg-cyan-400/[0.07] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-cyan-300">
                        {selectedTermData.category}
                      </span>

                      <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-white">
                        {selectedTermData.term}
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedTerm(null)
                      }
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] text-slate-600 transition hover:bg-white/[0.05] hover:text-slate-300"
                      aria-label="Close term"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Detail body */}

                <div className="space-y-6 p-5 sm:p-7">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-cyan-300" />

                      <h3 className="text-[9px] font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
                        Simple explanation
                      </h3>
                    </div>

                    <p className="text-sm leading-7 text-slate-300">
                      {selectedTermData.simple}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/[0.06] bg-black/10 p-4">
                    <h3 className="mb-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-violet-300/80">
                      Technical definition
                    </h3>

                    <p className="text-xs leading-6 text-slate-500">
                      {selectedTermData.technical}
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-emerald-300/80">
                      Example
                    </h3>

                    <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.035] p-4">
                      <p className="text-xs leading-6 text-slate-400">
                        {selectedTermData.example}
                      </p>
                    </div>
                  </div>

                  {selectedTermData.related.length >
                    0 && (
                    <div>
                      <h3 className="mb-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                        Related terms
                      </h3>

                      <div className="flex flex-wrap gap-2">
                        {selectedTermData.related.map(
                          (related) => (
                            <button
                              key={related}
                              type="button"
                              onClick={() =>
                                selectRelatedTerm(
                                  related
                                )
                              }
                              className="rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-[10px] font-medium text-slate-500 transition hover:border-cyan-400/15 hover:bg-cyan-400/[0.05] hover:text-cyan-300"
                            >
                              {related}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex min-h-[500px] items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.025] p-8 text-center">
                <div className="max-w-sm">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.05]">
                    <BookOpen className="h-6 w-6 text-cyan-300/70" />
                  </div>

                  <h2 className="mt-5 text-base font-semibold text-white">
                    Select a financial term
                  </h2>

                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    Choose a term from the list to see
                    its simple explanation, technical
                    definition, example, and related
                    concepts.
                  </p>

                  <div className="mt-5 flex items-center justify-center gap-2 text-[9px] uppercase tracking-[0.18em] text-slate-700">
                    <Search className="h-3 w-3" />
                    Search the glossary above
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================
            FOOTER
        ====================================================== */}

        <div className="flex items-center justify-between border-t border-white/[0.05] pt-5">
          <p className="text-[9px] uppercase tracking-[0.18em] text-slate-800">
            FinPilot • Financial Knowledge Base
          </p>

          <p className="text-[9px] text-slate-800">
            {GLOSSARY_TERMS.length} terms
          </p>
        </div>
      </div>
    </div>
  );
}