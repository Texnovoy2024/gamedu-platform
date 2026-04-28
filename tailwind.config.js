/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f4f6ff',
          100: '#e4e7ff',
          200: '#c3c9ff',
          300: '#9ba2ff',
          400: '#6b70ff',
          500: '#4b4dff',
          600: '#3738e0',
          700: '#2a2bb3',
          800: '#22238c',
          900: '#1e206f',
        },
        accent: {
          100: '#fdf4ff',
          200: '#f5e1ff',
          400: '#e28dff',
          500: '#d260ff',
        },
        xp: {
          100: '#ecfdf5',
          300: '#6ee7b7',
          500: '#10b981',
          700: '#047857',
        },
        game: {
          bg:     '#0d0b1e',
          card:   '#16132e',
          border: '#2d2a5e',
          purple: '#7c3aed',
          violet: '#6d28d9',
          pink:   '#db2777',
          gold:   '#f59e0b',
          cyan:   '#06b6d4',
        },
      },
      backgroundImage: {
        'game-gradient':   'linear-gradient(135deg, #0d0b1e 0%, #1a1040 40%, #0d1b3e 100%)',
        'card-gradient':   'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(109,40,217,0.05) 100%)',
        'gold-gradient':   'linear-gradient(135deg, #f59e0b, #d97706)',
        'xp-gradient':     'linear-gradient(90deg, #7c3aed, #db2777, #f59e0b)',
        'hero-gradient':   'linear-gradient(180deg, rgba(124,58,237,0.3) 0%, transparent 100%)',
      },
      boxShadow: {
        soft:       '0 18px 45px rgba(15, 23, 42, 0.18)',
        glow:       '0 0 25px rgba(79, 70, 229, 0.55)',
        'glow-purple': '0 0 30px rgba(124, 58, 237, 0.5)',
        'glow-gold':   '0 0 20px rgba(245, 158, 11, 0.4)',
        'glow-pink':   '0 0 20px rgba(219, 39, 119, 0.4)',
        'card-game':   '0 4px 24px rgba(124, 58, 237, 0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      animation: {
        'float':        'float 3s ease-in-out infinite',
        'pulse-slow':   'pulse 3s ease-in-out infinite',
        'shimmer':      'shimmer 2s linear infinite',
        'bounce-slow':  'bounce 2s ease-in-out infinite',
        'spin-slow':    'spin 8s linear infinite',
        'glow-pulse':   'glowPulse 2s ease-in-out infinite',
        'slide-up':     'slideUp 0.5s ease-out forwards',
        'pop':          'pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.6', filter: 'brightness(1)' },
          '50%':      { opacity: '1',   filter: 'brightness(1.3)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pop: {
          '0%':   { opacity: '0', transform: 'scale(0.5)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
