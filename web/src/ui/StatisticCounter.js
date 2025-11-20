import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './theme';

// Statistic Counter Component
export const StatisticCounter = ({ 
  value, 
  label, 
  prefix = '', 
  suffix = '', 
  duration = 2,
  className = '',
  ...props 
}) => {
  const { theme } = useTheme();
  
  const lightClasses = 'text-gray-900';
  const darkClasses = 'text-white';
  const themeClasses = theme === 'dark' ? darkClasses : lightClasses;
  
  // Format large numbers with commas
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };
  
  const numberVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: duration,
        ease: "easeOut"
      }
    }
  };
  
  return (
    <motion.div
      className={`text-center ${className}`}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      {...props}
    >
      <motion.div 
        className={`text-4xl md:text-5xl font-bold ${themeClasses}`}
        variants={numberVariants}
      >
        {prefix}
        {formatNumber(value)}
        {suffix}
      </motion.div>
      <div className={`mt-2 text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
        {label}
      </div>
    </motion.div>
  );
};

export default StatisticCounter;