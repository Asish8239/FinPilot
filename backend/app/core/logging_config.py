"""
Structured logging configuration for FinPilot AI backend.
"""
from __future__ import annotations

import logging
import sys
from app.core.config import settings


def configure_logging() -> None:
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    fmt = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    if settings.is_production:
        # Compact format for log aggregators in production
        fmt = "%(levelname)s %(name)s %(message)s"

    logging.basicConfig(
        level=log_level,
        format=fmt,
        datefmt="%Y-%m-%dT%H:%M:%S",
        stream=sys.stdout,
    )

    # Suppress noisy third-party loggers in production
    if settings.is_production:
        logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
        logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    else:
        logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

    logging.getLogger("httpx").setLevel(logging.WARNING)


logger = logging.getLogger("finpilot")
