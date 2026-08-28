"""
FinPilot AI — FastAPI application factory.
"""
from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import check_db_health
from app.core.exceptions import FinPilotException, finpilot_exception_handler
from app.core.logging_config import configure_logging
from app.core.middleware import RequestMiddleware
from app.api.v1 import router as api_v1_router

configure_logging()
logger = logging.getLogger("finpilot")


def create_app() -> FastAPI:
    app = FastAPI(
        title="FinPilot AI",
        description=(
            "AI-powered personal finance education platform. "
            "Teaches SIPs, mutual funds, budgeting, and more."
        ),
        version=settings.APP_VERSION,
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
        openapi_url="/openapi.json" if not settings.is_production else None,
    )

    # ── Middleware ─────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "X-Response-Time"],
    )
    app.add_middleware(RequestMiddleware)

    # ── Exception handlers ────────────────────────────────────────────────────
    app.add_exception_handler(FinPilotException, finpilot_exception_handler)  # type: ignore[arg-type]

    # ── Routers ────────────────────────────────────────────────────────────────
    app.include_router(api_v1_router, prefix="/api/v1")

    # ── Health endpoint ────────────────────────────────────────────────────────
    @app.get("/health", tags=["infrastructure"], summary="Health check")
    async def health_check() -> dict:
        db_ok = await check_db_health()
        status = "ok" if db_ok else "degraded"
        return {
            "status": status,
            "version": settings.APP_VERSION,
            "env": settings.APP_ENV,
            "database": "ok" if db_ok else "unreachable",
            "groq_configured": settings.groq_configured,
        }

    @app.on_event("startup")
    async def _startup() -> None:
        logger.info(
            "FinPilot AI starting — env=%s groq=%s",
            settings.APP_ENV,
            "configured" if settings.groq_configured else "NOT CONFIGURED (AI tutor will use fallback)",
        )

    return app


app = create_app()
