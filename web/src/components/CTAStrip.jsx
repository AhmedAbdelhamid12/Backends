import React from 'react';
import { motion } from 'framer-motion';
import { Section, Container, Button } from './primitives';

/**
 * CTA Strip Component - Call-to-action with button and secondary link
 */
export const CTAStrip = ({ onContactClick }) => {
  return (
    <Section background="white" className="py-12 md:py-16">
      <Container>
        <motion.div
          className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-8 md:p-12 lg:p-16 text-center text-white"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true, amount: 0.5 }}
          whileHover={{ scale: 1.01 }}
        >
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            Ready to Transform Your Swimming?
          </motion.h2>

          <motion.p
            className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Join hundreds of athletes who have already achieved their goals. Start your
            journey today with personalized coaching and world-class facilities.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <Button
              variant="secondary"
              size="lg"
              onClick={onContactClick}
              className="bg-white text-primary-600 hover:bg-primary-50"
            >
              Get Started Free
            </Button>
            <motion.a
              href="#"
              className="text-white font-semibold hover:text-primary-100 transition-colors inline-flex items-center gap-2"
              whileHover={{ x: 4 }}
              transition={{ duration: 0.22 }}
            >
              Learn about our plans →
            </motion.a>
          </motion.div>
        </motion.div>
      </Container>
    </Section>
  );
};
