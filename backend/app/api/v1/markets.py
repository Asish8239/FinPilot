"""
Market routes for FinPilot.

Provides:
- Latest market quotes
- Historical OHLCV data
- Frontend-compatible historical data
- Market symbol search
- Market data provider status

All market data is either supplied by the configured provider
or clearly marked as simulated fallback data.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.services.market_data_service import get_market_data_provider


router = APIRouter()


# ============================================================================
# HELPERS
# ============================================================================


def _provider_name(provider: Any) -> str:
    """Return a readable provider name."""

    return getattr(
        provider,
        "name",
        provider.__class__.__name__,
    )


def _timeframe_to_days(timeframe: str) -> int:
    """Convert a FinPilot timeframe to a historical day count."""

    mapping = {
        "1D": 1,
        "1W": 7,
        "1M": 30,
        "3M": 90,
        "6M": 180,
        "1Y": 365,
    }

    return mapping[timeframe.upper()]


def _extract_points(result: Any) -> list[Any]:
    """
    Extract historical points from the provider result.

    The current MarketDataProvider returns a HistoricalResult object
    whose actual candle data is stored in `.points`.
    """

    if result is None:
        return []

    # Current provider interface:
    # HistoricalResult.points
    if hasattr(result, "points"):
        points = result.points

        if points is None:
            return []

        return list(points)

    # Compatibility with a provider that might directly return a list.
    if isinstance(result, list):
        return result

    return []


def _point_value(point: Any, field: str, default: Any = None) -> Any:
    """Read a field from either a dataclass/object or a dictionary."""

    if isinstance(point, dict):
        return point.get(field, default)

    return getattr(point, field, default)


def _point_is_simulated(point: Any) -> bool:
    """
    HistoricalPoint currently does not contain is_simulated.

    The HistoricalResult itself does, so individual points are treated
    as non-simulated here unless the provider explicitly adds the field.
    """

    value = _point_value(
        point,
        "is_simulated",
        False,
    )

    return bool(value)


def _normalize_candle(point: Any) -> dict:
    """
    Normalize HistoricalPoint into a JSON-friendly candle structure.
    """

    date_value = _point_value(
        point,
        "date",
    )

    if hasattr(date_value, "isoformat"):
        date_value = date_value.isoformat()

    open_value = _point_value(point, "open", 0)
    high_value = _point_value(point, "high", 0)
    low_value = _point_value(point, "low", 0)
    close_value = _point_value(point, "close", 0)
    volume_value = _point_value(point, "volume", 0)

    return {
        "date": date_value,
        "open": float(open_value or 0),
        "high": float(high_value or 0),
        "low": float(low_value or 0),
        "close": float(close_value or 0),
        "volume": int(volume_value or 0),
        "is_simulated": _point_is_simulated(point),
    }


def _result_is_simulated(result: Any, points: list[Any]) -> bool:
    """
    Determine whether the historical result is simulated.

    HistoricalResult has an explicit `is_simulated` flag, so use that
    when available. Otherwise inspect individual points.
    """

    result_flag = getattr(
        result,
        "is_simulated",
        None,
    )

    if result_flag is not None:
        return bool(result_flag)

    if not points:
        return False

    return all(
        _point_is_simulated(point)
        for point in points
    )


def _result_disclaimer(result: Any, simulated: bool) -> str:
    """
    Return the provider disclaimer when available.
    """

    disclaimer = getattr(
        result,
        "disclaimer",
        "",
    )

    if disclaimer:
        return str(disclaimer)

    if simulated:
        return (
            "Demo market data — not live prices."
        )

    return ""


async def _get_historical_result(
    provider: Any,
    symbol: str,
    days: int,
) -> Any:
    """
    Retrieve historical data from the configured provider.

    The current MarketDataProvider interface is:

        get_historical(symbol, days=30)

    so we intentionally call it using `days`.
    """

    return await provider.get_historical(
        symbol,
        days=days,
    )


# ============================================================================
# MARKET QUOTE
# ============================================================================


@router.get(
    "/quote/{symbol}",
    summary="Get a market quote",
)
async def get_market_quote(
    symbol: str,
) -> dict:
    """
    Return the latest quote for a market symbol.
    """

    normalized_symbol = symbol.strip().upper()

    if not normalized_symbol:
        raise HTTPException(
            status_code=400,
            detail="Market symbol cannot be empty.",
        )

    provider = get_market_data_provider()

    try:
        quote = await provider.get_quote(
            normalized_symbol
        )
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to retrieve market quote: "
                f"{exc}"
            ),
        ) from exc

    return {
        "symbol": quote.symbol,
        "name": quote.name,
        "exchange": quote.exchange,
        "current_price": quote.current_price,
        "previous_close": quote.previous_close,
        "change": quote.change,
        "change_pct": quote.change_pct,
        "market_cap": quote.market_cap,
        "day_high": quote.day_high,
        "day_low": quote.day_low,
        "volume": quote.volume,
        "currency": quote.currency,
        "data_source": quote.data_source,
        "is_simulated": quote.is_simulated,
        "disclaimer": quote.disclaimer,
        "as_of": quote.as_of.isoformat(),
    }


# ============================================================================
# CANONICAL HISTORICAL OHLCV ENDPOINT
# ============================================================================


@router.get(
    "/history/{symbol}",
    summary="Get historical OHLCV market data",
)
async def get_market_history(
    symbol: str,
    timeframe: str = Query(
        default="1D",
        description=(
            "Chart timeframe: "
            "1D, 1W, 1M, 3M, 6M, 1Y"
        ),
    ),
) -> dict:
    """
    Return historical OHLCV candles.

    The provider works with a number of historical days.
    FinPilot's API exposes convenient chart timeframes.
    """

    normalized_symbol = symbol.strip().upper()
    normalized_timeframe = timeframe.strip().upper()

    allowed_timeframes = {
        "1D",
        "1W",
        "1M",
        "3M",
        "6M",
        "1Y",
    }

    if not normalized_symbol:
        raise HTTPException(
            status_code=400,
            detail="Market symbol cannot be empty.",
        )

    if normalized_timeframe not in allowed_timeframes:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid timeframe. "
                "Use one of: "
                "1D, 1W, 1M, 3M, 6M, 1Y."
            ),
        )

    days = _timeframe_to_days(
        normalized_timeframe
    )

    provider = get_market_data_provider()

    try:
        result = await _get_historical_result(
            provider,
            normalized_symbol,
            days,
        )

        raw_points = _extract_points(result)

        candles = [
            _normalize_candle(point)
            for point in raw_points
        ]

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to retrieve historical "
                f"market data: {exc}"
            ),
        ) from exc

    simulated = _result_is_simulated(
        result,
        raw_points,
    )

    return {
        "symbol": normalized_symbol,
        "timeframe": normalized_timeframe,
        "days": days,
        "data_source": _provider_name(provider),
        "is_simulated": simulated,
        "disclaimer": _result_disclaimer(
            result,
            simulated,
        ),
        "candles": candles,
    }


# ============================================================================
# FRONTEND COMPATIBILITY HISTORICAL ENDPOINT
# ============================================================================


@router.get(
    "/historical/{symbol}",
    summary="Get historical market data for the frontend",
)
async def get_frontend_market_history(
    symbol: str,
    days: int = Query(
        default=30,
        ge=1,
        le=365,
        description="Number of historical days requested",
    ),
) -> dict:
    """
    Compatibility endpoint used by the existing FinPilot frontend.

    Example:

        /api/v1/markets/historical/RELIANCE.NS?days=30

    Returns the `points` structure expected by the frontend.
    """

    normalized_symbol = symbol.strip().upper()

    if not normalized_symbol:
        raise HTTPException(
            status_code=400,
            detail="Market symbol cannot be empty.",
        )

    provider = get_market_data_provider()

    try:
        result = await _get_historical_result(
            provider,
            normalized_symbol,
            days,
        )

        raw_points = _extract_points(result)

        points = [
            _normalize_candle(point)
            for point in raw_points
        ]

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to retrieve historical "
                f"market data: {exc}"
            ),
        ) from exc

    simulated = _result_is_simulated(
        result,
        raw_points,
    )

    return {
        "symbol": normalized_symbol,
        "days": days,
        "data_source": _provider_name(provider),
        "is_simulated": simulated,
        "disclaimer": _result_disclaimer(
            result,
            simulated,
        ),
        "points": points,
    }


# ============================================================================
# MARKET SEARCH
# ============================================================================


@router.get(
    "/search",
    summary="Search market symbols",
)
async def search_market(
    q: str = Query(
        min_length=1,
        max_length=50,
        description="Company name or symbol",
    ),
) -> dict:
    """
    Search market symbols through the configured provider.
    """

    query = q.strip()

    if not query:
        raise HTTPException(
            status_code=400,
            detail="Search query cannot be empty.",
        )

    provider = get_market_data_provider()

    try:
        results = await provider.search(
            query
        )
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to search market symbols: "
                f"{exc}"
            ),
        ) from exc

    results = list(results or [])

    simulated = (
        all(
            bool(
                result.get(
                    "is_simulated",
                    False,
                )
            )
            for result in results
        )
        if results
        else False
    )

    return {
        "query": query,
        "results": results,
        "data_source": _provider_name(provider),
        "is_simulated": simulated,
        "disclaimer": (
            "Demo market data — not live prices."
            if simulated
            else ""
        ),
    }


# ============================================================================
# PROVIDER STATUS
# ============================================================================


@router.get(
    "/status",
    summary="Get market data provider status",
)
async def market_data_status() -> dict:
    """
    Return information about the active market-data provider.
    """

    provider = get_market_data_provider()

    provider_name = _provider_name(
        provider
    )

    api_configured = getattr(
        provider,
        "api_configured",
        getattr(
            provider,
            "configured",
            None,
        ),
    )

    return {
        "provider": provider_name,
        "name": provider_name,
        "api_configured": api_configured,
        "status": "configured",
    }