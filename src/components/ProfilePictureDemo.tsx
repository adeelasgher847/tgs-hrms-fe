import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Paper,
  Divider,
} from '@mui/material';
import { useUser } from '../context/UserContext';
import ProfilePictureUpload from './common/ProfilePictureUpload';
import UserAvatar from './common/UserAvatar';
import { testProfilePictureFeature } from '../utils/testProfilePicture';

const ProfilePictureDemo: React.FC = () => {
  const { user } = useUser();

  const handleTestFeature = async () => {
    console.log('🧪 Running profile picture feature test...');
    await testProfilePictureFeature();
  };

  if (!user) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant='h6' color='text.secondary'>
          Please log in to test the profile picture feature
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant='h4'
        component='h1'
        gutterBottom
        sx={{ mb: 4, fontWeight: 600 }}
      >
        Profile Picture Upload Feature Demo
      </Typography>

      <Grid container spacing={4}>
        {/* Main Profile Picture Upload */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant='h6' gutterBottom sx={{ fontWeight: 600 }}>
                Profile Picture Upload
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
                Upload, update, or remove your profile picture. The changes will
                be reflected across the entire application.
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <ProfilePictureUpload
                  user={user}
                  onProfileUpdate={() => {}}
                  size={120}
                  showUploadButton={true}
                  showRemoveButton={true}
                  clickable={true}
                  showEditOverlay={true}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Avatar Display Examples */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant='h6' gutterBottom sx={{ fontWeight: 600 }}>
                Avatar Display Examples
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
                Different sizes and contexts where your profile picture appears:
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant='body2' sx={{ minWidth: 80 }}>
                    Small (32px):
                  </Typography>
                  <UserAvatar user={user} size={32} clickable={false} />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant='body2' sx={{ minWidth: 80 }}>
                    Medium (45px):
                  </Typography>
                  <UserAvatar user={user} size={45} clickable={false} />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant='body2' sx={{ minWidth: 80 }}>
                    Large (80px):
                  </Typography>
                  <UserAvatar user={user} size={80} clickable={false} />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant='body2' sx={{ minWidth: 80 }}>
                    Extra Large (120px):
                  </Typography>
                  <UserAvatar user={user} size={120} clickable={false} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Current User Info */}
        <Grid item xs={12}>
          <Paper elevation={1} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant='h6' gutterBottom sx={{ fontWeight: 600 }}>
              Current User Information
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant='body2' color='text.secondary'>
                  Name:
                </Typography>
                <Typography variant='body1' sx={{ fontWeight: 500 }}>
                  {user.first_name} {user.last_name}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant='body2' color='text.secondary'>
                  Email:
                </Typography>
                <Typography variant='body1' sx={{ fontWeight: 500 }}>
                  {user.email}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant='body2' color='text.secondary'>
                  Role:
                </Typography>
                <Typography variant='body1' sx={{ fontWeight: 500 }}>
                  {user.role}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant='body2' color='text.secondary'>
                  Has Profile Picture:
                </Typography>
                <Typography variant='body1' sx={{ fontWeight: 500 }}>
                  {user.profile_pic ? '✅ Yes' : '❌ No'}
                </Typography>
              </Grid>

              {user.profile_pic && (
                <Grid item xs={12}>
                  <Typography variant='body2' color='text.secondary'>
                    Profile Picture URL:
                  </Typography>
                  <Typography
                    variant='body2'
                    sx={{
                      fontFamily: 'monospace',
                      backgroundColor: '#f5f5f5',
                      p: 1,
                      borderRadius: 1,
                      wordBreak: 'break-all',
                    }}
                  >
                    {user.profile_pic}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>

        {/* Test Feature */}
        <Grid item xs={12}>
          <Card
            elevation={2}
            sx={{ borderRadius: 3, backgroundColor: '#f8f9fa' }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant='h6' gutterBottom sx={{ fontWeight: 600 }}>
                Test Feature
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
                Run comprehensive tests to verify the profile picture feature is
                working correctly.
              </Typography>

              <Button
                variant='contained'
                onClick={handleTestFeature}
                sx={{
                  backgroundColor: '#484c7f',
                  '&:hover': { backgroundColor: '#3a3f5f' },
                }}
              >
                Run Profile Picture Tests
              </Button>

              <Typography
                variant='caption'
                display='block'
                sx={{ mt: 2, color: 'text.secondary' }}
              >
                Check the browser console for detailed test results
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfilePictureDemo;
