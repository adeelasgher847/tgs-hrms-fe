import React from 'react';
import { Box, Typography, Button, Paper, Stack } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const SignupSuccess: React.FC = () => {
  const handleGoToDashboard = () => {
    // Placeholder: navigate to dashboard
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Paper elevation={4} sx={{ width: '100%', maxWidth: 640, p: { xs: 3, md: 5 }, textAlign: 'center', backgroundColor: '#484c7f', color: 'common.white' }}>
        <Stack spacing={2} alignItems='center'>
          <CheckCircleIcon color='success' sx={{ fontSize: 64 }} />
          <Box>
            <Typography variant='h4' sx={{ fontWeight: 600, mb: 0.5 }} color='common.white'>
              Signup Complete!
            </Typography>
            <Typography variant='body1' color='common.white'>
              Your account has been successfully created and activated.
            </Typography>
          </Box>

          <Box
            sx={{
              width: '100%',
              textAlign: 'left',
              bgcolor: 'transparent',
              borderRadius: 1,
              p: 2,
              mt: 1,
              border: '1px solid rgba(255,255,255,0.3)'
            }}
          >
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant='subtitle2' color='common.white'>User ID</Typography>
                <Typography variant='subtitle1' color='common.white'>USR-XXXX-PLACEHOLDER</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant='subtitle2' color='common.white'>Plan</Typography>
                <Typography variant='subtitle1' color='common.white'>Pro Plan (Placeholder)</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant='subtitle2' color='common.white'>Status</Typography>
                <Typography variant='subtitle1' color='success.main'>Active</Typography>
              </Box>
            </Stack>
          </Box>

          <Box sx={{ mt: 1, width: '100%', display: 'flex', justifyContent: 'center' }}>
            <Button variant='contained' color='primary' onClick={handleGoToDashboard} size='large'>
              Go to Dashboard
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};

export default SignupSuccess; 