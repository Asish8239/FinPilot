import type { Dashboard, ModuleSummary } from "@/types";

const lessons = (moduleSlug: string, titles: string[], completed = 0) => titles.map((title, index) => ({
  id: `${moduleSlug}-lesson-${index + 1}`,
  title,
  slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
  content_type: "article",
  order_index: index,
  estimated_minutes: 8 + index * 3,
  xp_reward: 40 + index * 10,
  is_published: true,
  completed: index < completed,
  xp_earned: index < completed ? 40 + index * 10 : 0,
}));

export const demoModules: ModuleSummary[] = [
  { id: "foundations", title: "Financial Foundations", slug: "financial-foundations", description: "Build the habits and vocabulary that make every money decision clearer.", level: "beginner", track: "C", order_index: 1, icon_url: null, is_published: true, lesson_count: 3, completed_count: 1, completion_pct: 33, lessons: lessons("financial-foundations", ["Your money map", "The power of a budget", "Building your safety net"], 1) },
  { id: "sips", title: "SIPs & Mutual Funds", slug: "sips-mutual-funds", description: "Learn how regular investing and diversification work together over time.", level: "beginner", track: "A", order_index: 2, icon_url: null, is_published: true, lesson_count: 3, completed_count: 0, completion_pct: 0, lessons: lessons("sips-mutual-funds", ["SIP, explained", "Compounding at work", "Choosing a mutual fund"], 0) },
  { id: "stocks", title: "Indian Stock Market", slug: "indian-stock-market", description: "Understand shares, indices, and the signals investors watch.", level: "intermediate", track: "B", order_index: 3, icon_url: null, is_published: true, lesson_count: 3, completed_count: 0, completion_pct: 0, lessons: lessons("indian-stock-market", ["What is a stock?", "Reading an index", "Risk and reward"], 0) },
  { id: "portfolio", title: "Portfolio & Investing", slug: "portfolio-investing", description: "Turn goals into a balanced, personal investment approach.", level: "intermediate", track: "A", order_index: 4, icon_url: null, is_published: true, lesson_count: 2, completed_count: 0, completion_pct: 0, lessons: lessons("portfolio-investing", ["Asset allocation", "Rebalancing basics"], 0) },
  { id: "trading", title: "Trading Fundamentals", slug: "trading-fundamentals", description: "Explore trading mechanics with a focus on discipline and risk.", level: "advanced", track: "B", order_index: 5, icon_url: null, is_published: true, lesson_count: 2, completed_count: 0, completion_pct: 0, lessons: lessons("trading-fundamentals", ["Orders and execution", "A trader's risk plan"], 0) },
  { id: "global", title: "Global Markets", slug: "global-markets", description: "See how economies, currencies, and markets connect worldwide.", level: "advanced", track: "B", order_index: 6, icon_url: null, is_published: true, lesson_count: 2, completed_count: 0, completion_pct: 0, lessons: lessons("global-markets", ["Markets without borders", "Currency and inflation"], 0) },
];

export const demoDashboard: Dashboard = {
  overall_completion_pct: 8,
  completed_lessons: 1,
  total_lessons: 15,
  current_streak: 4,
  longest_streak: 9,
  total_xp: 40,
  level: 1,
  xp_to_next_level: 60,
  recent_badges: [],
  recommended_lessons: [{ lesson_id: demoModules[0].lessons[1].id, lesson_title: "The power of a budget", module_title: "Financial Foundations", module_slug: demoModules[0].slug, lesson_slug: demoModules[0].lessons[1].slug, track: "C", xp_reward: 50 }],
  weekly_activity: [{ date: "2026-08-17", lessons_completed: 0, xp_earned: 0 }, { date: "2026-08-18", lessons_completed: 1, xp_earned: 40 }, { date: "2026-08-19", lessons_completed: 0, xp_earned: 0 }, { date: "2026-08-20", lessons_completed: 0, xp_earned: 0 }, { date: "2026-08-21", lessons_completed: 0, xp_earned: 0 }, { date: "2026-08-22", lessons_completed: 0, xp_earned: 0 }, { date: "2026-08-23", lessons_completed: 0, xp_earned: 0 }],
  budget_summary: null,
  calculator_history: [],
};
