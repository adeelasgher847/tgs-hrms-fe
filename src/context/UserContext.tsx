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
import { validateToken, setupTokenValidation, clearAuthData } from '../utils/authValidation';

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
    clearAuthData();
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

        // Load from localStorage for immediate display first
        const userData = localStorage.getItem('user');
        if (userData) {
          try {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
          } catch (parseError) {
            console.warn('Failed to parse user data from localStorage:', parseError);
          }
        }

        // Try to refresh from API to ensure consistency
        try {
          const apiUser = await profileApiService.getUserProfile();
          setUser(apiUser);
          localStorage.setItem('user', JSON.stringify(apiUser));
        } catch (error: any) {
          // If API call fails, check if it's due to user deletion
          if (error?.response?.status === 401 || error?.response?.status === 403) {
            console.warn('User profile fetch failed - user may have been deleted');
            clearAuthData();
            setUser(null);
          } else {
            // For other errors (network, server issues), keep the localStorage data
            console.warn('Failed to refresh user profile, keeping localStorage data:', error?.message);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        clearAuthData();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();

    // Set up periodic token validation (every 10 minutes - less aggressive)
    const cleanup = setupTokenValidation(10);
    return cleanup;
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
