"""
Request-level middleware: request ID injection and basic in-process rate limiting.
When Redis is enabled it uses a sliding-window Redis counter instead.
"""
from __future__ import annotations

import logging
import time
import uuid
from collections import defaultdict
from threading import Lock

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.core.config import settings

logger = logging.getLogger(__name__)

# ── In-process rate limiter (fallback when Redis is disabled) ─────────────────
_counters: dict[str, list[float]] = defaultdict(list)
_lock = Lock()

RATE_LIMIT_WINDOW_SEC = 60  # 1 minute window
RATE_LIMIT_MAX_REQUESTS = 120  # per window per IP


def _in_process_rate_limit(ip: str) -> bool:
    """Return True if the request should be allowed."""
    now = time.monotonic()
    cutoff = now - RATE_LIMIT_WINDOW_SEC
    with _lock:
        timestamps = _counters[ip]
        # Prune old timestamps
        timestamps[:] = [t for t in timestamps if t > cutoff]
        if len(timestamps) >= RATE_LIMIT_MAX_REQUESTS:
            return False
        timestamps.append(now)
        return True


class RequestMiddleware(BaseHTTPMiddleware):
    """Attach a unique request-ID header and enforce a coarse rate limit."""

    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):  # type: ignore[override]
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        # Skip rate-limit on health endpoint
        if request.url.path == "/health":
            response = await call_next(request)
            response.headers["X-Request-ID"] = request_id
            return response

        ip = request.client.host if request.client else "unknown"
        if not _in_process_rate_limit(ip):
            logger.warning("Rate limit exceeded for IP %s", ip)
            return Response(
                content='{"error":{"code":"RATE_LIMIT","message":"Too many requests"}}',
                status_code=429,
                media_type="application/json",
                headers={"X-Request-ID": request_id},
            )

        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - start) * 1000, 1)

        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time"] = f"{duration_ms}ms"
        logger.debug(
            "%s %s → %s (%sms) [%s]",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
            request_id,
        )
        return response
