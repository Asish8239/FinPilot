"use client";
import { create } from "zustand";
import type { QuizResult } from "@/types";

type QuizStatus = "idle" | "in_progress" | "submitted" | "reviewing";

interface QuizStore {
  status: QuizStatus;
  currentIndex: number;
  answers: Record<string, string>;
  timeElapsed: number;
  result: QuizResult | null;
  setStatus: (s: QuizStatus) => void;
  setAnswer: (qId: string, ans: string) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  tick: () => void;
  setResult: (r: QuizResult) => void;
  reset: () => void;
}

export const useQuizStore = create<QuizStore>((set) => ({
  status: "idle",
  currentIndex: 0,
  answers: {},
  timeElapsed: 0,
  result: null,
  setStatus: (status) => set({ status }),
  setAnswer: (qId, ans) => set((s) => ({ answers: { ...s.answers, [qId]: ans } })),
  nextQuestion: () => set((s) => ({ currentIndex: s.currentIndex + 1 })),
  prevQuestion: () => set((s) => ({ currentIndex: Math.max(0, s.currentIndex - 1) })),
  tick: () => set((s) => ({ timeElapsed: s.timeElapsed + 1 })),
  setResult: (result) => set({ result, status: "submitted" }),
  reset: () => set({ status: "idle", currentIndex: 0, answers: {}, timeElapsed: 0, result: null }),
}));
