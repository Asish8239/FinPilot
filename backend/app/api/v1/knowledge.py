from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.anonymous import get_anonymous_id
from app.core.database import get_db
from app.schemas.knowledge import (
    KnowledgeLessonRequest,
    KnowledgeConnectionRequest,
    KnowledgeConnectionResponse,
    KnowledgeScenarioExplainRequest,
    KnowledgeScenarioExplainResponse,
    KnowledgeScenarioRequest,
    KnowledgeScenarioResponse,
    KnowledgeLessonResponse,
    KnowledgeHistoryResponse,
    KnowledgeLearningOverviewResponse,
    KnowledgeRecommendationsResponse,
    KnowledgeTopicProgressResponse,
    KnowledgeQuizRequest,
    KnowledgeQuizResultResponse,
    KnowledgeQuizSessionQuestionResponse,
    KnowledgeQuizSessionResponse,
    KnowledgeQuizSubmitRequest,
    KnowledgeTopic,
    KnowledgeTopicListResponse,
)
from app.services.knowledge_ai_service import generate_lesson
from app.services.knowledge_ai_connections_service import (
    generate_connections,
)
from app.services.knowledge_ai_scenario_service import (
    explain_scenario_choice,
    generate_scenario,
)
from app.services.knowledge_quiz_service import (
    create_quiz,
    get_quiz,
    submit_quiz,
)
from app.services.knowledge_progress_service import (
    get_all_progress,
    get_history,
    get_learning_overview,
    get_recommendations,
    get_topic_progress,
    record_quiz_result,
)

from app.services.knowledge_service import (
    get_topic,
    list_topics,
)

router = APIRouter()


@router.get(
    "/topics",
    response_model=KnowledgeTopicListResponse,
    summary="Explore the global financial knowledge universe",
)
async def topics(
    search: str | None = Query(default=None),
    category: str | None = Query(default=None),
    region: str | None = Query(default=None),
    difficulty: str | None = Query(default=None),
) -> KnowledgeTopicListResponse:
    results = list_topics(
        search=search,
        category=category,
        region=region,
        difficulty=difficulty,
    )

    return KnowledgeTopicListResponse(
        topics=results,
        total=len(results),
    )


@router.get(
    "/topics/{topic_slug}",
    response_model=KnowledgeTopic,
    summary="Get a global finance knowledge topic",
)
async def topic(topic_slug: str) -> KnowledgeTopic:
    result = get_topic(topic_slug)

    if result is None:
        from app.core.exceptions import NotFoundError

        raise NotFoundError("Knowledge topic")

    return result


@router.post(
    "/lesson",
    response_model=KnowledgeLessonResponse,
    summary="Generate an AI lesson for a finance topic",
)
async def lesson(
    body: KnowledgeLessonRequest,
) -> KnowledgeLessonResponse:
    return await generate_lesson(body)


def _quiz_response(
    quiz,
    questions,
) -> KnowledgeQuizSessionResponse:
    return KnowledgeQuizSessionResponse(
        quiz_id=str(quiz.id),
        topic_slug=quiz.topic_slug,
        topic_name=quiz.topic_name,
        difficulty=quiz.difficulty,
        title=quiz.title,
        generated_by=quiz.generated_by,
        status=quiz.status,
        question_count=len(questions),
        questions=[
            KnowledgeQuizSessionQuestionResponse(
                id=str(question.id),
                position=question.position,
                question=question.question,
                options={
                    "A": question.option_a,
                    "B": question.option_b,
                    "C": question.option_c,
                    "D": question.option_d,
                },
            )
            for question in questions
        ],
        educational_notice=(
            "This dynamic quiz is for financial education only. "
            "It does not constitute personalised investment advice."
        ),
    )


@router.post(
    "/quiz",
    response_model=KnowledgeQuizSessionResponse,
    summary="Generate and persist a dynamic Knowledge Quiz",
)
async def create_knowledge_quiz(
    body: KnowledgeQuizRequest,
    session_id: Annotated[str, Depends(get_anonymous_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> KnowledgeQuizSessionResponse:
    try:
        requested_difficulty = body.difficulty

        existing_progress = await get_topic_progress(
            db=db,
            session_id=str(session_id),
            topic_slug=body.topic_slug,
        )

        if existing_progress is not None:
            requested_difficulty = existing_progress.current_difficulty

        quiz = await create_quiz(
            db=db,
            session_id=str(session_id),
            topic_slug=body.topic_slug,
            difficulty=requested_difficulty,
            question_count=body.question_count,
            focus=body.focus,
        )

        await db.commit()

        quiz = await get_quiz(
            db=db,
            quiz_id=quiz.id,
            session_id=str(session_id),
        )

        if quiz is None:
            raise HTTPException(
                status_code=500,
                detail="Knowledge quiz could not be loaded after creation",
            )

        questions = sorted(
            quiz.questions,
            key=lambda item: item.position,
        )

        return _quiz_response(quiz, questions)

    except HTTPException:
        raise
    except Exception as exc:
        await db.rollback()
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


@router.get(
    "/quiz/{quiz_id}",
    response_model=KnowledgeQuizSessionResponse,
    summary="Retrieve a persisted Knowledge Quiz",
)
async def get_knowledge_quiz(
    quiz_id: uuid.UUID,
    session_id: Annotated[str, Depends(get_anonymous_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> KnowledgeQuizSessionResponse:
    quiz = await get_quiz(
        db=db,
        quiz_id=quiz_id,
        session_id=str(session_id),
    )

    if quiz is None:
        raise HTTPException(
            status_code=404,
            detail="Knowledge quiz not found",
        )

    questions = sorted(
        quiz.questions,
        key=lambda item: item.position,
    )

    return _quiz_response(quiz, questions)


@router.post(
    "/quiz/{quiz_id}/submit",
    response_model=KnowledgeQuizResultResponse,
    summary="Submit and securely grade a Knowledge Quiz",
)
async def submit_knowledge_quiz(
    quiz_id: uuid.UUID,
    body: KnowledgeQuizSubmitRequest,
    session_id: Annotated[str, Depends(get_anonymous_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> KnowledgeQuizResultResponse:
    if body.quiz_id != str(quiz_id):
        raise HTTPException(
            status_code=400,
            detail="quiz_id in request body does not match the URL",
        )

    try:
        result = await submit_quiz(
            db=db,
            request=body,
            session_id=str(session_id),
        )

        completed_quiz = await get_quiz(
            db=db,
            quiz_id=quiz_id,
            session_id=str(session_id),
        )

        if completed_quiz is not None:
            await record_quiz_result(
                db=db,
                session_id=str(session_id),
                quiz=completed_quiz,
            )

        await db.commit()

        return result

    except ValueError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc
    except LookupError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        await db.rollback()
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

@router.get(
    "/progress",
    summary="Get the current learning overview",
)
async def learning_progress(
    session_id: Annotated[str, Depends(get_anonymous_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> KnowledgeLearningOverviewResponse:
    return await get_learning_overview(
        db=db,
        session_id=str(session_id),
    )


@router.get(
    "/progress/topics",
    summary="Get topic-level learning mastery",
)
async def topic_progress(
    session_id: Annotated[str, Depends(get_anonymous_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[KnowledgeTopicProgressResponse]:
    return await get_all_progress(
        db=db,
        session_id=str(session_id),
    )


@router.get(
    "/progress/topics/{topic_slug}",
    summary="Get mastery for one knowledge topic",
)
async def single_topic_progress(
    topic_slug: str,
    session_id: Annotated[str, Depends(get_anonymous_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> KnowledgeTopicProgressResponse | None:
    return await get_topic_progress(
        db=db,
        session_id=str(session_id),
        topic_slug=topic_slug,
    )


@router.get(
    "/history",
    summary="Get recent Knowledge Quiz history",
)
async def knowledge_history(
    session_id: Annotated[str, Depends(get_anonymous_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = Query(default=20, ge=1, le=100),
) -> KnowledgeHistoryResponse:
    return await get_history(
        db=db,
        session_id=str(session_id),
        limit=limit,
    )


@router.get(
    "/recommendations",
    summary="Get adaptive Knowledge recommendations",
)
async def knowledge_recommendations(
    session_id: Annotated[str, Depends(get_anonymous_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = Query(default=6, ge=1, le=20),
) -> KnowledgeRecommendationsResponse:
    return await get_recommendations(
        db=db,
        session_id=str(session_id),
        limit=limit,
    )


# ============================================================
# MARKET CONNECTIONS
# ============================================================

@router.post(
    "/connections",
    response_model=KnowledgeConnectionResponse,
    summary="Generate an AI market-connection map for a knowledge topic",
)
async def knowledge_connections(
    body: KnowledgeConnectionRequest,
) -> KnowledgeConnectionResponse:
    try:
        return await generate_connections(body)
    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


# ============================================================
# SCENARIO LAB
# ============================================================

@router.post(
    "/scenario",
    response_model=KnowledgeScenarioResponse,
    summary="Generate an educational Scenario Lab simulation",
)
async def knowledge_scenario(
    body: KnowledgeScenarioRequest,
) -> KnowledgeScenarioResponse:
    try:
        return await generate_scenario(body)
    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


@router.post(
    "/scenario/explain",
    response_model=KnowledgeScenarioExplainResponse,
    summary="Explain a Scenario Lab analytical choice",
)
async def knowledge_scenario_explain(
    body: KnowledgeScenarioExplainRequest,
) -> KnowledgeScenarioExplainResponse:
    try:
        return await explain_scenario_choice(body)
    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc
