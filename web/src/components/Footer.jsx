import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Container, Icon, icons } from './primitives';

/**
 * Footer Component - With contact, social links, shortcuts, and working hours
 */
export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Quick Links',
      links: [
        { label: 'Home', href: '#' },
        { label: 'Services', href: '#services' },
        { label: 'Features', href: '#features' },
        { label: 'Team', href: '#team' },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Help Center', href: '#' },
        { label: 'Contact Us', href: '#contact' },
        { label: 'FAQ', href: '#' },
        { label: 'Privacy Policy', href: '#' },
      ],
    },
    {
      title: 'Follow Us',
      links: [
        { label: 'Facebook', href: '#' },
        { label: 'Twitter', href: '#' },
        { label: 'Instagram', href: '#' },
        { label: 'LinkedIn', href: '#' },
      ],
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
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <footer className="bg-neutral-900 text-neutral-300" id="contact">
      <Container size="full">
        {/* Main Footer Content */}
        <div className="px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {/* Logo & About */}
            <motion.div variants={itemVariants} className="md:col-span-1">
              <a href="#" className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent mb-4 inline-block">
                SwimAcademy
              </a>
              <p className="text-sm leading-relaxed">
                Transforming swimmers into champions through expert coaching and
                personalized training programs.
              </p>
              <div className="flex gap-4 mt-6">
                {['facebook', 'twitter', 'instagram'].map((social) => (
                  <motion.a
                    key={social}
                    href="#"
                    className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-primary-600 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {social === 'facebook' && '📘'}
                    {social === 'twitter' && '𝕏'}
                    {social === 'instagram' && '📷'}
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* Link Sections */}
            {footerSections.map((section) => (
              <motion.div key={section.title} variants={itemVariants}>
                <h4 className="font-bold text-white mb-4">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <motion.a
                        href={link.href}
                        className="text-sm hover:text-primary-400 transition-colors"
                        whileHover={{ x: 4 }}
                      >
                        {link.label}
                      </motion.a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>

          {/* Contact & Hours */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-8 py-12 border-t border-neutral-800"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <motion.div variants={itemVariants}>
              <h4 className="font-bold text-white mb-4">Contact Info</h4>
              <div className="space-y-3">
                <p className="text-sm">
                  <span className="font-semibold">Email:</span> info@swimacademy.com
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Phone:</span> +1 (555) 123-4567
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Address:</span> 123 Pool Lane, Water City, WC 12345
                </p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h4 className="font-bold text-white mb-4">Working Hours</h4>
              <div className="space-y-2 text-sm">
                <p>Monday - Friday: 6:00 AM - 9:00 PM</p>
                <p>Saturday: 7:00 AM - 8:00 PM</p>
                <p>Sunday: 8:00 AM - 6:00 PM</p>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          className="border-t border-neutral-800 px-4 sm:px-6 lg:px-8 py-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm">
              © {currentYear} SwimAcademy Pro. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="hover:text-primary-400 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-primary-400 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-primary-400 transition-colors">
                Cookie Settings
              </a>
            </div>
          </div>
        </motion.div>
      </Container>
    </footer>
  );
};
