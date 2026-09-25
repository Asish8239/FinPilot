"use client";

import { useBadges } from "@/hooks/useApi";
import {
  Lock,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";
import type { BadgesResponse, Badge } from "@/types";

/* ============================================================
   GLASS CARD
============================================================ */

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-2xl",
        "border border-white/[0.07]",
        "bg-white/[0.035]",
        "backdrop-blur-xl",
        "shadow-[0_20px_80px_rgba(0,0,0,0.2)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

/* ============================================================
   BADGES PAGE
============================================================ */

export default function BadgesPage() {
  const { data, isLoading } = useBadges() as {
    data: BadgesResponse | undefined;
    isLoading: boolean;
  };

  /* ==========================================================
     LOADING
  ========================================================== */

  if (isLoading) {
    return (
      <div className="relative min-h-full overflow-hidden bg-[#05090d] text-white">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-cyan-500/[0.05] blur-[130px]" />

          <div className="absolute right-[-160px] top-[20%] h-[460px] w-[460px] rounded-full bg-violet-500/[0.04] blur-[140px]" />
        </div>

        <div className="relative mx-auto max-w-[1200px] p-4 sm:p-6 lg:p-8">
          <div className="mb-8 animate-pulse">
            <div className="h-3 w-32 rounded bg-white/[0.06]" />

            <div className="mt-4 h-10 w-48 rounded bg-white/[0.06]" />

            <div className="mt-3 h-4 w-72 rounded bg-white/[0.04]" />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, index) => (
              <div
                key={index}
                className="h-48 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.025]"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ==========================================================
     DATA
  ========================================================== */

  const badgesData = data as BadgesResponse | undefined;

  const earned: Badge[] = badgesData?.earned ?? [];
  const available: Badge[] = badgesData?.available ?? [];

  const total = earned.length + available.length;

  const percentage =
    total > 0
      ? Math.round((earned.length / total) * 100)
      : 0;

  /* ==========================================================
     PAGE
  ========================================================== */

  return (
    <div className="relative min-h-full overflow-hidden bg-[#05090d] text-white">
      {/* ========================================================
          BACKGROUND
      ======================================================== */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.5) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
            maskImage:
              "radial-gradient(circle at center, black 0%, transparent 78%)",
          }}
        />

        <div className="absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-cyan-500/[0.055] blur-[130px]" />

        <div className="absolute right-[-180px] top-[20%] h-[500px] w-[500px] rounded-full bg-violet-500/[0.045] blur-[140px]" />

        <div className="absolute bottom-[-200px] left-[35%] h-[400px] w-[400px] rounded-full bg-amber-500/[0.025] blur-[120px]" />
      </div>

      {/* ========================================================
          CONTENT
      ======================================================== */}

      <div className="relative mx-auto max-w-[1200px] space-y-6 p-4 sm:p-6 lg:p-8">
        {/* ======================================================
            HEADER
        ====================================================== */}

        <header>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]" />

                <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-amber-300/80">
                  FinPilot Achievements
                </span>
              </div>

              <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                <span>Badges</span>

                <Trophy className="h-7 w-7 text-amber-300 sm:h-8 sm:w-8" />
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Earn badges as you progress through FinPilot&apos;s
                financial learning journey.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />

              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-600">
                  Achievement progress
                </p>

                <p className="mt-0.5 text-xs font-semibold text-white">
                  {percentage}% complete
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* ======================================================
            OVERVIEW
        ====================================================== */}

        <section>
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-amber-500/[0.055] via-white/[0.025] to-violet-500/[0.035] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.25)] sm:p-7">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-amber-400/[0.05]" />

            <div className="relative grid gap-7 lg:grid-cols-[1fr_0.65fr] lg:items-center">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/[0.08]">
                    <Trophy className="h-5 w-5 text-amber-300" />
                  </div>

                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-amber-300/70">
                      Your achievements
                    </p>

                    <p className="mt-0.5 text-sm text-slate-400">
                      Keep learning and unlock more.
                    </p>
                  </div>
                </div>

                <h2 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
                  Every lesson gets you closer.
                </h2>

                <p className="mt-3 max-w-xl text-xs leading-6 text-slate-500 sm:text-sm">
                  Badges recognize milestones across your FinPilot
                  learning journey. Complete lessons, build knowledge,
                  and keep progressing.
                </p>

                <div className="mt-6 max-w-xl">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                      Badge progress
                    </span>

                    <span className="text-[10px] font-semibold text-amber-300">
                      {earned.length}/{total}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-orange-300 shadow-[0_0_18px_rgba(251,191,36,0.2)] transition-all duration-700"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-amber-400/[0.12] bg-black/10 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/15 bg-amber-400/10">
                    <Trophy className="h-5 w-5 text-amber-300" />
                  </div>

                  <p className="mt-5 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                    Earned
                  </p>

                  <p className="mt-1 text-3xl font-semibold text-white">
                    {earned.length}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/[0.07] bg-black/10 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-400/10 bg-slate-400/[0.06]">
                    <Lock className="h-5 w-5 text-slate-500" />
                  </div>

                  <p className="mt-5 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                    Remaining
                  </p>

                  <p className="mt-1 text-3xl font-semibold text-white">
                    {available.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================
            EARNED BADGES
        ====================================================== */}

        {earned.length > 0 && (
          <section>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-400/15 bg-amber-400/[0.07]">
                    <Trophy className="h-4 w-4 text-amber-300" />
                  </div>

                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-amber-300/70">
                      Unlocked
                    </p>

                    <h2 className="mt-0.5 text-sm font-semibold text-white">
                      Earned Badges
                    </h2>
                  </div>
                </div>
              </div>

              <span className="rounded-full border border-amber-400/15 bg-amber-400/[0.06] px-3 py-1 text-[9px] font-semibold uppercase tracking-wider text-amber-300">
                {earned.length} earned
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {earned.map((badge) => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                />
              ))}
            </div>
          </section>
        )}

        {/* ======================================================
            AVAILABLE BADGES
        ====================================================== */}

        {available.length > 0 && (
          <section>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-400/10 bg-slate-400/[0.05]">
                    <Lock className="h-4 w-4 text-slate-500" />
                  </div>

                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Keep going
                    </p>

                    <h2 className="mt-0.5 text-sm font-semibold text-white">
                      Not Yet Earned
                    </h2>
                  </div>
                </div>
              </div>

              <span className="rounded-full border border-white/[0.07] bg-white/[0.025] px-3 py-1 text-[9px] font-semibold uppercase tracking-wider text-slate-600">
                {available.length} remaining
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {available.map((badge) => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  locked
                />
              ))}
            </div>
          </section>
        )}

        {/* ======================================================
            EMPTY STATE
        ====================================================== */}

        {earned.length === 0 && available.length === 0 && (
          <section>
            <GlassCard className="p-10 text-center sm:p-14">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/15 bg-amber-400/[0.07]">
                <Trophy className="h-7 w-7 text-amber-300" />
              </div>

              <h2 className="mt-5 text-lg font-semibold text-white">
                Your badge journey starts here.
              </h2>

              <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-slate-600">
                Complete lessons and learning activities to start
                earning achievements.
              </p>
            </GlassCard>
          </section>
        )}

        {/* ======================================================
            MOTIVATION
        ====================================================== */}

        <section>
          <GlassCard className="p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.07]">
                <Sparkles className="h-5 w-5 text-cyan-300" />
              </div>

              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-cyan-300/70">
                  Keep progressing
                </p>

                <h2 className="mt-1 text-sm font-semibold text-white">
                  Your next achievement is waiting.
                </h2>

                <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-600">
                  Continue your lessons and use the FinPilot learning
                  tools to build practical financial knowledge.
                </p>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* ======================================================
            FOOTER
        ====================================================== */}

        <footer className="flex flex-col gap-2 border-t border-white/[0.05] py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />

            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-700">
              FinPilot Achievements
            </span>
          </div>

          <div className="flex gap-4 text-[9px] uppercase tracking-[0.15em] text-slate-800">
            <span>Learn</span>
            <span>Progress</span>
            <span>Achieve</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

/* ============================================================
   BADGE CARD
============================================================ */

function BadgeCard({
  badge,
  locked = false,
}: {
  badge: Badge;
  locked?: boolean;
}) {
  const icon =
    badge.icon_url && !badge.icon_url.startsWith("http")
      ? badge.icon_url
      : "🏆";

  return (
    <div
      className={[
        "group relative overflow-hidden rounded-2xl border p-5 text-center",
        "transition-all duration-300",
        locked
          ? "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.03]"
          : "border-amber-400/[0.16] bg-gradient-to-br from-amber-400/[0.075] to-orange-400/[0.025] hover:-translate-y-1 hover:border-amber-300/25",
      ].join(" ")}
    >
      {!locked && (
        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-400/[0.07] blur-2xl" />
      )}

      <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.06] bg-black/20 text-3xl shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
        <span className={locked ? "grayscale opacity-50" : ""}>
          {icon}
        </span>

        {locked && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[#05090d]/75 backdrop-blur-[2px]">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-black/40">
              <Lock className="h-3.5 w-3.5 text-slate-500" />
            </div>
          </div>
        )}
      </div>

      <p
        className={[
          "mt-4 text-xs font-bold",
          locked ? "text-slate-400" : "text-white",
        ].join(" ")}
      >
        {badge.name}
      </p>

      <p className="mt-1.5 line-clamp-3 text-[10px] leading-4 text-slate-600">
        {badge.description}
      </p>

      {!locked && badge.earned_at && (
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-amber-400/10 bg-amber-400/[0.05] px-2.5 py-1">
          <Trophy className="h-2.5 w-2.5 text-amber-300" />

          <span className="text-[8px] font-semibold uppercase tracking-wider text-amber-300">
            {new Date(badge.earned_at).toLocaleDateString("en-IN")}
          </span>
        </div>
      )}

      {locked && (
        <div className="mt-4">
          <span className="text-[8px] font-semibold uppercase tracking-[0.16em] text-slate-700">
            Locked
          </span>
        </div>
      )}
    </div>
  );
}
