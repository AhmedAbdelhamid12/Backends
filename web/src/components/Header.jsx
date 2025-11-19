import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Button, Container } from './primitives';

/**
 * Header Component - Sticky navigation with mobile hamburger menu
 */
export const Header = ({ onContactClick }) => {
  const [isSticky, setIsSticky] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Services', href: '#services' },
    { label: 'Features', href: '#features' },
    { label: 'Team', href: '#team' },
    { label: 'Contact', href: '#contact', action: onContactClick },
  ];

  const dropdownVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.22 },
    },
    exit: { opacity: 0, y: -10, transition: { duration: 0.15 } },
  };

  const mobileMenuVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.42,
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
  };

  const mobileItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <motion.header
      className={clsx(
        'w-full z-40 transition-all duration-300',
        isSticky
          ? 'sticky top-0 bg-white shadow-md'
          : 'relative bg-white border-b border-neutral-200'
      )}
      initial={false}
    >
      <Container className="flex items-center justify-between py-4 md:py-5">
        {/* Logo */}
        <motion.div
          className="flex-shrink-0"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <a
            href="#"
            className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent"
          >
            SwimAcademy
          </a>
        </motion.div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <motion.div
              key={link.label}
              className="relative group"
              onMouseEnter={() => setActiveDropdown(link.label)}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <a
                href={link.href}
                onClick={(e) => {
                  if (link.action) {
                    e.preventDefault();
                    link.action();
                  }
                }}
                className={clsx(
                  'text-sm font-medium transition-colors duration-300',
                  link.label === 'Contact'
                    ? 'text-primary-600 hover:text-primary-700'
                    : 'text-neutral-700 hover:text-primary-600'
                )}
              >
                {link.label}
              </a>

              {/* Underline animation */}
              <motion.div
                className="absolute bottom-0 left-0 h-0.5 bg-primary-500 rounded-full"
                initial={{ width: 0 }}
                whileHover={{ width: '100%' }}
                transition={{ duration: 0.22 }}
              />
            </motion.div>
          ))}
        </nav>

        {/* Desktop CTA Button */}
        <div className="hidden lg:block">
          <Button
            variant="primary"
            size="md"
            onClick={onContactClick}
            className="shadow-lg"
          >
            Get Started
          </Button>
        </div>

        {/* Mobile Menu Toggle */}
        <motion.button
          className="lg:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          whileTap={{ scale: 0.95 }}
          aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-6 h-0.5 bg-neutral-900 rounded-full"
              initial={false}
              animate={{
                rotate: mobileMenuOpen ? [0, 45][i === 0 ? 1 : 0] : 0,
                y: mobileMenuOpen
                  ? i === 0
                    ? 8
                    : i === 2
                    ? -8
                    : 0
                  : 0,
                opacity: i === 1 && mobileMenuOpen ? 0 : 1,
              }}
              transition={{ duration: 0.22 }}
            />
          ))}
        </motion.button>
      </Container>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="lg:hidden bg-white border-t border-neutral-200"
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <Container className="py-4 flex flex-col gap-4">
              {navLinks.map((link) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => {
                    if (link.action) {
                      e.preventDefault();
                      link.action();
                    }
                    setMobileMenuOpen(false);
                  }}
                  className="text-neutral-700 font-medium py-2 hover:text-primary-600 transition-colors"
                  variants={mobileItemVariants}
                >
                  {link.label}
                </motion.a>
              ))}

              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  onContactClick();
                  setMobileMenuOpen(false);
                }}
                className="w-full mt-2"
              >
                Get Started
              </Button>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};
