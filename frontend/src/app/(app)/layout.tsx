"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/components/auth/AuthProvider";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const {
    mode,
    loading,
  } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (
      mode !== "authenticated" &&
      mode !== "guest"
    ) {
      router.replace("/login");
    }
  }, [loading, mode, router]);

  if (
    loading ||
    (mode !== "authenticated" &&
      mode !== "guest")
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617]">
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading FinPilot...
        </div>
      </main>
    );
  }

  return <AppShell>{children}</AppShell>;
}