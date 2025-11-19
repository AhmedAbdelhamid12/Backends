import React from 'react';
import clsx from 'clsx';

/**
 * Container Component - Responsive max-width wrapper with padding
 */
export const Container = React.forwardRef(
  ({ children, className, size = 'lg', ...props }, ref) => {
    const sizes = {
      sm: 'max-w-2xl px-4 sm:px-6',
      md: 'max-w-4xl px-4 sm:px-6 lg:px-8',
      lg: 'max-w-6xl px-4 sm:px-6 lg:px-8',
      xl: 'max-w-7xl px-4 sm:px-6 lg:px-8',
      full: 'w-full px-4 sm:px-6 lg:px-8',
    };

    return (
      <div
        ref={ref}
        className={clsx('mx-auto', sizes[size], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = 'Container';
