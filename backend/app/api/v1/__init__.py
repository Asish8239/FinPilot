"""
FinPilot API v1 router.

All version 1 API endpoints are registered here.
"""

from fastapi import APIRouter

from app.api.v1.admin import router as admin_router
from app.api.v1.ai_tutor import router as ai_tutor_router
from app.api.v1.auth import router as auth_router
from app.api.v1.budget import router as budget_router
from app.api.v1.calculator import router as calculator_router
from app.api.v1.financial_goals import router as financial_goals_router
from app.api.v1.financial_health import router as financial_health_router
from app.api.v1.lessons import router as lessons_router
from app.api.v1.knowledge import router as knowledge_router
from app.api.v1.markets import router as markets_router
from app.api.v1.modules import router as modules_router
from app.api.v1.progress import router as progress_router
from app.api.v1.quiz import router as quiz_router
from app.api.v1.watchlist import router as watchlist_router


router = APIRouter()


# ---------------------------------------------------------------------------
# AUTH
# ---------------------------------------------------------------------------

router.include_router(
    auth_router,
    prefix="/auth",
    tags=["Authentication"],
)


# ---------------------------------------------------------------------------
# ADMIN
# ---------------------------------------------------------------------------

router.include_router(
    admin_router,
    prefix="/admin",
    tags=["Admin"],
)


# ---------------------------------------------------------------------------
# LEARNING MODULES
# ---------------------------------------------------------------------------

router.include_router(
    modules_router,
    prefix="/modules",
    tags=["Modules"],
)


# ---------------------------------------------------------------------------
# LESSONS
# ---------------------------------------------------------------------------

router.include_router(
    lessons_router,
    prefix="/lessons",
    tags=["Lessons"],
)


# ---------------------------------------------------------------------------
# GLOBAL FINANCIAL KNOWLEDGE
# ---------------------------------------------------------------------------

router.include_router(
    knowledge_router,
    prefix="/knowledge",
    tags=["Knowledge"],
)


# ---------------------------------------------------------------------------
# QUIZZES
# ---------------------------------------------------------------------------

router.include_router(
    quiz_router,
    prefix="/quizzes",
    tags=["Quizzes"],
)


# ---------------------------------------------------------------------------
# PROGRESS
# ---------------------------------------------------------------------------

router.include_router(
    progress_router,
    prefix="/progress",
    tags=["Progress"],
)


# ---------------------------------------------------------------------------
# AI TUTOR
# ---------------------------------------------------------------------------

router.include_router(
    ai_tutor_router,
    prefix="/tutor",
    tags=["AI Tutor"],
)


# ---------------------------------------------------------------------------
# CALCULATOR
# ---------------------------------------------------------------------------

router.include_router(
    calculator_router,
    prefix="/calculator",
    tags=["Calculator"],
)


# ---------------------------------------------------------------------------
# BUDGET
# ---------------------------------------------------------------------------

router.include_router(
    budget_router,
    prefix="/budget",
    tags=["Budget"],
)


# ---------------------------------------------------------------------------
# FINANCIAL HEALTH
# ---------------------------------------------------------------------------

router.include_router(
    financial_health_router,
    prefix="/financial-health",
    tags=["Financial Health"],
)


# ---------------------------------------------------------------------------
# FINANCIAL GOALS
# ---------------------------------------------------------------------------

router.include_router(
    financial_goals_router,
    prefix="/goals",
    tags=["Financial Goals"],
)


# ---------------------------------------------------------------------------
# WATCHLIST
# ---------------------------------------------------------------------------

router.include_router(
    watchlist_router,
    prefix="/watchlist",
    tags=["Watchlist"],
)


# ---------------------------------------------------------------------------
# MARKETS
# ---------------------------------------------------------------------------

router.include_router(
    markets_router,
    prefix="/markets",
    tags=["Markets"],
)