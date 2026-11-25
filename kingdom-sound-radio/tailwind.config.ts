import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1rem", md: "1.5rem" }, screens: { "2xl": "1240px" } },
    extend: {
      colors: {
        navy: { DEFAULT: "#0B1120", 50: "#E7EAF2", 100: "#C9CFDF", 200: "#8C97B5", 300: "#56618A", 400: "#2A3459", 500: "#1A2340", 600: "#131A31", 700: "#0F1528", 800: "#0B1120", 900: "#070B16" },
        gold: { DEFAULT: "#D4AF37", 50: "#FBF6E6", 100: "#F5E9BF", 200: "#EBD585", 300: "#E0C25A", 400: "#D4AF37", 500: "#B8962A", 600: "#8F7420", 700: "#6B5718" },
        ivory: "#F8F7F4",
        slate: { DEFAULT: "#64748B" },
        live: "#DC2626",
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-2": "rgb(var(--surface-2) / <alpha-value>)",
        fg: "rgb(var(--fg) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-sora)", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: { xl: "0.875rem", "2xl": "1.25rem" },
      boxShadow: {
        card: "0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px -12px rgb(11 17 32 / 0.18)",
        lift: "0 20px 40px -20px rgb(11 17 32 / 0.45)",
      },
      keyframes: {
        eq: { "0%,100%": { transform: "scaleY(0.3)" }, "50%": { transform: "scaleY(1)" } },
        pulseDot: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.35" } },
      },
      animation: { eq: "eq 1s ease-in-out infinite", pulseDot: "pulseDot 1.6s ease-in-out infinite" },
    },
  },
  plugins: [],
};
export default config;
