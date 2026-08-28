"""
Unit tests for streak computation, XP level calculation, and budget allocation.
Pure-function tests — no database required.
"""
from __future__ import annotations

from datetime import date, timedelta

import pytest

from app.services.progress_service import compute_level, compute_streak, xp_to_next_level
from app.services.budget_service import compute_allocation


class TestComputeStreak:

    def test_first_activity_ever(self):
        new_streak, updated = compute_streak(None, 0)
        assert new_streak == 1
        assert updated is True

    def test_consecutive_day_extends_streak(self):
        yesterday = date.today() - timedelta(days=1)
        new_streak, updated = compute_streak(yesterday, 5)
        assert new_streak == 6
        assert updated is True

    def test_same_day_idempotent(self):
        """Calling twice on the same day must not double-count."""
        today = date.today()
        new_streak, updated = compute_streak(today, 3)
        assert new_streak == 3
        assert updated is False

    def test_gap_resets_streak(self):
        """Two days ago breaks the streak — restart at 1."""
        two_days_ago = date.today() - timedelta(days=2)
        new_streak, updated = compute_streak(two_days_ago, 10)
        assert new_streak == 1
        assert updated is True

    def test_week_gap_resets_streak(self):
        week_ago = date.today() - timedelta(days=7)
        new_streak, updated = compute_streak(week_ago, 42)
        assert new_streak == 1
        assert updated is True

    @pytest.mark.parametrize("days_back,expected_streak", [
        (0, 5),   # same day — no change
        (1, 6),   # yesterday — extend
        (2, 1),   # gap — reset
        (10, 1),  # big gap — reset
    ])
    def test_parametrized_streak_scenarios(self, days_back, expected_streak):
        activity_date = date.today() - timedelta(days=days_back)
        new_streak, _ = compute_streak(activity_date, 5)
        assert new_streak == expected_streak


class TestComputeLevel:

    def test_level_1_at_zero_xp(self):
        assert compute_level(0) == 1

    def test_level_1_at_99_xp(self):
        assert compute_level(99) == 1

    def test_level_2_at_100_xp(self):
        assert compute_level(100) == 2

    def test_level_2_at_299_xp(self):
        assert compute_level(299) == 2

    def test_level_3_at_300_xp(self):
        assert compute_level(300) == 3

    def test_level_4_at_600_xp(self):
        assert compute_level(600) == 4

    def test_level_5_at_1000_xp(self):
        assert compute_level(1000) == 5

    def test_level_never_below_1(self):
        assert compute_level(0) >= 1

    def test_xp_to_next_level_positive(self):
        assert xp_to_next_level(0) > 0
        assert xp_to_next_level(99) > 0
        assert xp_to_next_level(100) > 0

    def test_xp_to_next_level_decreases_as_xp_increases(self):
        """Within the same level band, XP-to-next decreases as XP increases."""
        assert xp_to_next_level(0) > xp_to_next_level(50)
        assert xp_to_next_level(100) > xp_to_next_level(150)


class TestBudgetAllocation:

    def test_50_30_20_split(self):
        alloc = compute_allocation(100000)
        assert alloc.needs == pytest.approx(50000, rel=1e-4)
        assert alloc.wants == pytest.approx(30000, rel=1e-4)
        assert alloc.savings_investments == pytest.approx(20000, rel=1e-4)

    def test_sum_equals_income(self):
        """Invariant: needs + wants + savings == income (no rupee unaccounted)."""
        income = 73456.78
        alloc = compute_allocation(income)
        total = alloc.needs + alloc.wants + alloc.savings_investments
        assert total == pytest.approx(income, rel=1e-6)

    def test_sum_equals_income_round_number(self):
        income = 50000.0
        alloc = compute_allocation(income)
        total = alloc.needs + alloc.wants + alloc.savings_investments
        assert total == pytest.approx(income, rel=1e-6)

    @pytest.mark.parametrize("income", [10000, 25000, 50000, 100000, 250000, 1_000_000])
    def test_completeness_across_incomes(self, income):
        alloc = compute_allocation(float(income))
        total = alloc.needs + alloc.wants + alloc.savings_investments
        assert total == pytest.approx(float(income), rel=1e-6)

    def test_allocation_proportions(self):
        alloc = compute_allocation(80000)
        assert alloc.needs == pytest.approx(40000, rel=1e-4)
        assert alloc.wants == pytest.approx(24000, rel=1e-4)
        # savings absorbs rounding residual — but should be near 20%
        assert alloc.savings_investments == pytest.approx(16000, abs=1.0)
