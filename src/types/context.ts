import type { UserProfile } from '../api/profileApi';

export interface UserContextType {
  user: UserProfile | null;
  loading: boolean;
  updateUser: (updatedUser: UserProfile) => void;
  refreshUser: () => Promise<void>;
  clearUser: () => void;
}

export interface LanguageContextType {
  language: 'en' | 'ar';
  setLanguage: (lang: 'en' | 'ar') => void;
}
