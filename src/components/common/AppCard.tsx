import React from 'react';
import { Card, type CardProps, type SxProps, type Theme } from '@mui/material';

interface AppCardProps extends CardProps {
  compact?: boolean;
}

export function AppCard({ compact = false, sx, ...rest }: AppCardProps) {
  const baseSx: SxProps<Theme> = compact
    ? {
        padding: 2,
        boxShadow: 1,
      }
    : {
        padding: 3,
        boxShadow: 2,
      };

  return <Card {...rest} sx={[baseSx, sx]} />;
}

export default AppCard;

