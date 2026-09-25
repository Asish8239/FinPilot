"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BrainCircuit,
  ChevronRight,
  Globe2,
  Link2,
  Loader2,
  Network,
  Sparkles,
} from "lucide-react";
import { api, KnowledgeConnectionResponse, KnowledgeTopic } from "@/lib/api";

interface KnowledgeConnectionMapProps {
  topic: Pick<
    KnowledgeTopic,
    "slug" | "name" | "category" | "region" | "difficulty" | "description"
  > | null;
  onTopicSelect?: (topic: KnowledgeTopic) => void;
}

export default function KnowledgeConnectionMap({
  topic,
  onTopicSelect,
}: KnowledgeConnectionMapProps) {
  const [data, setData] = useState<KnowledgeConnectionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [depth, setDepth] = useState<"quick" | "standard" | "deep">("standard");
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const nodeMap = useMemo(() => {
    const map = new Map<string, KnowledgeConnectionResponse["nodes"][number]>();

    data?.nodes.forEach((node) => map.set(node.id, node));

    return map;
  }, [data]);

  const generate = async () => {
    if (!topic) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.knowledge.generateConnections({
        topic_slug: topic.slug,
        depth,
        focus: "global financial market transmission channels",
      });

      setData(response);
      setSelectedNode(response.topic.slug);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate market connections."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!topic) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-3">
          <Network className="h-5 w-5 text-violet-500" />
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Market Connections
            </h3>
            <p className="text-sm text-slate-500">
              Select a knowledge topic to explore its market relationships.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="border-b border-slate-200 bg-gradient-to-r from-violet-50 via-white to-blue-50 p-5 dark:border-slate-800 dark:from-violet-950/30 dark:via-slate-950 dark:to-blue-950/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-violet-100 p-2.5 dark:bg-violet-500/10">
              <Network className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Market Connections
                </h3>
                <Sparkles className="h-4 w-4 text-violet-500" />
              </div>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Trace how <span className="font-medium">{topic.name}</span>{" "}
                connects across the global financial system.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(["quick", "standard", "deep"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setDepth(item)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  depth === item
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                {item[0].toUpperCase() + item.slice(1)}
              </button>
            ))}

            <button
              type="button"
              onClick={generate}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <BrainCircuit className="h-3.5 w-3.5" />
              )}
              {loading ? "Mapping..." : data ? "Regenerate" : "Explore Connections"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="m-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          {error}
        </div>
      )}

      {!data && !loading && !error && (
        <div className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 dark:bg-violet-500/10">
            <Globe2 className="h-7 w-7 text-violet-500" />
          </div>

          <h4 className="font-semibold text-slate-900 dark:text-white">
            See the bigger financial picture
          </h4>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            FinPilot can dynamically connect this topic to monetary policy,
            currencies, asset classes, macroeconomic variables, institutions,
            risk factors, and other global markets.
          </p>
        </div>
      )}

      {loading && (
        <div className="flex min-h-56 items-center justify-center p-8">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-violet-500" />
            <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">
              Building the financial relationship map...
            </p>
          </div>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6 p-5">
          <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-900/60">
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              Core relationship
            </p>

            <h4 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
              {data.title}
            </h4>

            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {data.thesis}
            </p>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                Knowledge graph
              </h4>

              <span className="text-xs text-slate-500">
                {data.nodes.length} nodes ? {data.connections.length} links
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {data.nodes.map((node) => {
                const isSelected = selectedNode === node.id;

                const outgoing = data.connections.filter(
                  (link) => link.source === node.id
                ).length;

                const incoming = data.connections.filter(
                  (link) => link.target === node.id
                ).length;

                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setSelectedNode(node.id)}
                    className={`text-left rounded-2xl border p-4 transition ${
                      isSelected
                        ? "border-violet-400 bg-violet-50 shadow-sm dark:border-violet-500/60 dark:bg-violet-500/10"
                        : "border-slate-200 bg-white hover:border-violet-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-violet-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                            {node.label}
                          </span>
                        </div>

                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                          {node.description}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-500 dark:bg-slate-900">
                        {node.type}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{node.region || "Global"}</span>
                      <span>
                        {outgoing + incoming} connection
                        {outgoing + incoming === 1 ? "" : "s"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            {data.connections.map((link, index) => {
              const source = nodeMap.get(link.source);
              const target = nodeMap.get(link.target);

              if (!source || !target) return null;

              return (
                <button
                  key={`${link.source}-${link.target}-${index}`}
                  type="button"
                  onClick={() => setSelectedNode(target.id)}
                  className="group flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-violet-300 hover:bg-violet-50/50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-violet-700 dark:hover:bg-violet-500/5"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {source.label}
                    </span>

                    <ArrowRight className="h-4 w-4 shrink-0 text-violet-500" />

                    <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {target.label}
                    </span>
                  </div>

                  <div className="hidden max-w-sm text-right sm:block">
                    <p className="text-xs font-medium text-violet-600 dark:text-violet-400">
                      {link.relationship}
                    </p>
                    <p className="mt-1 line-clamp-1 text-[11px] text-slate-400">
                      {link.explanation}
                    </p>
                  </div>

                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-violet-500" />
                </button>
              );
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-violet-500" />
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Why it matters
                </h4>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {data.why_it_matters}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-blue-500" />
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Market implications
                </h4>
              </div>

              <ul className="mt-3 space-y-2">
                {data.market_implications.map((item, index) => (
                  <li
                    key={index}
                    className="flex gap-2 text-sm leading-5 text-slate-600 dark:text-slate-300"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {data.next_topics.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Continue exploring
                </h4>
              </div>

              <div className="flex flex-wrap gap-2">
                {data.next_topics.map((nextTopic) => (
                  <button
                    key={nextTopic.slug}
                    type="button"
                    onClick={() => onTopicSelect?.(nextTopic)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-violet-700 dark:hover:bg-violet-500/10"
                  >
                    {nextTopic.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-[11px] leading-5 text-slate-400">
            {data.educational_notice}
          </p>
        </div>
      )}
    </section>
  );
}
