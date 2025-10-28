import React from 'react';
import {
  IconButton,
  Button,
  Tooltip,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
  Box,
} from '@mui/material';
import { Edit as MuiEditIcon } from '@mui/icons-material';

export interface EditIconProps {
  onClick: () => void;
  variant?: 'icon' | 'button' | 'menu-item' | 'tooltip';
  label?: string;
  tooltip?: string;
  disabled?: boolean;
  responsive?: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: 'inherit' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

const EditIconComponent: React.FC<EditIconProps> = ({
  onClick,
  variant = 'icon',
  label = 'Edit',
  tooltip,
  disabled = false,
  responsive = false,
  size,
  color = 'primary',
  ...iconProps
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const getResponsiveSize = () => {
    if (size) return size;
    if (responsive) {
      if (isMobile) return 'small';
      if (isTablet) return 'medium';
      return 'large';
    }
    return 'medium'; // Default size if not responsive
  };

  const iconFontSize = responsive
    ? isMobile
      ? 'small'
      : isTablet
        ? 'medium'
        : 'large'
      : iconProps.fontSize || 'medium';

  const iconComponent = (
    <MuiEditIcon
      fontSize={iconFontSize}
      color={color}
      {...iconProps}
    />
  );

  if (variant === 'button') {
    return (
      <Button
        variant="outlined"
        color={color}
        onClick={onClick}
        disabled={disabled}
        startIcon={iconComponent}
        size={getResponsiveSize()}
      >
        {label}
      </Button>
    );
  }

  if (variant === 'menu-item') {
    return (
      <MenuItem onClick={onClick} disabled={disabled} sx={{ color: disabled ? undefined : `${color}.main` }}>
        <ListItemIcon sx={{ color: disabled ? undefined : `${color}.main` }}>
          {iconComponent}
        </ListItemIcon>
        <ListItemText>{label}</ListItemText>
      </MenuItem>
    );
  }

  const iconButton = (
    <IconButton 
      onClick={onClick} 
      disabled={disabled} 
      color={color} 
      size={getResponsiveSize()}
      sx={responsive ? {
        padding: { xs: 0.5, sm: 1 },
        '& .MuiSvgIcon-root': {
          fontSize: { xs: 18, sm: 20 }
        }
      } : undefined}
    >
      {iconComponent}
    </IconButton>
  );

  if (variant === 'tooltip' || tooltip) {
    return (
      <Tooltip title={tooltip || label} arrow>
        {iconButton}
      </Tooltip>
    );
  }

  return iconButton;
};

export default EditIconComponent;
