import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatLakh(value: number): string {
  if (value >= 10_000_000) return `₹${(value / 10_000_000).toFixed(2)} Cr`;
  if (value >= 100_000)    return `₹${(value / 100_000).toFixed(2)} L`;
  return formatCurrency(value);
}

export function levelProgress(totalXP: number): { level: number; pct: number; xpToNext: number } {
  const thresholds = [0, 100, 300, 600, 1000];
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (totalXP >= thresholds[i]) {
      const level = i + 1;
      const next = level < thresholds.length ? thresholds[level] : thresholds[thresholds.length - 1] + (level - 4) * 500;
      const prev = thresholds[i];
      return {
        level,
        pct: Math.round(((totalXP - prev) / (next - prev)) * 100),
        xpToNext: next - totalXP,
      };
    }
  }
  return { level: 1, pct: 0, xpToNext: 100 };
}
