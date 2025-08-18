import { useContext } from 'react';
import { ThemeContext } from './context';

// Custom hook to use theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Hook to get current theme mode
export const useThemeMode = (): 'light' | 'dark' => {
  const { mode } = useTheme();
  return mode;
};

// Hook to check if dark mode is active
export const useIsDarkMode = (): boolean => {
  const { mode } = useTheme();
  return mode === 'dark';
};
