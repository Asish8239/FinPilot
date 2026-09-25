"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Bot,
  Calculator,
  Wallet,
  HeartPulse,
  Eye,
  TrendingUp,
  Menu,
  X,
  ScrollText,
  Map,
  Settings,
  User,
  ChevronRight,
  Library,
  LogOut,
  LogIn,
  Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    title: "Learn",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
      },
      {
        href: "/learn",
        label: "Learning Library",
        icon: BookOpen,
      },
      {
        href: "/glossary",
        label: "Financial Glossary",
        icon: ScrollText,
      },
    ],
  },
  {
    title: "Finance Tools",
    items: [
      {
        href: "/calculator",
        label: "Calculators",
        icon: Calculator,
      },
      {
        href: "/budget",
        label: "Budget Planner",
        icon: Wallet,
      },
      {
        href: "/financial-health",
        label: "Financial Health",
        icon: HeartPulse,
      },
      {
        href: "/markets",
        label: "Market Overview",
        icon: TrendingUp,
      },
      {
        href: "/watchlist",
        label: "Watchlist",
        icon: Eye,
      },
      {
        href: "/financial-independence",
        label: "FI Planner",
        icon: Map,
      },
    ],
  },
  {
    title: "Assistance",
    items: [
      {
        href: "/tutor",
        label: "AI Finance Tutor",
        icon: Bot,
      },
    ],
  },
];

const accountItems: NavItem[] = [
  {
    href: "/profile",
    label: "Profile",
    icon: User,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

function getUserName(user: {
  email?: string;
  user_metadata?: Record<string, unknown>;
}) {
  const metadata = user.user_metadata ?? {};

  const name =
    metadata.full_name ??
    metadata.name ??
    metadata.user_name ??
    metadata.preferred_username;

  if (typeof name === "string" && name.trim()) {
    return name.trim();
  }

  if (user.email) {
    return user.email.split("@")[0];
  }

  return "there";
}

function getUserInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}

function getAvatarUrl(user: {
  user_metadata?: Record<string, unknown>;
}) {
  const metadata = user.user_metadata ?? {};

  const avatar =
    metadata.avatar_url ??
    metadata.picture ??
    metadata.avatar;

  return typeof avatar === "string" && avatar.trim()
    ? avatar
    : null;
}

export function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const { user, session, loading, signOut } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  /*
   * Show the welcome animation once for each authenticated
   * session. Refreshing the page will not trigger it again.
   */
  useEffect(() => {
    if (loading || !user || !session?.access_token) {
      return;
    }

    const storageKey = `finpilot_welcome_shown:${user.id}:${session.access_token}`;

    if (sessionStorage.getItem(storageKey)) {
      return;
    }

    sessionStorage.setItem(storageKey, "true");
    setShowWelcome(true);

    const timer = window.setTimeout(() => {
      setShowWelcome(false);
    }, 3200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loading, user, session?.access_token]);

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    if (href === "/learn") {
      return (
        pathname === "/learn" ||
        pathname.startsWith("/learn/")
      );
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  };

  const handleSignOut = async () => {
    if (signingOut) {
      return;
    }

    try {
      setSigningOut(true);
      await signOut();
      setMobileOpen(false);
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("FinPilot sign-out failed:", error);
      setSigningOut(false);
    }
  };

  const displayName = user ? getUserName(user) : "";
  const initials = user ? getUserInitials(displayName) : "";
  const avatarUrl = user ? getAvatarUrl(user) : null;

  const Sidebar = ({
    mobile = false,
  }: {
    mobile?: boolean;
  }) => {
    return (
      <aside
        className={cn(
          "flex h-full flex-col border-r border-slate-800/80 bg-[#080d12]",
          mobile ? "w-[290px]" : "w-[260px]"
        )}
      >
        {/* ======================================================
            BRAND
        ====================================================== */}
        <div className="border-b border-slate-800/70 px-5 py-5">
          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="group flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.07] transition-all duration-200 group-hover:border-cyan-400/35 group-hover:bg-cyan-400/[0.11]">
              <Library className="h-[18px] w-[18px] text-cyan-300" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[17px] font-semibold tracking-tight text-white">
                  FinPilot
                </span>

                <span className="rounded border border-cyan-400/15 bg-cyan-400/[0.05] px-1.5 py-0.5 text-[7px] font-semibold uppercase tracking-[0.16em] text-cyan-300/70">
                  Finance
                </span>
              </div>

              <p className="mt-0.5 text-[9px] uppercase tracking-[0.16em] text-slate-600">
                Learn • Plan • Invest
              </p>
            </div>
          </Link>
        </div>

        {/* ======================================================
            NAVIGATION
        ====================================================== */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <div className="space-y-6">
            {navSections.map((section) => (
              <div key={section.title}>
                <div className="mb-2 px-3">
                  <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                    {section.title}
                  </p>
                </div>

                <div className="space-y-1">
                  {section.items.map(
                    ({
                      href,
                      label,
                      icon: Icon,
                    }) => {
                      const active = isActive(href);

                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={() =>
                            setMobileOpen(false)
                          }
                          className={cn(
                            "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200",
                            active
                              ? "border border-cyan-400/15 bg-cyan-400/[0.07] text-cyan-200"
                              : "border border-transparent text-slate-500 hover:border-white/[0.04] hover:bg-white/[0.025] hover:text-slate-200"
                          )}
                        >
                          {active && (
                            <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-cyan-400" />
                          )}

                          <span
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all",
                              active
                                ? "bg-cyan-400/[0.08] text-cyan-300"
                                : "bg-white/[0.025] text-slate-600 group-hover:bg-white/[0.045] group-hover:text-slate-400"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </span>

                          <span className="min-w-0 flex-1 truncate text-[11px] font-medium">
                            {label}
                          </span>

                          {active && (
                            <ChevronRight className="h-3 w-3 shrink-0 text-cyan-400/70" />
                          )}
                        </Link>
                      );
                    }
                  )}
                </div>
              </div>
            ))}

            {/* ==================================================
                ACCOUNT
            ================================================== */}
            <div>
              <div className="mb-2 px-3">
                <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                  Account
                </p>
              </div>

              <div className="space-y-1">
                {accountItems.map(
                  ({
                    href,
                    label,
                    icon: Icon,
                  }) => {
                    const active = isActive(href);

                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={() =>
                          setMobileOpen(false)
                        }
                        className={cn(
                          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200",
                          active
                            ? "border border-cyan-400/15 bg-cyan-400/[0.07] text-cyan-200"
                            : "border border-transparent text-slate-500 hover:border-white/[0.04] hover:bg-white/[0.025] hover:text-slate-200"
                        )}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-cyan-400" />
                        )}

                        <span
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all",
                            active
                              ? "bg-cyan-400/[0.08] text-cyan-300"
                              : "bg-white/[0.025] text-slate-600 group-hover:bg-white/[0.045] group-hover:text-slate-400"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>

                        <span className="min-w-0 flex-1 truncate text-[11px] font-medium">
                          {label}
                        </span>

                        {active && (
                          <ChevronRight className="h-3 w-3 shrink-0 text-cyan-400/70" />
                        )}
                      </Link>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* ======================================================
            AUTHENTICATED ACCOUNT CARD
        ====================================================== */}
        <div className="border-t border-slate-800/70 p-4">
          {loading ? (
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.04]">
                <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-medium text-slate-500">
                  Loading account...
                </p>
              </div>
            </div>
          ) : user ? (
            <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/[0.025] p-3">
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-full border border-cyan-400/20 object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/[0.08] text-[11px] font-semibold text-cyan-300">
                    {initials}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-semibold text-slate-200">
                    {displayName}
                  </p>

                  <p className="mt-0.5 truncate text-[8px] text-slate-600">
                    {user.email ?? "Authenticated account"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.025] px-3 py-2 text-[9px] font-medium text-slate-500 transition-all hover:border-red-400/15 hover:bg-red-400/[0.04] hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {signingOut ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <LogOut className="h-3 w-3" />
                )}

                {signingOut ? "Signing out..." : "Log out"}
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="group flex items-center gap-3 rounded-xl border border-cyan-400/10 bg-cyan-400/[0.025] p-3 transition-all hover:border-cyan-400/20 hover:bg-cyan-400/[0.045]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/[0.08]">
                <LogIn className="h-4 w-4 text-cyan-300" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold text-slate-300">
                  Sign in
                </p>

                <p className="mt-0.5 text-[8px] text-slate-600">
                  Save your FinPilot progress
                </p>
              </div>

              <ChevronRight className="h-3 w-3 text-slate-700 transition-transform group-hover:translate-x-0.5 group-hover:text-cyan-400" />
            </Link>
          )}

          <div className="mt-3 flex items-center justify-between px-1">
            <span className="text-[8px] uppercase tracking-[0.16em] text-slate-700">
              FinPilot
            </span>

            <span className="text-[8px] text-slate-700">
              v1.0
            </span>
          </div>
        </div>
      </aside>
    );
  };

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#05090d]">
      {/* ========================================================
          WELCOME OVERLAY
      ======================================================== */}
      {showWelcome && user && (
        <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-[#05090d]/35 backdrop-blur-[3px]" />

          <div className="relative animate-[finpilotWelcome_3.2s_ease-out_forwards] rounded-2xl border border-cyan-400/15 bg-[#0a1118]/95 px-8 py-6 text-center shadow-2xl shadow-cyan-950/30">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/[0.08]">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span className="text-sm font-semibold text-cyan-300">
                  {initials}
                </span>
              )}
            </div>

            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-cyan-400/70">
              FinPilot
            </p>

            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">
              Welcome, {displayName}
              <span className="ml-1">👋</span>
            </h2>

            <p className="mt-2 text-xs text-slate-500">
              Your financial learning journey continues.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================
          DESKTOP SIDEBAR
      ======================================================== */}
      <div className="hidden flex-shrink-0 md:flex">
        <Sidebar />
      </div>

      {/* ========================================================
          MOBILE SIDEBAR
      ======================================================== */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />

          <div className="relative z-10 h-full shadow-2xl shadow-black/50">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* ========================================================
          MAIN APPLICATION AREA
      ======================================================== */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* ======================================================
            MOBILE HEADER
        ====================================================== */}
        <header className="flex h-[62px] shrink-0 items-center justify-between border-b border-slate-800/70 bg-[#080d12] px-4 md:hidden">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-400/[0.07]">
              <Library className="h-4 w-4 text-cyan-300" />
            </div>

            <div>
              <p className="text-sm font-semibold text-white">
                FinPilot
              </p>

              <p className="text-[7px] uppercase tracking-[0.15em] text-slate-600">
                Finance Learning
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {user && (
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-cyan-400/20 bg-cyan-400/[0.08]">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-[9px] font-semibold text-cyan-300">
                    {initials}
                  </span>
                )}
              </div>
            )}

            <button
              type="button"
              aria-label={
                mobileOpen
                  ? "Close navigation"
                  : "Open navigation"
              }
              onClick={() =>
                setMobileOpen((current) => !current)
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.025] transition-colors hover:bg-white/[0.05]"
            >
              {mobileOpen ? (
                <X className="h-4 w-4 text-slate-300" />
              ) : (
                <Menu className="h-4 w-4 text-slate-300" />
              )}
            </button>
          </div>
        </header>

        {/* ======================================================
            PAGE CONTENT
        ====================================================== */}
        <main className="relative flex-1 overflow-y-auto bg-[#05090d]">
          {/* subtle top glow */}
          <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-[60%] -translate-x-1/2 rounded-full bg-cyan-500/[0.025] blur-[100px]" />

          <div className="relative min-h-full">
            {children}
          </div>
        </main>
      </div>

      {/* ========================================================
          WELCOME ANIMATION
          Kept local to this component so no global CSS change
          is required.
      ======================================================== */}
      <style jsx global>{`
        @keyframes finpilotWelcome {
          0% {
            opacity: 0;
            transform: translateY(16px) scale(0.96);
          }

          12% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }

          78% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }

          100% {
            opacity: 0;
            transform: translateY(-8px) scale(1.01);
          }
        }
      `}</style>
    </div>
  );
}



