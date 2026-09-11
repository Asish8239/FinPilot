"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/api";

export type AccessMode = "loading" | "none" | "guest" | "authenticated";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  backendUserSynced: boolean;

  mode: AccessMode;
  guestName: string | null;

  enterGuest: (name: string) => void;
  exitGuest: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  const [loading, setLoading] = useState(true);
  const [backendUserSynced, setBackendUserSynced] = useState(false);

  const [mode, setMode] = useState<AccessMode>("loading");
  const [guestName, setGuestName] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let mounted = true;

    async function syncBackendUser(
      nextSession: Session | null
    ) {
      if (!nextSession) {
        if (mounted) {
          setBackendUserSynced(false);
        }
        return;
      }

      try {
        await api.auth.me();

        if (mounted) {
          setBackendUserSynced(true);
        }
      } catch (error) {
        console.error(
          "FinPilot backend authentication sync failed:",
          error
        );

        if (mounted) {
          setBackendUserSynced(false);
        }
      }
    }

    async function loadSession() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession) {
        setMode("authenticated");

        await syncBackendUser(currentSession);

        if (mounted) {
          setLoading(false);
        }
      } else {
        setMode("none");
        setLoading(false);
      }
    }

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        if (!mounted) {
          return;
        }

        setSession(nextSession);
        setUser(nextSession?.user ?? null);

        if (event === "SIGNED_IN") {
          setGuestName(null);
          setMode("authenticated");
          setLoading(false);

          void syncBackendUser(nextSession);
          return;
        }

        if (event === "TOKEN_REFRESHED") {
          if (nextSession) {
            setMode("authenticated");
            void syncBackendUser(nextSession);
          }

          return;
        }

        if (event === "SIGNED_OUT") {
          setSession(null);
          setUser(null);
          setGuestName(null);
          setBackendUserSynced(false);
          setMode("none");
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  function enterGuest(name: string) {
    const cleanedName = name.trim();

    if (!cleanedName) {
      return;
    }

    setGuestName(cleanedName);
    setMode("guest");
  }

  function exitGuest() {
    setGuestName(null);
    setMode("none");
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    setSession(null);
    setUser(null);
    setGuestName(null);
    setBackendUserSynced(false);
    setMode("none");
  }

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      backendUserSynced,
      mode,
      guestName,
      enterGuest,
      exitGuest,
      signOut,
    }),
    [
      user,
      session,
      loading,
      backendUserSynced,
      mode,
      guestName,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider."
    );
  }

  return context;
}