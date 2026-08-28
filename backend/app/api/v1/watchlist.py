"""
Watchlist routes — anonymous educational stock tracking.

No authentication required. Uses X-Session-ID header for per-browser isolation.
All price data is real (via Alpha Vantage) or clearly-labelled demo fallback.
"""
from __future__ import annotations

import uuid
from typing import Annotated
from fastapi.responses import Response

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.anonymous import get_anonymous_id
from app.schemas.watchlist import (
    AddWatchlistRequest,
    UpdateWatchlistRequest,
    WatchlistItemResponse,
)
from app.services import watchlist_service
from app.services.market_data_service import get_market_data_provider

router = APIRouter()


@router.get(
    "",
    response_model=list[WatchlistItemResponse],
    summary="List watchlist items for this session",
)
async def list_watchlist(
    session_id: Annotated[uuid.UUID, Depends(get_anonymous_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[WatchlistItemResponse]:
    return await watchlist_service.list_watchlist(db, session_id)


@router.post(
    "",
    response_model=WatchlistItemResponse,
    status_code=201,
    summary="Add a stock to the watchlist",
)
async def add_item(
    body: AddWatchlistRequest,
    session_id: Annotated[uuid.UUID, Depends(get_anonymous_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> WatchlistItemResponse:
    return await watchlist_service.add_item(db, session_id, body)


@router.patch(
    "/{item_id}",
    response_model=WatchlistItemResponse,
    summary="Update watchlist item notes",
)
async def update_item(
    item_id: uuid.UUID,
    body: UpdateWatchlistRequest,
    session_id: Annotated[uuid.UUID, Depends(get_anonymous_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> WatchlistItemResponse:
    return await watchlist_service.update_item(db, session_id, item_id, body)


@router.delete(
    "/{item_id}",
    status_code=204,
    summary="Remove a stock from the watchlist",
)
async def remove_item(
    item_id: uuid.UUID,
    session_id: Annotated[uuid.UUID, Depends(get_anonymous_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    await watchlist_service.remove_item(db, session_id, item_id)
    return Response(status_code=204)


@router.get(
    "/search",
    summary="Search for a stock symbol",
)
async def search_symbol(q: str) -> dict:
    provider = get_market_data_provider()
    results = await provider.search(q)
    is_simulated = all(r.get("is_simulated", True) for r in results) if results else True
    return {
        "results": results,
        "is_simulated": is_simulated,
        "disclaimer": "⚠️ DEMO DATA — Not real market data." if is_simulated else "",
    }


@router.get(
    "/{item_id}/quote",
    summary="Get a price quote for a watchlist item",
)
async def get_quote(
    item_id: uuid.UUID,
    session_id: Annotated[uuid.UUID, Depends(get_anonymous_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    item = await watchlist_service.get_item(db, session_id, item_id)
    provider = get_market_data_provider()
    quote = await provider.get_quote(item.symbol)
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
