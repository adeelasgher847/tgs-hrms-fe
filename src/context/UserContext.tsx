import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { profileApiService, type UserProfile } from '../api/profileApi';
import type { UserContextType } from '../types/context';

export const UserContext = createContext<UserContextType | undefined>(
  undefined
);

export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Update user state and localStorage
  const updateUser = useCallback((updatedUser: UserProfile) => {
    setUser(updatedUser);
    setLoading(false); // Ensure loading state is false after update
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
    } catch {
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
          // No user data in localStorage
        }

        // Always refresh from API to ensure consistency
        try {
          const apiUser = await profileApiService.getUserProfile();
          setUser(apiUser);
          localStorage.setItem('user', JSON.stringify(apiUser));
        } catch {
          /* Error handled silently */
        }
      } catch {
        // Handle error silently
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const contextValue: UserContextType = useMemo(
    () => ({
      user,
      loading,
      updateUser,
      refreshUser,
      clearUser,
    }),
    [user, loading, updateUser, refreshUser, clearUser]
  );

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};
