import React from 'react';
import {
  Snackbar,
  Alert,
  Box,
  Typography,
  Button,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

export interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

export interface SnackbarProps {
  open: boolean;
  message: string;
  severity?: 'success' | 'error' | 'warning' | 'info';
  autoHideDuration?: number;
  onClose: () => void;
  anchorOrigin?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
  variant?: 'filled' | 'outlined' | 'standard';
  showCloseButton?: boolean;
  responsive?: boolean;
  maxWidth?: string | number;
}

const SnackbarComponent: React.FC<SnackbarProps> = ({
  open,
  message,
  severity = 'success',
  autoHideDuration = 6000,
  onClose,
  anchorOrigin = { vertical: 'top', horizontal: 'right' },
  variant = 'filled',
  showCloseButton = true,
  responsive = false,
  maxWidth = '100%',
}) => {
  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    onClose();
  };

  const getSnackbarSx = () => {
    if (responsive) {
      return {
        '& .MuiSnackbarContent-root': {
          fontSize: { xs: '0.875rem', sm: '1rem' },
          padding: { xs: '8px 16px', sm: '12px 20px' },
        },
        '& .MuiAlert-message': {
          fontSize: { xs: '0.875rem', sm: '1rem' },
        },
        '& .MuiAlert-icon': {
          fontSize: { xs: '1.25rem', sm: '1.5rem' },
        },
        '& .MuiIconButton-root': {
          padding: { xs: '4px', sm: '8px' },
        },
      };
    }
    return {};
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={anchorOrigin}
      sx={getSnackbarSx()}
    >
      <Alert
        onClose={showCloseButton ? handleClose : undefined}
        severity={severity}
        variant={variant}
        sx={{ 
          width: maxWidth,
          ...(responsive ? {
            fontSize: { xs: '0.875rem', sm: '1rem' },
            '& .MuiAlert-icon': {
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
            },
            '& .MuiAlert-action': {
              padding: { xs: '4px', sm: '8px' },
            },
          } : {}),
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default SnackbarComponent;
