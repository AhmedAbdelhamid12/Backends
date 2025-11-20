import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Star, Heart, BookOpen, Users, Award, TrendingUp } from 'lucide-react';
import { SectionWrapper } from '../ui/SectionWrapper';
import { Card } from '../ui/Card';
import { PrimaryButton, SecondaryButton } from '../ui/Button';
import { IconBadge } from '../ui/IconBadge';
import { StatisticCounter } from '../ui/StatisticCounter';
import { Hero } from '../ui/Hero';
import { useTheme } from '../ui/theme';

const DesignSystemDemoPage = () => {
  const { theme, toggleTheme } = useTheme();
  const [buttonLoading, setButtonLoading] = useState(false);
  
  const handleButtonClick = () => {
    setButtonLoading(true);
    setTimeout(() => {
      setButtonLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Hero minHeight="min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Design System Demo
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Showcase of all Academy Multi M design system components with responsive layouts and dark/light mode support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <PrimaryButton 
              icon={theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              onClick={toggleTheme}
            >
              Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode
            </PrimaryButton>
            <SecondaryButton onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>
              Scroll to Components
            </SecondaryButton>
          </div>
        </motion.div>
      </Hero>

      {/* Buttons Section */}
      <SectionWrapper className="py-16">
        <motion.h2 
          className="text-3xl font-bold text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Buttons
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <h3 className="text-xl font-semibold mb-4">Primary Buttons</h3>
            <div className="flex flex-wrap gap-4">
              <PrimaryButton size="sm">Small</PrimaryButton>
              <PrimaryButton>Medium</PrimaryButton>
              <PrimaryButton size="lg">Large</PrimaryButton>
              <PrimaryButton disabled>Disabled</PrimaryButton>
              <PrimaryButton 
                icon={<Star size={16} />} 
                onClick={handleButtonClick}
                disabled={buttonLoading}
              >
                {buttonLoading ? 'Loading...' : 'With Icon'}
              </PrimaryButton>
            </div>
          </Card>
          
          <Card>
            <h3 className="text-xl font-semibold mb-4">Secondary Buttons</h3>
            <div className="flex flex-wrap gap-4">
              <SecondaryButton size="sm">Small</SecondaryButton>
              <SecondaryButton>Medium</SecondaryButton>
              <SecondaryButton size="lg">Large</SecondaryButton>
              <SecondaryButton disabled>Disabled</SecondaryButton>
              <SecondaryButton icon={<Heart size={16} />}>
                With Icon
              </SecondaryButton>
            </div>
          </Card>
        </div>
      </SectionWrapper>

      {/* Icon Badges Section */}
      <SectionWrapper className="py-16 bg-gray-50 dark:bg-gray-900/50">
        <motion.h2 
          className="text-3xl font-bold text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Icon Badges
        </motion.h2>
        
        <div className="flex flex-wrap justify-center gap-8">
          <IconBadge icon={<Star size={24} />} size="sm" variant="primary" />
          <IconBadge icon={<BookOpen size={24} />} size="md" variant="secondary" />
          <IconBadge icon={<Users size={24} />} size="lg" variant="accent" />
          <IconBadge icon={<Award size={24} />} size="md" variant="success" />
          <IconBadge icon={<TrendingUp size={24} />} size="sm" variant="primary" />
        </div>
      </SectionWrapper>

      {/* Statistics Section */}
      <SectionWrapper className="py-16">
        <motion.h2 
          className="text-3xl font-bold text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Statistics Counter
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <StatisticCounter value={1250} label="Total Users" prefix="+" />
          <StatisticCounter value={487} label="Active Enrollments" />
          <StatisticCounter value={45230} label="Revenue This Month" prefix="$" />
          <StatisticCounter value={12} label="Monthly Growth" suffix="%" />
        </div>
      </SectionWrapper>

      {/* Cards Section */}
      <SectionWrapper className="py-16 bg-gray-50 dark:bg-gray-900/50">
        <motion.h2 
          className="text-3xl font-bold text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Cards
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card hover={true}>
            <div className="flex items-center mb-4">
              <IconBadge icon={<BookOpen size={20} />} variant="primary" className="mr-3" />
              <h3 className="text-xl font-semibold">Course Management</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Create, edit, and manage courses with our intuitive interface. Track student progress and engagement.
            </p>
            <PrimaryButton size="sm">Learn More</PrimaryButton>
          </Card>
          
          <Card hover={true}>
            <div className="flex items-center mb-4">
              <IconBadge icon={<Users size={20} />} variant="accent" className="mr-3" />
              <h3 className="text-xl font-semibold">Student Portal</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Students can access their courses, track progress, and communicate with instructors.
            </p>
            <SecondaryButton size="sm">View Portal</SecondaryButton>
          </Card>
          
          <Card hover={true}>
            <div className="flex items-center mb-4">
              <IconBadge icon={<Award size={20} />} variant="success" className="mr-3" />
              <h3 className="text-xl font-semibold">Achievements</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Recognize student accomplishments with badges and certificates for completed courses.
            </p>
            <PrimaryButton size="sm">View Achievements</PrimaryButton>
          </Card>
        </div>
      </SectionWrapper>

      {/* Responsive Demo */}
      <SectionWrapper className="py-16">
        <motion.h2 
          className="text-3xl font-bold text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Responsive Design
        </motion.h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Card key={item} className="h-32 flex items-center justify-center">
              <span className="text-lg font-medium">Card {item}</span>
            </Card>
          ))}
        </div>
      </SectionWrapper>
    </div>
  );
};

export default DesignSystemDemoPage;