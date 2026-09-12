/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#a64b2a',
          hover: '#8f3e21',
          light: '#c47a4b',
        },
        secondary: '#2d3e4b',
        background: '#f5f0eb',
        card: '#ffffff',
        border: '#e8d9cc',
        'border-light': '#f0e6dc',
        text: '#2d2a24',
        'text-muted': '#5f4d3e',
        'text-light': '#7c6856',
        success: '#1d6b44',
        warning: '#a86f2c',
        danger: '#a64b2a',
        info: '#2a5f7a',
      },
      borderRadius: {
        DEFAULT: '16px',
        sm: '8px',
        lg: '24px',
      },
      fontFamily: {
        sans: ['Segoe UI', 'Roboto', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 12px rgba(0, 0, 0, 0.06)',
        'card-lg': '0 12px 40px rgba(0, 0, 0, 0.12)',
      },
      keyframes: {
        slideUp: {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          from: { transform: 'translateX(120%)' },
          to: { transform: 'translateX(0)' },
        },
      },
      animation: {
        slideUp: 'slideUp 0.3s ease',
        slideInRight: 'slideInRight 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}