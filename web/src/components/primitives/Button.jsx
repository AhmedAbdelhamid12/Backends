import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { tokens } from '../../design/tokens';

/**
 * Button Component - Reusable primary & secondary CTA button
 * Supports variants, sizes, states (disabled, loading)
 */
export const Button = React.forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      className,
      disabled = false,
      loading = false,
      onClick,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500',
      secondary:
        'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 focus:ring-neutral-500',
      accent: 'bg-accent-500 text-white hover:bg-accent-600 focus:ring-accent-500',
      outline:
        'border-2 border-primary-500 text-primary-500 hover:bg-primary-50 focus:ring-primary-500',
      ghost: 'text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
    };

    const sizes = {
      sm: 'px-3 py-2 text-sm rounded-lg',
      md: 'px-4 py-2.5 text-base rounded-lg',
      lg: 'px-6 py-3 text-lg rounded-xl',
      xl: 'px-8 py-4 text-xl rounded-xl',
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={clsx(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        onClick={onClick}
        {...props}
      >
        {loading ? (
          <span className="inline-block animate-spin mr-2">⏳</span>
        ) : null}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
