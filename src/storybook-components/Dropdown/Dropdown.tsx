import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  description?: string;
}

export interface DropdownProps {
  label: string;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  options: DropdownOption[];
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
  errorMessage?: string;
  helperText?: string;
  fullWidth?: boolean;
  variant?: 'outlined' | 'filled' | 'standard';
  size?: 'small' | 'medium';
  placeholder?: string;
  required?: boolean;
  multiple?: boolean;
  renderValue?: (selected: any) => React.ReactNode;
  emptyText?: string;
  showChips?: boolean;
  maxHeight?: number;
}

const Dropdown: React.FC<DropdownProps> = ({
  label,
  value,
  onChange,
  options,
  disabled = false,
  loading = false,
  error = false,
  errorMessage,
  helperText,
  fullWidth = true,
  variant = 'outlined',
  size = 'medium',
  placeholder,
  required = false,
  multiple = false,
  renderValue,
  emptyText = 'No options available',
  showChips = false,
  maxHeight = 300,
}) => {
  const handleChange = (event: any) => {
    onChange(event.target.value);
  };

  const renderMenuItem = (option: DropdownOption) => (
    <MenuItem 
      key={option.value} 
      value={option.value}
      disabled={option.disabled}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
        {option.icon && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {option.icon}
          </Box>
        )}
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" fontWeight={500}>
            {option.label}
          </Typography>
          {option.description && (
            <Typography variant="caption" color="text.secondary">
              {option.description}
            </Typography>
          )}
        </Box>
      </Box>
    </MenuItem>
  );

  const renderSelectedValue = (selected: any) => {
    if (multiple) {
      if (!Array.isArray(selected) || selected.length === 0) {
        return placeholder || `Select ${label.toLowerCase()}...`;
      }
      
      if (showChips) {
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map((value: string) => {
              const option = options.find(opt => opt.value === value);
              return (
                <Chip
                  key={value}
                  label={option?.label || value}
                  size="small"
                  variant="outlined"
                />
              );
            })}
          </Box>
        );
      }
      
      return selected.map((value: string) => {
        const option = options.find(opt => opt.value === value);
        return option?.label || value;
      }).join(', ');
    }
    
    if (renderValue) {
      return renderValue(selected);
    }
    
    const selectedOption = options.find(option => option.value === selected);
    return selectedOption?.label || placeholder || `Select ${label.toLowerCase()}...`;
  };

  return (
    <Box>
      <FormControl 
        fullWidth={fullWidth} 
        error={error}
        variant={variant}
        size={size}
        required={required}
        disabled={disabled || loading}
      >
        <InputLabel>{label}</InputLabel>
        <Select
          value={value}
          onChange={handleChange}
          label={label}
          multiple={multiple}
          renderValue={renderSelectedValue}
          MenuProps={{
            PaperProps: {
              style: {
                maxHeight: maxHeight,
              },
            },
          }}
        >
          {loading ? (
            <MenuItem disabled>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <CircularProgress size={16} />
                <Typography variant="body2">Loading...</Typography>
              </Box>
            </MenuItem>
          ) : options.length === 0 ? (
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                {emptyText}
              </Typography>
            </MenuItem>
          ) : (
            options.map(renderMenuItem)
          )}
        </Select>
      </FormControl>
      
      {error && errorMessage && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {errorMessage}
        </Alert>
      )}
      
      {helperText && !error && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {helperText}
        </Typography>
      )}
    </Box>
  );
};

export default Dropdown;
