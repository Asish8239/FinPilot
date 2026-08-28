"""
Integration tests for the budget planning service.
"""
from __future__ import annotations

import uuid

import pytest

from app.services import budget_service
from app.schemas.budget import (
    CreateBudgetPlanRequest,
    UpdateBudgetPlanRequest,
    BudgetEntryRequest,
    UpdateBudgetEntryRequest,
)
from app.core.exceptions import ConflictError, NotFoundError, ForbiddenError


class TestCreateBudgetPlan:

    async def test_creates_plan_successfully(self, db, student_user):
        req = CreateBudgetPlanRequest(month="2026-08", monthly_income=50000)
        plan = await budget_service.create_plan(db, student_user.id, req)
        assert plan.monthly_income == 50000
        assert str(plan.month) == "2026-08-01"

    async def test_suggested_allocation_50_30_20(self, db, student_user):
        req = CreateBudgetPlanRequest(month="2026-07", monthly_income=100000)
        plan = await budget_service.create_plan(db, student_user.id, req)
        alloc = plan.suggested_allocation
        assert alloc.needs == pytest.approx(50000, rel=1e-4)
        assert alloc.wants == pytest.approx(30000, rel=1e-4)
        assert alloc.savings_investments == pytest.approx(20000, rel=1e-4)

    async def test_duplicate_month_raises_conflict(self, db, student_user):
        req = CreateBudgetPlanRequest(month="2026-06", monthly_income=50000)
        await budget_service.create_plan(db, student_user.id, req)
        with pytest.raises(ConflictError):
            await budget_service.create_plan(db, student_user.id, req)


class TestGetBudgetPlan:

    async def test_get_existing_plan(self, db, student_user):
        req = CreateBudgetPlanRequest(month="2026-05", monthly_income=60000)
        created = await budget_service.create_plan(db, student_user.id, req)
        fetched = await budget_service.get_plan(db, student_user.id, "2026-05")
        assert fetched.id == created.id

    async def test_get_missing_plan_raises_not_found(self, db, student_user):
        with pytest.raises(NotFoundError):
            await budget_service.get_plan(db, student_user.id, "2000-01")


class TestBudgetEntries:

    async def test_add_entry(self, db, student_user):
        plan_req = CreateBudgetPlanRequest(month="2026-04", monthly_income=50000)
        plan = await budget_service.create_plan(db, student_user.id, plan_req)

        entry_req = BudgetEntryRequest(category="needs", label="Rent", budgeted=15000)
        entry = await budget_service.add_entry(db, student_user.id, plan.id, entry_req)

        assert entry.label == "Rent"
        assert entry.budgeted == 15000
        assert entry.actual == 0

    async def test_plan_totals_updated_after_adding_entries(self, db, student_user):
        plan_req = CreateBudgetPlanRequest(month="2026-03", monthly_income=80000)
        plan = await budget_service.create_plan(db, student_user.id, plan_req)

        await budget_service.add_entry(db, student_user.id, plan.id,
                                       BudgetEntryRequest(category="needs", label="Rent", budgeted=20000, actual=20000))
        await budget_service.add_entry(db, student_user.id, plan.id,
                                       BudgetEntryRequest(category="wants", label="Dining", budgeted=5000, actual=3000))

        fetched = await budget_service.get_plan(db, student_user.id, "2026-03")
        assert fetched.total_budgeted == pytest.approx(25000, rel=1e-4)
        assert fetched.total_actual == pytest.approx(23000, rel=1e-4)
        assert fetched.surplus == pytest.approx(80000 - 23000, rel=1e-4)

    async def test_update_entry_actual(self, db, student_user):
        plan_req = CreateBudgetPlanRequest(month="2026-02", monthly_income=50000)
        plan = await budget_service.create_plan(db, student_user.id, plan_req)
        entry = await budget_service.add_entry(db, student_user.id, plan.id,
                                               BudgetEntryRequest(category="savings", label="SIP", budgeted=10000))

        updated = await budget_service.update_entry(
            db, student_user.id, entry.id, UpdateBudgetEntryRequest(actual=10000)
        )
        assert updated.actual == 10000

    async def test_delete_entry(self, db, student_user):
        plan_req = CreateBudgetPlanRequest(month="2026-01", monthly_income=50000)
        plan = await budget_service.create_plan(db, student_user.id, plan_req)
        entry = await budget_service.add_entry(db, student_user.id, plan.id,
                                               BudgetEntryRequest(category="wants", label="Netflix", budgeted=500))

        await budget_service.delete_entry(db, student_user.id, entry.id)

        fetched = await budget_service.get_plan(db, student_user.id, "2026-01")
        assert len(fetched.entries) == 0

    async def test_forbidden_to_update_other_user_entry(self, db, student_user, admin_user):
        plan_req = CreateBudgetPlanRequest(month="2025-12", monthly_income=50000)
        plan = await budget_service.create_plan(db, student_user.id, plan_req)
        entry = await budget_service.add_entry(db, student_user.id, plan.id,
                                               BudgetEntryRequest(category="needs", label="Rent", budgeted=10000))
        with pytest.raises(ForbiddenError):
            await budget_service.update_entry(
                db, admin_user.id, entry.id, UpdateBudgetEntryRequest(actual=500)
            )
