import React from 'react';
import {
  IconButton,
  Button,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  Tooltip,
  Menu,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';

export interface DeleteIconProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'action' | 'disabled' | 'inherit';
  fontSize?: 'small' | 'medium' | 'inherit' | 'large';
  variant?: 'icon' | 'button' | 'menu-item' | 'tooltip';
  disabled?: boolean;
  onClick?: () => void;
  tooltip?: string;
  label?: string;
  responsive?: boolean;
}

const DeleteIconComponent: React.FC<DeleteIconProps> = ({
  size = 'medium',
  color = 'error',
  fontSize = 'medium',
  variant = 'icon',
  disabled = false,
  onClick,
  tooltip,
  label = 'Delete',
  responsive = false,
}) => {
  const iconSize = responsive 
    ? { fontSize: { xs: 16, sm: 18, md: 20 } }
    : fontSize === 'small' 
      ? { fontSize: 16 }
      : fontSize === 'large'
        ? { fontSize: 24 }
        : { fontSize: 20 };

  const buttonSize = responsive
    ? { padding: { xs: 0.5, sm: 1 } }
    : size === 'small'
      ? { padding: 0.5 }
      : size === 'large'
        ? { padding: 1.5 }
        : { padding: 1 };

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const iconElement = (
    <DeleteIcon 
      color={color} 
      fontSize={fontSize}
      sx={responsive ? iconSize : undefined}
    />
  );

  switch (variant) {
    case 'button':
      return (
        <Button
          variant="outlined"
          color={color === 'error' ? 'error' : 'primary'}
          size={size}
          startIcon={iconElement}
          onClick={handleClick}
          disabled={disabled}
          sx={responsive ? buttonSize : undefined}
        >
          {label}
        </Button>
      );

    case 'menu-item':
      return (
        <MenuItem 
          onClick={handleClick}
          disabled={disabled}
          sx={{ color: color === 'error' ? 'error.main' : 'inherit' }}
        >
          <ListItemIcon>
            {iconElement}
          </ListItemIcon>
          <ListItemText>{label}</ListItemText>
        </MenuItem>
      );

    case 'tooltip':
      return (
        <Tooltip title={tooltip || label} arrow>
          <IconButton
            size={size}
            onClick={handleClick}
            disabled={disabled}
            sx={{
              color: theme => theme.palette[color].main,
              ...(responsive ? buttonSize : {}),
            }}
          >
            {iconElement}
          </IconButton>
        </Tooltip>
      );

    case 'icon':
    default:
      return (
        <IconButton
          size={size}
          onClick={handleClick}
          disabled={disabled}
          sx={{
            color: theme => theme.palette[color].main,
            ...(responsive ? buttonSize : {}),
          }}
        >
          {iconElement}
        </IconButton>
      );
  }
};

export default DeleteIconComponent;
