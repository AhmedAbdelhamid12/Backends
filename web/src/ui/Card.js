import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './theme';

// Card Component
export const Card = ({ 
  children, 
  className = '',
  hover = true,
  animate = true,
  ...props 
}) => {
  const { theme } = useTheme();
  
  const baseClasses = `
    rounded-xl p-6 transition-all duration-300
    ${className}
  `;
  
  const lightClasses = `
    bg-white text-gray-800
    shadow-md
    ${hover ? 'hover:shadow-lg' : ''}
  `;
  
  const darkClasses = `
    bg-gray-800 text-gray-100
    shadow-xl
    ${hover ? 'hover:shadow-2xl' : ''}
  `;
  
  const themeClasses = theme === 'dark' ? darkClasses : lightClasses;
  
  const animationProps = animate ? {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.4, ease: "easeOut" }
  } : {};
  
  return (
    <motion.div
      className={`${baseClasses} ${themeClasses}`}
      whileHover={hover ? { y: -5 } : {}}
      {...animationProps}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;