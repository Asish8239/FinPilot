"""
Groq AI provider service.

Provides a compatible interface with the OpenAI service for streaming responses.
Uses the Groq API for fast, cost-effective inference.

Security guarantees:
  - GROQ_API_KEY is read server-side only; it never reaches the browser.
  - Missing or empty API key produces a graceful degraded response instead of a crash.
  - Rate limit is enforced by Groq (free tier: 30 requests/minute).
  - Streaming responses are formatted as Server-Sent Events (SSE).

Model options:
  - mixtral-8x7b-32768: 8x7B MoE model with 32k context (default)
  - llama-2-70b-chat: 70B parameter model optimized for chat
  - llama2-70b: General purpose 70B model
"""
from __future__ import annotations

import json
import logging
from typing import AsyncGenerator

from app.core.config import settings

logger = logging.getLogger(__name__)

# ── Groq client (lazy-initialised so the app starts even without a key) ─────
_groq_client = None


def _get_groq_client():
    """Lazily initialize and return Groq client, or None if not configured."""
    global _groq_client
    if _groq_client is None:
        if not settings.groq_configured:
            return None
        try:
            from groq import Groq
            _groq_client = Groq(api_key=settings.GROQ_API_KEY)
        except ImportError:
            logger.error("groq package not installed — Groq provider disabled")
            return None
    return _groq_client


class GroqProvider:
    """
    Groq AI provider with SSE streaming interface compatible with OpenAI service.
    """

    def __init__(self):
        """Initialize Groq provider."""
        self.client = None
        self.model = settings.GROQ_MODEL
        self.temperature = settings.GROQ_TEMPERATURE
        self.max_tokens = settings.GROQ_MAX_TOKENS

    def initialize_client(self, api_key: str | None = None) -> bool:
        """
        Initialize Groq client with optional API key override.

        Args:
            api_key: Optional API key. Uses settings.GROQ_API_KEY if not provided.

        Returns:
            True if client initialized successfully, False otherwise.
        """
        try:
            from groq import Groq

            key = api_key or settings.GROQ_API_KEY
            if not key:
                logger.warning("Groq API key not configured")
                return False

            self.client = Groq(api_key=key)
            logger.info("Groq client initialized with model %s", self.model)
            return True

        except ImportError:
            logger.error("groq package not installed")
            return False
        except Exception as e:
            logger.error("Failed to initialize Groq client: %s", e)
            return False

    def format_system_prompt(
        self,
        base_prompt: str,
        user_name: str | None = None,
        user_level: str | None = None,
        lesson_title: str | None = None,
    ) -> str:
        """
        Format system prompt with user context.

        Args:
            base_prompt: Base system prompt template
            user_name: User's display name
            user_level: User's learning level (beginner/intermediate/advanced)
            lesson_title: Current lesson title

        Returns:
            Formatted system prompt string.
        """
        return base_prompt.format(
            user_name=user_name or "there",
            user_level=user_level or "beginner",
            lesson_title=lesson_title or "General Finance",
        )

    async def stream_message(
        self,
        messages: list[dict],
        system_prompt: str,
    ) -> AsyncGenerator[str, None]:
        """
        Stream chat completion from Groq API as Server-Sent Events.

        Args:
            messages: List of message dicts with 'role' and 'content' keys.
            system_prompt: System message content.

        Yields:
            SSE formatted strings:
              - data: {"token": "<chunk>"}\n\n for tokens
              - data: {"error": "<msg>"}\n\n on error
              - data: [DONE]\n\n at end of stream
        """
        # Initialize client if needed
        if self.client is None:
            if not self.initialize_client():
                error_msg = (
                    "Groq API is not configured. "
                    "Please ensure GROQ_API_KEY environment variable is set."
                )
                logger.warning(error_msg)
                yield f"data: {json.dumps({'error': error_msg})}\n\n"
                yield "data: [DONE]\n\n"
                return

        # Build message list with system prompt
        message_list = [{"role": "system", "content": system_prompt}]
        message_list.extend(messages)

        full_response = ""
        try:
            # Create streaming chat completion
            stream = self.client.chat.completions.create(
                model=self.model,
                messages=message_list,
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                stream=True,
            )

            # Stream tokens
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    token = chunk.choices[0].delta.content
                    full_response += token
                    yield f"data: {json.dumps({'token': token})}\n\n"

        except Exception as exc:
            logger.error("Groq streaming error: %s", exc)
            error_msg = (
                "I encountered an error while generating a response. "
                "Please try again in a moment."
            )
            yield f"data: {json.dumps({'error': error_msg})}\n\n"

        finally:
            yield "data: [DONE]\n\n"

    def parse_streaming_response(self, response_stream) -> dict:
        """
        Parse streaming response from Groq API.

        This is a utility method for non-streaming consumption.
        Groq SDK already handles streaming properly.

        Args:
            response_stream: Streaming response object from Groq API.

        Returns:
            Dict with 'content' (full text) and 'finish_reason'.
        """
        content = ""
        finish_reason = None

        try:
            for chunk in response_stream:
                if chunk.choices[0].delta.content:
                    content += chunk.choices[0].delta.content
                if chunk.choices[0].finish_reason:
                    finish_reason = chunk.choices[0].finish_reason
        except Exception as e:
            logger.error("Error parsing Groq response: %s", e)
            return {"content": content, "finish_reason": "error", "error": str(e)}

        return {
            "content": content,
            "finish_reason": finish_reason,
            "error": None,
        }


# ── Helper function for direct streaming (stateless) ────────────────────────

async def stream_groq_message(
    messages: list[dict],
    system_prompt: str,
    model: str | None = None,
    temperature: float | None = None,
    max_tokens: int | None = None,
) -> AsyncGenerator[str, None]:
    """
    Stateless helper to stream a Groq response.

    Args:
        messages: List of message dicts.
        system_prompt: System message.
        model: Optional model override (default: settings.GROQ_MODEL).
        temperature: Optional temperature override.
        max_tokens: Optional max_tokens override.

    Yields:
        SSE formatted strings.
    """
    provider = GroqProvider()
    if model:
        provider.model = model
    if temperature is not None:
        provider.temperature = temperature
    if max_tokens is not None:
        provider.max_tokens = max_tokens

    async for chunk in provider.stream_message(messages, system_prompt):
        yield chunk
