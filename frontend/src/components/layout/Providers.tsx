"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ReducedMotionProvider } from "../ui/ReducedMotionProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, staleTime: 60_000, refetchOnWindowFocus: false },
        },
      })
  );
  return (
    <ReducedMotionProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ReducedMotionProvider>
  );
}
