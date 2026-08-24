import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      colors: {
        dashboard: {
          background: "#07111f",
          panel: "#0c1928",
          panelDark: "#091321",
          border: "rgba(255,255,255,0.10)",
          borderSoft: "rgba(255,255,255,0.05)",
          muted: "#64748b",
          cyan: "#22d3ee",
          blue: "#4c9aff",
          violet: "#a78bfa",
          orange: "#fb923c",
          red: "#f87171",
          green: "#34d399",
        },
      },
    },
  },

  plugins: [],
};

export default config;