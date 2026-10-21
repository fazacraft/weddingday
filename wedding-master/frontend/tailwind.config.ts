import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // "Bog'" shabloni
        cream: '#f0ece3',
        'cream-dark': '#e8e2d6',
        forest: '#30401c',
        'forest-light': '#4a6130',
        charcoal: '#353535',
        // Platforma (landing, wizard, kabinet)
        ivory: '#faf6ef',
        sand: '#efe6d8',
        ink: '#1f1a17',
        rose: '#9b2335',
        'rose-dark': '#7a1a2a',
        gold: '#b8913a',
      },
      fontFamily: {
        script: ['"Dancing Script"', 'cursive'],
        body: ['Lato', 'sans-serif'],
        formal: ['"Cormorant Garamond"', 'serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      letterSpacing: {
        widest2: '0.25em',
      },
      keyframes: {
        scrollDot: {
          '0%, 100%': { transform: 'translateY(0)', opacity: '0.6' },
          '50%': { transform: 'translateY(6px)', opacity: '0.15' },
        },
      },
      animation: {
        'scroll-dot': 'scrollDot 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
