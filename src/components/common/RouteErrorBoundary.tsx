import React, { Component, type ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useNavigate } from 'react-router-dom';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Route Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

function ErrorFallback({ error }: { error: Error | null }) {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        textAlign: 'center',
      }}
    >
      <ErrorOutlineIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
      <Typography variant='h4' gutterBottom>
        Something went wrong
      </Typography>
      <Typography variant='body1' color='text.secondary' sx={{ mb: 3, maxWidth: 500 }}>
        {error?.message || 'An unexpected error occurred in this route.'}
      </Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant='contained' onClick={() => navigate('/dashboard')}>
          Go to Dashboard
        </Button>
        <Button variant='outlined' onClick={() => window.location.reload()}>
          Reload Page
        </Button>
      </Box>
    </Box>
  );
}

export default RouteErrorBoundary;

