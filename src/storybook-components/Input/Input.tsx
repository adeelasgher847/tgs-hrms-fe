import React, { useState } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import { Visibility, VisibilityOff, Search, Email, Lock } from '@mui/icons-material';

export interface InputProps {
  /**
   * Input label
   */
  label?: string;
  /**
   * Input placeholder
   */
  placeholder?: string;
  /**
   * Input value
   */
  value?: string;
  /**
   * Input change handler
   */
  onChange?: (value: string) => void;
  /**
   * Input type
   */
  type?: 'text' | 'email' | 'password' | 'number' | 'search';
  /**
   * Input variant
   */
  variant?: 'outlined' | 'filled' | 'standard';
  /**
   * Input size
   */
  size?: 'small' | 'medium';
  /**
   * Error state
   */
  error?: boolean;
  /**
   * Error message
   */
  errorMessage?: string;
  /**
   * Helper text
   */
  helperText?: string;
  /**
   * Disabled state
   */
  disabled?: boolean;
  /**
   * Required field
   */
  required?: boolean;
  /**
   * Full width input
   */
  fullWidth?: boolean;
  /**
   * Input adornment (icon)
   */
  startAdornment?: React.ReactNode;
  /**
   * End adornment (icon)
   */
  endAdornment?: React.ReactNode;
  /**
   * Show password toggle (for password type)
   */
  showPasswordToggle?: boolean;
  /**
   * Input multiline
   */
  multiline?: boolean;
  /**
   * Number of rows (for multiline)
   */
  rows?: number;
}

const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value = '',
  onChange,
  type = 'text',
  variant = 'outlined',
  size = 'medium',
  error = false,
  errorMessage,
  helperText,
  disabled = false,
  required = false,
  fullWidth = false,
  startAdornment,
  endAdornment,
  showPasswordToggle = false,
  multiline = false,
  rows = 3,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    onChange?.(newValue);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const getInputType = () => {
    if (type === 'password' && showPassword) {
      return 'text';
    }
    return type;
  };

  const getStartAdornment = () => {
    if (startAdornment) return startAdornment;
    
    switch (type) {
      case 'email':
        return <Email color="action" />;
      case 'password':
        return <Lock color="action" />;
      case 'search':
        return <Search color="action" />;
      default:
        return null;
    }
  };

  const getEndAdornment = () => {
    if (endAdornment) return endAdornment;
    
    if (type === 'password' && showPasswordToggle) {
      return (
        <InputAdornment position="end">
          <IconButton
            onClick={togglePasswordVisibility}
            edge="end"
            size="small"
          >
            {showPassword ? <VisibilityOff /> : <Visibility />}
          </IconButton>
        </InputAdornment>
      );
    }
    
    return null;
  };

  return (
    <TextField
      label={label}
      placeholder={placeholder}
      value={inputValue}
      onChange={handleChange}
      type={getInputType()}
      variant={variant}
      size={size}
      error={error}
      helperText={errorMessage || helperText}
      disabled={disabled}
      required={required}
      fullWidth={fullWidth}
      multiline={multiline}
      rows={multiline ? rows : undefined}
      InputProps={{
        startAdornment: getStartAdornment() ? (
          <InputAdornment position="start">
            {getStartAdornment()}
          </InputAdornment>
        ) : undefined,
        endAdornment: getEndAdornment(),
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 'var(--radius-lg)',
          fontFamily: 'var(--font-family-primary)',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--primary-color)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--primary-color)',
            borderWidth: '2px',
          },
          '& .MuiOutlinedInput-input': {
            color: 'var(--text-primary)',
            fontSize: 'var(--font-size-base)',
            '&::placeholder': {
              color: 'var(--text-muted)',
              opacity: 1,
            },
          },
        },
        '& .MuiInputLabel-root': {
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-family-primary)',
          '&.Mui-focused': {
            color: 'var(--primary-color)',
          },
          '&.Mui-error': {
            color: 'var(--chart-color-6)',
          },
        },
        '& .MuiFormHelperText-root': {
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-family-primary)',
          fontSize: 'var(--font-size-sm)',
          '&.Mui-error': {
            color: 'var(--chart-color-6)',
          },
        },
        '& .MuiInputAdornment-root': {
          '& .MuiSvgIcon-root': {
            color: 'var(--text-muted)',
          },
        },
      }}
    />
  );
};

export default Input;
