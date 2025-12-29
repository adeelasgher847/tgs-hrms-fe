import React from 'react';
import { Typography, type SxProps, type Theme } from '@mui/material';

interface AppPageTitleProps {
  children: React.ReactNode;
  sx?: SxProps<Theme>;
  isRtl?: boolean;
  component?: React.ElementType;
}

export default function AppPageTitle({
  children,
  sx,
  isRtl = false,
  component = 'h1',
}: AppPageTitleProps) {
  const baseSx: SxProps<Theme> = {
    direction: isRtl ? 'rtl' : 'ltr',
    color: 'text.primary',
    textAlign: { xs: 'left' },
    fontWeight: 500,
    fontSize: { xs: '32px', lg: '48px' },
    lineHeight: '44px',
    letterSpacing: '-2%',
    mb: 3,
  };

  return (
    <Typography
      component={component}
      sx={sx ? ([baseSx, sx] as SxProps<Theme>) : baseSx}
    >
      {children}
    </Typography>
  );
}
