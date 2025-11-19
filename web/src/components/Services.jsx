import React from 'react';
import { motion } from 'framer-motion';
import { Section, Container, Card, Icon, icons } from './primitives';

/**
 * Services Grid Component - 6 service cards with icon animations and hover lift
 */
export const Services = () => {
  const services = [
    {
      id: 1,
      title: 'Personal Training',
      description: 'One-on-one coaching with certified professionals to maximize your potential',
      icon: icons.briefcase,
      color: 'default',
    },
    {
      id: 2,
      title: 'Group Classes',
      description: 'Structured training sessions in supportive group environments',
      icon: icons.users,
      color: 'secondary',
    },
    {
      id: 3,
      title: 'Competition Prep',
      description: 'Specialized programs designed to prepare you for competitions',
      icon: icons.target,
      color: 'accent',
    },
    {
      id: 4,
      title: 'Video Analysis',
      description: 'Advanced video recording and analysis to refine your technique',
      icon: icons.search,
      color: 'default',
    },
    {
      id: 5,
      title: 'Nutrition Coaching',
      description: 'Personalized nutrition plans to support your training goals',
      icon: icons.award,
      color: 'secondary',
    },
    {
      id: 6,
      title: 'Recovery Programs',
      description: 'Comprehensive recovery and injury prevention strategies',
      icon: icons.heart,
      color: 'accent',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 40, opacity: 0 },
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
    <Section background="light" id="services" className="py-16 md:py-24">
      <Container>
        {/* Section Header */}
        <motion.div
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <motion.div
            className="inline-flex items-center gap-2 mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            viewport={{ once: true }}
          >
            <div className="w-2 h-2 rounded-full bg-primary-500" />
            <span className="text-sm font-semibold text-primary-600 uppercase tracking-wide">
              Our Services
            </span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
            Everything You Need to Excel
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Comprehensive training solutions designed to help you achieve your swimming goals
          </p>
        </motion.div>

        {/* Services Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {services.map((service) => (
            <motion.div key={service.id} variants={itemVariants}>
              <Card
                className="h-full p-8 flex flex-col gap-6"
                animated={false}
                hoverable={true}
              >
                {/* Icon */}
                <div className="flex-shrink-0">
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: 10 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.22 }}
                  >
                    <Icon
                      size="lg"
                      variant={service.color}
                      animated={false}
                    >
                      {service.icon}
                    </Icon>
                  </motion.div>
                </div>

                {/* Content */}
                <div className="flex-grow">
                  <h3 className="text-xl font-bold text-neutral-900 mb-3">
                    {service.title}
                  </h3>
                  <p className="text-neutral-600 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                {/* Arrow indicator */}
                <motion.div
                  className="text-primary-600"
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.22 }}
                >
                  <span className="text-sm font-semibold inline-flex items-center gap-2">
                    Learn more →
                  </span>
                </motion.div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  );
};
