/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#fef8f6',
          dark: "#1B2A2E",
          soft: '#FFB3C6',
        },
        paper: {
          DEFAULT: '#FDF3F0',
          light: '#FFB3C6',
        },
        brick: {
          DEFAULT: '#1B2A2E',
          rose: '#FF7096',
        },
        brass: {
          DEFAULT: '#9C7A34',
          light: '#C9A85E',
        },
        forest: '#3F6B52',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      backgroundImage: {
        ledger:
          'repeating-linear-gradient(to bottom, transparent, transparent 2.5rem, rgba(27,42,46,0.07) 2.5rem, rgba(27,42,46,0.07) calc(2.5rem + 1px))',
      },
    },
  },
  plugins: [],
};
