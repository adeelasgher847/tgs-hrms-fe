import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
} from '@mui/material';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { useLanguage } from '../../hooks/useLanguage';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import './PhoneInput.css';
import {
  profileApiService,
  type UpdateProfileRequest,
} from '../../api/profileApi';
import type { UserProfile } from '../../api/profileApi';
import ProfilePictureUpload from '../common/ProfilePictureUpload';
import { useProfilePicture } from '../../context/ProfilePictureContext';
import { validateEmailAddress } from '../../utils/validation';

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  user: UserProfile;
  onProfileUpdated: (updatedUser: UserProfile) => void;
}

const EDIT_PROFILE_STRINGS = {
  en: {
    dialogTitle: 'Edit Profile',
    firstName: 'First Name',
    lastName: 'Last Name',
    phoneNumber: 'Phone Number',
    emailAddress: 'Email Address',
    phonePlaceholder: 'Enter phone number (optional)',
    cancel: 'Cancel',
    updateProfile: 'Update Profile',
    updating: 'Updating...',
    requestTimeout: 'Request timeout. Please try again.',
    updateInProgressConfirm:
      'Update is in progress. Are you sure you want to close?',
    invalidPhone: 'Please enter a valid phone number',
    firstNameRequired: 'First name is required',
    firstNameMin: 'First name must be at least 2 characters',
    firstNameMax: 'First name must be less than 50 characters',
    lastNameRequired: 'Last name is required',
    lastNameMin: 'Last name must be at least 2 characters',
    lastNameMax: 'Last name must be less than 50 characters',
    emailRequired: 'Email is required',
    emailInvalid: 'Please enter a valid email address',
    noChanges: 'No changes made',
  },
  ar: {
    dialogTitle: 'تعديل الملف الشخصي',
    firstName: 'الاسم الأول',
    lastName: 'اسم العائلة',
    phoneNumber: 'رقم الهاتف',
    emailAddress: 'البريد الإلكتروني',
    phonePlaceholder: 'أدخل رقم الهاتف (اختياري)',
    cancel: 'إلغاء',
    updateProfile: 'تحديث الملف',
    updating: 'جارٍ التحديث...',
    requestTimeout: 'انتهت مهلة الطلب. حاول مرة أخرى.',
    updateInProgressConfirm: 'التحديث جارٍ. هل أنت متأكد أنك تريد الإغلاق؟',
    invalidPhone: 'يرجى إدخال رقم هاتف صالح',
    firstNameRequired: 'الاسم الأول مطلوب',
    firstNameMin: 'يجب أن لا يقل الاسم الأول عن حرفين',
    firstNameMax: 'يجب أن يكون الاسم الأول أقل من 50 حرفًا',
    lastNameRequired: 'اسم العائلة مطلوب',
    lastNameMin: 'يجب أن لا يقل اسم العائلة عن حرفين',
    lastNameMax: 'يجب أن يكون اسم العائلة أقل من 50 حرفًا',
    emailRequired: 'البريد الإلكتروني مطلوب',
    emailInvalid: 'يرجى إدخال عنوان بريد إلكتروني صالح',
    noChanges: 'لا توجد تغييرات',
  },
} as const;

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  open,
  onClose,
  user,
  onProfileUpdated,
}) => {
  const { language } = useLanguage();

  const L = useMemo(
    () =>
      EDIT_PROFILE_STRINGS[language as 'en' | 'ar'] || EDIT_PROFILE_STRINGS.en,
    [language]
  );
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
  const [selectedPictureFile, setSelectedPictureFile] = useState<File | null>(
    null
  );
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
      errors.first_name = L.firstNameRequired;
    } else if (formData.first_name.trim().length < 2) {
      errors.first_name = L.firstNameMin;
    } else if (formData.first_name.trim().length > 50) {
      errors.first_name = L.firstNameMax;
    }

    // Last name validation (matching backend DTO: MinLength(2), MaxLength(50))
    if (!formData.last_name.trim()) {
      errors.last_name = L.lastNameRequired;
    } else if (formData.last_name.trim().length < 2) {
      errors.last_name = L.lastNameMin;
    } else if (formData.last_name.trim().length > 50) {
      errors.last_name = L.lastNameMax;
    }

    // Email validation – reuse shared signup rules
    if (formData.email.trim()) {
      const emailError = validateEmailAddress(formData.email);
      if (emailError) {
        errors.email = emailError;
      }
    } else {
      errors.email = 'Email is required';
    }

    // Phone number validation
    if (formData.phone && formData.phone.trim()) {
      // Basic validation for phone number format
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(formData.phone)) {
        errors.phone = L.invalidPhone;
      }
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

  const handlePhoneChange = (value: string | undefined) => {
    const phoneValue = value || '';
    const newFormData = {
      ...formData,
      phone: phoneValue,
    };

    setFormData(newFormData);

    // Check for changes
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

    // Add timeout to prevent loader from getting stuck
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setError(L.requestTimeout);
    }, 30000); // 30 second timeout

    try {
      const token = localStorage.getItem('accessToken');
      const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

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
      if (window.confirm(L.updateInProgressConfirm)) {
        setLoading(false); // Reset loading state
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle
        dir={language === 'ar' ? 'rtl' : 'ltr'}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexDirection: language === 'ar' ? 'row-reverse' : 'row',
          textAlign: language === 'ar' ? 'right' : 'left',
          px: 2,
        }}
      >
        <Box
          component='span'
          sx={{
            fontWeight: 600,
            order: language === 'ar' ? 2 : 1,
            flex: 1,
            textAlign: language === 'ar' ? 'right' : 'left',
          }}
        >
          {L.dialogTitle}
        </Box>
        <IconButton
          onClick={handleClose}
          size='small'
          sx={{ order: language === 'ar' ? 1 : 2, color: 'inherit' }}
          aria-label='close'
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ direction: 'ltr' }}>
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
                reader.onload = e =>
                  setPreviewImageUrl(e.target?.result as string);
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
              label={L.firstName}
              value={formData.first_name}
              onChange={handleInputChange('first_name')}
              error={!!validationErrors.first_name}
              helperText={validationErrors.first_name}
              autoFocus={open}
              fullWidth
              disabled={loading}
              inputProps={{ maxLength: 50 }}
            />

            <TextField
              label={L.lastName}
              value={formData.last_name}
              onChange={handleInputChange('last_name')}
              error={!!validationErrors.last_name}
              helperText={validationErrors.last_name}
              fullWidth
              disabled={loading}
              inputProps={{ maxLength: 50 }}
            />
            <TextField
              label={L.phoneNumber}
              value={formData.phone}
              onChange={e => handlePhoneChange(e.target.value)}
              error={!!validationErrors.phone}
              helperText={validationErrors.phone}
              fullWidth
              disabled={loading}
              placeholder={L.phonePlaceholder}
              InputProps={{
                startAdornment: (
                  <InputAdornment
                    position='start'
                    sx={{ margin: 0, padding: '28px 0px' }}
                  >
                    <PhoneInput
                      defaultCountry='pk'
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      disabled={loading}
                      style={{
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        width: '100%',
                      }}
                      inputStyle={{
                        border: 'none',
                        outline: 'none',
                        padding: '0',
                        margin: '0',
                        fontSize: '1rem',
                        fontFamily:
                          '"Roboto", "Helvetica", "Arial", sans-serif',
                        backgroundColor: 'transparent',
                        width: '100%',
                        boxSizing: 'border-box',
                        flex: 1,
                        height: '100%',
                      }}
                      countrySelectorStyleProps={{
                        buttonStyle: {
                          border: 'none',
                          background: 'transparent',
                          padding: '0',
                          margin: '0',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        },
                      }}
                      className='phone-input-textfield-adornment'
                    />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  padding: '0px',
                },
                '& .MuiInputBase-input': {
                  display: 'none', // Hide the TextField input completely
                },
                '& .MuiInputAdornment-root': {
                  width: '100%',
                  margin: 0,
                },
                '& .MuiInputAdornment-positionStart': {
                  marginRight: 0,
                },
              }}
            />

            <TextField
              label={L.emailAddress}
              type='email'
              value={formData.email}
              onChange={handleInputChange('email')}
              error={!!validationErrors.email}
              helperText={validationErrors.email}
              fullWidth
              disabled={loading}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          p: 2,
          justifyContent: language === 'ar' ? 'flex-start' : 'flex-end',
        }}
      >
        <Button
          onClick={handleClose}
          disabled={loading}
          sx={{ mr: language === 'ar' ? 1 : 0 }}
        >
          {L.cancel}
        </Button>
        <Button
          onClick={handleSubmit}
          variant='contained'
          disabled={
            loading || (!hasChanges && !selectedPictureFile && !removeRequested)
          }
          startIcon={loading ? <CircularProgress size={16} /> : null}
          title={
            !hasChanges && !selectedPictureFile && !removeRequested
              ? L.noChanges
              : ''
          }
          sx={{ ml: language === 'ar' ? 0 : 1 }}
        >
          {loading ? L.updating : L.updateProfile}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditProfileModal;
