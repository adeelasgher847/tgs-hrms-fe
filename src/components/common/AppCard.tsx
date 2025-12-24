import { Card, type CardProps, type SxProps, type Theme } from '@mui/material';

interface AppCardProps extends CardProps {
  compact?: boolean;
}

export function AppCard({
  compact = false,
  sx,
  pading,
  ...rest
}: AppCardProps) {
  const baseSx: SxProps<Theme> = compact
    ? {
        padding: pading !== undefined ? pading : 1,
        boxShadow: '0 1px 3px rgba(16,24,40,0.04)',
        borderRadius: 2,
        bgcolor: 'background.paper',
      }
    : {
        padding: pading !== undefined ? pading : 2,
        boxShadow: '0 6px 18px rgba(16,24,40,0.06)',
        borderRadius: 2,
        bgcolor: 'background.paper',
      };

  const combinedSx: SxProps<Theme> = sx
    ? ([baseSx, sx] as SxProps<Theme>)
    : baseSx;

  return <Card {...rest} sx={combinedSx} />;
}

export default AppCard;
