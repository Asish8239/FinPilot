// ─── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  onboarding_done: boolean;
  created_at: string;
}

// ─── Learning ─────────────────────────────────────────────────────────────────
export interface LessonSummary {
  id: string;
  title: string;
  slug: string;
  content_type: string;
  order_index: number;
  estimated_minutes: number;
  xp_reward: number;
  is_published: boolean;
  completed: boolean;
  xp_earned: number;
}

export interface LessonDetail extends LessonSummary {
  module_id: string;
  content_markdown: string | null;
  video_url: string | null;
  created_at: string;
}

export interface ModuleSummary {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  level: string;
  track: string | null;
  order_index: number;
  icon_url: string | null;
  is_published: boolean;
  lesson_count: number;
  completed_count: number;
  completion_pct: number;
  lessons: LessonSummary[];
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────
export interface Question {
  id: string;
  question_text: string;
  question_type: "mcq" | "true_false" | "fill_blank";
  options: { key: string; text: string }[] | null;
  difficulty: string;
  points: number;
  order_index: number;
}

export interface Quiz {
  id: string;
  lesson_id: string;
  title: string;
  passing_score: number;
  max_attempts: number;
  questions: Question[];
  attempts_used: number;
}

export interface QuestionFeedback {
  correct: boolean;
  user_answer: string;
  correct_answer: string;
  explanation: string | null;
  points_earned: number;
}

export interface QuizResult {
  attempt_id: string;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  attempt_number: number;
  feedback: Record<string, QuestionFeedback>;
  time_taken_sec: number;
}

// ─── Progress ─────────────────────────────────────────────────────────────────
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  criteria_type: string;
  criteria_value: number;
  earned: boolean;
  earned_at: string | null;
}

export interface BadgesResponse {
  earned: Badge[];
  available: Badge[];
}

export interface DayActivity {
  date: string;
  lessons_completed: number;
  xp_earned: number;
}

export interface RecommendedLesson {
  lesson_id: string;
  lesson_title: string;
  module_title: string;
  module_slug: string;
  lesson_slug: string;
  track: string | null;
  xp_reward: number;
}

export interface BudgetSnapshot {
  income: number;
  spent: number;
  remaining: number;
  savings_rate: number;
}

export interface SIPSnapshot {
  id: string;
  calculator_type: string;
  params: Record<string, number>;
  result_maturity: number;
  result_total_invested: number;
  created_at: string;
}

export interface Dashboard {
  overall_completion_pct: number;
  completed_lessons: number;
  total_lessons: number;
  current_streak: number;
  longest_streak: number;
  total_xp: number;
  level: number;
  xp_to_next_level: number;
  recent_badges: Badge[];
  recommended_lessons: RecommendedLesson[];
  weekly_activity: DayActivity[];
  budget_summary: BudgetSnapshot | null;
  calculator_history: SIPSnapshot[];
}

// ─── AI Tutor ─────────────────────────────────────────────────────────────────
export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  lesson_id: string | null;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

// ─── Calculator ───────────────────────────────────────────────────────────────
export interface YearlyProjection {
  year: number;
  invested: number;
  value: number;
  returns: number;
}

export interface SIPResult {
  maturity_value: number;
  total_invested: number;
  wealth_gained: number;
  inflation_adjusted_value: number;
  yearly_projections: YearlyProjection[];
  history_id?: string;
}

// ─── Budget ───────────────────────────────────────────────────────────────────
export interface BudgetEntry {
  id: string;
  plan_id: string;
  category: "needs" | "wants" | "savings" | "investments";
  label: string;
  budgeted: number;
  actual: number;
  created_at: string;
}

export interface BudgetAllocation {
  needs: number;
  wants: number;
  savings_investments: number;
}

export interface BudgetPlan {
  id: string;
  user_id: string;
  month: string;
  monthly_income: number;
  currency: string;
  suggested_allocation: BudgetAllocation;
  entries: BudgetEntry[];
  total_budgeted: number;
  total_actual: number;
  surplus: number;
  savings_rate: number;
  created_at: string;
  updated_at: string;
}

// ─── Watchlist ────────────────────────────────────────────────────────────────
export interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  notes: string | null;
  added_at: string;
}
