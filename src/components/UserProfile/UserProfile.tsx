import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Avatar,
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
import axiosInstance from '../../api/axiosInstance';
import EmployeeProfileView from '../Employee/EmployeeProfileView';

interface UserProfileData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  tenant: string;
  created_at: string;
}

const UserProfile = () => {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosInstance.get('/profile/me');
        setProfile(res.data);
      } catch {
        setError('Profile not found or failed to load.');
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const getInitials = (first: string, last: string): string => {
    return `${first?.charAt(0) || ''}${last?.charAt(0) || ''}`.toUpperCase();
  };

  const getRoleColor = (
    role: string
  ):
    | 'default'
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning' => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'error';
      case 'manager':
        return 'warning';
      case 'user':
        return 'primary';
      case 'employee':
        return 'success';
      default:
        return 'default';
    }
  };

  // Determine if the user is an employee based on role
  const isEmployee = profile?.role?.toLowerCase() === 'employee';

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
      value: profile.role,
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
            {/* Header Section with Avatar */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mr: 1,
                  fontSize: '2rem',
                  bgcolor: 'primary.main',
                }}
              >
                {getInitials(profile.first_name, profile.last_name)}
              </Avatar>
              <Box>
                <Typography
                  variant='h5'
                  component='h2'
                  sx={{ fontWeight: 600, mb: 1 }}
                >
                  {profile.first_name} {profile.last_name}
                </Typography>
                <Chip
                  label={profile.role}
                  color={getRoleColor(profile.role)}
                  size='small'
                  sx={{ fontWeight: 500 }}
                />
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
        {isEmployee && (
          <Box mt={4}>
            <EmployeeProfileView />
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default UserProfile;
