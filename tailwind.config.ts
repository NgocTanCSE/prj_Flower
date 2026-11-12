/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/(site)/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/admin/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#faf5fa',
          100: '#f2e8f2',
          200: '#e5d3e5',
          300: '#d1a8d1',
          400: '#b277b2',
          500: '#9a5a9a',
          600: '#8b4f8b',
          700: '#734173',
          800: '#5d355d',
          900: '#4c2d4c',
        },
        ink: { 50: '#FFFFFF', 500: '#5b5b5b', 600: '#595959', 700: '#1a1a1a' },
        sage: { 500: '#5bb46a' },
        rose: '#8b5f65',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-body)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      keyframes: {
        'reveal-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'reveal-up': 'reveal-up 0.7s ease-out forwards',
        'fade-in': 'fade-in 0.4s ease-out forwards',
      },
    },
  },
  plugins: [],
};
