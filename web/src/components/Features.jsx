import React from 'react';
import { motion } from 'framer-motion';
import { Section, Container, Icon, icons } from './primitives';

/**
 * Features Block Component - 4 feature columns with micro-interactions
 */
export const Features = () => {
  const features = [
    {
      id: 1,
      title: 'Expert Coaches',
      description: 'Certified professionals with years of competitive experience',
      icon: icons.award,
      color: 'default',
    },
    {
      id: 2,
      title: 'Progress Tracking',
      description: 'Real-time analytics and detailed performance metrics',
      icon: icons.target,
      color: 'secondary',
    },
    {
      id: 3,
      title: '24/7 Support',
      description: 'Always available to answer your questions and concerns',
      icon: icons.settings,
      color: 'accent',
    },
    {
      id: 4,
      title: 'Custom Plans',
      description: 'Personalized training programs tailored to your goals',
      icon: icons.briefcase,
      color: 'default',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.15,
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
    <Section background="white" id="features" className="py-16 md:py-24">
      <Container>
        <motion.div
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
            Why Choose Us
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Industry-leading features designed for your success
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {features.map((feature) => (
            <motion.div
              key={feature.id}
              variants={itemVariants}
              className="text-center"
            >
              <motion.div
                className="flex justify-center mb-6"
                whileHover={{ y: -4, rotate: 5 }}
                transition={{ duration: 0.22 }}
              >
                <Icon size="lg" variant={feature.color} animated={false}>
                  {feature.icon}
                </Icon>
              </motion.div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-neutral-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  );
};
