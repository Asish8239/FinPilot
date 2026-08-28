"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Monitor,
  Moon,
  RotateCcw,
  Settings2,
  Sparkles,
  Sun,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Currency = "INR" | "USD";
type Theme = "dark" | "light" | "system";

const SETTINGS_KEY = "finpilot-settings";

interface FinPilotSettings {
  theme: Theme;
  reducedMotion: boolean;
  currency: Currency;
}

const DEFAULT_SETTINGS: FinPilotSettings = {
  theme: "dark",
  reducedMotion: false,
  currency: "INR",
};

export default function SettingsPage() {
  const [settings, setSettings] =
    useState<FinPilotSettings>(DEFAULT_SETTINGS);

  const [saved, setSaved] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  /* ==========================================================
     LOAD SETTINGS
  ========================================================== */

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);

      if (!stored) return;

      const parsed = JSON.parse(stored);

      setSettings({
        theme:
          parsed.theme === "light" ||
          parsed.theme === "system" ||
          parsed.theme === "dark"
            ? parsed.theme
            : DEFAULT_SETTINGS.theme,

        reducedMotion:
          typeof parsed.reducedMotion === "boolean"
            ? parsed.reducedMotion
            : DEFAULT_SETTINGS.reducedMotion,

        currency:
          parsed.currency === "USD" ||
          parsed.currency === "INR"
            ? parsed.currency
            : DEFAULT_SETTINGS.currency,
      });
    } catch {
      setSettings(DEFAULT_SETTINGS);
    }
  }, []);

  /* ==========================================================
     SAVE SETTINGS
  ========================================================== */

  const saveSettings = (nextSettings: FinPilotSettings) => {
    setSettings(nextSettings);

    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(nextSettings)
      );
    } catch {
      // Ignore localStorage failures.
    }

    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  /* ==========================================================
     HANDLERS
  ========================================================== */

  const handleThemeChange = (theme: Theme) => {
    saveSettings({
      ...settings,
      theme,
    });
  };

  const handleReducedMotionChange = () => {
    saveSettings({
      ...settings,
      reducedMotion: !settings.reducedMotion,
    });
  };

  const handleCurrencyChange = (currency: Currency) => {
    saveSettings({
      ...settings,
      currency,
    });
  };

  const handleResetSettings = () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }

    setSettings(DEFAULT_SETTINGS);

    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(DEFAULT_SETTINGS)
      );
    } catch {
      // Ignore localStorage failures.
    }

    setResetConfirm(false);

    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

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

        <div className="absolute right-[-180px] top-[15%] h-[500px] w-[500px] rounded-full bg-violet-500/[0.045] blur-[140px]" />

        <div className="absolute bottom-[-180px] left-[35%] h-[420px] w-[420px] rounded-full bg-orange-500/[0.025] blur-[130px]" />
      </div>

      {/* ========================================================
          CONTENT
      ======================================================== */}

      <div className="relative mx-auto max-w-[1100px] space-y-6 p-4 sm:p-6 lg:p-8">
        {/* ======================================================
            HEADER
        ====================================================== */}

        <header>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400 shadow-[0_0_12px_rgba(251,146,60,0.8)]" />

                <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-orange-300/80">
                  FinPilot Preferences
                </span>
              </div>

              <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                Settings

                <Settings2 className="h-7 w-7 text-orange-300 sm:h-8 sm:w-8" />
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Customize your FinPilot experience, financial
                preferences, and interface behavior.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
              <Sparkles className="h-4 w-4 text-orange-300" />

              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                  Current currency
                </p>

                <p className="mt-0.5 text-xs font-semibold text-white">
                  {settings.currency === "INR"
                    ? "₹ INR"
                    : "$ USD"}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* ======================================================
            SAVE STATUS
        ====================================================== */}

        {saved && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] px-4 py-3.5 text-sm text-emerald-300 shadow-[0_10px_40px_rgba(16,185,129,0.05)]">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/10">
              <CheckCircle2 className="h-4 w-4" />
            </div>

            <div>
              <p className="font-semibold">
                Settings saved
              </p>

              <p className="mt-0.5 text-xs text-emerald-300/60">
                Your FinPilot preferences have been updated.
              </p>
            </div>
          </div>
        )}

        {/* ======================================================
            APPEARANCE
        ====================================================== */}

        <section className="rounded-3xl border border-white/[0.07] bg-white/[0.025] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-7">
          <SectionHeader
            icon={<Settings2 className="h-5 w-5" />}
            eyebrow="Interface"
            title="Appearance"
            description="Choose how FinPilot should look and behave on your device."
          />

          <div className="mt-7">
            <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-600">
              Theme
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              <ThemeOption
                icon={<Moon className="h-5 w-5" />}
                title="Dark"
                description="Best for low-light use"
                selected={settings.theme === "dark"}
                onClick={() => handleThemeChange("dark")}
              />

              <ThemeOption
                icon={<Sun className="h-5 w-5" />}
                title="Light"
                description="Bright interface"
                selected={settings.theme === "light"}
                onClick={() => handleThemeChange("light")}
              />

              <ThemeOption
                icon={<Monitor className="h-5 w-5" />}
                title="System"
                description="Follow device setting"
                selected={settings.theme === "system"}
                onClick={() => handleThemeChange("system")}
              />
            </div>
          </div>

          <div className="mt-7 border-t border-white/[0.06] pt-7">
            <div className="flex items-center justify-between gap-6">
              <div>
                <p className="text-sm font-semibold text-slate-200">
                  Reduced Motion
                </p>

                <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600">
                  Reduce animations and visual transitions
                  throughout the application.
                </p>
              </div>

              <Toggle
                enabled={settings.reducedMotion}
                onClick={handleReducedMotionChange}
              />
            </div>
          </div>
        </section>

        {/* ======================================================
            FINANCIAL PREFERENCES
        ====================================================== */}

        <section className="rounded-3xl border border-white/[0.07] bg-white/[0.025] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-7">
          <SectionHeader
            icon={<Wallet className="h-5 w-5" />}
            eyebrow="Financial tools"
            title="Financial Preferences"
            description="Choose the currency used by FinPilot's financial tools and examples where supported."
          />

          <div className="mt-7">
            <label
              htmlFor="currency"
              className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-600"
            >
              Preferred Currency
            </label>

            <div className="relative max-w-md">
              <select
                id="currency"
                value={settings.currency}
                onChange={(event) =>
                  handleCurrencyChange(
                    event.target.value as Currency
                  )
                }
                className="w-full appearance-none rounded-xl border border-white/[0.08] bg-[#0b1118] px-4 py-3.5 pr-10 text-sm font-medium text-white outline-none transition focus:border-orange-400/50 focus:ring-2 focus:ring-orange-400/10"
              >
                <option value="INR">
                  Indian Rupee (₹ / INR)
                </option>

                <option value="USD">
                  US Dollar ($ / USD)
                </option>
              </select>

              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-600">
                ▼
              </span>
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-600">
              INR is recommended when learning with Indian financial
              examples.
            </p>
          </div>
        </section>

        {/* ======================================================
            LEARNING EXPERIENCE
        ====================================================== */}

        <section className="rounded-3xl border border-white/[0.07] bg-white/[0.025] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-7">
          <SectionHeader
            icon={<Sparkles className="h-5 w-5" />}
            eyebrow="Learning philosophy"
            title="Learning Experience"
            description="FinPilot focuses on practical financial understanding."
          />

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <InfoRow
              title="Structured lessons"
              description="Study financial concepts in a clear, topic-by-topic curriculum."
            />

            <InfoRow
              title="Knowledge checks"
              description="Use quizzes to test whether you understood the material."
            />

            <InfoRow
              title="Practical tools"
              description="Apply what you learn using calculators, budgeting, market tools, and planning features."
            />

            <InfoRow
              title="Learn at your own pace"
              description="Progress without artificial levels, XP systems, rankings, or mandatory quest chains."
            />
          </div>
        </section>

        {/* ======================================================
            RESET
        ====================================================== */}

        <section className="rounded-3xl border border-red-500/15 bg-red-950/[0.15] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.15)] sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-red-400/15 bg-red-400/[0.07]">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-red-400/70">
                Local preferences
              </p>

              <h2 className="mt-1 text-lg font-semibold text-red-200">
                Reset Preferences
              </h2>

              <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-500">
                Reset your FinPilot appearance and local preferences
                to their default values. This does not delete your
                account, learning progress, or backend data.
              </p>

              {!resetConfirm ? (
                <button
                  type="button"
                  onClick={handleResetSettings}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/[0.07] px-4 py-2.5 text-xs font-semibold text-red-300 transition hover:border-red-400/30 hover:bg-red-400/[0.12]"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset Preferences
                </button>
              ) : (
                <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/[0.06] p-4">
                  <p className="text-sm font-semibold text-red-200">
                    Reset all local FinPilot preferences?
                  </p>

                  <p className="mt-1 text-xs leading-5 text-red-300/60">
                    Your theme, motion preference, and currency will
                    return to their defaults.
                  </p>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={handleResetSettings}
                      className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-500"
                    >
                      Yes, Reset Preferences
                    </button>

                    <button
                      type="button"
                      onClick={() => setResetConfirm(false)}
                      className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ======================================================
            ABOUT
        ====================================================== */}

        <section className="rounded-3xl border border-white/[0.07] bg-white/[0.02] p-5 sm:p-7">
          <SectionHeader
            icon={<Sparkles className="h-5 w-5" />}
            eyebrow="Platform"
            title="About FinPilot"
            description="A practical environment for learning and applying financial concepts."
          />

          <div className="mt-6 space-y-4 text-xs leading-6 text-slate-500">
            <p>
              <span className="font-semibold text-slate-300">
                FinPilot
              </span>{" "}
              is a financial education platform designed to make
              personal finance and investing easier to understand.
            </p>

            <p>
              The platform combines structured educational content
              with practical financial tools so that you can move
              from understanding a concept to applying it.
            </p>

            <div className="flex flex-col gap-2 border-t border-white/[0.06] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-700">
                FinPilot v1.0
              </span>

              <span className="text-[9px] uppercase tracking-[0.18em] text-slate-800">
                Learn · Plan · Invest
              </span>
            </div>
          </div>
        </section>

        {/* ======================================================
            FOOTER
        ====================================================== */}

        <footer className="flex flex-col gap-2 border-t border-white/[0.05] py-5 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-700">
            FinPilot Settings
          </span>

          <span className="text-[9px] uppercase tracking-[0.15em] text-slate-800">
            Preferences are stored locally
          </span>
        </footer>
      </div>
    </div>
  );
}

/* ============================================================
   SECTION HEADER
============================================================ */

function SectionHeader({
  icon,
  eyebrow,
  title,
  description,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-400/15 bg-orange-400/[0.06] text-orange-300">
        {icon}
      </div>

      <div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-orange-300/60">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-lg font-semibold text-white">
          {title}
        </h2>

        <p className="mt-1 text-xs leading-5 text-slate-600">
          {description}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   THEME OPTION
============================================================ */

function ThemeOption({
  icon,
  title,
  description,
  selected,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group rounded-2xl border p-4 text-left transition-all duration-200",
        selected
          ? "border-orange-400/30 bg-orange-400/[0.07] shadow-[0_12px_40px_rgba(249,115,22,0.05)]"
          : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.11] hover:bg-white/[0.035]"
      )}
    >
      <div
        className={cn(
          "mb-4 flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
          selected
            ? "bg-orange-400/[0.1] text-orange-300"
            : "bg-white/[0.04] text-slate-500 group-hover:text-slate-300"
        )}
      >
        {icon}
      </div>

      <div className="flex items-center gap-2">
        <p
          className={cn(
            "text-sm font-semibold",
            selected ? "text-orange-200" : "text-white"
          )}
        >
          {title}
        </p>

        {selected && (
          <span className="h-1.5 w-1.5 rounded-full bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.7)]" />
        )}
      </div>

      <p className="mt-1 text-[10px] leading-4 text-slate-600">
        {description}
      </p>
    </button>
  );
}

/* ============================================================
   TOGGLE
============================================================ */

function Toggle({
  enabled,
  onClick,
}: {
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onClick}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        enabled ? "bg-orange-500" : "bg-slate-700"
      )}
    >
      <span
        className={cn(
          "absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
          enabled && "translate-x-5"
        )}
      />
    </button>
  );
}

/* ============================================================
   INFO ROW
============================================================ */

function InfoRow({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition hover:border-white/[0.09] hover:bg-white/[0.03]">
      <p className="text-sm font-semibold text-slate-200">
        {title}
      </p>

      <p className="mt-1.5 text-[10px] leading-5 text-slate-600">
        {description}
      </p>
    </div>
  );
}