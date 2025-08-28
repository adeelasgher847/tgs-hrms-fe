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
  console.log('🔧 UserProvider: Initializing...');
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
        console.log('🔐 No access token found, skipping API refresh');
        return;
      }

      setLoading(true);
      const profileData = await profileApiService.getUserProfile();
      setUser(profileData);
      localStorage.setItem('user', JSON.stringify(profileData));
      console.log('✅ User data refreshed from API');
    } catch (error) {
      console.error('Error refreshing user data:', error);
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
          console.log('🔐 No access token found, user not authenticated');
          setLoading(false);
          return;
        }

        // Load from localStorage for immediate display
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          console.log('✅ User data loaded from localStorage');
        } else {
          console.log('⚠️ No user data in localStorage');
        }

        // Always refresh from API to ensure consistency
        try {
          const apiUser = await profileApiService.getUserProfile();
          setUser(apiUser);
          localStorage.setItem('user', JSON.stringify(apiUser));
          console.log('✅ User data refreshed from API');
        } catch (apiError) {
          console.warn(
            '⚠️ Failed to refresh user data from API, using localStorage data'
          );
        }
      } catch (error) {
        console.error('Error loading user data from localStorage:', error);
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

  console.log('🔧 UserProvider: Rendering with context value:', {
    user: !!user,
    loading,
    hasUpdateUser: !!updateUser,
    hasRefreshUser: !!refreshUser,
    hasClearUser: !!clearUser,
  });

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  console.log('🔍 useUser: Hook called');
  const context = useContext(UserContext);
  console.log(
    '🔍 useUser: Context value:',
    context ? '✅ Available' : '❌ Not available'
  );

  if (!context) {
    console.error('❌ useUser: Context not available - throwing error');
    throw new Error('useUser must be used within UserProvider');
  }

  console.log('✅ useUser: Returning context successfully');
  return context;
};
