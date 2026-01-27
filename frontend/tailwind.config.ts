import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Discord-inspired dark theme
        background: {
          DEFAULT: '#0f0f0f',
          secondary: '#1a1a1a',
          tertiary: '#1e1f22',
          elevated: '#202225',
          hover: '#2a2d31',
        },
        foreground: {
          DEFAULT: '#e0e0e0',
          muted: '#a0a0a0',
          subtle: '#6b7280',
        },
        // Accent colors for trading
        profit: {
          DEFAULT: '#3ba55d',
          light: '#4ade80',
          muted: 'rgba(59, 165, 93, 0.2)',
        },
        loss: {
          DEFAULT: '#ed4245',
          light: '#f87171',
          muted: 'rgba(237, 66, 69, 0.2)',
        },
        // Primary brand color
        primary: {
          DEFAULT: '#5865f2',
          hover: '#4752c4',
          muted: 'rgba(88, 101, 242, 0.2)',
        },
        // Chart colors
        chart: {
          up: '#3ba55d',
          down: '#ed4245',
          grid: '#2a2d31',
          volume: '#5865f2',
        },
        // Sentiment colors
        sentiment: {
          bullish: '#3ba55d',
          bearish: '#ed4245',
          neutral: '#f59e0b',
        },
        // Status colors
        status: {
          info: '#3b82f6',
          warning: '#f59e0b',
          error: '#ed4245',
          success: '#3ba55d',
        },
        // Border colors
        border: {
          DEFAULT: '#2a2d31',
          hover: '#3f4248',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(59, 165, 93, 0.3)',
        'glow-red': '0 0 20px rgba(237, 66, 69, 0.3)',
        'glow-blue': '0 0 20px rgba(88, 101, 242, 0.3)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
