"""
Unit tests for the SIP and lumpsum calculator service.
These are pure-function tests — no database needed.
"""
from __future__ import annotations

import pytest
from decimal import Decimal

from app.schemas.calculator import SIPCalculatorRequest, LumpsumRequest
from app.services.calculator_service import calculate_sip, calculate_lumpsum


class TestSIPCalculator:

    def test_basic_sip_projection(self):
        req = SIPCalculatorRequest(monthly_investment=5000, annual_rate=12.0, years=10)
        result = calculate_sip(req)

        assert result.projected_maturity_value > result.total_invested
        assert result.total_invested == pytest.approx(5000 * 12 * 10, rel=1e-4)
        assert result.projected_wealth_gained > 0
        assert len(result.yearly_projections) == 10
        assert result.disclaimer != ""

    def test_maturity_equals_invested_plus_gained(self):
        req = SIPCalculatorRequest(monthly_investment=10000, annual_rate=10.0, years=5)
        result = calculate_sip(req)
        assert result.projected_maturity_value == pytest.approx(
            result.total_invested + result.projected_wealth_gained, rel=1e-4
        )

    def test_yearly_projections_monotonically_increasing(self):
        req = SIPCalculatorRequest(monthly_investment=3000, annual_rate=12.0, years=15)
        result = calculate_sip(req)
        values = [p.value for p in result.yearly_projections]
        assert values == sorted(values), "Yearly values should increase monotonically"

    def test_inflation_adjusted_lte_nominal(self):
        req = SIPCalculatorRequest(
            monthly_investment=5000, annual_rate=12.0, years=20, inflation_rate=6.0
        )
        result = calculate_sip(req)
        assert result.inflation_adjusted_projected_value <= result.projected_maturity_value

    def test_zero_inflation_equals_nominal(self):
        req = SIPCalculatorRequest(
            monthly_investment=5000, annual_rate=12.0, years=10, inflation_rate=0.0
        )
        result = calculate_sip(req)
        assert result.inflation_adjusted_projected_value == pytest.approx(
            result.projected_maturity_value, rel=1e-4
        )

    def test_yearly_projection_year_numbers(self):
        years = 7
        req = SIPCalculatorRequest(monthly_investment=2000, annual_rate=10.0, years=years)
        result = calculate_sip(req)
        assert [p.year for p in result.yearly_projections] == list(range(1, years + 1))

    def test_yearly_invested_matches_monthly_times_months(self):
        req = SIPCalculatorRequest(monthly_investment=5000, annual_rate=12.0, years=5)
        result = calculate_sip(req)
        for proj in result.yearly_projections:
            expected_invested = 5000 * proj.year * 12
            assert proj.invested == pytest.approx(expected_invested, rel=1e-4)

    def test_high_rate_produces_large_gains(self):
        req = SIPCalculatorRequest(monthly_investment=5000, annual_rate=20.0, years=20)
        result = calculate_sip(req)
        # At 20% for 20 years, gains should vastly exceed invested amount
        assert result.projected_wealth_gained > result.total_invested * 5

    def test_decimal_precision_no_float_errors(self):
        """Ensure Decimal arithmetic avoids floating-point drift."""
        req = SIPCalculatorRequest(monthly_investment=1000, annual_rate=8.5, years=3)
        result = calculate_sip(req)
        # Should not raise and maturity should be a reasonable number
        assert 30000 < result.projected_maturity_value < 500000

    def test_save_to_history_false_by_default(self):
        req = SIPCalculatorRequest(monthly_investment=5000, annual_rate=12.0, years=10)
        assert req.save_to_history is False

    @pytest.mark.parametrize("monthly,rate,years", [
        (500, 8.0, 1),
        (100000, 15.0, 40),
        (10000, 0.1, 50),  # near-zero rate
    ])
    def test_edge_cases_dont_raise(self, monthly, rate, years):
        req = SIPCalculatorRequest(monthly_investment=monthly, annual_rate=rate, years=years)
        result = calculate_sip(req)
        assert result.projected_maturity_value >= result.total_invested


class TestLumpsumCalculator:

    def test_basic_lumpsum(self):
        req = LumpsumRequest(principal=100000, annual_rate=10.0, years=10)
        result = calculate_lumpsum(req)
        assert result.projected_maturity_value > result.total_invested
        assert result.total_invested == pytest.approx(100000, rel=1e-4)
        assert len(result.yearly_projections) == 10
        assert result.disclaimer != ""

    def test_compound_formula_correctness(self):
        """₹1 lakh at 10% for 10 years = ₹2,59,374."""
        req = LumpsumRequest(principal=100000, annual_rate=10.0, years=10)
        result = calculate_lumpsum(req)
        assert result.projected_maturity_value == pytest.approx(259374.25, rel=0.001)

    def test_maturity_equals_invested_plus_gained(self):
        req = LumpsumRequest(principal=50000, annual_rate=8.0, years=5)
        result = calculate_lumpsum(req)
        assert result.projected_maturity_value == pytest.approx(
            result.total_invested + result.projected_wealth_gained, rel=1e-4
        )

    def test_inflation_adjusted_lte_nominal(self):
        req = LumpsumRequest(principal=100000, annual_rate=12.0, years=15, inflation_rate=6.0)
        result = calculate_lumpsum(req)
        assert result.inflation_adjusted_projected_value <= result.projected_maturity_value

    def test_zero_inflation_equals_nominal(self):
        req = LumpsumRequest(principal=100000, annual_rate=10.0, years=10, inflation_rate=0.0)
        result = calculate_lumpsum(req)
        assert result.inflation_adjusted_projected_value == pytest.approx(
            result.projected_maturity_value, rel=1e-4
        )

    def test_yearly_projections_monotonically_increasing(self):
        req = LumpsumRequest(principal=200000, annual_rate=10.0, years=20)
        result = calculate_lumpsum(req)
        values = [p.value for p in result.yearly_projections]
        assert values == sorted(values)

    def test_all_projections_have_same_invested(self):
        """For lumpsum, invested is always the principal."""
        req = LumpsumRequest(principal=75000, annual_rate=9.0, years=8)
        result = calculate_lumpsum(req)
        for proj in result.yearly_projections:
            assert proj.invested == pytest.approx(75000, rel=1e-4)
