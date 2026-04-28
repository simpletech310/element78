import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0A0E14",
        "ink-2": "#11161F",
        haze: "#1B2230",
        "haze-2": "#232C3D",
        bone: "#F2EEE8",
        "bone-2": "#E8E2D8",
        "bone-3": "#D9D2C5",
        paper: "#FBF8F2",
        sky: "#8FB8D6",
        "sky-soft": "#B9D2E5",
        "sky-pale": "#DCE7F0",
        electric: "#4DA9D6",
        "electric-deep": "#2E7FB0",
        rose: "#E8B5A8",
      },
      fontFamily: {
        display: ["var(--font-display)", "Inter Tight", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        serif: ["var(--font-serif)", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
