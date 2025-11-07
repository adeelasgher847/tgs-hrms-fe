import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  useTheme,
  Avatar,
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
import { isManager, isEmployee } from '../../utils/roleUtils';
import companyApi from '../../api/companyApi';
import BusinessIcon from '@mui/icons-material/Business';
import LanguageIcon from '@mui/icons-material/Language';
import {
  Edit,
  Save,
  Close,
  CameraAlt,
  BusinessCenter,
} from '@mui/icons-material';

const SettingsPage: React.FC = () => {
  const theme = useTheme();
  const darkMode = useIsDarkMode();
  const { user } = useUser();
  const {
    companyDetails: contextCompanyDetails,
    companyName,
    companyLogo,
    refreshCompanyDetails,
    loading: contextLoading,
  } = useCompany();

  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [editFormData, setEditFormData] = useState({
    company_name: '',
    domain: '',
  });
  const [modalCompanyLogo, setModalCompanyLogo] = useState<string | null>(null);
  const [modalLogoLoading, setModalLogoLoading] = useState(false);
  const [logoUploading] = useState(false);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [, setError] = useState<string | null>(null);

  const isModalOpenRef = useRef(false);

  const handleEditCompanyDetails = useCallback(async () => {
    if (!user) return;

    setCompanyModalOpen(true);
    setIsEditing(true);
    isModalOpenRef.current = true;

    try {
      setModalLogoLoading(true);

      if (contextCompanyDetails) {
        setEditFormData({
          company_name: contextCompanyDetails.company_name,
          domain: contextCompanyDetails.domain,
        });
        setModalCompanyLogo(contextCompanyDetails.logo_url || companyLogo);
      }
    } catch (err) {
      console.error('Failed to initialize modal:', err);
      setError('Failed to load company details');
    } finally {
      setModalLogoLoading(false);
      isModalOpenRef.current = false;
    }
  }, [contextCompanyDetails, companyLogo, user]);

  const handleCloseCompanyModal = useCallback(() => {
    setCompanyModalOpen(false);
    setIsEditing(false);
    setModalCompanyLogo(null);
  }, []);

  const handleFormChange = useCallback((field: string, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleSaveCompany = useCallback(async () => {
    if (!contextCompanyDetails) return;

    setEditLoading(true);
    try {
      // If a new logo was selected, upload it first
      if (selectedLogoFile) {
        await companyApi.uploadCompanyLogo(selectedLogoFile);
      }

      // Then update the company details
      await companyApi.updateCompanyDetails({
        company_name: editFormData.company_name,
        domain: editFormData.domain,
      });

      await refreshCompanyDetails();

      setIsEditing(false);
      setCompanyModalOpen(false);
      setSelectedLogoFile(null); // clear after saving
      setError(null);
    } catch (err) {
      console.error('Failed to update company details:', err);
      setError('Failed to update company details');
    } finally {
      setEditLoading(false);
    }
  }, [
    editFormData,
    selectedLogoFile,
    contextCompanyDetails,
    refreshCompanyDetails,
  ]);

  const handleLogoUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('File size should be less than 5MB');
        return;
      }

      // Preview only
      const previewUrl = URL.createObjectURL(file);
      setModalCompanyLogo(previewUrl);
      setSelectedLogoFile(file);
    },
    []
  );

  // const _handleDeleteLogo = useCallback(async () => {
  //   if (!contextCompanyDetails?.tenant_id) return;

  //   try {
  //     setLogoUploading(true);
  //     await companyApi.deleteCompanyLogo(contextCompanyDetails.tenant_id);
  //     setModalCompanyLogo(null);
  //     await refreshCompanyDetails();
  //   } catch (err) {
  //     console.error('Failed to delete company logo:', err);
  //     setError('Failed to delete company logo');
  //   } finally {
  //     setLogoUploading(false);
  //   }
  // }, [contextCompanyDetails?.tenant_id, refreshCompanyDetails]);

  useEffect(() => {
    if (companyLogo && companyModalOpen && !logoUploading) {
      setModalCompanyLogo(companyLogo);
    }
  }, [companyLogo, companyModalOpen, logoUploading]);

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography
          variant='h4'
          sx={{ fontWeight: 600, color: darkMode ? '#fff' : '#000', mb: 1 }}
        >
          Company Information
        </Typography>
        {!isManager(user?.role) && !isEmployee(user?.role) && (
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
        )}
      </Box>

      {/* Company Info Card */}
      <Paper
        sx={{
          p: 4,
          backgroundColor: darkMode ? '#1a1a1a' : '#fff',
          color: darkMode ? '#fff' : '#000',
          boxShadow: 'none',
        }}
      >
        {contextLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {/* Logo */}
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
                }}
              >
                {companyLogo ? (
                  <Box
                    component='img'
                    src={companyLogo}
                    alt='Company Logo'
                    loading='lazy'
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <BusinessIcon
                    sx={{ fontSize: 70, color: darkMode ? '#666' : '#999' }}
                  />
                )}
              </Box>
            </Box>

            {/* Company Name */}
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
                <BusinessIcon
                  sx={{ fontSize: 28, color: darkMode ? '#666' : '#999' }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant='body2'
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
                  variant='h6'
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

            {/* Company Domain */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                <LanguageIcon
                  sx={{ fontSize: 28, color: darkMode ? '#666' : '#999' }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant='body2'
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
                  variant='body1'
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
        maxWidth='sm'
        fullWidth
        PaperProps={{
          sx: { borderRadius: 1, bgcolor: darkMode ? '#1e1e1e' : '#fff' },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: darkMode ? '#fff' : '#000',
            borderBottom: `1px solid ${theme.palette.divider}`,
            borderRadius: 0,
            pb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessCenter /> Company Details
          </Box>
          {!isEditing && (
            <IconButton
              onClick={handleCloseCompanyModal}
              size='small'
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
          {modalLogoLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : contextCompanyDetails ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Logo upload/edit */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  mb: 2,
                  mt: 2,
                }}
              >
                {logoUploading ? (
                  <CircularProgress size={60} />
                ) : (
                  <Box
                    sx={{
                      position: 'relative',
                      cursor: isEditing ? 'pointer' : 'default',
                      '&:hover .camera-overlay': { opacity: isEditing ? 1 : 0 },
                      '&:hover .delete-icon': {
                        opacity: isEditing && modalCompanyLogo ? 1 : 0,
                      },
                      '&:hover .avatar': {
                        filter: isEditing ? 'brightness(0.7)' : 'none',
                      },
                    }}
                  >
                    <Avatar
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
                          alt='Company Logo'
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        contextCompanyDetails.company_name
                          .charAt(0)
                          .toUpperCase()
                      )}
                    </Avatar>
                    <Box
                      className='camera-overlay'
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        borderRadius: '50%',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                        cursor: 'pointer',
                      }}
                    >
                      <CameraAlt sx={{ color: 'white', fontSize: 40 }} />
                    </Box>

                    {/* {isEditing && modalCompanyLogo && (
                      <IconButton
                        onClick={handleDeleteLogo}
                        className='delete-icon'
                        sx={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          color: '#ff6b6b',
                          opacity: 0,
                          transition: 'opacity 0.3s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            color: '#ff1744',
                          },
                        }}
                        size='small'
                      >
                        <DeleteIcon fontSize='small' />
                      </IconButton>
                    )} */}

                    <input
                      accept='image/*'
                      style={{ display: 'none' }}
                      id='logo-upload'
                      type='file'
                      onChange={handleLogoUpload}
                      disabled={logoUploading || !isEditing}
                    />
                    {isEditing && (
                      <label
                        htmlFor='logo-upload'
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
                {logoUploading && (
                  <Typography
                    variant='caption'
                    sx={{ mt: 1, color: theme.palette.text.secondary }}
                  >
                    Uploading logo...
                  </Typography>
                )}
              </Box>

              {/* Company Name */}
              <Box>
                <Typography
                  variant='subtitle2'
                  sx={{
                    color: theme.palette.text.secondary,
                    mb: 0.5,
                    fontWeight: 500,
                  }}
                >
                  Company Name
                </Typography>
                {isEditing ? (
                  <TextField
                    value={editFormData.company_name}
                    onChange={e =>
                      handleFormChange('company_name', e.target.value)
                    }
                    fullWidth
                    size='small'
                    variant='outlined'
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: darkMode ? '#2d2d2d' : '#fff',
                      },
                    }}
                  />
                ) : (
                  <Typography
                    variant='body1'
                    sx={{ color: darkMode ? '#fff' : '#000', fontWeight: 500 }}
                  >
                    {contextCompanyDetails.company_name}
                  </Typography>
                )}
              </Box>

              {/* Domain */}
              <Box>
                <Typography
                  variant='subtitle2'
                  sx={{
                    color: theme.palette.text.secondary,
                    mb: 0.5,
                    fontWeight: 500,
                  }}
                >
                  Domain
                </Typography>
                {isEditing ? (
                  <TextField
                    value={editFormData.domain}
                    onChange={e => handleFormChange('domain', e.target.value)}
                    fullWidth
                    size='small'
                    variant='outlined'
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: darkMode ? '#2d2d2d' : '#fff',
                      },
                    }}
                  />
                ) : (
                  <Typography
                    variant='body1'
                    sx={{ color: darkMode ? '#fff' : '#000', fontWeight: 500 }}
                  >
                    {contextCompanyDetails.domain}
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
        <DialogActions sx={{ p: 3, pt: 1, justifyContent: 'flex-end' }}>
          <Box>
            <Button
              onClick={handleSaveCompany}
              variant='contained'
              startIcon={
                editLoading ? <CircularProgress size={16} /> : <Save />
              }
              disabled={editLoading}
              sx={{ textTransform: 'none', fontWeight: 500 }}
            >
              {editLoading ? 'Updating...' : 'Update'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettingsPage;
