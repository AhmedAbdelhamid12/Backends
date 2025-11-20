import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './theme';

// Icon Badge Component
export const IconBadge = ({ 
  icon, 
  size = 'md', 
  variant = 'primary',
  className = '',
  ...props 
}) => {
  const { theme } = useTheme();
  
  const sizeClasses = {
    sm: 'w-8 h-8 p-1.5 text-sm',
    md: 'w-12 h-12 p-2.5 text-base',
    lg: 'w-16 h-16 p-3 text-lg'
  };
  
  const variantClasses = {
    primary: {
      light: 'bg-blue-100 text-blue-600',
      dark: 'bg-blue-900/30 text-blue-400'
    },
    secondary: {
      light: 'bg-gray-100 text-gray-600',
      dark: 'bg-gray-700 text-gray-300'
    },
    accent: {
      light: 'bg-red-100 text-red-600',
      dark: 'bg-red-900/30 text-red-400'
    },
    success: {
      light: 'bg-green-100 text-green-600',
      dark: 'bg-green-900/30 text-green-400'
    }
  };
  
  const baseClasses = `
    inline-flex items-center justify-center rounded-full
    transition-all duration-200
    ${sizeClasses[size]}
    ${className}
  `;
  
  const themeVariant = variantClasses[variant][theme];
  
  return (
    <motion.div
      className={`${baseClasses} ${themeVariant}`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {icon}
    </motion.div>
  );
};

export default IconBadge;