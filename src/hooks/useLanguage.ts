import { useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';
import type { LanguageContextType } from '../types/context';

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
