import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  TextField,
  IconButton,
} from '@mui/material';
import {
  Person,
  Email,
  AdminPanelSettings,
  Phone,
  Business,
  CalendarToday,
  Edit,
  BusinessCenter,
  Save,
  Cancel,
  Close,
  CloudUpload,
  CameraAlt,
} from '@mui/icons-material';
// UserProfile type available if needed
import { useUser } from '../../hooks/useUser';
import type { UserProfile } from '../../api/profileApi';
import { profileApiService } from '../../api/profileApi';
import companyApi, { type CompanyDetails } from '../../api/companyApi';
import { useCompany } from '../../context/CompanyContext';
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


const UserProfileComponent = React.memo(() => {
  const { user: profile, loading, refreshUser, updateUser } = useUser();
  const { updateProfilePicture } = useProfilePicture();
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(null);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    company_name: '',
    domain: '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const theme = useTheme();
  const darkMode = useIsDarkMode();
  const isModalOpenRef = useRef(false);

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

  // Cleanup blob URLs on component unmount
  useEffect(() => {
    return () => {
      if (companyLogo && companyLogo.startsWith('blob:')) {
        URL.revokeObjectURL(companyLogo);
      }
    };
  }, [companyLogo]);

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

  const handleShowCompanyDetails = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (companyLoading || logoLoading || isModalOpenRef.current) {
      return;
    }
    
    // Only allow if user is logged in and has profile
    if (!profile || !profile.tenant) {
      setError('Please login to view company details');
      return;
    }
    
    isModalOpenRef.current = true;
    setCompanyLoading(true);
    setLogoLoading(true);
    setCompanyModalOpen(true);
    setIsEditing(false);
    try {
      const details = await companyApi.getCompanyDetails();
      setCompanyDetails(details);
      setEditFormData({
        company_name: details.company_name,
        domain: details.domain,
      });
      
      // Fetch company logo using tenant ID from company details
      try {
        const logoUrl = await companyApi.getCompanyLogo(details.tenant_id);
        setCompanyLogo(logoUrl);
      } catch (logoErr) {
        console.error('Failed to fetch company logo:', logoErr);
        setCompanyLogo(null);
      }
    } catch (err: any) {
      setError('Failed to fetch company details');
      console.error('Company details error:', err);
    } finally {
      setCompanyLoading(false);
      setLogoLoading(false);
      isModalOpenRef.current = false;
    }
  }, [companyLoading, logoLoading, profile]);

  const handleCloseCompanyModal = useCallback(() => {
    setCompanyModalOpen(false);
    setCompanyDetails(null);
    // Clean up blob URL to prevent memory leaks
    if (companyLogo && companyLogo.startsWith('blob:')) {
      URL.revokeObjectURL(companyLogo);
    }
    setCompanyLogo(null);
    setIsEditing(false);
    isModalOpenRef.current = false;
  }, [companyLogo]);

  const handleEditCompany = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    if (companyDetails) {
      setEditFormData({
        company_name: companyDetails.company_name,
        domain: companyDetails.domain,
      });
    }
  }, [companyDetails]);

  const handleSaveCompany = useCallback(async () => {
    if (!companyDetails) return;
    
    setEditLoading(true);
    try {
      // Update company details via API
      const updatedDetails = await companyApi.updateCompanyDetails({
        company_name: editFormData.company_name,
        domain: editFormData.domain,
      });
      
      // Update local state with response from backend
      setCompanyDetails(updatedDetails);
      setIsEditing(false);
      
      // Close the modal
      setCompanyModalOpen(false);
      
      // Trigger sidebar logo update after save
      window.dispatchEvent(new CustomEvent('logoUpdated'));
    } catch (err: any) {
      setError('Failed to update company details');
      console.error('Update company error:', err);
    } finally {
      setEditLoading(false);
    }
  }, [companyDetails, editFormData]);

  const handleFormChange = useCallback((field: string, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleLogoUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Prevent multiple simultaneous uploads
    if (logoUploading) {
      return;
    }

    // Only allow if user is logged in and has company details
    if (!profile || !companyDetails?.tenant_id) {
      setError('Please login to upload company logo');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB');
      return;
    }

    setLogoUploading(true);
    try {
      // Upload the logo using POST API
      await companyApi.uploadCompanyLogo(file);
      
      // Immediately fetch the updated logo using GET API with tenant ID
      if (companyDetails?.tenant_id) {
        // Clean up old blob URL if it exists
        if (companyLogo && companyLogo.startsWith('blob:')) {
          URL.revokeObjectURL(companyLogo);
        }
        
        const logoUrl = await companyApi.getCompanyLogo(companyDetails.tenant_id);
        setCompanyLogo(logoUrl);
      }
      
      setError(null);
    } catch (err: any) {
      setError('Failed to upload logo');
      console.error('Logo upload error:', err);
    } finally {
      setLogoUploading(false);
    }
  }, [companyDetails?.tenant_id, logoUploading, companyLogo, profile]);

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
          <Typography variant='h4' component='h1' sx={{ fontWeight: 600, color: darkMode ? '#8f8f8f' : theme.palette.text.primary }}>
            User Profile
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {!userIsEmployee && (
              <Button
                onClick={handleShowCompanyDetails}
                variant='outlined'
                startIcon={<BusinessCenter />}
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
                Company Details
              </Button>
            )}
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
                  sx={{ mb: 0.5, color: darkMode ? '#8f8f8f' : theme.palette.text.secondary }}
                >
                  {profile.email}
                </Typography>
                {profile.phone && (
                  <Typography variant='body2' sx={{ color: darkMode ? '#8f8f8f' : theme.palette.text.secondary }}>
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
                      sx={{ mb: 0.5, fontWeight: 500, color: darkMode ? '#8f8f8f' : theme.palette.text.secondary }}
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

      {/* Company Details Modal */}
      <Dialog
        open={companyModalOpen}
        onClose={handleCloseCompanyModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: darkMode ? '#1e1e1e' : '#ffffff',
          },
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          color: darkMode ? '#ffffff' : '#000000',
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessCenter />
            Company Details
          </Box>
          {!isEditing && (
            <IconButton
              onClick={handleCloseCompanyModal}
              size="small"
              sx={{ 
                color: theme.palette.text.secondary,
                '&:hover': {
                  color: theme.palette.text.primary,
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <Close />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {companyLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : companyDetails ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Company Logo */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2, mt: 2 }}>
                {logoLoading || logoUploading ? (
                  <CircularProgress size={60} />
                ) : (
                  <Box 
                    sx={{ 
                      position: 'relative',
                      cursor: isEditing ? 'pointer' : 'default',
                      '&:hover .camera-overlay': {
                        opacity: isEditing ? 1 : 0,
                      },
                      '&:hover .avatar': {
                        filter: isEditing ? 'brightness(0.7)' : 'none',
                      },
                    }}
                  >
                  <Avatar
                      className="avatar"
                    sx={{ 
                        width: 150, 
                      height: 150,
                      border: `2px solid ${theme.palette.divider}`,
                      fontSize: '48px',
                      fontWeight: 'bold',
                      backgroundColor: theme.palette.primary.main,
                      color: 'white',
                        transition: 'filter 0.3s ease',
                    }}
                  >
                      {companyLogo ? (
                    <img
                          src={companyLogo}
                      alt="Company Logo"
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                      ) : (
                        companyDetails.company_name.charAt(0).toUpperCase()
                      )}
                  </Avatar>
                    
                    {/* Camera Overlay */}
                    <Box
                      className="camera-overlay"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        borderRadius: '50%',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                        cursor: 'pointer',
                      }}
                    >
                      <CameraAlt sx={{ color: 'white', fontSize: 40 }} />
                    </Box>
                    
                    {/* Hidden File Input */}
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="logo-upload"
                      type="file"
                      onChange={handleLogoUpload}
                      disabled={logoUploading || !isEditing}
                    />
                    {isEditing && (
                      <label 
                        htmlFor="logo-upload" 
                        style={{ 
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          cursor: 'pointer',
                          borderRadius: '50%',
                        }}
                      />
                    )}
                </Box>
              )}
                
                {/* Upload Status */}
                {logoUploading && (
                  <Typography variant="caption" sx={{ mt: 1, color: theme.palette.text.secondary }}>
                    Uploading logo...
                  </Typography>
                )}
              </Box>
              
              {/* Company Name */}
              <Box>
                <Typography variant="subtitle2" sx={{ 
                  color: theme.palette.text.secondary,
                  mb: 0.5,
                  fontWeight: 500
                }}>
                  Company Name
                </Typography>
                {isEditing ? (
                  <TextField
                    value={editFormData.company_name}
                    onChange={(e) => handleFormChange('company_name', e.target.value)}
                    fullWidth
                    variant="outlined"
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: darkMode ? '#2d2d2d' : '#ffffff',
                      },
                    }}
                  />
                ) : (
                  <Typography variant="body1" sx={{ 
                    color: darkMode ? '#ffffff' : '#000000',
                    fontWeight: 500
                  }}>
                    {companyDetails.company_name}
                  </Typography>
                )}
              </Box>

              {/* Domain */}
              <Box>
                <Typography variant="subtitle2" sx={{ 
                  color: theme.palette.text.secondary,
                  mb: 0.5,
                  fontWeight: 500
                }}>
                  Domain
                </Typography>
                {isEditing ? (
                  <TextField
                    value={editFormData.domain}
                    onChange={(e) => handleFormChange('domain', e.target.value)}
                    fullWidth
                    variant="outlined"
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: darkMode ? '#2d2d2d' : '#ffffff',
                      },
                    }}
                  />
                ) : (
                  <Typography variant="body1" sx={{ 
                    color: darkMode ? '#ffffff' : '#000000',
                    fontWeight: 500
                  }}>
                    {companyDetails.domain}
                  </Typography>
                )}
              </Box>

            </Box>
          ) : (
            <Typography sx={{ textAlign: 'center', py: 2 }}>
              No company details available
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1, justifyContent: 'space-between' }}>
          <Box>
            {isEditing && (
              <Button 
                onClick={handleCancelEdit}
                variant="outlined"
                startIcon={<Cancel />}
                disabled={editLoading}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                }}
              >
                Cancel
              </Button>
            )}
          </Box>
          <Box>
            {isEditing ? (
              <Button 
                onClick={handleSaveCompany}
                variant="contained"
                startIcon={editLoading ? <CircularProgress size={16} /> : <Save />}
                disabled={editLoading}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                }}
              >
                {editLoading ? 'Saving...' : 'Save'}
              </Button>
            ) : companyDetails ? (
              <Button
                onClick={handleEditCompany}
                variant="outlined"
                startIcon={<Edit />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  px: 2,
                  py: 0.5,
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                  '&:hover': {
                    borderColor: theme.palette.primary.dark,
                    backgroundColor: theme.palette.primary.light + '20',
                  },
                }}
              >
                Edit
              </Button>
            ) : null}
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

export default UserProfileComponent;
