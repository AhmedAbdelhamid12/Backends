import tokens from './src/design/tokens.js';

export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: tokens.colors.primary,
        secondary: tokens.colors.secondary,
        accent: tokens.colors.accent,
        neutral: tokens.colors.neutral,
      },
      spacing: tokens.spacing,
      borderRadius: tokens.radius,
      boxShadow: tokens.shadows,
      fontFamily: {
        body: tokens.typography.fonts.body,
        heading: tokens.typography.fonts.heading,
        mono: tokens.typography.fonts.mono,
      },
      fontSize: tokens.typography.sizes,
      fontWeight: tokens.typography.weights,
      lineHeight: tokens.typography.lineHeights,
      transitionDuration: {
        instant: '0ms',
        fast: '150ms',
        small: '220ms',
        base: '420ms',
        slow: '600ms',
      },
      animation: {
        fadeIn: 'fadeIn 420ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        slideUp: 'slideUp 420ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        slideDown: 'slideDown 420ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        slideLeft: 'slideLeft 420ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        slideRight: 'slideRight 420ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        scaleIn: 'scaleIn 420ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        bounce: 'bounce 1s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(40px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-40px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(-40px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(40px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      screens: {
        xs: '0px',
        sm: '480px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
