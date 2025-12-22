import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import { Box, Typography, Button, Link, CircularProgress } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import authApi from '../../api/authApi';
import { validateEmailAddress } from '../../utils/validation';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../common/ErrorSnackbar';
import AppInputField from '../common/AppInputField';
import { Icons } from '../../assets/icons';

const Forget = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { snackbar, showError, closeSnackbar } = useErrorHandler();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError('');

    if (value) {
      const error = validateEmailAddress(value);
      if (error) {
        setEmailError(error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const error = validateEmailAddress(email);
    if (error) {
      setEmailError(error);
      return;
    }

    setLoading(true);
    setEmailError('');

    try {
      const response = await authApi.forgotPassword({ email });

      if (response && response.errors) {
        setEmailError(response.message || 'Invalid email address');
        return;
      }

      if (response && response.message && !response.errors) {
        setEmailSent(true);
        setEmail('');
      } else {
        setEmail('');
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as {
          response: { status: number; data?: { message?: string } };
        };
        if (
          apiError.response.status === 400 ||
          apiError.response.status === 404 ||
          apiError.response.status === 422
        ) {
          if (apiError.response.status === 404) {
            setEmailError('Email address not found');
          } else {
            setEmailError(
              apiError.response.data?.message || 'Invalid email address'
            );
          }
        }
      } else {
        showError('Network error. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Email Sent Success Page
  if (emailSent) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          width: '100%',
          maxWidth: '100vw',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--primary-dark-color)',
          padding: { xs: 2, sm: 3 },
          position: 'relative',
          boxSizing: 'border-box',
        }}
      >
        <Box
          sx={{
            width: '100%',
            // maxWidth: { xs: '100%', sm: '400px', md: '420px' },
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mb: 6,
          }}
        >
          <Box
            component='img'
            src={Icons.logoWhite}
            alt='Workonnect.ai Logo'
            sx={{
              width: { xs: '100%' },
              maxWidth: { xs: '100%', md: '520px' },
              // height: 'auto',
              // maxHeight: { xs: 40, sm: 48 },
              objectFit: 'contain',
            }}
          />
        </Box>

        <Box
          sx={{
            backgroundColor: '#F8F8F8',
            borderRadius: '20px',
            py: { xs: 3, sm: 4, md: 5 },
            px: { xs: 3, sm: 4, md: 8 },
            width: { xs: '100%' },
            maxWidth: { xs: '100%', sm: '400px', md: '520px' },
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            boxSizing: 'border-box',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Box
              component='img'
              src={Icons.sent}
              alt='Email Sent'
              sx={{
                width: { xs: '80px', sm: '80px' },
                height: { xs: '80px', sm: '80px' },
              }}
            />
          </Box>

          <Typography
            variant='h1'
            sx={{
              fontSize: { xs: '28px', sm: '32px' },
              fontWeight: 700,
              textAlign: 'center',
              mb: 1,
              color: '#2C2C2C',
            }}
          >
            Email Sent
          </Typography>

          <Typography
            sx={{
              fontSize: { xs: '14px', sm: '16px' },
              textAlign: 'center',
              mb: 3,
              color: '#888888',
              fontWeight: 400,
            }}
          >
            Check your inbox for a reset link!
          </Typography>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
            }}
          >
            <Link
              component={RouterLink}
              to='/'
              sx={{
                color: '#656565',
                textDecoration: 'none',
                fontSize: { xs: '14px', sm: '16px' },
                fontWeight: 400,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              <Box
                component='img'
                src={Icons.back}
                alt='Back'
                sx={{
                  width: { xs: '10px', sm: '12px' },
                  height: { xs: '10px', sm: '12px' },
                }}
              />
              Back to login
            </Link>
          </Box>
        </Box>
      </Box>
    );
  }

  // Reset Password Form
  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100vw',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--primary-dark-color)',
        padding: { xs: 2, sm: 3 },
        py: { xs: 4, sm: 5, md: 6 },
        position: 'relative',
        boxSizing: 'border-box',
        gap: { sm: '16px', lg: '20px' },
      }}
    >
      <Box
        sx={{
          width: '100%',
          // maxWidth: { xs: '100%', sm: '400px', md: '420px' },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mb: 6,
        }}
      >
        <Box
          component='img'
          src={Icons.logoWhite}
          alt='Workonnect.ai Logo'
          sx={{
            width: { xs: '100%' },
            maxWidth: { xs: '100%', md: '520px' },
            // height: 'auto',
            // maxHeight: { xs: 40, sm: 48 },
            objectFit: 'contain',
          }}
        />
      </Box>

      <Box
        sx={{
          backgroundColor: '#F8F8F8',
          borderRadius: '20px',
          py: { xs: 3, sm: 4, md: 5 },
          px: { xs: 3, sm: 4, md: 8 },
          width: { xs: '100%' },
          maxWidth: { xs: '100%', sm: '400px', md: '520px' },
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          boxSizing: 'border-box',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Box
            sx={{
              width: { xs: 80, sm: 100 },
              height: { xs: 80, sm: 100 },
              borderRadius: '50%',
              backgroundColor: '#E0ECFA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LockIcon
              sx={{
                fontSize: { xs: 40, sm: 50 },
                color: 'var(--primary-dark-color)',
              }}
            />
          </Box>
        </Box>

        <Typography
          variant='h1'
          sx={{
            fontSize: { xs: '28px', sm: '32px' },
            fontWeight: 700,
            textAlign: 'center',
            mb: 1,
            color: '#2C2C2C',
          }}
        >
          Reset Password
        </Typography>

        <Typography
          sx={{
            fontSize: { xs: '14px', sm: '16px' },
            textAlign: 'center',
            mb: 4,
            color: '#888888',
            fontWeight: 400,
          }}
        >
          We'll email you a link to reset your password
        </Typography>

        <Box component='form' onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <Box sx={{ mb: 3 }}>
            <AppInputField
              name='email'
              label='Email'
              type='email'
              required
              fullWidth
              value={email}
              onChange={handleEmailChange}
              disabled={loading}
              error={Boolean(emailError)}
              helperText={emailError}
              placeholder='Waleed@xyz.com'
            />
          </Box>

          <Button
            type='submit'
            variant='contained'
            disabled={!email || Boolean(emailError) || loading}
            fullWidth
            sx={{
              backgroundColor: 'var(--primary-dark-color)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: { xs: '14px', sm: '16px' },
              textTransform: 'none',
              padding: { xs: '12px', sm: '14px' },
              borderRadius: '12px',
              mb: 3,
              // '&:hover': {
              //   backgroundColor: 'var(--primary-light-color)',
              // },
              '&:disabled': {
                backgroundColor: 'var(--grey-color)',
                color: '#FFFFFF',
              },
            }}
          >
            {loading ? (
              <CircularProgress size={20} color='inherit' />
            ) : (
              'Send an email'
            )}
          </Button>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
            }}
          >
            <Link
              component={RouterLink}
              to='/'
              sx={{
                color: '#656565',
                textDecoration: 'none',
                fontSize: { xs: '14px', sm: '16px' },
                fontWeight: 400,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              <Box
                component='img'
                src={Icons.back}
                alt='Back'
                sx={{
                  width: { xs: '10px', sm: '12px' },
                  height: { xs: '10px', sm: '12px' },
                }}
              />
              Back to login
            </Link>
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

export default Forget;
