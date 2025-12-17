import React, { useState, useEffect, useRef } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

import {
  Box,
  Typography,
  Button,
  Link,
  Divider,
  Checkbox,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  IconButton,
  InputAdornment,
  CircularProgress,
  Alert,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import GoogleIcon from '../../assets/icons/google.svg';
import { useUser } from '../../hooks/useUser';
import { getDefaultDashboardRoute } from '../../utils/permissions';
import { useGoogleScript } from '../../hooks/useGoogleScript';
import authApi from '../../api/authApi';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../common/ErrorSnackbar';
import signupApi from '../../api/signupApi';
import { persistAuthSession } from '../../utils/authSession';
import type { UserProfile } from '../../api/profileApi';
import AppInputField from '../common/AppInputField';
import AuthSidebar from '../common/AuthSidebar';
import { Icons } from '../../assets/icons';

// Extend Window interface for Google Sign-In
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement | null,
            config: { theme?: string; size?: string }
          ) => void;
        };
      };
    };
  }
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { updateUser } = useUser();
  const { isLoaded } = useGoogleScript();
  const googleBtnRef = useRef<HTMLDivElement | null>(null);
  const googleInitializedRef = useRef<boolean>(false);
  const googleButtonRenderedRef = useRef<boolean>(false);

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
  const [error, setError] = useState<string | null>(null);
  const { snackbar, showError, closeSnackbar } = useErrorHandler();
  const [isLoading, setIsLoading] = useState(false);

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
    setError(null); // Clear general error when user types

    // Only auto-fill password if email matches remembered email exactly
    if (remembered && value === remembered.email) {
      setPassword(remembered.password);
    }
    // Don't clear password if email doesn't match - let user keep their input
  };

  const initGoogleButton = () => {
    if (!isLoaded) {
      showError('Google script not loaded yet');
      return;
    }
    try {
      if (!googleInitializedRef.current) {
        if (!window.google) {
          showError('Google Sign-In not available');
          return;
        }
        window.google.accounts.id.initialize({
          client_id:
            (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) ||
            '723870948758-ks4h9v6svagoptgt5vqj5hfbhacvcfn7.apps.googleusercontent.com',
          callback: async (response: { credential: string }) => {
            try {
              const idToken = response.credential;
              const data = await signupApi.initGoogleSignup(idToken);
              if (data?.alreadyRegistered && data.accessToken) {
                persistAuthSession({
                  accessToken: data.accessToken,
                  refreshToken: data.refreshToken,
                  user: data.user,
                  permissions: data.permissions,
                  signupSessionId: data.signupSessionId,
                });
                try {
                  if (data.user) {
                    updateUser(data.user as unknown as UserProfile);
                  }
                } catch {
                  // Ignore update error
                }
                const role =
                  typeof data.user?.role === 'string'
                    ? data.user?.role
                    : (data.user?.role as { name?: string } | undefined)?.name;
                const target = getDefaultDashboardRoute(role);
                navigate(target, { replace: true });
              } else {
                if (data.signupSessionId) {
                  localStorage.setItem('signupSessionId', data.signupSessionId);
                }
                localStorage.setItem(
                  'googleSignupPrefill',
                  JSON.stringify({
                    email: data.email,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    suggested: data.suggested,
                  })
                );
                navigate('/signup/company-details', { replace: true });
              }
            } catch {
              showError('Google Sign-In failed, please try again');
            }
          },
        });
        googleInitializedRef.current = true;
      }

      if (!googleButtonRenderedRef.current) {
        if (googleBtnRef.current) {
          googleBtnRef.current.innerHTML = '';
        }
        if (!window.google) {
          showError('Google Sign-In not available');
          return;
        }
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
        });
        googleButtonRenderedRef.current = true;
      }

      const nativeBtn = googleBtnRef.current?.querySelector(
        'div[role="button"]'
      ) as HTMLElement | null;
      if (nativeBtn) {
        nativeBtn.click();
      }
    } catch {
      showError('Failed to initialize Google Sign-In');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isLoading) return;
    setIsLoading(true);

    let valid = true;
    setEmailError('');
    setPasswordError('');
    setError(null);

    if (!email) {
      setEmailError(
        lang === 'ar'
          ? 'يرجى إدخال البريد الإلكتروني'
          : 'Please enter your email'
      );
      valid = false;
    } else if (!email.includes('@')) {
      setEmailError(
        lang === 'ar'
          ? 'يرجى إدخال بريد إلكتروني صحيح'
          : 'Please enter a valid email'
      );
      valid = false;
    }

    if (!password) {
      setPasswordError(
        lang === 'ar' ? 'يرجى إدخال كلمة المرور' : 'Please enter your password'
      );
      valid = false;
    }

    if (!valid) {
      setIsLoading(false);
      return;
    }

    try {
      const authPayload = await authApi.login({ email, password });
      persistAuthSession(authPayload);

      if (authPayload.user) {
        updateUser(authPayload.user as unknown as UserProfile);
      }

      if (rememberMe) {
        localStorage.setItem(
          'rememberedLogin',
          JSON.stringify({ email, password })
        );
      } else {
        localStorage.removeItem('rememberedLogin');
      }

      const role =
        typeof authPayload.user?.role === 'string'
          ? authPayload.user.role
          : (authPayload.user?.role as { name?: string } | undefined)?.name;

      if (authPayload.requiresPayment) {
        navigate('/signup/select-plan', { replace: true });
      } else {
        navigate(getDefaultDashboardRoute(role), { replace: true });
      }
    } catch (err: unknown) {
      const error = err as {
        response?: {
          data?: {
            field?: string;
            message?: string;
            errors?: Record<string, unknown[]>;
          };
        };
        message?: string;
      };
      const data = error?.response?.data ?? null;
      if (data?.field === 'email') {
        setEmailError(data.message || '');
        setError(null);
      } else if (data?.field === 'password') {
        setPasswordError(data.message || '');
        setError(null);
      } else if (data?.message) {
        setError(String(data.message));
      } else if (data?.errors) {
        const errorMessages = Object.values(data.errors).flat();
        setError(String(errorMessages.join(', ')));
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('Failed to login. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        backgroundColor: 'var(--white-100-color)',
        overflowX: 'hidden',
      }}
    >
      <Box
        sx={{
          width: '100%',
          // maxWidth: '1440px',
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          overflow: 'hidden',
          boxSizing: 'border-box',
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
            padding: { xs: '16px 12px', sm: '24px 16px', md: '48px' },
            backgroundColor: { xs: '#3083DC', lg: 'var(--white-100-color)' },
            overflowY: 'auto',
            overflowX: 'hidden',
            position: 'relative',
            zIndex: 1,
            marginLeft: { xs: 0, lg: '-20px' },
            paddingLeft: { xs: '12px', sm: '16px', lg: 'calc(48px + 12px)' },
            paddingRight: { xs: '12px', sm: '16px', lg: '48px' },
            marginTop: { xs: 'auto', lg: 0 },
            pt: { xs: '60px', lg: '48px' },
            boxSizing: 'border-box',
            minWidth: 0,
            borderTopLeftRadius: { xs: 0, lg: '20px' },
            borderBottomLeftRadius: { xs: 0, lg: '20px' },
          }}
        >
          <Box
            sx={{
              display: { xs: 'flex', lg: 'none' },
              position: 'absolute',
              top: { xs: 32, sm: 40 },
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 2,
              alignItems: 'center',
            }}
          >
            <Box
              component='img'
              src={Icons.logoWhite}
              alt='Logo'
              sx={{ maxHeight: 40 }}
            />
          </Box>
          <Box
            sx={{
              // maxWidth: { xs: '100%', sm: '90%' },
              width: '100%',
              mx: 'auto',
              backgroundColor: { xs: '#FFFFFF', lg: 'transparent' },
              borderRadius: { xs: '30px', lg: 0 },
              p: { xs: 2, sm: 3, md: 4 },
              mt: { xs: '60px', sm: '70px', lg: 0 },
              boxSizing: 'border-box',
              minWidth: 0,
            }}
          >
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <FormControl size='small' sx={{ minWidth: 100 }}>
                <Select
                  value={lang}
                  onChange={e => setLang(e.target.value as 'en' | 'ar')}
                >
                  <MenuItem value='en'>English</MenuItem>
                  <MenuItem value='ar'>عربى</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Typography
              variant='h1'
              sx={{
                fontSize: { xs: '32px', lg: '48px' },
                fontWeight: 700,
                mb: 1,
                color: { xs: '#001218', lg: 'inherit' },
              }}
            >
              {lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
            </Typography>
            <Typography
              sx={{
                color: { xs: '#888888', lg: 'var(--dark-grey-color)' },
                mb: 3,
                fontSize: { xs: '14px', sm: '16px', lg: '24px' },
                fontWeight: 400,
              }}
            >
              {lang === 'ar'
                ? 'وصول مجاني إلى لوحة التحكم الخاصة بنا.'
                : 'Free access to our dashboard.'}
            </Typography>
            {error && (
              <Alert
                severity='error'
                sx={{
                  mb: 2,
                  '& .MuiAlert-message': {
                    fontSize: { xs: '12px', sm: '14px' },
                  },
                }}
              >
                {error}
              </Alert>
            )}
            <Box
              component='form'
              onSubmit={handleSubmit}
              sx={{
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                overflowX: 'hidden',
              }}
            >
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <Button
                    variant='outlined'
                    onClick={initGoogleButton}
                    sx={{
                      color: 'var(--text-color)',
                      borderColor: '#BDBDBD',
                      textTransform: 'none',
                      fontSize: { xs: '12px', sm: 'var(--body-font-size)' },
                      py: 1.1,
                      px: 2,
                      mb: 1,
                      borderRadius: '12px',
                      width: '100%',
                      '&:hover': {
                        borderColor: 'var(--primary-dark-color)',
                        backgroundColor: 'transparent',
                      },
                    }}
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
                      ? 'تسجيل الدخول باستخدام جوجل'
                      : 'Sign in with Google'}
                  </Button>
                  <Box
                    id='googleBtn'
                    ref={googleBtnRef}
                    sx={{ display: 'none' }}
                  />
                </Box>
                <Divider
                  sx={{
                    color: 'var(--dark-grey-color)',
                    my: 2,
                    '&::before, &::after': { borderColor: '#BDBDBD' },
                  }}
                >
                  <Box px={1.5}>{lang === 'ar' ? 'أو' : 'OR'}</Box>
                </Divider>
              </Box>
              <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
                <AppInputField
                  name='email'
                  label={lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                  type='email'
                  required
                  fullWidth
                  value={email}
                  onChange={handleEmailChange}
                  disabled={isLoading}
                  error={Boolean(emailError)}
                  helperText={emailError}
                  placeholder='name@example.com'
                />
              </Box>
              <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 0.5,
                  }}
                >
                  <Typography
                    component='label'
                    htmlFor='password'
                    className='label'
                    sx={{
                      fontSize: { xs: '14px', lg: '20px' },
                      fontWeight: { xs: 400, lg: 600 },
                    }}
                  >
                    {lang === 'ar' ? 'كلمة المرور' : 'Password'}
                  </Typography>
                  <Link
                    component={RouterLink}
                    to='/forget'
                    sx={{
                      color: 'var(--primary-dark-color)',
                      textDecoration: 'none',
                      fontWeight: 500,
                      fontSize: { xs: '12px', sm: 'var(--body-font-size)' },
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    {lang === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                  </Link>
                </Box>
                <AppInputField
                  name='password'
                  label=''
                  type={showPassword ? 'text' : 'password'}
                  required
                  fullWidth
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    setPasswordError('');
                    setError(null);
                  }}
                  disabled={isLoading}
                  error={Boolean(passwordError)}
                  helperText={passwordError}
                  placeholder='********'
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton
                          onClick={handleTogglePassword}
                          edge='end'
                          sx={{ color: 'var(--dark-grey-color)' }}
                        >
                          {showPassword ? (
                            <VisibilityOff sx={{ width: 20, height: 20 }} />
                          ) : (
                            <Visibility sx={{ width: 20, height: 20 }} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              <Box
                sx={{
                  mb: { xs: 2, sm: 3 },
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      sx={{
                        color: 'var(--dark-grey-color)',
                        '&.Mui-checked': {
                          color: 'var(--primary-dark-color)',
                        },
                      }}
                    />
                  }
                  label={
                    <Typography
                      className='label'
                      sx={{
                        fontSize: { xs: '12px', sm: 'var(--body-font-size)' },
                      }}
                    >
                      {lang === 'ar' ? 'تذكرني' : 'Remember me'}
                    </Typography>
                  }
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Button
                  type='submit'
                  variant='contained'
                  disabled={isLoading || !email || !password}
                  sx={{
                    backgroundColor: 'var(--primary-dark-color)',
                    color: 'var(--white-color)',
                    fontWeight: 600,
                    borderRadius: 'var(--border-radius-lg)',
                    fontSize: 'var(--body-font-size)',
                    textTransform: 'none',
                    padding: { xs: '8px 32px', lg: '8px 32px' },
                    height: { xs: '40px', lg: 'auto' },
                    gap: { xs: '4px', lg: 0 },
                    width: { xs: '100%', lg: 'auto' },
                    '&:hover': {
                      backgroundColor: 'var(--primary-light-color)',
                    },
                    '&:disabled': { backgroundColor: 'var(--grey-color)' },
                  }}
                >
                  {isLoading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} color='inherit' />
                      {lang === 'ar' ? 'جاري تسجيل الدخول...' : 'Signing in...'}
                    </Box>
                  ) : lang === 'ar' ? (
                    'تسجيل الدخول'
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </Box>
              <Typography
                align='center'
                className='label'
                sx={{
                  color: 'var(--dark-grey-color)',
                  fontSize: { xs: '12px', sm: 'var(--body-font-size)' },
                }}
              >
                {lang === 'ar'
                  ? 'ليس لديك حساب بعد؟ '
                  : "Don't have an account yet? "}
                <Link
                  component={RouterLink}
                  to='/Signup'
                  sx={{
                    color: 'var(--primary-dark-color)',
                    textDecoration: 'none',
                    fontWeight: 500,
                    fontSize: 'inherit',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  {lang === 'ar' ? 'سجل هنا' : 'Sign up here'}
                </Link>
              </Typography>
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
    </Box>
  );
};

export default Login;
