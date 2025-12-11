import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  MenuItem,
  Select,
} from '@mui/material';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../Common/ErrorSnackbar';
import AppInputField from '../Common/AppInputField';
import AuthSidebar from '../Common/AuthSidebar';
import { Icons } from '../../assets/icons';

const CompanyDetails: React.FC = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { snackbar, showSuccess, closeSnackbar } = useErrorHandler();

  const [formData, setFormData] = useState({
    companyName: '',
    domain: '',
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState({
    companyName: '',
    domain: '',
  });

  // Check if user has signupSessionId, redirect if not
  useEffect(() => {
    const signupSessionId = localStorage.getItem('signupSessionId');
    if (!signupSessionId) {
      navigate('/Signup');
    }
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFieldErrors(prev => ({ ...prev, [name]: '' }));
    setError(null);
    setSuccess(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      // Validate file type
      if (!file.type.match(/^image\/(jpeg|jpg|png|gif)$/)) {
        setError('Only JPEG, PNG and GIF formats are allowed');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = e => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const fakeEvent = {
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleImageChange(fakeEvent);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const validateForm = () => {
    const nextErrors = {
      companyName: '',
      domain: '',
    };

    if (!formData.companyName.trim()) {
      nextErrors.companyName = 'Company name is required';
    }

    if (!formData.domain.trim()) {
      nextErrors.domain = 'Domain is required';
    }

    setFieldErrors(nextErrors);
    const hasErrors = Object.values(nextErrors).some(Boolean);
    return !hasErrors;
  };

  const isSubmitDisabled =
    loading ||
    !formData.companyName.trim() ||
    !formData.domain.trim() ||
    Object.values(fieldErrors).some(Boolean);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const signupSessionId = localStorage.getItem('signupSessionId');
      if (!signupSessionId) {
        throw new Error('Signup session not found. Please start over.');
      }

      const companyData: {
        companyName: string;
        domain: string;
        logoBase64?: string;
        logoFileName?: string;
        logoFileType?: string;
      } = {
        companyName: formData.companyName.trim(),
        domain: formData.domain.trim(),
      };

      if (selectedImage && imagePreview) {
        companyData.logoBase64 = imagePreview;
        companyData.logoFileName = selectedImage.name;
        companyData.logoFileType = selectedImage.type;
      }

      localStorage.setItem('companyDetails', JSON.stringify(companyData));

      setSuccess('Company details saved successfully!');
      showSuccess(
        lang === 'ar'
          ? 'تم حفظ تفاصيل الشركة بنجاح!'
          : 'Company details saved successfully!'
      );

      setTimeout(() => {
        navigate('/signup/select-plan');
      }, 2000);
    } catch (err: unknown) {
      const error = err as {
        response?: {
          data?: {
            message?: unknown;
            errors?: Record<string, unknown[]>;
          };
        };
        message?: string;
      };

      if (error.response?.data?.message) {
        const errorData = error.response.data.message;
        if (
          typeof errorData === 'object' &&
          errorData !== null &&
          'field' in errorData &&
          'message' in errorData
        ) {
          const field = String(errorData.field) as keyof typeof fieldErrors;
          setFieldErrors(prev => ({
            ...prev,
            [field]: String(errorData.message),
          }));
          setError(null);
        } else {
          setError(String(errorData));
        }
      } else if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat();
        setError(String(errorMessages.join(', ')));
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('Failed to save company details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/Signup');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
      }}
    >
      <AuthSidebar />

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: { xs: '24px', md: '48px' },
          backgroundColor: 'var(--white-100-color)',
          overflowY: 'auto',
          borderTopLeftRadius: '12px',
          borderBottomLeftRadius: '12px',
          position: 'relative',
          zIndex: 1,
          marginLeft: { lg: '-12px' },
          paddingLeft: { lg: 'calc(48px + 12px)' },
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: '500px',
          }}
        >
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <FormControl size='small' sx={{ minWidth: 100 }}>
              <Select
                value={lang}
                onChange={e => setLang(e.target.value as 'en' | 'ar')}
                sx={{
                  borderRadius: 'var(--border-radius-lg)',
                }}
              >
                <MenuItem value='en'>English</MenuItem>
                <MenuItem value='ar'>عربى</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Typography
            variant='h1'
            sx={{
              fontSize: '48px',
              fontWeight: 700,
              mb: 1,
            }}
          >
            Company Details
          </Typography>

          <Typography
            className='body'
            sx={{
              color: 'var(--dark-grey-color)',
              mb: 4,
            }}
          >
            Tell us more about your company.
          </Typography>

          {error && (
            <Alert severity='error' sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity='success' sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Box component='form' onSubmit={handleSubmit} noValidate>
            <Box sx={{ mb: 2 }}>
              <AppInputField
                name='companyName'
                label='Company Name'
                required
                fullWidth
                value={formData.companyName}
                onChange={handleChange}
                disabled={loading}
                error={Boolean(fieldErrors.companyName)}
                helperText={fieldErrors.companyName}
                placeholder='Name'
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <AppInputField
                name='domain'
                label='Domain'
                required
                fullWidth
                value={formData.domain}
                onChange={handleChange}
                disabled={loading}
                error={Boolean(fieldErrors.domain)}
                helperText={fieldErrors.domain}
                placeholder='Domain (e.g. Development)'
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography
                component='label'
                className='label'
                sx={{
                  fontSize: '20px',
                  fontWeight: 600,
                  display: 'block',
                  mb: 0.5,
                  color: 'var(--dark-black-color)',
                }}
              >
                Company Logo
              </Typography>
              {!imagePreview ? (
                <Box
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() =>
                    document.getElementById('logo-upload')?.click()
                  }
                  sx={{
                    border: '2px dashed var(--light-grey-color)',
                    borderRadius: 'var(--border-radius-lg)',
                    p: 4,
                    textAlign: 'center',
                    backgroundColor: 'var(--white-color)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'var(--light-grey-100-color)',
                      borderColor: 'var(--primary-dark-color)',
                    },
                  }}
                >
                  <input
                    id='logo-upload'
                    type='file'
                    accept='image/jpeg,image/png,image/gif'
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                  <Box
                    component='img'
                    src={Icons.upload}
                    alt='Upload'
                    sx={{
                      width: '48px',
                      height: '48px',
                      mb: 2,
                      filter:
                        'brightness(0) saturate(100%) invert(45%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(95%)',
                    }}
                  />
                  <Typography
                    className='label'
                    sx={{
                      color: 'var(--text-color)',
                      mb: 1,
                    }}
                  >
                    Choose a file or drag & drop it here
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '12px',
                      color: 'var(--dark-grey-color)',
                    }}
                  >
                    JPEG, PNG and GIF formats, up to 10 MB
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    position: 'relative',
                    display: 'inline-block',
                    border: '2px solid var(--light-grey-200-color)',
                    borderRadius: 'var(--border-radius-lg)',
                    p: 1,
                  }}
                >
                  <Box
                    component='img'
                    src={imagePreview}
                    alt='Company Logo Preview'
                    loading='lazy'
                    sx={{
                      width: '120px',
                      height: '120px',
                      objectFit: 'cover',
                      borderRadius: 'var(--border-radius-lg)',
                    }}
                  />
                  <Button
                    size='small'
                    onClick={handleRemoveImage}
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      minWidth: 'auto',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--secondary-color)',
                      color: 'var(--white-color)',
                      padding: 0,
                      '&:hover': {
                        backgroundColor: 'var(--secondary-color)',
                        opacity: 0.8,
                      },
                    }}
                  >
                    ×
                  </Button>
                </Box>
              )}
            </Box>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 2,
                mt: 4,
              }}
            >
              <Button
                variant='outlined'
                type='button'
                onClick={handleBack}
                disabled={loading}
                sx={{
                  borderColor: 'var(--black-color)',
                  color: 'var(--black-color)',
                  backgroundColor: 'transparent',
                  borderRadius: '12px',
                  fontSize: 'var(--body-font-size)',
                  textTransform: 'none',
                  padding: '8px 30px',
                  '&:hover': {
                    borderColor: 'var(--primary-dark-color)',
                    backgroundColor: 'rgba(48, 131, 220, 0.1)',
                  },
                }}
              >
                Back
              </Button>
              <Button
                variant='contained'
                type='submit'
                disabled={isSubmitDisabled}
                sx={{
                  backgroundColor: 'var(--primary-dark-color)',
                  color: 'var(--white-color)',
                  fontWeight: 600,
                  borderRadius: '12px',
                  fontSize: 'var(--body-font-size)',
                  textTransform: 'none',
                  padding: '8px 30px',
                  '&:hover': {
                    backgroundColor: 'var(--primary-light-color)',
                  },
                  '&:disabled': {
                    backgroundColor: 'var(--grey-color)',
                  },
                }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} color='inherit' />
                    Processing...
                  </Box>
                ) : (
                  'Next'
                )}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
      <ErrorSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Box>
  );
};

export default CompanyDetails;
