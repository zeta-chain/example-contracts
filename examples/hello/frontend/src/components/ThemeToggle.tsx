import './ThemeToggle.css';

import React from 'react';

import { useTheme } from '../hooks/useTheme';
import { IconThemeMoon, IconThemeSun } from './icons';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        // Moon icon for dark mode
        <IconThemeMoon />
      ) : (
        // Sun icon for light mode
        <IconThemeSun />
      )}
    </button>
  );
};
