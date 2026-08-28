"""
Seed script — populates the FinPilot AI database with the full 6-level curriculum.

Run from the backend/ directory:
    python -m scripts.seed_curriculum

Prerequisites:
    - DATABASE_URL set in .env
    - Migration 0001 (and 0002) already applied

Content is real, beginner-friendly educational material — not lorem ipsum.
Each lesson includes the key concept, an Indian-context example, and a
takeaway to build genuine financial literacy.
"""
from __future__ import annotations

import asyncio
import logging
import sys
from pathlib import Path

# Make sure the backend package is importable
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.models.learning import Lesson, Module
from app.models.progress import Badge
from app.models.quiz import Question, Quiz

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger("seed")


# ─────────────────────────────────────────────────────────────────────────────
# Curriculum definition
# ─────────────────────────────────────────────────────────────────────────────

MODULES: list[dict] = [

    # ── LEVEL 1 — Financial Foundations ──────────────────────────────────────
    {
        "title": "Financial Foundations",
        "slug": "financial-foundations",
        "description": "Build your money mindset from scratch — income, expenses, budgeting, saving, and the power of compounding.",
        "level": "beginner",
        "track": "C",
        "order_index": 0,
        "lessons": [
            {
                "slug": "what-is-money",
                "title": "What Is Money and Why It Matters",
                "order_index": 0,
                "estimated_minutes": 5,
                "xp_reward": 10,
                "content_markdown": """## What Is Money and Why It Matters

Money is a medium of exchange — it lets you trade your time and skills for goods and services without the complexity of barter.

### Why managing money matters
Most people earn money but few *keep* it. Understanding the difference between earning and wealth-building is the first step to financial freedom.

**Key concepts:**
- **Income** — money you earn (salary, business, freelance)
- **Expenses** — money you spend
- **Savings** — income minus expenses
- **Wealth** — assets you accumulate over time

### Indian context
A salaried professional in India earning ₹50,000/month may spend ₹48,000 and save only ₹2,000. Over 10 years, that's just ₹2.4 lakh saved — not accounting for inflation eating its value.

Learning to *allocate* money intentionally changes this story.

💡 **Key Takeaway:** Wealth is not about how much you earn — it's about how much you keep and grow.
""",
            },
            {
                "slug": "income-and-expenses",
                "title": "Understanding Income and Expenses",
                "order_index": 1,
                "estimated_minutes": 7,
                "xp_reward": 10,
                "content_markdown": """## Understanding Income and Expenses

Before you can manage money, you need to track it.

### Types of income
- **Active income** — salary, freelance work (requires your time)
- **Passive income** — rent, dividends, interest (money working for you)
- **Portfolio income** — capital gains from investments

### Fixed vs variable expenses
| Type | Examples |
|---|---|
| Fixed | Rent, EMIs, insurance premium |
| Variable | Groceries, dining, entertainment |
| Discretionary | Vacation, gadgets |

### Net income formula
```
Net Income = Gross Income − Tax − EPF − Professional Tax
```

If your CTC is ₹8 lakh/year and your in-hand salary is ₹55,000/month, your effective net income is **₹6.6 lakh/year** after deductions.

💡 **Key Takeaway:** Track *net* income (what hits your bank) not *gross*. Budget from what you actually have.
""",
            },
            {
                "slug": "budgeting-basics",
                "title": "Budgeting: The 50/30/20 Rule",
                "order_index": 2,
                "estimated_minutes": 8,
                "xp_reward": 15,
                "content_markdown": """## Budgeting: The 50/30/20 Rule

A budget is a plan for your money. The 50/30/20 rule is the simplest framework to start with.

### The rule
| Bucket | Allocation | Examples |
|---|---|---|
| **Needs** | 50% | Rent, groceries, EMIs, utilities, medicines |
| **Wants** | 30% | Dining out, OTT, travel, gadgets |
| **Savings & Investments** | 20% | SIP, PPF, emergency fund, FD |

### Example: ₹60,000 in-hand salary
- Needs: ₹30,000
- Wants: ₹18,000
- Savings: ₹12,000

### Why it works
The rule forces you to pay yourself first (the 20%) before spending on wants. Many Indians save *whatever is left over* — this almost always results in saving nothing.

### Adapting the rule
If you live in Mumbai or Bengaluru, rent alone may eat 40–50% of income. Adjust — the goal is to *always* save at least 10–20%.

💡 **Key Takeaway:** Automate your savings on salary day. Treat it like a mandatory EMI to your future self.
""",
                "quiz": {
                    "title": "Budgeting Basics Quiz",
                    "passing_score": 70,
                    "questions": [
                        {
                            "question_text": "In the 50/30/20 rule, what percentage should go to savings and investments?",
                            "question_type": "mcq",
                            "options": [{"key": "A", "text": "10%"}, {"key": "B", "text": "20%"}, {"key": "C", "text": "30%"}, {"key": "D", "text": "50%"}],
                            "correct_answer": "B",
                            "explanation": "The '20' in 50/30/20 represents savings and investments.",
                            "difficulty": "easy",
                            "points": 10,
                        },
                        {
                            "question_text": "Rent is classified as a 'need' in the 50/30/20 rule.",
                            "question_type": "true_false",
                            "options": None,
                            "correct_answer": "true",
                            "explanation": "Rent is a non-discretionary fixed expense — it's a need.",
                            "difficulty": "easy",
                            "points": 10,
                        },
                        {
                            "question_text": "If your monthly in-hand salary is ₹80,000, how much should go to savings under 50/30/20?",
                            "question_type": "fill_blank",
                            "options": None,
                            "correct_answer": "16000",
                            "explanation": "20% of ₹80,000 = ₹16,000.",
                            "difficulty": "medium",
                            "points": 10,
                        },
                    ],
                },
            },
            {
                "slug": "emergency-fund",
                "title": "Why You Need an Emergency Fund",
                "order_index": 3,
                "estimated_minutes": 6,
                "xp_reward": 10,
                "content_markdown": """## Why You Need an Emergency Fund

An emergency fund is cash set aside for unexpected, urgent expenses — job loss, medical emergency, car breakdown.

### How much do you need?
- **Minimum:** 3 months of essential expenses
- **Recommended:** 6 months
- **Freelancers/self-employed:** 9–12 months

### Where to park it
Your emergency fund must be **liquid** (accessible within 24 hours) and **safe** (no market risk):
- Savings account (instant access)
- Liquid mutual funds (T+1 redemption)
- Sweep-in FD

**Avoid:** Equity funds, PPF (locked), real estate (illiquid).

### Why most people skip this
People feel the emergency fund is "idle money." It's not — it's *insurance* against needing to take a loan at 24% interest.

💡 **Key Takeaway:** Build your emergency fund before starting any investment. It protects every other financial plan you make.
""",
            },
            {
                "slug": "inflation-and-real-returns",
                "title": "Inflation: The Silent Wealth Destroyer",
                "order_index": 4,
                "estimated_minutes": 7,
                "xp_reward": 15,
                "content_markdown": """## Inflation: The Silent Wealth Destroyer

Inflation is the rate at which prices rise over time, reducing the purchasing power of money.

### The impact
At 6% annual inflation, ₹1 lakh today will only buy what ₹55,839 buys today — 10 years from now.

| Year | Purchasing power of ₹1 lakh (at 6% inflation) |
|---|---|
| 0 | ₹1,00,000 |
| 5 | ₹74,726 |
| 10 | ₹55,839 |
| 20 | ₹31,180 |

### Real return formula
```
Real Return = Nominal Return − Inflation Rate
```

If your FD gives 7% and inflation is 6%, your **real return is only 1%**.

### What beats inflation
- **Equity mutual funds** — historically 12–15% CAGR (long term)
- **Index funds** — track the market, low cost
- **Real estate** — but illiquid

**FDs and savings accounts often don't beat inflation after tax.**

💡 **Key Takeaway:** Investing in assets that grow faster than inflation is not optional — it's essential to protect your wealth.
""",
            },
            {
                "slug": "compound-interest",
                "title": "The Power of Compound Interest",
                "order_index": 5,
                "estimated_minutes": 8,
                "xp_reward": 15,
                "content_markdown": """## The Power of Compound Interest

Compound interest is earning returns on your returns — the foundation of wealth building.

### Simple vs compound interest
| | Simple Interest | Compound Interest |
|---|---|---|
| Principal | ₹1,00,000 | ₹1,00,000 |
| Rate | 10% | 10% |
| After 10 years | ₹2,00,000 | ₹2,59,374 |

### The Rule of 72
A quick way to estimate how long it takes to double your money:
```
Years to double = 72 ÷ Annual Return %
```
- At 8%: 72 ÷ 8 = **9 years**
- At 12%: 72 ÷ 12 = **6 years**

### The time advantage
Rahul starts investing ₹5,000/month at age 25. Priya starts at 35 with the same amount. At 60 (assuming 12% returns), Rahul has **₹3.24 crore** vs Priya's **₹94 lakh** — Rahul invested only ₹6 lakh more but has 3.4× more wealth.

**Time is your most powerful financial asset.**

💡 **Key Takeaway:** Start early. Even small amounts invested consistently for decades create extraordinary wealth through compounding.
""",
            },
        ],
    },

    # ── LEVEL 2 — SIPs & Mutual Funds ────────────────────────────────────────
    {
        "title": "SIPs & Mutual Funds",
        "slug": "sips-and-mutual-funds",
        "description": "Master Systematic Investment Plans, mutual fund types, NAV, expense ratios, and how to pick the right fund.",
        "level": "beginner",
        "track": "A",
        "order_index": 1,
        "lessons": [
            {
                "slug": "what-is-a-mutual-fund",
                "title": "What Is a Mutual Fund?",
                "order_index": 0,
                "estimated_minutes": 8,
                "xp_reward": 15,
                "content_markdown": """## What Is a Mutual Fund?

A mutual fund pools money from thousands of investors and invests it in a diversified portfolio managed by a professional fund manager.

### How it works
1. You invest ₹5,000 in a mutual fund
2. That money is pooled with crores from other investors
3. The AMC (Asset Management Company) invests the pool in stocks, bonds, etc.
4. Returns are distributed proportionally to all investors

### Key terms
- **AMC** — Asset Management Company (e.g., HDFC AMC, SBI AMC, Mirae Asset)
- **NAV** — Net Asset Value (price of one unit of the fund)
- **Units** — your share of the fund pool
- **AUM** — Assets Under Management (total size of the fund)

### SEBI regulation
All mutual funds in India are regulated by **SEBI** (Securities and Exchange Board of India). This means your money is protected by strict disclosure and oversight requirements.

### Why mutual funds?
- Professional management
- Diversification with small amounts
- Liquidity (most funds can be redeemed in 1–3 days)
- Transparent (daily NAV disclosure)

💡 **Key Takeaway:** Mutual funds let you invest like the wealthy — diversified, professionally managed — starting with as little as ₹500/month.
""",
            },
            {
                "slug": "understanding-nav",
                "title": "Understanding NAV",
                "order_index": 1,
                "estimated_minutes": 6,
                "xp_reward": 10,
                "content_markdown": """## Understanding NAV (Net Asset Value)

NAV is the per-unit price of a mutual fund. It's calculated daily after market close.

### Formula
```
NAV = (Total Assets − Total Liabilities) ÷ Number of Units Outstanding
```

### Example
A fund has:
- Total assets: ₹100 crore
- Total liabilities: ₹2 crore
- Units outstanding: 1 crore

NAV = (100 − 2) ÷ 1 = **₹98 per unit**

### Common misconception: Lower NAV ≠ cheaper
A fund with NAV ₹10 and a fund with NAV ₹500 are equally "cheap" if their future growth rate is the same. What matters is *percentage return*, not absolute NAV.

### When does NAV change?
NAV changes daily based on:
- Market prices of underlying securities
- Dividends received
- Fund manager transactions

💡 **Key Takeaway:** Don't choose a fund because its NAV is low. Focus on the fund's historical performance, expense ratio, and category.
""",
            },
            {
                "slug": "types-of-mutual-funds",
                "title": "Types of Mutual Funds",
                "order_index": 2,
                "estimated_minutes": 10,
                "xp_reward": 20,
                "content_markdown": """## Types of Mutual Funds

SEBI classifies mutual funds into five broad categories:

### 1. Equity Funds
Invest primarily in stocks. Best for long-term wealth creation (5+ years).

| Sub-type | Invests in |
|---|---|
| Large-cap | Top 100 companies by market cap (e.g., Reliance, TCS) |
| Mid-cap | Companies ranked 101–250 |
| Small-cap | Companies ranked 251+ |
| ELSS | Tax-saving equity fund (3-year lock-in, 80C benefit) |
| Index Fund | Passively tracks an index (Nifty 50, Sensex) |

### 2. Debt Funds
Invest in bonds, government securities, and fixed-income instruments. Lower risk than equity. Good for 1–3 year goals.

### 3. Hybrid Funds
Mix of equity and debt. Balanced advantage funds adjust the ratio dynamically.

### 4. Index Funds / ETFs
Track a market index passively. Very low expense ratio (0.1–0.5%).

### 5. Solution-Oriented Funds
Retirement funds, children's funds — with lock-in periods.

### Risk vs return
```
Debt < Hybrid < Large-cap < Mid-cap < Small-cap
(low risk)                                (high risk)
```

💡 **Key Takeaway:** Match the fund type to your goal and time horizon. Use equity for long-term goals, debt for short-term.
""",
                "quiz": {
                    "title": "Mutual Fund Types Quiz",
                    "passing_score": 70,
                    "questions": [
                        {
                            "question_text": "Which type of mutual fund is best suited for a 3-year goal with moderate risk?",
                            "question_type": "mcq",
                            "options": [{"key": "A", "text": "Small-cap fund"}, {"key": "B", "text": "Debt fund"}, {"key": "C", "text": "Hybrid fund"}, {"key": "D", "text": "ELSS fund"}],
                            "correct_answer": "C",
                            "explanation": "Hybrid funds mix equity and debt, offering moderate risk suitable for a 3-year horizon.",
                            "difficulty": "medium",
                            "points": 10,
                        },
                        {
                            "question_text": "ELSS funds have a lock-in period of 3 years.",
                            "question_type": "true_false",
                            "options": None,
                            "correct_answer": "true",
                            "explanation": "ELSS (Equity Linked Saving Scheme) has a mandatory 3-year lock-in period, the shortest among 80C instruments.",
                            "difficulty": "easy",
                            "points": 10,
                        },
                    ],
                },
            },
            {
                "slug": "sip-explained",
                "title": "SIP: Systematic Investment Plan Explained",
                "order_index": 3,
                "estimated_minutes": 10,
                "xp_reward": 20,
                "content_markdown": """## SIP: Systematic Investment Plan Explained

A SIP lets you invest a fixed amount in a mutual fund at regular intervals (usually monthly), automatically.

### How a SIP works
1. You set up an auto-debit of ₹5,000 on the 5th of every month
2. On that date, the amount is debited from your bank
3. Units are allotted at the prevailing NAV
4. Over time, you accumulate units at various prices

### Rupee-cost averaging
Because you invest a fixed amount regardless of the market:
- When NAV is high → you get fewer units
- When NAV is low → you get more units

Over time, your average cost per unit is lower than if you had invested at a single price.

**Example:**
| Month | NAV | Units bought (₹5,000 invested) |
|---|---|---|
| Jan | ₹100 | 50 |
| Feb | ₹80 | 62.5 |
| Mar | ₹120 | 41.67 |
| **Average** | **₹100** | **Avg cost: ₹90.91** |

You accumulated units at an average of ₹90.91 even though the NAV went up to ₹120.

### SIP vs Lumpsum
- **SIP**: Spreads risk, ideal when you have regular income, removes timing pressure
- **Lumpsum**: Better if markets are cheap and you have a windfall to invest

### Step-up SIP
Increase your SIP amount by 10–15% every year as your income grows. This dramatically increases your final corpus.

💡 **Key Takeaway:** SIP removes the need to time the market. Invest consistently, let rupee-cost averaging work in your favour.
""",
            },
            {
                "slug": "expense-ratio-and-exit-load",
                "title": "Expense Ratio, Exit Load, and Direct vs Regular Plans",
                "order_index": 4,
                "estimated_minutes": 8,
                "xp_reward": 15,
                "content_markdown": """## Expense Ratio, Exit Load, and Direct vs Regular Plans

Small differences in costs compound into huge differences over decades.

### Expense Ratio
The annual fee charged by the AMC to manage the fund, expressed as a percentage of AUM.

- **Actively managed equity fund:** 1.5–2.5%
- **Index fund:** 0.1–0.5%
- **Direct plan:** ~0.5–1% lower than regular

**Why it matters:** At 12% gross return with 2% expense ratio, you net 10%. At 0.5% expense ratio, you net 11.5%.

Over 20 years on ₹5,000/month SIP:
- 10% return → **₹37.97 lakh**
- 11.5% return → **₹46.95 lakh**

A 1.5% difference in expense ratio costs you **₹9 lakh** over 20 years.

### Exit Load
A fee charged if you redeem units before a specified period (usually 1 year for equity funds = 1%).

### Direct vs Regular Plans
| Feature | Direct Plan | Regular Plan |
|---|---|---|
| Who buys | Investor directly on AMC website or MF Central | Through a distributor/advisor |
| Expense ratio | Lower (no commission) | Higher (includes distributor commission) |
| NAV | Higher over time | Lower over time |
| Best for | Self-informed investors | Those needing advice |

**Verdict:** If you're investing via SIP in an index fund, use the **direct plan** on platforms like Zerodha Coin, MF Central, or the AMC website directly.

💡 **Key Takeaway:** In a direct index fund, you keep more of your returns. Lower costs are the only guaranteed alpha.
""",
            },
            {
                "slug": "sip-vs-lumpsum",
                "title": "SIP vs Lumpsum: When to Use Which",
                "order_index": 5,
                "estimated_minutes": 7,
                "xp_reward": 10,
                "content_markdown": """## SIP vs Lumpsum: When to Use Which

Both are valid strategies. The right choice depends on your situation.

### SIP is better when:
- You have a regular income (salary)
- Markets are at all-time highs (you're uncertain about timing)
- You're a beginner and want simplicity
- You want to build discipline

### Lumpsum is better when:
- Markets have corrected significantly (e.g., during COVID crash, Nifty fell 38%)
- You received a windfall (bonus, inheritance, sale proceeds)
- Your investment horizon is very long (15+ years) — lumpsum benefits more from compounding

### XIRR vs CAGR
- **CAGR** — measures annualised return for a one-time investment
- **XIRR** — accounts for multiple cash flows at different dates (use this for SIP returns)

For SIPs, always evaluate using **XIRR**, not CAGR.

### Practical approach
Many investors do both — SIP for regular income, and deploy lumpsum whenever they receive a bonus or when markets dip.

💡 **Key Takeaway:** SIP is better for salaried investors. Lumpsum outperforms SIP when markets are cheap. Most people should start with SIP.
""",
            },
        ],
    },

    # ── LEVEL 3 — Indian Stock Market ────────────────────────────────────────
    {
        "title": "Indian Stock Market Basics",
        "slug": "indian-stock-market",
        "description": "Understand NSE, BSE, Nifty, Sensex, IPOs, dividends, and how stock prices are determined.",
        "level": "intermediate",
        "track": "B",
        "order_index": 2,
        "lessons": [
            {
                "slug": "nse-bse-nifty-sensex",
                "title": "NSE, BSE, Nifty 50, and Sensex Explained",
                "order_index": 0,
                "estimated_minutes": 8,
                "xp_reward": 15,
                "content_markdown": """## NSE, BSE, Nifty 50, and Sensex Explained

### NSE — National Stock Exchange
- Founded: 1992 | Headquartered: Mumbai
- India's largest exchange by trading volume
- Flagship index: **Nifty 50** (top 50 companies)
- Trades in equities, derivatives (F&O), currency, bonds

### BSE — Bombay Stock Exchange
- Founded: 1875 | World's oldest exchange in Asia
- Flagship index: **Sensex / BSE 30** (top 30 companies)
- Sensex was at 100 in 1979 and crossed 80,000 in 2024 — a 800× return in 45 years

### Nifty 50
- Tracks 50 largest, most liquid companies on NSE
- Rebalanced semi-annually
- Covers ~65% of India's total market cap
- Sectors: IT, Finance, Oil & Gas, FMCG, Auto, Pharma

### Key metrics
- **Market cap** = Share price × Total shares outstanding
- **P/E ratio** = Price ÷ EPS (earnings per share)
- **52-week high/low** — range of the past year's trading prices

### Why indices matter
They give you a single number representing the market's health. When "the market is up 1%", it means the index is up.

💡 **Key Takeaway:** Nifty 50 and Sensex are the health indicators of the Indian economy. Index funds track these benchmarks.
""",
            },
            {
                "slug": "how-stocks-work",
                "title": "How Stocks Work: Ownership, Dividends, and Price",
                "order_index": 1,
                "estimated_minutes": 9,
                "xp_reward": 20,
                "content_markdown": """## How Stocks Work: Ownership, Dividends, and Price

### What is a stock?
Owning a share of Reliance Industries means you own a tiny fraction of the company — its factories, brand, patents, and future profits.

### Face value vs market price
- **Face value** (or par value): The original nominal value of a share (e.g., ₹2 or ₹10). Mostly symbolic.
- **Market price**: What buyers are willing to pay today (supply and demand)

### Dividends
When companies earn profits, they can distribute a portion to shareholders as **dividends**.

- Tata Consultancy Services (TCS) paid ₹24 per share as dividend in 2023–24
- Dividend yield = Annual dividend ÷ Current stock price

### Why stock prices change
Stock prices reflect market expectations of future earnings:
- Positive earnings surprise → price goes up
- Regulatory trouble → price falls
- FII (Foreign Institutional Investor) selling → broad market falls

### Buybacks
A company repurchasing its own shares to reduce the number outstanding — increases the value of remaining shares.

### Bonus shares and stock splits
- **Bonus shares**: Company gives free additional shares to existing shareholders (e.g., 1:1 bonus = you get 1 share for every 1 you hold)
- **Stock split**: Reduces face value, proportionally increases share count (price falls, but value stays same)

### Record date and ex-date
- **Record date**: You must hold shares on this date to be eligible for dividend/bonus
- **Ex-date**: One trading day before record date. Buy before ex-date to be eligible.

💡 **Key Takeaway:** Stocks represent ownership. Long-term stock returns come from earnings growth, dividends, and compounding — not speculation.
""",
            },
            {
                "slug": "ipo-basics",
                "title": "IPOs: How Companies Go Public",
                "order_index": 2,
                "estimated_minutes": 8,
                "xp_reward": 15,
                "content_markdown": """## IPOs: How Companies Go Public

### What is an IPO?
An Initial Public Offering (IPO) is when a private company sells shares to the public for the first time, listing on a stock exchange.

### Why companies do IPOs
- Raise capital for expansion
- Provide exit to early investors (VCs, founders)
- Increase visibility and credibility

### The IPO process in India
1. Company hires investment banks (book running lead managers)
2. Files Draft Red Herring Prospectus (DRHP) with SEBI
3. IPO opens for 3 days — retail investors apply via UPI
4. Allotment (if oversubscribed, by lottery)
5. Listing on NSE/BSE — trading begins

### Key IPO metrics
- **Issue price**: Price at which shares are offered
- **Lot size**: Minimum application quantity (e.g., 14 shares × ₹800 = ₹11,200)
- **Subscription**: How many times the IPO was applied for (30× means massive demand)
- **GMP**: Grey market premium — unofficial pre-listing price signal

### Should you invest in IPOs?
IPOs carry risks:
- Valuation may be expensive
- Lock-up period for promoters may cause selling pressure
- Only 50% of Indian IPOs outperform the Nifty after 1 year

**Better approach**: Wait for 6–12 months post-listing and assess the fundamentals.

💡 **Key Takeaway:** IPOs are exciting but risky. Study the business model and valuation before applying. Don't invest just because it's popular.
""",
            },
            {
                "slug": "market-capitalisation",
                "title": "Market Capitalisation: Large, Mid, and Small Cap",
                "order_index": 3,
                "estimated_minutes": 7,
                "xp_reward": 15,
                "content_markdown": """## Market Capitalisation: Large, Mid, and Small Cap

Market capitalisation (market cap) tells you the total market value of a company.

### Formula
```
Market Cap = Current Share Price × Total Shares Outstanding
```

### Categories (SEBI classification as of 2024)
| Category | Rank by market cap | Examples |
|---|---|---|
| Large-cap | Top 100 companies | Reliance, TCS, HDFC Bank, Infosys |
| Mid-cap | 101st–250th | Voltas, Indian Hotels, Coforge |
| Small-cap | 251st onwards | Hundreds of smaller companies |

### Risk and return
- **Large-cap**: Stable, lower volatility, lower potential return
- **Mid-cap**: Higher growth potential, more volatile than large-cap
- **Small-cap**: Highest growth potential, highest risk, lowest liquidity

### Market cap vs fundamental value
Market cap is what the *market* thinks a company is worth today — not necessarily what it's actually worth. This gap is what creates investment opportunities.

### P/E ratio as a valuation tool
- P/E of 15 → paying ₹15 for every ₹1 of earnings
- Nifty 50 historical P/E average: ~20×
- P/E > 30 may indicate overvaluation; < 15 may indicate undervaluation (context dependent)

💡 **Key Takeaway:** Large-caps for stability, mid-caps for growth, small-caps for high risk/reward. Match your risk appetite.
""",
            },
        ],
    },

    # ── LEVEL 4 — Portfolio & Investing ──────────────────────────────────────
    {
        "title": "Portfolio Building & Asset Allocation",
        "slug": "portfolio-and-asset-allocation",
        "description": "Learn diversification, asset allocation frameworks, goal-based investing, and how to rebalance your portfolio.",
        "level": "intermediate",
        "track": "A",
        "order_index": 3,
        "lessons": [
            {
                "slug": "diversification",
                "title": "Diversification: Don't Put All Eggs in One Basket",
                "order_index": 0,
                "estimated_minutes": 8,
                "xp_reward": 20,
                "content_markdown": """## Diversification: Don't Put All Eggs in One Basket

Diversification means spreading your investments across different assets so that a loss in one doesn't wipe out your entire portfolio.

### Why it works
Different assets often move in opposite directions:
- When equity markets fall, gold tends to rise
- When Indian markets crash, US bonds may hold steady

### Types of diversification
1. **Across asset classes**: Equity, debt, gold, real estate
2. **Within equity**: Large-cap + mid-cap + international
3. **Across sectors**: IT + Finance + Pharma + FMCG
4. **Geographic**: Indian + US/global index funds

### The correlation concept
- Correlation = +1 → assets move together (no diversification benefit)
- Correlation = -1 → assets move opposite (maximum diversification benefit)
- Correlation = 0 → independent movement

### A simple diversified portfolio
- 60% equity (index funds: Nifty 50 + Nifty Next 50)
- 20% debt (short-term bond fund or PPF)
- 10% gold (Sovereign Gold Bond or gold ETF)
- 10% international (US index fund via Mirae/MO AMC)

### Over-diversification
Having 15 mutual funds is not better diversification — most overlap in holdings. 3–5 funds are enough for complete diversification.

💡 **Key Takeaway:** Diversify across asset classes, not just within one. The goal is to reduce risk without sacrificing too much return.
""",
            },
            {
                "slug": "asset-allocation",
                "title": "Asset Allocation: Your Money Blueprint",
                "order_index": 1,
                "estimated_minutes": 9,
                "xp_reward": 20,
                "content_markdown": """## Asset Allocation: Your Money Blueprint

Asset allocation is deciding *what percentage* of your money goes into each asset class based on your goals, timeline, and risk tolerance.

### The age rule of thumb
```
Equity % = 100 − Your Age
```
- At 25: 75% equity, 25% debt
- At 45: 55% equity, 45% debt
- At 60: 40% equity, 60% debt

Modern variants use 110 or 120 instead of 100 due to longer life expectancy.

### Goal-based allocation
| Goal | Timeline | Suggested allocation |
|---|---|---|
| Emergency fund | Immediate | 100% liquid / savings account |
| Vacation in 1 year | 1 year | 100% debt (liquid/short-term) |
| Car purchase in 3 years | 3 years | 60% debt + 40% hybrid |
| Child's education in 10 years | 10 years | 80% equity + 20% debt |
| Retirement in 25 years | 25 years | 90% equity + 10% debt |

### Risk tolerance
Beyond timeline, your *emotional* capacity to watch your portfolio fall 40% matters:
- If you panic-sell during market crashes, stick to conservative allocation
- If you can stay invested through downturns, equity-heavy allocation maximises returns

### Rebalancing
If equity rises and now forms 80% of your portfolio (vs target 70%), sell some equity and buy debt to restore balance. Do this annually.

💡 **Key Takeaway:** Asset allocation determines 90% of your portfolio's long-term return. Get it right for each goal separately.
""",
            },
            {
                "slug": "goal-based-investing",
                "title": "Goal-Based Investing: Investing With Purpose",
                "order_index": 2,
                "estimated_minutes": 9,
                "xp_reward": 20,
                "content_markdown": """## Goal-Based Investing: Investing With Purpose

Random investing leads to random outcomes. Goal-based investing assigns each rupee a specific job.

### Framework
1. **List your goals** — retirement, house down payment, child's education, travel
2. **Assign timelines** — when do you need the money?
3. **Calculate the required corpus** — how much will you need (accounting for inflation)?
4. **Choose the right instruments** — match to the timeline and risk profile
5. **Track progress** — review annually

### Retirement corpus calculation
```
Monthly expense today: ₹50,000
Years to retirement: 25
Inflation: 6%

Monthly expense at retirement = ₹50,000 × (1.06)^25 = ₹2,14,594

Required corpus (4% withdrawal rule) = Annual expense ÷ 0.04
= (₹2,14,594 × 12) ÷ 0.04 = ₹6.44 crore
```

### The 4% withdrawal rule
Withdraw no more than 4% of your corpus annually in retirement — historically, this allows the portfolio to last 30+ years.

### House purchase goal
If you need ₹20 lakh as a down payment in 5 years:
- Required monthly SIP at 10% return = ₹24,869
- Start today — delay costs you more every year

### Separate accounts / funds per goal
Use separate SIPs for each goal so you're never tempted to dip into long-term savings for short-term needs.

💡 **Key Takeaway:** Every investment should have a goal, timeline, and target amount. Purposeful investing removes emotion from financial decisions.
""",
            },
            {
                "slug": "portfolio-rebalancing",
                "title": "Portfolio Rebalancing: Staying on Course",
                "order_index": 3,
                "estimated_minutes": 7,
                "xp_reward": 15,
                "content_markdown": """## Portfolio Rebalancing: Staying on Course

Rebalancing means periodically resetting your portfolio back to its target allocation.

### Why it's needed
Markets constantly shift allocations. If equity grows from 60% to 75% of your portfolio after a bull run, you're taking more risk than intended.

### Example
**Target allocation:** 60% equity / 40% debt  
**After 1 year of bull market:** 75% equity / 25% debt  
**Action:** Sell some equity, buy more debt to restore 60/40.

### Benefits of rebalancing
- Enforces buy-low, sell-high discipline (naturally)
- Controls risk
- Reduces emotional decision-making

### When to rebalance
- **Time-based:** Once a year (simple, effective)
- **Threshold-based:** When any asset class drifts more than 5% from target

### Tax implications in India
- Selling equity funds held > 1 year: 10% LTCG (on gains above ₹1 lakh/year)
- Selling debt funds: Taxed as per income slab (post-2023 budget change)

Use **new SIP contributions** to rebalance where possible to minimize tax events.

💡 **Key Takeaway:** Rebalance annually. It's the one mechanical action that forces you to buy low and sell high — without predicting the market.
""",
            },
        ],
    },

    # ── LEVEL 5 — Trading Fundamentals ───────────────────────────────────────
    {
        "title": "Trading Fundamentals",
        "slug": "trading-fundamentals",
        "description": "Understand candlesticks, technical indicators, risk management, stop losses, and the basics of disciplined trading.",
        "level": "advanced",
        "track": "B",
        "order_index": 4,
        "lessons": [
            {
                "slug": "trading-vs-investing",
                "title": "Trading vs Investing: Key Differences",
                "order_index": 0,
                "estimated_minutes": 7,
                "xp_reward": 20,
                "content_markdown": """## Trading vs Investing: Key Differences

Understanding the distinction prevents costly mistakes.

| Dimension | Investing | Trading |
|---|---|---|
| Timeframe | Years to decades | Minutes to weeks |
| Analysis | Fundamentals (business quality) | Technicals (price patterns) |
| Tax | LTCG (10% above ₹1L) | STCG (15%) or income slab |
| Effort | Low (set-and-forget SIP) | High (continuous monitoring) |
| Success rate | ~70% of long-term investors beat FD | ~90% of retail traders lose money |
| Emotion | Low (less checking required) | High (fear, greed, FOMO) |

### Why most traders lose
- SEBI data: 89% of F&O (Futures & Options) traders lose money
- Average loss: ₹1.1 lakh/year for active F&O traders
- Successful traders treat it as a business with strict risk rules

### Paper trading first
Before risking real money, practice on virtual platforms (Sensibull, TradingView paper mode) for at least 3–6 months.

💡 **Key Takeaway:** Investing beats trading for 90%+ of retail participants. If you want to trade, start with paper trading, strict stop-losses, and small position sizes.
""",
            },
            {
                "slug": "candlestick-basics",
                "title": "Candlestick Charts: Reading Price Action",
                "order_index": 1,
                "estimated_minutes": 10,
                "xp_reward": 25,
                "content_markdown": """## Candlestick Charts: Reading Price Action

Candlestick charts are the universal language of technical analysis.

### Anatomy of a candle
Each candle represents a time period (1 min, 1 day, 1 week):
```
        ─ High (wick/shadow)
        │
   ┌────┤ Close (body — green/white = bullish)
   │    │
   └────┤ Open (body)
        │
        ─ Low (wick/shadow)
```
- **Green/White candle**: Close > Open (buyers won)
- **Red/Black candle**: Close < Open (sellers won)

### Key patterns
**Doji**: Open ≈ Close — indecision. Neither buyers nor sellers dominate. Look for a trend change.

**Hammer**: Small body at top, long lower wick. Buyers rejected lower prices — potential reversal upward.

**Engulfing**: 
- Bullish engulfing: Red candle followed by a larger green candle that engulfs it — buyers taking control
- Bearish engulfing: Opposite

### Important caveats
- Candle patterns are not guarantees — they are probability signals
- Always confirm with volume and context (support/resistance levels)
- A pattern in isolation means little

💡 **Key Takeaway:** Candlesticks show the battle between buyers and sellers. Use patterns to *increase probability*, not predict outcomes.
""",
            },
            {
                "slug": "support-resistance",
                "title": "Support, Resistance, and Stop Loss",
                "order_index": 2,
                "estimated_minutes": 9,
                "xp_reward": 20,
                "content_markdown": """## Support, Resistance, and Stop Loss

These are the foundations of price-based risk management.

### Support
A price level where buying interest is strong enough to prevent further decline. The stock "bounces" off this level.

### Resistance
A price level where selling pressure prevents further rise. The stock "gets rejected" at this level.

### Why they matter
Support and resistance levels are where many traders place their orders. They become self-fulfilling in liquid markets.

### Stop Loss
A pre-defined price at which you exit a trade to limit losses.

**Example:**
- You buy INFY at ₹1,550
- Stop loss at ₹1,500 (3.2% below)
- If price falls to ₹1,500, you automatically sell — limiting loss to 3.2%

**Never trade without a stop loss.**

### Risk-to-reward ratio
Always target a reward that is at least 2× your risk:
- Risk: ₹50 (stop loss distance)
- Target: ₹100+ (reward)
- This way, even if you're right only 40% of the time, you're profitable

### Position sizing
```
Risk amount = Portfolio × Risk % per trade (e.g., 1–2%)
Position size = Risk amount ÷ Stop loss distance
```

If portfolio = ₹1,00,000 and you risk 2% per trade (₹2,000), with stop loss ₹50 below entry:  
Position size = ₹2,000 ÷ ₹50 = **40 shares**

💡 **Key Takeaway:** Stop loss is not optional — it's the single most important rule in trading. Without it, one bad trade can wipe out months of gains.
""",
            },
        ],
    },

    # ── LEVEL 6 — Global Markets ──────────────────────────────────────────────
    {
        "title": "Global Markets and International Investing",
        "slug": "global-markets",
        "description": "US markets, global indices, ETFs, foreign investing from India, currencies, and global economic indicators.",
        "level": "advanced",
        "track": "A",
        "order_index": 5,
        "lessons": [
            {
                "slug": "us-markets-overview",
                "title": "US Stock Markets: NYSE, NASDAQ, S&P 500",
                "order_index": 0,
                "estimated_minutes": 8,
                "xp_reward": 20,
                "content_markdown": """## US Stock Markets: NYSE, NASDAQ, S&P 500

The US stock market is the world's largest — with a market cap of ~$45 trillion (2024).

### Key exchanges
- **NYSE** (New York Stock Exchange): Home to traditional large companies (Berkshire, JPMorgan, Walmart)
- **NASDAQ**: Technology-heavy exchange (Apple, Microsoft, Google, Amazon, Meta)

### Key indices
| Index | Companies | Focus |
|---|---|---|
| S&P 500 | Top 500 US companies | Broad US market |
| Dow Jones | 30 blue-chip companies | Industrial leaders |
| NASDAQ-100 | Top 100 NASDAQ firms | Technology |
| Russell 2000 | Small-cap US stocks | Growth/small companies |

### Why Indians should care
US market returns have been exceptional: S&P 500 has compounded at ~10% annually for 50 years. International diversification protects against India-specific risks.

### How Indians can invest in US markets
1. **Mutual funds with US exposure** — Mirae US Equity, MO S&P 500 ETF (no LRS needed)
2. **Direct investing via LRS** — Up to $250,000/year under Liberalised Remittance Scheme

### Currency risk
When you invest in US stocks, you're also taking USD/INR currency exposure.
- If INR weakens (common historically), your returns in INR are amplified
- If INR strengthens, returns are reduced

💡 **Key Takeaway:** Adding a 10–15% US index fund allocation to an Indian portfolio provides diversification and has historically enhanced risk-adjusted returns.
""",
            },
            {
                "slug": "global-etfs",
                "title": "Global ETFs: Invest the World in One Click",
                "order_index": 1,
                "estimated_minutes": 8,
                "xp_reward": 20,
                "content_markdown": """## Global ETFs: Invest the World in One Click

An ETF (Exchange-Traded Fund) is a basket of securities that trades on an exchange like a stock.

### Why ETFs are powerful
- **Diversification**: One S&P 500 ETF gives you exposure to 500 companies
- **Low cost**: Expense ratios of 0.03–0.5% (vs 1.5–2.5% for active funds)
- **Liquidity**: Buy and sell any time during market hours
- **Transparency**: Holdings published daily

### Global ETF options for Indian investors
| Fund | Index tracked | Where to buy |
|---|---|---|
| Mirae Asset NYSE FANG+ ETF | FANG+ (Meta, Apple, etc.) | NSE India |
| Motilal Oswal S&P 500 Index Fund | S&P 500 | AMC website |
| Mirae Asset S&P 500 Top 50 ETF | Top 50 S&P 500 | NSE India |
| ICICI Pru NASDAQ 100 FOF | NASDAQ 100 | AMC website |

### Commodity ETFs
- **Gold ETF**: Tracks gold price; backed by physical gold. Better than buying jewellery (no making charges, full liquidity)
- **Sovereign Gold Bond (SGB)**: Government-backed, earns 2.5% p.a. + price appreciation. Best gold investment in India.

### Currency ETFs / Forex
India doesn't have direct currency ETFs for retail investors. Currency derivatives exist on NSE but are complex.

💡 **Key Takeaway:** ETFs give you the entire world's markets at a fraction of the cost of active funds. Use them as the core of a long-term portfolio.
""",
            },
            {
                "slug": "global-economic-indicators",
                "title": "Global Economic Indicators Every Investor Should Know",
                "order_index": 2,
                "estimated_minutes": 9,
                "xp_reward": 20,
                "content_markdown": """## Global Economic Indicators Every Investor Should Know

Understanding macro indicators helps you make better investment decisions.

### India-specific indicators

**GDP Growth Rate**
- India's GDP growing at 6–8% annually — reflects economic expansion
- Higher GDP → corporate earnings grow → stocks rise (generally)

**CPI Inflation**
- Consumer Price Index measures retail inflation
- RBI targets 4% (±2%). High inflation → RBI raises rates → markets fall

**RBI Repo Rate**
- The rate at which RBI lends to banks
- When repo rate rises → loan rates rise → EMIs rise → consumption falls → economy cools
- Equity markets typically fall when rates rise sharply

**India VIX**
- Volatility index for India (based on Nifty options)
- VIX > 20 = high fear in markets; < 15 = calm
- High VIX = good time to buy (markets usually overreact)

### US indicators (affect Indian markets too)

**US Fed Funds Rate**
- When US rates rise → global investors move money to US bonds → emerging markets (like India) see outflows → Nifty falls

**US CPI**
- US inflation drives Fed rate decisions, which ripple globally

**DXY (US Dollar Index)**
- When USD strengthens → emerging market currencies (INR) weaken → FIIs sell Indian stocks

### Practical use
You don't need to predict these — but understanding them helps you:
- Not panic-sell when FII data is negative
- See corrections as opportunities
- Avoid buying at market peaks driven purely by FOMO

💡 **Key Takeaway:** Macro indicators explain *why* markets move. You don't need to predict them — but understanding them prevents panic-driven decisions.
""",
            },
        ],
    },
]


# ─────────────────────────────────────────────────────────────────────────────
# Badges definition
# ─────────────────────────────────────────────────────────────────────────────

BADGES: list[dict] = [
    {"name": "First Step", "description": "Complete your first lesson", "icon_url": "🎯", "criteria_type": "lessons_completed", "criteria_value": 1},
    {"name": "Getting Started", "description": "Complete 5 lessons", "icon_url": "🌱", "criteria_type": "lessons_completed", "criteria_value": 5},
    {"name": "Learning Streak", "description": "Maintain a 3-day streak", "icon_url": "🔥", "criteria_type": "streak_days", "criteria_value": 3},
    {"name": "Week Warrior", "description": "Maintain a 7-day streak", "icon_url": "⚡", "criteria_type": "streak_days", "criteria_value": 7},
    {"name": "Finance Curious", "description": "Complete 10 lessons", "icon_url": "📚", "criteria_type": "lessons_completed", "criteria_value": 10},
    {"name": "Module Master", "description": "Complete your first full module", "icon_url": "🏆", "criteria_type": "module_completed", "criteria_value": 1},
    {"name": "XP Collector", "description": "Earn 100 XP", "icon_url": "⭐", "criteria_type": "xp_total", "criteria_value": 100},
    {"name": "Investor in Training", "description": "Earn 300 XP", "icon_url": "💡", "criteria_type": "xp_total", "criteria_value": 300},
    {"name": "Finance Enthusiast", "description": "Complete 20 lessons", "icon_url": "🎓", "criteria_type": "lessons_completed", "criteria_value": 20},
    {"name": "Monthly Habit", "description": "Maintain a 30-day streak", "icon_url": "📅", "criteria_type": "streak_days", "criteria_value": 30},
    {"name": "Knowledge Seeker", "description": "Earn 600 XP", "icon_url": "🔭", "criteria_type": "xp_total", "criteria_value": 600},
    {"name": "Market Graduate", "description": "Complete 3 modules", "icon_url": "🎖️", "criteria_type": "module_completed", "criteria_value": 3},
    {"name": "Finance Expert", "description": "Earn 1000 XP", "icon_url": "👑", "criteria_type": "xp_total", "criteria_value": 1000},
]


# ─────────────────────────────────────────────────────────────────────────────
# Seeding logic
# ─────────────────────────────────────────────────────────────────────────────

async def seed(db: AsyncSession) -> None:
    log.info("Starting curriculum seed...")

    # ── Badges ─────────────────────────────────────────────────────────────────
    for badge_data in BADGES:
        existing = await db.scalar(select(Badge).where(Badge.name == badge_data["name"]))
        if not existing:
            db.add(Badge(**badge_data))
            log.info("  Badge: %s", badge_data["name"])
    await db.flush()

    # ── Modules + Lessons + Quizzes ────────────────────────────────────────────
    for mod_data in MODULES:
        lessons_data = mod_data.pop("lessons")

        existing_mod = await db.scalar(select(Module).where(Module.slug == mod_data["slug"]))
        if existing_mod:
            log.info("Module '%s' already exists — skipping", mod_data["slug"])
            mod = existing_mod
        else:
            mod = Module(**mod_data, is_published=True)
            db.add(mod)
            await db.flush()
            log.info("Module: %s", mod.title)

        for lesson_data in lessons_data:
            quiz_data = lesson_data.pop("quiz", None)

            existing_lesson = await db.scalar(
                select(Lesson).where(Lesson.module_id == mod.id, Lesson.slug == lesson_data["slug"])
            )
            if existing_lesson:
                lesson = existing_lesson
            else:
                lesson = Lesson(**lesson_data, module_id=mod.id, is_published=True)
                db.add(lesson)
                await db.flush()
                log.info("  Lesson: %s", lesson.title)

            if quiz_data:
                existing_quiz = await db.scalar(select(Quiz).where(Quiz.lesson_id == lesson.id))
                if not existing_quiz:
                    quiz = Quiz(
                        lesson_id=lesson.id,
                        title=quiz_data["title"],
                        passing_score=quiz_data.get("passing_score", 70),
                        max_attempts=quiz_data.get("max_attempts", 3),
                    )
                    db.add(quiz)
                    await db.flush()
                    for i, q_data in enumerate(quiz_data["questions"]):
                        db.add(Question(quiz_id=quiz.id, order_index=i, **q_data))
                    await db.flush()
                    log.info("    Quiz: %s (%d questions)", quiz.title, len(quiz_data["questions"]))

    await db.commit()
    log.info("Seed complete. ✓")


async def main() -> None:
    async with AsyncSessionLocal() as db:
        await seed(db)


if __name__ == "__main__":
    asyncio.run(main())
