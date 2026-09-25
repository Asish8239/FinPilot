from __future__ import annotations

from app.schemas.knowledge import KnowledgeTopic


KNOWLEDGE_TOPICS: list[KnowledgeTopic] = [
    # ============================================================
    # FOUNDATIONS
    # ============================================================
    KnowledgeTopic(
        slug="money",
        name="Money",
        category="Foundations",
        region="Global",
        difficulty="beginner",
        description="Understand what money is, how it functions, and why purchasing power changes.",
        related_topics=["inflation", "interest-rates", "central-banks"],
    ),
    KnowledgeTopic(
        slug="inflation",
        name="Inflation",
        category="Macro Economics",
        region="Global",
        difficulty="beginner",
        description="Understand rising prices, purchasing power, inflation measurement, and its market impact.",
        related_topics=["interest-rates", "central-banks", "bonds", "gold"],
    ),
    KnowledgeTopic(
        slug="interest-rates",
        name="Interest Rates",
        category="Macro Economics",
        region="Global",
        difficulty="beginner",
        description="Learn how interest rates affect borrowing, saving, bonds, currencies, stocks, and economic activity.",
        related_topics=["central-banks", "bonds", "inflation", "forex"],
    ),
    KnowledgeTopic(
        slug="compound-interest",
        name="Compound Interest",
        category="Foundations",
        region="Global",
        difficulty="beginner",
        description="Learn how returns compound over time and why time is a major driver of wealth creation.",
        related_topics=["sip", "investing", "time-value-of-money"],
    ),
    KnowledgeTopic(
        slug="time-value-of-money",
        name="Time Value of Money",
        category="Foundations",
        region="Global",
        difficulty="intermediate",
        description="Understand why money available today has a different economic value from money received later.",
        related_topics=["compound-interest", "discounted-cash-flow", "bonds"],
    ),

    # ============================================================
    # INDIA
    # ============================================================
    KnowledgeTopic(
        slug="indian-stock-market",
        name="Indian Stock Market",
        category="Equity Markets",
        region="India",
        difficulty="beginner",
        description="Understand the structure and major participants of India's equity markets.",
        related_topics=["nse", "bse", "nifty-50", "sensex"],
    ),
    KnowledgeTopic(
        slug="nse",
        name="NSE",
        category="Equity Markets",
        region="India",
        difficulty="beginner",
        description="Learn how India's National Stock Exchange functions and why it matters.",
        related_topics=["nifty-50", "indian-stock-market"],
    ),
    KnowledgeTopic(
        slug="bse",
        name="BSE",
        category="Equity Markets",
        region="India",
        difficulty="beginner",
        description="Learn about the Bombay Stock Exchange and its role in Indian capital markets.",
        related_topics=["sensex", "indian-stock-market"],
    ),
    KnowledgeTopic(
        slug="nifty-50",
        name="Nifty 50",
        category="Indices",
        region="India",
        difficulty="beginner",
        description="Understand India's major large-cap equity index, its construction, and its uses.",
        related_topics=["nse", "index-funds", "etfs"],
    ),
    KnowledgeTopic(
        slug="sensex",
        name="Sensex",
        category="Indices",
        region="India",
        difficulty="beginner",
        description="Understand the BSE Sensex and what it represents about India's equity market.",
        related_topics=["bse", "indian-stock-market"],
    ),
    KnowledgeTopic(
        slug="mutual-funds-india",
        name="Mutual Funds in India",
        category="Investing",
        region="India",
        difficulty="beginner",
        description="Understand Indian mutual funds, fund categories, NAV, costs, and risks.",
        related_topics=["sip", "index-funds", "asset-allocation"],
    ),
    KnowledgeTopic(
        slug="sip",
        name="Systematic Investment Plans",
        category="Investing",
        region="India",
        difficulty="beginner",
        description="Learn how recurring investments work and how rupee-cost averaging interacts with market volatility.",
        related_topics=["mutual-funds-india", "compound-interest", "index-funds"],
    ),
    KnowledgeTopic(
        slug="sebi",
        name="SEBI",
        category="Financial Regulation",
        region="India",
        difficulty="intermediate",
        description="Understand India's securities regulator and its role in protecting and regulating markets.",
        related_topics=["mutual-funds-india", "indian-stock-market"],
    ),
    KnowledgeTopic(
        slug="rbi",
        name="Reserve Bank of India",
        category="Central Banks",
        region="India",
        difficulty="intermediate",
        description="Understand RBI monetary policy, inflation management, liquidity, and financial stability.",
        related_topics=["interest-rates", "inflation", "indian-bond-market"],
    ),
    KnowledgeTopic(
        slug="indian-bond-market",
        name="Indian Bond Market",
        category="Fixed Income",
        region="India",
        difficulty="intermediate",
        description="Learn about government and corporate bonds in India's fixed-income market.",
        related_topics=["bonds", "rbi", "interest-rates"],
    ),

    # ============================================================
    # UNITED STATES
    # ============================================================
    KnowledgeTopic(
        slug="us-stock-market",
        name="US Stock Market",
        category="Equity Markets",
        region="United States",
        difficulty="beginner",
        description="Understand the structure and major benchmarks of US equity markets.",
        related_topics=["sp-500", "nasdaq", "dow-jones"],
    ),
    KnowledgeTopic(
        slug="sp-500",
        name="S&P 500",
        category="Indices",
        region="United States",
        difficulty="beginner",
        description="Learn how the S&P 500 represents large US companies and why global investors track it.",
        related_topics=["us-stock-market", "index-funds", "etfs"],
    ),
    KnowledgeTopic(
        slug="nasdaq",
        name="NASDAQ",
        category="Indices",
        region="United States",
        difficulty="beginner",
        description="Understand NASDAQ and its relationship with technology-oriented equities.",
        related_topics=["us-stock-market", "technology-stocks"],
    ),
    KnowledgeTopic(
        slug="federal-reserve",
        name="Federal Reserve",
        category="Central Banks",
        region="United States",
        difficulty="intermediate",
        description="Understand the Federal Reserve, monetary policy, rates, liquidity, and global market influence.",
        related_topics=["interest-rates", "inflation", "us-treasuries", "usd"],
    ),
    KnowledgeTopic(
        slug="us-treasuries",
        name="US Treasuries",
        category="Fixed Income",
        region="United States",
        difficulty="intermediate",
        description="Learn how US government bonds work and why Treasury yields influence global asset prices.",
        related_topics=["bonds", "federal-reserve", "usd"],
    ),
    KnowledgeTopic(
        slug="usd",
        name="US Dollar",
        category="Currencies",
        region="Global",
        difficulty="intermediate",
        description="Understand the dollar's role as a major reserve currency and its influence on global capital flows.",
        related_topics=["forex", "federal-reserve", "emerging-markets"],
    ),

    # ============================================================
    # EUROPE
    # ============================================================
    KnowledgeTopic(
        slug="european-markets",
        name="European Markets",
        category="Global Markets",
        region="Europe",
        difficulty="intermediate",
        description="Understand major European equity markets, monetary policy, and cross-border capital flows.",
        related_topics=["ecb", "euro", "global-markets"],
    ),
    KnowledgeTopic(
        slug="ecb",
        name="European Central Bank",
        category="Central Banks",
        region="Europe",
        difficulty="intermediate",
        description="Learn how ECB monetary policy affects Europe and global financial markets.",
        related_topics=["interest-rates", "inflation", "euro"],
    ),
    KnowledgeTopic(
        slug="euro",
        name="Euro",
        category="Currencies",
        region="Europe",
        difficulty="intermediate",
        description="Understand the euro's role in European economies and foreign exchange markets.",
        related_topics=["forex", "ecb"],
    ),

    # ============================================================
    # ASIA
    # ============================================================
    KnowledgeTopic(
        slug="china-markets",
        name="China Markets",
        category="Global Markets",
        region="China",
        difficulty="intermediate",
        description="Understand China's equity, bond, currency, property, and policy-driven market structure.",
        related_topics=["pboc", "emerging-markets", "global-markets"],
    ),
    KnowledgeTopic(
        slug="pboc",
        name="People's Bank of China",
        category="Central Banks",
        region="China",
        difficulty="advanced",
        description="Understand Chinese monetary policy, liquidity management, and its market implications.",
        related_topics=["china-markets", "interest-rates", "yuan"],
    ),
    KnowledgeTopic(
        slug="japan-markets",
        name="Japan Markets",
        category="Global Markets",
        region="Japan",
        difficulty="intermediate",
        description="Explore Japanese equities, bonds, monetary policy, currency dynamics, and global spillovers.",
        related_topics=["boj", "yen", "global-markets"],
    ),
    KnowledgeTopic(
        slug="boj",
        name="Bank of Japan",
        category="Central Banks",
        region="Japan",
        difficulty="advanced",
        description="Understand Japanese monetary policy and its unusual influence on global capital markets.",
        related_topics=["japan-markets", "yen", "interest-rates"],
    ),

    # ============================================================
    # GLOBAL MARKETS
    # ============================================================
    KnowledgeTopic(
        slug="global-markets",
        name="Global Financial Markets",
        category="Global Markets",
        region="Global",
        difficulty="beginner",
        description="Understand how equity, bond, currency, commodity, and derivative markets interact globally.",
        related_topics=["asset-allocation", "forex", "commodities", "bonds"],
    ),
    KnowledgeTopic(
        slug="emerging-markets",
        name="Emerging Markets",
        category="Global Markets",
        region="Global",
        difficulty="intermediate",
        description="Understand opportunities and risks in developing financial markets.",
        related_topics=["usd", "capital-flows", "global-markets"],
    ),
    KnowledgeTopic(
        slug="capital-flows",
        name="Global Capital Flows",
        category="Global Markets",
        region="Global",
        difficulty="advanced",
        description="Understand how international money moves between economies and asset classes.",
        related_topics=["usd", "interest-rates", "emerging-markets"],
    ),

    # ============================================================
    # ASSET CLASSES
    # ============================================================
    KnowledgeTopic(
        slug="stocks",
        name="Stocks",
        category="Asset Classes",
        region="Global",
        difficulty="beginner",
        description="Understand equity ownership, share prices, returns, risks, and market capitalization.",
        related_topics=["fundamental-analysis", "dividends", "etfs"],
    ),
    KnowledgeTopic(
        slug="bonds",
        name="Bonds",
        category="Asset Classes",
        region="Global",
        difficulty="beginner",
        description="Understand fixed-income securities, coupons, yields, duration, and credit risk.",
        related_topics=["interest-rates", "yield-curve", "credit-risk"],
    ),
    KnowledgeTopic(
        slug="etfs",
        name="Exchange-Traded Funds",
        category="Investing",
        region="Global",
        difficulty="beginner",
        description="Understand ETFs, index tracking, costs, liquidity, and portfolio applications.",
        related_topics=["index-funds", "stocks", "asset-allocation"],
    ),
    KnowledgeTopic(
        slug="index-funds",
        name="Index Funds",
        category="Investing",
        region="Global",
        difficulty="beginner",
        description="Learn how passive funds track market indices and how tracking error and costs matter.",
        related_topics=["etfs", "nifty-50", "sp-500"],
    ),
    KnowledgeTopic(
        slug="commodities",
        name="Commodities",
        category="Asset Classes",
        region="Global",
        difficulty="beginner",
        description="Understand commodity markets including energy, metals, and agricultural products.",
        related_topics=["gold", "oil", "inflation"],
    ),
    KnowledgeTopic(
        slug="gold",
        name="Gold",
        category="Commodities",
        region="Global",
        difficulty="beginner",
        description="Understand gold as an asset, its relationship with inflation, rates, currencies, and risk sentiment.",
        related_topics=["commodities", "inflation", "usd"],
    ),
    KnowledgeTopic(
        slug="oil",
        name="Crude Oil",
        category="Commodities",
        region="Global",
        difficulty="intermediate",
        description="Understand oil supply, demand, geopolitics, pricing, and macroeconomic effects.",
        related_topics=["commodities", "inflation", "geopolitics"],
    ),
    KnowledgeTopic(
        slug="forex",
        name="Foreign Exchange",
        category="Currencies",
        region="Global",
        difficulty="intermediate",
        description="Understand currency pairs, exchange rates, interest-rate differentials, and FX markets.",
        related_topics=["usd", "interest-rates", "capital-flows"],
    ),
    KnowledgeTopic(
        slug="crypto",
        name="Crypto Assets",
        category="Digital Assets",
        region="Global",
        difficulty="beginner",
        description="Understand blockchain-based assets, market structure, volatility, custody, and major risks.",
        related_topics=["bitcoin", "stablecoins", "digital-assets"],
    ),

    # ============================================================
    # ANALYSIS
    # ============================================================
    KnowledgeTopic(
        slug="fundamental-analysis",
        name="Fundamental Analysis",
        category="Analysis",
        region="Global",
        difficulty="intermediate",
        description="Learn how investors evaluate businesses using financial statements, earnings, cash flow, and valuation.",
        related_topics=["financial-statements", "valuation", "pe-ratio"],
    ),
    KnowledgeTopic(
        slug="technical-analysis",
        name="Technical Analysis",
        category="Analysis",
        region="Global",
        difficulty="intermediate",
        description="Understand price, volume, trends, support, resistance, and technical indicators.",
        related_topics=["market-structure", "momentum", "volatility"],
    ),
    KnowledgeTopic(
        slug="quantitative-finance",
        name="Quantitative Finance",
        category="Quant Finance",
        region="Global",
        difficulty="advanced",
        description="Explore mathematical, statistical, computational, and data-driven approaches to finance.",
        related_topics=["algorithmic-trading", "factor-investing", "risk-models"],
    ),
    KnowledgeTopic(
        slug="algorithmic-trading",
        name="Algorithmic Trading",
        category="Quant Finance",
        region="Global",
        difficulty="advanced",
        description="Understand how trading strategies can be formalized, tested, executed, and monitored computationally.",
        related_topics=["quantitative-finance", "backtesting", "market-microstructure"],
    ),
    KnowledgeTopic(
        slug="factor-investing",
        name="Factor Investing",
        category="Quant Finance",
        region="Global",
        difficulty="advanced",
        description="Understand systematic exposure to factors such as value, momentum, quality, and size.",
        related_topics=["quantitative-finance", "portfolio-optimization"],
    ),
    KnowledgeTopic(
        slug="backtesting",
        name="Backtesting",
        category="Quant Finance",
        region="Global",
        difficulty="advanced",
        description="Learn how historical simulation is used to evaluate systematic strategies and avoid common research errors.",
        related_topics=["algorithmic-trading", "overfitting", "walk-forward-analysis"],
    ),

    # ============================================================
    # PORTFOLIO & RISK
    # ============================================================
    KnowledgeTopic(
        slug="portfolio-diversification",
        name="Portfolio Diversification",
        category="Portfolio Management",
        region="Global",
        difficulty="beginner",
        description="Understand why combining imperfectly correlated assets can change portfolio risk.",
        related_topics=["asset-allocation", "correlation", "risk-management"],
    ),
    KnowledgeTopic(
        slug="asset-allocation",
        name="Asset Allocation",
        category="Portfolio Management",
        region="Global",
        difficulty="intermediate",
        description="Learn how portfolios allocate capital across equities, fixed income, cash, commodities, and other assets.",
        related_topics=["diversification", "risk-management", "portfolio-optimization"],
    ),
    KnowledgeTopic(
        slug="risk-management",
        name="Risk Management",
        category="Risk",
        region="Global",
        difficulty="intermediate",
        description="Understand volatility, drawdowns, concentration, liquidity, and other dimensions of investment risk.",
        related_topics=["portfolio-diversification", "position-sizing", "var"],
    ),
    KnowledgeTopic(
        slug="portfolio-optimization",
        name="Portfolio Optimization",
        category="Quant Finance",
        region="Global",
        difficulty="advanced",
        description="Explore mathematical approaches to balancing expected return, risk, constraints, and diversification.",
        related_topics=["asset-allocation", "quantitative-finance", "factor-investing"],
    ),

    # ============================================================
    # MACRO / CYCLES
    # ============================================================
    KnowledgeTopic(
        slug="recession",
        name="Recession",
        category="Macro Economics",
        region="Global",
        difficulty="beginner",
        description="Understand recessions, economic contractions, indicators, and potential market effects.",
        related_topics=["business-cycle", "inflation", "interest-rates"],
    ),
    KnowledgeTopic(
        slug="business-cycle",
        name="Business Cycle",
        category="Macro Economics",
        region="Global",
        difficulty="intermediate",
        description="Understand expansion, peak, contraction, and recovery phases of economic activity.",
        related_topics=["recession", "inflation", "interest-rates"],
    ),
    KnowledgeTopic(
        slug="yield-curve",
        name="Yield Curve",
        category="Fixed Income",
        region="Global",
        difficulty="intermediate",
        description="Understand relationships between bond maturities, yields, expectations, and economic signals.",
        related_topics=["bonds", "interest-rates", "recession"],
    ),
    KnowledgeTopic(
        slug="market-cycles",
        name="Market Cycles",
        category="Markets",
        region="Global",
        difficulty="intermediate",
        description="Explore recurring patterns in investor sentiment, valuations, liquidity, and market regimes.",
        related_topics=["business-cycle", "volatility", "behavioral-finance"],
    ),

    # ============================================================
    # BEHAVIOR
    # ============================================================
    KnowledgeTopic(
        slug="behavioral-finance",
        name="Behavioral Finance",
        category="Behavioral Finance",
        region="Global",
        difficulty="intermediate",
        description="Understand how psychology and cognitive biases influence financial decisions.",
        related_topics=["loss-aversion", "herd-behavior", "market-cycles"],
    ),
    KnowledgeTopic(
        slug="loss-aversion",
        name="Loss Aversion",
        category="Behavioral Finance",
        region="Global",
        difficulty="beginner",
        description="Understand why losses can psychologically feel more significant than equivalent gains.",
        related_topics=["behavioral-finance", "risk-management"],
    ),
    KnowledgeTopic(
        slug="herd-behavior",
        name="Herd Behavior",
        category="Behavioral Finance",
        region="Global",
        difficulty="intermediate",
        description="Learn how investors can influence one another and create collective market behavior.",
        related_topics=["behavioral-finance", "market-cycles"],
    ),

    # ============================================================
    # ESG / SUSTAINABILITY
    # ============================================================
    KnowledgeTopic(
        slug="esg",
        name="ESG Investing",
        category="Sustainability",
        region="Global",
        difficulty="intermediate",
        description="Understand environmental, social, and governance considerations in investment analysis.",
        related_topics=["climate-finance", "sustainable-investing", "esg-risk"],
    ),
    KnowledgeTopic(
        slug="sustainable-investing",
        name="Sustainable Investing",
        category="Sustainability",
        region="Global",
        difficulty="intermediate",
        description="Explore investment approaches that incorporate sustainability objectives and financial considerations.",
        related_topics=["esg", "climate-finance"],
    ),
    KnowledgeTopic(
        slug="climate-finance",
        name="Climate Finance",
        category="Sustainability",
        region="Global",
        difficulty="advanced",
        description="Understand financial risks, opportunities, capital allocation, and policy related to climate transition.",
        related_topics=["esg", "sustainable-investing", "carbon-markets"],
    ),

    # ============================================================
    # FINANCIAL INDEPENDENCE
    # ============================================================
    KnowledgeTopic(
        slug="financial-independence",
        name="Financial Independence",
        category="Personal Finance",
        region="Global",
        difficulty="beginner",
        description="Understand the principles behind building enough financial resources to gain greater control over work and lifestyle.",
        related_topics=["savings-rate", "investing", "financial-goals"],
    ),
    KnowledgeTopic(
        slug="savings-rate",
        name="Savings Rate",
        category="Personal Finance",
        region="Global",
        difficulty="beginner",
        description="Understand how the percentage of income saved influences long-term financial progress.",
        related_topics=["financial-independence", "budgeting", "financial-goals"],
    ),
    KnowledgeTopic(
        slug="financial-goals",
        name="Financial Goals",
        category="Personal Finance",
        region="Global",
        difficulty="beginner",
        description="Learn how to convert financial intentions into measurable targets and timelines.",
        related_topics=["financial-independence", "savings-rate", "investing"],
    ),
]


_TOPIC_MAP = {topic.slug: topic for topic in KNOWLEDGE_TOPICS}


def list_topics(
    search: str | None = None,
    category: str | None = None,
    region: str | None = None,
    difficulty: str | None = None,
) -> list[KnowledgeTopic]:
    topics = KNOWLEDGE_TOPICS

    if search:
        needle = search.strip().lower()
        topics = [
            topic
            for topic in topics
            if needle in topic.name.lower()
            or needle in topic.description.lower()
            or needle in topic.category.lower()
            or needle in topic.region.lower()
        ]

    if category:
        topics = [
            topic
            for topic in topics
            if topic.category.lower() == category.lower()
        ]

    if region:
        topics = [
            topic
            for topic in topics
            if topic.region.lower() == region.lower()
        ]

    if difficulty:
        topics = [
            topic
            for topic in topics
            if topic.difficulty.lower() == difficulty.lower()
        ]

    return topics


def get_topic(slug: str) -> KnowledgeTopic | None:
    return _TOPIC_MAP.get(slug)


def get_related_topics(topic: KnowledgeTopic) -> list[KnowledgeTopic]:
    return [
        _TOPIC_MAP[slug]
        for slug in topic.related_topics
        if slug in _TOPIC_MAP
    ]
