"use client";

import { useState } from "react";
import {
  BrainCircuit,
  CheckCircle2,
  FlaskConical,
  Lightbulb,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  api,
  KnowledgeScenarioExplainResponse,
  KnowledgeScenarioResponse,
  KnowledgeTopic,
} from "@/lib/api";

interface ScenarioLabProps {
  topic: Pick<
    KnowledgeTopic,
    "slug" | "name" | "category" | "region" | "difficulty" | "description"
  > | null;
  onTopicSelect?: (topic: KnowledgeTopic) => void;
}

export default function ScenarioLab({
  topic,
  onTopicSelect,
}: ScenarioLabProps) {
  const [scenario, setScenario] = useState<KnowledgeScenarioResponse | null>(
    null
  );
  const [explanation, setExplanation] =
    useState<KnowledgeScenarioExplainResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<
    "beginner" | "intermediate" | "advanced"
  >("intermediate");

  const generate = async () => {
    if (!topic) return;

    setLoading(true);
    setError(null);
    setExplanation(null);

    try {
      const response = await api.knowledge.generateScenario({
        topic_slug: topic.slug,
        difficulty,
        scenario_type: "macro_shock",
        focus: "global financial transmission and analytical reasoning",
      });

      setScenario(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate the scenario."
      );
    } finally {
      setLoading(false);
    }
  };

  const choose = async (
    choice: KnowledgeScenarioResponse["choices"][number]
  ) => {
    if (!scenario) return;

    setExplaining(true);
    setError(null);

    try {
      const response = await api.knowledge.explainScenarioChoice({
        scenario_id: scenario.scenario_id,
        topic_slug: scenario.topic.slug,
        choice_id: choice.id,
        choice_label: choice.label,
        scenario_context: scenario.context,
      });

      setExplanation(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to explain the selected approach."
      );
    } finally {
      setExplaining(false);
    }
  };

  if (!topic) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-3">
          <FlaskConical className="h-5 w-5 text-emerald-500" />
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Scenario Lab
            </h3>
            <p className="text-sm text-slate-500">
              Select a topic to enter an AI-generated financial simulation.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="border-b border-slate-200 bg-gradient-to-r from-emerald-50 via-white to-cyan-50 p-5 dark:border-slate-800 dark:from-emerald-950/25 dark:via-slate-950 dark:to-cyan-950/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-emerald-100 p-2.5 dark:bg-emerald-500/10">
              <FlaskConical className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Scenario Lab
                </h3>
                <Sparkles className="h-4 w-4 text-emerald-500" />
              </div>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Reason through a hypothetical development involving{" "}
                <span className="font-medium">{topic.name}</span>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(["beginner", "intermediate", "advanced"] as const).map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setDifficulty(item)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    difficulty === item
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  {item[0].toUpperCase() + item.slice(1)}
                </button>
              )
            )}

            <button
              type="button"
              onClick={generate}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <BrainCircuit className="h-3.5 w-3.5" />
              )}
              {loading ? "Creating..." : scenario ? "New Scenario" : "Enter Lab"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="m-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          {error}
        </div>
      )}

      {!scenario && !loading && !error && (
        <div className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/10">
            <Lightbulb className="h-7 w-7 text-emerald-500" />
          </div>

          <h4 className="font-semibold text-slate-900 dark:text-white">
            Learn by making analytical choices
          </h4>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            FinPilot creates a hypothetical market scenario, gives you
            multiple analytical approaches, and then explains the economic
            transmission channels behind the approach you choose.
          </p>
        </div>
      )}

      {loading && (
        <div className="flex min-h-56 items-center justify-center p-8">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-500" />
            <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">
              Designing your financial scenario...
            </p>
          </div>
        </div>
      )}

      {scenario && !loading && (
        <div className="space-y-6 p-5">
          <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-900/60">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                {scenario.scenario_type}
              </span>

              <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                Hypothetical
              </span>
            </div>

            <h4 className="mt-3 text-xl font-semibold text-slate-900 dark:text-white">
              {scenario.title}
            </h4>

            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {scenario.context}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                Assumptions
              </h4>

              <ul className="mt-3 space-y-2">
                {scenario.assumptions.map((item, index) => (
                  <li
                    key={index}
                    className="flex gap-2 text-sm leading-5 text-slate-600 dark:text-slate-300"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                Learning objectives
              </h4>

              <ul className="mt-3 space-y-2">
                {scenario.learning_objectives.map((item, index) => (
                  <li
                    key={index}
                    className="flex gap-2 text-sm leading-5 text-slate-600 dark:text-slate-300"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Your analytical choice
              </p>
              <h4 className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
                {scenario.decision_prompt}
              </h4>
            </div>

            <div className="grid gap-3">
              {scenario.choices.map((choice, index) => (
                <button
                  key={choice.id}
                  type="button"
                  disabled={explaining}
                  onClick={() => choose(choice)}
                  className={`group rounded-2xl border p-4 text-left transition ${
                    explanation?.choice_id === choice.id
                      ? "border-emerald-400 bg-emerald-50 dark:border-emerald-500/60 dark:bg-emerald-500/10"
                      : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-emerald-700"
                  } disabled:cursor-wait disabled:opacity-70`}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                      {String.fromCharCode(65 + index)}
                    </span>

                    <div className="min-w-0">
                      <h5 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {choice.label}
                      </h5>
                      <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
                        {choice.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {explaining && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  FinPilot is explaining the economic reasoning...
                </p>
              </div>
            </div>
          )}

          {explanation && !explaining && (
            <div className="space-y-4 rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <div>
                <div className="flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="font-semibold text-slate-900 dark:text-white">
                    AI reasoning
                  </h4>
                </div>

                <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
                  {explanation.explanation}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <ReasoningList
                  title="Transmission channels"
                  items={explanation.transmission_channels}
                />

                <ReasoningList
                  title="Trade-offs"
                  items={explanation.tradeoffs}
                />

                <ReasoningList
                  title="What to watch"
                  items={explanation.what_to_watch}
                />
              </div>

              {explanation.related_topics.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Continue learning
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {explanation.related_topics.map((nextTopic) => (
                      <button
                        key={nextTopic.slug}
                        type="button"
                        onClick={() => onTopicSelect?.(nextTopic)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-emerald-700"
                      >
                        {nextTopic.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <p className="text-[11px] leading-5 text-slate-500 dark:text-slate-400">
              {scenario.educational_notice}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function ReasoningList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border border-emerald-200/70 bg-white/70 p-4 dark:border-emerald-900/40 dark:bg-slate-950/50">
      <h5 className="text-xs font-semibold text-slate-900 dark:text-white">
        {title}
      </h5>

      <ul className="mt-3 space-y-2">
        {items.map((item, index) => (
          <li
            key={index}
            className="flex gap-2 text-xs leading-5 text-slate-600 dark:text-slate-400"
          >
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
