import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#17324D", 900: "#0F2236", 700: "#17324D", 100: "#E3EAF1", 50: "#F3F6F9" },
        teal: { DEFAULT: "#087E83", 700: "#066368", 100: "#D9EFEF", 50: "#EEF8F8" },
        ink: "#12202E",
        muted: "#4A5B6C",
        line: "#D5DEE6",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ["var(--font-manrope)", "var(--font-inter)", "system-ui", "sans-serif"],
      },
      maxWidth: { content: "1200px" },
      borderRadius: { card: "12px" },
    },
  },
  plugins: [],
};

export default config;
