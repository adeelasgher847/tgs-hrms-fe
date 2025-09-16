import React from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  InputAdornment,
} from '@mui/material';

const ConfirmPayment: React.FC = () => {
  const [plan] = React.useState<{ name: string; price: string }>({
    name: 'Pro Plan',
    price: '$123',
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

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
      <Box sx={{ width: '100%', maxWidth: 1100, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4, alignItems: 'center' }}>
        {/* Left credit card mock */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Box sx={{ position: 'relative', width: 440, maxWidth: '100%', mx: 'auto', height: 240 }}>
            {/* back card */}
            <Box
              sx={{
                position: 'absolute',
                right: 12,
                top: 38,
                width: 330,
                height: 190,
                borderRadius: 4,
                background: 'linear-gradient(135deg, #0a7bff 0%, #19c0ff 100%)',
                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              }}
            >
              {/* magnetic stripe mimic on back card */}
              <Box sx={{ position: 'absolute', right: 18, top: 30, width: 34, height: 96, borderRadius: 1, bgcolor: '#1f2937' }} />
            </Box>
            {/* front card */}
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: 360,
                height: 210,
                borderRadius: 4,
                background: 'linear-gradient(135deg, #0a60ff 0%, #11b2ff 100%)',
                boxShadow: '0 14px 30px rgba(0,0,0,0.2)',
                color: 'white',
                p: 3,
              }}
            >
              {/* top row: chip + bank + contactless */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ width: 44, height: 30, borderRadius: '6px', background: 'linear-gradient(180deg,#ffdf00,#ffb300)' }} />
                <Typography sx={{ fontWeight: 800, letterSpacing: 1 }}>BANK</Typography>
              </Box>
              <Box sx={{ position: 'absolute', right: 16, top: 52, opacity: 0.9 }}>
                {/* contactless waves */}
                <svg width="28" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M6 12c0-2.2 1.8-4 4-4" stroke="white" strokeWidth="1.6" strokeLinecap="round" opacity="0.6"/>
                  <path d="M6 12c0 2.2 1.8 4 4 4" stroke="white" strokeWidth="1.6" strokeLinecap="round" opacity="0.6"/>
                  <path d="M10 8c0-1.7 1.3-3 3-3" stroke="white" strokeWidth="1.6" strokeLinecap="round" opacity="0.35"/>
                  <path d="M10 16c0 1.7 1.3 3 3 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" opacity="0.35"/>
                </svg>
              </Box>

              <Typography sx={{ letterSpacing: 3, fontSize: 20, fontWeight: 700, mb: 2, mt: 1 }}>1234 5678 9012 3456</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontSize: 12, opacity: 0.9 }}>CARDHOLDER NAME</Typography>
                <Typography sx={{ fontSize: 12, opacity: 0.9 }}>12/24</Typography>
              </Box>
              <Box sx={{ position: 'absolute', right: 16, bottom: 16, width: 40, height: 26, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.9)' }} />
            </Box>
          </Box>
        </Box>

        {/* Right form card */}
        <Paper elevation={3} sx={{ p: { xs: 3, md: 4 }, bgcolor: '#ffffff', borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#111827' }}>Payment Details</Typography>
          <Divider sx={{ mb: 2 }} />

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth
              placeholder="CARD NUMBER"
              sx={{ mb: 2, '& .MuiOutlinedInput-root': { backgroundColor: '#fff', height: 46 } }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Box sx={{ width: 26, height: 18, bgcolor: '#1e90ff', borderRadius: '2px' }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              placeholder="CARDHOLDER NAME"
              sx={{ mb: 2, '& .MuiOutlinedInput-root': { backgroundColor: '#fff', height: 46 } }}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
              <TextField placeholder="12" sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#fff', height: 46 } }} />
              <TextField placeholder="2028" sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#fff', height: 46 } }} />
              <TextField
                placeholder="CVV"
                sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#fff', height: 46 } }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Box sx={{ width: 24, height: 16, bgcolor: '#cbd5e1', borderRadius: '2px' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button type="submit" variant="contained" sx={{
                textTransform: 'none',
                fontWeight: 700,
                backgroundColor: '#1e90ff',
                '&:hover': { backgroundColor: '#1a7fe0' },
              }}>
                CONFIRM AND PAY {plan.price}
              </Button>
              <Button variant="outlined" sx={{ textTransform: 'none', color: '#1e90ff', borderColor: '#1e90ff' }}>
                CANCEL
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default ConfirmPayment; 