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
} from '@mui/material';
import signupApi, { type PersonalDetailsRequest } from '../api/signupApi';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!formData.first_name.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.last_name.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

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
        phone: formData.phone.trim() || undefined,
      };

      console.log('Sending data:', personalDetails);
      const response = await signupApi.createPersonalDetails(personalDetails);
      
      setSuccess('Personal details saved successfully!');
      
      // Store signupSessionId in localStorage for next steps
      localStorage.setItem('signupSessionId', response.signupSessionId);
      
      // Redirect to next step (company details) after a short delay
      setTimeout(() => {
        navigate('/signup/company-details');
      }, 2000);

    } catch (err: any) {
      console.error('Signup error:', err);
      
      // Handle different error types
      if (err.response?.data?.message) {
        const errorData = err.response.data.message;
        if (typeof errorData === 'object' && errorData.field && errorData.message) {
          setError(`${errorData.field}: ${errorData.message}`);
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
                      mb: 1,
                      fontFamily: 'Open Sans, sans-serif',
                    }}
                  >
                    {lang === 'ar' ? 'إنشاء حساب' : 'Create your account'}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontFamily: 'Open Sans, sans-serif',
                    }}
                  >
                    {lang === 'ar'
                      ? 'وصول مجاني إلى لوحة التحكم الخاصة بنا.'
                      : 'Free access to our dashboard.'}
                  </Typography>
                </Box>

                {/* Error/Success Messages */}
                {error && (
                  <Alert severity='error' sx={{ mt: 2, mb: 2 }}>
                    {error}
                  </Alert>
                )}
                {success && (
                  <Alert severity='success' sx={{ mt: 2, mb: 2 }}>
                    {success}
                  </Alert>
                )}

                <Box component='form' onSubmit={handleSubmit}>
                  {/* Full Name (First + Last) */}
                  <Typography
                    component='label'
                    htmlFor='Full Name'
                    sx={{ fontWeight: 400, fontSize: '14px' }}
                  >
                    {lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1, mt: 1 }}>
                    <TextField
                      name='first_name'
                      required
                      fullWidth
                      value={formData.first_name}
                      placeholder='John'
                      onChange={handleChange}
                      variant='outlined'
                      disabled={loading}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#eee',
                          borderRadius: '8px',
                          height: '46px',
                          '& fieldset': { border: 'none' },
                          '&:hover fieldset': { border: 'none' },
                          '&.Mui-focused fieldset': { border: 'none' },
                          '&:hover': { backgroundColor: '#eee' },
                          '&.Mui-focused': {
                            backgroundColor: theme => theme.palette.background.paper,
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

                    <TextField
                      name='last_name'
                      required
                      fullWidth
                      value={formData.last_name}
                      placeholder='Parker'
                      onChange={handleChange}
                      disabled={loading}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#eee',
                          borderRadius: '8px',
                          height: '46px',
                          '& fieldset': { border: 'none' },
                          '&:hover fieldset': { border: 'none' },
                          '&.Mui-focused fieldset': { border: 'none' },
                          '&:hover': { backgroundColor: '#eee' },
                          '&.Mui-focused': {
                            backgroundColor: theme => theme.palette.background.paper,
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

                  {/* Email */}
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
                    sx={{
                      mb: 1,
                      mt: 1,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#eee',
                        borderRadius: '8px',
                        height: '46px',
                        '& fieldset': { border: 'none' },
                        '&:hover fieldset': { border: 'none' },
                        '&.Mui-focused fieldset': { border: 'none' },
                        '&:hover': { backgroundColor: '#eee' },
                        '&.Mui-focused': {
                          backgroundColor: theme => theme.palette.background.paper,
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

                  {/* Phone (Optional) */}
                  <Typography
                    component='label'
                    htmlFor='phone'
                    sx={{ fontWeight: 400, fontSize: '14px' }}
                  >
                    {lang === 'ar' ? 'رقم الهاتف (اختياري)' : 'Phone Number (Optional)'}
                  </Typography>
                  <TextField
                    name='phone'
                    type='tel'
                    fullWidth
                    value={formData.phone}
                    placeholder='+923001234567'
                    onChange={handleChange}
                    disabled={loading}
                    sx={{
                      mb: 1,
                      mt: 1,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#eee',
                        borderRadius: '8px',
                        height: '46px',
                        '& fieldset': { border: 'none' },
                        '&:hover fieldset': { border: 'none' },
                        '&.Mui-focused fieldset': { border: 'none' },
                        '&:hover': { backgroundColor: '#eee' },
                        '&.Mui-focused': {
                          backgroundColor: theme => theme.palette.background.paper,
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

                  {/* Password */}
                  <Typography
                    component='label'
                    htmlFor='password'
                    sx={{ fontWeight: 400, fontSize: '14px' }}
                  >
                    {lang === 'ar' ? 'كلمة المرور' : 'Password'}
                  </Typography>
                  <TextField
                    name='password'
                    type='password'
                    required
                    fullWidth
                    value={formData.password}
                    placeholder='8+ characters required'
                    onChange={handleChange}
                    disabled={loading}
                    sx={{
                      mb: 1,
                      mt: 1,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#eee',
                        borderRadius: '8px',
                        height: '46px',
                        '& fieldset': { border: 'none' },
                        '&:hover fieldset': { border: 'none' },
                        '&.Mui-focused fieldset': { border: 'none' },
                        '&:hover': { backgroundColor: '#eee' },
                        '&.Mui-focused': {
                          backgroundColor: theme => theme.palette.background.paper,
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

                  {/* Confirm Password */}
                  <Typography
                    component='label'
                    htmlFor='confirmPassword'
                    sx={{ fontWeight: 400, fontSize: '14px' }}
                  >
                    {lang === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                  </Typography>
                  <TextField
                    name='confirmPassword'
                    type='password'
                    required
                    fullWidth
                    value={formData.confirmPassword}
                    placeholder='8+ characters required'
                    onChange={handleChange}
                    disabled={loading}
                    sx={{
                      mb: 0.4,
                      mt: 1,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#eee',
                        borderRadius: '8px',
                        height: '46px',
                        '& fieldset': { border: 'none' },
                        '&:hover fieldset': { border: 'none' },
                        '&.Mui-focused fieldset': { border: 'none' },
                        '&:hover': { backgroundColor: '#eee' },
                        '&.Mui-focused': {
                          backgroundColor: theme => theme.palette.background.paper,
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
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FormControlLabel
                      sx={{
                        border: 'none',
                        marginLeft: 0,
                        marginRight: 0,
                        marginTop: 0,
                      }}
                      control={
                        <Checkbox
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
                  <Box
                    sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}
                  >
                    <Button
                      type='submit'
                      variant='contained'
                      disabled={loading}
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CircularProgress size={16} />
                          {lang === 'ar' ? 'جاري المعالجة...' : 'Processing...'}
                        </Box>
                      ) : (
                        lang === 'ar' ? 'تسجيل' : 'Sign up'
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
    </div>
  );
};

export default Signup;