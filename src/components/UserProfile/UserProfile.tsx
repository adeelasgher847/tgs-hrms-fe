import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from 'react';
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
import { useIsDarkMode } from '../../theme';
import { formatDate } from '../../utils/dateUtils';
import { useLanguage } from '../../hooks/useLanguage';

const USER_PROFILE_STRINGS = {
  en: {
    userProfileTitle: 'User Profile',
    editProfile: 'Edit profile',
    profileNotFound: 'Profile not found or failed to load.',
    firstName: 'First Name',
    lastName: 'Last Name',
    emailAddress: 'Email Address',
    phone: 'Phone',
    role: 'Role',
    tenant: 'Tenant',
    joined: 'Joined',
  },
  ar: {
    userProfileTitle: 'ملف المستخدم',
    editProfile: 'تعديل الملف',
    profileNotFound: 'الملف غير موجود أو فشل التحميل.',
    firstName: 'الاسم الأول',
    lastName: 'اسم العائلة',
    emailAddress: 'البريد الإلكتروني',
    phone: 'الهاتف',
    role: 'الدور',
    tenant: 'المستأجر',
    joined: 'انضم',
  },
} as const;

const UserProfileComponent = React.memo(() => {
  const { user: profile, loading, updateUser } = useUser();
  const { updateProfilePicture } = useProfilePicture();
  const { language } = useLanguage();
  const L = useMemo(
    () =>
      USER_PROFILE_STRINGS[language as 'en' | 'ar'] || USER_PROFILE_STRINGS.en,
    [language]
  );
  // keep setError available for future error handling (may be used elsewhere)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);
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
        const API_BASE_URL =
          import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
        const profilePicUrl = updatedUser.profile_pic.startsWith('http')
          ? updatedUser.profile_pic
          : `${API_BASE_URL}/users/${updatedUser.id}/profile-picture`;
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
        label: L.firstName,
        value: profile.first_name,
      },
      {
        icon: <Person sx={{ color: 'primary.main' }} />,
        label: L.lastName,
        value: profile.last_name,
      },
      {
        icon: <Email sx={{ color: 'primary.main' }} />,
        label: L.emailAddress,
        value: profile.email,
      },
      {
        icon: <Phone sx={{ color: 'primary.main' }} />,
        label: L.phone,
        value: profile.phone,
      },
      {
        icon: <AdminPanelSettings sx={{ color: 'primary.main' }} />,
        label: L.role,
        value: getRoleName(profile.role),
      },
      {
        icon: <Business sx={{ color: 'primary.main' }} />,
        label: L.tenant,
        value: profile.tenant,
      },
      {
        icon: <CalendarToday sx={{ color: 'primary.main' }} />,
        label: L.joined,
        value: formatDate(profile.created_at),
      },
    ];
  }, [profile, L]);

  // Only show loading if we truly don't have profile data and it's still loading
  // If we have profile data, show it even if loading is true (might be fetching tenant in background)
  if (loading && !profile) {
    return (
      <Box display='flex' justifyContent='center' mt={6}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) return <Alert severity='error'>{error}</Alert>;
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
            flexDirection: language === 'ar' ? 'row-reverse' : 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Typography
            variant='h4'
            component='h1'
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            sx={{
              fontWeight: 600,
              color: darkMode ? '#8f8f8f' : theme.palette.text.primary,
              textAlign: language === 'ar' ? 'right' : 'left',
            }}
          >
            {L.userProfileTitle}
          </Typography>
          <Box dir='ltr'>
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
              {L.editProfile}
            </Button>
          </Box>
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
                  dir='ltr'
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
                  dir='ltr'
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
                    dir='ltr'
                    sx={{
                      color: darkMode
                        ? '#8f8f8f'
                        : theme.palette.text.secondary,
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
