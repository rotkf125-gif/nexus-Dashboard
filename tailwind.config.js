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
          cyan: '#22d3ee',
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
        mono: ['Montserrat', 'sans-serif'],
        display: ['Montserrat', 'sans-serif'],
      },
      spacing: {
        'touch': '44px',
        'touch-sm': '36px',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-top': 'env(safe-area-inset-top)',
      },
      minWidth: {
        'touch': '44px',
      },
      minHeight: {
        'touch': '44px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
