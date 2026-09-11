/**
 * API client for FinPilot backend.
 *
 * Identity strategy:
 *
 * Anonymous:
 *   - A UUID is generated once per browser and stored in localStorage.
 *   - Every request carries X-Session-ID.
 *
 * Authenticated:
 *   - Supabase provides the access token.
 *   - Every request also carries:
 *
 *       Authorization: Bearer <Supabase access token>
 *
 *   - The backend verifies the token and maps the Supabase identity
 *     to FinPilot's local users table.
 *
 * Both headers are intentionally preserved so anonymous data can later
 * be migrated to the authenticated account.
 */

import type { QuizResult } from "@/types";
import { createClient } from "@/lib/supabase/client";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─────────────────────────────────────────────────────────────
// Anonymous session ID
// ─────────────────────────────────────────────────────────────

const SESSION_KEY = "finpilot_session_id";

function getSessionId(): string {
  if (typeof window === "undefined") {
    return "00000000-0000-0000-0000-000000000000";
  }

  let id = localStorage.getItem(SESSION_KEY);

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }

  return id;
}

// ─────────────────────────────────────────────────────────────
// Supabase authentication
// ─────────────────────────────────────────────────────────────

const supabase = createClient();

async function getAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.warn(
      "Unable to retrieve Supabase session:",
      error.message
    );
    return null;
  }

  return session?.access_token ?? null;
}

// ─────────────────────────────────────────────────────────────
// API Error
// ─────────────────────────────────────────────────────────────

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// ─────────────────────────────────────────────────────────────
// Core request function
// ─────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}/api/v1${path}`;

  const accessToken = await getAccessToken();

  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");
  headers.set("X-Session-ID", getSessionId());

  if (accessToken) {
    headers.set(
      "Authorization",
      `Bearer ${accessToken}`
    );
  } else {
    headers.delete("Authorization");
  }

  let res: Response;

  try {
    res = await fetch(url, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new ApiError(
      error instanceof Error
        ? error.message
        : "Unable to connect to the FinPilot backend.",
      0
    );
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));

    const message =
      body?.detail ??
      body?.error?.message ??
      body?.message ??
      `API error ${res.status}`;

    throw new ApiError(message, res.status);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

// ─────────────────────────────────────────────────────────────
// API surface
// ─────────────────────────────────────────────────────────────

export const api = {
  // ───────────────────────────────────────────────────────────
  // Authentication
  // ───────────────────────────────────────────────────────────

  auth: {
    status: () =>
      request("/auth/status"),

    me: () =>
      request("/auth/me"),
  },

  // ───────────────────────────────────────────────────────────
  // Modules
  // ───────────────────────────────────────────────────────────

  modules: {
    list: (level?: string) =>
      request(
        `/modules${level ? `?level=${encodeURIComponent(level)}` : ""}`
      ),

    get: (slug: string) =>
      request(`/modules/${encodeURIComponent(slug)}`),

    getLesson: (
      moduleSlug: string,
      lessonSlug: string
    ) =>
      request(
        `/modules/${encodeURIComponent(
          moduleSlug
        )}/lessons/${encodeURIComponent(lessonSlug)}`
      ),

    completeLesson: (
      moduleSlug: string,
      lessonSlug: string,
      timeSpentSec: number
    ) =>
      request(
        `/modules/${encodeURIComponent(
          moduleSlug
        )}/lessons/${encodeURIComponent(
          lessonSlug
        )}/complete`,
        {
          method: "POST",
          body: JSON.stringify({
            time_spent_sec: timeSpentSec,
          }),
        }
      ),
  },

  // ───────────────────────────────────────────────────────────
  // Quiz
  // ───────────────────────────────────────────────────────────

  quiz: {
    get: (quizId: string) =>
      request(`/quizzes/${encodeURIComponent(quizId)}`),

    submit: (
      quizId: string,
      answers: Record<string, string>,
      timeSec: number
    ): Promise<QuizResult> =>
      request<QuizResult>(
        `/quizzes/${encodeURIComponent(quizId)}/submit`,
        {
          method: "POST",
          body: JSON.stringify({
            answers,
            time_taken_sec: timeSec,
          }),
        }
      ),

    attempts: (quizId: string) =>
      request(
        `/quizzes/${encodeURIComponent(quizId)}/attempts`
      ),
  },

  // ───────────────────────────────────────────────────────────
  // Progress
  // ───────────────────────────────────────────────────────────

  progress: {
    dashboard: () =>
      request("/progress/dashboard"),

    badges: () =>
      request("/progress/badges"),
  },

  // ───────────────────────────────────────────────────────────
  // AI Tutor
  // ───────────────────────────────────────────────────────────

  tutor: {
    createConversation: (
      initialMessage: string,
      lessonId?: string
    ) =>
      request("/tutor/conversations", {
        method: "POST",
        body: JSON.stringify({
          initial_message: initialMessage,
          lesson_id: lessonId,
        }),
      }),

    listConversations: () =>
      request("/tutor/conversations"),

    getConversation: (id: string) =>
      request(
        `/tutor/conversations/${encodeURIComponent(id)}`
      ),

    streamMessage: async (
      convId: string,
      content: string
    ): Promise<Response> => {
      const accessToken = await getAccessToken();

      const headers = new Headers();

      headers.set("Content-Type", "application/json");
      headers.set("X-Session-ID", getSessionId());

      if (accessToken) {
        headers.set(
          "Authorization",
          `Bearer ${accessToken}`
        );
      }

      let response: Response;

      try {
        response = await fetch(
          `${API_URL}/api/v1/tutor/conversations/${encodeURIComponent(
            convId
          )}/messages`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              content,
            }),
          }
        );
      } catch (error) {
        throw new ApiError(
          error instanceof Error
            ? error.message
            : "Unable to connect to the FinPilot backend.",
          0
        );
      }

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));

        const message =
          body?.detail ??
          body?.error?.message ??
          body?.message ??
          `API error ${response.status}`;

        throw new ApiError(message, response.status);
      }

      return response;
    },
  },

  // ───────────────────────────────────────────────────────────
  // Calculator
  // ───────────────────────────────────────────────────────────

  calculator: {
    sip: (body: object) =>
      request("/calculator/sip", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    lumpsum: (body: object) =>
      request("/calculator/lumpsum", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },

  // ───────────────────────────────────────────────────────────
  // Budget
  // ───────────────────────────────────────────────────────────

  budget: {
    create: (body: object) =>
      request("/budget", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    get: (month: string) =>
      request(
        `/budget/${encodeURIComponent(month)}`
      ),

    update: (
      planId: string,
      body: object
    ) =>
      request(
        `/budget/${encodeURIComponent(planId)}`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
        }
      ),

    addEntry: (
      planId: string,
      body: object
    ) =>
      request(
        `/budget/${encodeURIComponent(planId)}/entries`,
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      ),

    updateEntry: (
      entryId: string,
      body: object
    ) =>
      request(
        `/budget/entries/${encodeURIComponent(entryId)}`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
        }
      ),

    deleteEntry: (entryId: string) =>
      request(
        `/budget/entries/${encodeURIComponent(entryId)}`,
        {
          method: "DELETE",
        }
      ),
  },

  // ───────────────────────────────────────────────────────────
  // Watchlist
  // ───────────────────────────────────────────────────────────

  watchlist: {
    list: () =>
      request("/watchlist"),

    add: (body: object) =>
      request("/watchlist", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    update: (
      id: string,
      body: object
    ) =>
      request(
        `/watchlist/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
        }
      ),

    remove: (id: string) =>
      request(
        `/watchlist/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      ),

    getQuote: (id: string) =>
      request(
        `/watchlist/${encodeURIComponent(id)}/quote`
      ),

    search: (q: string) =>
      request(
        `/watchlist/search?q=${encodeURIComponent(q)}`
      ),
  },
};

export { getSessionId };