import React from 'react';
import {
  Card as MuiCard,
  CardContent,
  CardActions,
  CardHeader,
  Typography,
  Box,
  Chip,
  Avatar,
} from '@mui/material';

export interface CardProps {
  /**
   * Card title
   */
  title?: string;
  /**
   * Card subtitle
   */
  subtitle?: string;
  /**
   * Card content
   */
  children: React.ReactNode;
  /**
   * Card actions (buttons, etc.)
   */
  actions?: React.ReactNode;
  /**
   * Card variant
   */
  variant?: 'default' | 'elevated' | 'outlined';
  /**
   * Card size
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * Show avatar in header
   */
  avatar?: string;
  /**
   * Status chip
   */
  status?: string;
  /**
   * Status color
   */
  statusColor?: 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  /**
   * Full width card
   */
  fullWidth?: boolean;
  /**
   * Clickable card
   */
  clickable?: boolean;
  /**
   * Card click handler
   */
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  actions,
  variant = 'default',
  size = 'medium',
  avatar,
  status,
  statusColor = 'default',
  fullWidth = false,
  clickable = false,
  onClick,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
          },
        };
      case 'outlined':
        return {
          border: '1px solid #e5e7eb',
          boxShadow: 'none',
          '&:hover': {
            borderColor: '#484c7f',
          },
        };
      default:
        return {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          padding: '12px',
        };
      case 'medium':
        return {
          padding: '16px',
        };
      case 'large':
        return {
          padding: '24px',
        };
      default:
        return {};
    }
  };

  return (
    <MuiCard
      sx={{
        borderRadius: '12px',
        transition: 'all 0.2s ease-in-out',
        cursor: clickable ? 'pointer' : 'default',
        width: fullWidth ? '100%' : 'auto',
        ...getVariantStyles(),
        ...(clickable && {
          '&:hover': {
            transform: 'translateY(-2px)',
          },
        }),
      }}
      onClick={clickable ? onClick : undefined}
    >
      {(title || subtitle || avatar || status) && (
        <CardHeader
          avatar={avatar ? <Avatar src={avatar} /> : undefined}
          title={title}
          subheader={subtitle}
          action={
            status ? (
              <Chip
                label={status}
                color={statusColor}
                size="small"
                variant="outlined"
              />
            ) : undefined
          }
          sx={{
            '& .MuiCardHeader-content': {
              overflow: 'hidden',
            },
          }}
        />
      )}
      
      <CardContent sx={{ ...getSizeStyles() }}>
        {children}
      </CardContent>
      
      {actions && (
        <CardActions sx={{ padding: '16px', paddingTop: 0 }}>
          {actions}
        </CardActions>
      )}
    </MuiCard>
  );
};

export default Card;