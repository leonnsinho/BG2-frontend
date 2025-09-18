/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Novas cores da identidade BG2
        primary: {
          DEFAULT: '#EBA500', // amarelo principal
          50: '#FFF8E1',
          100: '#FFEFC1',
          200: '#FFE38F',
          300: '#FFD75D',
          400: '#FFC12A',
          500: '#EBA500',
          600: '#B88400',
          700: '#8A6500',
          800: '#5C4600',
          900: '#373435', // escuro para contraste
        },
        neutral: {
          DEFAULT: '#373435', // cinza escuro
          50: '#F5F5F5',
          100: '#EDEDED',
          200: '#D6D6D6',
          300: '#B0B0B0',
          400: '#8A8A8A',
          500: '#373435',
          600: '#2C2A29',
          700: '#222120',
          800: '#181716',
          900: '#0F0E0D',
        },
        background: '#FEFEFE', // branco principal
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        }
      },
      backgroundColor: {
        'background': '#FEFEFE',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 20px 40px -5px rgba(0, 0, 0, 0.1)',
        'strong': '0 8px 30px -5px rgba(0, 0, 0, 0.15), 0 25px 50px -5px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}
