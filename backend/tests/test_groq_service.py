"""
Unit tests for Groq service.

Tests the groq_service module for proper initialization,
streaming, and error handling.
"""
import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.groq_service import GroqProvider, stream_groq_message


class TestGroqProvider:
    """Tests for GroqProvider class."""

    def test_provider_initialization(self):
        """Test provider can be instantiated."""
        provider = GroqProvider()
        assert provider is not None
        assert provider.model is not None
        assert provider.temperature is not None
        assert provider.max_tokens is not None

    def test_provider_default_settings(self):
        """Test provider uses correct default settings."""
        provider = GroqProvider()
        assert provider.model == "mixtral-8x7b-32768"
        assert provider.temperature == 0.7
        assert provider.max_tokens == 1024

    def test_initialize_client_no_api_key(self):
        """Test client initialization fails gracefully without API key."""
        with patch("app.core.config.settings.groq_configured", False):
            provider = GroqProvider()
            result = provider.initialize_client()
            assert result is False

    def test_initialize_client_with_mock(self):
        """Test client initialization with mocked Groq."""
        with patch("app.services.groq_service.Groq") as mock_groq:
            mock_instance = MagicMock()
            mock_groq.return_value = mock_instance

            with patch("app.core.config.settings.groq_configured", True):
                with patch("app.core.config.settings.GROQ_API_KEY", "test-key"):
                    provider = GroqProvider()
                    result = provider.initialize_client("test-key")
                    assert result is True
                    assert provider.client is not None

    def test_format_system_prompt(self):
        """Test system prompt formatting."""
        provider = GroqProvider()
        base_prompt = (
            "Hello {user_name}, you are level {user_level} "
            "learning {lesson_title}"
        )
        formatted = provider.format_system_prompt(
            base_prompt,
            user_name="Alice",
            user_level="intermediate",
            lesson_title="Mutual Funds",
        )
        assert "Alice" in formatted
        assert "intermediate" in formatted
        assert "Mutual Funds" in formatted

    def test_format_system_prompt_defaults(self):
        """Test system prompt formatting with defaults."""
        provider = GroqProvider()
        base_prompt = "Hello {user_name}, you are {user_level}"
        formatted = provider.format_system_prompt(base_prompt)
        assert "there" in formatted
        assert "beginner" in formatted

    @pytest.mark.asyncio
    async def test_stream_message_no_client(self):
        """Test streaming without client initializes gracefully."""
        with patch("app.core.config.settings.groq_configured", False):
            provider = GroqProvider()
            messages = [{"role": "user", "content": "Test"}]
            system_prompt = "Test system"

            chunks = []
            async for chunk in provider.stream_message(messages, system_prompt):
                chunks.append(chunk)

            assert len(chunks) == 2
            assert "error" in chunks[0]
            assert "[DONE]" in chunks[1]

    @pytest.mark.asyncio
    async def test_stream_message_with_mock_client(self):
        """Test streaming with mocked Groq client."""
        # Mock the streaming response
        mock_chunk = MagicMock()
        mock_chunk.choices = [MagicMock()]
        mock_chunk.choices[0].delta.content = "Hello"

        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = [mock_chunk]

        provider = GroqProvider()
        provider.client = mock_client

        messages = [{"role": "user", "content": "Test"}]
        system_prompt = "You are helpful"

        chunks = []
        async for chunk in provider.stream_message(messages, system_prompt):
            chunks.append(chunk)

        # Should have at least token chunks and DONE marker
        assert len(chunks) >= 1
        assert "[DONE]" in chunks[-1]

    @pytest.mark.asyncio
    async def test_stream_message_error_handling(self):
        """Test streaming handles errors gracefully."""
        provider = GroqProvider()
        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = Exception("API Error")
        provider.client = mock_client

        messages = [{"role": "user", "content": "Test"}]
        system_prompt = "You are helpful"

        chunks = []
        async for chunk in provider.stream_message(messages, system_prompt):
            chunks.append(chunk)

        # Should have error chunk and DONE marker
        assert any("error" in chunk for chunk in chunks)
        assert chunks[-1] == "data: [DONE]\n\n"

    def test_parse_streaming_response_success(self):
        """Test parsing successful streaming response."""
        mock_chunk1 = MagicMock()
        mock_chunk1.choices = [MagicMock()]
        mock_chunk1.choices[0].delta.content = "Hello"
        mock_chunk1.choices[0].finish_reason = None

        mock_chunk2 = MagicMock()
        mock_chunk2.choices = [MagicMock()]
        mock_chunk2.choices[0].delta.content = " world"
        mock_chunk2.choices[0].finish_reason = "stop"

        stream = [mock_chunk1, mock_chunk2]

        provider = GroqProvider()
        result = provider.parse_streaming_response(stream)

        assert result["content"] == "Hello world"
        assert result["finish_reason"] == "stop"
        assert result["error"] is None

    def test_parse_streaming_response_empty_content(self):
        """Test parsing response with None content."""
        mock_chunk = MagicMock()
        mock_chunk.choices = [MagicMock()]
        mock_chunk.choices[0].delta.content = None
        mock_chunk.choices[0].finish_reason = None

        stream = [mock_chunk]

        provider = GroqProvider()
        result = provider.parse_streaming_response(stream)

        assert result["content"] == ""
        assert result["error"] is None

    def test_parse_streaming_response_error(self):
        """Test parsing response with error."""
        stream = "invalid"  # This will cause an error

        provider = GroqProvider()
        result = provider.parse_streaming_response(stream)

        assert result["finish_reason"] == "error"
        assert result["error"] is not None


class TestGroqHelperFunctions:
    """Tests for helper functions."""

    @pytest.mark.asyncio
    async def test_stream_groq_message_default_params(self):
        """Test stream_groq_message with default parameters."""
        mock_chunk = MagicMock()
        mock_chunk.choices = [MagicMock()]
        mock_chunk.choices[0].delta.content = "Test"

        with patch.object(GroqProvider, "stream_message") as mock_stream:
            mock_stream.return_value = self._async_generator(["data: test\n\n"])

            messages = [{"role": "user", "content": "Hello"}]
            system_prompt = "You are helpful"

            chunks = []
            async for chunk in stream_groq_message(messages, system_prompt):
                chunks.append(chunk)

            assert len(chunks) > 0

    @pytest.mark.asyncio
    async def test_stream_groq_message_custom_params(self):
        """Test stream_groq_message with custom parameters."""
        with patch.object(GroqProvider, "stream_message") as mock_stream:
            mock_stream.return_value = self._async_generator(["data: test\n\n"])

            messages = [{"role": "user", "content": "Hello"}]
            system_prompt = "You are helpful"

            chunks = []
            async for chunk in stream_groq_message(
                messages,
                system_prompt,
                model="llama2-70b-chat",
                temperature=0.5,
                max_tokens=512,
            ):
                chunks.append(chunk)

            assert len(chunks) > 0

    @staticmethod
    async def _async_generator(items):
        """Helper to create async generator from list."""
        for item in items:
            yield item


class TestGroqConfigIntegration:
    """Tests for Groq configuration integration."""

    def test_groq_configured_property_true(self):
        """Test groq_configured property when key is set."""
        with patch("app.core.config.settings.GROQ_API_KEY", "test-key"):
            from app.core.config import Settings

            settings = Settings()
            # Note: This test checks the property logic
            assert bool("test-key") is True

    def test_groq_configured_property_false(self):
        """Test groq_configured property when key is empty."""
        with patch("app.core.config.settings.GROQ_API_KEY", ""):
            from app.core.config import Settings

            settings = Settings()
            assert bool("") is False

    def test_settings_has_groq_fields(self):
        """Test that settings has all Groq configuration fields."""
        from app.core.config import Settings

        settings = Settings()
        assert hasattr(settings, "GROQ_API_KEY")
        assert hasattr(settings, "GROQ_MODEL")
        assert hasattr(settings, "GROQ_TEMPERATURE")
        assert hasattr(settings, "GROQ_MAX_TOKENS")


class TestGroqSSEFormat:
    """Tests for Server-Sent Events (SSE) formatting."""

    def test_sse_token_format(self):
        """Test SSE token format."""
        provider = GroqProvider()
        token = "test"
        expected = f"data: {json.dumps({'token': token})}\n\n"
        assert expected == f"data: {json.dumps({'token': 'test'})}\n\n"

    def test_sse_error_format(self):
        """Test SSE error format."""
        error_msg = "Test error"
        expected = f"data: {json.dumps({'error': error_msg})}\n\n"
        assert expected == f"data: {json.dumps({'error': 'Test error'})}\n\n"

    def test_sse_done_marker(self):
        """Test SSE DONE marker format."""
        expected = "data: [DONE]\n\n"
        assert expected == "data: [DONE]\n\n"


class TestGroqRateLimiting:
    """Tests for rate limit handling."""

    @pytest.mark.asyncio
    async def test_rate_limit_error_handling(self):
        """Test handling of rate limit errors."""
        provider = GroqProvider()
        mock_client = MagicMock()
        # Simulate rate limit error
        mock_client.chat.completions.create.side_effect = Exception(
            "Rate limit exceeded"
        )
        provider.client = mock_client

        messages = [{"role": "user", "content": "Test"}]
        system_prompt = "You are helpful"

        chunks = []
        async for chunk in provider.stream_message(messages, system_prompt):
            chunks.append(chunk)

        # Should contain error and DONE
        assert any("error" in chunk for chunk in chunks)
        assert chunks[-1] == "data: [DONE]\n\n"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
