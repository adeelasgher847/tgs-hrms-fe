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
} from '@mui/material';
import {
  profileApiService,
  type UpdateProfileRequest,
} from '../../api/profileApi';
import type { UserProfile } from '../../api/profileApi';
import ProfilePictureUpload from '../common/ProfilePictureUpload';
import { useProfilePicture } from '../../context/ProfilePictureContext';

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  user: UserProfile;
  onProfileUpdated: (updatedUser: UserProfile) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  open,
  onClose,
  user,
  onProfileUpdated,
}) => {
  const { updateProfilePicture, clearProfilePicture } = useProfilePicture();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
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
      setLoading(false); // Reset loading state when modal opens
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

    // First name validation (matching backend DTO: MinLength(2), MaxLength(50))
    if (!formData.first_name.trim()) {
      errors.first_name = 'First name is required';
    } else if (formData.first_name.trim().length < 2) {
      errors.first_name = 'First name must be at least 2 characters';
    } else if (formData.first_name.trim().length > 50) {
      errors.first_name = 'First name must be less than 50 characters';
    }

    // Last name validation (matching backend DTO: MinLength(2), MaxLength(50))
    if (!formData.last_name.trim()) {
      errors.last_name = 'Last name is required';
    } else if (formData.last_name.trim().length < 2) {
      errors.last_name = 'Last name must be at least 2 characters';
    } else if (formData.last_name.trim().length > 50) {
      errors.last_name = 'Last name must be less than 50 characters';
    }

    // Email validation (matching backend DTO: @IsEmail())
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange =
    (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const newFormData = {
        ...formData,
        [field]: event.target.value,
      };

      setFormData(newFormData);

      // Check for changes
      checkForChanges(newFormData);

      // Clear validation error for this field when user starts typing
      if (validationErrors[field]) {
        setValidationErrors(prev => ({
          ...prev,
          [field]: '',
        }));
      }
    };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    // Add timeout to prevent loader from getting stuck
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setError('Request timeout. Please try again.');
    }, 30000); // 30 second timeout

    try {
      const token = localStorage.getItem('accessToken');
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

      // 1) If delete requested, remove first and clear global picture context
      if (removeRequested) {
        await profileApiService.removeProfilePicture();
        clearProfilePicture();
      }

      // 2) If a new picture file was selected in this modal, upload it next
      if (selectedPictureFile) {
        if (!token) throw new Error('No access token found');
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const correctUserId = tokenPayload.sub;
        const response = await profileApiService.uploadProfilePicture(
          correctUserId,
          selectedPictureFile
        );
        const profilePicUrl = response.user.profile_pic
          ? `${API_BASE_URL}/users/${correctUserId}/profile-picture?t=${Date.now()}`
          : null;
        updateProfilePicture(profilePicUrl);
      }

      // 3) Then update textual profile fields
      const updateData: UpdateProfileRequest = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null, // Send null to clear phone if empty
      };

      const updatedUser = await profileApiService.updateProfile(updateData);

      // Immediately update the profile and close modal for better performance
      onProfileUpdated(updatedUser);
      onClose();
    } catch (err: unknown) {
      // Handle specific error messages from backend
      const error = err as {
        response?: { data?: { message?: string }; status?: number };
      };
      if (error?.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error?.response?.status === 400) {
        setError(
          'Invalid data provided. Please check your input and try again.'
        );
      } else if (error?.response?.status === 401) {
        setError('You are not authorized to perform this action.');
      } else if (error?.response?.status === 404) {
        setError('User profile not found.');
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } finally {
      // Clear timeout and ensure loading state is always reset
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) {
      // Allow closing even when loading, but show confirmation
      if (
        window.confirm('Update is in progress. Are you sure you want to close?')
      ) {
        setLoading(false); // Reset loading state
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {error && (
            <Alert severity='error' sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <ProfilePictureUpload
              user={user}
              onProfileUpdate={onProfileUpdated}
              size={100}
              showUploadButton={true}
              showRemoveButton={true}
              clickable={true}
              deferUpload={true}
              onFileSelected={file => {
                setSelectedPictureFile(file);
                const reader = new FileReader();
                reader.onload = e => setPreviewImageUrl(e.target?.result as string);
                reader.readAsDataURL(file);
              }}
              previewImageOverride={previewImageUrl}
              deferDelete={true}
              onRemoveSelected={() => {
                setSelectedPictureFile(null);
                setPreviewImageUrl(null);
                setRemoveRequested(true);
              }}
              suppressExistingImage={removeRequested}
            />
          </Box>

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
            />

            <TextField
              label='Phone Number'
              value={formData.phone}
              onChange={handleInputChange('phone')}
              error={!!validationErrors.phone}
              helperText={validationErrors.phone}
              fullWidth
              disabled={loading}
              placeholder='Enter phone number (optional)'
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant='contained'
          disabled={loading || (!hasChanges && !selectedPictureFile && !removeRequested)}
          startIcon={loading ? <CircularProgress size={16} /> : null}
          title={!hasChanges && !selectedPictureFile && !removeRequested ? 'No changes made' : ''}
        >
          {loading ? 'Updating...' : 'Update Profile'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditProfileModal;
