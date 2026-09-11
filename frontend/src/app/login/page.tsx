"use client";

import {
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Github,
  GraduationCap,
  Loader2,
  Sparkles,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const {
    mode,
    loading,
    enterGuest,
  } = useAuth();

  const [showGuestForm, setShowGuestForm] =
    useState(false);

  const [guestNameInput, setGuestNameInput] =
    useState("");

  const [oauthLoading, setOauthLoading] =
    useState<"google" | "github" | null>(null);

  const [guestLoading, setGuestLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (
      mode === "authenticated" ||
      mode === "guest"
    ) {
      router.replace("/dashboard");
    }
  }, [loading, mode, router]);

  async function handleOAuth(
    provider: "google" | "github"
  ) {
    try {
      setError(null);
      setOauthLoading(provider);

      const redirectTo =
        `${window.location.origin}/auth/callback`;

      const { error: oauthError } =
        await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo,
          },
        });

      if (oauthError) {
        throw oauthError;
      }
    } catch (err) {
      console.error(
        "FinPilot OAuth error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to start sign-in."
      );

      setOauthLoading(null);
    }
  }

  function handleGuestContinue() {
    const name = guestNameInput.trim();

    if (!name) {
      setError("Please enter your name.");
      return;
    }

    if (name.length > 40) {
      setError(
        "Please keep your name under 40 characters."
      );
      return;
    }

    setError(null);
    setGuestLoading(true);

    enterGuest(name);

    router.replace("/dashboard");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617]">
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading FinPilot...
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020617] px-4 py-8 text-white">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-20%] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-cyan-500/[0.08] blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] h-[420px] w-[420px] rounded-full bg-orange-500/[0.06] blur-[120px]" />
        <div className="absolute right-[-10%] top-[30%] h-[360px] w-[360px] rounded-full bg-blue-500/[0.05] blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.08] shadow-2xl shadow-cyan-500/10">
            <GraduationCap className="h-8 w-8 text-cyan-300" />
          </div>

          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">
              FinPilot
            </h1>

            <Sparkles className="h-5 w-5 text-orange-400" />
          </div>

          <p className="mt-2 text-sm text-slate-400">
            Personal Finance Learning
          </p>
        </div>

        {/* Card */}
        <section className="rounded-3xl border border-white/[0.08] bg-slate-950/80 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
          {!showGuestForm ? (
            <>
              <div className="mb-7 text-center">
                <h2 className="text-xl font-semibold text-white">
                  Start your FinPilot journey
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Learn personal finance, explore markets,
                  use smart tools, and build better financial
                  understanding.
                </p>
              </div>

              <div className="space-y-3">
                {/* Google */}
                <button
                  type="button"
                  disabled={oauthLoading !== null}
                  onClick={() =>
                    handleOAuth("google")
                  }
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/[0.1] bg-white px-4 py-3.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {oauthLoading === "google" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <GoogleIcon />
                  )}

                  Continue with Google
                </button>

                {/* GitHub */}
                <button
                  type="button"
                  disabled={oauthLoading !== null}
                  onClick={() =>
                    handleOAuth("github")
                  }
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/[0.1] bg-white/[0.06] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {oauthLoading === "github" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Github className="h-5 w-5" />
                  )}

                  Continue with GitHub
                </button>
              </div>

              {/* Divider */}
              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-white/[0.08]" />

                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
                  or
                </span>

                <div className="h-px flex-1 bg-white/[0.08]" />
              </div>

              {/* Guest */}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setShowGuestForm(true);
                }}
                className="group flex w-full items-center justify-between rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] px-4 py-3.5 text-left transition hover:border-cyan-400/30 hover:bg-cyan-400/[0.07]"
              >
                <div>
                  <p className="text-sm font-semibold text-white">
                    Continue as Guest
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Explore FinPilot without creating an account
                  </p>
                </div>

                <ArrowRight className="h-4 w-4 text-cyan-400 transition-transform group-hover:translate-x-1" />
              </button>

              <p className="mt-6 text-center text-[11px] leading-5 text-slate-600">
                Guest mode is temporary. Nothing about your
                guest identity is saved.
              </p>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setShowGuestForm(false);
                }}
                className="mb-6 text-xs font-semibold text-slate-500 transition hover:text-slate-300"
              >
                ← Back to sign in
              </button>

              <div className="mb-7">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">
                  Guest mode
                </p>

                <h2 className="mt-2 text-2xl font-semibold text-white">
                  What should we call you?
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Enter your name so FinPilot can address you
                  during this visit.
                </p>
              </div>

              <label
                htmlFor="guest-name"
                className="mb-2 block text-xs font-semibold text-slate-300"
              >
                Your name
              </label>

              <input
                id="guest-name"
                type="text"
                value={guestNameInput}
                maxLength={40}
                autoFocus
                autoComplete="off"
                placeholder="e.g. Rahul"
                onChange={(event) => {
                  setGuestNameInput(
                    event.target.value
                  );
                  setError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleGuestContinue();
                  }
                }}
                className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-600 transition focus:border-cyan-400/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-cyan-400/10"
              />

              {error && (
                <p className="mt-3 text-xs font-medium text-red-400">
                  {error}
                </p>
              )}

              <button
                type="button"
                disabled={
                  guestLoading ||
                  !guestNameInput.trim()
                }
                onClick={handleGuestContinue}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {guestLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}

                Enter FinPilot
              </button>

              <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
                <p className="text-xs leading-5 text-slate-500">
                  <span className="font-semibold text-slate-400">
                    Guest privacy:
                  </span>{" "}
                  your name is kept only in the current app
                  session. It is not saved to an account or
                  database.
                </p>
              </div>
            </>
          )}

          {error && !showGuestForm && (
            <p className="mt-4 text-center text-xs font-medium text-red-400">
              {error}
            </p>
          )}
        </section>

        <p className="mt-6 text-center text-[11px] text-slate-600">
          FinPilot is an educational platform, not personalized
          financial advice.
        </p>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M21.35 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.22Z"
      />
      <path
        fill="#34A853"
        d="M12 21.5c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.5Z"
      />
      <path
        fill="#FBBC05"
        d="M6.54 13.58A5.86 5.86 0 0 1 6.23 12c0-.55.11-1.09.31-1.58V7.89H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.11l3.24-2.53Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.39c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.44 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.7 5.39l3.24 2.53C7.31 8.11 9.46 6.39 12 6.39Z"
      />
    </svg>
  );
}