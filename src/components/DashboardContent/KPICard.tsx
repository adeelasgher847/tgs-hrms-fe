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
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon, color }) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        borderRadius: 1,
        // boxShadow: theme.shadows[2],
        backgroundColor: theme.palette.background.paper,
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <CardContent
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: { xs: 2.5, sm: 3, md: 4 },
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
              fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
            }}
          >
            {title}
          </Typography>
          <Typography
            variant='h4'
            sx={{
              color: theme.palette.text.primary,
              fontWeight: 700,
              fontSize: { xs: '1.6rem', sm: '2rem', md: '2.2rem' },
            }}
          >
            {value}
          </Typography>
        </Box>

        {/* Right side: Icon */}
        <Avatar
          sx={{
            backgroundColor: color || theme.palette.primary.main,
            color: theme.palette.getContrastText(
              color || theme.palette.primary.main
            ),
            width: { xs: 52, sm: 60, md: 68 },
            height: { xs: 52, sm: 60, md: 68 },
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
