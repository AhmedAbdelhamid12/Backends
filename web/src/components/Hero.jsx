import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Section, Container, Button } from './primitives';

/**
 * Hero Component - Large headline section with parallax, animated text, and CTAs
 */
export const Hero = ({ onContactClick }) => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Parallax effect - subtle translateY based on scroll
  const parallaxOffset = Math.min(scrollY * 0.3, 100);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  // Text animation - line by line
  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (custom) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: custom * 0.1,
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      },
    }),
  };

  return (
    <Section
      background="gradient"
      fullHeight
      animated={false}
      className="relative overflow-hidden pt-20 md:pt-32"
    >
      {/* Animated background elements */}
      <motion.div
        className="absolute -top-32 -right-32 w-96 h-96 bg-primary-100 rounded-full opacity-20 blur-3xl"
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute -bottom-32 -left-32 w-96 h-96 bg-secondary-100 rounded-full opacity-20 blur-3xl"
        animate={{
          x: [0, -50, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <Container className="relative z-10">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Text Content */}
          <div className="flex flex-col gap-6 md:gap-8">
            {/* Eyebrow text */}
            <motion.div
              className="inline-flex items-center gap-2 w-fit"
              variants={itemVariants}
            >
              <div className="w-2 h-2 rounded-full bg-primary-500" />
              <span className="text-sm font-semibold text-primary-600 uppercase tracking-wide">
                Welcome to Excellence
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.div
              className="space-y-2"
              variants={itemVariants}
            >
              <div className="overflow-hidden">
                <motion.h1
                  className="text-5xl md:text-6xl lg:text-7xl font-bold text-neutral-900 leading-tight"
                  variants={textVariants}
                  custom={0}
                >
                  Transform Your
                </motion.h1>
              </div>
              <div className="overflow-hidden">
                <motion.h1
                  className="text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent leading-tight"
                  variants={textVariants}
                  custom={1}
                >
                  Swimming Journey
                </motion.h1>
              </div>
            </motion.div>

            {/* Subheadline */}
            <motion.p
              className="text-lg md:text-xl text-neutral-600 max-w-xl leading-relaxed"
              variants={itemVariants}
            >
              Unlock your potential with world-class coaching, personalized training plans,
              and a supportive community dedicated to excellence in competitive swimming.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 pt-4"
              variants={itemVariants}
            >
              <Button
                variant="primary"
                size="lg"
                onClick={onContactClick}
                className="shadow-lg"
              >
                Start Your Journey
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  document.getElementById('services')?.scrollIntoView({
                    behavior: 'smooth',
                  });
                }}
              >
                Learn More
              </Button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              className="flex flex-col sm:flex-row gap-6 pt-4 border-t border-neutral-200"
              variants={itemVariants}
            >
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 border-2 border-white"
                    />
                  ))}
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">1000+ Members</p>
                  <p className="text-xs text-neutral-500">Actively Training</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center">
                  <span className="text-lg">⭐</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">4.9/5 Rating</p>
                  <p className="text-xs text-neutral-500">From 500+ Reviews</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right side - Illustration/Image */}
          <motion.div
            className="hidden lg:block relative h-96 lg:h-full"
            style={{
              y: parallaxOffset * 0.5,
            }}
            variants={itemVariants}
          >
            <motion.div
              className="absolute inset-0 rounded-2xl overflow-hidden bg-gradient-to-br from-primary-400 to-secondary-400 shadow-2xl"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.42 }}
            >
              {/* Placeholder for image - gradient with shapes */}
              <div className="w-full h-full flex items-center justify-center relative">
                <motion.div
                  className="absolute w-32 h-32 bg-white rounded-full opacity-20"
                  animate={{
                    y: [0, 20, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                  }}
                />
                <motion.div
                  className="absolute w-20 h-20 bg-white rounded-full opacity-10 bottom-20 right-10"
                  animate={{
                    x: [0, 15, 0],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                  }}
                />
                <div className="text-white text-center z-10">
                  <div className="text-6xl mb-4">🏊</div>
                  <p className="font-semibold text-lg">Elite Training Program</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </Container>
    </Section>
  );
};
