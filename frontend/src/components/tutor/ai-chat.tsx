"use client";

import { FormEvent, useRef, useState } from "react";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

const starterMessage: Message = {
  id: 1,
  role: "assistant",
  content:
    "Hey, I am your Finpilot guide. Bring me a money question, a decision you are weighing, or a concept you want to make less mysterious.",
};

const suggestions = [
  "How should I start an emergency fund?",
  "Explain index funds simply",
  "Help me plan for a big purchase",
];

export default function AiChat() {
  const [messages, setMessages] = useState<Message[]>([starterMessage]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const nextId = useRef(2);

  async function sendMessage(event?: FormEvent) {
    event?.preventDefault();
    const content = input.trim();
    if (!content || isLoading) return;

    const userMessage: Message = { id: nextId.current++, role: "user", content };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage].map(({ role, content: text }) => ({ role, content: text })) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setMessages((current) => [...current, { id: nextId.current++, role: "assistant", content: data.content }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function clearChat() {
    setMessages([starterMessage]);
    setError("");
    setInput("");
  }

  return (
    <main className="min-h-screen overflow-hidden bg-(--paper)">
      <div className="mx-auto flex min-h-screen w-full max-w-360 flex-col px-5 py-5 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between border-b border-(--line) pb-5">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-full bg-(--ink) text-lg text-(--mint)">f</div>
            <span className="text-lg font-bold tracking-tight">finpilot</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-sans uppercase tracking-[0.16em] text-[#68736c]">
            <span className="hidden sm:inline">Personal finance, clarified</span>
            <button type="button" onClick={clearChat} className="border-b border-(--ink) pb-1 text-(--ink) transition-opacity hover:opacity-60">
              New conversation
            </button>
          </div>
        </header>

        <section className="grid flex-1 content-center gap-10 py-10 lg:grid-cols-[minmax(240px,0.7fr)_minmax(500px,1.3fr)] lg:gap-20 lg:py-14">
          <div className="max-w-md self-center">
            <p className="mb-6 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-[#e15f4d]">Your money, in plain English</p>
            <h1 className="text-[clamp(3.3rem,7vw,6.7rem)] leading-[0.88] tracking-[-0.055em]">Ask better.<br /><em className="font-normal text-[#5f8d7b]">Feel ready.</em></h1>
            <p className="mt-8 max-w-sm text-lg leading-relaxed text-[#637069]">A thoughtful place to untangle the decisions behind your dollars.</p>
          </div>

          <section className="flex min-h-140 flex-col border border-(--line) bg-[#faf9f5] shadow-[8px_8px_0_#dceee5]" aria-label="Finpilot chat">
            <div className="flex items-center justify-between border-b border-(--line) px-5 py-4 sm:px-7">
              <div className="flex items-center gap-3">
                <span className="relative flex size-8 items-center justify-center rounded-full bg-[#dceee5] font-sans text-sm font-bold"><span className="absolute right-0 top-0 size-2 rounded-full bg-[#e15f4d]" />f</span>
                <div><p className="text-sm font-bold">Finpilot guide</p><p className="font-sans text-[10px] uppercase tracking-[0.15em] text-[#7b847f]">Online now</p></div>
              </div>
              <span className="font-sans text-xs text-[#8a918c]">Private &amp; practical</span>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-7 sm:px-7" aria-live="polite">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[84%] px-4 py-3 text-[15px] leading-relaxed ${message.role === "user" ? "bg-(--ink) text-[#f5f3ed]" : "bg-(--mint) text-(--ink)"}`}>
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && <div className="flex justify-start"><div className="bg-(--mint) px-4 py-3 font-sans text-sm text-[#637069]">Thinking<span className="animate-pulse">...</span></div></div>}
              {error && <p className="font-sans text-xs text-[#c84e3d]">{error}</p>}
            </div>

            <div className="border-t border-(--line) p-5 sm:p-7">
              {messages.length === 1 && <div className="mb-5 flex flex-wrap gap-2">{suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => setInput(suggestion)} className="border border-(--line) px-3 py-2 text-left font-sans text-xs text-[#637069] transition-colors hover:border-[#5f8d7b] hover:bg-(--mint)">{suggestion}</button>)}</div>}
              <form onSubmit={sendMessage} className="flex items-center gap-3 border-b-2 border-(--ink) pb-2">
                <input value={input} onChange={(event) => setInput(event.target.value)} disabled={isLoading} placeholder="What is on your mind?" aria-label="Your message" className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none placeholder:text-[#9aa19b] disabled:opacity-50" />
                <button type="submit" disabled={!input.trim() || isLoading} aria-label="Send message" className="grid size-9 shrink-0 place-items-center rounded-full bg-(--coral) font-sans text-lg text-white transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40">-&gt;</button>
              </form>
              <p className="mt-3 font-sans text-[10px] uppercase tracking-[0.12em] text-[#9aa19b]">Finpilot can make mistakes. Check important decisions.</p>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
