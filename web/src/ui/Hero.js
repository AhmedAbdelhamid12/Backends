import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './theme';

// Hero Component
export const Hero = ({ 
  children, 
  backgroundImage,
  className = '',
  minHeight = 'min-h-screen',
  ...props 
}) => {
  const { theme } = useTheme();
  
  const lightClasses = 'bg-gradient-to-br from-blue-50 to-indigo-100';
  const darkClasses = 'bg-gradient-to-br from-gray-900 to-gray-800';
  const themeClasses = theme === 'dark' ? darkClasses : lightClasses;
  
  // Parallax effect for background
  const parallaxVariants = {
    hidden: { y: 0 },
    visible: { 
      y: -20,
      transition: { 
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };
  
  return (
    <motion.section
      className={`relative overflow-hidden ${minHeight} ${themeClasses} ${className}`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      {...props}
    >
      {/* Background image with parallax effect */}
      {backgroundImage && (
        <motion.div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${backgroundImage})` }}
          variants={parallaxVariants}
        />
      )}
      
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/10 dark:bg-black/30" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 py-16 sm:px-6 lg:px-8">
        {children}
      </div>
    </motion.section>
  );
};

export default Hero;