import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

/**
 * Section Component - Container wrapper for page sections with optional background
 */
export const Section = React.forwardRef(
  (
    {
      children,
      className,
      background = 'white',
      fullHeight = false,
      animated = true,
      id,
      ...props
    },
    ref
  ) => {
    const backgrounds = {
      white: 'bg-white',
      light: 'bg-neutral-50',
      dark: 'bg-neutral-900 text-white',
      gradient:
        'bg-gradient-to-br from-primary-50 via-white to-secondary-50',
      'gradient-dark':
        'bg-gradient-to-br from-primary-900 via-neutral-900 to-secondary-900 text-white',
    };

    const Element = animated ? motion.section : 'section';
    const animationProps = animated
      ? {
          initial: { opacity: 0 },
          whileInView: { opacity: 1 },
          transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
          viewport: { once: true, amount: 0.2 },
        }
      : {};

    return (
      <Element
        ref={ref}
        id={id}
        className={clsx(
          backgrounds[background],
          fullHeight && 'min-h-screen flex items-center',
          className
        )}
        {...animationProps}
        {...props}
      >
        {children}
      </Element>
    );
  }
);

Section.displayName = 'Section';
