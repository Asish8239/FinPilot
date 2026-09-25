"use client";

import {
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Compass,
  History,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import {
  useKnowledgeHistory,
  useKnowledgeLearningOverview,
  useKnowledgeRecommendations,
  useKnowledgeTopicProgress,
} from "@/hooks/useApi";

function pct(value: unknown) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function label(value: unknown, fallback = "Beginner") {
  if (!value) return fallback;
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(value: unknown) {
  if (!value) return "Recently";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return "Recently";
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

export default function LearnIntelligencePanel() {
  const overview = useKnowledgeLearningOverview();
  const progress = useKnowledgeTopicProgress();
  const history = useKnowledgeHistory();
  const recommendations = useKnowledgeRecommendations();

  const o = overview.data;

  const totalTopics = Number(o?.total_topics ?? 0);
  const startedTopics = Number(o?.started_topics ?? 0);
  const masteredTopics = Number(o?.mastered_topics ?? 0);
  const attempts = Number(o?.total_attempts ?? 0);
  const averagePercentage = pct(o?.average_percentage);
  const averageMastery = pct(o?.average_mastery);

  const recommendationItems =
    recommendations.data?.recommendations ??
    o?.recommendations ??
    [];

  const historyItems =
    history.data?.items ??
    o?.recent_history ??
    [];

  const progressItems = progress.data ?? [];

  const strongestTopics =
    o?.strongest_topics?.length
      ? o.strongest_topics
      : [...progressItems]
          .sort((a, b) => pct(b.mastery) - pct(a.mastery))
          .slice(0, 3);

  return (
    <section className="mt-8 overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#071018] shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
      {/* Ambient header */}
      <div className="relative overflow-hidden border-b border-white/[0.06] px-5 py-6 sm:px-7 sm:py-7">
        <div className="pointer-events-none absolute -right-24 -top-32 h-72 w-72 rounded-full bg-cyan-400/[0.07] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-1/3 h-72 w-72 rounded-full bg-emerald-400/[0.045] blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/[0.06] px-3 py-1.5">
              <BrainCircuit className="h-3.5 w-3.5 text-cyan-300" />
              <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-cyan-200">
                Learning Intelligence
              </span>
            </div>

            <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Your financial knowledge,{" "}
              <span className="text-cyan-300">evolving.</span>
            </h2>

            <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-500 sm:text-sm">
              FinPilot adapts your learning path from the topics you explore,
              the quizzes you complete, and the concepts you master.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2">
            <Compass className="h-4 w-4 text-emerald-300" />
            <div>
              <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                Current level
              </p>
              <p className="mt-0.5 text-xs font-semibold text-slate-200">
                {label(o?.current_level)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 border-b border-white/[0.06] sm:grid-cols-4">
        {[
          {
            icon: Target,
            value: `${averageMastery}%`,
            title: "Average mastery",
            accent: "text-cyan-300",
          },
          {
            icon: BarChart3,
            value: `${averagePercentage}%`,
            title: "Quiz performance",
            accent: "text-emerald-300",
          },
          {
            icon: Compass,
            value: `${startedTopics}/${totalTopics || "—"}`,
            title: "Topics explored",
            accent: "text-violet-300",
          },
          {
            icon: TrendingUp,
            value: `${attempts}`,
            title: "Quiz attempts",
            accent: "text-amber-300",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="border-b border-r border-white/[0.05] px-4 py-5 last:border-r-0 sm:border-b-0"
            >
              <Icon className={`h-4 w-4 ${item.accent}`} />
              <p className="mt-3 text-lg font-semibold tracking-tight text-white">
                {item.value}
              </p>
              <p className="mt-1 text-[9px] uppercase tracking-[0.15em] text-slate-600">
                {item.title}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[1.2fr_0.8fr] sm:p-7">
        {/* Recommendations */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.018] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
                Adaptive path
              </p>
              <h3 className="mt-1 text-sm font-semibold text-white">
                Continue learning
              </h3>
            </div>
            <Sparkles className="h-4 w-4 text-cyan-300" />
          </div>

          <div className="mt-4 space-y-2">
            {recommendationItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/[0.07] px-4 py-7 text-center">
                <Compass className="mx-auto h-5 w-5 text-slate-700" />
                <p className="mt-2 text-xs text-slate-600">
                  Explore a topic or complete a quiz to build your adaptive
                  learning path.
                </p>
              </div>
            ) : (
              recommendationItems.slice(0, 4).map((item) => (
                <div
                  key={item.topic_slug}
                  className="group flex items-center gap-3 rounded-xl border border-white/[0.055] bg-black/10 p-3 transition-all duration-200 hover:border-cyan-400/15 hover:bg-cyan-400/[0.025]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-400/10 bg-cyan-400/[0.05]">
                    <BrainCircuit className="h-4 w-4 text-cyan-300" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-slate-200">
                      {item.topic_name}
                    </p>
                    <p className="mt-1 line-clamp-1 text-[9px] text-slate-600">
                      {item.reason || item.description}
                    </p>
                  </div>

                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-700 transition-transform group-hover:translate-x-0.5 group-hover:text-cyan-300" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mastery */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.018] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
                Topic mastery
              </p>
              <h3 className="mt-1 text-sm font-semibold text-white">
                Strongest areas
              </h3>
            </div>
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          </div>

          <div className="mt-5 space-y-4">
            {strongestTopics.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-600">
                Your strongest topics will appear here as you learn.
              </p>
            ) : (
              strongestTopics.map((item) => {
                const mastery = pct(item.mastery);

                return (
                  <div key={item.topic_slug}>
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <span className="truncate text-[10px] font-medium text-slate-300">
                        {item.topic_name}
                      </span>
                      <span className="shrink-0 text-[9px] font-semibold text-slate-500">
                        {mastery}%
                      </span>
                    </div>

                    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300 transition-all duration-700"
                        style={{ width: `${mastery}%` }}
                      />
                    </div>

                    <p className="mt-1.5 text-[8px] uppercase tracking-[0.14em] text-slate-700">
                      {label(item.current_difficulty)} ·{" "}
                      {item.attempts ?? 0} attempts
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* History */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.018] p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-violet-300/80">
                Learning history
              </p>
              <h3 className="mt-1 text-sm font-semibold text-white">
                Recent knowledge checks
              </h3>
            </div>
            <History className="h-4 w-4 text-violet-300" />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {historyItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/[0.07] px-4 py-6 text-center sm:col-span-2 lg:col-span-4">
                <History className="mx-auto h-5 w-5 text-slate-700" />
                <p className="mt-2 text-xs text-slate-600">
                  Your completed AI quizzes will appear here.
                </p>
              </div>
            ) : (
              historyItems.slice(0, 8).map((item) => (
                <div
                  key={item.quiz_id}
                  className="rounded-xl border border-white/[0.055] bg-black/10 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-1 text-[10px] font-medium text-slate-300">
                      {item.topic_name}
                    </p>
                    <span
                      className={
                        item.passed
                          ? "text-[8px] font-semibold uppercase tracking-wider text-emerald-300"
                          : "text-[8px] font-semibold uppercase tracking-wider text-amber-300"
                      }
                    >
                      {item.passed ? "Passed" : "Review"}
                    </span>
                  </div>

                  <div className="mt-3 flex items-end justify-between">
                    <span className="text-lg font-semibold text-white">
                      {pct(item.percentage)}%
                    </span>
                    <span className="text-[8px] uppercase tracking-wider text-slate-700">
                      {formatDate(item.completed_at || item.created_at)}
                    </span>
                  </div>

                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.05]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-300"
                      style={{ width: `${pct(item.percentage)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mastery summary */}
        <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-cyan-400/[0.045] to-transparent p-5 lg:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
                Knowledge trajectory
              </p>
              <h3 className="mt-1 text-sm font-semibold text-white">
                {masteredTopics} mastered topics
              </h3>
              <p className="mt-1 max-w-xl text-[10px] leading-5 text-slate-600">
                Mastery grows from repeated learning and quiz performance.
                FinPilot uses your recent results to adjust the difficulty of
                future knowledge checks.
              </p>
            </div>

            <div className="min-w-[180px]">
              <div className="mb-1.5 flex justify-between">
                <span className="text-[8px] uppercase tracking-wider text-slate-700">
                  Learning coverage
                </span>
                <span className="text-[9px] font-semibold text-cyan-300">
                  {totalTopics
                    ? Math.round((startedTopics / totalTopics) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300"
                  style={{
                    width: `${
                      totalTopics
                        ? Math.min(
                            100,
                            Math.round((startedTopics / totalTopics) * 100)
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
