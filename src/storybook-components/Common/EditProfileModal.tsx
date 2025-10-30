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
  InputAdornment,
  Avatar,
  IconButton,
} from '@mui/material';
import { PhotoCamera, Delete } from '@mui/icons-material';
import { useTheme } from '../theme';

// Mock user data
const mockUser = {
  id: '1',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '+923001234567',
  profile_pic: null,
  role: 'admin',
  tenant: 'Acme Corp',
  created_at: '2024-01-01T00:00:00Z',
};

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  user?: typeof mockUser;
  onProfileUpdated?: (updatedUser: any) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  open,
  onClose,
  user = mockUser,
  onProfileUpdated,
}) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedPictureFile, setSelectedPictureFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [removeRequested, setRemoveRequested] = useState(false);

  // Initialize form data when modal opens
  useEffect(() => {
    if (open && user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
      setError(null);
      setValidationErrors({});
      setHasChanges(false);
      setSelectedPictureFile(null);
      setPreviewImageUrl(null);
      setRemoveRequested(false);
      setLoading(false);
    }
  }, [open, user]);

  // Check if form has changes compared to original user data
  const checkForChanges = useCallback(
    (newFormData: typeof formData) => {
      if (!user) return false;

      const hasChanges =
        newFormData.first_name !== (user.first_name || '') ||
        newFormData.last_name !== (user.last_name || '') ||
        newFormData.email !== (user.email || '') ||
        newFormData.phone !== (user.phone || '');

      setHasChanges(hasChanges);
      return hasChanges;
    },
    [user]
  );

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // First name validation
    if (!formData.first_name.trim()) {
      errors.first_name = 'First name is required';
    } else if (formData.first_name.trim().length < 2) {
      errors.first_name = 'First name must be at least 2 characters';
    } else if (formData.first_name.trim().length > 50) {
      errors.first_name = 'First name must be less than 50 characters';
    }

    // Last name validation
    if (!formData.last_name.trim()) {
      errors.last_name = 'Last name is required';
    } else if (formData.last_name.trim().length < 2) {
      errors.last_name = 'Last name must be at least 2 characters';
    } else if (formData.last_name.trim().length > 50) {
      errors.last_name = 'Last name must be less than 50 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Phone number validation
    if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(formData.phone)) {
        errors.phone = 'Please enter a valid phone number';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFormData = {
      ...formData,
      [field]: event.target.value,
    };

    setFormData(newFormData);
    checkForChanges(newFormData);

    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const phoneValue = event.target.value;
    const newFormData = {
      ...formData,
      phone: phoneValue,
    };

    setFormData(newFormData);
    checkForChanges(newFormData);

    // Clear validation error for phone field when user starts typing
    if (validationErrors.phone) {
      setValidationErrors(prev => ({
        ...prev,
        phone: '',
      }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const updatedUser = {
        ...user,
        ...formData,
        profile_pic: previewImageUrl || user.profile_pic,
      };

      onProfileUpdated?.(updatedUser);
      onClose();
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) {
      if (window.confirm('Update is in progress. Are you sure you want to close?')) {
        setLoading(false);
        onClose();
      }
    } else {
      onClose();
    }
  };

  const getInitials = (first: string, last: string) =>
    `${first?.charAt(0) || ''}${last?.charAt(0) || ''}`.toUpperCase();

  const generateAvatarColor = (name: string) => {
    const colors = [
      '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4',
      '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107',
      '#ff9800', '#ff5722', '#795548', '#9e9e9e', '#607d8b',
    ];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedPictureFile(file);
      const reader = new FileReader();
      reader.onload = e => setPreviewImageUrl(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePicture = () => {
    setSelectedPictureFile(null);
    setPreviewImageUrl(null);
    setRemoveRequested(true);
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
      <DialogTitle sx={{ 
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-family-primary)',
        fontWeight: 'var(--font-weight-semibold)',
      }}>
        Edit Profile
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {error && (
            <Alert severity='error' sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Profile Picture Upload */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  backgroundColor: generateAvatarColor(user.first_name),
                  fontSize: '40px',
                  cursor: 'pointer',
                  '&:hover': {
                    opacity: 0.8,
                  },
                }}
              >
                {previewImageUrl ? (
                  <img
                    src={previewImageUrl}
                    alt="Profile preview"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '50%',
                    }}
                  />
                ) : user.profile_pic ? (
                  <img
                    src={user.profile_pic}
                    alt={`${user.first_name} ${user.last_name}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '50%',
                    }}
                  />
                ) : (
                  getInitials(user.first_name, user.last_name)
                )}
              </Avatar>
              
              {/* Upload Button */}
              <IconButton
                component="label"
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: 'var(--primary-color)',
                  color: 'var(--primary-text)',
                  '&:hover': {
                    backgroundColor: 'var(--primary-dark)',
                  },
                }}
                size="small"
              >
                <PhotoCamera />
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </IconButton>

              {/* Remove Button */}
              {(user.profile_pic || previewImageUrl) && (
                <IconButton
                  onClick={handleRemovePicture}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    backgroundColor: 'var(--chart-color-6)',
                    color: 'var(--text-light)',
                    '&:hover': {
                      backgroundColor: '#b91c1c',
                    },
                  }}
                  size="small"
                >
                  <Delete fontSize="small" />
                </IconButton>
              )}
            </Box>
          </Box>

          {/* Form Fields */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label='First Name'
              value={formData.first_name}
              onChange={handleInputChange('first_name')}
              error={!!validationErrors.first_name}
              helperText={validationErrors.first_name}
              fullWidth
              disabled={loading}
              inputProps={{ maxLength: 50 }}
              sx={{
                '& .MuiOutlinedInput-root': {
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

            <TextField
              label='Last Name'
              value={formData.last_name}
              onChange={handleInputChange('last_name')}
              error={!!validationErrors.last_name}
              helperText={validationErrors.last_name}
              fullWidth
              disabled={loading}
              inputProps={{ maxLength: 50 }}
              sx={{
                '& .MuiOutlinedInput-root': {
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

            <TextField
              label='Phone Number'
              value={formData.phone}
              onChange={handlePhoneChange}
              error={!!validationErrors.phone}
              helperText={validationErrors.phone}
              fullWidth
              disabled={loading}
              placeholder='Enter phone number (optional)'
              sx={{
                '& .MuiOutlinedInput-root': {
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

            <TextField
              label='Email Address'
              type='email'
              value={formData.email}
              onChange={handleInputChange('email')}
              error={!!validationErrors.email}
              helperText={validationErrors.email}
              fullWidth
              disabled={loading}
              sx={{
                '& .MuiOutlinedInput-root': {
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
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          sx={{
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-family-primary)',
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant='contained'
          disabled={loading || (!hasChanges && !selectedPictureFile && !removeRequested)}
          startIcon={loading ? <CircularProgress size={16} /> : null}
          title={!hasChanges && !selectedPictureFile && !removeRequested ? 'No changes made' : ''}
          sx={{
            backgroundColor: 'var(--primary-color)',
            color: 'var(--primary-text)',
            fontFamily: 'var(--font-family-primary)',
            '&:hover': {
              backgroundColor: 'var(--primary-dark)',
            },
            '&:disabled': {
              backgroundColor: 'var(--text-muted)',
            },
          }}
        >
          {loading ? 'Updating...' : 'Update Profile'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditProfileModal;
