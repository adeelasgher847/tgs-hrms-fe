import React, { useState, useEffect, useRef } from 'react';
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
  Divider,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import signupApi, {
  type SubscriptionPlan,
  type CompanyDetailsRequest,
  type LogoUploadRequest,
} from '../api/signupApi';

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

  const hasFetched = useRef(false);

  // Check access: either signup flow (with signupSessionId and companyDetails) or login flow (with requiresPayment)
  useEffect(() => {
    const signupSessionId = localStorage.getItem('signupSessionId');
    const companyDetails = localStorage.getItem('companyDetails');
    const accessToken = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');

    // Check if this is a signup flow (has signupSessionId AND companyDetails)
    const isSignupFlow = signupSessionId && companyDetails;

    // Check if this is a login flow (user is logged in, may or may not have signupSessionId)
    const isLoginFlow = accessToken && userStr;

    // If neither flow is valid, redirect to signup
    if (!isSignupFlow && !isLoginFlow) {
      navigate('/Signup');
      return;
    }

    // Prevent duplicate API calls in StrictMode
    if (!hasFetched.current) {
      hasFetched.current = true;
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
                (acc, pr: Record<string, unknown>) => {
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
                  acc[pr.priceId] = {
                    formatted: formattedAmount,
                    intervalLabel,
                  };
                  return acc;
                },
                {} as Record<
                  string,
                  { formatted: string; intervalLabel: string }
                >
              );
            } catch {
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
        } catch (err: unknown) {
          console.error('Error fetching plans:', err);
          setError('Failed to load subscription plans. Using default plans.');
          // Keep default plans as fallback
        } finally {
          setLoading(false);
        }
      };

      void fetchPlans();
    }
  }, [navigate]);

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
      const signupSessionIdRaw = localStorage.getItem('signupSessionId');
      const companyDetailsStr = localStorage.getItem('companyDetails');
      const companyDetails = companyDetailsStr
        ? JSON.parse(companyDetailsStr)
        : {};
      const accessToken = localStorage.getItem('accessToken');
      const userStr = localStorage.getItem('user');

      // Validate and normalize signupSessionId
      const signupSessionId = signupSessionIdRaw
        ? String(signupSessionIdRaw).trim()
        : null;

      // Determine if this is signup flow or login flow
      // Signup flow: has signupSessionId AND companyDetails (from signup process)
      // Login flow: has accessToken and user, may have signupSessionId from login response
      const isSignupFlow = signupSessionId && companyDetailsStr;
      const isLoginFlow = accessToken && userStr && !companyDetailsStr; // Login flow doesn't have companyDetails

      if (isSignupFlow) {
        // Signup flow: Create company details and proceed with payment
        if (!signupSessionId || signupSessionId.length === 0) {
          throw new Error('Signup session not found. Please start over.');
        }

        // Debug: Log company details
        console.log('Company details from localStorage:', companyDetails);
        console.log('SignupSessionId:', signupSessionId);

        // Validate company details are present and not empty
        const companyName = companyDetails?.companyName
          ? String(companyDetails.companyName).trim()
          : '';
        const domain = companyDetails?.domain
          ? String(companyDetails.domain).trim()
          : '';

        if (!companyName || !domain) {
          console.error('Missing company details:', {
            companyName,
            domain,
            fullCompanyDetails: companyDetails,
          });
          throw new Error(
            'Company name and domain are required. Please go back and fill in all required fields.'
          );
        }

        // 1. Create company details with selected plan
        const companyDetailsRequest: CompanyDetailsRequest = {
          signupSessionId, // Now guaranteed to be a non-empty string
          companyName,
          domain,
          planId: selectedPlan,
        };

        await signupApi.createCompanyDetails(companyDetailsRequest);

        // 2. Upload logo if available
        if (
          companyDetails.logoBase64 &&
          companyDetails.logoFileName &&
          companyDetails.logoFileType
        ) {
          try {
            // Convert base64 back to File object
            const byteCharacters = atob(
              companyDetails.logoBase64.split(',')[1]
            );
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const logoFile = new File(
              [byteArray],
              companyDetails.logoFileName,
              {
                type: companyDetails.logoFileType,
              }
            );

            const logoUploadData: LogoUploadRequest = {
              signupSessionId,
              logo: logoFile,
            };

            await signupApi.uploadLogo(logoUploadData);
            console.log('Logo uploaded successfully');
          } catch (logoError: unknown) {
            console.error('Logo upload failed:', logoError);
            // Don't block the flow if logo upload fails
          }
        }

        // 3. Create Stripe Checkout Session
        // signupSessionId is already validated above as a non-empty string
        const paymentRequest: PaymentRequest = {
          signupSessionId, // Guaranteed to be a non-empty string
          mode: 'checkout' as const, // Use Stripe Checkout
        };

        const checkoutSession = await signupApi.createPayment(paymentRequest);

        setSnackbar({
          open: true,
          message: 'Redirecting to secure payment...',
          severity: 'success',
        });

        // 4. Redirect to Stripe Checkout
        if (checkoutSession.url) {
          window.location.href = checkoutSession.url;
        } else {
          throw new Error('No checkout URL received from server');
        }
      } else if (isLoginFlow) {
        // Login flow: User is already logged in after tenant creation
        // Backend flow: System admin creates tenant → Admin logs in → Admin selects plan → Payment
        // For login flow, company details are already created during tenant creation
        // We just need to call /signup/company-details with session_id and planId
        try {
          // Get session_id from localStorage (set during login as signupSessionId)
          const loginSignupSessionIdRaw =
            localStorage.getItem('signupSessionId');
          const loginSignupSessionId = loginSignupSessionIdRaw
            ? String(loginSignupSessionIdRaw).trim()
            : null;

          if (!loginSignupSessionId || loginSignupSessionId.length === 0) {
            throw new Error('Session ID not found. Please log in again.');
          }

          // Step 1: Update company details with selected plan
          // Backend already has company details from tenant creation, we just need to update with planId
          // But backend still expects companyName and domain, so we get them from the company object in login response
          // Actually, let's check if we need to send companyName and domain or if backend can get them from session_id
          // Based on user's description: "POST /signup/company-details with session_id aur planId"
          // It seems backend only needs session_id and planId, but the error suggests it needs companyName and domain too
          // Let's try sending only session_id and planId first, and if that fails, we'll get company details from user object

          // Get company details from localStorage (stored during login)
          const companyStr = localStorage.getItem('company');
          const company = companyStr ? JSON.parse(companyStr) : null;

          if (!company || !company.company_name || !company.domain) {
            throw new Error('Company details not found. Please log in again.');
          }

          // Step 1: Update company details with selected plan
          // Backend already has company details from tenant creation, but still requires companyName and domain
          const companyDetailsRequest: CompanyDetailsRequest = {
            signupSessionId: loginSignupSessionId,
            companyName: company.company_name,
            domain: company.domain,
            planId: selectedPlan,
          };

          await signupApi.createCompanyDetails(companyDetailsRequest);

          // Step 2: Create payment with session_id
          const paymentRequest: PaymentRequest = {
            signupSessionId: loginSignupSessionId,
            mode: 'checkout' as const,
          };

          const checkoutSession = await signupApi.createPayment(paymentRequest);

          setSnackbar({
            open: true,
            message: 'Redirecting to secure payment...',
            severity: 'success',
          });

          if (checkoutSession.url) {
            window.location.href = checkoutSession.url;
          } else {
            throw new Error('No checkout URL received from server');
          }
        } catch (paymentError: unknown) {
          console.error(
            'Payment creation error for logged-in user:',
            paymentError
          );
          const error = paymentError as {
            response?: { status?: number; data?: { message?: string } };
            message?: string;
          };

          let errorMessage =
            'Failed to create payment session. Please contact support or try again later.';
          if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.message) {
            errorMessage = error.message;
          }

          throw new Error(errorMessage);
        }
      } else {
        throw new Error('Invalid session. Please start over.');
      }
    } catch (err: unknown) {
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
    const signupSessionId = localStorage.getItem('signupSessionId');
    const accessToken = localStorage.getItem('accessToken');

    // If signup flow, go back to company details
    // If login flow, go back to dashboard
    if (signupSessionId) {
      navigate('/signup/company-details');
    } else if (accessToken) {
      navigate('/dashboard');
    } else {
      navigate('/Signup');
    }
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
        px: { xs: 2, sm: 4, md: 6 },
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
              mx: { xs: 1.5, sm: 2, md: 0 },
            }}
          >
            {/* Card Header */}
            <Box sx={{ pt: plan.popular ? 5 : 3, pb: 2, px: 2 }}>
              {/* Popular badge */}
              {plan.popular && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 18,
                    left: 18,
                    bgcolor: '#facc15',
                    color: '#111827',
                    px: 2.5,
                    py: '4px',
                    borderRadius: '8px',
                    fontSize: { xs: '13px', sm: '15px' },
                    fontWeight: 900,
                    boxShadow: 2,
                    letterSpacing: 1,
                    zIndex: 2,
                    textTransform: 'uppercase',
                  }}
                >
                  Popular
                </Box>
              )}
              {/* Heading */}
              <Typography
                variant='h5'
                sx={{
                  fontWeight: 900,
                  letterSpacing: 0.5,
                  mt: 1,
                  fontSize: { xs: 22, sm: 26, md: 28 },

                  textAlign: 'left',
                  color: '#484c7f',
                }}
              >
                {plan.name}
              </Typography>
              {/* Price section */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'left',
                  // justifyContent: 'center',
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    borderRadius: '16px',

                    mb: 0.5,
                  }}
                >
                  <Typography
                    component='span'
                    sx={{
                      fontSize: { xs: 32, sm: 38, md: 44 },
                      fontWeight: 900,
                      color: '#484c7f',
                      lineHeight: 1,
                      letterSpacing: 0.5,
                    }}
                  >
                    {typeof plan.price === 'string'
                      ? plan.price.replace(/^US\$/i, '$')
                      : plan.price}
                  </Typography>
                </Box>
                <Typography
                  component='span'
                  sx={{
                    fontSize: { xs: 16, sm: 18 },
                    color: '#484c7f',
                    fontWeight: 700,
                    letterSpacing: 0.2,
                  }}
                >
                  per {plan.duration}
                </Typography>
                <Divider sx={{ my: 1, borderColor: '#e5e7eb' }} />
              </Box>
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
            'Continue to  Checkout'
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
