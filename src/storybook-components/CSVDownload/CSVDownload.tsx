import React from 'react';
import {
  IconButton,
  Button,
  Tooltip,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';

export interface CSVDownloadProps {
  variant?: 'icon' | 'button' | 'tooltip';
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'action' | 'disabled' | 'inherit';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  tooltip?: string;
  label?: string;
  filename?: string;
  responsive?: boolean;
  fullWidth?: boolean;
}

const CSVDownloadComponent: React.FC<CSVDownloadProps> = ({
  variant = 'icon',
  size = 'medium',
  color = 'primary',
  disabled = false,
  loading = false,
  onClick,
  tooltip,
  label = 'Download CSV',
  filename = 'data.csv',
  responsive = false,
  fullWidth = false,
}) => {
  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  };

  const iconSize = responsive 
    ? { fontSize: { xs: 16, sm: 18, md: 20 } }
    : size === 'small' 
      ? { fontSize: 16 }
      : size === 'large'
        ? { fontSize: 24 }
        : { fontSize: 20 };

  const buttonSize = responsive
    ? { padding: { xs: 0.5, sm: 1 } }
    : size === 'small'
      ? { padding: 0.5 }
      : size === 'large'
        ? { padding: 1.5 }
        : { padding: 1 };

  const iconElement = (
    <FileDownloadIcon 
      sx={responsive ? iconSize : undefined}
    />
  );

  const loadingElement = (
    <CircularProgress 
      size={responsive ? { xs: 16, sm: 18, md: 20 } : 16} 
      color="inherit" 
    />
  );

  switch (variant) {
    case 'button':
      return (
        <Button
          variant="outlined"
          color={color === 'primary' ? 'primary' : color === 'error' ? 'error' : 'primary'}
          size={size}
          startIcon={loading ? loadingElement : iconElement}
          onClick={handleClick}
          disabled={disabled || loading}
          fullWidth={fullWidth}
          sx={responsive ? buttonSize : undefined}
        >
          {loading ? 'Downloading...' : label}
        </Button>
      );

    case 'tooltip':
      return (
        <Tooltip title={tooltip || `Download ${filename}`} arrow>
          <IconButton
            size={size}
            onClick={handleClick}
            disabled={disabled || loading}
            sx={{
              backgroundColor: theme => theme.palette.primary.main,
              borderRadius: '6px',
              padding: '6px',
              color: 'white',
              '&:hover': {
                backgroundColor: theme => theme.palette.primary.dark,
              },
              ...(responsive ? buttonSize : {}),
            }}
          >
            {loading ? loadingElement : iconElement}
          </IconButton>
        </Tooltip>
      );

    case 'icon':
    default:
      return (
        <IconButton
          size={size}
          onClick={handleClick}
          disabled={disabled || loading}
          sx={{
            backgroundColor: theme => theme.palette.primary.main,
            borderRadius: '6px',
            padding: '6px',
            color: 'white',
            '&:hover': {
              backgroundColor: theme => theme.palette.primary.dark,
            },
            ...(responsive ? buttonSize : {}),
          }}
        >
          {loading ? loadingElement : iconElement}
        </IconButton>
      );
  }
};

export default CSVDownloadComponent;
