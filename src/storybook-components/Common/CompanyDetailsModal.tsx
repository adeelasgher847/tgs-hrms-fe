import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  CircularProgress,
  Avatar,
  IconButton,
  Typography,
} from '@mui/material';
import { 
  BusinessCenter, 
  Close, 
  CameraAlt, 
  Edit, 
  Save, 
  Cancel 
} from '@mui/icons-material';
import { useTheme } from '../theme';

// Mock company data
const mockCompanyDetails = {
  id: '1',
  company_name: 'Acme Corporation',
  domain: 'acme.com',
  logo_url: null as string | null,
  tenant_id: 'tenant_123',
  created_at: '2024-01-01T00:00:00Z',
};

interface CompanyDetailsModalProps {
  open: boolean;
  onClose: () => void;
  companyDetails?: typeof mockCompanyDetails;
  onCompanyUpdated?: (updatedCompany: any) => void;
}

const CompanyDetailsModal: React.FC<CompanyDetailsModalProps> = ({
  open,
  onClose,
  companyDetails = mockCompanyDetails,
  onCompanyUpdated,
}) => {
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [modalCompanyLogo, setModalCompanyLogo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [editFormData, setEditFormData] = useState({
    company_name: '',
    domain: '',
  });

  // Initialize form data when modal opens
  useEffect(() => {
    if (open && companyDetails) {
      setEditFormData({
        company_name: companyDetails.company_name || '',
        domain: companyDetails.domain || '',
      });
      setModalCompanyLogo(companyDetails.logo_url || null);
      setError(null);
      setIsEditing(false);
      setEditLoading(false);
      setLogoUploading(false);
    }
  }, [open, companyDetails]);

  const handleFormChange = (field: string, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditCompany = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData({
      company_name: companyDetails.company_name || '',
      domain: companyDetails.domain || '',
    });
    setModalCompanyLogo(companyDetails.logo_url || null);
    setError(null);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoUploading(true);
      
      // Simulate upload
      setTimeout(() => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setModalCompanyLogo(e.target?.result as string);
          setLogoUploading(false);
        };
        reader.readAsDataURL(file);
      }, 1500);
    }
  };

  const handleSaveCompany = async () => {
    setEditLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const updatedCompany = {
        ...companyDetails,
        ...editFormData,
        logo_url: modalCompanyLogo,
      };

      onCompanyUpdated?.(updatedCompany);
      setIsEditing(false);
      onClose();
    } catch (err) {
      setError('Failed to update company details. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleClose = () => {
    if (editLoading) {
      if (window.confirm('Update is in progress. Are you sure you want to close?')) {
        setEditLoading(false);
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='sm'
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text-primary)',
          borderRadius: 'var(--radius-lg)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'var(--text-primary)',
          borderBottom: '1px solid var(--border-primary)',
          borderRadius: 0,
          pb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessCenter sx={{ color: 'var(--primary-color)' }} />
          <Typography 
            variant="h6" 
            fontFamily="var(--font-family-primary)"
            fontWeight="var(--font-weight-semibold)"
          >
            Company Details
          </Typography>
        </Box>
        {!isEditing && (
          <IconButton
            onClick={handleClose}
            size='small'
            sx={{
              color: 'var(--text-secondary)',
              '&:hover': {
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-hover)',
              },
            }}
          >
            <Close />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {logoUploading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : companyDetails ? (
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
              <Box
                sx={{
                  position: 'relative',
                  cursor: isEditing ? 'pointer' : 'default',
                  '&:hover .camera-overlay': { opacity: isEditing ? 1 : 0 },
                  '&:hover .avatar': {
                    filter: isEditing ? 'brightness(0.7)' : 'none',
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 150,
                    height: 150,
                    border: '2px solid var(--border-primary)',
                    fontSize: '48px',
                    fontWeight: 'bold',
                    backgroundColor: 'var(--primary-color)',
                    color: 'var(--primary-text)',
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
                    companyDetails.company_name.charAt(0).toUpperCase()
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
              
              {logoUploading && (
                <Typography
                  variant='caption'
                  sx={{ 
                    mt: 1, 
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-family-primary)',
                  }}
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
                  color: 'var(--text-secondary)',
                  mb: 0.5,
                  fontWeight: 'var(--font-weight-medium)',
                  fontFamily: 'var(--font-family-primary)',
                }}
              >
                Company Name
              </Typography>
              {isEditing ? (
                <TextField
                  value={editFormData.company_name}
                  onChange={e => handleFormChange('company_name', e.target.value)}
                  fullWidth
                  size='small'
                  variant='outlined'
                  disabled={editLoading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'var(--bg-primary)',
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--primary-color)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--primary-color)',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: 'var(--primary-color)',
                    },
                  }}
                />
              ) : (
                <Typography
                  variant='body1'
                  sx={{ 
                    color: 'var(--text-primary)', 
                    fontWeight: 'var(--font-weight-medium)',
                    fontFamily: 'var(--font-family-primary)',
                  }}
                >
                  {companyDetails.company_name}
                </Typography>
              )}
            </Box>

            {/* Domain */}
            <Box>
              <Typography
                variant='subtitle2'
                sx={{
                  color: 'var(--text-secondary)',
                  mb: 0.5,
                  fontWeight: 'var(--font-weight-medium)',
                  fontFamily: 'var(--font-family-primary)',
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
                  disabled={editLoading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'var(--bg-primary)',
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--primary-color)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--primary-color)',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: 'var(--primary-color)',
                    },
                  }}
                />
              ) : (
                <Typography
                  variant='body1'
                  sx={{ 
                    color: 'var(--text-primary)', 
                    fontWeight: 'var(--font-weight-medium)',
                    fontFamily: 'var(--font-family-primary)',
                  }}
                >
                  {companyDetails.domain}
                </Typography>
              )}
            </Box>
          </Box>
        ) : (
          <Typography 
            sx={{ 
              textAlign: 'center', 
              py: 2,
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-family-primary)',
            }}
          >
            No company details available
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1, justifyContent: 'space-between' }}>
        <Box>
          {isEditing && (
            <Button
              onClick={handleCancelEdit}
              variant='outlined'
              startIcon={<Cancel />}
              disabled={editLoading}
              sx={{ 
                textTransform: 'none', 
                fontWeight: 'var(--font-weight-medium)',
                fontFamily: 'var(--font-family-primary)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)',
                '&:hover': {
                  borderColor: 'var(--primary-color)',
                  backgroundColor: 'var(--bg-hover)',
                },
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
              variant='contained'
              startIcon={editLoading ? <CircularProgress size={16} /> : <Save />}
              disabled={editLoading}
              sx={{ 
                textTransform: 'none', 
                fontWeight: 'var(--font-weight-medium)',
                fontFamily: 'var(--font-family-primary)',
                backgroundColor: 'var(--primary-color)',
                color: 'var(--primary-text)',
                '&:hover': {
                  backgroundColor: 'var(--primary-dark)',
                },
                '&:disabled': {
                  backgroundColor: 'var(--text-muted)',
                },
              }}
            >
              {editLoading ? 'Saving...' : 'Save'}
            </Button>
          ) : (
            <Button
              onClick={handleEditCompany}
              variant='outlined'
              startIcon={<Edit />}
              sx={{
                textTransform: 'none',
                fontWeight: 'var(--font-weight-medium)',
                fontFamily: 'var(--font-family-primary)',
                px: 2,
                py: 0.5,
                borderColor: 'var(--primary-color)',
                color: 'var(--primary-color)',
                '&:hover': {
                  borderColor: 'var(--primary-dark)',
                  backgroundColor: 'var(--primary-light)',
                },
              }}
            >
              Edit
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default CompanyDetailsModal;
