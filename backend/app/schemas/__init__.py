# Re-export all public schema types for convenient importing
from app.schemas.user import UserResponse, UpdateProfileRequest
from app.schemas.learning import (
    LessonSummary, LessonResponse, ModuleSummary,
    ModuleDetailResponse, CompleteLessonRequest, CompleteLessonResponse,
)
from app.schemas.quiz import (
    QuestionResponse, QuizResponse, QuizSubmissionRequest,
    QuizResultResponse, QuizAttemptSummary, QuestionFeedback,
)
from app.schemas.progress import (
    DashboardResponse, BadgesResponse, BadgeResponse,
    DayActivity, RecommendedLesson,
)
from app.schemas.ai_tutor import (
    CreateConversationRequest, SendMessageRequest,
    MessageResponse, ConversationSummary, ConversationResponse,
)
from app.schemas.calculator import (
    SIPCalculatorRequest, SIPCalculatorResponse,
    LumpsumRequest, LumpsumResponse, YearlyProjection,
)
from app.schemas.budget import (
    CreateBudgetPlanRequest, UpdateBudgetPlanRequest,
    BudgetEntryRequest, UpdateBudgetEntryRequest,
    BudgetPlanResponse, BudgetEntryResponse, BudgetAllocation,
)
from app.schemas.watchlist import (
    AddWatchlistRequest, UpdateWatchlistRequest, WatchlistItemResponse,
)
from app.schemas.admin import (
    AdminAnalyticsResponse, CreateModuleRequest, UpdateModuleRequest,
    CreateLessonRequest, UpdateLessonRequest,
    CreateQuizRequest, CreateQuestionRequest,
)
