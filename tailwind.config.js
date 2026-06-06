/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        hydra: {
          50: "#f0f7ff",
          100: "#e0efff",
          200: "#bae0ff",
          300: "#7cc8ff",
          400: "#36a9ff",
          500: "#0c8af0",
          600: "#006dd4",
          700: "#0057ab",
          800: "#064a8c",
          900: "#0b3e73",
          950: "#0A1628",
        },
        alert: {
          blue: "#2563EB",
          yellow: "#F59E0B",
          orange: "#EA580C",
          red: "#DC2626",
        },
        surface: {
          DEFAULT: "#0F1B2D",
          elevated: "#162338",
          border: "#1E3050",
          muted: "#2A3F5F",
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans SC', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: "0 0 20px rgba(12, 138, 240, 0.3)",
        "glow-sm": "0 0 10px rgba(12, 138, 240, 0.2)",
        "glow-red": "0 0 20px rgba(220, 38, 38, 0.4)",
        "glow-orange": "0 0 20px rgba(234, 88, 12, 0.3)",
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)",
      },
      animation: {
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-up": "slideUp 0.4s ease-out forwards",
        "count-up": "countUp 1s ease-out forwards",
        "flow-line": "flowLine 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        countUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        flowLine: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "grid-pattern":
          "linear-gradient(rgba(12,138,240,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(12,138,240,0.06) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};
