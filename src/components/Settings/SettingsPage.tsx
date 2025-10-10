import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  useTheme,
  Avatar,
  Divider,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
} from '@mui/material';
import { useIsDarkMode } from '../../theme';
import { useCompany } from '../../context/CompanyContext';
import { useUser } from '../../hooks/useUser';
import companyApi, { type CompanyDetails } from '../../api/companyApi';
import BusinessIcon from '@mui/icons-material/Business';
import LanguageIcon from '@mui/icons-material/Language';
import { Edit, Save, Cancel, Close, CameraAlt, BusinessCenter } from '@mui/icons-material';

const SettingsPage: React.FC = () => {
  const theme = useTheme();
  const darkMode = useIsDarkMode();
  const { user } = useUser();
  const { companyDetails: contextCompanyDetails, companyName, loading, refreshCompanyDetails } = useCompany();
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(false);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(null);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [modalCompanyLogo, setModalCompanyLogo] = useState<string | null>(null);
  const [modalLogoLoading, setModalLogoLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    company_name: '',
    domain: '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isModalOpenRef = useRef(false);

  // Fetch company logo using same API as sidebar
  useEffect(() => {
    const fetchCompanyLogo = async () => {
      if (!user) return;
      
      setLogoLoading(true);
      try {
        const details = await companyApi.getCompanyDetails();
        const logoUrl = await companyApi.getCompanyLogo(details.tenant_id);
        setCompanyLogo(logoUrl);
      } catch (err) {
        console.error('Failed to fetch company logo for settings:', err);
        setCompanyLogo(null);
      } finally {
        setLogoLoading(false);
      }
    };

    if (user) {
      fetchCompanyLogo();
    }
  }, [user]);

  // Listen for logo updates from other components
  useEffect(() => {
    const handleLogoUpdate = async () => {
      if (!user) return;
      
      setLogoLoading(true);
      try {
        const details = await companyApi.getCompanyDetails();
        const logoUrl = await companyApi.getCompanyLogo(details.tenant_id);
        setCompanyLogo(logoUrl);
      } catch (err) {
        console.error('Failed to fetch updated company logo:', err);
        setCompanyLogo(null);
      } finally {
        setLogoLoading(false);
      }
    };

    window.addEventListener('logoUpdated', handleLogoUpdate);
    
    return () => {
      window.removeEventListener('logoUpdated', handleLogoUpdate);
    };
  }, [user]);

  // Cleanup blob URLs on component unmount
  useEffect(() => {
    return () => {
      if (companyLogo && companyLogo.startsWith('blob:')) {
        URL.revokeObjectURL(companyLogo);
      }
      if (modalCompanyLogo && modalCompanyLogo.startsWith('blob:')) {
        URL.revokeObjectURL(modalCompanyLogo);
      }
    };
  }, [companyLogo, modalCompanyLogo]);

  const handleEditCompanyDetails = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (companyLoading || isModalOpenRef.current) {
      return;
    }
    
    // Only allow if user is logged in and has profile
    if (!user || !user.tenant) {
      setError('Please login to view company details');
      return;
    }
    
    isModalOpenRef.current = true;
    setCompanyLoading(true);
    setModalLogoLoading(true);
    setCompanyModalOpen(true);
    setIsEditing(false);
    try {
      const details = await companyApi.getCompanyDetails();
      setCompanyDetails(details);
      setEditFormData({
        company_name: details.company_name,
        domain: details.domain,
      });
      
      // Fetch company logo using tenant ID from company details for modal
      try {
        const logoUrl = await companyApi.getCompanyLogo(details.tenant_id);
        setModalCompanyLogo(logoUrl);
      } catch (logoErr) {
        console.error('Failed to fetch company logo:', logoErr);
        setModalCompanyLogo(null);
      }
    } catch (err: any) {
      setError('Failed to fetch company details');
    } finally {
      setCompanyLoading(false);
      setModalLogoLoading(false);
      isModalOpenRef.current = false;
    }
  }, [companyLoading, user]);

  const handleCloseCompanyModal = useCallback(() => {
    setCompanyModalOpen(false);
    setCompanyDetails(null);
    // Clean up blob URL to prevent memory leaks
    if (modalCompanyLogo && modalCompanyLogo.startsWith('blob:')) {
      URL.revokeObjectURL(modalCompanyLogo);
    }
    setModalCompanyLogo(null);
    setIsEditing(false);
    isModalOpenRef.current = false;
  }, [modalCompanyLogo]);

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
      
      // Refresh context company details to update main page display
      await refreshCompanyDetails();
      
      // Refresh page data
      if (user) {
        const logoUrl = await companyApi.getCompanyLogo(updatedDetails.tenant_id);
        setCompanyLogo(logoUrl);
      }
    } catch (err: any) {
      setError('Failed to update company details');
    } finally {
      setEditLoading(false);
    }
  }, [companyDetails, editFormData, user, refreshCompanyDetails]);

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
    if (!user || !companyDetails?.tenant_id) {
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
        if (modalCompanyLogo && modalCompanyLogo.startsWith('blob:')) {
          URL.revokeObjectURL(modalCompanyLogo);
        }
        
        const logoUrl = await companyApi.getCompanyLogo(companyDetails.tenant_id);
        setModalCompanyLogo(logoUrl);
        
        // Also update main page logo
        setCompanyLogo(logoUrl);
      }
      
      // Trigger sidebar logo update
      window.dispatchEvent(new CustomEvent('logoUpdated'));
      
      // Refresh context company details to update main page logo
      await refreshCompanyDetails();
      
      setError(null);
    } catch (err: any) {
      setError('Failed to upload logo');
      console.error('Logo upload error:', err);
    } finally {
      setLogoUploading(false);
    }
  }, [companyDetails?.tenant_id, logoUploading, modalCompanyLogo, user, refreshCompanyDetails]);

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 600,
            color: darkMode ? '#fff' : '#000',
            mb: 1,
          }}
        >
         Company Information
        </Typography>
        <Button
          onClick={handleEditCompanyDetails}
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
          Edit Company Details
        </Button>
      </Box>
      <Paper
        sx={{
          p: 4,
          backgroundColor: darkMode ? '#1a1a1a' : '#fff',
          color: darkMode ? '#fff' : '#000',
          boxShadow: 'none', 
        }}
      >
        
        {loading || logoLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {/* Company Logo Section */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                mb: 4,
                pb: 4,
                borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`,
              }}
            >
              <Box
                sx={{
                  width: 150,
                  height: 150,
                  borderRadius: '50%',
                  backgroundColor: darkMode ? '#2a2a2a' : '#f5f5f5',
                  border: `3px solid ${darkMode ? '#333' : '#e0e0e0'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
                }}
              >
                {companyLogo ? (
                  <Box
                    component="img"
                    src={companyLogo}
                    alt="Company Logo"
                    loading="lazy"
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <BusinessIcon sx={{ fontSize: 70, color: darkMode ? '#666' : '#999' }} />
                )}
              </Box>
            </Box>

            {/* Company Name Section */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 3,
                pb: 3,
                borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`,
              }}
            >
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  backgroundColor: darkMode ? '#2a2a2a' : '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 3,
                }}
              >
                <BusinessIcon sx={{ fontSize: 28, color: darkMode ? '#666' : '#999' }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: darkMode ? '#8f8f8f' : '#666',
                    mb: 0.5,
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    fontWeight: 500,
                  }}
                >
                  Company Name
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: darkMode ? '#fff' : '#000',
                    fontSize: '18px',
                    fontWeight: 600,
                  }}
                >
                  {companyName}
                </Typography>
              </Box>
            </Box>

            {/* Company Domain Section */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  backgroundColor: darkMode ? '#2a2a2a' : '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 3,
                }}
              >
                <LanguageIcon sx={{ fontSize: 28, color: darkMode ? '#666' : '#999' }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: darkMode ? '#8f8f8f' : '#666',
                    mb: 0.5,
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    fontWeight: 500,
                  }}
                >
                  Company Domain
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: darkMode ? '#fff' : '#000',
                    fontSize: '16px',
                    fontWeight: 500,
                  }}
                >
                  {contextCompanyDetails?.domain || 'Not specified'}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Company Details Modal */}
      <Dialog
        open={companyModalOpen}
        onClose={handleCloseCompanyModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 1,
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
          borderRadius:0,
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
                {modalLogoLoading || logoUploading ? (
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
                      {modalCompanyLogo ? (
                        <img
                          src={modalCompanyLogo}
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
};

export default SettingsPage;
