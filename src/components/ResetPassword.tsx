import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Link,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import ForgetImage from '../assets/icons/forget-image.svg';
import authApi from '../api/authApi';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [openToast, setOpenToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (!token) {
      setErrors({ general: 'Invalid reset link. Please request a new password reset.' });
    }
  }, [token]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.resetPassword({
        token: token!,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      if (response.message) {
        setToastMessage(response.message);
        setToastSeverity('success');
        setOpenToast(true);
        
        // Redirect to login page after successful reset
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setToastMessage('Failed to reset password. Please try again.');
        setToastSeverity('error');
        setOpenToast(true);
      }
    } catch (error: any) {
      console.error('Error resetting password:', error);
      
      // Check if it's a validation error
      if (error.message?.includes('Invalid or expired')) {
        setErrors({ general: 'This reset link has expired or is invalid. Please request a new one.' });
      } else {
        setToastMessage('Network error. Please check your connection and try again.');
        setToastSeverity('error');
        setOpenToast(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    navigate('/');
  };

  if (!token) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <Paper
          elevation={4}
          sx={{
            p: 4,
            textAlign: 'center',
            maxWidth: 400,
          }}
        >
          <Typography variant="h5" color="error" gutterBottom>
            Invalid Reset Link
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            This password reset link is invalid or has expired. Please request a new password reset.
          </Typography>
          <Button
            variant="contained"
            onClick={handleBackToSignIn}
            sx={{ mr: 2 }}
          >
            Back to Sign In
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/forget')}
          >
            Request New Reset
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <div className='loginpage'>
      <Box
        className='login-scroll'
        sx={{
          height: { xs: 'auto', md: '100vh' },
          m: { xs: '14px', lg: '0' },
          position: 'relative',
        }}
      >
        <Box
          sx={{
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            gap: { xs: 1 },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              margin: 'auto',
            }}
          >
            {/* Left Side - Image */}
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                flex: 1,
                height: '100%',
                mt: 1,
              }}
            >
              <Box sx={{ mb: 4 }}>
                <svg
                  width='4rem'
                  fill='currentColor'
                  className='bi bi-clipboard-check'
                  viewBox='0 0 16 16'
                >
                  <path
                    fillRule='evenodd'
                    d='M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z'
                  ></path>
                  <path d='M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z'></path>
                  <path d='M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z'></path>
                </svg>
              </Box>
              <Typography
                variant='h4'
                sx={{
                  maxWidth: 370,
                  mb: 3,
                  fontFamily: 'Open Sans, sans-serif',
                  fontWeight: 500,
                  fontSize: '32px',
                }}
              >
                My-Task Let's Management Better
              </Typography>
              <Box
                component='img'
                src='https://pixelwibes.com/template/my-task/react/static/media/login-img.b36c8fbd17b96828d9ba0900b843d21c.svg'
                alt='Login Illustration'
                sx={{ width: '100%', maxWidth: '400px' }}
              />
            </Box>

            {/* Right Side - Reset Password Form */}
            <Box
              sx={{
                alignItems: 'center',
                flex: 1,
                width: { xs: '100%', md: '500px', lg: '512px' },
                mx: 'auto',
              }}
            >
              <Paper
                elevation={4}
                sx={{
                  backgroundColor: 'var(--dark-color)',
                  color: 'common.white',
                  p: { xs: 3, md: 7 },
                  pt: { xs: 1, md: 1 },
                  pb: { xs: 1, md: 2 },
                  borderRadius: { xs: 2, lg: 0 },
                }}
              >
                {/* Form */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Box
                    component='img'
                    src={ForgetImage}
                    alt='Reset Password Illustration'
                    sx={{
                      width: '100%',
                      maxWidth: 240,
                      height: '125px',
                      mb: 1,
                      mt: { xs: 2, md: 2 },
                    }}
                  />

                  <Box
                    component='form'
                    noValidate
                    sx={{ width: '100%' }}
                    onSubmit={handleSubmit}
                  >
                    <Box sx={{ textAlign: 'center', mb: { xs: 1, sm: 2 } }}>
                      <Typography
                        variant='h1'
                        width='100%'
                        gutterBottom
                        sx={{
                          fontSize: { xs: '22px', md: '30px' },
                          fontFamily: 'Open Sans, sans-serif',
                          mb: 1,
                          fontWeight: 500,
                        }}
                      >
                        Reset Your Password
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: { xs: '12px', md: '14px' },
                          fontFamily: 'Open Sans, sans-serif',
                          textAlign: 'center',
                        }}
                      >
                        Enter your new password below to complete the reset process.
                      </Typography>
                    </Box>

                    {errors.general && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {errors.general}
                      </Alert>
                    )}

                    <Typography
                      component='label'
                      htmlFor='password'
                      sx={{ fontWeight: 400, fontSize: '14px' }}
                    >
                      New Password
                    </Typography>
                    <TextField
                      fullWidth
                      required
                      id='password'
                      name='password'
                      type={showPassword ? 'text' : 'password'}
                      margin='normal'
                      placeholder='Enter new password'
                      value={formData.password}
                      onChange={handleInputChange('password')}
                      error={!!errors.password}
                      helperText={errors.password}
                      FormHelperTextProps={{
                        sx: {
                          fontSize: '14px',
                        },
                      }}
                      sx={{ mt: 1 }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                        sx: {
                          backgroundColor: '#eee',
                          borderRadius: '8px',
                          '&.Mui-focused, &:active': {
                            backgroundColor: 'white',
                          },
                          "& fieldset": { border: "none" },
                          "&:hover fieldset": { border: "none" },
                          "&.Mui-focused fieldset": { border: "none" },
                        },
                      }}
                    />

                    <Typography
                      component='label'
                      htmlFor='confirmPassword'
                      sx={{ fontWeight: 400, fontSize: '14px', mt: 2 }}
                    >
                      Confirm New Password
                    </Typography>
                    <TextField
                      fullWidth
                      required
                      id='confirmPassword'
                      name='confirmPassword'
                      type={showConfirmPassword ? 'text' : 'password'}
                      margin='normal'
                      placeholder='Confirm new password'
                      value={formData.confirmPassword}
                      onChange={handleInputChange('confirmPassword')}
                      error={!!errors.confirmPassword}
                      helperText={errors.confirmPassword}
                      FormHelperTextProps={{
                        sx: {
                          fontSize: '14px',
                        },
                      }}
                      sx={{ mt: 1 }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              edge="end"
                            >
                              {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                        sx: {
                          backgroundColor: '#eee',
                          borderRadius: '8px',
                          '&.Mui-focused, &:active': {
                            backgroundColor: 'white',
                          },
                          "& fieldset": { border: "none" },
                          "&:hover fieldset": { border: "none" },
                          "&.Mui-focused fieldset": { border: "none" },
                        },
                      }}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Button
                        type='submit'
                        variant='contained'
                        disabled={loading || !formData.password || !formData.confirmPassword}
                        sx={{
                          mt: { xs: 2, md: 2 },
                          p: 1.5,
                          px: 2,
                          bgcolor: 'white',
                          color: 'black',
                          textTransform: 'uppercase',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontFamily: 'Open Sans, sans-serif',
                          '&:hover': {
                            bgcolor: 'grey.200',
                          },
                        }}
                      >
                        {loading ? (
                          <CircularProgress size={24} />
                        ) : (
                          'Reset Password'
                        )}
                      </Button>
                    </Box>

                    <Typography
                      variant='body2'
                      align='center'
                      sx={{
                        mt: 1,
                        color: '#9a9b9d',
                        fontSize: '14px',
                        fontFamily: 'Open Sans, sans-serif',
                      }}
                    >
                      <Link
                        component="button"
                        onClick={handleBackToSignIn}
                        sx={{
                          color: 'var(--yellow-color)',
                          fontWeight: 400,
                          fontFamily: 'Open Sans, sans-serif',
                          fontSize: '14px',
                          textDecoration: 'none',
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          '&:hover': {
                            textDecoration: 'none',
                            color: 'var(--yellow-color)',
                          },
                        }}
                      >
                        Back to Sign in
                      </Link>
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Snackbar Toast */}
      <Snackbar
        open={openToast}
        autoHideDuration={4000}
        onClose={() => setOpenToast(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setOpenToast(false)}
          severity={toastSeverity}
          sx={{ width: '100%', backgroundColor: '#2e7d32', color: 'white !important','& .MuiAlert-icon': {
                color: 'white',
         }, }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ResetPassword; 