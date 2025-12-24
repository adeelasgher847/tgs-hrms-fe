import React from 'react';
import {
  Button,
  type ButtonProps,
  type SxProps,
  type Theme,
} from '@mui/material';

type AppButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface AppButtonProps extends Omit<ButtonProps, 'children'> {
  variantType?: AppButtonVariant;
  text?: string;
  children?: React.ReactNode;
}

const variantStyles: Record<AppButtonVariant, SxProps<Theme>> = {
  primary: {
    backgroundColor: '#3083DC',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    borderRadius: '12px',
    fontWeight: 500,
    fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
    // '&:hover': {
    //   backgroundColor: 'primary.dark',
    // },
    '&:disabled': {
      backgroundColor: '#ccc',
    },
  },
  secondary: {
    borderColor: '#3083DC',
    color: '#3083DC',
    textTransform: 'uppercase',
    borderRadius: '12px',
    fontWeight: 500,
    fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
    // '&:hover': {
    //   borderColor: 'primary.dark',
    //   backgroundColor: 'rgba(72,76,127,0.08)',
    // },
    '&:disabled': {
      borderColor: '#ccc',
      color: '#ccc',
    },
  },
  danger: {
    backgroundColor: 'error.main',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    borderRadius: '12px',
    fontWeight: 500,
    fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
    // '&:hover': {
    //   backgroundColor: 'error.dark',
    // },
    '&:disabled': {
      backgroundColor: '#f2b8b5',
    },
  },
  ghost: {
    borderColor: 'transparent',
    color: 'text.primary',
    textTransform: 'none',
    borderRadius: '12px',
    fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
    // '&:hover': {
    //   backgroundColor: 'action.hover',
    //   borderColor: 'transparent',
    // },
  },
};

export function AppButton({
  variantType = 'primary',
  sx,
  text,
  children,
  ...rest
}: AppButtonProps) {
  const baseSx = variantStyles[variantType] || {};

  return (
    <Button {...rest} sx={[baseSx as SxProps<Theme>, sx as SxProps<Theme>]}>
      {text || children}
    </Button>
  );
}

export default AppButton;
