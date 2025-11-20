import React from 'react';
import { motion } from 'framer-motion';

// Section Wrapper Component
export const SectionWrapper = ({ 
  children, 
  className = '',
  animate = true,
  ...props 
}) => {
  const animationProps = animate ? {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.5, ease: "easeOut" }
  } : {};
  
  return (
    <motion.section
      className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}
      {...animationProps}
      {...props}
    >
      {children}
    </motion.section>
  );
};

export default SectionWrapper;