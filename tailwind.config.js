/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    borderRadius: {
      none: '0',
      sm: '0.125rem',
      DEFAULT: '0.125rem',
      md: '0.125rem',
      lg: '0.125rem',
      xl: '0.125rem',
      '2xl': '0.125rem',
      '3xl': '0.125rem',
      full: '9999px',
    },
    container: {
      center: true,
      padding: {
        DEFAULT: '16px',
        sm: '24px',
        lg: '32px',
      },
    },
    extend: {
      colors: {
        background: '#f3f4f6',
        surface: '#ffffff',
        border: '#d4d4d8',
        text: '#111827',
        muted: '#6b7280',
        accent: '#0f172a',
        accentSoft: '#334155',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body: ['"Space Grotesk"', 'sans-serif'],
      },
      fontSize: {
        h1: ['56px', { lineHeight: '1', letterSpacing: '-0.03em' }],
        h2: ['36px', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        h3: ['24px', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
        body: ['16px', { lineHeight: '1.5' }],
        label: ['12px', { lineHeight: '1.2', letterSpacing: '0.08em' }],
      },
      borderRadius: {
        surface: '0.125rem',
        chip: '999px',
      },
      boxShadow: {
        soft: '0 8px 24px rgba(15, 23, 42, 0.08)',
        frame: '0 0 0 1px rgba(15, 23, 42, 0.08), 0 10px 28px rgba(15, 23, 42, 0.08)',
      },
      backgroundImage: {
        paper:
          'radial-gradient(circle at 1px 1px, rgba(15, 23, 42, 0.08) 1px, transparent 0)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        sweep: {
          '0%': { transform: 'scaleX(0)', transformOrigin: 'left' },
          '100%': { transform: 'scaleX(1)', transformOrigin: 'left' },
        },
      },
      animation: {
        'fade-up': 'fade-up 320ms ease-out',
        sweep: 'sweep 220ms ease-out',
      },
    },
  },
  plugins: [],
}
