import type { Config } from "tailwindcss";

// Proposed palette (pending owner approval): pine #28543A, tan #DCC8A4, white.
// Contrast pairs used in the UI were checked against WCAG AA — see README.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pine: { DEFAULT: "#28543A", dark: "#1E3F2C", ink: "#1B2A21" },
        tan: { DEFAULT: "#DCC8A4", light: "#F7F2E8" },
        muted: "#4A5A50",
      },
      fontFamily: {
        heading: ["'Manrope Variable'", "Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["'Inter Variable'", "Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      borderRadius: { card: "12px" },
      maxWidth: { content: "1200px" },
      minHeight: { touch: "44px" },
      minWidth: { touch: "44px" },
    },
  },
  plugins: [],
};
export default config;
