/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#1B2A2E',
          soft: '#7B1738',
        },
        paper: {
          DEFAULT: '#fbf7f7',
          light: '#FFB3C6',
        },
        brick: {
          DEFAULT: '#C2185B ',
          rose: '#FF7096',
        },
        brass: {
          DEFAULT: '#F5CFC8',
          light: '#C87870',
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
