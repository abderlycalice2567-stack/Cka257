import type { Config } from "tailwindcss";

// Proposed palette from the handoff spec (pending owner approval):
// navy #14283F, red #B83A32, white #FFFFFF.
// Contrast (WCAG): navy on white 14.9:1, white on red 5.7:1, red on white 5.7:1.
// Red on navy is 2.6:1 — never use red text on navy surfaces.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", md: "1.5rem", lg: "2rem" },
      screens: { xl: "1200px" },
    },
    extend: {
      colors: {
        navy: { DEFAULT: "#14283F", 50: "#F3F6F9", 100: "#E4EAF1", 200: "#C5D1DF", 300: "#93A6BC", 500: "#4A6078", 600: "#33485F", 700: "#1E344D", 800: "#14283F", 900: "#0D1B2C" },
        brand: { DEFAULT: "#B83A32", dark: "#9A2E27", tint: "#FBEFEE" },
      },
      fontFamily: {
        display: ["'Manrope Variable'", "Manrope", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        sans: ["'Inter Variable'", "Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      borderRadius: { card: "12px" },
      boxShadow: {
        card: "0 1px 2px rgb(20 40 63 / 0.05), 0 10px 28px -16px rgb(20 40 63 / 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
