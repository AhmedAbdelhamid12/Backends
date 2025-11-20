import { tokens } from '../design/tokens';

// Animation utilities for consistent motion design
export const animations = {
  // Fade in animation
  fadeIn: {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { 
        duration: tokens.motion.durations.base / 1000,
        ease: tokens.motion.easings.spring
      }
    }
  },
  
  // Slide in from bottom
  slideInUp: {
    initial: { y: 20, opacity: 0 },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: { 
        duration: tokens.motion.durations.base / 1000,
        ease: tokens.motion.easings.spring
      }
    }
  },
  
  // Slide in from top
  slideInDown: {
    initial: { y: -20, opacity: 0 },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: { 
        duration: tokens.motion.durations.base / 1000,
        ease: tokens.motion.easings.spring
      }
    }
  },
  
  // Slide in from left
  slideInLeft: {
    initial: { x: -20, opacity: 0 },
    animate: { 
      x: 0, 
      opacity: 1,
      transition: { 
        duration: tokens.motion.durations.base / 1000,
        ease: tokens.motion.easings.spring
      }
    }
  },
  
  // Slide in from right
  slideInRight: {
    initial: { x: 20, opacity: 0 },
    animate: { 
      x: 0, 
      opacity: 1,
      transition: { 
        duration: tokens.motion.durations.base / 1000,
        ease: tokens.motion.easings.spring
      }
    }
  },
  
  // Scale in
  scaleIn: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        duration: tokens.motion.durations.base / 1000,
        ease: tokens.motion.easings.spring
      }
    }
  },
  
  // Staggered container animation
  staggerContainer: {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: tokens.motion.stagger / 1000,
        delayChildren: 0
      }
    }
  },
  
  // Staggered item animation
  staggerItem: {
    initial: { y: 20, opacity: 0 },
    animate: {
      y: 0,
      opacity: 1,
      transition: {
        duration: tokens.motion.durations.small / 1000,
        ease: tokens.motion.easings.spring
      }
    }
  }
};

// Reduced motion preferences (accessibility)
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Safe motion for accessibility
export const safeMotionDuration = (duration) => {
  return prefersReducedMotion() ? 0 : duration;
};

export default animations;