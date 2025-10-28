import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme } from '../theme';

export interface AvailabilityCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  BorderColor?: string;
  color?: string;
}

const AvailabilityCard: React.FC<AvailabilityCardProps> = ({
  title,
  value,
  icon,
  BorderColor,
}) => {
  const { theme } = useTheme();

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'var(--border-primary)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--spacing-lg)',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 'fit-content',
        minHeight: '80px',
        maxHeight: '100px',
        backgroundColor: 'var(--bg-card)',
        color: 'var(--text-primary)',
        overflow: 'hidden',
      }}
    >
      {/* Left side: Icon and Name */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-lg)',
        }}
      >
        {/* Icon container */}
        <Box
          sx={{
            backgroundColor: theme === 'dark' ? 'unset' : 'rgba(255, 255, 255, 0.2)',
            borderRadius: 'var(--radius-full)',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>

        {/* Title */}
        <Typography 
          fontSize='var(--font-size-sm)' 
          fontWeight='var(--font-weight-semibold)' 
          color='var(--text-primary)'
          fontFamily='var(--font-family-primary)'
        >
          {title}
        </Typography>
      </Box>

      {/* Right side: Bold Number */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography
          variant='h4'
          fontSize='28px'
          fontWeight='var(--font-weight-bold)'
          color='var(--text-primary)'
          sx={{
            fontFamily: 'var(--font-family-primary)',
            lineHeight: 1,
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );
};

export default AvailabilityCard;
