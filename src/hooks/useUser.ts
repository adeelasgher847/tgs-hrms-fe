import { useContext } from 'react';
import { UserContext } from '../context/UserContext';
import type { UserContextType } from '../types/context';

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }

  return context;
};
