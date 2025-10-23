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
import companyApi from '../../api/companyApi';
import {
  Edit,
  Save,
  Cancel,
  Close,
  CameraAlt,
  BusinessCenter,
  Business,
  Language,
//   Delete as DeleteIcon,
} from '@mui/icons-material';

const SettingsPage: React.FC = () => {
  const theme = useTheme();
  const darkMode = useIsDarkMode();
  const { user } = useUser();

  const {
    companyDetails,
    companyName,
    companyLogo,
    setCompanyDetails,
    setCompanyLogo,
  } = useCompany();

  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    company_name: '',
    domain: '',
  });
  const [modalCompanyLogo, setModalCompanyLogo] = useState<string | null>(null);
  const [modalLogoLoading, setModalLogoLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [, setError] = useState<string | null>(null);

  const isModalOpenRef = useRef(false);

  /** 🟢 Fetch company details initially */
  useEffect(() => {
    const fetchCompanyDetails = async () => {
      try {
        setLoading(true);
        const details = await companyApi.getCompanyDetails();
        setCompanyDetails(details);

        if (details?.tenant_id) {
          const logoUrl = await companyApi.getCompanyLogo(details.tenant_id);
          setCompanyLogo(logoUrl);
        }
      } catch (err) {
        console.error('Failed to fetch company details:', err);
        setError('Failed to fetch company details');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyDetails();
  }, [setCompanyDetails, setCompanyLogo]);

  /** Open edit modal */
  const handleEditCompanyDetails = useCallback(() => {
    if (!user || !companyDetails) return;

    setCompanyModalOpen(true);
    setIsEditing(true);
    isModalOpenRef.current = true;

    setModalLogoLoading(true);
    setEditFormData({
      company_name: companyDetails.company_name,
      domain: companyDetails.domain,
    });
    setModalCompanyLogo(companyDetails.logo_url || companyLogo);
    setModalLogoLoading(false);
    isModalOpenRef.current = false;
  }, [companyDetails, companyLogo, user]);

  /** Close modal */
  const handleCloseCompanyModal = useCallback(() => {
    setCompanyModalOpen(false);
    setIsEditing(false);
    setModalCompanyLogo(null);
  }, []);

  /** Cancel editing */
  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    if (companyDetails) {
      setEditFormData({
        company_name: companyDetails.company_name,
        domain: companyDetails.domain,
      });
      setModalCompanyLogo(companyDetails.logo_url || companyLogo);
    }
  }, [companyDetails, companyLogo]);

  /** Update form fields */
  const handleFormChange = useCallback((field: string, value: string) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  /** Save updated details */
  const handleSaveCompany = useCallback(async () => {
    if (!companyDetails) return;

    setEditLoading(true);
    try {
      await companyApi.updateCompanyDetails({
        company_name: editFormData.company_name,
        domain: editFormData.domain,
      });
      setCompanyDetails(updatedDetails);
      setError(null);
      setIsEditing(false);
      setCompanyModalOpen(false);
    } catch (err) {
      console.error('Failed to update company details:', err);
      setError('Failed to update company details');
    } finally {
      setEditLoading(false);
    }
  }, [editFormData, companyDetails, setCompanyDetails]);

  /** Upload new logo */
  const handleLogoUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !user || !companyDetails?.tenant_id) return;

      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('File size should be less than 5MB');
        return;
      }

      setLogoUploading(true);
      try {
        await companyApi.uploadCompanyLogo(file);
        const logoUrl = await companyApi.getCompanyLogo(
          companyDetails.tenant_id
        );
        setCompanyLogo(logoUrl);
        setModalCompanyLogo(logoUrl);
        setError(null);
      } catch (err) {
        console.error('Logo upload error:', err);
        setError('Failed to upload logo');
      } finally {
        setLogoUploading(false);
      }
    },
    [companyDetails?.tenant_id, user, setCompanyLogo]
  );

  /** Delete logo */
  const handleDeleteLogo = useCallback(async () => {
    if (!companyDetails?.tenant_id) return;
    try {
      setLogoUploading(true);
      await companyApi.deleteCompanyLogo(companyDetails.tenant_id);
      setCompanyLogo(null);
      setModalCompanyLogo(null);
    } catch (err) {
      console.error('Failed to delete company logo:', err);
      setError('Failed to delete company logo');
    } finally {
      setLogoUploading(false);
    }
  }, [companyDetails?.tenant_id, setCompanyLogo]);

  /** Sync logo in modal */
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

      {/* Company Info */}
      <Paper
        sx={{
          p: 4,
          backgroundColor: darkMode ? '#1a1a1a' : '#fff',
          color: darkMode ? '#fff' : '#000',
          boxShadow: 'none',
        }}
      >
        {loading ? (
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
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <Business
                    sx={{ fontSize: 70, color: darkMode ? '#666' : '#999' }}
                  />
                )}
              </Box>
            </Box>

            {/* Name */}
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
                <Business
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

            {/* Domain */}
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
                <Language
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
                  {companyDetails?.domain || 'Not specified'}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Modal */}
      <Dialog
        open={companyModalOpen}
        onClose={handleCloseCompanyModal}
        maxWidth='sm'
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 1,
            bgcolor: darkMode ? '#1e1e1e' : '#fff',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: darkMode ? '#fff' : '#000',
            borderBottom: `1px solid ${theme.palette.divider}`,
            pb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessCenter />
            Company Details
          </Box>
          <IconButton onClick={handleCloseCompanyModal} size='small'>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          {modalLogoLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : companyDetails ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  my: 3,
                  position: 'relative',
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    width: 150,
                    height: 150,
                    '&:hover .logo-overlay': {
                      opacity: 1,
                      visibility: 'visible',
                    },
                    '&:hover .delete-icon': {
                      opacity: 1,
                      visibility: 'visible',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: `2px solid ${theme.palette.divider}`,
                      position: 'relative',
                      cursor: isEditing ? 'pointer' : 'default',
                    }}
                  >
                    {modalCompanyLogo ? (
                      <Box
                        component='img'
                        src={modalCompanyLogo}
                        alt='Company Logo'
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: theme.palette.action.hover,
                          color: theme.palette.text.secondary,
                          fontSize: 48,
                          fontWeight: 600,
                        }}
                      >
                        {companyName.charAt(0)}
                      </Box>
                    )}

                    {isEditing && (
                      <Box
                        className='logo-overlay'
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'rgba(0, 0, 0, 0.45)',
                          opacity: 0,
                          visibility: 'hidden',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <label htmlFor='logo-upload'>
                          <IconButton
                            component='span'
                            sx={{
                              color: '#fff',
                              backgroundColor: 'rgba(255,255,255,0.25)',
                              '&:hover': {
                                backgroundColor: 'rgba(255,255,255,0.4)',
                              },
                            }}
                          >
                            <CameraAlt />
                          </IconButton>
                        </label>
                      </Box>
                    )}
                  </Box>
<!-- 
                  {isEditing && modalCompanyLogo && (
                    <IconButton
                      onClick={handleDeleteLogo}
                      className='delete-icon'
                      sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        backgroundColor: 'rgba(255, 0, 0, 0.6)',
                        color: '#fff',
                        opacity: 0,
                        visibility: 'hidden',
                        transition: 'all 0.3s ease',
                        '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.8)' },
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                      }}
                      disabled={logoUploading}
                    >
                      <DeleteIcon fontSize='small' />
                    </IconButton>
                  )} -->
                </Box>

                {/* Hidden File Input */}
                <input
                  accept='image/*'
                  id='logo-upload'
                  type='file'
                  style={{ display: 'none' }}
                  onChange={handleLogoUpload}
                  disabled={logoUploading || !isEditing}
                />
              </Box>

              {/* Company Name */}
              <Box>
                <Typography variant='subtitle2' sx={{ mb: 0.5 }}>
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
                  />
                ) : (
                  <Typography>{companyDetails.company_name}</Typography>
                )}
              </Box>

              {/* Domain */}
              <Box>
                <Typography variant='subtitle2' sx={{ mb: 0.5 }}>
                  Domain
                </Typography>
                {isEditing ? (
                  <TextField
                    value={editFormData.domain}
                    onChange={e => handleFormChange('domain', e.target.value)}
                    fullWidth
                    size='small'
                  />
                ) : (
                  <Typography>{companyDetails.domain}</Typography>
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
          {isEditing ? (
            <>
              {/* <Button
                onClick={handleCancelEdit}
                variant='outlined'
                startIcon={<Cancel />}
                disabled={editLoading}
              >
                Cancel
              </Button> */}
              <Button
                onClick={handleSaveCompany}
                variant='contained'
                startIcon={
                  editLoading ? <CircularProgress size={16} /> : <Save />
                }
                disabled={editLoading}
              >
                {editLoading ? 'Saving...' : 'Save'}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleEditCompanyDetails}
              variant='outlined'
              startIcon={<Edit />}
            >
              Edit
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettingsPage;
