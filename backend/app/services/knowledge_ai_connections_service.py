
from __future__ import annotations

import json
import logging
from typing import Any

from app.schemas.knowledge import (
    KnowledgeConnectionLink,
    KnowledgeConnectionNode,
    KnowledgeConnectionRequest,
    KnowledgeConnectionResponse,
)
from app.services.knowledge_service import get_topic, get_related_topics

logger = logging.getLogger(__name__)

EDUCATIONAL_NOTICE = (
    "This market-connection analysis is for financial education only. "
    "Relationships describe economic mechanisms and are not predictions "
    "or personalised investment advice."
)


def _fallback(request: KnowledgeConnectionRequest, topic, related):
    nodes = [
        KnowledgeConnectionNode(
            id=topic.slug,
            label=topic.name,
            type="topic",
            region=topic.region,
            description=topic.description,
        )
    ]

    connections = []

    for index, item in enumerate(related[:6]):
        node_id = item.slug
        nodes.append(
            KnowledgeConnectionNode(
                id=node_id,
                label=item.name,
                type="related_topic",
                region=item.region,
                description=item.description,
            )
        )

        connections.append(
            KnowledgeConnectionLink(
                source=topic.slug,
                target=node_id,
                relationship="related financial concept",
                explanation=(
                    f"{item.name} is connected to {topic.name} through "
                    "the financial and economic mechanisms described in "
                    "FinPilot's knowledge graph."
                ),
            )
        )

    return KnowledgeConnectionResponse(
        topic=topic,
        title=f"{topic.name} ? Market Connections",
        thesis=(
            f"{topic.name} can be understood more clearly by following "
            "its relationships with related financial concepts, markets, "
            "institutions, and economic variables."
        ),
        nodes=nodes,
        connections=connections,
        market_implications=[
            f"Changes in {topic.name} can interact with other financial variables.",
            "The direction and magnitude of market effects depend on the economic context.",
            "Relationships can differ across countries, asset classes, and market regimes.",
        ],
        why_it_matters=(
            "Understanding transmission channels helps connect individual "
            "financial concepts to the broader global market system."
        ),
        next_topics=related[:6],
        generated_by="finpilot-knowledge-graph",
        educational_notice=EDUCATIONAL_NOTICE,
    )


async def generate_connections(
    request: KnowledgeConnectionRequest,
) -> KnowledgeConnectionResponse:
    topic = get_topic(request.topic_slug)

    if topic is None:
        raise ValueError(f"Unknown knowledge topic: {request.topic_slug}")

    topic = get_topic(request.topic_slug)
    if topic is None:
        raise ValueError(f"Unknown knowledge topic: {request.topic_slug}")

    related = get_related_topics(topic)

    try:
        from app.core.config import settings

        api_key = getattr(settings, "GROQ_API_KEY", None)

        if not api_key:
            return _fallback(request, topic, related)

        from groq import AsyncGroq

        client = AsyncGroq(api_key=api_key)

        context = {
            "topic": topic.model_dump(),
            "related_topics": [item.model_dump() for item in related[:8]],
            "depth": request.depth,
            "focus": request.focus,
        }

        prompt = f"""
You are FinPilot's global financial education engine.

Create an educational market-connection map for the selected topic.

TOPIC CONTEXT:
{json.dumps(context, indent=2)}

Return ONLY valid JSON with this structure:

{{
  "title": "string",
  "thesis": "string",
  "nodes": [
    {{
      "id": "string",
      "label": "string",
      "type": "topic|macro|asset|market|institution|currency|risk",
      "region": "string or null",
      "description": "string"
    }}
  ],
  "connections": [
    {{
      "source": "existing node id",
      "target": "existing node id",
      "relationship": "string",
      "explanation": "string"
    }}
  ],
  "market_implications": ["string"],
  "why_it_matters": "string"
}}

Rules:
- Explain mechanisms, not predictions.
- Use globally relevant finance concepts.
- Do not invent live prices or current market data.
- Do not give personalised investment advice.
- Keep the chain economically coherent.
- Prefer relationships such as:
  monetary policy ? rates ? bonds ? currencies ? capital flows
  inflation ? central banks ? rates ? asset valuations
  commodities ? inflation ? growth ? markets
- Include 4?10 useful nodes.
"""

        model = getattr(
            settings,
            "GROQ_MODEL",
            "openai/gpt-oss-120b",
        )

        response = await client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an educational global finance "
                        "knowledge engine. Return strict JSON."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.25,
            max_tokens=3000,
        )

        content = response.choices[0].message.content or ""
        content = content.strip()

        if content.startswith("```"):
            content = content.replace("```json", "", 1)
            content = content.replace("```", "")
            content = content.strip()

        generated: dict[str, Any] = json.loads(content)

        node_items = [
            KnowledgeConnectionNode(**item)
            for item in generated.get("nodes", [])
        ]

        node_ids = {item.id for item in node_items}

        link_items = [
            KnowledgeConnectionLink(**item)
            for item in generated.get("connections", [])
            if item.get("source") in node_ids
            and item.get("target") in node_ids
        ]

        if not node_items or not link_items:
            return _fallback(request, topic, related)

        return KnowledgeConnectionResponse(
            topic=topic,
            title=str(generated.get("title") or f"{topic.name} ? Market Connections"),
            thesis=str(generated.get("thesis") or ""),
            nodes=node_items[:10],
            connections=link_items[:12],
            market_implications=[
                str(item)
                for item in generated.get("market_implications", [])
            ][:6],
            why_it_matters=str(
                generated.get("why_it_matters")
                or "Understanding financial transmission channels."
            ),
            next_topics=related[:6],
            generated_by="finpilot-ai",
            educational_notice=EDUCATIONAL_NOTICE,
        )

    except Exception as exc:
        logger.warning(
            "Market connection generation failed for %s: %s",
            request.topic_slug,
            exc,
        )
        return _fallback(request, topic, related)
