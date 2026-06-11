import type { Config } from "tailwindcss";

// Design tokens — locked to cineconnect_prompt.json › design.color_palette / typography
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Register the fine-grained opacity steps used across the UI so color
      // slash-modifiers (e.g. border-white/8, text-white/55) resolve in @apply too.
      opacity: {
        8: "0.08", 12: "0.12", 15: "0.15", 35: "0.35",
        45: "0.45", 55: "0.55", 65: "0.65", 85: "0.85",
      },
      colors: {
        // background_primary — deep charcoal
        charcoal: {
          DEFAULT: "#0D0D0D",
          900: "#0D0D0D",
          800: "#141414",
          700: "#1A1A2E", // card_panel_bg
          600: "#22223A",
        },
        // accent_gold — warm cinematic gold (primary visual identifier)
        gold: {
          DEFAULT: "#C9A84C",
          light: "#E0C878",
          dark: "#A98A34",
        },
        // accent_crimson — CTAs
        crimson: {
          DEFAULT: "#8B1A1A",
          light: "#A82424",
          dark: "#6E1414",
        },
        panel: "#1A1A2E",
      },
      fontFamily: {
        // display_heading — elegant, filmic
        display: ["var(--font-cinzel)", "Cinzel", "Cormorant Garamond", "serif"],
        // body_latin
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        // body_persian — full RTL support
        fa: ["var(--font-vazir)", "Vazirmatn", "Tahoma", "sans-serif"],
      },
      boxShadow: {
        card: "0 10px 30px -12px rgba(0,0,0,0.7)",
        gold: "0 0 0 1px rgba(201,168,76,0.35), 0 12px 36px -12px rgba(201,168,76,0.25)",
      },
      backgroundImage: {
        "gold-sheen": "linear-gradient(135deg, #E0C878 0%, #C9A84C 45%, #A98A34 100%)",
        "charcoal-fade": "linear-gradient(180deg, #0D0D0D 0%, #141414 60%, #1A1A2E 100%)",
      },
      keyframes: {
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "ticker-rtl": {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        ticker: "ticker 60s linear infinite",
        "ticker-slow": "ticker 90s linear infinite",
        "fade-up": "fade-up 0.7s ease forwards",
        shimmer: "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
