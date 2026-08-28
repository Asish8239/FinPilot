"""
Unit tests for the market data provider abstraction.
Verifies that demo data is clearly labelled and the interface contract holds.
"""
from __future__ import annotations

import pytest

from app.services.market_data_service import DemoMarketDataProvider, get_market_data_provider


class TestDemoMarketDataProvider:

    @pytest.fixture
    def provider(self):
        return DemoMarketDataProvider()

    async def test_known_symbol_returns_quote(self, provider):
        quote = await provider.get_quote("RELIANCE.NS")
        assert quote.symbol == "RELIANCE.NS"
        assert quote.current_price is not None
        assert quote.current_price > 0

    async def test_unknown_symbol_returns_none_price(self, provider):
        quote = await provider.get_quote("UNKNOWN.XX")
        assert quote.current_price is None

    async def test_quote_is_marked_simulated(self, provider):
        quote = await provider.get_quote("TCS.NS")
        assert quote.is_simulated is True
        assert "SIMULATED" in quote.disclaimer.upper()

    async def test_quote_data_source_is_demo(self, provider):
        quote = await provider.get_quote("INFY.NS")
        assert quote.data_source == "DEMO"

    async def test_bulk_quotes_length_matches_input(self, provider):
        symbols = ["RELIANCE.NS", "TCS.NS", "INFY.NS"]
        quotes = await provider.get_bulk_quotes(symbols)
        assert len(quotes) == len(symbols)

    async def test_all_bulk_quotes_simulated(self, provider):
        symbols = ["RELIANCE.NS", "TCS.NS"]
        quotes = await provider.get_bulk_quotes(symbols)
        for q in quotes:
            assert q.is_simulated is True

    async def test_historical_returns_correct_days(self, provider):
        result = await provider.get_historical("RELIANCE.NS", days=30)
        assert len(result.points) == 30
        assert result.is_simulated is True

    async def test_historical_disclaimer_present(self, provider):
        result = await provider.get_historical("TCS.NS", days=7)
        assert "SIMULATED" in result.disclaimer.upper()

    async def test_search_returns_results(self, provider):
        results = await provider.search("RELI")
        assert isinstance(results, list)
        # Should find RELIANCE.NS
        symbols = [r["symbol"] for r in results]
        assert "RELIANCE.NS" in symbols

    async def test_search_empty_query_returns_list(self, provider):
        results = await provider.search("ZZZZNOTFOUND")
        assert isinstance(results, list)

    def test_factory_returns_demo_provider(self):
        provider = get_market_data_provider()
        assert isinstance(provider, DemoMarketDataProvider)
