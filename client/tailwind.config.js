/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#F5A623',
          'orange-dark': '#E09400',
          'orange-light': '#F7B84B',
          teal: '#1B998B',
          'teal-dark': '#158578',
          'teal-light': '#2ABFAE',
        },
        warm: {
          50: '#FFFFFF',
          100: '#FFF9EE',
          200: '#FFF0D0',
          300: '#FFE4A8',
          400: '#FFD780',
        },
        surface: {
          primary: '#FFFFFF',
          secondary: '#F9F9F9',
          card: 'rgba(255, 255, 255, 0.90)',
          glass: 'rgba(255, 255, 255, 0.70)',
        },
        ink: {
          900: '#111111',
          800: '#1F1F1F',
          700: '#333333',
          600: '#555555',
          500: '#777777',
          400: '#999999',
          300: '#BBBBBB',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'float': 'float 20s ease-in-out infinite',
        'float-delayed': 'float 20s ease-in-out infinite -10s',
        'pulse-slow': 'pulse 2s ease-in-out infinite',
        'pulse-fast': 'pulse 1s ease-in-out infinite',
        'spin-slow': 'spin 1.5s linear infinite',
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
        'fade-in-up': 'fadeInUp 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
        'fade-in-up-delayed': 'fadeInUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both',
        'fade-in-up-delayed-2': 'fadeInUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both',
        'fade-in-up-delayed-3': 'fadeInUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.45s both',
        'slide-up': 'slideUp 0.3s ease',
        'msg-in': 'msgIn 0.3s ease',
        'gentle-bounce': 'gentleBounce 2s ease-in-out infinite',
        'wave': 'wave 2.5s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -20px) scale(1.05)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.95)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        msgIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        gentleBounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        wave: {
          '0%': { transform: 'rotate(0deg)' },
          '10%': { transform: 'rotate(14deg)' },
          '20%': { transform: 'rotate(-8deg)' },
          '30%': { transform: 'rotate(14deg)' },
          '40%': { transform: 'rotate(-4deg)' },
          '50%': { transform: 'rotate(10deg)' },
          '60%, 100%': { transform: 'rotate(0deg)' },
        },
      },
    },
  },
  plugins: [],
};
