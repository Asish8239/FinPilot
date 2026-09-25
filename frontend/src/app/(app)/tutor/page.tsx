"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useConversations } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { useChatStore } from "@/store/chatStore";
import {
  Bot,
  Send,
  Plus,
  MessageSquare,
  Loader2,
  Sparkles,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Conversation, Message } from "@/types";

const SUGGESTED = [
  "What is a SIP and how does it work?",
  "Explain rupee-cost averaging with an example",
  "What is NAV in mutual funds?",
  "How do I calculate my retirement corpus?",
  "What is the 50/30/20 budgeting rule?",
  "What is the difference between stocks and mutual funds?",
];

function TutorContent() {
  const searchParams = useSearchParams();
  const lessonId = searchParams.get("lesson") ?? undefined;

  const {
    data: conversations = [],
    refetch,
  } = useConversations() as {
    data: Conversation[];
    refetch: () => void;
  };

  const {
    activeConvId,
    setActiveConv,
    streamingContent,
    isStreaming,
    startStreaming,
    appendToken,
    finishStreaming,
  } = useChatStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [error, setError] = useState("");
  const [lastPrompt, setLastPrompt] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, streamingContent, loading]);

  useEffect(() => {
    if (lessonId && messages.length === 0) {
      setInput(
        "Help me understand this lesson and explain the important concepts in simple terms."
      );
    }
  }, [lessonId, messages.length]);

  async function loadConversation(id: string) {
    if (loadingConversation) return;

    try {
      setLoadingConversation(true);
      setError("");
      setActiveConv(id);

      const conv = (await api.tutor.getConversation(id)) as Conversation;

      setMessages(conv.messages ?? []);
      setSidebarOpen(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load this conversation."
      );
    } finally {
      setLoadingConversation(false);
    }
  }

  function startNew() {
    setActiveConv(null);
    setMessages([]);
    setInput("");
    setError("");
    setLastPrompt("");
    setSidebarOpen(false);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  }

  async function handleSend(text?: string) {
    const content = (text ?? input).trim();

    if (!content || loading || isStreaming) return;

    setInput("");
    setError("");
    setLastPrompt(content);
    setLoading(true);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };

    const conversationMessages = [...messages, userMsg];

    setMessages(conversationMessages);

    try {
      startStreaming();

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: conversationMessages
            .slice(-12)
            .map((m) => ({
              role: m.role,
              content: m.content,
            })),
          lesson_id: lessonId,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.error ??
            data?.detail ??
            `AI Tutor error (${res.status})`
        );
      }

      const answer =
        typeof data?.content === "string"
          ? data.content.trim()
          : "";

      if (!answer) {
        throw new Error(
          "The AI tutor returned an empty response. Please try again."
        );
      }

      appendToken(answer);

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: answer,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to reach the AI tutor.";

      setError(message);
    } finally {
      setLoading(false);
      finishStreaming();
    }
  }

  async function retryLast() {
    if (!lastPrompt || loading || isStreaming) return;

    setMessages((prev) => {
      const index = [...prev]
        .reverse()
        .findIndex(
          (m) => m.role === "user" && m.content === lastPrompt
        );

      if (index === -1) return prev;

      const actualIndex = prev.length - 1 - index;
      return prev.slice(0, actualIndex);
    });

    setError("");

    setTimeout(() => {
      handleSend(lastPrompt);
    }, 50);
  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInputChange(
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) {
    setInput(e.target.value);

    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(
      e.target.scrollHeight,
      140
    )}px`;
  }

  return (
    <div className="relative flex h-full min-h-0 overflow-hidden bg-slate-950">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close conversation sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "absolute inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-800 bg-slate-900 transition-transform duration-200 md:relative md:z-0 md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="border-b border-slate-800 p-4">
          <button
            type="button"
            onClick={startNew}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 active:scale-[0.99]"
          >
            <Plus className="h-4 w-4" />
            New Conversation
          </button>
        </div>

        <div className="flex items-center justify-between px-4 pb-2 pt-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Conversations
          </span>

          {conversations.length > 0 && (
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-md p-1 text-slate-500 transition hover:bg-slate-800 hover:text-slate-300"
              title="Refresh conversations"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {conversations.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <MessageSquare className="mx-auto mb-3 h-7 w-7 text-slate-700" />
              <p className="text-xs text-slate-500">
                Your conversations will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() =>
                    loadConversation(conversation.id)
                  }
                  disabled={loadingConversation}
                  className={cn(
                    "group flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition",
                    activeConvId === conversation.id
                      ? "bg-amber-500/15 text-amber-300"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  )}
                >
                  <MessageSquare className="h-4 w-4 flex-shrink-0" />

                  <span className="min-w-0 flex-1 truncate">
                    {conversation.title || "Untitled conversation"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-800 p-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-semibold text-slate-300">
                FinPilot AI
              </span>
            </div>

            <p className="text-[11px] leading-relaxed text-slate-500">
              Learn personal finance through simple explanations,
              examples and guided conversations.
            </p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex min-h-[64px] items-center gap-3 border-b border-slate-800 bg-slate-900 px-4 sm:px-5">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200 md:hidden"
            aria-label="Open conversations"
          >
            <MessageSquare className="h-5 w-5" />
          </button>

          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500">
            <Bot className="h-5 w-5 text-slate-950" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-slate-100">
                FinPilot AI Tutor
              </p>

              <span className="hidden rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 sm:inline-block">
                AI
              </span>
            </div>

            <p className="truncate text-xs text-slate-500">
              Your personal finance learning assistant
            </p>
          </div>

          <div className="ml-auto">
            <button
              type="button"
              onClick={startNew}
              className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                New chat
              </span>
            </button>
          </div>
        </header>

        {/* Messages */}
        <section className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col px-4 py-6 sm:px-6">
            {messages.length === 0 &&
              !isStreaming &&
              !loading && (
                <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
                  <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-amber-500/20 bg-amber-500/10">
                    <Bot className="h-10 w-10 text-amber-500" />
                  </div>

                  <h1 className="text-xl font-semibold text-slate-100 sm:text-2xl">
                    How can I help you learn?
                  </h1>

                  <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                    Ask questions about investing, budgeting,
                    mutual funds, SIPs, retirement planning and
                    other personal-finance concepts.
                  </p>

                  <div className="mt-7 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
                    {SUGGESTED.map((question) => (
                      <button
                        key={question}
                        type="button"
                        onClick={() => handleSend(question)}
                        className="group rounded-xl border border-slate-800 bg-slate-900 p-3 text-left text-xs leading-relaxed text-slate-400 transition hover:border-amber-500/30 hover:bg-amber-500/5 hover:text-amber-300"
                      >
                        <span className="mr-2 text-amber-500 opacity-70 group-hover:opacity-100">
                          →
                        </span>
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            <div className="space-y-5">
              {messages.map((message) => (
                <ChatBubble
                  key={message.id}
                  message={message}
                />
              ))}

              {loading && !isStreaming && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-500">
                    <Bot className="h-4 w-4 text-slate-950" />
                  </div>

                  <div className="rounded-2xl rounded-tl-md border border-slate-800 bg-slate-900 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                      <span className="text-xs text-slate-500">
                        FinPilot is thinking...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {isStreaming && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-500">
                    <Bot className="h-4 w-4 text-slate-950" />
                  </div>

                  <div className="max-w-[90%] rounded-2xl rounded-tl-md border border-slate-800 bg-slate-900 px-4 py-3 text-sm leading-7 text-slate-100 sm:max-w-2xl">
                    {streamingContent ? (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                        >
                          {streamingContent}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <span className="animate-pulse text-slate-500">
                        ▊
                      </span>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="mx-auto flex w-full max-w-2xl flex-col gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 sm:flex-row sm:items-center"
                >
                  <div className="flex-1">
                    <p className="text-xs font-medium text-red-400">
                      Something went wrong
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-red-400/70">
                      {error}
                    </p>
                  </div>

                  {lastPrompt && (
                    <button
                      type="button"
                      onClick={retryLast}
                      disabled={loading || isStreaming}
                      className="flex items-center justify-center gap-2 rounded-lg border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Retry
                    </button>
                  )}
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>
        </section>

        {/* Input */}
        <footer className="border-t border-slate-800 bg-slate-900 px-4 py-4 sm:px-6">
          <div className="mx-auto w-full max-w-4xl">
            <div
              className={cn(
                "flex items-end gap-2 rounded-2xl border bg-slate-950 px-3 py-2 transition",
                "border-slate-700 focus-within:border-amber-500/50 focus-within:ring-2 focus-within:ring-amber-500/10"
              )}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={loading || isStreaming}
                rows={1}
                placeholder="Ask FinPilot anything about personal finance..."
                className="max-h-[140px] min-h-[42px] flex-1 resize-none bg-transparent px-2 py-2.5 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600 disabled:opacity-50"
              />

              <button
                type="button"
                onClick={() => handleSend()}
                disabled={
                  !input.trim() ||
                  loading ||
                  isStreaming
                }
                className="mb-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500 text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Send message"
              >
                {loading || isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                <BookOpen className="h-3 w-3" />
                <span>
                  Shift + Enter for a new line
                </span>
              </div>

              <p className="text-[10px] text-slate-600">
                Educational use only
              </p>
            </div>

            <p className="mt-2 text-center text-[10px] leading-relaxed text-slate-700">
              FinPilot AI provides educational information, not
              personalized financial advice. Verify important
              decisions with a qualified professional.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

function ChatBubble({
  message,
}: {
  message: Message;
}) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex items-start gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold",
          isUser
            ? "bg-cyan-500/15 text-cyan-400"
            : "bg-amber-500"
        )}
      >
        {isUser ? (
          "U"
        ) : (
          <Bot className="h-4 w-4 text-slate-950" />
        )}
      </div>

      <div
        className={cn(
          "max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-7 sm:max-w-2xl",
          isUser
            ? "rounded-tr-md bg-cyan-500 text-white"
            : "rounded-tl-md border border-slate-800 bg-slate-900 text-slate-100"
        )}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none break-words">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TutorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center bg-slate-950">
          <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
        </div>
      }
    >
      <TutorContent />
    </Suspense>
  );
}
