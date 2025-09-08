import { useEffect, useState } from 'react';
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
} from '@mui/material';
import {
  Person,
  Email,
  AdminPanelSettings,
  Phone,
  Business,
  CalendarToday,
} from '@mui/icons-material';
// UserProfile type available if needed
import { useUser } from '../../hooks/useUser';
import { getRoleName, getRoleColor, isEmployee } from '../../utils/roleUtils';
import ProfilePictureUpload from '../common/ProfilePictureUpload';
import EmployeeProfileView from '../Employee/EmployeeProfileView';

const UserProfileComponent = () => {
  const { user: profile, loading, refreshUser } = useUser();
  const [error, setError] = useState<string | null>(null);

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

  const handleProfileUpdate = () => {
    // The UserContext will handle the update automatically
    // This function is kept for compatibility with ProfilePictureUpload
  };

  // Determine if the user is an employee based on role
  const userIsEmployee = isEmployee(profile?.role);

  if (loading)
    return (
      <Box display='flex' justifyContent='center' mt={6}>
        <CircularProgress />
      </Box>
    );
  if (error) return <Alert severity='error'>{error}</Alert>;
  if (!profile) return null;

  const profileItems = [
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
  ];

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
        <Typography
          variant='h4'
          component='h1'
          gutterBottom
          sx={{ mb: 4, fontWeight: 600 }}
        >
          User Profile
        </Typography>
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
    </Box>
  );
};

export default UserProfileComponent;
