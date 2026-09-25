"use client";

import LearnIntelligencePanel from "@/components/learn/LearnIntelligencePanel";
import KnowledgeConnectionMap from "@/components/learn/KnowledgeConnectionMap";
import ScenarioLab from "@/components/learn/ScenarioLab";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock,
  GraduationCap,
  Search,
  SlidersHorizontal,
  Sparkles,
  Globe2,
  X,
  Loader2,
  ChevronRight,
} from "lucide-react";

import {
  useModules,
  useKnowledgeTopics,
  useGenerateKnowledgeLesson,
  useCreateKnowledgeQuiz,
  useKnowledgeQuiz,
  useSubmitKnowledgeQuiz,
} from "@/hooks/useApi";
import { demoModules } from "@/lib/demo-data";
import { cn } from "@/lib/utils";
import type { ModuleSummary } from "@/types";

const LEVELS = [
  { id: "all", label: "All Topics" },
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

const LEVEL_META = {
  beginner: {
    label: "Beginner",
    description: "Build your financial foundation",
    badge:
      "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300",
    accent: "from-emerald-400 to-teal-300",
    number: "01",
  },
  intermediate: {
    label: "Intermediate",
    description: "Develop practical financial knowledge",
    badge:
      "border-amber-400/20 bg-amber-400/[0.06] text-amber-300",
    accent: "from-amber-400 to-orange-300",
    number: "02",
  },
  advanced: {
    label: "Advanced",
    description: "Explore deeper investing concepts",
    badge:
      "border-rose-400/20 bg-rose-400/[0.06] text-rose-300",
    accent: "from-rose-400 to-pink-300",
    number: "03",
  },
};

export default function LearnPage() {
  const [level, setLevel] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  
  const [knowledgeSearch, setKnowledgeSearch] =
    useState("");

  const [selectedKnowledgeTopic, setSelectedKnowledgeTopic] =
    useState<{
      slug: string;
      name: string;
      category: string;
      region: string;
      difficulty: string;
      description: string;
    } | null>(null);

  const [knowledgeQuizId, setKnowledgeQuizId] =
    useState<string | null>(null);

  const [knowledgeQuizAnswers, setKnowledgeQuizAnswers] =
    useState<Record<string, string>>({});

const query = useModules(
    level === "all" ? undefined : level
  ) as {
    data?: ModuleSummary[];
    isLoading: boolean;
  };


  const knowledgeQuery = useKnowledgeTopics({
    search: knowledgeSearch || undefined,
  });

  const generateKnowledgeLesson =
    useGenerateKnowledgeLesson();

  const createKnowledgeQuiz =
    useCreateKnowledgeQuiz();

  const knowledgeQuizQuery =
    useKnowledgeQuiz(knowledgeQuizId ?? "");

  const submitKnowledgeQuiz =
    useSubmitKnowledgeQuiz();

  const knowledgeQuiz =
    knowledgeQuizQuery.data;

  const resetKnowledgeQuiz = () => {
    setKnowledgeQuizId(null);
    setKnowledgeQuizAnswers({});
    createKnowledgeQuiz.reset();
    submitKnowledgeQuiz.reset();
  };

  const startKnowledgeQuiz = () => {
    if (!selectedKnowledgeTopic) return;

    setKnowledgeQuizAnswers({});
    submitKnowledgeQuiz.reset();

    createKnowledgeQuiz.mutate(
      {
        topic_slug: selectedKnowledgeTopic.slug,
        difficulty:
          selectedKnowledgeTopic.difficulty || "beginner",
        question_count: 5,
      },
      {
        onSuccess: (data) => {
          setKnowledgeQuizId(data.quiz_id);
        },
      }
    );
  };

  const allKnowledgeQuizQuestionsAnswered =
    !!knowledgeQuiz &&
    knowledgeQuiz.questions.length > 0 &&
    knowledgeQuiz.questions.every(
      (question) => !!knowledgeQuizAnswers[question.id]
    );

  const submitCurrentKnowledgeQuiz = () => {
    if (!knowledgeQuiz || !knowledgeQuizId) return;
    if (!allKnowledgeQuizQuestionsAnswered) return;

    submitKnowledgeQuiz.mutate({
      quizId: knowledgeQuizId,
      answers: knowledgeQuizAnswers,
    });
  };

  const modules = useMemo(() => {
    const apiModules = query.data ?? [];
    const source =
      apiModules.length > 0
        ? apiModules
        : (demoModules as ModuleSummary[]);

    return source.filter((module) => {
      if (level !== "all" && module.level !== level) {
        return false;
      }

      if (!searchQuery.trim()) {
        return true;
      }

      const search = searchQuery.toLowerCase();

      const moduleMatch =
        module.title.toLowerCase().includes(search) ||
        module.description?.toLowerCase().includes(search);

      const lessonMatch = module.lessons?.some((lesson) =>
        lesson.title.toLowerCase().includes(search)
      );

      return Boolean(moduleMatch || lessonMatch);
    });
  }, [query.data, level, searchQuery]);

  const totalLessons = modules.reduce(
    (sum, module) => sum + (module.lesson_count ?? 0),
    0
  );

  const completedLessons = modules.reduce(
    (sum, module) => sum + (module.completed_count ?? 0),
    0
  );

  const overallProgress =
    totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

  const continueLearning = useMemo(() => {
    return modules.find(
      (module) =>
        (module.completed_count ?? 0) > 0 &&
        (module.completed_count ?? 0) <
          (module.lesson_count ?? 0)
    );
  }, [modules]);

  return (
    <div className="relative min-h-full overflow-hidden bg-[#060a0f] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.5) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage:
              "radial-gradient(circle at center, black 0%, transparent 80%)",
          }}
        />

        <div className="absolute -left-40 -top-32 h-[440px] w-[440px] rounded-full bg-cyan-500/[0.035] blur-[140px]" />

        <div className="absolute right-[-180px] top-[20%] h-[480px] w-[480px] rounded-full bg-blue-500/[0.025] blur-[150px]" />

        <div className="absolute bottom-[-200px] left-[30%] h-[420px] w-[420px] rounded-full bg-emerald-500/[0.02] blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-[1450px] p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <header className="border-b border-white/[0.06] pb-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-5 flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-cyan-300" />

                <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-cyan-300/80">
                  Finance Library
                </span>

                <span className="text-[9px] text-slate-700">
                  /
                </span>

                <span className="text-[9px] uppercase tracking-[0.18em] text-slate-600">
                  Learn
                </span>
              </div>

              <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                Learn finance.
                <span className="bg-gradient-to-r from-cyan-300 via-white to-emerald-300 bg-clip-text text-transparent">
                  {" "}
                  One concept at a time.
                </span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">
                A structured finance library designed to take you from the
                fundamentals of money management to investing and financial
                planning. Read, understand, and apply each concept at your own
                pace.
              </p>
            </div>

            {/* Library summary */}
            <div className="w-full shrink-0 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 lg:w-[300px]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.06]">
                  <BookOpen className="h-4 w-4 text-cyan-300" />
                </div>

                <div>
                  <p className="text-[9px] uppercase tracking-[0.18em] text-slate-600">
                    Your library
                  </p>

                  <p className="mt-1 text-sm font-semibold text-white">
                    {modules.length}{" "}
                    {modules.length === 1 ? "course" : "courses"}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-5">
                <div>
                  <p className="text-2xl font-semibold text-white">
                    {totalLessons}
                  </p>

                  <p className="mt-1 text-[9px] uppercase tracking-[0.15em] text-slate-600">
                    Lessons
                  </p>
                </div>

                <div>
                  <p className="text-2xl font-semibold text-cyan-300">
                    {overallProgress}%
                  </p>

                  <p className="mt-1 text-[9px] uppercase tracking-[0.15em] text-slate-600">
                    Progress
                  </p>
                </div>
              </div>

              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300 transition-all duration-700"
                  style={{
                    width: `${overallProgress}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Global Knowledge Universe */}
        <section className="mt-7 overflow-hidden rounded-2xl border border-cyan-400/10 bg-gradient-to-br from-cyan-400/[0.045] via-white/[0.018] to-emerald-400/[0.035]">
          <div className="border-b border-white/[0.05] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.06]">
                    <Globe2 className="h-4 w-4 text-cyan-300" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
                    Global Knowledge Universe
                  </span>
                </div>

                <h2 className="mt-3 text-xl font-semibold tracking-[-0.025em] text-white sm:text-2xl">
                  Explore the world of finance.
                </h2>

                <p className="mt-1.5 max-w-2xl text-xs leading-5 text-slate-500 sm:text-sm">
                  Explore markets, macroeconomics, investing, quantitative
                  finance, risk, sustainability and more. Select any concept
                  and FinPilot will build the explanation for you on demand.
                </p>
              </div>

              <div className="relative w-full lg:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
                <input
                  value={knowledgeSearch}
                  onChange={(event) =>
                    setKnowledgeSearch(event.target.value)
                  }
                  placeholder="Search global finance..."
                  className="h-10 w-full rounded-xl border border-white/[0.07] bg-black/20 pl-9 pr-3 text-xs text-slate-200 outline-none transition-colors placeholder:text-slate-700 focus:border-cyan-400/25"
                />
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {knowledgeQuery.isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />
              </div>
            ) : knowledgeQuery.data?.topics?.length ? (
              <div className="flex flex-wrap gap-2.5">
                {knowledgeQuery.data.topics.map((topic) => (
                  <button
                    key={topic.slug}
                    type="button"
                    onClick={() => {
                      setSelectedKnowledgeTopic(topic);
                      generateKnowledgeLesson.mutate({
                        topic_slug: topic.slug,
                        difficulty:
                          topic.difficulty || "beginner",
                      });
                    }}
                    className="group relative overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400/20 hover:bg-cyan-400/[0.045]"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3 w-3 text-cyan-300/70 transition-colors group-hover:text-cyan-300" />
                      <span className="text-xs font-medium text-slate-200">
                        {topic.name}
                      </span>
                      <ChevronRight className="h-3 w-3 text-slate-700 transition-transform group-hover:translate-x-0.5 group-hover:text-cyan-300/70" />
                    </div>

                    <div className="mt-1.5 flex items-center gap-2 text-[9px] uppercase tracking-[0.12em] text-slate-600">
                      <span>{topic.category}</span>
                      <span>?</span>
                      <span>{topic.region}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-500">
                  No knowledge topics match your search.
                </p>
                <button
                  type="button"
                  onClick={() => setKnowledgeSearch("")}
                  className="mt-2 text-xs text-cyan-300 hover:text-cyan-200"
                >
                  Show all topics
                </button>
              </div>
            )}
          </div>
        </section>

        {/* AI-generated knowledge lesson */}
        {selectedKnowledgeTopic && (
          <section className="mt-4 overflow-hidden rounded-2xl border border-cyan-400/15 bg-white/[0.025]">
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.05] px-5 py-5 sm:px-6">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                  <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                    FinPilot AI Lesson
                  </span>
                </div>

                <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em] text-white">
                  {generateKnowledgeLesson.data?.title ??
                    selectedKnowledgeTopic.name}
                </h2>

                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[9px] uppercase tracking-[0.12em] text-slate-600">
                  <span>{selectedKnowledgeTopic.category}</span>
                  <span>?</span>
                  <span>{selectedKnowledgeTopic.region}</span>
                  <span>?</span>
                  <span>
                    {generateKnowledgeLesson.data?.level ??
                      selectedKnowledgeTopic.difficulty}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedKnowledgeTopic(null);
                  generateKnowledgeLesson.reset();
                  resetKnowledgeQuiz();
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] text-slate-600 transition-colors hover:border-white/[0.1] hover:text-slate-300"
                aria-label="Close AI lesson"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {generateKnowledgeLesson.isPending ? (
              <div className="flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06]">
                  <Sparkles className="h-5 w-5 animate-pulse text-cyan-300" />
                </div>

                <p className="mt-4 text-sm font-medium text-slate-200">
                  FinPilot is building your lesson...
                </p>

                <p className="mt-1 max-w-md text-xs leading-5 text-slate-600">
                  Creating an explanation, examples and market connections
                  specifically for this concept.
                </p>
              </div>
            ) : generateKnowledgeLesson.isError ? (
              <div className="px-6 py-10 text-center">
                <p className="text-sm text-rose-300">
                  We couldn&apos;t generate this lesson right now.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    generateKnowledgeLesson.mutate({
                      topic_slug: selectedKnowledgeTopic.slug,
                      difficulty:
                        selectedKnowledgeTopic.difficulty || "beginner",
                    })
                  }
                  className="mt-3 rounded-lg border border-white/[0.08] px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.04]"
                >
                  Try again
                </button>
              </div>
            ) : generateKnowledgeLesson.data ? (
              <div className="space-y-6 px-5 py-6 sm:px-6">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                    Overview
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    {generateKnowledgeLesson.data.overview}
                  </p>
                </div>

                {generateKnowledgeLesson.data.key_concepts?.length > 0 && (
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                      Key concepts
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {generateKnowledgeLesson.data.key_concepts.map(
                        (concept, index) => (
                          <div
                            key={`${concept}-${index}`}
                            className="rounded-xl border border-white/[0.05] bg-black/15 px-4 py-3"
                          >
                            <p className="text-xs leading-5 text-slate-300">
                              {concept}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                    Lesson
                  </p>
                  <div className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-300">
                    {generateKnowledgeLesson.data.lesson}
                  </div>
                </div>

                {generateKnowledgeLesson.data.examples?.length > 0 && (
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                      Examples
                    </p>
                    <div className="mt-3 space-y-2">
                      {generateKnowledgeLesson.data.examples.map(
                        (example, index) => (
                          <div
                            key={`${example}-${index}`}
                            className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.025] px-4 py-3"
                          >
                            <p className="text-xs leading-6 text-slate-300">
                              {example}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/[0.025] p-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-cyan-300/70">
                    Market connection
                  </p>
                  <p className="mt-2 text-xs leading-6 text-slate-300">
                    {generateKnowledgeLesson.data.market_connection}
                  </p>
                </div>

                {generateKnowledgeLesson.data.related_topics?.length > 0 && (
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                      Continue exploring
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {generateKnowledgeLesson.data.related_topics.map(
                        (related) => {
                          const relatedSlug =
                            typeof related === "string"
                              ? related
                              : related.slug;

                          const relatedName =
                            typeof related === "string"
                              ? related
                              : related.name;

                          const nextTopic =
                            knowledgeQuery.data?.topics?.find(
                              (item) =>
                                item.slug === relatedSlug ||
                                item.name.toLowerCase() ===
                                  relatedName.toLowerCase()
                            ) ??
                            (typeof related === "string"
                              ? undefined
                              : related);

                          return (
                            <button
                              key={relatedSlug}
                              type="button"
                              disabled={!nextTopic}
                              onClick={() => {
                                if (!nextTopic) return;

                                setSelectedKnowledgeTopic(nextTopic);
                                generateKnowledgeLesson.mutate({
                                  topic_slug: nextTopic.slug,
                                  difficulty:
                                    nextTopic.difficulty || "beginner",
                                });
                              }}
                              className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-slate-400 transition-colors hover:border-cyan-400/15 hover:text-cyan-300 disabled:cursor-default disabled:opacity-60"
                            >
                              {relatedName}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}

                <div className="border-t border-white/[0.05] pt-4">
                  <p className="text-[10px] leading-5 text-slate-600">
                    Educational content generated by FinPilot AI. It is
                    intended to build financial knowledge and should not be
                    treated as personalized investment advice.
                  </p>
                </div>
              </div>
            ) : null}
          </section>
        )}

        {/* Continue Learning */}
        {continueLearning &&
          !searchQuery &&
          level === "all" && (
            <section className="mt-7 overflow-hidden rounded-2xl border border-cyan-400/15 bg-gradient-to-r from-cyan-400/[0.06] via-white/[0.02] to-emerald-400/[0.035]">
              <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.07]">
                    <GraduationCap className="h-5 w-5 text-cyan-300" />
                  </div>

                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-cyan-300/70">
                      Continue reading
                    </p>

                    <h2 className="mt-1 text-base font-semibold text-white">
                      {continueLearning.title}
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      {continueLearning.completed_count ?? 0} of{" "}
                      {continueLearning.lesson_count ?? 0} lessons completed
                    </p>
                  </div>
                </div>

                <Link
                  href={`/learn/${continueLearning.slug}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.08] px-4 py-2.5 text-xs font-semibold text-cyan-200 transition-all hover:bg-cyan-400/[0.14]"
                >
                  Continue reading
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </section>
          )}

        {/* Search and filters */}
        <section className="mt-7 rounded-2xl border border-white/[0.07] bg-white/[0.018] p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

              <input
                type="text"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                placeholder="Search courses or lessons..."
                className="w-full rounded-xl border border-white/[0.07] bg-black/20 py-3 pl-11 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-700 focus:border-cyan-400/25 focus:bg-white/[0.025]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="mr-1 hidden items-center gap-2 sm:flex">
                <SlidersHorizontal className="h-3.5 w-3.5 text-slate-600" />

                <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                  Level
                </span>
              </div>

              {LEVELS.map((item) => {
                const active = level === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLevel(item.id)}
                    className={cn(
                      "rounded-lg border px-3.5 py-2 text-[11px] font-semibold transition-all duration-200",
                      active
                        ? "border-cyan-400/25 bg-cyan-400/[0.09] text-cyan-200"
                        : "border-white/[0.07] bg-white/[0.02] text-slate-500 hover:border-white/[0.13] hover:bg-white/[0.04] hover:text-slate-300"
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ============================================================
            2C ? MARKET CONNECTIONS + SCENARIO LAB
            ============================================================ */}
        {selectedKnowledgeTopic && (
          <div className="mt-7 space-y-7">
            <KnowledgeConnectionMap
              topic={selectedKnowledgeTopic}
              onTopicSelect={(nextTopic) => {
                setSelectedKnowledgeTopic(nextTopic);
                generateKnowledgeLesson.mutate({
                  topic_slug: nextTopic.slug,
                  difficulty: nextTopic.difficulty || "beginner",
                  focus:
                    "global markets, financial systems, and practical understanding",
                });
                resetKnowledgeQuiz();
              }}
            />

            <ScenarioLab
              topic={selectedKnowledgeTopic}
              onTopicSelect={(nextTopic) => {
                setSelectedKnowledgeTopic(nextTopic);
                generateKnowledgeLesson.mutate({
                  topic_slug: nextTopic.slug,
                  difficulty: nextTopic.difficulty || "beginner",
                  focus:
                    "global markets, financial systems, and practical understanding",
                });
                resetKnowledgeQuiz();
              }}
            />
          </div>
        )}

        <LearnIntelligencePanel />

        {/* Course library */}
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-cyan-300/60">
                Curriculum
              </p>

              <h2 className="mt-1 text-lg font-semibold text-white">
                Finance courses
              </h2>

              <p className="mt-1 text-xs text-slate-600">
                Work through the material in order or choose a topic that
                interests you.
              </p>
            </div>

            <p className="text-[10px] uppercase tracking-[0.15em] text-slate-700">
              {modules.length}{" "}
              {modules.length === 1 ? "course" : "courses"}
            </p>
          </div>

          {query.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-32 animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.025]"
                />
              ))}
            </div>
          ) : modules.length > 0 ? (
            <div className="space-y-3">
              {modules.map((module, index) => (
                <CourseCard
                  key={module.id}
                  module={module}
                  index={index}
                  expanded={expandedModule === module.id}
                  onToggle={() =>
                    setExpandedModule((current) =>
                      current === module.id
                        ? null
                        : module.id
                    )
                  }
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06]">
                <Search className="h-6 w-6 text-cyan-300/70" />
              </div>

              <h2 className="mt-5 text-sm font-semibold text-white">
                No courses found
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-slate-600">
                Try a different search term or choose another learning level.
              </p>

              {(searchQuery || level !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setLevel("all");
                  }}
                  className="mt-5 rounded-lg border border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-2 text-xs font-medium text-cyan-300 transition-colors hover:bg-cyan-400/[0.1]"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </section>

        {/* Learning philosophy */}
  
      {/* ======================================================
          AI KNOWLEDGE CHECK
          Persistent AI-generated quiz experience
         ====================================================== */}
      {selectedKnowledgeTopic && (
        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">
                  AI Knowledge Check
                </span>
              </div>

              <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Test what you just learned
              </h3>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                FinPilot generates a fresh educational quiz for
                <span className="font-semibold text-slate-900 dark:text-slate-200">
                  {" "}{selectedKnowledgeTopic.name}
                </span>.
                Your answers are graded securely by the backend.
              </p>
            </div>

            {!knowledgeQuizId && !createKnowledgeQuiz.isPending && (
              <button
                type="button"
                onClick={startKnowledgeQuiz}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                <Sparkles className="h-4 w-4" />
                Take AI Quiz
              </button>
            )}
          </div>

          {createKnowledgeQuiz.isPending && (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-4 text-sm text-indigo-800 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-300">
              <Loader2 className="h-5 w-5 animate-spin" />
              <div>
                <p className="font-semibold">Creating your quiz...</p>
                <p className="mt-0.5 opacity-80">
                  FinPilot is generating questions for this topic.
                </p>
              </div>
            </div>
          )}

          {createKnowledgeQuiz.isError && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
              <p className="font-semibold">Quiz generation failed.</p>
              <p className="mt-1">
                Please try again. Your lesson and learning progress are unaffected.
              </p>
              <button
                type="button"
                onClick={startKnowledgeQuiz}
                className="mt-3 rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-950"
              >
                Try Again
              </button>
            </div>
          )}

          {knowledgeQuizId && knowledgeQuiz && !submitKnowledgeQuiz.data && (
            <div className="mt-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    {knowledgeQuiz.title}
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {knowledgeQuiz.question_count} questions Â·{" "}
                    {knowledgeQuiz.difficulty} Â·{" "}
                    {Object.keys(knowledgeQuizAnswers).length}/
                    {knowledgeQuiz.question_count} answered
                  </p>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {knowledgeQuiz.status}
                </span>
              </div>

              <div className="space-y-5">
                {knowledgeQuiz.questions.map((question, index) => {
                  const selected =
                    knowledgeQuizAnswers[question.id];

                  return (
                    <div
                      key={question.id}
                      className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800"
                    >
                      <div className="flex gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {index + 1}
                        </span>

                        <p className="pt-1 text-sm font-semibold leading-6 text-slate-900 dark:text-white">
                          {question.question}
                        </p>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {(["A", "B", "C", "D"] as const).map((key) => {
                          const option = question.options[key];

                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() =>
                                setKnowledgeQuizAnswers((current) => ({
                                  ...current,
                                  [question.id]: key,
                                }))
                              }
                              className={`flex min-h-[56px] items-start gap-3 rounded-xl border p-3 text-left text-sm transition ${
                                selected === key
                                  ? "border-indigo-500 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/20 dark:border-indigo-400 dark:bg-indigo-950/30 dark:text-indigo-200"
                                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                              }`}
                            >
                              <span
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                                  selected === key
                                    ? "bg-indigo-500 text-white"
                                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                }`}
                              >
                                {key}
                              </span>

                              <span className="pt-1 leading-5">
                                {option}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  You need to answer every question before submitting.
                </p>

                <button
                  type="button"
                  onClick={submitCurrentKnowledgeQuiz}
                  disabled={
                    !allKnowledgeQuizQuestionsAnswered ||
                    submitKnowledgeQuiz.isPending
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitKnowledgeQuiz.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Grading...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Submit Quiz
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {knowledgeQuizId && knowledgeQuizQuery.isPending && !knowledgeQuiz && (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-5 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading your quiz...
            </div>
          )}

          {knowledgeQuizQuery.isError && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
              Unable to load this quiz session. Please start another quiz.
            </div>
          )}

          {submitKnowledgeQuiz.data && (
            <div className="mt-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Quiz Result
                    </p>
                    <h4 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                      {submitKnowledgeQuiz.data.score}/
                      {submitKnowledgeQuiz.data.max_score}
                    </h4>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {submitKnowledgeQuiz.data.percentage}% Â·{" "}
                      {submitKnowledgeQuiz.data.passed
                        ? "Passed"
                        : "Keep learning and try again"}
                    </p>
                  </div>

                  <div
                    className={`rounded-2xl px-5 py-4 text-center ${
                      submitKnowledgeQuiz.data.passed
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                    }`}
                  >
                    <p className="text-3xl font-black">
                      {Math.round(submitKnowledgeQuiz.data.percentage)}%
                    </p>
                    <p className="mt-1 text-xs font-semibold">
                      {submitKnowledgeQuiz.data.passed
                        ? "Knowledge check passed"
                        : "More practice recommended"}
                    </p>
                  </div>
                </div>

                <p className="mt-5 rounded-xl bg-white px-4 py-3 text-sm leading-6 text-slate-700 dark:bg-slate-950 dark:text-slate-300">
                  {submitKnowledgeQuiz.data.feedback}
                </p>
              </div>

              <div className="mt-5 space-y-4">
                {submitKnowledgeQuiz.data.questions.map(
                  (result, index) => (
                    <div
                      key={result.id}
                      className={`rounded-2xl border p-5 ${
                        result.is_correct
                          ? "border-emerald-200 dark:border-emerald-900/60"
                          : "border-red-200 dark:border-red-900/60"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                            result.is_correct
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                              : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                          }`}
                        >
                          {result.is_correct ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-6 text-slate-900 dark:text-white">
                            {index + 1}. {result.question}
                          </p>

                          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                            <div className="rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-800">
                              <span className="font-semibold">
                                Your answer:
                              </span>{" "}
                              {result.selected_answer}
                            </div>

                            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                              <span className="font-semibold">
                                Correct:
                              </span>{" "}
                              {result.correct_answer}
                            </div>
                          </div>

                          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                            {result.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={startKnowledgeQuiz}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  <Sparkles className="h-4 w-4" />
                  Take Another Quiz
                </button>

                <button
                  type="button"
                  onClick={resetKnowledgeQuiz}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  <X className="h-4 w-4" />
                  Close Quiz
                </button>
              </div>
            </div>
          )}

          {submitKnowledgeQuiz.isError && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
              <p className="font-semibold">Quiz submission failed.</p>
              <p className="mt-1">
                The quiz was not marked as completed. Please try submitting again.
              </p>
              <button
                type="button"
                onClick={submitCurrentKnowledgeQuiz}
                disabled={!allKnowledgeQuizQuestionsAnswered}
                className="mt-3 rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:hover:bg-red-950"
              >
                Submit Again
              </button>
            </div>
          )}
        </section>
      )}

      {modules.length > 0 && (
          <section className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.018] p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-400/[0.05]">
                <BookOpen className="h-4 w-4 text-emerald-300" />
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-200">
                  Learn like you are reading a good finance book
                </h3>

                <p className="mt-1 max-w-3xl text-xs leading-6 text-slate-600">
                  Start with the fundamentals. Understand the terminology.
                  Read the examples carefully. Then use FinPilot&apos;s
                  calculators and financial tools to apply what you have
                  learned to real situations.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-8 flex flex-col gap-2 border-t border-white/[0.05] py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-700">
              FinPilot Finance Library
            </span>
          </div>

          <div className="flex items-center gap-4 text-[9px] uppercase tracking-[0.15em] text-slate-800">
            <span>Learn</span>
            <span>Understand</span>
            <span>Apply</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function CourseCard({
  module,
  index,
  expanded,
  onToggle,
}: {
  module: ModuleSummary;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const completed = module.completion_pct >= 100;

  const completionPct = Math.min(
    Math.max(module.completion_pct ?? 0, 0),
    100
  );

  const level =
    module.level in LEVEL_META
      ? LEVEL_META[
          module.level as keyof typeof LEVEL_META
        ]
      : LEVEL_META.beginner;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-white/[0.025] transition-all duration-300",
        expanded
          ? "border-cyan-400/15 bg-white/[0.035]"
          : "border-white/[0.07] hover:border-white/[0.12] hover:bg-white/[0.035]"
      )}
    >
      {/* Accent */}
      <div
        className={cn(
          "absolute left-0 top-0 h-full w-0.5 bg-gradient-to-b opacity-50",
          level.accent
        )}
      />

      <div className="relative">
        <button
          type="button"
          onClick={onToggle}
          className="w-full p-5 text-left sm:p-6"
        >
          <div className="flex items-center gap-4">
            {/* Course number */}
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-black/20 sm:flex">
              <span className="text-xs font-bold text-slate-500">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>

            {/* Course information */}
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded-md border px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.15em]",
                    level.badge
                  )}
                >
                  {level.label}
                </span>

                {completed && (
                  <span className="flex items-center gap-1 text-[8px] font-semibold uppercase tracking-wider text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Completed
                  </span>
                )}
              </div>

              <h3 className="truncate text-sm font-semibold text-white sm:text-base">
                {module.title}
              </h3>

              {module.description && (
                <p className="mt-1 line-clamp-2 max-w-3xl text-[10px] leading-5 text-slate-600 sm:text-xs">
                  {module.description}
                </p>
              )}

              <p className="mt-2 hidden text-[9px] text-slate-700 sm:block">
                {level.description}
              </p>
            </div>

            {/* Course statistics */}
            <div className="hidden items-center gap-6 sm:flex">
              <div className="text-right">
                <p className="text-xs font-medium text-slate-300">
                  {module.completed_count ?? 0}/
                  {module.lesson_count ?? 0}
                </p>

                <p className="mt-1 text-[8px] uppercase tracking-wider text-slate-700">
                  lessons
                </p>
              </div>

              <div className="w-24">
                <div className="mb-1 flex justify-end">
                  <span className="text-[8px] font-semibold text-slate-600">
                    {completionPct}%
                  </span>
                </div>

                <div className="h-1 overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300 transition-all duration-700"
                    style={{
                      width: `${completionPct}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Expand */}
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.025] text-slate-600 transition-all duration-300",
                expanded &&
                  "rotate-180 border-cyan-400/15 text-cyan-300"
              )}
            >
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>

          {/* Mobile progress */}
          <div className="mt-4 sm:hidden">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[9px] text-slate-600">
                {module.completed_count ?? 0}/
                {module.lesson_count ?? 0} lessons
              </span>

              <span className="text-[9px] font-semibold text-slate-500">
                {completionPct}%
              </span>
            </div>

            <div className="h-1 overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300"
                style={{
                  width: `${completionPct}%`,
                }}
              />
            </div>
          </div>
        </button>

        {/* Lessons */}
        {expanded && (
          <div className="border-t border-white/[0.06] bg-black/10">
            {module.lessons.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <BookOpen className="mx-auto h-5 w-5 text-slate-700" />

                <p className="mt-3 text-xs text-slate-600">
                  Lessons are not available yet.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.045]">
                {module.lessons.map((lesson, lessonIndex) => (
                  <Link
                    key={lesson.id}
                    href={`/learn/${module.slug}/${lesson.slug}`}
                    className="group/lesson flex items-center gap-3 px-5 py-4 transition-all duration-200 hover:bg-white/[0.035] sm:px-6"
                  >
                    {/* Lesson status */}
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-[10px] font-semibold",
                        lesson.completed
                          ? "border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300"
                          : "border-white/[0.07] bg-white/[0.025] text-slate-500"
                      )}
                    >
                      {lesson.completed ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        lessonIndex + 1
                      )}
                    </div>

                    {/* Lesson information */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-slate-300 transition-colors group-hover/lesson:text-white">
                        {lesson.title}
                      </p>

                      <div className="mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[9px] text-slate-600">
                          <Clock className="h-3 w-3" />
                          {lesson.estimated_minutes} min
                        </span>

                        <span className="text-[9px] text-slate-700">
                          Reading lesson
                        </span>
                      </div>
                    </div>

                    <span className="hidden text-[9px] font-medium uppercase tracking-[0.15em] text-slate-700 transition-colors group-hover/lesson:text-cyan-300 sm:block">
                      {lesson.completed ? "Review" : "Read"}
                    </span>

                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-700 transition-all group-hover/lesson:translate-x-1 group-hover/lesson:text-cyan-300" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


