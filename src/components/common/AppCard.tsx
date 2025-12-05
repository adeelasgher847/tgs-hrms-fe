import { Card, type CardProps, type SxProps, type Theme } from '@mui/material';

interface AppCardProps extends CardProps {
  compact?: boolean;
}

export function AppCard({ compact = false, sx, ...rest }: AppCardProps) {
  const baseSx: SxProps<Theme> = compact
    ? {
        boxShadow: 1,
      }
    : {
        boxShadow: 2,
      };

  const combinedSx: SxProps<Theme> = sx
    ? ([baseSx, sx] as SxProps<Theme>)
    : baseSx;

  return <Card {...rest} sx={combinedSx} />;
}

export default AppCard;

