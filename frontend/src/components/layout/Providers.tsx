"use client";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ReducedMotionProvider } from "../ui/ReducedMotionProvider";

export function Providers({
  children,
}: {
  children: ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ReducedMotionProvider>
        <AuthProvider>{children}</AuthProvider>
      </ReducedMotionProvider>
    </QueryClientProvider>
  );
}