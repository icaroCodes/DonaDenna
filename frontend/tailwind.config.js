/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1A0F0A',
        paper: '#FFFFFF',
        // Paleta DonaDenna — mocha / café com creme
        mocha: {
          50:  '#FAF6F1',
          100: '#F2E9DC',
          200: '#E4D2BC',
          300: '#CFB291',
          400: '#A8825D',
          500: '#7E5A3A',
          600: '#5C3F28',
          700: '#432D1C',
          800: '#2C1D12',
          900: '#1A0F0A',
          950: '#0E0703',
        },
        pix: {
          50:  '#ECFAF1',
          500: '#1F9D55',
          600: '#0F8A45',
        },
        cream: '#FAF6F1',
        sand: '#F2E9DC',
        neutral: {
          50:  '#FAFAFA',
          100: '#F4F2EF',
          200: '#E7E3DD',
          300: '#D1CAC1',
          400: '#A19A8E',
          500: '#736B5F',
          600: '#52493D',
          700: '#3F3830',
          800: '#262321',
          900: '#171513',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Cormorant Garamond"', '"Playfair Display"', 'ui-serif', 'Georgia', 'serif'],
        serif: ['"Cormorant Garamond"', '"Playfair Display"', 'ui-serif', 'Georgia', 'serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter: '-0.025em',
        wider: '0.12em',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(67,45,28,0.04), 0 8px 24px -12px rgba(67,45,28,0.12)',
        ring: '0 0 0 1px rgba(67,45,28,0.08)',
        warm: '0 12px 36px -16px rgba(92,63,40,0.35)',
      },
      transitionTimingFunction: {
        'out-soft': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both',
        'shine':   'shine 2.4s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shine: {
          '0%':   { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
      },
      backgroundImage: {
        'hero-leaves':
          "radial-gradient(ellipse at 0% 100%, rgba(255,245,230,0.10), transparent 50%), radial-gradient(ellipse at 100% 0%, rgba(255,245,230,0.08), transparent 50%)",
      },
    },
  },
  plugins: [],
}
