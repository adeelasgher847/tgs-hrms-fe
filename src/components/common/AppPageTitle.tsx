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
    // Use rem so titles automatically scale down when we reduce `html` font-size on small screens.
    fontSize: { xs: '2rem', sm: '2.25rem', lg: '3rem' },
    lineHeight: { xs: '2.25rem', sm: '2.5rem', lg: '2.75rem' },
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
