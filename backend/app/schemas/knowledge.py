from __future__ import annotations

from pydantic import BaseModel, field_validator, Field


class KnowledgeTopic(BaseModel):
    slug: str
    name: str
    category: str
    region: str
    difficulty: str
    description: str
    related_topics: list[str] = Field(default_factory=list)


class KnowledgeTopicListResponse(BaseModel):
    topics: list[KnowledgeTopic]
    total: int


class KnowledgeLessonRequest(BaseModel):
    topic_slug: str
    difficulty: str = "beginner"
    focus: str | None = None


class KnowledgeLessonResponse(BaseModel):
    topic: KnowledgeTopic
    title: str
    level: str
    overview: str
    key_concepts: list[str]
    lesson: str
    examples: list[str]
    market_connection: str
    related_topics: list[KnowledgeTopic]
    generated_by: str = "finpilot-ai"

# ============================================================
# MARKET CONNECTIONS
# ============================================================

class KnowledgeConnectionRequest(BaseModel):
    topic_slug: str
    focus: str | None = None
    depth: str = "standard"

    @field_validator("depth")
    @classmethod
    def validate_depth(cls, v: str) -> str:
        value = v.strip().lower()
        if value not in {"quick", "standard", "deep"}:
            raise ValueError("depth must be quick, standard, or deep")
        return value


class KnowledgeConnectionNode(BaseModel):
    id: str
    label: str
    type: str
    region: str | None = None
    description: str


class KnowledgeConnectionLink(BaseModel):
    source: str
    target: str
    relationship: str
    explanation: str


class KnowledgeConnectionResponse(BaseModel):
    topic: KnowledgeTopic
    title: str
    thesis: str
    nodes: list[KnowledgeConnectionNode]
    connections: list[KnowledgeConnectionLink]
    market_implications: list[str]
    why_it_matters: str
    next_topics: list[KnowledgeTopic]
    generated_by: str = "finpilot-ai"
    educational_notice: str


# ============================================================
# SCENARIO LAB
# ============================================================

class KnowledgeScenarioRequest(BaseModel):
    topic_slug: str
    difficulty: str = "intermediate"
    scenario_type: str = "macro_shock"
    focus: str | None = None

    @field_validator("difficulty")
    @classmethod
    def validate_scenario_difficulty(cls, v: str) -> str:
        value = v.strip().lower()
        if value not in {"beginner", "intermediate", "advanced"}:
            raise ValueError(
                "difficulty must be beginner, intermediate, or advanced"
            )
        return value

    @field_validator("scenario_type")
    @classmethod
    def validate_scenario_type(cls, v: str) -> str:
        value = v.strip().lower()
        allowed = {
            "macro_shock",
            "market_event",
            "portfolio",
            "central_bank",
            "geopolitical",
            "commodity",
        }
        if value not in allowed:
            raise ValueError(
                "scenario_type must be macro_shock, market_event, "
                "portfolio, central_bank, geopolitical, or commodity"
            )
        return value


class KnowledgeScenarioChoice(BaseModel):
    id: str
    label: str
    description: str


class KnowledgeScenarioResponse(BaseModel):
    scenario_id: str
    topic: KnowledgeTopic
    title: str
    scenario_type: str
    context: str
    assumptions: list[str]
    choices: list[KnowledgeScenarioChoice]
    decision_prompt: str
    learning_objectives: list[str]
    related_topics: list[KnowledgeTopic]
    generated_by: str = "finpilot-ai"
    educational_notice: str


class KnowledgeScenarioExplainRequest(BaseModel):
    scenario_id: str
    topic_slug: str
    choice_id: str
    choice_label: str
    scenario_context: str


class KnowledgeScenarioExplainResponse(BaseModel):
    scenario_id: str
    choice_id: str
    choice_label: str
    explanation: str
    transmission_channels: list[str]
    tradeoffs: list[str]
    what_to_watch: list[str]
    related_topics: list[KnowledgeTopic]
    generated_by: str = "finpilot-ai"
    educational_notice: str


class KnowledgeQuizRequest(BaseModel):
    topic_slug: str
    difficulty: str = "beginner"
    question_count: int = 5
    focus: str | None = None

    @field_validator("difficulty")
    @classmethod
    def validate_difficulty(cls, v: str) -> str:
        value = v.strip().lower()
        if value not in {"beginner", "intermediate", "advanced"}:
            raise ValueError("difficulty must be beginner, intermediate, or advanced")
        return value

    @field_validator("question_count")
    @classmethod
    def validate_question_count(cls, v: int) -> int:
        if v < 3 or v > 10:
            raise ValueError("question_count must be between 3 and 10")
        return v


class KnowledgeQuizQuestion(BaseModel):
    id: str
    question: str
    options: list[dict]
    correct_answer: str | None = None
    explanation: str | None = None


class KnowledgeQuizResponse(BaseModel):
    topic: KnowledgeTopic
    title: str
    level: str
    questions: list[KnowledgeQuizQuestion]
    generated_by: str
    educational_notice: str



class KnowledgeQuizSubmitRequest(BaseModel):
    quiz_id: str
    answers: dict[str, str]


class KnowledgeQuizQuestionResult(BaseModel):
    id: str
    question: str
    selected_answer: str | None
    correct_answer: str
    is_correct: bool
    explanation: str


class KnowledgeQuizResultResponse(BaseModel):
    quiz_id: str
    topic_slug: str
    title: str
    score: float
    max_score: float
    percentage: float
    passed: bool
    feedback: str
    questions: list[KnowledgeQuizQuestionResult]


class KnowledgeQuizSessionQuestionResponse(BaseModel):
    id: str
    position: int
    question: str
    options: dict[str, str]


class KnowledgeQuizSessionResponse(BaseModel):
    quiz_id: str
    topic_slug: str
    topic_name: str
    difficulty: str
    title: str
    generated_by: str
    status: str
    question_count: int
    questions: list[KnowledgeQuizSessionQuestionResponse]
    educational_notice: str

class KnowledgeTopicProgressResponse(BaseModel):
    topic_slug: str
    topic_name: str
    attempts: int
    completed_attempts: int
    best_score: int
    best_percentage: float
    average_percentage: float
    mastery: float
    current_difficulty: str
    last_percentage: float
    last_result: str | None
    last_feedback: str | None
    last_attempt_at: str | None


class KnowledgeHistoryItemResponse(BaseModel):
    quiz_id: str
    topic_slug: str
    topic_name: str
    title: str
    difficulty: str
    score: int
    max_score: int
    percentage: float
    passed: bool
    status: str
    created_at: str
    completed_at: str | None


class KnowledgeHistoryResponse(BaseModel):
    items: list[KnowledgeHistoryItemResponse]
    total: int


class KnowledgeRecommendationResponse(BaseModel):
    topic_slug: str
    topic_name: str
    category: str
    region: str
    difficulty: str
    mastery: float
    reason: str


class KnowledgeRecommendationsResponse(BaseModel):
    recommendations: list[KnowledgeRecommendationResponse]


class KnowledgeLearningOverviewResponse(BaseModel):
    total_topics_started: int
    total_quizzes_completed: int
    average_mastery: float
    strongest_topic: KnowledgeTopicProgressResponse | None
    weakest_topic: KnowledgeTopicProgressResponse | None
    continue_topic: KnowledgeRecommendationResponse | None
    recent_history: list[KnowledgeHistoryItemResponse]
