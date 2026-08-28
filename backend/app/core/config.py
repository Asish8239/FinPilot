"""
Application configuration via pydantic-settings.
All secrets must be supplied through environment variables or a .env file.
Never hardcode secrets here.
"""
from __future__ import annotations

import logging
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── App ───────────────────────────────────────────────────────────────────
    APP_ENV: str = "production"
    APP_VERSION: str = "1.0.0"
    SECRET_KEY: str = ""
    CORS_ORIGINS: str = ""
    LOG_LEVEL: str = "INFO"

    # ── Database ──────────────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@db.PROJECT.supabase.co:5432/postgres"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    # ── Supabase ──────────────────────────────────────────────────────────────
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""

    # ── OpenAI ────────────────────────────────────────────────────────────────
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_MAX_TOKENS: int = 1024
    OPENAI_TEMPERATURE: float = 0.7

    # ── Groq ──────────────────────────────────────────────────────────────────
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "mixtral-8x7b-32768"
    GROQ_MAX_TOKENS: int = 1024
    GROQ_TEMPERATURE: float = 0.7

    # ── Redis ─────────────────────────────────────────────────────────────────
    REDIS_URL: str = ""
    REDIS_ENABLED: bool = False  # Gracefully disabled when Redis is unavailable

    # ── Rate limits ───────────────────────────────────────────────────────────
    AI_RATE_LIMIT_PER_HOUR: int = 30
    QUIZ_MAX_ATTEMPTS_DEFAULT: int = 3

    # ── Alpha Vantage (Market Data) ───────────────────────────────────────────
    ALPHA_VANTAGE_API_KEY: str = ""
    ALPHA_VANTAGE_BASE_URL: str = "https://www.alphavantage.co/query"
    ALPHA_VANTAGE_TIMEOUT: int = 30  # seconds

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    @property
    def openai_configured(self) -> bool:
        return bool(self.OPENAI_API_KEY)

    @property
    def groq_configured(self) -> bool:
        return bool(self.GROQ_API_KEY)

    @property
    def alpha_vantage_configured(self) -> bool:
        return bool(self.ALPHA_VANTAGE_API_KEY)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
