"""
Auth routes — preserved for backward compatibility but NOT used for anonymous operation.

FinPilot is an anonymous application. No login or signup required.
These routes exist as stubs so existing imports don't break during migration.
"""
from __future__ import annotations

from fastapi import APIRouter

router = APIRouter()


@router.get("/status", summary="Auth status (always anonymous)")
async def auth_status() -> dict:
    """Returns that the app is operating in anonymous mode."""
    return {"mode": "anonymous", "authentication": "not_required"}
