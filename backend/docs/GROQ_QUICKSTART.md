# Groq Integration — Quick Start Guide

## Installation

1. Add Groq to requirements.txt (already done):
   ```
   groq==0.9.0
   ```

2. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

## Configuration

1. Set environment variable in `.env`:
   ```env
   GROQ_API_KEY=gsk_...your_key...
   GROQ_MODEL=mixtral-8x7b-32768
   GROQ_TEMPERATURE=0.7
   GROQ_MAX_TOKENS=1024
   ```

2. Verify in `backend/app/core/config.py`:
   ```python
   GROQ_API_KEY: str = ""
   GROQ_MODEL: str = "mixtral-8x7b-32768"
   GROQ_TEMPERATURE: float = 0.7
   GROQ_MAX_TOKENS: int = 1024
   
   @property
   def groq_configured(self) -> bool:
       return bool(self.GROQ_API_KEY)
   ```

## Basic Usage

### Option 1: Direct Groq Service

```python
from app.services.groq_service import GroqProvider

provider = GroqProvider()
messages = [{"role": "user", "content": "Explain SIPs"}]
system_prompt = "You are a finance tutor."

async for chunk in provider.stream_message(messages, system_prompt):
    yield chunk  # SSE format: data: {"token": "..."}\n\n
```

### Option 2: Provider Abstraction (Recommended)

```python
from app.services.ai_provider import get_default_provider

provider = get_default_provider()  # Auto-selects Groq if available
if provider:
    async for chunk in provider.stream_message(messages, system_prompt):
        yield chunk
```

### Option 3: Specific Provider

```python
from app.services.ai_provider import get_provider

provider = get_provider("groq")
if provider:
    async for chunk in provider.stream_message(messages, system_prompt):
        yield chunk
```

## Streaming Response Format

All responses are Server-Sent Events (SSE):

```
data: {"token": "Here's"}
data: {"token": " an"}
data: {"token": " explanation"}
data: [DONE]
```

Frontend receives and concatenates tokens in real-time.

## Error Handling

```json
// When Groq is not configured
data: {"error": "Groq API is not configured."}
data: [DONE]

// When API fails
data: {"error": "I encountered an error while generating a response. Please try again in a moment."}
data: [DONE]
```

## Performance

- **Time to first token**: 200-400ms (vs 500ms-1s for OpenAI)
- **Tokens per second**: 80-120 (vs 20-40 for OpenAI)
- **Cost**: ~3x cheaper than GPT-4

## Available Models

| Model | Use Case | Speed |
|-------|----------|-------|
| `mixtral-8x7b-32768` | **Default** - balanced quality & speed | ⚡⚡⚡ |
| `llama2-70b-chat` | Better quality, conversational | ⚡⚡ |
| `gemma-7b-it` | Fast, lightweight responses | ⚡⚡⚡⚡ |

## Testing

```bash
# Run unit tests
pytest backend/tests/test_groq_service.py -v

# Run with coverage
pytest backend/tests/test_groq_service.py --cov=app.services.groq_service
```

## Integration with AI Tutor Service

To use Groq in the existing AI tutor service, modify `stream_response()` in `ai_tutor_service.py`:

```python
from app.services.ai_provider import get_provider

# Replace OpenAI logic with:
provider = get_provider("groq")  # or use get_default_provider()
if not provider:
    # Handle error
    yield f"data: {{'error': 'AI service unavailable'}}\n\n"
    yield "data: [DONE]\n\n"
    return

# Stream response
async for chunk in provider.stream_message(messages, system_prompt):
    full_response += extract_token(chunk)
    yield chunk

# Persist response
await _persist_message(db, conv.id, "assistant", full_response)
```

## Deployment Considerations

### Production Checklist

- [ ] GROQ_API_KEY set in production `.env`
- [ ] GROQ_API_KEY uses different key from development
- [ ] Monitor Groq API usage and costs
- [ ] Implement caching for common questions
- [ ] Set up fallback to OpenAI if needed
- [ ] Test error scenarios
- [ ] Document rate limits (30 req/min on free tier)

### Rate Limiting

Free tier: 30 requests per minute

If you hit rate limits:
1. Implement request queuing
2. Add response caching
3. Upgrade to paid tier
4. Fall back to OpenAI

### Cost Tracking

Groq pricing (2024):
- Mixtral 8x7B: $0.27 / $0.81 per million tokens (in/out)
- Llama2 70B: $0.70 / $0.90 per million tokens (in/out)
- Gemma 7B: $0.07 / $0.21 per million tokens (in/out)

Compare to OpenAI GPT-4o:
- Input: $5 per million tokens
- Output: $15 per million tokens

**Groq is ~15-20x cheaper for inference.**

## Troubleshooting

### "Groq API key not configured"
Check `.env` has `GROQ_API_KEY=gsk_...`

### "groq package not installed"
```bash
pip install groq==0.9.0
```

### "Rate limit exceeded"
Wait 1 minute or upgrade to paid tier

### Slow responses
1. Check network latency
2. Use faster model (e.g., `gemma-7b-it`)
3. Reduce `max_tokens`

### Different quality than OpenAI
- Groq is optimized for speed, not necessarily quality
- For critical responses, use OpenAI
- For common responses, cache results
- Consider A/B testing different providers

## Files Created/Modified

### Created
- `backend/app/services/groq_service.py` - Groq provider implementation
- `backend/app/services/ai_provider.py` - Provider abstraction layer
- `backend/docs/GROQ_INTEGRATION.md` - Detailed documentation
- `backend/docs/GROQ_INTEGRATION_EXAMPLE.md` - Code examples
- `backend/docs/GROQ_QUICKSTART.md` - This file
- `backend/tests/test_groq_service.py` - Unit tests

### Modified
- `backend/app/core/config.py` - Added Groq configuration fields
- `backend/requirements.txt` - Added groq==0.9.0

## Next Steps

1. Install dependencies: `pip install -r requirements.txt`
2. Set GROQ_API_KEY in `.env`
3. Run tests: `pytest backend/tests/test_groq_service.py`
4. Integrate with AI tutor service (see examples)
5. Test streaming endpoint
6. Monitor usage and costs

## Resources

- [Groq Console](https://console.groq.com/)
- [Groq API Docs](https://console.groq.com/docs)
- [Groq Chat Models](https://console.groq.com/docs/speech-text)
- [Pricing](https://groq.com/pricing/)

## Support

For issues or questions about the Groq integration, refer to:
1. `backend/docs/GROQ_INTEGRATION.md` - Full documentation
2. `backend/docs/GROQ_INTEGRATION_EXAMPLE.md` - Code examples
3. `backend/tests/test_groq_service.py` - Test cases
