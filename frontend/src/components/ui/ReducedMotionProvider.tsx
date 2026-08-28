"use client";
import { createContext, useContext, useEffect, useState } from "react";

/**
 * Reduced Motion Context
 * 
 * Provides a global hook for detecting user's reduced motion preferences.
 * Used throughout the application to respect user's motion preferences.
 */
const ReducedMotionContext = createContext(false);

export function ReducedMotionProvider({ children }: { children: React.ReactNode }) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mediaQuery.matches);
    
    update();
    mediaQuery.addEventListener("change", update);
    
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return (
    <ReducedMotionContext.Provider value={reduced}>
      {children}
    </ReducedMotionContext.Provider>
  );
}

export function useReducedMotion() {
  return useContext(ReducedMotionContext);
}
