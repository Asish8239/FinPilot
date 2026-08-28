"""
AI Provider abstraction layer.

Supports multiple AI providers (OpenAI, Groq) with a unified interface.
This allows easy switching between providers or using multiple providers
simultaneously.
"""
from __future__ import annotations

import json
import logging
from abc import ABC, abstractmethod
from typing import AsyncGenerator

from app.core.config import settings

logger = logging.getLogger(__name__)


class AIProvider(ABC):
    """Abstract base class for AI providers."""

    @abstractmethod
    async def stream_message(
        self,
        messages: list[dict],
        system_prompt: str,
    ) -> AsyncGenerator[str, None]:
        """
        Stream a message response as SSE.

        Args:
            messages: List of message dicts with 'role' and 'content'.
            system_prompt: System message content.

        Yields:
            SSE formatted strings.
        """
        pass


class OpenAIProvider(AIProvider):
    """OpenAI implementation of AIProvider."""

    def __init__(self):
        """Initialize OpenAI provider."""
        self.client = None
        self.model = settings.OPENAI_MODEL
        self.temperature = settings.OPENAI_TEMPERATURE
        self.max_tokens = settings.OPENAI_MAX_TOKENS

    def initialize_client(self) -> bool:
        """Initialize OpenAI client."""
        try:
            from openai import AsyncOpenAI

            if not settings.openai_configured:
                return False

            self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            logger.info("OpenAI client initialized with model %s", self.model)
            return True

        except ImportError:
            logger.error("openai package not installed")
            return False
        except Exception as e:
            logger.error("Failed to initialize OpenAI client: %s", e)
            return False

    async def stream_message(
        self,
        messages: list[dict],
        system_prompt: str,
    ) -> AsyncGenerator[str, None]:
        """Stream message from OpenAI API."""
        if self.client is None:
            if not self.initialize_client():
                error_msg = "OpenAI is not configured."
                logger.warning(error_msg)
                yield f"data: {json.dumps({'error': error_msg})}\n\n"
                yield "data: [DONE]\n\n"
                return

        message_list = [{"role": "system", "content": system_prompt}]
        message_list.extend(messages)

        try:
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=message_list,
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                stream=True,
            )

            async for chunk in stream:
                delta = chunk.choices[0].delta.content or ""
                if delta:
                    yield f"data: {json.dumps({'token': delta})}\n\n"

        except Exception as exc:
            logger.error("OpenAI streaming error: %s", exc)
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"

        finally:
            yield "data: [DONE]\n\n"


class GroqProvider(AIProvider):
    """Groq implementation of AIProvider."""

    def __init__(self):
        """Initialize Groq provider."""
        self.client = None
        self.model = settings.GROQ_MODEL
        self.temperature = settings.GROQ_TEMPERATURE
        self.max_tokens = settings.GROQ_MAX_TOKENS

    def initialize_client(self) -> bool:
        """Initialize Groq client."""
        try:
            from groq import Groq

            if not settings.groq_configured:
                return False

            self.client = Groq(api_key=settings.GROQ_API_KEY)
            logger.info("Groq client initialized with model %s", self.model)
            return True

        except ImportError:
            logger.error("groq package not installed")
            return False
        except Exception as e:
            logger.error("Failed to initialize Groq client: %s", e)
            return False

    async def stream_message(
        self,
        messages: list[dict],
        system_prompt: str,
    ) -> AsyncGenerator[str, None]:
        """Stream message from Groq API."""
        if self.client is None:
            if not self.initialize_client():
                error_msg = "Groq is not configured."
                logger.warning(error_msg)
                yield f"data: {json.dumps({'error': error_msg})}\n\n"
                yield "data: [DONE]\n\n"
                return

        message_list = [{"role": "system", "content": system_prompt}]
        message_list.extend(messages)

        try:
            stream = self.client.chat.completions.create(
                model=self.model,
                messages=message_list,
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                stream=True,
            )

            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    token = chunk.choices[0].delta.content
                    if token:
                        yield f"data: {json.dumps({'token': token})}\n\n"

        except Exception as exc:
            logger.error("Groq streaming error: %s", exc)
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"

        finally:
            yield "data: [DONE]\n\n"


def get_provider(provider_name: str = "openai") -> AIProvider | None:
    """
    Get an AI provider by name.

    Args:
        provider_name: Name of provider ("openai" or "groq")

    Returns:
        Provider instance or None if not configured.
    """
    if provider_name == "groq":
        provider = GroqProvider()
        if not settings.groq_configured:
            logger.warning("Groq provider requested but not configured")
            return None
        if not provider.initialize_client():
            return None
        return provider

    elif provider_name == "openai":
        provider = OpenAIProvider()
        if not settings.openai_configured:
            logger.warning("OpenAI provider requested but not configured")
            return None
        if not provider.initialize_client():
            return None
        return provider

    else:
        logger.warning("Unknown provider: %s", provider_name)
        return None


def get_default_provider() -> AIProvider | None:
    """
    Get the default configured provider (Groq if available, else OpenAI).

    Returns:
        Provider instance or None if neither is configured.
    """
    # Try Groq first (faster, cheaper)
    if settings.groq_configured:
        provider = get_provider("groq")
        if provider:
            logger.info("Using Groq as default provider")
            return provider

    # Fall back to OpenAI
    if settings.openai_configured:
        provider = get_provider("openai")
        if provider:
            logger.info("Using OpenAI as default provider")
            return provider

    logger.warning("No AI provider configured")
    return None
