import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Link,
  FormControl,
  MenuItem,
  Select,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Snackbar,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import './UserProfile/PhoneInput.css';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import signupApi, { type PersonalDetailsRequest } from '../api/signupApi';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field while typing
    setFieldErrors(prev => ({ ...prev, [name]: '' }));
    setError(null);
    setSuccess(null);
  };

  const handlePhoneChange = (value: string | undefined) => {
    const phoneValue = value || '';
    setFormData(prev => ({ ...prev, phone: phoneValue }));
    // Clear phone validation error when user starts typing
    setFieldErrors(prev => ({ ...prev, phone: '' }));
    setError(null);
    setSuccess(null);
  };

  const handleTogglePassword = (): void => setShowPassword(prev => !prev);
  const handleToggleConfirmPassword = (): void =>
    setShowConfirmPassword(prev => !prev);

  const validateForm = () => {
    const nextErrors = {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    } as typeof fieldErrors;

    if (!formData.first_name.trim()) {
      nextErrors.first_name = 'First name is required';
    }
    if (!formData.last_name.trim()) {
      nextErrors.last_name = 'Last name is required';
    }
    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      nextErrors.email = 'Please enter a valid email address';
    }
    if (!formData.phone.trim()) {
      nextErrors.phone = 'Phone number is required';
    } else if (formData.phone && formData.phone.trim()) {
      // Basic validation for phone number format
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(formData.phone)) {
        nextErrors.phone = 'Please enter a valid phone number';
      }
    }
    if (!formData.password) {
      nextErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters long';
    }
    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(nextErrors);
    let hasErrors = Object.values(nextErrors).some(Boolean);
    if (!acceptedTerms) {
      setTermsError('You must accept the Terms and Conditions');
      hasErrors = true;
    } else {
      setTermsError('');
    }
    return !hasErrors;
  };

  const isSubmitDisabled =
    loading ||
    !formData.first_name.trim() ||
    !formData.last_name.trim() ||
    !formData.email.trim() ||
    !formData.phone.trim() ||
    !formData.password ||
    !formData.confirmPassword ||
    Object.values(fieldErrors).some(Boolean) ||
    !acceptedTerms;

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setTermsError('');
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const personalDetails: PersonalDetailsRequest = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
      };

      const response = await signupApi.createPersonalDetails(personalDetails);

      setSuccess('Personal details saved successfully!');
      setSnackbar({
        open: true,
        message:
          lang === 'ar'
            ? 'تم إنشاء الحساب بنجاح!'
            : 'Personal details saved successfully!',
        severity: 'success',
      });

      // Store signupSessionId in localStorage for next steps
      localStorage.setItem('signupSessionId', response.signupSessionId);
      // Temporarily store email & password in sessionStorage so we can auto-login after payment
      // Use sessionStorage instead of localStorage so it is cleared when the tab/window closes
      try {
        sessionStorage.setItem(
          'pendingSignupCredentials',
          JSON.stringify({
            email: personalDetails.email,
            password: personalDetails.password,
          })
        );
      } catch (e) {
        // Ignore storage errors
        // Ignore storage errors
      }

      // Redirect to next step (company details) after a short delay
      setTimeout(() => {
        navigate('/signup/company-details');
      }, 2000);
    } catch (err: any) {
      // Handle different error types
      if (err.response?.data?.message) {
        const errorData = err.response.data.message;
        if (
          typeof errorData === 'object' &&
          errorData.field &&
          errorData.message
        ) {
          const field = String(errorData.field) as keyof typeof fieldErrors;
          setFieldErrors(prev => ({
            ...prev,
            [field]: String(errorData.message),
          }));
          setError(null);
        } else {
          setError(errorData);
        }
      } else if (err.response?.data?.errors) {
        const errorMessages = Object.values(err.response.data.errors).flat();
        setError(errorMessages.join(', '));
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='loginpage'>
      <Box
        className='login-scroll'
        sx={{
          height: { xs: 'auto', md: '100vh' },
          m: { xs: '14px', sm: 0 },
          position: 'relative',
        }}
      >
        <Box
          sx={{
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            direction: lang === 'ar' ? 'rtl' : 'ltr',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              margin: 'auto',
            }}
          >
            {/* Left Side */}
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                flex: 1,
                height: '100%',
                mt: 7,
              }}
            >
              <Box sx={{ mb: 7 }}>
                <svg width='4rem' fill='currentColor' viewBox='0 0 16 16'>
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
                  mb: 4,
                  fontFamily: 'Open Sans, sans-serif',
                  fontWeight: 500,
                  fontSize: '32px',
                }}
              >
                {lang === 'ar'
                  ? 'إدارة مهام أفضل مع ماي-تاسك'
                  : "My-Task Let's Management Better"}
              </Typography>
              <Box
                component='img'
                src='https://pixelwibes.com/template/my-task/react/static/media/login-img.b36c8fbd17b96828d9ba0900b843d21c.svg'
                alt='Login Illustration'
                sx={{ width: '100%', maxWidth: '400px' }}
              />
            </Box>

            {/* Right Side */}
            <Box sx={{ flex: 1, width: '100%', maxWidth: '512px' }}>
              <Paper
                elevation={4}
                sx={{
                  backgroundColor: 'var(--dark-color)',
                  color: 'common.white',
                  p: { xs: 3, md: 5 },
                  borderRadius: { xs: 2, lg: 0 },
                }}
              >
                {/* Language Selector */}
                <Box sx={{ mb: 2, maxWidth: 100 }}>
                  <FormControl size='small' fullWidth>
                    <Select
                      value={lang}
                      onChange={e => setLang(e.target.value as 'en' | 'ar')}
                      sx={{
                        bgcolor: theme => theme.palette.background.paper,
                        borderRadius: 1,
                      }}
                    >
                      <MenuItem value='en'>English</MenuItem>
                      <MenuItem value='ar'>عربى</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant='h4'
                    sx={{
                      textAlign: 'center',
                      fontWeight: 500,
                      fontSize: '28px',
                      my: 2,
                      fontFamily: 'Open Sans, sans-serif',
                    }}
                  >
                    {lang === 'ar' ? 'إنشاء حساب' : 'Create your account'}
                  </Typography>
                  {/* <Typography
                    sx={{
                      fontSize: '14px',
                      fontFamily: 'Open Sans, sans-serif',
                    }}
                  >
                    {lang === 'ar'
                      ? 'وصول مجاني إلى لوحة التحكم الخاصة بنا.'
                      : 'Free access to our dashboard.'}
                  </Typography> */}
                </Box>

                {/* Error Message */}
                {error && (
                  <Alert severity='error' sx={{ mt: 2, mb: 2 }}>
                    {error}
                  </Alert>
                )}

                <Box component='form' onSubmit={handleSubmit}>
                  {/* Names Row */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 1, mt: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        component='label'
                        htmlFor='first_name'
                        sx={{ fontWeight: 400, fontSize: '14px' }}
                      >
                        {lang === 'ar' ? 'الاسم الأول' : 'First Name'}
                      </Typography>
                      <TextField
                        name='first_name'
                        required
                        fullWidth
                        value={formData.first_name}
                        placeholder='John'
                        onChange={handleChange}
                        variant='outlined'
                        disabled={loading}
                        error={Boolean(fieldErrors.first_name)}
                        helperText={fieldErrors.first_name}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#eee',
                            borderRadius: '8px',
                            height: '46px',
                            marginTop: '5px',
                            '& fieldset': { border: 'none' },
                            '&:hover fieldset': { border: 'none' },
                            '&.Mui-focused fieldset': { border: 'none' },
                            '&:hover': { backgroundColor: '#eee' },
                            '&.Mui-focused': {
                              backgroundColor: theme =>
                                theme.palette.background.paper,
                            },
                          },
                          '& input': {
                            outline: 'none',
                            boxShadow: 'none',
                          },
                          '& input:-webkit-autofill': {
                            height: '10px',
                          },
                        }}
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        component='label'
                        htmlFor='last_name'
                        sx={{ fontWeight: 400, fontSize: '14px' }}
                      >
                        {lang === 'ar' ? 'اسم العائلة' : 'Last Name'}
                      </Typography>
                      <TextField
                        name='last_name'
                        required
                        fullWidth
                        value={formData.last_name}
                        placeholder='Parker'
                        onChange={handleChange}
                        disabled={loading}
                        error={Boolean(fieldErrors.last_name)}
                        helperText={fieldErrors.last_name}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#eee',
                            borderRadius: '8px',
                            height: '46px',
                            marginTop: '5px',
                            '& fieldset': { border: 'none' },
                            '&:hover fieldset': { border: 'none' },
                            '&.Mui-focused fieldset': { border: 'none' },
                            '&:hover': { backgroundColor: '#eee' },
                            '&.Mui-focused': {
                              backgroundColor: theme =>
                                theme.palette.background.paper,
                            },
                          },
                          '& input': {
                            outline: 'none',
                            boxShadow: 'none',
                          },
                          '& input:-webkit-autofill': {
                            height: '10px',
                          },
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Email */}
                  {/* Email and Phone Row */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 1, mt: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        component='label'
                        htmlFor='email'
                        sx={{ fontWeight: 400, fontSize: '14px' }}
                      >
                        {lang === 'ar' ? 'البريد الإلكتروني' : 'Email address'}
                      </Typography>
                      <TextField
                        name='email'
                        type='email'
                        required
                        fullWidth
                        value={formData.email}
                        placeholder='name@example.com'
                        onChange={handleChange}
                        disabled={loading}
                        error={Boolean(fieldErrors.email)}
                        helperText={fieldErrors.email}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#eee',
                            borderRadius: '8px',
                            height: '46px',
                            marginTop: '5px',
                            '& fieldset': { border: 'none' },
                            '&:hover fieldset': { border: 'none' },
                            '&.Mui-focused fieldset': { border: 'none' },
                            '&:hover': { backgroundColor: '#eee' },
                            '&.Mui-focused': {
                              backgroundColor: theme =>
                                theme.palette.background.paper,
                            },
                          },
                          '& input': {
                            outline: 'none',
                            boxShadow: 'none',
                          },
                          '& input:-webkit-autofill': {
                            height: '10px',
                          },
                        }}
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        component='label'
                        htmlFor='phone'
                        sx={{ fontWeight: 400, fontSize: '14px' }}
                      >
                        {lang === 'ar' ? 'رقم الهاتف' : 'Phone number'}
                      </Typography>
                      <TextField
                        name='phone'
                        type='tel'
                        required
                        fullWidth
                        value={formData.phone}
                        placeholder={lang === 'ar' ? 'أدخل رقم الهاتف' : 'Enter phone number'}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        disabled={loading}
                        error={Boolean(fieldErrors.phone)}
                        helperText={fieldErrors.phone}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start" sx={{ margin: 0, padding: '28px 0px' }}>
                              <PhoneInput
                                defaultCountry="ua"
                                value={formData.phone}
                                onChange={handlePhoneChange}
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
                                  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
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
                                  dropdownStyleProps: {
                                    zIndex: 9999,
                                  },
                                }}
                                className="phone-input-textfield-adornment"
                              />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            padding: '0px',
                            backgroundColor: '#eee',
                            borderRadius: '8px',
                            height: '46px',
                            marginTop: '5px',
                            '& fieldset': { border: 'none' },
                            '&:hover fieldset': { border: 'none' },
                            '&.Mui-focused fieldset': { border: 'none' },
                            '&:hover': { backgroundColor: '#eee' },
                            '&.Mui-focused': {
                              backgroundColor: theme =>
                                theme.palette.background.paper,
                            },
                          },
                          '& input': {
                            outline: 'none',
                            boxShadow: 'none',
                          },
                          '& input:-webkit-autofill': {
                            height: '10px',
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
                    </Box>
                  </Box>

                  {/* Password and Confirm Password Row */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 0.4, mt: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        component='label'
                        htmlFor='password'
                        sx={{ fontWeight: 400, fontSize: '14px' }}
                      >
                        {lang === 'ar' ? 'كلمة المرور' : 'Password'}
                      </Typography>
                      <TextField
                        name='password'
                        type={showPassword ? 'text' : 'password'}
                        required
                        fullWidth
                        value={formData.password}
                        placeholder='8+ characters required'
                        onChange={handleChange}
                        disabled={loading}
                        error={Boolean(fieldErrors.password)}
                        helperText={fieldErrors.password}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#eee',
                            borderRadius: '8px',
                            height: '46px',
                            marginTop: '5px',
                            '& fieldset': { border: 'none' },
                            '&:hover fieldset': { border: 'none' },
                            '&.Mui-focused fieldset': { border: 'none' },
                            '&:hover': { backgroundColor: '#eee' },
                            '&.Mui-focused': {
                              backgroundColor: theme =>
                                theme.palette.background.paper,
                            },
                          },
                          '& input': {
                            outline: 'none',
                            boxShadow: 'none',
                          },
                          '& input:-webkit-autofill': {
                            height: '10px',
                          },
                        }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position='end'>
                              <IconButton
                                onClick={handleTogglePassword}
                                edge='end'
                                sx={{
                                  outline: 'none',
                                  boxShadow: 'none',
                                  '&:focus': {
                                    outline: 'none',
                                    boxShadow: 'none',
                                  },
                                }}
                              >
                                {showPassword ? (
                                  <VisibilityOff
                                    sx={{ width: 21, height: 21 }}
                                  />
                                ) : (
                                  <Visibility sx={{ width: 21, height: 21 }} />
                                )}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        component='label'
                        htmlFor='confirmPassword'
                        sx={{ fontWeight: 400, fontSize: '14px' }}
                      >
                        {lang === 'ar'
                          ? 'تأكيد كلمة المرور'
                          : 'Confirm Password'}
                      </Typography>
                      <TextField
                        name='confirmPassword'
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        fullWidth
                        value={formData.confirmPassword}
                        placeholder='8+ characters required'
                        onChange={handleChange}
                        disabled={loading}
                        error={Boolean(fieldErrors.confirmPassword)}
                        helperText={fieldErrors.confirmPassword}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#eee',
                            borderRadius: '8px',
                            height: '46px',
                            marginTop: '5px',
                            '& fieldset': { border: 'none' },
                            '&:hover fieldset': { border: 'none' },
                            '&.Mui-focused fieldset': { border: 'none' },
                            '&:hover': { backgroundColor: '#eee' },
                            '&.Mui-focused': {
                              backgroundColor: theme =>
                                theme.palette.background.paper,
                            },
                          },
                          '& input': {
                            outline: 'none',
                            boxShadow: 'none',
                          },
                          '& input:-webkit-autofill': {
                            height: '10px',
                          },
                        }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position='end'>
                              <IconButton
                                onClick={handleToggleConfirmPassword}
                                edge='end'
                                sx={{
                                  outline: 'none',
                                  boxShadow: 'none',
                                  '&:focus': {
                                    outline: 'none',
                                    boxShadow: 'none',
                                  },
                                }}
                              >
                                {showConfirmPassword ? (
                                  <VisibilityOff
                                    sx={{ width: 21, height: 21 }}
                                  />
                                ) : (
                                  <Visibility sx={{ width: 21, height: 21 }} />
                                )}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FormControlLabel
                      sx={{
                        border: 'none',
                        marginLeft: 0,
                        marginRight: 0,
                        marginTop: '5px',
                      }}
                      control={
                        <Checkbox
                          checked={acceptedTerms}
                          onChange={e => setAcceptedTerms(e.target.checked)}
                          icon={
                            <Box
                              sx={{
                                width: 14,
                                height: 14,
                                bgcolor: 'white',
                                borderRadius: '4px',
                              }}
                            />
                          }
                          disableRipple
                          disabled={loading}
                          sx={{
                            padding: 0,
                            border: 'none',
                            width: 14,
                            height: 14,
                            minWidth: 14,
                            minHeight: 14,
                            boxSizing: 'border-box',
                            '&:hover': {
                              bgcolor: 'transparent',
                            },
                            '&.Mui-focusVisible': {
                              outline: 'none',
                              boxShadow: 'none',
                            },
                            '& input:-webkit-autofill': {
                              height: '10px',
                            },
                          }}
                        />
                      }
                      label={
                        <Typography
                          sx={{
                            ...(lang === 'ar' ? { mr: 1 } : { ml: 1 }),
                            fontFamily: 'Open Sans',
                            fontSize: '14px',
                          }}
                        >
                          {lang === 'ar' ? (
                            'تذكرني'
                          ) : (
                            <>
                              I accept the{' '}
                              <span
                                style={{
                                  color: 'var(--yellow-color)',
                                  fontWeight: 500,
                                }}
                              >
                                Terms and Conditions
                              </span>
                            </>
                          )}
                        </Typography>
                      }
                    />
                  </Box>
                  {termsError && (
                    <Alert severity='error' sx={{ mt: 1, mb: 1 }}>
                      {termsError}
                    </Alert>
                  )}
                  <Box
                    sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}
                  >
                    <Button
                      type='submit'
                      variant='contained'
                      disabled={isSubmitDisabled}
                      sx={{
                        backgroundColor: 'white',
                        color: 'black',
                        fontWeight: 500,
                        borderRadius: 2,
                        fontSize: '14px',
                        fontFamily: 'Open Sans, sans-serif',
                        textTransform: 'uppercase',
                        '&:hover': { backgroundColor: '#f0f0f0' },
                        '&:disabled': { backgroundColor: '#ccc' },
                      }}
                    >
                      {loading ? (
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <CircularProgress size={16} />
                          {lang === 'ar' ? 'جاري المعالجة...' : 'Processing...'}
                        </Box>
                      ) : lang === 'ar' ? (
                        'تسجيل'
                      ) : (
                        'Sign up'
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
                    {lang === 'ar'
                      ? 'هل لديك حساب؟ '
                      : 'Already have an account? '}
                    <Link
                      component={RouterLink}
                      to='/'
                      sx={{
                        color: 'var(--yellow-color)',
                        textDecoration: 'none',
                        fontWeight: 500,
                      }}
                    >
                      {lang === 'ar' ? 'تسجيل الدخول' : 'Login'}
                    </Link>
                  </Typography>
                </Box>
              </Paper>
            </Box>
          </Box>
        </Box>
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Signup;
