import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Section, Container, Card, Icon, icons } from './primitives';

/**
 * Team Carousel Component - Autoplay testimonials/team carousel with manual nav
 */
export const TeamCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  const team = [
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Head Coach',
      testimonial:
        'SwimAcademy has transformed the way we train our athletes. The platform is intuitive and results are exceptional.',
      image: '👩‍🏫',
    },
    {
      id: 2,
      name: 'Michael Chen',
      role: 'Competitive Athlete',
      testimonial:
        'I improved my time by 5 seconds in just 3 months. The personalized coaching is exactly what I needed.',
      image: '🏊',
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      role: 'Parent',
      testimonial:
        'Seeing my child progress and gain confidence has been amazing. Highly recommended!',
      image: '👩‍👧',
    },
  ];

  useEffect(() => {
    if (!autoplay) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % team.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [autoplay, team.length]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % team.length);
    setAutoplay(false);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + team.length) % team.length);
    setAutoplay(false);
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  return (
    <Section background="light" id="team" className="py-16 md:py-24">
      <Container>
        <motion.div
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
            Success Stories
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Hear from our coaches, athletes, and families
          </p>
        </motion.div>

        {/* Carousel */}
        <div className="relative max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              custom={currentIndex}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.4 },
              }}
            >
              <Card className="p-8 md:p-12 text-center">
                <div className="text-6xl mb-6">{team[currentIndex].image}</div>
                <p className="text-xl md:text-2xl text-neutral-700 mb-6 italic leading-relaxed">
                  "{team[currentIndex].testimonial}"
                </p>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">
                    {team[currentIndex].name}
                  </h3>
                  <p className="text-neutral-500">{team[currentIndex].role}</p>
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <motion.button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 md:-translate-x-20 w-12 h-12 rounded-full bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Previous slide"
          >
            ←
          </motion.button>

          <motion.button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 md:translate-x-20 w-12 h-12 rounded-full bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Next slide"
          >
            →
          </motion.button>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-3 mt-8">
            {team.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setAutoplay(false);
                }}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-primary-500 w-8'
                    : 'bg-neutral-300 hover:bg-neutral-400'
                }`}
                whileHover={{ scale: 1.2 }}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Autoplay Toggle */}
          <motion.button
            onClick={() => setAutoplay(!autoplay)}
            className="absolute bottom-4 right-4 text-xs font-medium text-primary-600 hover:text-primary-700 bg-white px-3 py-1.5 rounded-full border border-primary-200"
            whileHover={{ scale: 1.05 }}
          >
            {autoplay ? '⏸ Pause' : '▶ Play'}
          </motion.button>
        </div>
      </Container>
    </Section>
  );
};
