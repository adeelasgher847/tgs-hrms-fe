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
import authApi, { type LoginResponse } from '../api/authApi';
import { useUser } from '../hooks/useUser';
import { getStoredUser, persistAuthSession } from '../utils/authSession';

const isLoginResponsePayload = (
  payload: Record<string, unknown> | null
): payload is LoginResponse =>
  !!payload && typeof payload.accessToken === 'string';

const coerceLoginResponse = (
  payload: Record<string, unknown> | null
): LoginResponse | null => {
  if (!isLoginResponsePayload(payload)) return null;
  return {
    accessToken: payload.accessToken,
    refreshToken:
      typeof payload.refreshToken === 'string'
        ? payload.refreshToken
        : undefined,
    user: payload.user as Record<string, unknown> | undefined,
    permissions: payload.permissions as unknown[] | undefined,
    employee: payload.employee as { id?: string | number } | null | undefined,
    requiresPayment:
      typeof payload.requiresPayment === 'boolean'
        ? payload.requiresPayment
        : undefined,
    session_id:
      typeof payload.session_id === 'string' ? payload.session_id : undefined,
    signupSessionId:
      typeof payload.signupSessionId === 'string'
        ? payload.signupSessionId
        : undefined,
    company: payload.company as Record<string, unknown> | undefined,
  };
};

const cleanupPendingSignupData = () => {
  try {
    sessionStorage.removeItem('pendingSignupCredentials');
  } catch {
    // ignore
  }
  try {
    localStorage.removeItem('signupSessionId');
  } catch {
    // ignore
  }
};

const ConfirmPayment: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { updateUser, refreshUser } = useUser();

  const loginWithPendingCredentials = useCallback(async () => {
    const credsStr = sessionStorage.getItem('pendingSignupCredentials');
    if (!credsStr) return null;
    try {
      const creds = JSON.parse(credsStr) as {
        email?: string;
        password?: string;
      };
      if (!creds.email || !creds.password) return null;
      return await authApi.login({
        email: creds.email,
        password: creds.password,
      });
    } catch (err) {
      console.warn('Auto login after payment failed', err);
      return null;
    }
  }, []);

  const hydrateUserContext = useCallback(
    async (userPayload?: Record<string, unknown>) => {
      if (userPayload && Object.keys(userPayload).length) {
        try {
          updateUser(userPayload as Parameters<typeof updateUser>[0]);
        } catch {
          // ignore, refreshUser will keep context consistent
        }
      }

      try {
        await refreshUser();
      } catch (refreshErr) {
        const stored = getStoredUser<Parameters<typeof updateUser>[0]>();
        if (stored) {
          try {
            updateUser(stored);
          } catch {
            // ignore
          }
        } else {
          console.warn('Failed to refresh user after payment', refreshErr);
        }
      }
    },
    [refreshUser, updateUser]
  );

  const handlePaymentConfirmation = useCallback(async () => {
    try {
      setLoading(true);

      const sessionId = searchParams.get('session_id');
      const signupSessionId = searchParams.get('signupSessionId');
      const accessToken = localStorage.getItem('accessToken');

      const isSignupFlow = Boolean(signupSessionId);
      const isLoginFlow = Boolean(accessToken && !signupSessionId);

      if (!sessionId) {
        throw new Error('Missing payment session information');
      }

      if (!isSignupFlow && !isLoginFlow) {
        throw new Error('Invalid payment session. Please try again.');
      }

      const paymentResult = await signupApi.confirmPayment({
        signupSessionId: signupSessionId || null,
        checkoutSessionId: sessionId,
      });

      if (paymentResult.status !== 'succeeded') {
        throw new Error('Payment was not successful');
      }

      if (isSignupFlow && signupSessionId) {
        let signupResult: Record<string, unknown> | null = null;

        try {
          signupResult = (await signupApi.completeSignup({
            signupSessionId,
          })) as unknown as Record<string, unknown>;
        } catch (completeSignupError: unknown) {
          const errorPayload = completeSignupError as {
            response?: { data?: { message?: string } };
          };
          const errorMessage = errorPayload?.response?.data?.message || '';
          if (
            errorMessage.toLowerCase().includes('tenant') &&
            (errorMessage.toLowerCase().includes('already') ||
              errorMessage.toLowerCase().includes('exists') ||
              errorMessage.toLowerCase().includes('duplicate'))
          ) {
            console.log('Tenant already exists, skipping tenant creation');
          } else {
            throw completeSignupError;
          }
        }

        let loginResponse =
          (await loginWithPendingCredentials()) ||
          coerceLoginResponse(signupResult);

        if (!loginResponse) {
          throw new Error(
            'We could not automatically sign you in. Please login manually with the credentials you used during signup.'
          );
        }

        persistAuthSession(loginResponse);
        await hydrateUserContext(
          loginResponse.user as Record<string, unknown> | undefined
        );
        cleanupPendingSignupData();
      } else if (isLoginFlow) {
        await hydrateUserContext();
        try {
          localStorage.removeItem('signupSessionId');
          localStorage.removeItem('company');
          localStorage.removeItem('companyDetails');
        } catch {
          // ignore
        }
      }

      setSuccess(true);

      // Give the dashboard a brief moment to mount after context is updated
      await new Promise(resolve => setTimeout(resolve, 200));
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Payment confirmation failed');
    } finally {
      setLoading(false);
    }
  }, [searchParams, navigate, loginWithPendingCredentials, hydrateUserContext]);

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
