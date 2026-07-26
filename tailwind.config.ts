import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-dark": "#190019",
        "bg-surface": "#2B124C",
        "card-bg": "#522B5B",
        "accent-mauve": "#854F6C",
        "accent-blush": "#DFB6B2",
        "accent-cream": "#FBE4D8",
        "status-green": "#a8e6cf",
        "status-yellow": "#ffd3b6",
        "status-red": "#ff8b94",
      },
      fontFamily: {
        heading: ["var(--font-outfit)", "sans-serif"],
        body: ["var(--font-jakarta)", "sans-serif"],
      },
      borderRadius: {
        bento: "24px",
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        neumorph:
          "8px 8px 16px rgba(0,0,0,0.35), -6px -6px 14px rgba(133,79,108,0.08)",
        "neumorph-inset":
          "inset 4px 4px 10px rgba(0,0,0,0.35), inset -4px -4px 10px rgba(133,79,108,0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
