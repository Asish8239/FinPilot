# Groq Integration Examples

## Example 1: Basic Groq Streaming

Stream a response using just the Groq service:

```python
from app.services.groq_service import GroqProvider

async def get_groq_response(user_message: str):
    """Simple example of using Groq provider."""
    provider = GroqProvider()
    
    system_prompt = """
    You are FinPilot AI, a friendly personal finance tutor.
    Explain concepts in simple terms suitable for Indian learners.
    """
    
    messages = [
        {"role": "user", "content": user_message}
    ]
    
    # Stream response
    async for chunk in provider.stream_message(messages, system_prompt):
        yield chunk  # SSE formatted: data: {"token": "..."}\n\n
```

## Example 2: Using Provider Abstraction

Use the unified provider interface to support multiple backends:

```python
from app.services.ai_provider import get_provider

async def stream_with_provider(
    user_message: str, 
    provider_name: str = "openai"
):
    """Stream using any configured provider."""
    provider = get_provider(provider_name)
    
    if not provider:
        yield f'data: {{"error": "{provider_name} not configured"}}\n\n'
        yield "data: [DONE]\n\n"
        return
    
    system_prompt = "You are a helpful finance assistant."
    messages = [{"role": "user", "content": user_message}]
    
    async for chunk in provider.stream_message(messages, system_prompt):
        yield chunk
```

## Example 3: Modified AI Tutor Service (Multi-Provider)

Here's how to modify `ai_tutor_service.py` to support both OpenAI and Groq:

```python
# In ai_tutor_service.py, modify the stream_response function:

async def stream_response(
    db: AsyncSession,
    conv: AIConversation,
    user: User,
    user_message: str,
    provider: str = "default",  # "default", "openai", or "groq"
    max_history: int = 20,
) -> AsyncGenerator[str, None]:
    """
    Stream the AI tutor response with provider selection.
    
    Args:
        db: Database session
        conv: Conversation instance
        user: User instance
        user_message: User's message
        provider: Provider to use ("default", "openai", "groq")
        max_history: Number of previous messages to include
    
    Yields:
        SSE formatted response chunks
    """
    from app.services.ai_provider import get_provider, get_default_provider
    
    # Check rate limit
    await _check_rate_limit(db, conv.id)
    
    # Persist user message
    await _persist_message(db, conv.id, "user", user_message)
    
    # Get provider
    if provider == "default":
        ai_provider = get_default_provider()
    else:
        ai_provider = get_provider(provider)
    
    if ai_provider is None:
        logger.warning(
            "No AI provider available (requested: %s)",
            provider
        )
        error_msg = (
            "I'm sorry — the AI tutor is temporarily unavailable. "
            "Please try again later or contact support."
        )
        await _persist_message(db, conv.id, "assistant", error_msg)
        yield f"data: {json.dumps({'error': error_msg})}\n\n"
        yield "data: [DONE]\n\n"
        return
    
    # Build system prompt
    system_prompt = await _build_system_prompt(db, user, conv.lesson_id)
    
    # Get message history
    history = await get_messages(db, conv.id)
    recent = [m for m in history if m.role != "system"][-max_history:]
    messages = [{"role": m.role, "content": m.content} for m in recent]
    
    # Stream response
    full_response = ""
    try:
        async for chunk in ai_provider.stream_message(messages, system_prompt):
            full_response += _extract_token(chunk)
            yield chunk
    except Exception as exc:
        logger.error("Provider streaming error: %s", exc)
    finally:
        if full_response:
            await _persist_message(db, conv.id, "assistant", full_response)


def _extract_token(sse_chunk: str) -> str:
    """Extract token from SSE formatted string."""
    try:
        if "token" in sse_chunk:
            import json
            match = json.search(r'"token": "([^"]*)"', sse_chunk)
            return match.group(1) if match else ""
    except:
        pass
    return ""
```

## Example 4: FastAPI Endpoint with Provider Selection

Create an endpoint that allows selecting the provider:

```python
# In app/api/routes/tutor.py

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/tutor", tags=["tutor"])


@router.post("/conversations/{conv_id}/stream")
async def stream_tutor_response(
    conv_id: uuid.UUID,
    message: dict,
    provider: str = Query("default", regex="^(default|openai|groq)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Stream AI tutor response.
    
    Query Parameters:
        provider: "default" (auto-select), "openai", or "groq"
    """
    from app.services.ai_tutor_service import stream_response, get_conversation
    
    conv = await get_conversation(db, conv_id, current_user.id)
    
    return StreamingResponse(
        stream_response(
            db,
            conv,
            current_user,
            message.get("content"),
            provider=provider,
        ),
        media_type="text/event-stream",
    )
```

## Example 5: Fallback Chain

Implement automatic fallback from Groq to OpenAI:

```python
async def stream_with_fallback(
    messages: list[dict],
    system_prompt: str,
    primary: str = "groq",
    fallback: str = "openai",
) -> AsyncGenerator[str, None]:
    """
    Try primary provider, fall back to secondary if it fails.
    """
    from app.services.ai_provider import get_provider
    
    primary_provider = get_provider(primary)
    if primary_provider:
        try:
            async for chunk in primary_provider.stream_message(
                messages, system_prompt
            ):
                if "error" not in chunk:
                    yield chunk
                else:
                    raise Exception("Provider error")
            return
        except Exception as e:
            logger.warning(
                "Primary provider %s failed: %s, falling back to %s",
                primary,
                e,
                fallback,
            )
    
    # Fall back to secondary provider
    fallback_provider = get_provider(fallback)
    if fallback_provider:
        async for chunk in fallback_provider.stream_message(
            messages, system_prompt
        ):
            yield chunk
    else:
        yield f'data: {{"error": "All providers exhausted"}}\n\n'
        yield "data: [DONE]\n\n"
```

## Example 6: Configuration-Based Provider Selection

Use settings to determine provider at runtime:

```python
# In app/core/config.py

class Settings(BaseSettings):
    # ... existing settings ...
    
    # Provider settings
    DEFAULT_AI_PROVIDER: str = "groq"  # or "openai"
    ENABLE_PROVIDER_FALLBACK: bool = True
    PROVIDER_FALLBACK_CHAIN: str = "groq,openai"  # Comma-separated


# Then use it:

from app.core.config import settings

async def get_ai_stream(messages, system_prompt):
    """Stream using configured default provider."""
    from app.services.ai_provider import get_provider
    
    provider = get_provider(settings.DEFAULT_AI_PROVIDER)
    if not provider and settings.ENABLE_PROVIDER_FALLBACK:
        # Try each provider in fallback chain
        for provider_name in settings.PROVIDER_FALLBACK_CHAIN.split(","):
            provider = get_provider(provider_name.strip())
            if provider:
                break
    
    if provider:
        async for chunk in provider.stream_message(messages, system_prompt):
            yield chunk
```

## Example 7: Cost Tracking

Track costs across different providers:

```python
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime

class AIProviderUsage(Base):
    """Track AI provider usage for cost analysis."""
    __tablename__ = "ai_provider_usage"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    provider: Mapped[str] = mapped_column(String(50))  # "openai", "groq"
    model: Mapped[str] = mapped_column(String(100))
    input_tokens: Mapped[int]
    output_tokens: Mapped[int]
    cost_usd: Mapped[float]
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)


async def log_provider_usage(
    db: AsyncSession,
    user_id: uuid.UUID,
    provider: str,
    model: str,
    input_tokens: int,
    output_tokens: int,
):
    """Log AI provider usage for cost tracking."""
    # Calculate cost based on provider and model
    costs = {
        "groq": {
            "mixtral-8x7b-32768": {"input": 0.27 / 1_000_000, "output": 0.81 / 1_000_000},
        },
        "openai": {
            "gpt-4o": {"input": 0.005 / 1000, "output": 0.015 / 1000},
        },
    }
    
    cost_info = costs.get(provider, {}).get(model, {})
    input_cost = input_tokens * cost_info.get("input", 0)
    output_cost = output_tokens * cost_info.get("output", 0)
    total_cost = input_cost + output_cost
    
    usage = AIProviderUsage(
        user_id=user_id,
        provider=provider,
        model=model,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        cost_usd=total_cost,
    )
    db.add(usage)
    await db.flush()
```

## Example 8: A/B Testing Different Providers

Compare responses from different providers:

```python
async def ab_test_providers(
    messages: list[dict],
    system_prompt: str,
) -> dict:
    """
    Test both providers and return responses for comparison.
    
    Returns:
        {
            "groq": "response from Groq",
            "openai": "response from OpenAI",
            "groq_time": 0.5,
            "openai_time": 1.2,
        }
    """
    import time
    from app.services.ai_provider import get_provider
    
    results = {}
    
    for provider_name in ["groq", "openai"]:
        provider = get_provider(provider_name)
        if not provider:
            continue
        
        start = time.time()
        response = ""
        
        async for chunk in provider.stream_message(messages, system_prompt):
            if "token" in chunk:
                import json
                data = json.loads(chunk.split("data: ")[1])
                response += data.get("token", "")
        
        elapsed = time.time() - start
        results[provider_name] = response
        results[f"{provider_name}_time"] = elapsed
    
    return results
```

## Testing the Integration

```python
# tests/test_groq_integration.py

import pytest
from app.services.groq_service import GroqProvider
from app.services.ai_provider import get_provider, get_default_provider


@pytest.mark.asyncio
async def test_groq_provider_initialization():
    """Test Groq provider can initialize."""
    provider = GroqProvider()
    assert provider.initialize_client() is True
    assert provider.client is not None


@pytest.mark.asyncio
async def test_groq_streaming():
    """Test Groq streaming response."""
    provider = get_provider("groq")
    if not provider:
        pytest.skip("Groq not configured")
    
    messages = [{"role": "user", "content": "Hello"}]
    system_prompt = "You are a helpful assistant."
    
    chunks = []
    async for chunk in provider.stream_message(messages, system_prompt):
        chunks.append(chunk)
    
    assert len(chunks) > 0
    assert chunks[-1] == "data: [DONE]\n\n"


@pytest.mark.asyncio
async def test_default_provider():
    """Test default provider selection."""
    provider = get_default_provider()
    assert provider is not None
```

## Monitoring and Logging

```python
import logging

logger = logging.getLogger(__name__)

logger.info("Using provider: groq")
logger.warning("Groq rate limited, falling back to OpenAI")
logger.error("Failed to initialize Groq client: API key not found")
```
