import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Link,
  Divider,
  Checkbox,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  IconButton,
  InputAdornment,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import GoogleIcon from '../assets/icons/google.svg';
import axios from 'axios';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { type AlertProps } from '@mui/material/Alert';
import { useUser } from '../hooks/useUser';
import { getDefaultDashboardRoute } from '../utils/permissions';
import { googleLoginService } from '../api/googleLoginService';

// Add global type for Google Identity Services
declare global {
  interface Window {
    google?: any;
  }
}
export interface GoogleLoginResponse {
  companyDetailsCompleted: boolean;
  accessToken: string;
  refreshToken: string;
  user: object;
  permissions: string[];
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant='filled' {...props} />;
  }
);

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { updateUser } = useUser();

  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState(false);
  const [remembered, setRemembered] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // --- Google Sign-In state ---
  const [googleReady, setGoogleReady] = useState<boolean>(false);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  const apiBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
  const googleLoginEndpoint = (import.meta.env.VITE_GOOGLE_LOGIN_ENDPOINT as string | undefined) || '/auth/google-init';

  useEffect(() => {
    const rememberedStr = localStorage.getItem('rememberedLogin');
    if (rememberedStr) {
      try {
        const parsed = JSON.parse(rememberedStr);
        setRemembered(parsed);
        setRememberMe(true);
      } catch {
        // Ignore parsing errors
      }
    }
  }, []);

  // Load Google Identity Services script once
  useEffect(() => {
    if (window.google) {
      setGoogleReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleReady(true);
    script.onerror = () => setGoogleReady(false);
    document.head.appendChild(script);
    return () => {
      // keep script in DOM; no cleanup required
    };
  }, []);

  useEffect(() => {
    // Add a small delay to prevent race conditions during logout
    const checkAuth = () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        // Determine default route based on existing user in localStorage
        try {
          const userStr = localStorage.getItem('user');
          const parsed = userStr ? JSON.parse(userStr) : null;
          const role =
            typeof parsed?.role === 'string'
              ? parsed?.role
              : parsed?.role?.name;
          const target = getDefaultDashboardRoute(role);
          navigate(target, { replace: true });
        } catch {
          navigate('/dashboard', { replace: true });
        }
      } else {
        setCheckingAuth(false);
      }
    };

    // Small delay to ensure logout cleanup is complete
    const timeoutId = setTimeout(checkAuth, 100);
    return () => clearTimeout(timeoutId);
  }, [navigate]);

  if (checkingAuth) {
    return null; // Or a loader if you want
  }

  const handleTogglePassword = (): void => setShowPassword(prev => !prev);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(''); // Clear email error when user types

    // Only auto-fill password if email matches remembered email exactly
    if (remembered && value === remembered.email) {
      setPassword(remembered.password);
    }
    // Don't clear password if email doesn't match - let user keep their input
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    let valid = true;

    // Clear previous errors
    setEmailError('');
    setPasswordError('');

    if (!email) {
      setEmailError(
        lang === 'ar'
          ? 'ÙŠØ±Ø¬Ù‰ Ø¥Ø¯Ø®Ø§Ù„ Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ'
          : 'Please enter your email'
      );
      valid = false;
    } else if (!email.includes('@')) {
      setEmailError(
        lang === 'ar'
          ? 'ÙŠØ±Ø¬Ù‰ Ø¥Ø¯Ø®Ø§Ù„ Ø¨Ø±ÙŠØ¯ Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ ØµØ­ÙŠØ­'
          : 'Please enter a valid email address'
      );
      valid = false;
    }

    if (!password) {
      setPasswordError(
        lang === 'ar' ? 'ÙŠØ±Ø¬Ù‰ Ø¥Ø¯Ø®Ø§Ù„ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±' : 'Please enter your password'
      );
      valid = false;
    }

    if (!valid) return;

    try {
      const res = await googleApi.initGoogleSignup(
        `${import.meta.env.VITE_API_BASE_URL}/auth/login`,
        {
          email,
          password,
        }
      );
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('permissions', JSON.stringify(res.data.permissions));
      // Update user context without causing re-render
      try {
        updateUser(res.data.user);
      } catch {
        /* Error handled silently */
      }

      if (rememberMe) {
        localStorage.setItem(
          'rememberedLogin',
          JSON.stringify({ email, password })
        );
      } else {
        localStorage.removeItem('rememberedLogin');
      }
      setSnackbar({
        open: true,
        message: lang === 'ar' ? 'ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø¨Ù†Ø¬Ø§Ø­!' : 'Login Successful!',
        severity: 'success',
      });

      // Navigate immediately to role-specific default route
      const role =
        typeof res.data.user?.role === 'string'
          ? res.data.user?.role
          : res.data.user?.role?.name;
      const target = getDefaultDashboardRoute(role);
      navigate(target, { replace: true });
    } catch (err: unknown) {
      // Backend may send { field: 'email' | 'password', message: string }
      const data =
        err && typeof err === 'object' && 'response' in err
          ? (
              err as {
                response: { data: { field?: string; message?: string } };
              }
            ).response.data
          : null;
      if (data?.field === 'email') {
        setEmailError(data.message || '');
        setPasswordError('');
      } else if (data?.field === 'password') {
        setPasswordError(data.message || '');
        setEmailError('');
      } else {
        setEmailError('');
        setPasswordError('');
        // No snackbar for error
      }
    }
  };

  // Simplified Google Sign-In handler
  const handleGoogleSignInClick = async () => {
    if (!googleClientId) {
      setSnackbar({
        open: true,
        severity: 'error',
        message: 'Google Client ID not configured',
      });
      return;
    }

    if (!googleReady || !window.google?.accounts?.id) {
      setSnackbar({
        open: true,
        severity: 'error',
        message: 'Google Sign-In service not loaded',
      });
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response: { credential?: string }) => {
          if (!response.credential) {
            setSnackbar({
              open: true,
              severity: 'error',
              message: 'No Google ID token received',
            });
            return;
          }

          try {
            // Send token to backend
            const result = await googleLoginService.loginWithGoogle(response.credential);
            console.log(result);

            if (result.companyDetailsCompleted === false) {
              // First time user, needs to complete company details
              localStorage.setItem('signupSessionId', result.signupSessionId);
              navigate('/signup/company-details');
              return; // Stop further execution
            }

            if (result.user) {
              // Existing user, normal login flow
              localStorage.setItem('accessToken', result.accessToken!);
              localStorage.setItem('refreshToken', result.refreshToken!);
              localStorage.setItem('user', JSON.stringify(result.user));
              localStorage.setItem('permissions', JSON.stringify(result.permissions));
              setSnackbar({
                open: true,
                message: 'Login Successful!',
                severity: 'success',
              });
              const role = typeof result.user?.role === 'string'
                ? result.user?.role
                : result.user?.role?.name;
              const target = getDefaultDashboardRoute(role);
              navigate(target, { replace: true });
            }
          } catch (error) {
            setSnackbar({
              open: true,
              severity: 'error',
              message: 'Google login failed',
            });
          }
        },
      });

      // Show Google Sign-In popup
      window.google.accounts.id.prompt();
    } catch (error) {
      setSnackbar({
        open: true,
        severity: 'error',
        message: 'Could not initialize Google Sign-In',
      });
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
            // display: "flex",
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
              // gap: "2px",
              height: '100%',
              margin: 'auto',
            }}
          >
            {/* Left Side - Image and Title */}
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
                  mb: 4,
                  fontFamily: 'Open Sans, sans-serif',
                  fontWeight: 500,
                  fontSize: '32px',
                }}
              >
                {lang === 'ar'
                  ? 'Ø¥Ø¯Ø§Ø±Ø© Ù…Ù‡Ø§Ù… Ø£ÙØ¶Ù„ Ù…Ø¹ Ù…Ø§ÙŠ-ØªØ§Ø³Ùƒ'
                  : "My-Task Let's Management Better"}
              </Typography>
              <Box
                component='img'
                src='https://pixelwibes.com/template/my-task/react/static/media/login-img.b36c8fbd17b96828d9ba0900b843d21c.svg'
                alt='Login Illustration'
                sx={{ width: '100%', maxWidth: '400px' }}
              />
            </Box>

            {/* Right Side - Login Form */}
            <Box sx={{ flex: 1, width: '100%', maxWidth: '512px' }}>
              <Paper
                elevation={4}
                sx={{
                  backgroundColor: 'var(--dark-color)',
                  color: 'common.white',
                  p: { xs: 3, md: 7 },
                  pt: { xs: 1, md: 2 },
                  pb: { xs: 1, md: 2 },
                  borderRadius: { xs: 2, lg: 0 },
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  direction: lang === 'ar' ? 'rtl' : 'ltr',
                }}
              >
                {/* Language Selector */}
                <Box sx={{ mb: { xs: 1, md: 1 }, mt: 2, maxWidth: 100 }}>
                  <FormControl size='small' fullWidth>
                    <Select
                      id='language-select'
                      value={lang}
                      onChange={e => setLang(e.target.value)}
                      displayEmpty
                      sx={{
                        bgcolor: 'white',
                        borderRadius: 1,
                        fontFamily: 'Open Sans, sans-serif',
                        fontSize: 14,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#ccc',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#f19828',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#f19828',
                        },
                      }}
                      renderValue={selected => {
                        return selected === 'ar' ? 'Ø¹Ø±Ø¨Ù‰' : 'English';
                      }}
                    >
                      <MenuItem value='en'>English</MenuItem>
                      <MenuItem value='ar'>Ø¹Ø±Ø¨Ù‰</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box
                  sx={{
                    textAlign: 'center',
                    mt: { xs: 1 },
                    mb: { xs: 1, sm: 2 },
                  }}
                >
                  <Typography
                    variant='h1'
                    // fontWeight="500"
                    gutterBottom
                    sx={{
                      fontSize: '35px',
                      fontFamily: 'Open Sans, sans-serif',
                      mb: 1,
                      fontWeight: 400,
                    }}
                  >
                    {lang === 'ar' ? 'ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„' : 'Sign in'}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontFamily: 'Open Sans, sans-serif',
                    }}
                  >
                    {lang === 'ar'
                      ? 'ÙˆØµÙˆÙ„ Ù…Ø¬Ø§Ù†ÙŠ Ø¥Ù„Ù‰ Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ… Ø§Ù„Ø®Ø§ØµØ© Ø¨Ù†Ø§.'
                      : 'Free access to our dashboard.'}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Button
                      variant='outlined'
                      sx={{
                        color: 'white',
                        borderColor: '#f0f0f0',
                        textTransform: 'none',
                        fontSize: '14px',
                        fontFamily: 'Open Sans, sans-serif',
                        py: 1.1,
                        px: 2,
                        mb: 1,
                        borderRadius: 2,
                        '&:hover': {
                          bgcolor: '#f19828',
                        },
                        '&:focus': {
                          outline: 'none',
                          boxShadow: 'none',
                        },
                      }}
                      onClick={handleGoogleSignInClick}
                      disabled={!googleReady}
                    >
                      <Box
                        component='img'
                        src={GoogleIcon}
                        alt='Google logo'
                        sx={{
                          height: 16,
                          width: 16,
                          minWidth: 16,
                          ...(lang === 'ar' ? { ml: '8px' } : { mr: '8px' }),
                        }}
                      />
                      {lang === 'ar'
                        ? 'ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø¨Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø¬ÙˆØ¬Ù„'
                        : 'Sign in with Google'}
                    </Button>
                  </Box>
                  <Divider
                    sx={{
                      color: 'rgb(154, 155, 157)',
                      '&::before, &::after': { borderColor: '#f0f0f0' },
                    }}
                  >
                    <Box px={1.5}>{lang === 'ar' ? 'Ø£Ùˆ' : 'OR'}</Box>
                  </Divider>
                </Box>
                <Box
                  component='form'
                  noValidate
                  onSubmit={handleSubmit}
                  sx={{
                    '& input, & textarea, & .MuiOutlinedInput-root': {
                      outline: 'none',
                      border: 'none',
                      boxShadow: 'none',
                    },
                    '& input:focus, & textarea:focus, & .MuiOutlinedInput-root.Mui-focused':
                      {
                        outline: 'none',
                        border: 'none',
                        boxShadow: 'none',
                      },
                    '& input:hover, & textarea:hover, & .MuiOutlinedInput-root:hover':
                      {
                        outline: 'none',
                        border: 'none',
                        boxShadow: 'none',
                      },
                    // Autofill overrides (Chrome, Edge, Safari)
                    '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus':
                      {
                        WebkitTextFillColor: 'unset !important',
                        WebkitBoxShadow: 'unset !important',
                        caretColor: 'black',
                        transition: 'background-color 9999s ease-in-out 0s',
                      },
                    '& .MuiOutlinedInput-root.Mui-focused input:-webkit-autofill':
                      {
                        WebkitBoxShadow: 'unset !important',
                      },
                    // Fallback for some browsers exposing internal autofill selector
                    '& input:-internal-autofill-selected': {
                      backgroundColor: 'unset !important',
                      boxShadow: 'unset !important',
                      color: 'black',
                    },
                  }}
                >
                  <Typography
                    component='label'
                    htmlFor='email'
                    sx={{ fontWeight: 400, fontSize: '14px' }}
                  >
                    {lang === 'ar' ? 'Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ' : 'Email address'}
                  </Typography>
                  <TextField
                    fullWidth
                    required
                    id='email'
                    name='email'
                    type='email'
                    margin='normal'
                    placeholder='name@example.com'
                    sx={{ mt: 1 }}
                    value={email}
                    onChange={handleEmailChange}
                    error={Boolean(emailError)}
                    helperText={emailError}
                    FormHelperTextProps={{
                      style: { fontSize: '16px' }, // or any size you want
                    }}
                    InputProps={{
                      sx: {
                        backgroundColor: '#eee',
                        borderRadius: '8px',
                        '&.Mui-focused, &:active': {
                          backgroundColor: 'white',
                        },
                        '& fieldset': { border: 'none' },
                        '&:hover fieldset': { border: 'none' },
                        '&.Mui-focused fieldset': { border: 'none' },
                      },
                    }}
                  />
                  <Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography
                        component='label'
                        htmlFor='password'
                        sx={{ fontWeight: 400, fontSize: '14px' }}
                      >
                        {lang === 'ar' ? 'ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±' : 'Password'}
                      </Typography>
                      <Link
                        component={RouterLink}
                        underline='hover'
                        to='/forget'
                        sx={{
                          color: 'var(--yellow-color)',
                          fontWeight: 400,
                          fontSize: '14px',
                          fontFamily: 'Open Sans, sans-serif',
                          '&:hover': {
                            textDecoration: 'none',
                            color: 'var(--yellow-color)',
                            outline: 'none',
                            boxShadow: 'none',
                          },
                        }}
                      >
                        {lang === 'ar'
                          ? 'Ù†Ø³ÙŠØª ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±ØŸ'
                          : 'Forgot password?'}
                      </Link>
                    </Box>

                    <TextField
                      fullWidth
                      required
                      id='password'
                      name='password'
                      type={showPassword ? 'text' : 'password'}
                      margin='normal'
                      placeholder='********'
                      sx={{ mt: 1 }}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      error={Boolean(passwordError)}
                      helperText={passwordError}
                      FormHelperTextProps={{
                        style: { fontSize: '16px' }, // or any size you want
                      }}
                      inputProps={{
                        maxLength: 15,
                      }}
                      InputProps={{
                        sx: {
                          backgroundColor: '#eee',
                          borderRadius: '8px',
                          '&.Mui-focused': {
                            backgroundColor: 'white',
                          },
                          '& fieldset': {
                            border: 'none',
                          },
                          '&:hover fieldset': {
                            border: 'none',
                          },
                          '&.Mui-focused fieldset': {
                            border: 'none',
                          },
                        },
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
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FormControlLabel
                      sx={{
                        border: 'none',
                        marginLeft: 0,
                        marginRight: 0,
                        marginTop: 1,
                      }}
                      control={
                        <Checkbox
                          checked={rememberMe}
                          onChange={e => setRememberMe(e.target.checked)}
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
                          {lang === 'ar' ? 'ØªØ°ÙƒØ±Ù†ÙŠ' : 'Remember me'}
                        </Typography>
                      }
                      // sx={{ m: 0, fontFamily: 'Open Sans, sans-serif', fontSize: '14px' }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Button
                      type='submit'
                      variant='contained'
                      sx={{
                        mt: 2,
                        p: 1.5,
                        px: 2,
                        bgcolor: 'white',
                        color: 'black',
                        textTransform: 'uppercase',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontFamily: 'Open Sans, sans-serif',
                        outline: 'none',
                        border: 'none',
                        minWidth: 40,
                        '&:hover': {
                          bgcolor: 'grey.200',
                        },
                        '&:focus': {
                          outline: 'none',
                          border: 'none',
                        },
                      }}
                      disabled={!email || !password}
                    >
                      {lang === 'ar' ? 'ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„' : 'SIGN IN'}
                    </Button>
                  </Box>

                  <Typography
                    variant='body2'
                    align='center'
                    sx={{
                      mt: 2,
                      color: '#9a9b9d',
                      fontSize: '14px',
                      fontFamily: 'Open Sans, sans-serif',
                    }}
                  >
                    {lang === 'ar'
                      ? 'Ù„ÙŠØ³ Ù„Ø¯ÙŠÙƒ Ø­Ø³Ø§Ø¨ Ø¨Ø¹Ø¯ØŸ '
                      : "Don't have an account yet? "}
                    <Link
                      component={RouterLink}
                      to='/Signup'
                      sx={{
                        color: 'var(--yellow-color)',
                        fontWeight: 400,
                        fontFamily: 'Open Sans, sans-serif',
                        fontSize: { xs: '11px', md: '14px' },
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'none',
                          color: 'var(--yellow-color)',
                        },
                      }}
                    >
                      {lang === 'ar' ? 'Ø³Ø¬Ù„ Ù‡Ù†Ø§' : 'Sign up here'}
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
          sx={{ width: '100%', fontSize: '1rem' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Login;
