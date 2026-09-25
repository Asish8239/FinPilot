"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  api,
  type FinancialHealthUpdate,
  type FinancialGoalCreate,
  type FinancialGoalUpdate,
} from "@/lib/api";

import {
  demoDashboard,
  demoModules,
} from "@/lib/demo-data";

/* ============================================================
   DASHBOARD
============================================================ */

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.progress.dashboard(),
    placeholderData: demoDashboard,
    staleTime: 60_000,
  });
}

/* ============================================================
   MODULES
============================================================ */

export function useModules(level?: string) {
  return useQuery({
    queryKey: ["modules", level],
    queryFn: () => api.modules.list(level),
    placeholderData: demoModules.filter(
      (module) =>
        !level || module.level === level
    ),
    staleTime: 5 * 60_000,
  });
}

export function useModule(slug: string) {
  return useQuery({
    queryKey: ["module", slug],
    queryFn: () => api.modules.get(slug),
    enabled: !!slug,
  });
}

/* ============================================================
   LESSON
============================================================ */

export function useLesson(
  moduleSlug: string,
  lessonSlug: string
) {
  return useQuery({
    queryKey: [
      "lesson",
      moduleSlug,
      lessonSlug,
    ],
    queryFn: () =>
      api.modules.getLesson(
        moduleSlug,
        lessonSlug
      ),
    enabled:
      !!moduleSlug &&
      !!lessonSlug,
  });
}

/* ============================================================
   COMPLETE LESSON
============================================================ */

export function useCompleteLesson() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      moduleSlug,
      lessonSlug,
      time,
    }: {
      moduleSlug: string;
      lessonSlug: string;
      time: number;
    }) =>
      api.modules.completeLesson(
        moduleSlug,
        lessonSlug,
        time
      ),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["dashboard"],
      });

      qc.invalidateQueries({
        queryKey: ["modules"],
      });

      qc.invalidateQueries({
        queryKey: ["module"],
      });

      qc.invalidateQueries({
        queryKey: ["lesson"],
      });
    },
  });
}

/* ============================================================
   QUIZ
============================================================ */

/*
============================================================
  KNOWLEDGE
============================================================
*/



export function useCreateKnowledgeQuiz() {
  return useMutation({
    mutationFn: (body: {
      topic_slug: string;
      difficulty?: string;
      question_count?: number;
      focus?: string | null;
    }) => api.knowledge.createQuiz(body),
  });
}

export function useKnowledgeQuiz(quizId: string) {
  return useQuery({
    queryKey: ["knowledge-quiz", quizId],
    queryFn: () => api.knowledge.getQuiz(quizId),
    enabled: !!quizId,
    staleTime: 0,
  });
}

export function useSubmitKnowledgeQuiz() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      quizId,
      answers,
    }: {
      quizId: string;
      answers: Record<string, string>;
    }) =>
      api.knowledge.submitQuiz(quizId, {
        quiz_id: quizId,
        answers,
      }),

    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: ["knowledge-quiz", variables.quizId],
      });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["progress"] });
    },
  });
}

export function useKnowledgeTopics(params?: {
  search?: string;
  category?: string;
  region?: string;
  difficulty?: string;
}) {
  return useQuery({
    queryKey: ["knowledge-topics", params ?? {}],
    queryFn: () => api.knowledge.topics(params),
    staleTime: 10 * 60_000,
  });
}

export function useKnowledgeTopic(slug: string) {
  return useQuery({
    queryKey: ["knowledge-topic", slug],
    queryFn: () => api.knowledge.getTopic(slug),
    enabled: !!slug,
    staleTime: 10 * 60_000,
  });
}

export function useGenerateKnowledgeLesson() {
  return useMutation({
    mutationFn: (body: {
      topic_slug: string;
      difficulty?: string;
      focus?: string | null;
    }) => api.knowledge.generateLesson(body),
  });
}

export function useKnowledgeLearningOverview() {
  return useQuery({
    queryKey: ["knowledge-learning-overview"],
    queryFn: () => api.knowledge.learningOverview(),
    staleTime: 60_000,
  });
}

export function useKnowledgeTopicProgress() {
  return useQuery({
    queryKey: ["knowledge-topic-progress"],
    queryFn: () => api.knowledge.topicProgress(),
    staleTime: 60_000,
  });
}

export function useKnowledgeHistory() {
  return useQuery({
    queryKey: ["knowledge-history"],
    queryFn: () => api.knowledge.history(),
    staleTime: 60_000,
  });
}

export function useKnowledgeRecommendations() {
  return useQuery({
    queryKey: ["knowledge-recommendations"],
    queryFn: () => api.knowledge.recommendations(),
    staleTime: 60_000,
  });
}
export function useQuiz(quizId: string) {
  return useQuery({
    queryKey: ["quiz", quizId],
    queryFn: () =>
      api.quiz.get(quizId),
    enabled: !!quizId,
  });
}

/* ============================================================
   SUBMIT QUIZ
============================================================ */

export function useSubmitQuiz() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      quizId,
      answers,
      time,
    }: {
      quizId: string;
      answers: Record<string, string>;
      time: number;
    }) =>
      api.quiz.submit(
        quizId,
        answers,
        time
      ),

    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: [
          "quiz",
          variables.quizId,
        ],
      });

      qc.invalidateQueries({
        queryKey: ["dashboard"],
      });

      qc.invalidateQueries({
        queryKey: ["modules"],
      });

      qc.invalidateQueries({
        queryKey: ["progress"],
      });
    },
  });
}

/* ============================================================
   BADGES
============================================================ */

export function useBadges() {
  return useQuery({
    queryKey: ["badges"],
    queryFn: () =>
      api.progress.badges(),
  });
}

/* ============================================================
   TUTOR
============================================================ */

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: () =>
      api.tutor.listConversations(),
  });
}

export function useConversation(
  id: string
) {
  return useQuery({
    queryKey: [
      "conversation",
      id,
    ],
    queryFn: () =>
      api.tutor.getConversation(id),
    enabled: !!id,
  });
}

/* ============================================================
   BUDGET
============================================================ */

export function useBudget(
  month: string
) {
  return useQuery({
    queryKey: ["budget", month],

    queryFn: async () => {
      try {
        return await api.budget.get(
          month
        );
      } catch (error) {
        /*
         * A missing monthly budget is a valid
         * first-time state.
         *
         * Return null rather than undefined:
         * TanStack Query does not allow a queryFn
         * to resolve to undefined.
         */

        const message =
          error instanceof Error
            ? error.message.toLowerCase()
            : "";

        if (
          message.includes("404") ||
          message.includes("not found") ||
          message.includes(
            "budget plan"
          )
        ) {
          return null;
        }

        throw error;
      }
    },

    staleTime: 30_000,
  });
}

export function useCreateBudget() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: object) =>
      api.budget.create(body),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["budget"],
      });
    },
  });
}

export function useAddBudgetEntry() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      planId,
      body,
    }: {
      planId: string;
      body: object;
    }) =>
      api.budget.addEntry(
        planId,
        body
      ),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["budget"],
      });
    },
  });
}

export function useUpdateBudgetEntry() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      entryId,
      body,
    }: {
      entryId: string;
      body: object;
    }) =>
      api.budget.updateEntry(
        entryId,
        body
      ),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["budget"],
      });
    },
  });
}

export function useDeleteBudgetEntry() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (
      entryId: string
    ) =>
      api.budget.deleteEntry(
        entryId
      ),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["budget"],
      });
    },
  });
}

/* ============================================================
   FINANCIAL HEALTH
============================================================ */

export function useFinancialHealth() {
  return useQuery({
    queryKey: [
      "financial-health",
    ],
    queryFn: () =>
      api.financialHealth.get(),
    staleTime: 60_000,
    retry: false,
  });
}

export function useFinancialHealthSummary() {
  return useQuery({
    queryKey: [
      "financial-health",
      "summary",
    ],
    queryFn: () =>
      api.financialHealth.summary(),
    staleTime: 60_000,
    retry: false,
  });
}

export function useSaveFinancialHealth() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (
      body: FinancialHealthUpdate
    ) =>
      api.financialHealth.save(
        body
      ),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: [
          "financial-health",
        ],
      });

      qc.invalidateQueries({
        queryKey: ["dashboard"],
      });
    },
  });
}

/* ============================================================
   FINANCIAL GOALS
============================================================ */

export function useFinancialGoals() {
  return useQuery({
    queryKey: ["financial-goals"],
    queryFn: () =>
      api.goals.list(),
    staleTime: 30_000,
  });
}

export function useFinancialGoalsSummary() {
  return useQuery({
    queryKey: [
      "financial-goals",
      "summary",
    ],
    queryFn: () =>
      api.goals.summary(),
    staleTime: 30_000,
  });
}

export function useFinancialGoal(
  goalId: string
) {
  return useQuery({
    queryKey: [
      "financial-goal",
      goalId,
    ],
    queryFn: () =>
      api.goals.get(goalId),
    enabled: !!goalId,
  });
}

export function useFinancialGoalAnalysis(
  goalId: string
) {
  return useQuery({
    queryKey: [
      "financial-goal",
      goalId,
      "analysis",
    ],
    queryFn: () =>
      api.goals.analysis(goalId),
    enabled: !!goalId,
  });
}

export function useCreateFinancialGoal() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (
      body: FinancialGoalCreate
    ) =>
      api.goals.create(body),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: [
          "financial-goals",
        ],
      });

      qc.invalidateQueries({
        queryKey: ["dashboard"],
      });
    },
  });
}

export function useUpdateFinancialGoal() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      goalId,
      body,
    }: {
      goalId: string;
      body: FinancialGoalUpdate;
    }) =>
      api.goals.update(
        goalId,
        body
      ),

    onSuccess: (
      _data,
      variables
    ) => {
      qc.invalidateQueries({
        queryKey: [
          "financial-goals",
        ],
      });

      qc.invalidateQueries({
        queryKey: [
          "financial-goal",
          variables.goalId,
        ],
      });

      qc.invalidateQueries({
        queryKey: ["dashboard"],
      });
    },
  });
}

export function useDeleteFinancialGoal() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (
      goalId: string
    ) =>
      api.goals.remove(goalId),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: [
          "financial-goals",
        ],
      });

      qc.invalidateQueries({
        queryKey: ["dashboard"],
      });
    },
  });
}

/* ============================================================
   WATCHLIST
============================================================ */

export function useWatchlist() {
  return useQuery({
    queryKey: ["watchlist"],
    queryFn: () =>
      api.watchlist.list(),
    staleTime: 30_000,
  });
}

export function useAddWatchlist() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: object) =>
      api.watchlist.add(body),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["watchlist"],
      });

      qc.invalidateQueries({
        queryKey: ["dashboard"],
      });
    },
  });
}

export function useRemoveWatchlist() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (
      id: string
    ) =>
      api.watchlist.remove(id),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["watchlist"],
      });

      qc.invalidateQueries({
        queryKey: ["dashboard"],
      });
    },
  });
}


