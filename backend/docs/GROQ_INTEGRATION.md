# Groq Integration Guide

## Overview

Groq is a fast, efficient AI inference provider offering competitive performance at a lower cost than traditional LLMs. This integration provides a complete service for streaming AI tutor responses using Groq's API.

## Configuration

### Environment Variables

The following variables control Groq integration:

```env
GROQ_API_KEY=gsk_...                          # Required: Groq API key
GROQ_MODEL=mixtral-8x7b-32768                 # Model name (default)
GROQ_TEMPERATURE=0.7                          # Response temperature (0.0-2.0)
GROQ_MAX_TOKENS=1024                          # Max tokens per response
```

### Application Configuration

Configuration is managed via `backend/app/core/config.py`:

```python
from app.core.config import settings

# Check if Groq is configured
if settings.groq_configured:
    model_name = settings.GROQ_MODEL
    api_key = settings.GROQ_API_KEY  # Server-side only
```

## Available Models

Groq offers several high-performance models:

| Model | Parameters | Context | Use Case | Speed |
|-------|-----------|---------|----------|-------|
| `mixtral-8x7b-32768` | 8x7B MoE | 32K tokens | **Default**: General purpose, balanced quality & speed | Fastest |
| `llama2-70b-chat` | 70B | 4K tokens | Conversational, nuanced responses | Fast |
| `gemma-7b-it` | 7B | 8K tokens | Lightweight, fast responses | Very Fast |

## Service Usage

### Streaming Responses

The `GroqProvider` class provides SSE streaming compatible with the AI tutor frontend:

```python
from app.services.groq_service import GroqProvider

provider = GroqProvider()
system_prompt = "You are a helpful assistant."
messages = [{"role": "user", "content": "Hello!"}]

# Stream response as SSE
async for chunk in provider.stream_message(messages, system_prompt):
    # Each chunk is: data: {"token": "..."}\n\n
    # or: data: [DONE]\n\n at end
    yield chunk
```

### Direct Helper Function

For simple stateless streaming:

```python
from app.services.groq_service import stream_groq_message

async for chunk in stream_groq_message(
    messages=[{"role": "user", "content": "Explain SIPs"}],
    system_prompt="You are a finance tutor.",
    model="mixtral-8x7b-32768",
    temperature=0.7,
    max_tokens=1024,
):
    yield chunk
```

### Response Format

All streaming responses use Server-Sent Events (SSE) format:

```json
// Token streaming
data: {"token": "Here's"}
data: {"token": " an"}
data: {"token": " explanation"}

// Error handling
data: {"error": "Rate limit exceeded"}

// End of stream
data: [DONE]
```

## Error Handling

The service implements graceful degradation:

### Missing API Key

```python
# If GROQ_API_KEY is not set:
# - provider.stream_message() yields error SSE event
# - No crash or exception is raised
# - Fallback message is provided to frontend
```

### Rate Limiting

Groq's free tier has limits:
- **30 requests per minute** (shared across all users)
- **Sliding window**: 1-minute rolling window

Response if limit exceeded:
```json
data: {"error": "Rate limit exceeded. Please try again later."}
data: [DONE]
```

### Network Errors

Network errors are caught and returned as error SSE events:

```python
try:
    stream = client.chat.completions.create(...)
except Exception as exc:
    yield f"data: {json.dumps({'error': 'Connection error'})}\n\n"
    yield "data: [DONE]\n\n"
```

### Model Not Found

If the specified model doesn't exist in Groq's API:

```json
data: {"error": "Model not found. Check GROQ_MODEL configuration."}
data: [DONE]
```

## Performance Characteristics

### Latency

Groq is optimized for low latency:

- **Time to first token (TTFT)**: ~200-400ms
- **Tokens per second**: 50-100 tokens/s (depends on model)

For reference:
- OpenAI GPT-4: 500ms-1s TTFT, 20-40 tokens/s
- Groq Mixtral: 200-400ms TTFT, 80-120 tokens/s

### Cost

Groq's pricing (as of 2024):

| Model | Per 1M input tokens | Per 1M output tokens |
|-------|-------------------|----------------------|
| Mixtral 8x7B | $0.27 | $0.81 |
| Llama2 70B | $0.70 | $0.90 |
| Gemma 7B | $0.07 | $0.21 |

**Free tier**: 30 requests/minute (unlimited within tier limits)

## Rate Limiting Strategy

For the free tier, implement these strategies:

### At Application Level

```python
from app.core.config import settings

# Implement per-user rate limiting
AI_RATE_LIMIT_PER_HOUR = 30  # App-level limit (in settings)

# Check rate limit before streaming
await _check_rate_limit(db, conv.id)
```

### Graceful Degradation

If Groq rate limit is hit:
1. Return cached response (if available)
2. Offer alternative models (fallback to OpenAI)
3. Suggest user try again later

### Monitoring

Log Groq rate limit events:

```python
logger.warning(
    "Groq rate limit hit for user %s (conv %s)",
    user.id,
    conv.id,
)
```

## Integration with AI Tutor Service

The `ai_tutor_service.py` can be extended to support Groq:

```python
async def stream_response(
    db: AsyncSession,
    conv: AIConversation,
    user: User,
    user_message: str,
    provider: str = "openai",  # "openai" or "groq"
) -> AsyncGenerator[str, None]:
    """Stream response using specified provider."""
    
    if provider == "groq":
        from app.services.groq_service import GroqProvider
        groq_provider = GroqProvider()
        # Use groq_provider.stream_message()
    else:
        # Use existing OpenAI logic
```

## Testing

### Unit Tests

```python
# tests/test_groq_service.py
import pytest
from app.services.groq_service import GroqProvider

@pytest.mark.asyncio
async def test_groq_streaming():
    provider = GroqProvider()
    messages = [{"role": "user", "content": "Test"}]
    
    chunks = []
    async for chunk in provider.stream_message(
        messages,
        "You are a helpful assistant."
    ):
        chunks.append(chunk)
    
    assert len(chunks) > 0
    assert chunks[-1] == "data: [DONE]\n\n"
```

### Integration Tests

Test with real API key in CI/CD:

```python
@pytest.mark.integration
@pytest.mark.asyncio
async def test_groq_real_api():
    provider = GroqProvider()
    if not settings.groq_configured:
        pytest.skip("GROQ_API_KEY not configured")
    
    # Full streaming test
```

## Troubleshooting

### "groq package not installed"

```bash
pip install -r backend/requirements.txt
```

### "Groq API key not configured"

Ensure `.env` has:
```env
GROQ_API_KEY=gsk_...
```

### Slow responses

1. Check network latency
2. Verify model choice (use `mixtral-8x7b-32768` for speed)
3. Reduce `max_tokens` if possible
4. Check Groq service status

### Rate limit errors frequently

1. Implement caching for common questions
2. Use Groq's async batching APIs
3. Consider upgrading from free tier
4. Fall back to OpenAI for critical paths

## Migration from OpenAI

To migrate existing conversations to Groq:

```python
# Update ai_tutor_service.py stream_response()
client = _get_groq_client()  # Instead of _get_client()

# Groq client API is similar to OpenAI:
stream = client.chat.completions.create(
    model=settings.GROQ_MODEL,
    messages=messages,
    stream=True,
    temperature=settings.GROQ_TEMPERATURE,
    max_tokens=settings.GROQ_MAX_TOKENS,
)
```

## Security Considerations

### API Key Protection

- ✅ API key stored only in `.env` (server-side)
- ✅ Never exposed in frontend code or responses
- ✅ Rotated regularly in production
- ✅ Different keys for development/staging/production

### Input Validation

- ✅ Messages validated before sending to Groq
- ✅ System prompt escaped for injection attacks
- ✅ Max tokens enforced to prevent abuse

### Output Sanitization

- ✅ Streamed tokens validated before sending to client
- ✅ Error messages don't expose API details
- ✅ Logging doesn't capture sensitive data

## Future Enhancements

1. **Model Selection**: Allow users to choose models (speed vs quality)
2. **Caching**: Implement response caching for common questions
3. **Analytics**: Track Groq API usage and costs
4. **Failover**: Automatic fallback to OpenAI on rate limits
5. **A/B Testing**: Compare Groq vs OpenAI responses for quality
6. **Custom Fine-tuning**: Fine-tune Groq models on finance content

## Resources

- [Groq API Documentation](https://console.groq.com/docs)
- [Groq Pricing](https://groq.com/pricing/)
- [Groq Chat Completions API](https://console.groq.com/docs/speech-text)
- [Groq Community Discord](https://discord.gg/groq)
