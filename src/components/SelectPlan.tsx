import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import signupApi, { type SubscriptionPlan } from '../api/signupApi';

// Default plans as fallback
const defaultPlans = [
  {
    id: 'basic',
    name: 'Basic',
    price: '$9',
    duration: 'Month',
    features: [
      { text: 'Up to 10 employees', included: true },
      { text: 'Basic HR features', included: true },
      { text: 'Email support', included: true },
      { text: 'Advanced analytics', included: false },
      { text: 'API access', included: false },
    ],
    popular: false,
  },
  {
    id: 'standard',
    name: 'Standard',
    price: '$19',
    duration: 'Month',
    features: [
      { text: 'Up to 50 employees', included: true },
      { text: 'All basic features', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Priority support', included: true },
      { text: 'API access', included: false },
    ],
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$30',
    duration: 'Month',
    features: [
      { text: 'Unlimited employees', included: true },
      { text: 'All standard features', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Priority support', included: true },
      { text: 'API access', included: true },
    ],
    popular: false,
  },
];

const SelectPlan: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState(defaultPlans);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // Check if user has signupSessionId and company details, redirect if not
  useEffect(() => {
    const signupSessionId = localStorage.getItem('signupSessionId');
    const companyDetails = localStorage.getItem('companyDetails');

    if (!signupSessionId || !companyDetails) {
      navigate('/Signup');
      return;
    }

    // Fetch subscription plans from API
    fetchPlans();
  }, [navigate]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const subscriptionPlans: SubscriptionPlan[] =
        await signupApi.getSubscriptionPlans();

      // Fetch Stripe prices using stripePriceId from each plan
      const priceIds = subscriptionPlans
        .map(p => p.stripePriceId)
        .filter((id): id is string => Boolean(id));


      let priceInfoByPriceId: Record<
        string,
        { formatted: string; intervalLabel: string }
      > = {};
      if (priceIds.length > 0) {
        try {
          // Try to fetch prices from backend using Stripe price IDs
          const prices = await signupApi.getStripePrices(priceIds);
          priceInfoByPriceId = (prices || []).reduce(
            (acc, pr: any) => {
              const amount =
                typeof pr.unit_amount === 'number' ? pr.unit_amount : 0;
              const currency = pr.currency?.toUpperCase?.() || 'USD';
              const interval = pr.interval || 'month';
              const formattedAmount = new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency,
                currencyDisplay: 'symbol',
                maximumFractionDigits: 2,
              }).format(amount / 100);
              const intervalLabel =
                interval.charAt(0).toUpperCase() + interval.slice(1);
              acc[pr.priceId] = { formatted: formattedAmount, intervalLabel };
              return acc;
            },
            {} as Record<string, { formatted: string; intervalLabel: string }>
          );
        } catch (priceErr) {
          // Fallback to default prices if API is not available
          // Fallback: Use default prices based on plan index
          priceIds.forEach((priceId, index) => {
            const fallbackPrices = ['$9', '$19', '$30'];
            const fallbackIntervals = ['Month', 'Month', 'Month'];
            priceInfoByPriceId[priceId] = {
              formatted: fallbackPrices[index] || '$0',
              intervalLabel: fallbackIntervals[index] || 'Month',
            };
          });
        }
      }

      // Transform API data to match our UI structure
      const transformedPlans = subscriptionPlans.map((plan, index) => {
        const descriptionText = plan.description || '';
        // Split description into bullet points by common delimiters
        const bullets = descriptionText
          .split(/\r?\n|\u2022|\||;|\./)
          .map(s => s.trim())
          .filter(Boolean);

        const features =
          bullets.length > 0
            ? bullets.map(b => ({ text: b, included: true }))
            : [{ text: 'Includes core features', included: true }];

        const priceInfo = plan.stripePriceId
          ? priceInfoByPriceId[plan.stripePriceId]
          : undefined;
        const price = priceInfo ? priceInfo.formatted : '$—';
        const duration = priceInfo ? priceInfo.intervalLabel : 'Month';

        return {
          id: plan.id,
          name: plan.name,
          price,
          duration,
          description: descriptionText,
          features,
          popular: index === 1,
        };
      });

      setPlans(transformedPlans);
    } catch (err: any) {
      console.error('Error fetching plans:', err);
      setError('Failed to load subscription plans. Using default plans.');
      // Keep default plans as fallback
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleContinue = async () => {
    if (!selectedPlan) {
      setError('Please select a plan to continue');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const signupSessionId = localStorage.getItem('signupSessionId');
      const companyDetails = JSON.parse(
        localStorage.getItem('companyDetails') || '{}'
      );


      if (!signupSessionId) {
        throw new Error('Signup session not found. Please start over.');
      }

      // 1. Save company details with selected plan
      const companyDetailsRequest = {
        signupSessionId,
        companyName: companyDetails.companyName,
        domain: companyDetails.domain,
        planId: selectedPlan,
      };

      const companyResult = await signupApi.createCompanyDetails(
        companyDetailsRequest
      );

      // 2. Create Stripe Checkout Session
      const paymentRequest = {
        signupSessionId,
        mode: 'checkout' as const, // Use Stripe Checkout
      };

      const checkoutSession = await signupApi.createPayment(paymentRequest);

      setSnackbar({
        open: true,
        message: 'Redirecting to secure payment...',
        severity: 'success',
      });

      // 3. Redirect to Stripe Checkout
      if (checkoutSession.url) {
        window.location.href = checkoutSession.url;
      } else {
        throw new Error('No checkout URL received from server');
      }
    } catch (err: any) {

      let errorMessage = 'Failed to create payment session. Please try again.';

      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        } else if (err.response.data.details) {
          errorMessage = err.response.data.details;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/signup/company-details');
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: '#f3f4f6',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
        }}
      >
        <CircularProgress size={60} />
        <Typography sx={{ color: '#4b5563', mt: 2 }}>
          Loading subscription plans...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#f3f4f6',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        py: 6,
      }}
    >
      {/* Heading */}
      <Typography
        variant='h4'
        sx={{ color: '#111827', fontWeight: 700, mb: 1 }}
      >
        Choose Your Plan
      </Typography>
      <Typography sx={{ color: '#4b5563', mb: 5 }}>
        You can take the plan of your choice
      </Typography>

      {/* Error Message */}
      {error && (
        <Alert severity='error' sx={{ mb: 3, maxWidth: 600 }}>
          {error}
        </Alert>
      )}

      {/* Plans */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={3}
        sx={{ width: '100%', maxWidth: '1300px' }}
      >
        {plans.map(plan => (
          <Paper
            key={plan.id}
            onClick={() => handlePlanSelect(plan.id)}
            sx={{
              flex: 1,
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow:
                selectedPlan === plan.id
                  ? '0 12px 28px rgba(72, 76, 127, 0.3)'
                  : '0 8px 24px rgba(0,0,0,0.12)',
              position: 'relative',
              bgcolor: selectedPlan === plan.id ? '#f8f9ff' : '#ffffff',
              border:
                selectedPlan === plan.id
                  ? '2px solid #484c7f'
                  : '2px solid transparent',
              transition:
                'transform 250ms ease, box-shadow 250ms ease, border 250ms ease',
              transformOrigin: 'center',
              willChange: 'transform',
              cursor: 'pointer',
              '&:hover': {
                transform: 'scale(1.02)',
                boxShadow: '0 12px 28px rgba(0,0,0,0.18)',
              },
            }}
          >
            {/* Top Header with wave */}
            <Box sx={{ position: 'relative', bgcolor: 'transparent' }}>
              <Box
                sx={{
                  background:
                    'linear-gradient(180deg, #484c7f 0%, #484c7f 100%)',
                  color: 'white',
                  p: 3,
                  pb: 8,
                  position: 'relative',
                }}
              >
                {/* Title left */}
                <Typography
                  variant='h4'
                  sx={{ fontWeight: 800, letterSpacing: 0.2 }}
                >
                  {plan.name}
                </Typography>
                {/* Price top-right */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    textAlign: 'right',
                  }}
                >
                  <Typography
                    component='div'
                    sx={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}
                  >
                    {plan.price}
                  </Typography>
                  <Typography
                    component='div'
                    sx={{ fontSize: 12, opacity: 0.9 }}
                  >
                    {plan.duration}
                  </Typography>
                </Box>
              </Box>
              {/* Wave shape overlay */}
              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: -1,
                  height: 64,
                  overflow: 'hidden',
                }}
              >
                <svg
                  width='100%'
                  height='100%'
                  viewBox='0 0 400 64'
                  preserveAspectRatio='none'
                >
                  <path
                    d='M0,10 C80,60 200,0 400,48 L400,80 L0,80 Z'
                    fill='#ffffff'
                  />
                </svg>
              </Box>
              {plan.popular && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 16,
                    left: -28,
                    bgcolor: 'white',
                    color: '#111827',
                    px: 4,
                    py: '2px',
                    transform: 'rotate(-45deg)',
                    fontSize: '12px',
                    fontWeight: 700,
                    boxShadow: 1,
                  }}
                >
                  Popular
                </Box>
              )}
            </Box>

            {/* Features */}
            <Box sx={{ p: 3, pt: 4 }}>
              {plan.features.map((feature, idx) => (
                <Stack
                  key={idx}
                  direction='row'
                  spacing={1}
                  alignItems='center'
                  sx={{ mb: 1.25 }}
                >
                  {feature.included ? (
                    <CheckIcon sx={{ color: '#16a34a', fontSize: 20 }} />
                  ) : (
                    <CloseIcon sx={{ color: '#dc2626', fontSize: 20 }} />
                  )}
                  <Typography sx={{ color: '#1f2937', fontSize: 14 }}>
                    {feature.text}
                  </Typography>
                </Stack>
              ))}
            </Box>

            {/* Button */}
            <Box sx={{ textAlign: 'center', pb: 3 }}>
              <Button
                onClick={e => {
                  e.stopPropagation();
                  handlePlanSelect(plan.id);
                }}
                sx={{
                  background:
                    selectedPlan === plan.id
                      ? 'linear-gradient(90deg, #16a34a 0%, #16a34a 100%)'
                      : 'linear-gradient(90deg, #484c7f 0%, #484c7f 100%)',
                  color: 'white',
                  borderRadius: '999px',
                  px: 5,
                  py: 1.25,
                  boxShadow:
                    selectedPlan === plan.id
                      ? '0 6px 16px rgba(22, 163, 74, 0.4)'
                      : '0 6px 16px rgba(42, 18, 179, 0.4)',
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  '&:hover': {
                    background:
                      selectedPlan === plan.id
                        ? 'linear-gradient(90deg,rgb(21, 128, 61) 0%,rgb(22, 163, 74) 100%)'
                        : 'linear-gradient(90deg,rgb(87, 91, 144) 0%,rgb(91, 95, 152) 100%)',
                  },
                }}
              >
                {selectedPlan === plan.id ? 'SELECTED' : 'SELECT'}
              </Button>
            </Box>
          </Paper>
        ))}
      </Stack>

      {/* Navigation Buttons */}
      <Box
        sx={{
          mt: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          width: '100%',
          maxWidth: '1100px',
        }}
      >
        <Button
          variant='outlined'
          onClick={handleBack}
          disabled={submitting}
          sx={{
            borderColor: '#484c7f',
            color: '#484c7f',
            px: 4,
            py: 1.5,
            '&:hover': {
              borderColor: '#484c7f',
              backgroundColor: 'rgba(72, 76, 127, 0.1)',
            },
          }}
        >
          Back
        </Button>

        <Button
          variant='contained'
          onClick={handleContinue}
          disabled={!selectedPlan || submitting}
          sx={{
            background: 'linear-gradient(90deg, #484c7f 0%, #484c7f 100%)',
            color: 'white',
            px: 4,
            py: 1.5,
            fontWeight: 600,
            '&:hover': {
              background:
                'linear-gradient(90deg,rgb(87, 91, 144) 0%,rgb(91, 95, 152) 100%)',
            },
            '&:disabled': {
              backgroundColor: '#ccc',
            },
          }}
        >
          {submitting ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} color='inherit' />
              Processing...
            </Box>
          ) : (
            'Continue to Payment'
          )}
        </Button>
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
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SelectPlan;
