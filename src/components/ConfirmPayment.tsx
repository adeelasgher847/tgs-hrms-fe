import React, { useCallback, useEffect, useState } from 'react';
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

  const handlePaymentConfirmation = useCallback(async () => {
    try {
      setLoading(true);

      // Get parameters from URL
      const sessionId = searchParams.get('session_id');
      const signupSessionId = searchParams.get('signupSessionId');
      const accessToken = localStorage.getItem('accessToken');

      // Determine flow: signup flow has signupSessionId, login flow has accessToken but no signupSessionId
      const isSignupFlow = signupSessionId;
      const isLoginFlow = accessToken && !signupSessionId;

      if (!sessionId) {
        throw new Error('Missing payment session information');
      }

      if (!isSignupFlow && !isLoginFlow) {
        throw new Error('Invalid payment session. Please try again.');
      }

      // 1. Confirm payment with backend using Stripe checkout session id
      const paymentConfirmRequest = {
        signupSessionId: signupSessionId || null, // String for signup flow, null for login flow
        checkoutSessionId: sessionId,
      };

      const paymentResult = await signupApi.confirmPayment(
        paymentConfirmRequest
      );

      if (paymentResult.status === 'succeeded') {
        if (isSignupFlow && signupSessionId) {
          // Signup flow: Complete signup process
          // Check if tenant already exists (e.g., created by system admin or during company details step)
          // Only call completeSignup if tenant doesn't already exist
          let signupResult: Record<string, unknown> | null = null;
          
          try {
            const completeSignupRequest = {
              signupSessionId,
            } as const;

            signupResult = (await signupApi.completeSignup(
              completeSignupRequest
            )) as unknown as Record<string, unknown>;
          } catch (completeSignupError: unknown) {
            // If completeSignup fails because tenant already exists, try to get user data from payment confirmation
            const error = completeSignupError as { response?: { data?: { message?: string } } };
            const errorMessage = error?.response?.data?.message || '';
            
            // Check if error is about tenant already existing
            if (
              errorMessage.toLowerCase().includes('tenant') &&
              (errorMessage.toLowerCase().includes('already') ||
                errorMessage.toLowerCase().includes('exists') ||
                errorMessage.toLowerCase().includes('duplicate'))
            ) {
              console.log('Tenant already exists, skipping tenant creation');
              // Try to get user data from payment confirmation response or login
              // The payment confirmation might have already created/activated the user
              try {
                const credsStr = sessionStorage.getItem('pendingSignupCredentials');
                if (credsStr) {
                  const creds = JSON.parse(credsStr);
                  // Try to login to get user data
                  const loginRes = await axiosInstance.post('/auth/login', {
                    email: creds.email,
                    password: creds.password,
                  });
                  if (loginRes?.data) {
                    signupResult = loginRes.data as Record<string, unknown>;
                  }
                }
              } catch (loginErr) {
                console.warn('Failed to login after tenant exists error:', loginErr);
                // Continue with error handling below
              }
            } else {
              // Re-throw if it's a different error
              throw completeSignupError;
            }
          }

          // First, clear all existing auth data to ensure clean state
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem('permissions');

          // Now set the new user's data if available
          if (
            signupResult &&
            (signupResult as Record<string, unknown>).accessToken &&
            (signupResult as Record<string, unknown>).refreshToken
          ) {
            const data = signupResult as Record<string, unknown>;
            localStorage.setItem('accessToken', data.accessToken as string);
            localStorage.setItem('refreshToken', data.refreshToken as string);
            if (data.user) {
              localStorage.setItem('user', JSON.stringify(data.user));

              // Store tenant_id separately from login/signup response
              const userData = data.user as Record<string, unknown>;
              const tenantId = userData?.tenant_id;
              if (tenantId) {
                localStorage.setItem('tenant_id', String(tenantId));
              }

              if (data.permissions) {
                localStorage.setItem(
                  'permissions',
                  JSON.stringify(data.permissions)
                );
              }
              // Update UserContext immediately so dashboard shows user without refresh
              try {
                if (data.user && typeof data.user === 'object' && Object.keys(data.user).length > 0) {
                  updateUser(data.user as Parameters<typeof updateUser>[0]);
                }
              } catch {
                // If updateUser fails for any reason, fallback to refresh
                try {
                  await refreshUser();
                } catch {
                  // Ignore refresh errors
                }
              }
            } else {
              // If there's no user object in response, try refreshing the user
              // Fallback: try to login using pending credentials saved in sessionStorage
              try {
                const credsStr = sessionStorage.getItem(
                  'pendingSignupCredentials'
                );
                if (credsStr) {
                  const creds = JSON.parse(credsStr);
                  // Clear all existing auth data before attempting login
                  localStorage.removeItem('accessToken');
                  localStorage.removeItem('refreshToken');
                  localStorage.removeItem('user');
                  localStorage.removeItem('permissions');

                  // Call login endpoint
                  const res = await axiosInstance.post('/auth/login', {
                    email: creds.email,
                    password: creds.password,
                  });
                  if (res?.data) {
                    localStorage.setItem('accessToken', res.data.accessToken);
                    if (res.data.refreshToken)
                      localStorage.setItem(
                        'refreshToken',
                        res.data.refreshToken
                      );
                    if (res.data.user) {
                      localStorage.setItem(
                        'user',
                        JSON.stringify(res.data.user)
                      );
                      try {
                        updateUser(res.data.user);
                      } catch {
                        try {
                          await refreshUser();
                        } catch {
                          // Ignore refresh error
                        }
                      }
                    }
                    if (res.data.permissions)
                      localStorage.setItem(
                        'permissions',
                        JSON.stringify(res.data.permissions)
                      );
                  }
                }
              } catch (loginErr) {
                console.warn('Auto-login after payment failed', loginErr);
                // Don't block redirect; user can login manually
              }
            }
          }

          // Cleanup pending signup storage
          try {
            sessionStorage.removeItem('pendingSignupCredentials');
          } catch {
            // Ignore cleanup errors
          }
          try {
            localStorage.removeItem('signupSessionId');
          } catch {
            // Ignore cleanup errors
          }
        } else if (isLoginFlow) {
          // Login flow: User is already logged in, just refresh user data to get updated subscription status
          try {
            await refreshUser();
            // Wait a bit to ensure user context is updated
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch {
            // Ignore refresh errors - user is already logged in
            console.warn('Failed to refresh user after payment confirmation');
          }

          // Clean up payment-related data from localStorage for login flow
          try {
            localStorage.removeItem('signupSessionId');
            localStorage.removeItem('company');
            localStorage.removeItem('companyDetails');
          } catch {
            // Ignore cleanup errors
          }
        }

        setSuccess(true);

        // Redirect to dashboard with replace to prevent back navigation issues
        // Use a longer delay to ensure all state updates are complete
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 2000);
      } else {
        throw new Error('Payment was not successful');
      }
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Payment confirmation failed');
    } finally {
      setLoading(false);
    }
  }, [searchParams, navigate, updateUser, refreshUser]);

  useEffect(() => {
    handlePaymentConfirmation();
  }, [handlePaymentConfirmation]);

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
        <Typography variant='h6' color='text.secondary'>
          Confirming your payment...
        </Typography>
        <Typography variant='body2' color='text.secondary'>
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
          <Alert severity='error' sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Typography variant='h6' sx={{ mb: 3 }}>
            Payment Confirmation Failed
          </Typography>
          <Typography color='text.secondary' sx={{ mb: 3 }}>
            There was an issue confirming your payment. Please try again.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant='contained' onClick={handleRetry}>
              Try Again
            </Button>
            <Button variant='outlined' onClick={handleGoHome}>
              Go Home
            </Button>
          </Box>
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant='body2' color='text.secondary'>
              Already have an account?{' '}
              <Button
                variant='text'
                color='primary'
                onClick={() => navigate('/login')}
                sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
              >
                Login here
              </Button>
            </Typography>
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
          <CheckCircleIcon
            sx={{ fontSize: 80, color: 'success.main', mb: 2 }}
          />
          <Typography variant='h4' sx={{ mb: 2, color: 'success.main' }}>
            Payment Successful!
          </Typography>
          <Typography color='text.secondary' sx={{ mb: 3 }}>
            Your account has been created successfully. Redirecting to
            dashboard...
          </Typography>
          <CircularProgress size={24} />
        </Paper>
      </Box>
    );
  }

  return null;
};

export default ConfirmPayment;
