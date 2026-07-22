/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#10192E',
          50: '#EEF0F5',
          100: '#D6DBE7',
          200: '#AEB9CE',
          400: '#5A6C93',
          600: '#2B3B5C',
          800: '#161F35',
          900: '#0B1120',
        },
        paper: '#F4F5F0',
        signal: {
          DEFAULT: '#FFB100',
          50: '#FFF6E0',
          100: '#FFEBB8',
          400: '#FFB100',
          600: '#D98F00',
        },
        pin: '#0F8A8A', // teal secondary accent (location pin / verified marker)
        moss: '#2E8B57',
        rose: '#E63950',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        pin: '0 1px 0 rgba(16,25,46,0.04), 0 8px 24px -12px rgba(16,25,46,0.18)',
      },
      borderRadius: {
        card: '14px',
      },
    },
  },
  plugins: [],
};
