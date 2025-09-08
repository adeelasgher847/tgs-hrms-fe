import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { profileApiService, type UserProfile } from '../api/profileApi';

interface UserContextType {
  user: UserProfile | null;
  loading: boolean;
  updateUser: (updatedUser: UserProfile) => void;
  refreshUser: () => Promise<void>;
  clearUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Update user state and localStorage
  const updateUser = useCallback((updatedUser: UserProfile) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  // Refresh user data from API
  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        return;
      }

      setLoading(true);
      const profileData = await profileApiService.getUserProfile();
      setUser(profileData);
      localStorage.setItem('user', JSON.stringify(profileData));
    } catch (_error) {
      // Don't clear user data on API error, keep localStorage data
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear user data (for logout)
  const clearUser = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
  }, []);

  // Load user data from localStorage on mount and refresh from API
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Check if user is authenticated
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setLoading(false);
          return;
        }

        // Load from localStorage for immediate display
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        } else {
        }

        // Always refresh from API to ensure consistency
        try {
          const apiUser = await profileApiService.getUserProfile();
          setUser(apiUser);
          localStorage.setItem('user', JSON.stringify(apiUser));
        } catch (_apiError) { /* Error handled silently */ }
      } catch (_error) {
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const contextValue: UserContextType = {
    user,
    loading,
    updateUser,
    refreshUser,
    clearUser,
  };

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};
