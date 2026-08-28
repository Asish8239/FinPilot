"use client";
import { create } from "zustand";

interface ChatStore {
  activeConvId: string | null;
  streamingContent: string;
  isStreaming: boolean;
  setActiveConv: (id: string | null) => void;
  appendToken: (token: string) => void;
  startStreaming: () => void;
  finishStreaming: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  activeConvId: null,
  streamingContent: "",
  isStreaming: false,
  setActiveConv: (id) => set({ activeConvId: id }),
  appendToken: (token) => set((s) => ({ streamingContent: s.streamingContent + token })),
  startStreaming: () => set({ isStreaming: true, streamingContent: "" }),
  finishStreaming: () => set({ isStreaming: false }),
}));
