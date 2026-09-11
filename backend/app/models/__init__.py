"""
Import all ORM models so that:
  1. Alembic autogenerate can discover every table.
  2. SQLAlchemy relationship resolution works without circular imports.
"""
from app.models.user import User
from app.models.learning import Module, Lesson
from app.models.quiz import Quiz, Question, UserQuizAttempt
from app.models.progress import UserProgress, UserXP, Streak, Badge, UserBadge
from app.models.ai_tutor import AIConversation, AIMessage
from app.models.budget import BudgetPlan, BudgetEntry
from app.models.calculator import CalculatorHistory
from app.models.watchlist import WatchlistItem

__all__ = [
    "User",
    "Module",
    "Lesson",
    "Quiz",
    "Question",
    "UserQuizAttempt",
    "UserProgress",
    "UserXP",
    "Streak",
    "Badge",
    "UserBadge",
    "AIConversation",
    "AIMessage",
    "BudgetPlan",
    "BudgetEntry",
    "CalculatorHistory",
    "WatchlistItem",
]

