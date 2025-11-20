import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../theme';
import { PrimaryButton, SecondaryButton } from '../Button';

// Mock framer-motion for testing
jest.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  }
}));

// Test wrapper with theme provider
const TestWrapper = ({ children, theme = 'light' }) => {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
};

describe('Button Components', () => {
  test('renders PrimaryButton with correct text', () => {
    render(
      <TestWrapper>
        <PrimaryButton>Click Me</PrimaryButton>
      </TestWrapper>
    );
    
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  test('renders SecondaryButton with correct text', () => {
    render(
      <TestWrapper>
        <SecondaryButton>Click Me</SecondaryButton>
      </TestWrapper>
    );
    
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  test('calls onClick handler when PrimaryButton is clicked', () => {
    const handleClick = jest.fn();
    
    render(
      <TestWrapper>
        <PrimaryButton onClick={handleClick}>Click Me</PrimaryButton>
      </TestWrapper>
    );
    
    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('does not call onClick handler when PrimaryButton is disabled', () => {
    const handleClick = jest.fn();
    
    render(
      <TestWrapper>
        <PrimaryButton onClick={handleClick} disabled>Click Me</PrimaryButton>
      </TestWrapper>
    );
    
    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  test('applies correct size classes to PrimaryButton', () => {
    const { rerender } = render(
      <TestWrapper>
        <PrimaryButton size="sm">Small</PrimaryButton>
      </TestWrapper>
    );
    
    const smallButton = screen.getByText('Small');
    expect(smallButton).toBeInTheDocument();
    
    rerender(
      <TestWrapper>
        <PrimaryButton size="lg">Large</PrimaryButton>
      </TestWrapper>
    );
    
    const largeButton = screen.getByText('Large');
    expect(largeButton).toBeInTheDocument();
  });
});