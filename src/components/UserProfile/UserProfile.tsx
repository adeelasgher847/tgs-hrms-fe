import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import {
  Typography,
  Box,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  useTheme,
  Paper,
} from '@mui/material';
import {
  Person,
  Email,
  AdminPanelSettings,
  Phone,
  Business,
  CalendarToday,
  Edit,
} from '@mui/icons-material';
// UserProfile type available if needed
import { useUser } from '../../hooks/useUser';
import type { UserProfile } from '../../api/profileApi';
import { profileApiService } from '../../api/profileApi';
import { useProfilePicture } from '../../context/ProfilePictureContext';
import { env } from '../../config/env';
import {
  getRoleName,
  getRoleColor,
  isEmployee,
  isManager,
} from '../../utils/roleUtils';
import ProfilePictureUpload from '../Common/ProfilePictureUpload';
import EmployeeProfileView from '../Employee/EmployeeProfileView';
import EditProfileModal from './EditProfileModal';
import { useIsDarkMode } from '../../theme';
import { formatDate } from '../../utils/dateUtils';
import AppButton from '../Common/AppButton';
import AppCard from '../Common/AppCard';

const UserProfileComponent = React.memo(() => {
  const { user: profile, loading, updateUser } = useUser();
  const { updateProfilePicture } = useProfilePicture();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const theme = useTheme();
  const darkMode = useIsDarkMode();
  const tenantFetchedRef = useRef(false);

  // Silently fetch tenant if missing (without causing loading state)
  useEffect(() => {
    // Only fetch tenant if profile exists, tenant is missing, and we haven't fetched yet
    if (profile && !profile.tenant && !loading && !tenantFetchedRef.current) {
      tenantFetchedRef.current = true;
      // Fetch directly from API and update state without triggering loading
      profileApiService
        .getUserProfile()
        .then(updatedProfile => {
          // Update user state directly without going through refreshUser (which sets loading)
          updateUser(updatedProfile);
        })
        .catch(() => {
          // Silently fail - keep existing data
          tenantFetchedRef.current = false; // Allow retry if needed
        });
    } else if (profile?.tenant) {
      // Tenant exists, mark as fetched
      tenantFetchedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.tenant, loading]); // Only run when tenant or loading changes

  // Profile picture is already handled by Navbar component, no need to update here
  // This prevents unnecessary re-renders when navigating to profile page

  const handleProfileUpdate = useCallback(() => {
    // The UserContext will handle the update automatically
    // This function is kept for compatibility with ProfilePictureUpload
  }, []);

  const handleEditProfile = useCallback(() => {
    setEditModalOpen(true);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setEditModalOpen(false);
  }, []);

  const handleProfileUpdated = useCallback(
    (updatedUser: UserProfile) => {
      // Merge with existing profile to avoid wiping fields and reduce re-renders
      updateUser({ ...(profile || {}), ...updatedUser });

      // Close modal
      setEditModalOpen(false);

      // Normalize profile picture URL and update picture context
      if (updatedUser.profile_pic) {
        const profilePicUrl = updatedUser.profile_pic.startsWith('http')
          ? updatedUser.profile_pic
          : `${env.apiBaseUrl}/users/${updatedUser.id}/profile-picture`;
        updateProfilePicture(profilePicUrl);
      }
    },
    [profile, updateUser, updateProfilePicture]
  );

  // Determine if the user should see the employee profile view (managers included)
  const userIsEmployee = isEmployee(profile?.role) || isManager(profile?.role);

  const profileItems = useMemo(() => {
    if (!profile) return [];
    return [
      {
        icon: <Person sx={{ color: 'primary.main' }} />,
        label: 'First Name',
        value: profile.first_name,
      },
      {
        icon: <Person sx={{ color: 'primary.main' }} />,
        label: 'Last Name',
        value: profile.last_name,
      },
      {
        icon: <Email sx={{ color: 'primary.main' }} />,
        label: 'Email Address',
        value: profile.email,
      },
      {
        icon: <Phone sx={{ color: 'primary.main' }} />,
        label: 'Phone',
        value: profile.phone,
      },
      {
        icon: <AdminPanelSettings sx={{ color: 'primary.main' }} />,
        label: 'Role',
        value: getRoleName(profile.role),
      },
      {
        icon: <Business sx={{ color: 'primary.main' }} />,
        label: 'Tenant',
        value: profile.tenant,
      },
      {
        icon: <CalendarToday sx={{ color: 'primary.main' }} />,
        label: 'Joined',
        value: formatDate(profile.created_at),
      },
    ];
  }, [profile]);

  // Only show loading if we truly don't have profile data and it's still loading
  // If we have profile data, show it even if loading is true (might be fetching tenant in background)
  if (loading && !profile) {
    return (
      <Box display='flex' justifyContent='center' mt={6}>
        <CircularProgress />
      </Box>
    );
  }
  if (!profile) return null;

  return (
    <Box sx={{ py: 2 }}>
      <Paper
        elevation={0}
        sx={{
          bgcolor: 'transparent',
          alignItems: 'flex-start',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Typography
            variant='h4'
            component='h1'
            sx={{
              fontWeight: 600,
              color: darkMode ? '#8f8f8f' : theme.palette.text.primary,
            }}
          >
            User Profile
          </Typography>
          <AppButton
            onClick={handleEditProfile}
            variant='outlined'
            variantType='secondary'
            startIcon={<Edit />}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              px: 2,
              py: 1,
              borderColor: theme.palette.divider,
              color: theme.palette.text.primary,
              '&:hover': {
                borderColor: theme.palette.primary.main,
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            Edit profile
          </AppButton>
        </Box>
        <AppCard
          elevation={1}
          sx={{ borderRadius: 3, border: 'none', bgcolor: 'transparent', p: 0 }}
        >
          {/* Header Section with Profile Picture Upload */}
          <Box
            sx={{ display: 'flex', alignItems: 'flex-start', mb: 4, gap: 3 }}
          >
            <ProfilePictureUpload
              user={profile}
              onProfileUpdate={handleProfileUpdate}
              size={100}
              showUploadButton={true}
              showRemoveButton={true}
              clickable={true}
            />
            <Box sx={{ flex: 1 }}>
              <Typography
                variant='h5'
                component='h2'
                sx={{ fontWeight: 600, mb: 1 }}
              >
                {profile.first_name} {profile.last_name}
              </Typography>
              <Chip
                label={getRoleName(profile.role)}
                color={getRoleColor(profile.role)}
                size='small'
                sx={{ fontWeight: 500, mb: 1 }}
              />
              <Typography
                variant='body2'
                sx={{
                  mb: 0.5,
                  color: darkMode ? '#8f8f8f' : theme.palette.text.secondary,
                }}
              >
                {profile.email}
              </Typography>
              {profile.phone && (
                <Typography
                  variant='body2'
                  sx={{
                    color: darkMode ? '#8f8f8f' : theme.palette.text.secondary,
                  }}
                >
                  {profile.phone}
                </Typography>
              )}
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />
          {/* Profile Info */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            {profileItems.map((item, index) => (
              <Box
                key={index}
                sx={{
                  flex: { xs: '1 1 100%', sm: '1 1 48%' },
                  p: 2,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'flex-start',
                }}
              >
                <Box sx={{ mr: 2, mt: 0.5 }}>{item.icon}</Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant='body2'
                    sx={{
                      mb: 0.5,
                      fontWeight: 500,
                      color: darkMode
                        ? '#8f8f8f'
                        : theme.palette.text.secondary,
                    }}
                  >
                    {item.label}
                  </Typography>
                  <Typography
                    variant='body1'
                    sx={{ fontWeight: 400, wordBreak: 'break-word' }}
                  >
                    {item.value}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </AppCard>
        {/* Show EmployeeProfileView if user is an employee */}
        {userIsEmployee && (
          <Box mt={4}>
            <EmployeeProfileView />
          </Box>
        )}
      </Paper>

      {/* Edit Profile Modal */}
      {profile && (
        <EditProfileModal
          open={editModalOpen}
          onClose={handleCloseEditModal}
          user={profile}
          onProfileUpdated={handleProfileUpdated}
        />
      )}
    </Box>
  );
});

export default UserProfileComponent;
