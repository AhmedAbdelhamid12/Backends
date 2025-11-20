import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './theme';

// Primary Button Component
export const PrimaryButton = ({ 
  children, 
  onClick, 
  disabled = false, 
  size = 'md', 
  icon,
  className = '',
  ...props 
}) => {
  const { theme } = useTheme();
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-lg
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}
    ${sizeClasses[size]}
    ${className}
  `;
  
  const lightClasses = `
    bg-blue-500 text-white
    hover:bg-blue-600
    focus:ring-blue-500 focus:ring-offset-white
    shadow-sm
  `;
  
  const darkClasses = `
    bg-blue-600 text-white
    hover:bg-blue-700
    focus:ring-blue-500 focus:ring-offset-gray-900
    shadow-lg
  `;
  
  const themeClasses = theme === 'dark' ? darkClasses : lightClasses;
  
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`${baseClasses} ${themeClasses}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </motion.button>
  );
};

// Secondary Button Component
export const SecondaryButton = ({ 
  children, 
  onClick, 
  disabled = false, 
  size = 'md', 
  icon,
  className = '',
  ...props 
}) => {
  const { theme } = useTheme();
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-lg
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    border
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}
    ${sizeClasses[size]}
    ${className}
  `;
  
  const lightClasses = `
    bg-white text-gray-700 border-gray-300
    hover:bg-gray-50 hover:border-gray-400
    focus:ring-blue-500 focus:ring-offset-white
    shadow-sm
  `;
  
  const darkClasses = `
    bg-gray-800 text-gray-200 border-gray-600
    hover:bg-gray-700 hover:border-gray-500
    focus:ring-blue-500 focus:ring-offset-gray-900
    shadow-lg
  `;
  
  const themeClasses = theme === 'dark' ? darkClasses : lightClasses;
  
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`${baseClasses} ${themeClasses}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </motion.button>
  );
};

export default { PrimaryButton, SecondaryButton };