/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "var(--background)",
          panel: "var(--background)",
          elev: "var(--background-elevated)",
          hover: "var(--hover-inverted)",
        },
        border: {
          DEFAULT: "var(--border)",
          subtle: "var(--border)",
          strong: "var(--border-strong)",
        },
        fg: {
          DEFAULT: "var(--foreground)",
          muted: "var(--foreground-medium)",
          dim: "var(--foreground-light)",
          ghost: "var(--foreground-dim)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          fg: "var(--accent-foreground)",
        },
        bull: "var(--bull)",
        bear: "var(--bear)",
      },
      fontFamily: {
        sans: ['"Denim"', '"Onest"', "system-ui", "sans-serif"],
        display: ['"DenimINK"', '"Instrument Serif"', '"Onest"', "serif"],
        mono: ['"Geist Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        none: "0",
        DEFAULT: "0",
      },
    },
  },
  plugins: [],
};
