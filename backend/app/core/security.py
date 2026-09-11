"""
Authentication and security utilities for FinPilot.

Supabase Auth remains the source of truth for authenticated identity.

Anonymous users continue to use X-Session-ID through app/core/anonymous.py.
Authenticated requests use:

    Authorization: Bearer <Supabase access token>

The backend validates the access token against Supabase Auth before
trusting the authenticated user's identity.
"""

from __future__ import annotations

from dataclasses import dataclass

import httpx
from fastapi import Depends, Header, HTTPException, status

from app.core.config import settings


@dataclass(frozen=True)
class AuthenticatedIdentity:
    """
    Verified identity extracted from a Supabase access token.
    """

    supabase_uid: str
    email: str | None
    role: str | None
    raw_user: dict


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def _extract_bearer_token(
    authorization: str | None = Header(default=None),
) -> str:
    """
    Extract a Bearer token from the Authorization header.
    """

    if not authorization:
        raise _unauthorized("Authentication required.")

    scheme, _, token = authorization.partition(" ")

    if scheme.lower() != "bearer" or not token.strip():
        raise _unauthorized("Invalid Authorization header.")

    return token.strip()


async def verify_supabase_access_token(
    token: str,
) -> AuthenticatedIdentity:
    """
    Validate a Supabase access token through Supabase Auth.

    We intentionally validate against the Auth server rather than
    assuming a legacy HS256 JWT secret. This keeps the backend compatible
    with Supabase's current signing-key model.
    """

    if not settings.SUPABASE_URL:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase authentication is not configured.",
        )

    if not settings.SUPABASE_SERVICE_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase server authentication is not configured.",
        )

    url = (
        f"{settings.SUPABASE_URL.rstrip('/')}"
        "/auth/v1/user"
    )

    headers = {
        "apikey": settings.SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {token}",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                url,
                headers=headers,
            )
    except httpx.RequestError as exc:
        print(
            "SUPABASE AUTH NETWORK ERROR:",
            repr(exc),
        )

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to reach the authentication service.",
        ) from exc

    if response.status_code != 200:
        print(
            "SUPABASE AUTH VALIDATION FAILED:",
            {
                "status_code": response.status_code,
                "response_body": response.text[:1000],
            },
        )

        raise _unauthorized(
            "Invalid or expired authentication token."
        )

    try:
        user_data = response.json()
    except ValueError as exc:
        print(
            "SUPABASE AUTH INVALID JSON:",
            response.text[:1000],
        )

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Authentication service returned an invalid response.",
        ) from exc

    supabase_uid = user_data.get("id")

    if not isinstance(supabase_uid, str) or not supabase_uid.strip():
        raise _unauthorized(
            "Authenticated user identity is missing."
        )

    email = user_data.get("email")
    if not isinstance(email, str):
        email = None

    role = user_data.get("role")
    if not isinstance(role, str):
        role = None

    return AuthenticatedIdentity(
        supabase_uid=supabase_uid,
        email=email,
        role=role,
        raw_user=user_data,
    )


async def get_authenticated_identity(
    token: str = Depends(_extract_bearer_token),
) -> AuthenticatedIdentity:
    """
    FastAPI dependency for routes that require authentication.
    """

    return await verify_supabase_access_token(token)