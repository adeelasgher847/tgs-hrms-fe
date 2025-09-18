import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import signupApi from '../api/signupApi';
import axiosInstance from '../api/axiosInstance';
import { useUser } from '../hooks/useUser';

const ConfirmPayment: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { updateUser, refreshUser } = useUser();

  useEffect(() => {
    handlePaymentConfirmation();
  }, []);

  const handlePaymentConfirmation = async () => {
    try {
      setLoading(true);
      
      // Get parameters from URL
      const sessionId = searchParams.get('session_id');
      const signupSessionId = searchParams.get('signupSessionId');
      
      console.log('Payment confirmation params:', { sessionId, signupSessionId });
      
      if (!sessionId || !signupSessionId) {
        throw new Error('Missing payment session information');
      }

      // 1. Confirm payment with backend using Stripe checkout session id
      const paymentConfirmRequest = {
        signupSessionId,
        checkoutSessionId: sessionId,
      } as const;

      console.log('Confirming payment:', paymentConfirmRequest);
      const paymentResult = await signupApi.confirmPayment(paymentConfirmRequest);
      console.log('Payment confirmation result:', paymentResult);
      
      if (paymentResult.status === 'succeeded') {
        // 2. Complete signup process
        const completeSignupRequest = {
          signupSessionId,
        } as const;

        console.log('Completing signup:', completeSignupRequest);
        const signupResult = await signupApi.completeSignup(completeSignupRequest);
        console.log('Signup completion result:', signupResult);

        // If backend returned tokens and user, store them and navigate
        // Expected shape may vary; check common fields
        if ((signupResult as any).accessToken && (signupResult as any).refreshToken) {
          const data: any = signupResult as any;
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
            if (data.permissions) {
              localStorage.setItem('permissions', JSON.stringify(data.permissions));
            }
            // Update UserContext immediately so dashboard shows user without refresh
            try {
              updateUser(data.user);
            } catch (e) {
              // If updateUser fails for any reason, fallback to refresh
              try {
                await refreshUser();
              } catch {}
            }
          } else {
            // If there's no user object in response, try refreshing the user
            try {
              await refreshUser();
            } catch {}
          }
        } else {
          // Fallback: try to login using pending credentials saved in sessionStorage
          try {
            const credsStr = sessionStorage.getItem('pendingSignupCredentials');
            if (credsStr) {
              const creds = JSON.parse(credsStr);
              // Call login endpoint
              const res = await axiosInstance.post('/auth/login', {
                email: creds.email,
                password: creds.password,
              });
              if (res?.data) {
                localStorage.setItem('accessToken', res.data.accessToken);
                if (res.data.refreshToken) localStorage.setItem('refreshToken', res.data.refreshToken);
                if (res.data.user) {
                  localStorage.setItem('user', JSON.stringify(res.data.user));
                  try {
                    updateUser(res.data.user);
                  } catch (e) {
                    try {
                      await refreshUser();
                    } catch {}
                  }
                }
                if (res.data.permissions) localStorage.setItem('permissions', JSON.stringify(res.data.permissions));
              }
            }
          } catch (loginErr) {
            console.warn('Auto-login after payment failed', loginErr);
            // Don't block redirect; user can login manually
          }
        }
        console.log('Signup completion result:', signupResult);
        
        setSuccess(true);
        
        // Cleanup pending signup storage
        try {
          sessionStorage.removeItem('pendingSignupCredentials');
        } catch {}
        try {
          localStorage.removeItem('signupSessionId');
        } catch {}

        // 3. Redirect to dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);

      } else {
        throw new Error('Payment was not successful');
      }

    } catch (err: any) {
      console.error('Payment confirmation error:', err);
      setError(err.message || 'Payment confirmation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    navigate('/signup/select-plan');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#f3f4f6',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Confirming your payment...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please wait while we process your subscription
        </Typography>
      </Box>
    );
  }

  if (error) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f3f4f6',
        p: 3,
      }}
    >
        <Paper elevation={3} sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Payment Confirmation Failed
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            There was an issue confirming your payment. Please try again.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={handleRetry}
            >
              Try Again
            </Button>
            <Button
              variant="outlined"
              onClick={handleGoHome}
            >
              Go Home
              </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  if (success) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#f3f4f6',
          p: 3,
        }}
      >
        <Paper elevation={3} sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
          <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" sx={{ mb: 2, color: 'success.main' }}>
            Payment Successful!
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Your account has been created successfully. Redirecting to dashboard...
          </Typography>
          <CircularProgress size={24} />
        </Paper>
    </Box>
  );
  }

  return null;
};

export default ConfirmPayment; 