import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

/**
 * Card Component - Flexible container with elevation and hover effects
 */
export const Card = React.forwardRef(
  ({ children, className, hoverable = true, animated = true, ...props }, ref) => {
    const baseStyles =
      'bg-white rounded-xl overflow-hidden transition-all duration-300';

    const shadowStyles = 'shadow-base hover:shadow-lg';

    const hoverEffects = hoverable
      ? 'hover:translate-y-[-4px] cursor-pointer'
      : '';

    const Element = animated ? motion.div : 'div';
    const animationProps = animated
      ? {
          initial: { y: 20, opacity: 0 },
          whileInView: { y: 0, opacity: 1 },
          whileHover: hoverable ? { y: -4 } : {},
          transition: {
            duration: 0.42,
            ease: [0.22, 1, 0.36, 1],
          },
          viewport: { once: true, amount: 0.3 },
        }
      : {};

    return (
      <Element
        ref={ref}
        className={clsx(baseStyles, shadowStyles, hoverEffects, className)}
        {...animationProps}
        {...props}
      >
        {children}
      </Element>
    );
  }
);

Card.displayName = 'Card';
