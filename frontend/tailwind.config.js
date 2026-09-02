/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Sora", "system-ui", "sans-serif"],
        serif: ["'Instrument Serif'", "serif"],
      },
      colors: {
        bg: "var(--color-bg)",
        card: "var(--color-card)",
        fg: "var(--color-fg)",
        muted: "var(--color-muted)",
        border: "var(--color-border)",
        accent: "var(--color-accent)",
        positive: "var(--color-positive)",
        "positive-bg": "var(--color-positive-bg)",
        negative: "var(--color-negative)",
        "negative-bg": "var(--color-negative-bg)",
        btc: "var(--color-btc)",
        eth: "var(--color-eth)",
        sol: "var(--color-sol)",
      },
      borderRadius: {
        card: "22px",
      },
    },
  },
  plugins: [],
};
