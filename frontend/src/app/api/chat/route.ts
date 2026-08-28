/**
 * AI Chat API Route — uses Groq for fast inference.
 *
 * GROQ_API_KEY is a server-side env var; it never reaches the browser.
 * Model is configurable via GROQ_MODEL env var (default: mixtral-8x7b-32768).
 */
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You are FinPilot AI, a friendly personal finance education tutor for Indian learners.

Your expertise covers:
- SIPs (Systematic Investment Plans), mutual funds, NAV, expense ratios
- Stock market basics: NSE, BSE, Nifty 50, Sensex, P/E ratios
- Budgeting: 50/30/20 rule, zero-based budgeting, emergency funds
- Tax instruments: ELSS, PPF, NPS, Section 80C
- Financial Independence (FI), retirement planning, goal-based investing

Rules you MUST follow:
1. You are EDUCATIONAL only — never give personalised investment advice
2. When discussing returns: always add "⚠️ Past performance does not guarantee future results"
3. Never recommend specific funds, stocks, or brokers for the user's situation
4. Always recommend consulting a SEBI-registered investment advisor for personalised advice

Style: Clear, concise (3-5 paragraphs), use ₹ amounts and Indian examples.
End explanations with: 💡 **Key Takeaway:** <one sentence>`;

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI Tutor is not configured. Please add GROQ_API_KEY to your environment." },
      { status: 503 }
    );
  }

  let messages: ChatMessage[];
  try {
    const body = await request.json();
    messages = body.messages as ChatMessage[];
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Please send a message." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Sanitise and limit history
  const safeMessages = messages
    .slice(-12)
    .filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
    );

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.6,
        max_tokens: 600,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...safeMessages],
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      console.error("Groq API error:", response.status, errBody);
      return NextResponse.json(
        { error: "The AI tutor is temporarily unavailable. Please try again." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content: string = data.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      return NextResponse.json({ error: "Could not generate a response. Please try again." }, { status: 502 });
    }

    return NextResponse.json({ content });
  } catch (err) {
    console.error("Chat route error:", err);
    return NextResponse.json({ error: "Could not reach the AI service. Please try again." }, { status: 500 });
  }
}
