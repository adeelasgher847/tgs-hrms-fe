import { useState, useRef } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Link,
  FormControl,
  MenuItem,
  Select,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import '../UserProfile/PhoneInput.css';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import signupApi, { type PersonalDetailsRequest } from '../../api/signupApi';
import {
  validateEmailAddress,
  validatePasswordStrength,
} from '../../utils/validation';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../Common/ErrorSnackbar';
import AppInputField from '../Common/AppInputField';
import AuthSidebar from '../Common/AuthSidebar';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [, setSuccess] = useState<string | null>(null);
  const { snackbar, showSuccess, closeSnackbar } = useErrorHandler();
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
  const [rememberMe, setRememberMe] = useState(false);
  const [termsError, setTermsError] = useState('');
  const isSubmitting = useRef(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    setFieldErrors(prev => {
      const next = { ...prev, [name]: '' };

      // Live password validation (min 8, 1 upper, 1 lower, 1 number, 1 special)
      if (name === 'password') {
        const pwd = value;
        if (!pwd) {
          next.password = '';
        } else {
          const pwdError = validatePasswordStrength(pwd);
          next.password = pwdError ?? '';
        }

        // Keep confirmPassword in sync when user changes main password
        if (formData.confirmPassword) {
          next.confirmPassword =
            pwd === formData.confirmPassword ? '' : 'Passwords do not match';
        }
      }

      // Live confirm password validation
      if (name === 'confirmPassword') {
        const confirm = value;
        const pwd = formData.password;

        if (!confirm) {
          next.confirmPassword = 'Please confirm your password';
        } else if (confirm !== pwd) {
          next.confirmPassword = 'Passwords do not match';
        } else {
          next.confirmPassword = '';
        }
      }

      return next;
    });

    setError(null);
    setSuccess(null);
  };

  const handlePhoneChange = (value: string | undefined) => {
    const phoneValue = value || '';
    setFormData(prev => ({ ...prev, phone: phoneValue }));
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
    if (formData.email.trim()) {
      const emailError = validateEmailAddress(formData.email);
      if (emailError) {
        nextErrors.email = emailError;
      }
    }
    if (!formData.phone.trim()) {
      nextErrors.phone = 'Phone number is required';
    } else if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(formData.phone)) {
        nextErrors.phone = 'Please enter a valid phone number';
      }
    }
    if (formData.password) {
      const pwdError = validatePasswordStrength(formData.password);
      if (pwdError) {
        nextErrors.password = pwdError;
      }
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

  const emailValidationError = formData.email.trim()
    ? validateEmailAddress(formData.email)
    : null;

  const isSubmitDisabled =
    loading ||
    !formData.first_name.trim() ||
    !formData.last_name.trim() ||
    !formData.email.trim() ||
    !formData.phone.trim() ||
    !formData.password ||
    !formData.confirmPassword ||
    !!emailValidationError ||
    Object.values(fieldErrors).some(Boolean) ||
    !acceptedTerms;

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    if (isSubmitting.current) {
      return;
    }

    setError(null);
    setSuccess(null);
    setTermsError('');
    if (!validateForm()) {
      return;
    }

    isSubmitting.current = true;
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
      showSuccess(
        lang === 'ar'
          ? 'تم إنشاء الحساب بنجاح!'
          : 'Personal details saved successfully!'
      );

      localStorage.setItem('signupSessionId', response.signupSessionId);
      try {
        sessionStorage.setItem(
          'pendingSignupCredentials',
          JSON.stringify({
            email: personalDetails.email,
            password: personalDetails.password,
          })
        );
      } catch {
        // Ignore storage errors
      }

      setTimeout(() => {
        navigate('/signup/company-details');
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
        setError('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
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
          overflowX: 'hidden',
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
            Create Account
          </Typography>

          <Typography
            className='body'
            sx={{
              color: 'var(--dark-grey-color)',
              mb: 4,
            }}
          >
            For business, band or celebrity.
          </Typography>

          {error && (
            <Alert severity='error' sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component='form' onSubmit={handleSubmit}>
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                mb: 2,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <AppInputField
                  name='first_name'
                  label='First Name'
                  required
                  fullWidth
                  value={formData.first_name}
                  onChange={handleChange}
                  disabled={loading}
                  error={Boolean(fieldErrors.first_name)}
                  helperText={fieldErrors.first_name}
                  placeholder='Waleed'
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <AppInputField
                  name='last_name'
                  label='Last Name'
                  required
                  fullWidth
                  value={formData.last_name}
                  onChange={handleChange}
                  disabled={loading}
                  error={Boolean(fieldErrors.last_name)}
                  helperText={fieldErrors.last_name}
                  placeholder='Ahmed'
                />
              </Box>
            </Box>

            <Box
              sx={{
                display: 'flex',
                gap: 2,
                mb: 2,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <AppInputField
                  name='email'
                  label='Email'
                  type='email'
                  required
                  fullWidth
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={e => {
                    const value = e.target.value;
                    const trimmed = value.trim();
                    const emailError = trimmed
                      ? validateEmailAddress(trimmed)
                      : null;
                    setFieldErrors(prev => ({
                      ...prev,
                      email: emailError ?? '',
                    }));
                  }}
                  disabled={loading}
                  error={Boolean(fieldErrors.email)}
                  helperText={fieldErrors.email}
                  placeholder='Waleed@xyz.com'
                />
              </Box>
              <Box
                sx={{
                  flex: 1,
                  position: 'relative',
                }}
                className='signup-phone-input'
              >
                <AppInputField
                  name='phone'
                  label='Phone #'
                  type='tel'
                  required
                  fullWidth
                  value={formData.phone}
                  onChange={e => handlePhoneChange(e.target.value)}
                  disabled={loading}
                  error={Boolean(fieldErrors.phone)}
                  helperText={fieldErrors.phone}
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
                />
              </Box>
            </Box>

            <Box
              sx={{
                display: 'flex',
                gap: 2,
                mb: 2,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <AppInputField
                  name='password'
                  label='Password'
                  type={showPassword ? 'text' : 'password'}
                  required
                  fullWidth
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  error={Boolean(fieldErrors.password)}
                  helperText={fieldErrors.password}
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
              <Box sx={{ flex: 1 }}>
                <AppInputField
                  name='confirmPassword'
                  label='Confirm Password'
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  fullWidth
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  error={Boolean(fieldErrors.confirmPassword)}
                  helperText={fieldErrors.confirmPassword}
                  placeholder='********'
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton
                          onClick={handleToggleConfirmPassword}
                          edge='end'
                          sx={{ color: 'var(--dark-grey-color)' }}
                        >
                          {showConfirmPassword ? (
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
            </Box>

            <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column' }}>
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
                label={<Typography className='label'>Remember me</Typography>}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={acceptedTerms}
                    onChange={e => setAcceptedTerms(e.target.checked)}
                    sx={{
                      color: 'var(--dark-grey-color)',
                      '&.Mui-checked': {
                        color: 'var(--primary-dark-color)',
                      },
                    }}
                  />
                }
                label={
                  <Typography className='label'>
                    I agree to all the{' '}
                    <Link
                      href='#'
                      sx={{
                        color: 'var(--primary-dark-color)',
                        textDecoration: 'none',
                        fontWeight: 500,
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      Terms
                    </Link>{' '}
                    and{' '}
                    <Link
                      href='#'
                      sx={{
                        color: 'var(--primary-dark-color)',
                        textDecoration: 'none',
                        fontWeight: 500,
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      Privacy policy
                    </Link>
                  </Typography>
                }
              />
            </Box>
            {termsError && (
              <Alert severity='error' sx={{ mb: 2 }}>
                {termsError}
              </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Button
                type='submit'
                variant='contained'
                disabled={isSubmitDisabled}
                sx={{
                  backgroundColor: 'var(--primary-dark-color)',
                  color: 'var(--white-color)',
                  fontWeight: 600,
                  borderRadius: 'var(--border-radius-lg)',
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
                  'Sign Up'
                )}
              </Button>
            </Box>

            <Typography
              align='center'
              className='label'
              sx={{ color: 'var(--dark-grey-color)' }}
            >
              Don't have an account?{' '}
              <Link
                component={RouterLink}
                to='/'
                sx={{
                  color: 'var(--primary-dark-color)',
                  textDecoration: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Log In
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
  );
};

export default Signup;
