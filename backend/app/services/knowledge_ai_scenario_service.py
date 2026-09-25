
from __future__ import annotations

import json
import logging
import uuid
from typing import Any

from app.schemas.knowledge import (
    KnowledgeScenarioChoice,
    KnowledgeScenarioExplainRequest,
    KnowledgeScenarioExplainResponse,
    KnowledgeScenarioRequest,
    KnowledgeScenarioResponse,
)
from app.services.knowledge_service import get_related_topics, get_topic, get_topic

logger = logging.getLogger(__name__)

EDUCATIONAL_NOTICE = (
    "Scenario Lab is an educational simulation. Outcomes are illustrative "
    "and are not forecasts, trading signals, or personalised investment advice."
)


async def generate_scenario(
    request: KnowledgeScenarioRequest,
) -> KnowledgeScenarioResponse:
    topic = get_topic(request.topic_slug)

    if topic is None:
        raise ValueError(f"Unknown knowledge topic: {request.topic_slug}")

    topic = get_topic(request.topic_slug)
    if topic is None:
        raise ValueError(f"Unknown knowledge topic: {request.topic_slug}")

    related = get_related_topics(topic)
    scenario_id = str(uuid.uuid4())

    fallback = KnowledgeScenarioResponse(
        scenario_id=scenario_id,
        topic=topic,
        title=f"{topic.name} Scenario Lab",
        scenario_type=request.scenario_type,
        context=(
            f"Imagine a significant development affecting {topic.name}. "
            "Your task is to reason through the economic transmission "
            "channels rather than predict a specific market outcome."
        ),
        assumptions=[
            "The scenario is hypothetical.",
            "Market reactions depend on expectations and the surrounding economic regime.",
            "Different asset classes can react differently.",
        ],
        choices=[
            KnowledgeScenarioChoice(
                id="analyze_transmission",
                label="Trace the transmission channels",
                description=(
                    "Start with the direct economic effect and follow "
                    "its possible links through markets."
                ),
            ),
            KnowledgeScenarioChoice(
                id="compare_assets",
                label="Compare asset classes",
                description=(
                    "Examine how equities, bonds, currencies, and "
                    "commodities could be affected through different channels."
                ),
            ),
            KnowledgeScenarioChoice(
                id="challenge_assumptions",
                label="Challenge the scenario",
                description=(
                    "Identify assumptions and conditions that could "
                    "change the interpretation."
                ),
            ),
        ],
        decision_prompt=(
            "Which analytical approach would you use first to understand "
            "this scenario?"
        ),
        learning_objectives=[
            "Identify economic transmission channels.",
            "Distinguish mechanisms from market predictions.",
            "Compare cross-asset relationships.",
        ],
        related_topics=related[:6],
        generated_by="finpilot-scenario-engine",
        educational_notice=EDUCATIONAL_NOTICE,
    )

    try:
        from app.core.config import settings

        api_key = getattr(settings, "GROQ_API_KEY", None)

        if not api_key:
            return fallback

        from groq import AsyncGroq

        client = AsyncGroq(api_key=api_key)

        context = {
            "topic": topic.model_dump(),
            "related_topics": [item.model_dump() for item in related[:8]],
            "difficulty": request.difficulty,
            "scenario_type": request.scenario_type,
            "focus": request.focus,
        }

        prompt = f"""
You are FinPilot's Scenario Lab educational engine.

Create one realistic but hypothetical financial learning scenario.

CONTEXT:
{json.dumps(context, indent=2)}

Return ONLY valid JSON:

{{
  "title": "string",
  "context": "string",
  "assumptions": ["string"],
  "choices": [
    {{
      "id": "short_id",
      "label": "string",
      "description": "string"
    }}
  ],
  "decision_prompt": "string",
  "learning_objectives": ["string"]
}}

Rules:
- Create exactly 3 choices.
- Make the choices analytical, not buy/sell recommendations.
- Do not predict a specific asset price or market return.
- Do not use live market data.
- Make the scenario educational and globally relevant.
- Clearly state that it is hypothetical.
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
                        "You create educational finance scenarios. "
                        "Return strict JSON only."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.35,
            max_tokens=2200,
        )

        content = (response.choices[0].message.content or "").strip()

        if content.startswith("```"):
            content = content.replace("```json", "", 1)
            content = content.replace("```", "").strip()

        generated: dict[str, Any] = json.loads(content)

        choices = [
            KnowledgeScenarioChoice(**item)
            for item in generated.get("choices", [])
        ]

        if len(choices) < 3:
            return fallback

        return KnowledgeScenarioResponse(
            scenario_id=scenario_id,
            topic=topic,
            title=str(generated.get("title") or fallback.title),
            scenario_type=request.scenario_type,
            context=str(generated.get("context") or fallback.context),
            assumptions=[
                str(item)
                for item in generated.get("assumptions", [])
            ][:6] or fallback.assumptions,
            choices=choices[:3],
            decision_prompt=str(
                generated.get("decision_prompt")
                or fallback.decision_prompt
            ),
            learning_objectives=[
                str(item)
                for item in generated.get("learning_objectives", [])
            ][:6] or fallback.learning_objectives,
            related_topics=related[:6],
            generated_by="finpilot-ai",
            educational_notice=EDUCATIONAL_NOTICE,
        )

    except Exception as exc:
        logger.warning(
            "Scenario generation failed for %s: %s",
            request.topic_slug,
            exc,
        )
        return fallback


async def explain_scenario_choice(
    request: KnowledgeScenarioExplainRequest,
) -> KnowledgeScenarioExplainResponse:
    topic = get_topic(request.topic_slug)

    if topic is None:
        raise ValueError(f"Unknown knowledge topic: {request.topic_slug}")

    topic = get_topic(request.topic_slug)
    if topic is None:
        raise ValueError(f"Unknown knowledge topic: {request.topic_slug}")

    related = get_related_topics(topic)

    fallback = KnowledgeScenarioExplainResponse(
        scenario_id=request.scenario_id,
        choice_id=request.choice_id,
        choice_label=request.choice_label,
        explanation=(
            f"The choice '{request.choice_label}' is useful because it "
            f"encourages structured analysis of {topic.name} rather than "
            "jumping directly to a market prediction."
        ),
        transmission_channels=[
            f"Start with the direct effect on {topic.name}.",
            "Trace the effect through related macroeconomic variables.",
            "Compare how different asset classes could respond.",
            "Consider expectations, positioning, and the economic regime.",
        ],
        tradeoffs=[
            "A single transmission channel rarely explains the entire market.",
            "Different regions can experience different effects.",
            "Market prices can incorporate expectations before the underlying event occurs.",
        ],
        what_to_watch=[
            "Policy expectations",
            "Interest rates and bond yields",
            "Currencies and capital flows",
            "Risk sentiment and economic growth",
        ],
        related_topics=related[:6],
        generated_by="finpilot-scenario-engine",
        educational_notice=EDUCATIONAL_NOTICE,
    )

    try:
        from app.core.config import settings

        api_key = getattr(settings, "GROQ_API_KEY", None)

        if not api_key:
            return fallback

        from groq import AsyncGroq

        client = AsyncGroq(api_key=api_key)

        prompt = f"""
Explain an educational Scenario Lab choice.

Topic:
{json.dumps(topic.model_dump(), indent=2)}

Scenario:
{request.scenario_context}

Selected analytical approach:
{request.choice_label}

Return ONLY valid JSON:

{{
  "explanation": "string",
  "transmission_channels": ["string"],
  "tradeoffs": ["string"],
  "what_to_watch": ["string"]
}}

Rules:
- Explain economic reasoning.
- Do not say the choice is guaranteed to be correct.
- Do not give personalised investment advice.
- Do not make price or return forecasts.
- Distinguish possible mechanisms from certainty.
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
                        "You are an educational financial reasoning engine. "
                        "Return strict JSON."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.25,
            max_tokens=2200,
        )

        content = (response.choices[0].message.content or "").strip()

        if content.startswith("```"):
            content = content.replace("```json", "", 1)
            content = content.replace("```", "").strip()

        generated: dict[str, Any] = json.loads(content)

        return KnowledgeScenarioExplainResponse(
            scenario_id=request.scenario_id,
            choice_id=request.choice_id,
            choice_label=request.choice_label,
            explanation=str(
                generated.get("explanation") or fallback.explanation
            ),
            transmission_channels=[
                str(item)
                for item in generated.get("transmission_channels", [])
            ][:8] or fallback.transmission_channels,
            tradeoffs=[
                str(item)
                for item in generated.get("tradeoffs", [])
            ][:8] or fallback.tradeoffs,
            what_to_watch=[
                str(item)
                for item in generated.get("what_to_watch", [])
            ][:8] or fallback.what_to_watch,
            related_topics=related[:6],
            generated_by="finpilot-ai",
            educational_notice=EDUCATIONAL_NOTICE,
        )

    except Exception as exc:
        logger.warning(
            "Scenario explanation failed for %s: %s",
            request.topic_slug,
            exc,
        )
        return fallback
