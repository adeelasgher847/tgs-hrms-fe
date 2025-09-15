import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Divider,
  Chip,
  Paper,
  CircularProgress,
  Alert,
  Button,
  useTheme,
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
import {
  getRoleName,
  getRoleColor,
  isEmployee,
  isManager,
} from '../../utils/roleUtils';
import ProfilePictureUpload from '../common/ProfilePictureUpload';
import EmployeeProfileView from '../Employee/EmployeeProfileView';
import EditProfileModal from './EditProfileModal';

const UserProfileComponent = React.memo(() => {
  const { user: profile, loading, refreshUser, updateUser } = useUser();
  const { updateProfilePicture } = useProfilePicture();
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    // Only fetch if we don't have user data and we're not already loading
    if (!profile && !loading) {
      const fetchProfile = async () => {
        try {
          await refreshUser();
        } catch {
          setError('Profile not found or failed to load.');
        }
      };
      fetchProfile();
    }
  }, [profile, loading, refreshUser]);

  // Ensure tenant is populated on first render by forcing a /profile/me refresh
  useEffect(() => {
    if (profile && !profile.tenant && !loading) {
      refreshUser().catch(() => {
        // ignore; fallback remains
      });
    }
  }, [profile?.tenant, loading, refreshUser]); // Only depend on tenant, not entire profile

  // Initialize profile picture state when user data loads
  useEffect(() => {
    if (profile?.profile_pic) {
      // ✅ Construct the full API URL for the profile picture
      const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const profilePicUrl = `${API_BASE_URL}/users/${profile.id}/profile-picture`;
      updateProfilePicture(profilePicUrl);
    }
  }, [profile?.profile_pic, profile?.id, updateProfilePicture]);

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
    async (updatedUser: UserProfile) => {
      // First update with the returned data for immediate UI update
      updateUser(updatedUser);
      setEditModalOpen(false);

      // Then refresh from API to ensure we have the latest data from backend
      try {
        const freshUserData = await profileApiService.getUserProfile();
        updateUser(freshUserData);

        // Update profile picture context if profile picture changed
        if (freshUserData.profile_pic) {
          updateProfilePicture(freshUserData.profile_pic);
        }
      } catch (error) {
        console.error('Failed to refresh profile data:', error);
        // Keep the updated data even if refresh fails
      }
    },
    [updateUser, updateProfilePicture]
  );

  // Determine if the user should see the employee profile view (managers included)
  const userIsEmployee = isEmployee(profile?.role) || isManager(profile?.role);

  if (loading)
    return (
      <Box display='flex' justifyContent='center' mt={6}>
        <CircularProgress />
      </Box>
    );
  if (error) return <Alert severity='error'>{error}</Alert>;
  if (!profile) return null;

  const profileItems = useMemo(
    () => [
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
        value: new Date(profile.created_at).toLocaleDateString(),
      },
    ],
    [
      profile.first_name,
      profile.last_name,
      profile.email,
      profile.phone,
      profile.role,
      profile.tenant,
      profile.created_at,
    ]
  );

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
          <Typography variant='h4' component='h1' sx={{ fontWeight: 600 }}>
            User Profile
          </Typography>
          <Button
            onClick={handleEditProfile}
            variant='outlined'
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
          </Button>
        </Box>
        <Card
          elevation={1}
          sx={{ borderRadius: 3, border: 'none', bgcolor: 'transparent' }}
        >
          <CardContent sx={{ p: 0 }}>
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
                  color='text.secondary'
                  sx={{ mb: 0.5 }}
                >
                  {profile.email}
                </Typography>
                {profile.phone && (
                  <Typography variant='body2' color='text.secondary'>
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
              {profileItems.map((item, _index) => (
                <Box
                  key={_index}
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
                      color='text.secondary'
                      sx={{ mb: 0.5, fontWeight: 500 }}
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
          </CardContent>
        </Card>
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
