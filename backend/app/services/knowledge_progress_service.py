from __future__ import annotations

from datetime import timezone

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.knowledge_progress import KnowledgeLearningProgress
from app.models.knowledge_quiz import KnowledgeQuizSession
from app.schemas.knowledge import (
    KnowledgeHistoryItemResponse,
    KnowledgeHistoryResponse,
    KnowledgeLearningOverviewResponse,
    KnowledgeRecommendationResponse,
    KnowledgeRecommendationsResponse,
    KnowledgeTopicProgressResponse,
)
from app.services.knowledge_service import get_topic, list_topics


def _difficulty_for_mastery(mastery: float, attempts: int) -> str:
    if attempts <= 0:
        return "beginner"
    if mastery >= 80:
        return "advanced"
    if mastery >= 55:
        return "intermediate"
    return "beginner"


def _mastery_after_attempt(
    old_mastery: float,
    percentage: float,
    attempts: int,
) -> float:
    if attempts <= 1:
        raw = percentage
    else:
        raw = (old_mastery * 0.55) + (percentage * 0.45)

    return round(max(0.0, min(100.0, raw)), 2)


def _progress_response(
    progress: KnowledgeLearningProgress,
) -> KnowledgeTopicProgressResponse:
    return KnowledgeTopicProgressResponse(
        topic_slug=progress.topic_slug,
        topic_name=progress.topic_name,
        attempts=progress.attempts,
        completed_attempts=progress.completed_attempts,
        best_score=progress.best_score,
        best_percentage=round(progress.best_percentage, 2),
        average_percentage=round(progress.average_percentage, 2),
        mastery=round(progress.mastery, 2),
        current_difficulty=progress.current_difficulty,
        last_percentage=round(progress.last_percentage, 2),
        last_result=progress.last_result,
        last_feedback=progress.last_feedback,
        last_attempt_at=(
            progress.last_attempt_at.astimezone(timezone.utc).isoformat()
            if progress.last_attempt_at
            else None
        ),
    )


def _history_response(
    quiz: KnowledgeQuizSession,
) -> KnowledgeHistoryItemResponse:
    return KnowledgeHistoryItemResponse(
        quiz_id=str(quiz.id),
        topic_slug=quiz.topic_slug,
        topic_name=quiz.topic_name,
        title=quiz.title,
        difficulty=quiz.difficulty,
        score=quiz.score,
        max_score=quiz.max_score,
        percentage=round(quiz.percentage, 2),
        passed=quiz.passed,
        status=quiz.status,
        created_at=quiz.created_at.astimezone(timezone.utc).isoformat(),
        completed_at=(
            quiz.completed_at.astimezone(timezone.utc).isoformat()
            if quiz.completed_at
            else None
        ),
    )


async def record_quiz_result(
    db: AsyncSession,
    *,
    session_id: str,
    quiz: KnowledgeQuizSession,
) -> KnowledgeLearningProgress:
    result = await db.execute(
        select(KnowledgeLearningProgress).where(
            KnowledgeLearningProgress.session_id == session_id,
            KnowledgeLearningProgress.topic_slug == quiz.topic_slug,
        )
    )

    progress = result.scalar_one_or_none()

    if progress is None:
        progress = KnowledgeLearningProgress(
            session_id=session_id,
            topic_slug=quiz.topic_slug,
            topic_name=quiz.topic_name,
        )
        db.add(progress)
        await db.flush()

    previous_completed = progress.completed_attempts

    progress.attempts += 1

    if quiz.status == "completed":
        progress.completed_attempts += 1
        progress.last_percentage = quiz.percentage
        progress.last_result = "passed" if quiz.passed else "practice"
        progress.last_feedback = quiz.feedback

        progress.best_score = max(progress.best_score, quiz.score)
        progress.best_percentage = max(
            progress.best_percentage,
            quiz.percentage,
        )

        if previous_completed == 0:
            progress.average_percentage = quiz.percentage
        else:
            progress.average_percentage = (
                progress.average_percentage * previous_completed
                + quiz.percentage
            ) / progress.completed_attempts

        progress.mastery = _mastery_after_attempt(
            progress.mastery,
            quiz.percentage,
            progress.completed_attempts,
        )

        progress.current_difficulty = _difficulty_for_mastery(
            progress.mastery,
            progress.completed_attempts,
        )

        progress.last_attempt_at = quiz.completed_at or quiz.created_at

    return progress


async def get_topic_progress(
    db: AsyncSession,
    *,
    session_id: str,
    topic_slug: str,
) -> KnowledgeTopicProgressResponse | None:
    result = await db.execute(
        select(KnowledgeLearningProgress).where(
            KnowledgeLearningProgress.session_id == session_id,
            KnowledgeLearningProgress.topic_slug == topic_slug,
        )
    )

    progress = result.scalar_one_or_none()

    return _progress_response(progress) if progress else None


async def get_history(
    db: AsyncSession,
    *,
    session_id: str,
    limit: int = 20,
) -> KnowledgeHistoryResponse:
    result = await db.execute(
        select(KnowledgeQuizSession)
        .where(KnowledgeQuizSession.session_id == session_id)
        .order_by(desc(KnowledgeQuizSession.created_at))
        .limit(max(1, min(limit, 100)))
    )

    items = [
        _history_response(item)
        for item in result.scalars().all()
    ]

    return KnowledgeHistoryResponse(
        items=items,
        total=len(items),
    )


async def get_all_progress(
    db: AsyncSession,
    *,
    session_id: str,
) -> list[KnowledgeTopicProgressResponse]:
    result = await db.execute(
        select(KnowledgeLearningProgress)
        .where(KnowledgeLearningProgress.session_id == session_id)
        .order_by(
            desc(KnowledgeLearningProgress.mastery),
            KnowledgeLearningProgress.topic_name,
        )
    )

    return [
        _progress_response(item)
        for item in result.scalars().all()
    ]


async def get_recommendations(
    db: AsyncSession,
    *,
    session_id: str,
    limit: int = 6,
) -> KnowledgeRecommendationsResponse:
    result = await db.execute(
        select(KnowledgeLearningProgress)
        .where(KnowledgeLearningProgress.session_id == session_id)
        .order_by(desc(KnowledgeLearningProgress.last_attempt_at))
    )

    progress_items = result.scalars().all()
    by_slug = {item.topic_slug: item for item in progress_items}

    recommendations = []

    # Revisit unfinished topics first.
    for progress in sorted(
        progress_items,
        key=lambda item: (
            item.mastery >= 80,
            item.mastery,
            -(
                item.last_attempt_at.timestamp()
                if item.last_attempt_at
                else 0
            ),
        ),
    ):
        if len(recommendations) >= limit:
            break

        topic = get_topic(progress.topic_slug)

        if topic is None or progress.mastery >= 80:
            continue

        reason = (
            "Reinforce this topic before moving ahead."
            if progress.mastery < 55
            else "Another knowledge check can strengthen your mastery."
        )

        recommendations.append(
            KnowledgeRecommendationResponse(
                topic_slug=topic.slug,
                topic_name=topic.name,
                category=topic.category,
                region=topic.region,
                difficulty=progress.current_difficulty,
                mastery=round(progress.mastery, 2),
                reason=reason,
            )
        )

    # Follow existing topic relationships.
    candidate_slugs = []

    for progress in progress_items:
        topic = get_topic(progress.topic_slug)

        if topic:
            for related in topic.related_topics:
                slug = (
                    related.slug
                    if hasattr(related, "slug")
                    else str(related)
                )
                if slug not in candidate_slugs:
                    candidate_slugs.append(slug)

    # Then expose untouched topics from the global universe.
    for topic in list_topics():
        if topic.slug not in candidate_slugs:
            candidate_slugs.append(topic.slug)

    for slug in candidate_slugs:
        if len(recommendations) >= limit:
            break

        if slug in by_slug:
            continue

        topic = get_topic(slug)

        if topic is None:
            continue

        recommendations.append(
            KnowledgeRecommendationResponse(
                topic_slug=topic.slug,
                topic_name=topic.name,
                category=topic.category,
                region=topic.region,
                difficulty=topic.difficulty or "beginner",
                mastery=0.0,
                reason="New topic connected to your financial learning path.",
            )
        )

    return KnowledgeRecommendationsResponse(
        recommendations=recommendations[:limit]
    )


async def get_learning_overview(
    db: AsyncSession,
    *,
    session_id: str,
) -> KnowledgeLearningOverviewResponse:
    progress = await get_all_progress(
        db,
        session_id=session_id,
    )

    history = await get_history(
        db,
        session_id=session_id,
        limit=5,
    )

    average_mastery = (
        sum(item.mastery for item in progress) / len(progress)
        if progress
        else 0.0
    )

    strongest = progress[0] if progress else None

    weakest = (
        sorted(progress, key=lambda item: item.mastery)[0]
        if progress
        else None
    )

    recommendations = await get_recommendations(
        db,
        session_id=session_id,
        limit=1,
    )

    return KnowledgeLearningOverviewResponse(
        total_topics_started=len(progress),
        total_quizzes_completed=sum(
            item.completed_attempts
            for item in progress
        ),
        average_mastery=round(average_mastery, 2),
        strongest_topic=strongest,
        weakest_topic=weakest,
        continue_topic=(
            recommendations.recommendations[0]
            if recommendations.recommendations
            else None
        ),
        recent_history=history.items,
    )
