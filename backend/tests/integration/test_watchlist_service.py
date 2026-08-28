"""Integration tests for watchlist service."""
from __future__ import annotations

import uuid
import pytest

from app.services import watchlist_service
from app.schemas.watchlist import AddWatchlistRequest, UpdateWatchlistRequest
from app.core.exceptions import ConflictError, NotFoundError, ForbiddenError


class TestWatchlist:

    async def test_add_item(self, db, student_user):
        req = AddWatchlistRequest(symbol="reliance.ns", name="Reliance Industries", exchange="nse")
        item = await watchlist_service.add_item(db, student_user.id, req)
        assert item.symbol == "RELIANCE.NS"   # uppercased
        assert item.exchange == "NSE"

    async def test_duplicate_raises_conflict(self, db, student_user):
        req = AddWatchlistRequest(symbol="TCS.NS", name="TCS", exchange="NSE")
        await watchlist_service.add_item(db, student_user.id, req)
        with pytest.raises(ConflictError):
            await watchlist_service.add_item(db, student_user.id, req)

    async def test_list_watchlist(self, db, student_user):
        await watchlist_service.add_item(db, student_user.id,
                                         AddWatchlistRequest(symbol="INFY.NS", name="Infosys", exchange="NSE"))
        await watchlist_service.add_item(db, student_user.id,
                                         AddWatchlistRequest(symbol="WIPRO.NS", name="Wipro", exchange="NSE"))
        items = await watchlist_service.list_watchlist(db, student_user.id)
        assert len(items) == 2

    async def test_list_isolated_per_user(self, db, student_user, admin_user):
        await watchlist_service.add_item(db, student_user.id,
                                         AddWatchlistRequest(symbol="HDFC.NS", name="HDFC Bank", exchange="NSE"))
        admin_list = await watchlist_service.list_watchlist(db, admin_user.id)
        assert len(admin_list) == 0

    async def test_update_notes(self, db, student_user):
        item = await watchlist_service.add_item(db, student_user.id,
                                                AddWatchlistRequest(symbol="SBIN.NS", name="SBI", exchange="NSE"))
        updated = await watchlist_service.update_item(
            db, student_user.id, item.id, UpdateWatchlistRequest(notes="Watching for dividend")
        )
        assert updated.notes == "Watching for dividend"

    async def test_remove_item(self, db, student_user):
        item = await watchlist_service.add_item(db, student_user.id,
                                                AddWatchlistRequest(symbol="LT.NS", name="L&T", exchange="NSE"))
        await watchlist_service.remove_item(db, student_user.id, item.id)
        items = await watchlist_service.list_watchlist(db, student_user.id)
        assert len(items) == 0

    async def test_remove_forbidden_for_other_user(self, db, student_user, admin_user):
        item = await watchlist_service.add_item(db, student_user.id,
                                                AddWatchlistRequest(symbol="AXISBANK.NS", name="Axis Bank", exchange="NSE"))
        with pytest.raises(ForbiddenError):
            await watchlist_service.remove_item(db, admin_user.id, item.id)

    async def test_get_item_raises_not_found(self, db, student_user):
        with pytest.raises(NotFoundError):
            await watchlist_service.get_item(db, student_user.id, uuid.uuid4())

    async def test_get_item_raises_forbidden_for_wrong_user(self, db, student_user, admin_user):
        item = await watchlist_service.add_item(db, student_user.id,
                                                AddWatchlistRequest(symbol="BAJFINANCE.NS", name="Bajaj Finance", exchange="NSE"))
        with pytest.raises(ForbiddenError):
            await watchlist_service.get_item(db, admin_user.id, item.id)
