/**
 * Design System Tokens
 * Global design constants for the Swim Academy Pro UI
 * Following 8px baseline grid and mobile-first approach
 */

export const tokens = {
  // Color Palette
  colors: {
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9', // Primary accent
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c3d66',
    },
    secondary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7', // Accent
      600: '#9333ea',
      700: '#7e22ce',
      800: '#6b21a8',
      900: '#581c87',
    },
    accent: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444', // Call-to-action
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    neutral: {
      0: '#ffffff',
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },

  // Typography
  typography: {
    fonts: {
      body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      heading:
        '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: '"Fira Code", "Courier New", monospace',
    },
    sizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
      '6xl': 60,
      '7xl': 72,
    },
    weights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    lineHeights: {
      tight: 1.2,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
  },

  // Spacing (8px baseline)
  spacing: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    12: 48,
    14: 56,
    16: 64,
    20: 80,
    24: 96,
    28: 112,
    32: 128,
    36: 144,
    40: 160,
    44: 176,
    48: 192,
    52: 208,
    56: 224,
    60: 240,
    64: 256,
    72: 288,
    80: 320,
    96: 384,
  },

  // Border radius
  radius: {
    none: 0,
    sm: 2,
    base: 4,
    md: 6,
    lg: 8,
    xl: 12,
    '2xl': 16,
    '3xl': 24,
    full: 9999,
  },

  // Shadows
  shadows: {
    none: 'none',
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  },

  // Motion & Animation
  motion: {
    durations: {
      instant: 0,
      fast: 150,
      small: 220,
      base: 420,
      slow: 600,
      slower: 900,
    },
    easings: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      // Spring-like easing for modern feel
      spring: 'cubic-bezier(0.22, 1, 0.36, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      backOut: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    },
    stagger: 80,
  },

  // Breakpoints (mobile-first)
  breakpoints: {
    xs: 0,
    sm: 480,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },

  // Z-index scale
  zIndex: {
    auto: 'auto',
    0: 0,
    10: 10,
    20: 20,
    30: 30,
    40: 40,
    50: 50,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    backdrop: 1040,
    modal: 1060,
    tooltip: 1100,
  },

  // Transitions
  transitions: {
    default: 'all 0.42s cubic-bezier(0.22, 1, 0.36, 1)',
    fast: 'all 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
    slow: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
  },
};

// Responsive utility: Get breakpoint value
export const getBreakpoint = (size) => tokens.breakpoints[size] || tokens.breakpoints.lg;

// Animation variants for Framer Motion
export const animationVariants = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: tokens.motion.stagger / 1000,
        delayChildren: 0,
      },
    },
  },
  item: {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: tokens.motion.durations.base / 1000,
        ease: tokens.motion.easings.spring,
      },
    },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: tokens.motion.durations.base / 1000 },
    },
  },
  slideInUp: {
    hidden: { y: 40, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: tokens.motion.durations.base / 1000,
        ease: tokens.motion.easings.spring,
      },
    },
  },
  slideInDown: {
    hidden: { y: -40, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: tokens.motion.durations.base / 1000,
        ease: tokens.motion.easings.spring,
      },
    },
  },
  slideInLeft: {
    hidden: { x: -40, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: tokens.motion.durations.base / 1000,
        ease: tokens.motion.easings.spring,
      },
    },
  },
  slideInRight: {
    hidden: { x: 40, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: tokens.motion.durations.base / 1000,
        ease: tokens.motion.easings.spring,
      },
    },
  },
  scaleIn: {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: tokens.motion.durations.base / 1000,
        ease: tokens.motion.easings.spring,
      },
    },
  },
  rotateIn: {
    hidden: { rotate: -10, opacity: 0 },
    visible: {
      rotate: 0,
      opacity: 1,
      transition: {
        duration: tokens.motion.durations.base / 1000,
        ease: tokens.motion.easings.spring,
      },
    },
  },
};

// Reduced motion preferences (accessibility)
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Safe motion for accessibility
export const safeMotionDuration = (duration) => {
  return prefersReducedMotion() ? 0 : duration;
};

export default tokens;
