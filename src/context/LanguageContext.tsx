import React, { createContext, useState, type ReactNode } from 'react';
import type { LanguageContextType } from '../types/context';

// eslint-disable-next-line react-refresh/only-export-components
export const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'en' | 'ar'>('en');

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Export provider separately
export { LanguageProvider };
