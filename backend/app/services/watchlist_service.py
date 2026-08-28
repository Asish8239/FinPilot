import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.watchlist import WatchlistItem
from app.schemas.watchlist import AddWatchlistRequest, UpdateWatchlistRequest, WatchlistItemResponse
from app.core.exceptions import NotFoundError, ConflictError, ForbiddenError


async def list_watchlist(db: AsyncSession, user_id: uuid.UUID) -> list[WatchlistItemResponse]:
    result = await db.execute(
        select(WatchlistItem).where(WatchlistItem.user_id == user_id)
        .order_by(WatchlistItem.added_at.desc())
    )
    return [WatchlistItemResponse.model_validate(w) for w in result.scalars()]


async def add_item(
    db: AsyncSession, user_id: uuid.UUID, req: AddWatchlistRequest
) -> WatchlistItemResponse:
    existing = await db.scalar(
        select(WatchlistItem).where(
            WatchlistItem.user_id == user_id,
            WatchlistItem.symbol == req.symbol.upper(),
        )
    )
    if existing:
        raise ConflictError(f"{req.symbol.upper()} is already in your watchlist")

    item = WatchlistItem(
        user_id=user_id,
        symbol=req.symbol.upper(),
        name=req.name,
        exchange=req.exchange.upper(),
        notes=req.notes,
    )
    db.add(item)
    await db.flush()
    return WatchlistItemResponse.model_validate(item)


async def update_item(
    db: AsyncSession, user_id: uuid.UUID, item_id: uuid.UUID, req: UpdateWatchlistRequest
) -> WatchlistItemResponse:
    item = await db.scalar(select(WatchlistItem).where(WatchlistItem.id == item_id))
    if not item:
        raise NotFoundError("Watchlist item")
    if item.user_id != user_id:
        raise ForbiddenError()
    if req.notes is not None:
        item.notes = req.notes
    await db.flush()
    return WatchlistItemResponse.model_validate(item)


async def remove_item(db: AsyncSession, user_id: uuid.UUID, item_id: uuid.UUID) -> None:
    item = await db.scalar(select(WatchlistItem).where(WatchlistItem.id == item_id))
    if not item:
        raise NotFoundError("Watchlist item")
    if item.user_id != user_id:
        raise ForbiddenError()
    await db.delete(item)
    await db.flush()


async def get_item(
    db: AsyncSession, user_id: uuid.UUID, item_id: uuid.UUID
) -> WatchlistItem:
    """Fetch a WatchlistItem ORM object (not a schema). Used by the quote endpoint."""
    item = await db.scalar(select(WatchlistItem).where(WatchlistItem.id == item_id))
    if not item:
        raise NotFoundError("Watchlist item")
    if item.user_id != user_id:
        raise ForbiddenError()
    return item
