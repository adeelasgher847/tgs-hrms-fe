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

const ConfirmPayment: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

      // 1. Confirm payment with Stripe
      const paymentConfirmRequest = {
        signupSessionId,
        paymentIntentId: sessionId, // Stripe session ID
      };

      console.log('Confirming payment:', paymentConfirmRequest);
      const paymentResult = await signupApi.confirmPayment(paymentConfirmRequest);
      console.log('Payment confirmation result:', paymentResult);
      
      if (paymentResult.status === 'succeeded') {
        // 2. Complete signup process
        const completeSignupRequest = {
          signupSessionId,
          transactionId: paymentResult.transactionId,
        };

        console.log('Completing signup:', completeSignupRequest);
        const signupResult = await signupApi.completeSignup(completeSignupRequest);
        console.log('Signup completion result:', signupResult);
        
        setSuccess(true);
        
        // 3. Redirect to success page
        setTimeout(() => {
          navigate('/signup/success');
        }, 3000);

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