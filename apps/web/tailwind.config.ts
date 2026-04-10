import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        solana: {
          purple: "#9945FF",
          green: "#14F195",
          teal: "#00D18C",
          dark: "#0E0B16",
          surface: "#1A1425",
          border: "#2D2640",
          muted: "#7C71A0",
        },
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #9945FF 0%, #14F195 100%)",
        "gradient-brand-soft": "linear-gradient(135deg, rgba(153,69,255,0.15) 0%, rgba(20,241,149,0.15) 100%)",
        "gradient-hero": "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(153,69,255,0.25) 0%, transparent 70%)",
      },
      boxShadow: {
        "glow-purple": "0 0 20px rgba(153,69,255,0.5), 0 0 40px rgba(153,69,255,0.2)",
        "glow-green": "0 0 20px rgba(20,241,149,0.5), 0 0 40px rgba(20,241,149,0.2)",
        "glow-card": "0 0 30px rgba(153,69,255,0.15), 0 4px 24px rgba(0,0,0,0.4)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "fade-in": "fade-in 0.6s ease-out forwards",
        "slide-up": "slide-up 0.5s ease-out forwards",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
