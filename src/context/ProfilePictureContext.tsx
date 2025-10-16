import React, {
  createContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';

interface ProfilePictureContextType {
  profilePictureUrl: string | null;
  updateProfilePicture: (url: string | null) => void;
  clearProfilePicture: () => void;
}

export const ProfilePictureContext = createContext<
  ProfilePictureContextType | undefined
>(undefined);

const ProfilePictureProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(
    null
  );

  const updateProfilePicture = useCallback((url: string | null) => {
    setProfilePictureUrl(url);
  }, []);

  const clearProfilePicture = useCallback(() => {
    setProfilePictureUrl(null);
  }, []);

  const contextValue: ProfilePictureContextType = useMemo(
    () => ({
      profilePictureUrl,
      updateProfilePicture,
      clearProfilePicture,
    }),
    [profilePictureUrl, updateProfilePicture, clearProfilePicture]
  );

  return (
    <ProfilePictureContext.Provider value={contextValue}>
      {children}
    </ProfilePictureContext.Provider>
  );
};

// Export provider separately
export { ProfilePictureProvider };

// Custom hook to use the profile picture context
const useProfilePicture = (): ProfilePictureContextType => {
  const context = React.useContext(ProfilePictureContext);
  if (!context) {
    throw new Error(
      'useProfilePicture must be used within ProfilePictureProvider'
    );
  }
  return context;
};

// Export hook separately
export { useProfilePicture };
