import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Proposed design direction (not a claim about the official brand palette).
        navy: {
          DEFAULT: "#101B33",
          50: "#f4f6fb",
          100: "#e6eaf4",
          200: "#c7d0e4",
          300: "#9aa8c9",
          400: "#5b6c92",
          500: "#2b3b61",
          600: "#1e2d4f",
          700: "#162444",
          800: "#101B33",
          900: "#0b1324",
          950: "#070d1a",
        },
        gold: {
          DEFAULT: "#D8AE61",
          400: "#e2c284",
          500: "#D8AE61",
          600: "#c6974a",
          700: "#a87c38",
        },
        ivory: "#F8F6F0",
        slate: {
          DEFAULT: "#64748B",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,27,51,0.04), 0 8px 24px -12px rgba(16,27,51,0.18)",
        "card-hover": "0 2px 4px rgba(16,27,51,0.06), 0 18px 40px -16px rgba(16,27,51,0.28)",
        glow: "0 0 0 1px rgba(216,174,97,0.35), 0 10px 40px -10px rgba(216,174,97,0.45)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "70%": { transform: "scale(1.6)", opacity: "0" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        equalize: {
          "0%,100%": { transform: "scaleY(0.35)" },
          "50%": { transform: "scaleY(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
        "pulse-ring": "pulse-ring 1.8s cubic-bezier(0.215,0.61,0.355,1) infinite",
        equalize: "equalize 0.9s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
