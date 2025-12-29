/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        celestial: {
          DEFAULT: '#E0F7FA',
          dim: 'rgba(224, 247, 250, 0.08)',
          border: 'rgba(224, 247, 250, 0.2)',
          gold: '#FFD700',
          silver: '#C0C0C0',
          purple: '#B39DDB',
          success: '#81C784',
          danger: '#E57373',
          bg: '#02051F',
        },
        v64: {
          success: '#4ADE80',
          danger: '#F87171',
          warning: '#FBBF24',
          info: '#60A5FA',
        },
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Cinzel', 'serif'],
      },
    },
  },
  plugins: [],
};
