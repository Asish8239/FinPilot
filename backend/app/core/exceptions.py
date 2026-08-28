"""
Centralised exception hierarchy and FastAPI exception handler.
All errors return a consistent envelope:
  {"error": {"code": "...", "message": "...", "timestamp": "..."}}
"""
from __future__ import annotations

import datetime
import logging

from fastapi import Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


def _ts() -> str:
    return datetime.datetime.utcnow().isoformat() + "Z"


class FinPilotException(Exception):
    """Base application exception."""
    def __init__(self, status_code: int, detail: str, error_code: str) -> None:
        self.status_code = status_code
        self.detail = detail
        self.error_code = error_code
        super().__init__(detail)


class NotFoundError(FinPilotException):
    def __init__(self, resource: str = "Resource") -> None:
        super().__init__(404, f"{resource} not found", "NOT_FOUND")


class UnauthorizedError(FinPilotException):
    def __init__(self, msg: str = "Authentication required") -> None:
        super().__init__(401, msg, "UNAUTHORIZED")


class ForbiddenError(FinPilotException):
    def __init__(self, msg: str = "Insufficient permissions") -> None:
        super().__init__(403, msg, "FORBIDDEN")


class ConflictError(FinPilotException):
    def __init__(self, msg: str = "Resource already exists") -> None:
        super().__init__(409, msg, "CONFLICT")


class ValidationError(FinPilotException):
    def __init__(self, msg: str = "Validation failed") -> None:
        super().__init__(422, msg, "VALIDATION_ERROR")


class RateLimitError(FinPilotException):
    def __init__(self, msg: str = "Rate limit exceeded") -> None:
        super().__init__(429, msg, "RATE_LIMIT")


class FeatureLockedError(FinPilotException):
    def __init__(self, msg: str = "Complete prerequisite content to unlock this feature") -> None:
        super().__init__(403, msg, "FEATURE_LOCKED")


class ServiceUnavailableError(FinPilotException):
    def __init__(self, service: str = "external service") -> None:
        super().__init__(503, f"The {service} is currently unavailable", "SERVICE_UNAVAILABLE")


async def finpilot_exception_handler(
    request: Request, exc: FinPilotException
) -> JSONResponse:
    if exc.status_code >= 500:
        logger.error(
            "Server error [%s] %s %s — %s",
            exc.status_code,
            request.method,
            request.url.path,
            exc.detail,
        )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.error_code,
                "message": exc.detail,
                "timestamp": _ts(),
            }
        },
    )
