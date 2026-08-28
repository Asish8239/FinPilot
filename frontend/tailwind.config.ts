import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark command center surfaces
        canvas: {
          900: "#0f172a", // Near-black background
          800: "#1e293b", // Primary dark surface
          700: "#334155", // Elevated surface
          600: "#475569", // Interactive surface
        },
        // Accent colors (amber for progression, emerald for success, slate for neutral)
        accent: {
          primary: "#f59e0b",   // Amber-500 (progression, XP, actions)
          secondary: "#10b981", // Emerald-500 (success, unlocks)
          tertiary: "#06b6d4",  // Cyan-500 (info, insights)
          danger: "#ef4444",    // Red-500 (danger, negation)
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xs: "0.25rem",
        sm: "0.375rem",
        base: "0.5rem",
        md: "0.625rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
        sm: "0 1px 3px 0 rgba(0, 0, 0, 0.4)",
        base: "0 4px 6px -1px rgba(0, 0, 0, 0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
