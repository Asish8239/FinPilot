"""
Market Data Service — provider abstraction for stock/index price data.

Architecture:
  MarketDataProvider (abstract base)
      ↓
  DemoMarketDataProvider  ← used for development (clearly labelled SIMULATED data)
      ↓
  AlphaVantageProvider    ← real market data via Alpha Vantage API
      ↓  (fallback)
  DemoMarketDataProvider  ← graceful degradation when API unavailable

IMPORTANT:
  DemoMarketDataProvider returns SIMULATED / FICTIONAL data.
  It is labelled as such in every response payload.
  It must NEVER be presented to users as live or real market data.
  AlphaVantageProvider requires ALPHA_VANTAGE_API_KEY in config.

═══════════════════════════════════════════════════════════════════════════════
ALPHA VANTAGE INTEGRATION
═══════════════════════════════════════════════════════════════════════════════

Configuration:
  Set the following environment variables to enable Alpha Vantage:
  - ALPHA_VANTAGE_API_KEY: Your API key from https://www.alphavantage.co
  - ALPHA_VANTAGE_BASE_URL: (optional) API endpoint (default: https://www.alphavantage.co/query)
  - ALPHA_VANTAGE_TIMEOUT: (optional) Request timeout in seconds (default: 30)

Free Tier Limits:
  - 5 API calls per minute
  - 500 API calls per day
  - 1-year historical data for daily/weekly/monthly

Supported Data:
  Global Stocks (US, EU, Asia):
  - Real-time quotes (bid/ask, day high/low)
  - Historical daily OHLCV data
  - Company overview (name, sector, market cap)
  - Symbol search
  
  Format: US symbols (e.g., "AAPL", "MSFT")
          International (e.g., "SAP:FRA" for Dax, "0001.HK" for Hong Kong)

API Endpoints Used:
  1. GLOBAL_QUOTE: Real-time price data
  2. TIME_SERIES_DAILY: Historical daily OHLCV (20 years available with outputsize=full)
  3. SYMBOL_SEARCH: Find symbols by name/ticker
  4. OVERVIEW: Company information (market cap, sector, etc.)

Error Handling & Fallback Strategy:
  
  All error scenarios gracefully fall back to DemoMarketDataProvider:
  
  1. Missing API Key
     - Logs warning on initialization
     - All requests fall back to demo data
     - No network calls attempted
  
  2. Rate Limit (Free Tier)
     - API returns "Note" field in response
     - Logged as warning
     - Falls back to demo data
     - Retry-After not available in free tier
  
  3. Invalid Symbol
     - API returns empty "Global Quote"
     - Logged as debug message
     - Falls back to demo data
  
  4. Network Timeout
     - Caught as httpx.TimeoutException
     - Logged as error (includes symbol)
     - Falls back to demo data
  
  5. HTTP Errors
     - Caught as httpx.HTTPError
     - Logged as error
     - Falls back to demo data
  
  6. API Errors
     - Detected by "Error Message" in response
     - Logged as warning (includes error message)
     - Falls back to demo data
  
  7. Parsing Errors
     - Caught during JSON parsing or field extraction
     - Logged as error
     - Falls back to demo data

Response Format:
  QuoteResult fields populated:
  - symbol, name, exchange: From API
  - current_price: Current trading price (5. price)
  - previous_close: Previous day close (8. previous close)
  - change: Absolute change (9. change)
  - change_pct: Percentage change (10. change percent)
  - day_high: Day's high (03. high)
  - day_low: Day's low (04. low)
  - volume: Trading volume (06. volume)
  - market_cap: From OVERVIEW endpoint
  - currency: Always "USD" for Alpha Vantage
  - data_source: "AlphaVantage"
  - is_simulated: False (real data)
  - disclaimer: Empty string (no disclaimer for real data)
  - as_of: Timestamp of API response

Best Practices:
  1. Cache results to minimize API calls
  2. Implement exponential backoff for retries
  3. Monitor rate limit usage (check API documentation)
  4. Use bulk_quotes sparingly (5 calls/min limit)
  5. Historical data requests count as single call regardless of date range
  6. Consider upgrading to paid tier for production (50+ calls/min, unlimited calls/day)

References:
  - Alpha Vantage Documentation: https://www.alphavantage.co/documentation/
  - Get API Key: https://www.alphavantage.co/
  - Rate Limit Tier Comparison: https://www.alphavantage.co/premium/
"""
from __future__ import annotations

import logging
import random
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from functools import lru_cache
from typing import Dict, Tuple

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class QuoteResult:
    symbol: str
    name: str
    exchange: str
    # Price fields — None when data is unavailable
    current_price: float | None
    previous_close: float | None
    change: float | None         # absolute change
    change_pct: float | None     # percentage change
    market_cap: float | None
    day_high: float | None
    day_low: float | None
    volume: int | None
    # Metadata
    currency: str = "INR"
    data_source: str = "DEMO"
    is_simulated: bool = True
    disclaimer: str = (
        "⚠️ SIMULATED DATA — Not real market data. "
        "Do not use for investment decisions."
    )
    as_of: datetime = field(default_factory=datetime.utcnow)


@dataclass
class HistoricalPoint:
    date: date
    open: float
    high: float
    low: float
    close: float
    volume: int


@dataclass
class HistoricalResult:
    symbol: str
    points: list[HistoricalPoint]
    is_simulated: bool = True
    disclaimer: str = (
        "⚠️ SIMULATED DATA — Not real market data. "
        "Do not use for investment decisions."
    )


class MarketDataProvider(ABC):
    """Abstract interface — swap implementations without changing the API."""

    @abstractmethod
    async def get_quote(self, symbol: str) -> QuoteResult: ...

    @abstractmethod
    async def get_bulk_quotes(self, symbols: list[str]) -> list[QuoteResult]: ...

    @abstractmethod
    async def get_historical(
        self, symbol: str, days: int = 30
    ) -> HistoricalResult: ...

    @abstractmethod
    async def search(self, query: str, limit: int = 10) -> list[dict]: ...


# ── Demo provider ──────────────────────────────────────────────────────────────

_DEMO_STOCKS: dict[str, dict] = {
    "RELIANCE.NS": {"name": "Reliance Industries Ltd", "base": 2850, "cap": 19_200_000},
    "TCS.NS":      {"name": "Tata Consultancy Services", "base": 3720, "cap": 13_500_000},
    "INFY.NS":     {"name": "Infosys Ltd",               "base": 1550, "cap": 6_400_000},
    "HDFCBANK.NS": {"name": "HDFC Bank Ltd",             "base": 1680, "cap": 12_700_000},
    "ICICIBANK.NS":{"name": "ICICI Bank Ltd",            "base": 1140, "cap": 8_000_000},
    "WIPRO.NS":    {"name": "Wipro Ltd",                 "base": 490,  "cap": 2_700_000},
    "BAJFINANCE.NS":{"name":"Bajaj Finance Ltd",         "base": 7200, "cap": 4_400_000},
    "AXISBANK.NS": {"name": "Axis Bank Ltd",             "base": 1100, "cap": 3_400_000},
    "LT.NS":       {"name": "Larsen & Toubro Ltd",       "base": 3600, "cap": 5_000_000},
    "SBIN.NS":     {"name": "State Bank of India",       "base": 820,  "cap": 7_300_000},
    "NIFTY50":     {"name": "Nifty 50 Index",            "base": 24300,"cap": None},
    "SENSEX":      {"name": "BSE Sensex",                "base": 80000,"cap": None},
}


def _jitter(base: float, pct: float = 0.03) -> float:
    """Simulate a small random price movement."""
    return round(base * (1 + random.uniform(-pct, pct)), 2)


class DemoMarketDataProvider(MarketDataProvider):
    """
    Returns clearly-labelled SIMULATED data.
    Prices are fictional and change on each call to simulate market movement.
    This provider exists solely for development and educational demonstration.
    """

    async def get_quote(self, symbol: str) -> QuoteResult:
        info = _DEMO_STOCKS.get(symbol.upper())
        if not info:
            return QuoteResult(
                symbol=symbol,
                name="Unknown Symbol",
                exchange="DEMO",
                current_price=None,
                previous_close=None,
                change=None,
                change_pct=None,
                market_cap=None,
                day_high=None,
                day_low=None,
                volume=None,
            )

        base = float(info["base"])
        prev = _jitter(base, 0.01)
        curr = _jitter(base, 0.02)
        chg = round(curr - prev, 2)
        chg_pct = round(chg / prev * 100, 2)

        return QuoteResult(
            symbol=symbol,
            name=info["name"],
            exchange="NSE" if symbol.endswith(".NS") else "BSE",
            current_price=curr,
            previous_close=prev,
            change=chg,
            change_pct=chg_pct,
            market_cap=float(info["cap"]) * 1_000 if info["cap"] else None,
            day_high=round(curr * 1.015, 2),
            day_low=round(curr * 0.985, 2),
            volume=random.randint(500_000, 5_000_000),
        )

    async def get_bulk_quotes(self, symbols: list[str]) -> list[QuoteResult]:
        return [await self.get_quote(s) for s in symbols]

    async def get_historical(
        self, symbol: str, days: int = 30
    ) -> HistoricalResult:
        info = _DEMO_STOCKS.get(symbol.upper(), {"base": 1000})
        base = float(info["base"])
        points: list[HistoricalPoint] = []
        price = _jitter(base, 0.05)

        for i in range(days, 0, -1):
            d = date.today() - timedelta(days=i)
            price = _jitter(price, 0.015)
            high = round(price * 1.01, 2)
            low = round(price * 0.99, 2)
            points.append(HistoricalPoint(
                date=d,
                open=round(price * 0.998, 2),
                high=high,
                low=low,
                close=price,
                volume=random.randint(200_000, 3_000_000),
            ))

        return HistoricalResult(symbol=symbol, points=points)

    async def search(self, query: str, limit: int = 10) -> list[dict]:
        q = query.upper()
        results = []
        for symbol, info in _DEMO_STOCKS.items():
            if q in symbol or q in info["name"].upper():
                results.append({"symbol": symbol, "name": info["name"], "exchange": "NSE"})
            if len(results) >= limit:
                break
        return results


# ── In-Memory Cache for Market Data ────────────────────────────────────────────
#
# Caches API responses to minimize calls to Alpha Vantage (rate limit: 5/min free tier)
# Cache strategy:
#   - Quotes: 5 minute TTL (stock prices update frequently)
#   - Historical: 1 hour TTL (historical data changes rarely during trading hours)
#   - Search: 24 hour TTL (symbol lists are stable)
#
# THREAD-SAFE: Uses a dict with timestamps; assumes single-threaded async event loop

class MarketDataCache:
    """
    Simple in-memory cache with TTL-based expiration.
    Reduces API calls during rate limiting or unavailability.
    """

    def __init__(self):
        self._cache: Dict[str, Tuple[object, float]] = {}  # key -> (value, expiry_time)

    def get(self, key: str) -> object | None:
        """Get cached value if it exists and hasn't expired."""
        if key not in self._cache:
            return None
        
        value, expiry_time = self._cache[key]
        if datetime.utcnow().timestamp() > expiry_time:
            del self._cache[key]
            return None
        
        return value

    def set(self, key: str, value: object, ttl_seconds: int) -> None:
        """Store value with TTL in seconds."""
        expiry_time = datetime.utcnow().timestamp() + ttl_seconds
        self._cache[key] = (value, expiry_time)

    def clear(self) -> None:
        """Clear all cached entries."""
        self._cache.clear()

    def size(self) -> int:
        """Return number of cached entries."""
        return len(self._cache)


# Singleton cache instance
_market_data_cache = MarketDataCache()


# ── Alpha Vantage Provider ─────────────────────────────────────────────────────

class AlphaVantageProvider(MarketDataProvider):
    """
    Real market data provider using Alpha Vantage API.
    Supports global stock symbols.
    
    Free tier limits:
    - 5 API calls per minute
    - 500 API calls per day
    
    API Documentation: https://www.alphavantage.co/documentation/
    
    Supported endpoints:
    - GLOBAL_QUOTE: Current price data
    - TIME_SERIES_DAILY: Historical daily OHLCV data
    - SYMBOL_SEARCH: Company/symbol search
    - OVERVIEW: Company information
    """

    def __init__(self):
        """Initialize with config from settings."""
        self.api_key = settings.ALPHA_VANTAGE_API_KEY
        self.base_url = settings.ALPHA_VANTAGE_BASE_URL
        self.timeout = settings.ALPHA_VANTAGE_TIMEOUT
        self.client = None
        self._fallback = DemoMarketDataProvider()
        
        if not self.api_key:
            logger.warning(
                "ALPHA_VANTAGE_API_KEY not configured. "
                "Will fall back to DemoMarketDataProvider."
            )

    async def _ensure_client(self) -> httpx.AsyncClient:
        """Lazy-initialize HTTP client."""
        if self.client is None:
            self.client = httpx.AsyncClient(timeout=self.timeout)
        return self.client

    async def _get_quote_from_api(self, symbol: str) -> dict | None:
        """
        Fetch global quote data from Alpha Vantage.
        Returns raw API response or None on error.
        """
        if not self.api_key:
            logger.debug("Alpha Vantage API key not configured")
            return None

        try:
            client = await self._ensure_client()
            params = {
                "function": "GLOBAL_QUOTE",
                "symbol": symbol,
                "apikey": self.api_key,
            }
            response = await client.get(self.base_url, params=params)
            response.raise_for_status()
            data = response.json()
            
            # Check for API errors
            if "Error Message" in data:
                logger.warning(f"Alpha Vantage error for {symbol}: {data['Error Message']}")
                return None
            
            if "Note" in data:
                logger.warning(f"Alpha Vantage rate limit reached: {data['Note']}")
                return None
            
            if "Global Quote" not in data or not data["Global Quote"]:
                logger.debug(f"No quote data found for symbol: {symbol}")
                return None
            
            return data.get("Global Quote")
            
        except httpx.TimeoutException:
            logger.error(f"Timeout fetching quote for {symbol}")
            return None
        except httpx.HTTPError as e:
            logger.error(f"HTTP error fetching quote for {symbol}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error fetching quote for {symbol}: {e}")
            return None

    async def _get_overview_from_api(self, symbol: str) -> dict | None:
        """
        Fetch company overview data from Alpha Vantage.
        Returns raw API response or None on error.
        """
        if not self.api_key:
            return None

        try:
            client = await self._ensure_client()
            params = {
                "function": "OVERVIEW",
                "symbol": symbol,
                "apikey": self.api_key,
            }
            response = await client.get(self.base_url, params=params)
            response.raise_for_status()
            data = response.json()
            
            if "Error Message" in data or not data.get("Symbol"):
                return None
            
            return data
            
        except (httpx.TimeoutException, httpx.HTTPError, Exception) as e:
            logger.debug(f"Could not fetch overview for {symbol}: {e}")
            return None

    async def get_quote(self, symbol: str) -> QuoteResult:
        """
        Get current quote for a symbol.
        Falls back to DemoMarketDataProvider if API fails.
        Uses 5-minute cache to minimize API calls.
        """
        symbol_upper = symbol.upper()
        cache_key = f"quote:{symbol_upper}"
        
        # Check cache first
        cached_quote = _market_data_cache.get(cache_key)
        if cached_quote is not None:
            logger.debug(f"Cache hit for quote: {symbol_upper}")
            return cached_quote
        
        if not self.api_key:
            logger.debug(f"Falling back to demo provider for {symbol} (no API key)")
            return await self._fallback.get_quote(symbol)

        quote_data = await self._get_quote_from_api(symbol)
        
        if not quote_data:
            logger.debug(f"Falling back to demo provider for {symbol} (API failed)")
            return await self._fallback.get_quote(symbol)

        try:
            # Parse the quote data
            
            # Extract numeric values with fallback to None
            current_price = self._parse_float(quote_data.get("05. price"))
            previous_close = self._parse_float(quote_data.get("08. previous close"))
            change = self._parse_float(quote_data.get("09. change"))
            change_pct = self._parse_float(quote_data.get("10. change percent"))
            day_high = self._parse_float(quote_data.get("03. high"))
            day_low = self._parse_float(quote_data.get("04. low"))
            volume = self._parse_int(quote_data.get("06. volume"))
            
            # Fetch overview for additional data (name, market cap)
            overview = await self._get_overview_from_api(symbol_upper)
            
            name = overview.get("Name", symbol_upper) if overview else symbol_upper
            market_cap = self._parse_float(overview.get("MarketCapitalization")) if overview else None
            
            # Determine exchange from symbol pattern or overview
            exchange = "NASDAQ"
            if overview and "Exchange" in overview:
                exchange = overview["Exchange"]
            elif symbol_upper.endswith(".NS"):
                exchange = "NSE"
            elif symbol_upper.endswith(".BO"):
                exchange = "BSE"
            
            # Remove suffix for cleaner display
            display_name = name.replace(".NS", "").replace(".BO", "")
            
            result = QuoteResult(
                symbol=symbol_upper,
                name=display_name,
                exchange=exchange,
                current_price=current_price,
                previous_close=previous_close,
                change=change,
                change_pct=change_pct,
                market_cap=market_cap,
                day_high=day_high,
                day_low=day_low,
                volume=volume,
                currency="USD",
                data_source="AlphaVantage",
                is_simulated=False,
                disclaimer="",  # Real data, no disclaimer needed
                as_of=datetime.utcnow(),
            )
            
            # Cache for 5 minutes
            _market_data_cache.set(cache_key, result, ttl_seconds=300)
            
            return result
        except Exception as e:
            logger.error(f"Error parsing quote for {symbol}: {e}")
            return await self._fallback.get_quote(symbol)

    async def get_bulk_quotes(self, symbols: list[str]) -> list[QuoteResult]:
        """
        Get quotes for multiple symbols.
        Note: Alpha Vantage free tier has rate limits (5 calls/min).
        """
        results = []
        for symbol in symbols:
            quote = await self.get_quote(symbol)
            results.append(quote)
        return results

    async def get_historical(
        self, symbol: str, days: int = 30
    ) -> HistoricalResult:
        """
        Get historical daily OHLCV data for a symbol.
        Falls back to demo if API fails.
        Uses 1-hour cache to minimize API calls.
        """
        symbol_upper = symbol.upper()
        cache_key = f"historical:{symbol_upper}:{days}"
        
        # Check cache first
        cached_result = _market_data_cache.get(cache_key)
        if cached_result is not None:
            logger.debug(f"Cache hit for historical: {symbol_upper}")
            return cached_result
        
        if not self.api_key:
            logger.debug(f"Falling back to demo provider for historical data (no API key)")
            return await self._fallback.get_historical(symbol, days)

        try:
            client = await self._ensure_client()
            params = {
                "function": "TIME_SERIES_DAILY",
                "symbol": symbol,
                "apikey": self.api_key,
                "outputsize": "full",  # Get up to 20 years of data
            }
            response = await client.get(self.base_url, params=params)
            response.raise_for_status()
            data = response.json()
            
            # Check for errors
            if "Error Message" in data or "Note" in data:
                logger.debug(f"Alpha Vantage error/limit for {symbol}")
                return await self._fallback.get_historical(symbol, days)
            
            if "Time Series (Daily)" not in data:
                logger.debug(f"No historical data for {symbol}")
                return await self._fallback.get_historical(symbol, days)
            
            time_series = data["Time Series (Daily)"]
            points: list[HistoricalPoint] = []
            
            # Convert to list of (date, data) tuples and sort
            sorted_dates = sorted(time_series.items(), key=lambda x: x[0])
            
            # Get the last 'days' entries
            recent_dates = sorted_dates[-days:] if len(sorted_dates) > days else sorted_dates
            
            for date_str, daily_data in recent_dates:
                try:
                    point = HistoricalPoint(
                        date=datetime.strptime(date_str, "%Y-%m-%d").date(),
                        open=float(daily_data.get("1. open", 0)),
                        high=float(daily_data.get("2. high", 0)),
                        low=float(daily_data.get("3. low", 0)),
                        close=float(daily_data.get("4. close", 0)),
                        volume=int(float(daily_data.get("5. volume", 0))),
                    )
                    points.append(point)
                except (ValueError, KeyError) as e:
                    logger.warning(f"Skipping invalid historical data for {symbol}: {e}")
                    continue
            
            result = HistoricalResult(
                symbol=symbol,
                points=points,
                is_simulated=False,
                disclaimer="",  # Real data
            )
            
            # Cache for 1 hour
            _market_data_cache.set(cache_key, result, ttl_seconds=3600)
            
            return result
            
        except (httpx.TimeoutException, httpx.HTTPError):
            logger.debug(f"API error fetching historical data for {symbol}")
            return await self._fallback.get_historical(symbol, days)
        except Exception as e:
            logger.error(f"Unexpected error fetching historical data for {symbol}: {e}")
            return await self._fallback.get_historical(symbol, days)

    async def search(self, query: str, limit: int = 10) -> list[dict]:
        """
        Search for symbols by name or ticker.
        Falls back to demo if API fails.
        Uses 24-hour cache to minimize API calls.
        """
        cache_key = f"search:{query.upper()}:{limit}"
        
        # Check cache first
        cached_results = _market_data_cache.get(cache_key)
        if cached_results is not None:
            logger.debug(f"Cache hit for search: {query}")
            return cached_results
        
        if not self.api_key:
            return await self._fallback.search(query, limit)

        try:
            client = await self._ensure_client()
            params = {
                "function": "SYMBOL_SEARCH",
                "keywords": query,
                "apikey": self.api_key,
            }
            response = await client.get(self.base_url, params=params)
            response.raise_for_status()
            data = response.json()
            
            if "Error Message" in data or "Note" in data:
                logger.debug(f"Alpha Vantage error/limit for search: {query}")
                return await self._fallback.search(query, limit)
            
            if "bestMatches" not in data:
                logger.debug(f"No search results for: {query}")
                return await self._fallback.search(query, limit)
            
            results = []
            for match in data["bestMatches"][:limit]:
                results.append({
                    "symbol": match.get("1. symbol", ""),
                    "name": match.get("2. name", ""),
                    "exchange": match.get("4. region", ""),
                    "type": match.get("3. type", ""),
                    "currency": match.get("8. currency", ""),
                })
            
            # Cache for 24 hours
            _market_data_cache.set(cache_key, results, ttl_seconds=86400)
            
            return results
            
        except (httpx.TimeoutException, httpx.HTTPError):
            logger.debug(f"API error searching for: {query}")
            return await self._fallback.search(query, limit)
        except Exception as e:
            logger.error(f"Unexpected error searching for {query}: {e}")
            return await self._fallback.search(query, limit)

    @staticmethod
    def _parse_float(value: str | None) -> float | None:
        """Safely parse float, handling '%' suffix."""
        if not value:
            return None
        try:
            # Remove '%' if present (for percentage values)
            clean_value = value.strip().rstrip("%")
            return float(clean_value)
        except (ValueError, AttributeError):
            return None

    @staticmethod
    def _parse_int(value: str | None) -> int | None:
        """Safely parse int."""
        if not value:
            return None
        try:
            return int(float(value))
        except (ValueError, AttributeError):
            return None

    async def close(self) -> None:
        """Close the HTTP client."""
        if self.client:
            await self.client.aclose()
            self.client = None


# ── Singleton accessor ─────────────────────────────────────────────────────────
# Future: replace with a real provider by changing this factory.

def get_market_data_provider() -> MarketDataProvider:
    """
    Factory that returns the active market data provider.
    
    Strategy:
    1. If ALPHA_VANTAGE_API_KEY is configured → AlphaVantageProvider (with fallback to demo)
    2. Otherwise → DemoMarketDataProvider
    
    This allows graceful degradation: if Alpha Vantage is unavailable or rate-limited,
    the provider automatically falls back to simulated data.
    """
    if settings.alpha_vantage_configured:
        logger.debug("Using AlphaVantageProvider for real market data")
        return AlphaVantageProvider()
    else:
        logger.debug("Using DemoMarketDataProvider — data is SIMULATED")
        return DemoMarketDataProvider()
