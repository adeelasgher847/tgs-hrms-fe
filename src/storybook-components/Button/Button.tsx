import React from 'react';
import { Button as MuiButton, CircularProgress } from '@mui/material';

export interface ButtonProps {
  /**
   * Button variant
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  /**
   * Button size
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * Loading state
   */
  loading?: boolean;
  /**
   * Full width button
   */
  fullWidth?: boolean;
  /**
   * Button content
   */
  children: React.ReactNode;
  /**
   * Click handler
   */
  onClick?: () => void;
  /**
   * Disabled state
   */
  disabled?: boolean;
  /**
   * Button type
   */
  type?: 'button' | 'submit' | 'reset';
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  loading = false,
  fullWidth = false,
  children,
  onClick,
  disabled,
  type = 'button',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--primary-color)',
          color: 'var(--primary-text)',
          '&:hover': {
            backgroundColor: 'var(--primary-dark)',
          },
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--secondary-color)',
          color: 'var(--secondary-text)',
          '&:hover': {
            backgroundColor: 'var(--secondary-dark)',
          },
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: 'var(--primary-color)',
          border: '2px solid var(--primary-color)',
          '&:hover': {
            backgroundColor: 'var(--primary-color)',
            color: 'var(--primary-text)',
          },
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'var(--primary-color)',
          '&:hover': {
            backgroundColor: 'var(--bg-hover)',
          },
        };
      case 'danger':
        return {
          backgroundColor: 'var(--chart-color-6)',
          color: 'var(--text-light)',
          '&:hover': {
            backgroundColor: '#b91c1c',
          },
        };
      default:
        return {};
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          padding: 'var(--spacing-sm) var(--spacing-lg)',
          fontSize: 'var(--font-size-sm)',
          minHeight: '32px',
        };
      case 'medium':
        return {
          padding: 'var(--spacing-sm) var(--spacing-xl)',
          fontSize: 'var(--font-size-base)',
          minHeight: '40px',
        };
      case 'large':
        return {
          padding: 'var(--spacing-md) var(--spacing-xxl)',
          fontSize: 'var(--font-size-lg)',
          minHeight: '48px',
        };
      default:
        return {};
    }
  };

  return (
    <MuiButton
      variant="contained"
      disabled={disabled || loading}
      fullWidth={fullWidth}
      onClick={onClick}
      type={type}
      sx={{
        textTransform: 'none',
        fontWeight: 'var(--font-weight-semibold)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'none',
        fontFamily: 'var(--font-family-primary)',
        transition: 'var(--transition-fast)',
        '&:hover': {
          boxShadow: 'var(--shadow-md)',
        },
        '&:focus': {
          outline: 'none',
        },
        '&:disabled': {
          opacity: 0.6,
          cursor: 'not-allowed',
        },
        ...getVariantStyles(),
        ...getSizeStyles(),
      }}
    >
      {loading ? (
        <>
          <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
          Loading...
        </>
      ) : (
        children
      )}
    </MuiButton>
  );
};

export default Button;