import React from 'react';
import { TextField, type TextFieldProps, type SxProps, type Theme } from '@mui/material';

type AppTextFieldVariant = 'auth' | 'default';

interface AppTextFieldProps extends TextFieldProps {
  variantType?: AppTextFieldVariant;
}

const variantStyles: Record<AppTextFieldVariant, SxProps<Theme>> = {
  auth: {
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'background.paper',
      borderRadius: 1,
      '& fieldset': {
        borderColor: 'divider',
      },
      '&:hover fieldset': {
        borderColor: 'primary.main',
      },
      '&.Mui-focused fieldset': {
        borderColor: 'primary.main',
      },
    },
    '& .MuiInputLabel-root': {
      color: 'text.secondary',
    },
  },
  default: {},
};

export function AppTextField({
  variantType = 'default',
  sx,
  ...rest
}: AppTextFieldProps) {
  const baseSx = variantStyles[variantType] || {};

  return (
    <TextField
      {...rest}
      sx={[
        baseSx as SxProps<Theme>,
        sx as SxProps<Theme>,
      ]}
    />
  );
}

export default AppTextField;

