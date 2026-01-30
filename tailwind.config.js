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
        ocean: {
          surface: '#020617',
          deep: '#0c1929',
          mid: '#1e3a5f',
          twilight: '#0f2744',
        },
        biolum: {
          DEFAULT: '#22d3ee',
          soft: 'rgba(34, 211, 238, 0.15)',
          glow: 'rgba(34, 211, 238, 0.4)',
        },
        celestial: {
          DEFAULT: '#22d3ee',
          dim: 'rgba(34, 211, 238, 0.08)',
          border: 'rgba(14, 165, 233, 0.15)',
          gold: '#fbbf24',
          silver: '#94a3b8',
          purple: '#8b5cf6',
          success: '#22d3ee',
          danger: '#f43f5e',
          bg: '#020617',
          cyan: '#22d3ee',
        },
        v64: {
          success: '#22d3ee',
          danger: '#f43f5e',
          warning: '#fbbf24',
          info: '#3b82f6',
        },
      },
      fontFamily: {
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Montserrat', 'monospace'],
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
      borderRadius: {
        'ocean': '12px',
        'ocean-sm': '8px',
      },
      boxShadow: {
        'ocean': '0 8px 32px rgba(0, 0, 0, 0.4)',
        'ocean-glow': '0 0 30px rgba(34, 211, 238, 0.15)',
        'biolum': '0 0 20px rgba(34, 211, 238, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'bubble-rise': 'bubbleRise 15s linear infinite',
        'biolum-pulse': 'biolumPulse 2s ease-in-out infinite',
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
        bubbleRise: {
          '0%': { bottom: '-20px', opacity: '0' },
          '10%': { opacity: '0.6' },
          '90%': { opacity: '0.2' },
          '100%': { bottom: '100vh', opacity: '0' },
        },
        biolumPulse: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(34, 211, 238, 1)', opacity: '1' },
          '50%': { boxShadow: '0 0 20px rgba(34, 211, 238, 1)', opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
};
