import React from 'react'
import ReactDOM from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import App from './App.jsx'
import './index.css'

// Initialize theme on app load
const initializeTheme = () => {
  // Check for saved theme in localStorage
  const savedTheme = localStorage.getItem('theme');
  
  // If no saved theme, check system preference
  const systemPrefersDark = window.matchMedia && 
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Determine initial theme
  const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
  
  // Apply theme to document
  if (initialTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  
  // Save to localStorage if not already saved
  if (!savedTheme) {
    localStorage.setItem('theme', initialTheme);
  }
};

// Initialize theme before rendering app
initializeTheme();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)