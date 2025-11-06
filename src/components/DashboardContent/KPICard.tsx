import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  useTheme,
} from '@mui/material';

interface KpiCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: string;
  contentFontSize?: string | number; // New prop for customizing value font size
  tenantId?: string; // Optional prop for tenant-based filtering
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  icon,
  color,
  contentFontSize = '2rem', // Default size for value font
}) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        borderRadius: 2,
        backgroundColor: theme.palette.background.paper,
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        boxShadow: theme.shadows[1],
      }}
    >
      <CardContent
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 3,
          width: '100%',
        }}
      >
        {/* Left side: Title and Value */}
        <Box sx={{ flex: 1 }}>
          <Typography
            variant='body2'
            sx={{
              color: theme.palette.text.secondary,
              mb: 0.5,
              fontWeight: 500,
            }}
          >
            {title}
          </Typography>
          <Typography
            variant='h4'
            sx={{
              color: theme.palette.text.primary,
              fontWeight: 700,
              fontSize: contentFontSize, // Dynamically applied
            }}
          >
            {value}
          </Typography>
        </Box>

        {/* Right side: Icon */}
        <Avatar
          sx={{
            bgcolor: color || theme.palette.primary.main,
            color: theme.palette.getContrastText(
              color || theme.palette.primary.main
            ),
            width: 60,
            height: 60,
            ml: 2,
            flexShrink: 0,
          }}
        >
          {icon}
        </Avatar>
      </CardContent>
    </Card>
  );
};

export default KpiCard;
