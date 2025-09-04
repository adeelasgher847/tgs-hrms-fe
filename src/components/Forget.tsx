import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Link,
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import ForgetImage from '../assets/icons/forget-image.svg';
import authApi from '../api/authApi';

const Forget = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [openToast, setOpenToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error'>('success');

  const validateEmail = (value: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (value.length > 0 && !validateEmail(value)) {
      setEmailError(true);
      setEmailErrorMessage(lang === 'ar' ? 'بريد إلكتروني غير صالح' : 'Invalid email');
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setEmailError(true);
      setEmailErrorMessage(lang === 'ar' ? 'بريد إلكتروني غير صالح' : 'Invalid email address');
      return;
    }
    
    setLoading(true);
    setEmailError(false);
    setEmailErrorMessage('');

    try {
      const response = await authApi.forgotPassword({ email });

  
      if (response && response.error) {
        setEmailError(true);
        setEmailErrorMessage(response.message || response.error || (lang === 'ar' ? 'بريد إلكتروني غير صالح' : 'Invalid email address'));
        return;
      }

      // Check if response has success message
      if (response && response.message && !response.error) {
        setToastMessage(response.message);
        setToastSeverity('success');
        setOpenToast(true);
        setEmail('');
      } else {
        setEmail('');
      }
    } catch (error: any) {
      console.error('Error sending reset link:', error);
      
      if (error?.response?.status === 400 || error?.response?.status === 404 || error?.response?.status === 422) {
        setEmailError(true);
        if (error?.response?.status === 404) {
          setEmailErrorMessage(lang === 'ar' ? 'البريد الإلكتروني غير موجود' : 'Email address not found');
        } else {
          setEmailErrorMessage(error?.response?.data?.message || (lang === 'ar' ? 'بريد إلكتروني غير صالح' : 'Invalid email address'));
        }
      } else {
        // Only show toast for genuine network/connection errors
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
            // display: "flex",
            justifyContent: 'center',
            alignItems: 'center',
            gap: { xs: 1 },
            direction: lang === 'ar' ? 'rtl' : 'ltr',
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

            {/* Right Side - Forget Form */}
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
                  direction: lang === 'ar' ? 'rtl' : 'ltr',
                }}
              >
                {/* Language Selector */}
                <Box sx={{ mt: 2, maxWidth: 100 }}>
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
                      renderValue={selected =>
                        selected === 'ar' ? 'عربى' : 'English'
                      }
                    >
                      <MenuItem value='en'>English</MenuItem>
                      <MenuItem value='ar'>عربى</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

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
                    alt='Login Illustration'
                    sx={{
                      width: '100%',
                      maxWidth: 240,
                      height:'180px',
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
                          fontSize: { xs: '22px', md: '40px' },
                          fontFamily: 'Open Sans, sans-serif',
                          mb: 1,
                          fontWeight: 500,
                        }}
                      >
                        {lang === 'ar' ? 'تسجيل الدخول' : 'Forgot password?'}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: { xs: '12px', md: '14px' },
                          fontFamily: 'Open Sans, sans-serif',
                          textAlign: 'center',
                        }}
                      >
                        {lang === 'ar'
                          ? 'وصول مجاني إلى لوحة التحكم الخاصة بنا.'
                          : 'Enter the email address you used when you joined and we shall send you instructions to reset your password.'}
                      </Typography>
                    </Box>

                    <Typography
                      component='label'
                      htmlFor='email'
                      sx={{ fontWeight: 400, fontSize: '14px' }}
                    >
                      {lang === 'ar' ? 'البريد الإلكتروني' : 'Email address'}
                    </Typography>
                    <TextField
                      fullWidth
                      required
                      id='email'
                      name='email'
                      type='email'
                      margin='normal'
                      placeholder='name@example.com'
                      value={email}
                      onChange={handleEmailChange}
                      error={emailError}
                      helperText={emailErrorMessage}
                      FormHelperTextProps={{
                        sx: { fontSize: '15px' },
                      }}
                      sx={{ mt: 1 ,
                                // Autofill overrides (Chrome, Edge, Safari)
                    '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus': {
                      WebkitTextFillColor: 'unset !important',
                      WebkitBoxShadow: 'unset !important',
                      caretColor: 'black',
                      transition: 'background-color 9999s ease-in-out 0s',
                    },
                    '& .MuiOutlinedInput-root.Mui-focused input:-webkit-autofill': {
                      WebkitBoxShadow: 'unset !important',
                    },
                    // Fallback for some browsers exposing internal autofill selector
                    '& input:-internal-autofill-selected': {
                      backgroundColor: 'unset !important',
                      boxShadow: 'unset !important',
                      color: 'black',
                    },
                      }}
                      InputProps={{
                        sx: {
                             backgroundColor: '#eee',
                        borderRadius: '8px',
                        '&.Mui-focused, &:active': {
                          backgroundColor: 'white',
                        },
                        "& fieldset": {border: "none"},
                         "&:hover fieldset": {border: "none"},
                         "&.Mui-focused fieldset": {border: "none"},
                        },
                      }}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Button
                        type='submit'
                        variant='contained'
                        disabled={!email || emailError || loading}
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
                        ) : lang === 'ar' ? (
                          'إرسال رابط إعادة التعيين'
                        ) : (
                          'Send Reset Link'
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
                        {lang === 'ar' ? 'سجل هنا' : 'Back to Sign in'}
                      </Link>
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Box>
          </Box>
        </Box>
      </Box>
      {/*Snackbar Toast */}
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

export default Forget;
