import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const Error404: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f9fafb',
        color: '#333',
        textAlign: 'center',
        p: 3,
      }}
    >
      <ErrorOutlineIcon sx={{ fontSize: 120, color: '#f19828', mb: 2 }} />
      <Typography variant='h1' sx={{ fontWeight: 700, fontSize: 64, mb: 1 }}>
        404
      </Typography>
      <Typography variant='h5' sx={{ mb: 2 }}>
        Oops! Page Not Found
      </Typography>
      <Typography variant='body1' sx={{ mb: 4, color: '#666' }}>
        The page you are looking for does not exist or has been moved.
        <br />
        Please check the URL or return to the home page.
      </Typography>
      <Button
        variant='contained'
        color='primary'
        sx={{
          bgcolor: '#45407A',
          color: 'white',
          fontWeight: 600,
          borderRadius: 2,
          px: 4,
          py: 1.5,
          fontSize: 16,
        }}
        onClick={() => navigate('/')}
      >
        Go to Home
      </Button>
    </Box>
  );
};

export default Error404;
