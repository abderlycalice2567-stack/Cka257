import type { Config } from "tailwindcss";

// Proposed palette from the handoff spec. Contrast checked in docs/ACCESSIBILITY.md.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1rem", md: "1.5rem" }, screens: { "2xl": "1200px" } },
    extend: {
      colors: {
        brand: {
          DEFAULT: "#19334D",
          50: "#EEF2F6",
          100: "#D5DEE8",
          200: "#A9BBCF",
          300: "#6F8BA8",
          600: "#19334D",
          700: "#132839",
          800: "#0E1E2C",
        },
        amber: {
          DEFAULT: "#D39B38",
          100: "#F6E8CC",
          300: "#E4BB6E",
          500: "#D39B38",
          // Darker amber used for amber text/links on cream (AA on light surfaces).
          800: "#7A5313",
        },
        cream: { DEFAULT: "#FAF8F2", 200: "#F1ECDF" },
        ink: { DEFAULT: "#1B2430", muted: "#4A5563" },
      },
      fontFamily: {
        display: ["var(--font-manrope)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: { card: "12px" },
      maxWidth: { content: "1200px" },
      minHeight: { touch: "44px" },
      minWidth: { touch: "44px" },
      boxShadow: { card: "0 1px 2px rgb(25 51 77 / 0.06), 0 8px 24px -12px rgb(25 51 77 / 0.25)" },
    },
  },
  plugins: [],
};
export default config;
