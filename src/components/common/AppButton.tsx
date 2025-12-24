import React from 'react';
import {
  Button,
  useTheme,
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

export function AppButton({
  variantType = 'primary',
  sx,
  text,
  children,
  ...rest
}: AppButtonProps) {
  const theme = useTheme();

  const getVariantStyles = (): SxProps<Theme> => {
    const isDark = theme.palette.mode === 'dark';

    const baseStyles: Record<AppButtonVariant, SxProps<Theme>> = {
      primary: {
        backgroundColor: 'primary.main',
        color: 'common.white',
        textTransform: 'none',
        borderRadius: '12px',
        fontWeight: 400,
        '&:hover': {
          backgroundColor: 'primary.dark',
        },
        '&:disabled': {
          backgroundColor: isDark ? '#555555' : '#ccc',
          color: isDark ? '#888888' : '#999999',
        },
      },
      secondary: {
        borderColor: 'primary.main',
        borderWidth: 1,
        borderStyle: 'solid',
        color: 'primary.main',
        textTransform: 'none',
        borderRadius: '12px',
        fontWeight: 400,
        '&:hover': {
          borderColor: 'primary.dark',
          backgroundColor: 'action.hover',
        },
        '&:disabled': {
          borderColor: isDark ? '#555555' : '#ccc',
          color: isDark ? '#555555' : '#ccc',
        },
      },
      danger: {
        backgroundColor: 'error.main',
        color: 'common.white',
        textTransform: 'none',
        borderRadius: '12px',
        fontWeight: 400,
        '&:hover': {
          backgroundColor: 'error.dark',
        },
        '&:disabled': {
          backgroundColor: isDark ? '#5a3a3a' : '#f2b8b5',
          color: isDark ? '#888888' : '#999999',
        },
      },
      ghost: {
        borderColor: 'transparent',
        color: 'text.primary',
        textTransform: 'none',
        borderRadius: '12px',
        '&:disabled': {
          color: isDark ? '#555555' : '#ccc',
        },
        '&:hover': {
          backgroundColor: 'action.hover',
          borderColor: 'transparent',
        },
      },
    };

    return baseStyles[variantType] || {};
  };

  const baseSx = getVariantStyles();

  return (
    <Button {...rest} sx={[baseSx as SxProps<Theme>, sx as SxProps<Theme>]}>
      {text || children}
    </Button>
  );
}

export default AppButton;
