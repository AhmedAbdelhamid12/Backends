import React, { useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Section, Container } from './primitives';

/**
 * Counter component - Animated number counter
 */
const Counter = ({ end, duration = 2, prefix = '', suffix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const increment = end / (duration * 100);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 10);

    return () => clearInterval(timer);
  }, [isInView, end, duration]);

  return (
    <div ref={ref}>
      <span className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
        {prefix}{count}{suffix}
      </span>
    </div>
  );
};

/**
 * Stats Component - Animated counters showcasing key metrics
 */
export const Stats = () => {
  const stats = [
    {
      id: 1,
      value: 1000,
      suffix: '+',
      label: 'Active Members',
      description: 'Training with our academy',
    },
    {
      id: 2,
      value: 98,
      suffix: '%',
      label: 'Success Rate',
      description: 'Athletes achieving goals',
    },
    {
      id: 3,
      value: 50,
      suffix: '+',
      label: 'Professional Coaches',
      description: 'Certified and experienced',
    },
    {
      id: 4,
      value: 15,
      suffix: '+',
      label: 'Years Experience',
      description: 'Excellence in swimming',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
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
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <Section background="gradient-dark" className="py-16 md:py-24">
      <Container>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.id}
              variants={itemVariants}
              className="text-center"
            >
              <div className="mb-4">
                <Counter end={stat.value} suffix={stat.suffix} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {stat.label}
              </h3>
              <p className="text-neutral-300">
                {stat.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  );
};
