import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Button } from '@mui/material';
import { useTheme } from '../theme';
import AvailabilityCard from './AvailabilityCard';
import CheckedIcon from './checked.svg';
import BeachIcon from './beach-bed.svg';

export interface AvailabilityCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  BorderColor?: string;
  color?: string;
}

const AvailabilityCardComponent: React.FC<AvailabilityCardProps> = ({
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
        minHeight: '80px',
        backgroundColor: 'var(--bg-card)',
        color: 'var(--text-primary)',
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
          <Box 
            component='span' 
            color='var(--text-primary)' 
            sx={{ 
              fontSize: '24px',
              '& svg': {
                color: 'var(--text-muted)',
              },
            }}
          >
            {icon}
          </Box>
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

const EmployeesAvailability: React.FC = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState<number>(0);
  const [leavesData, setLeavesData] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Mock data fetch (simulating API call)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock data - you can change these values for different scenarios
        setAttendanceData(45);
        setLeavesData(12);
      } catch (err) {
        setError('Failed to load data');
        setAttendanceData(0);
        setLeavesData(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const labels = {
    en: 'Employees Availability',
    ar: 'توفر الموظفين',
  };

  const cardTitles = {
    Attendance: { en: 'Attendance', ar: 'الحضور' },
    'Leave Apply': { en: 'Leave Apply', ar: 'طلب إجازة' },
  };

  const cards = [
    {
      title: cardTitles['Attendance'].en,
      value: attendanceData,
      icon: (
        <img
          src={CheckedIcon}
          alt='Attendance'
          style={{
            width: 30,
            height: 30,
            filter: theme === 'dark'
              ? 'invert(1) brightness(0.4)'
              : 'grayscale(100%) brightness(55%)',
          }}
        />
      ),
    },
    {
      title: cardTitles['Leave Apply'].en,
      value: leavesData,
      icon: (
        <img
          src={BeachIcon}
          alt='LeaveApply'
          style={{
            width: 30,
            height: 30,
            filter: theme === 'dark'
              ? 'invert(1) brightness(0.4)'
              : 'grayscale(100%) brightness(55%)',
          }}
        />
      ),
    },
  ];

  return (
    <Box
      sx={{
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-card)',
        height: 'fit-content',
        minHeight: '200px',
        maxHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
      p={2}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 'var(--spacing-lg)',
        }}
      >
        <Typography 
          fontWeight='var(--font-weight-bold)' 
          fontSize='var(--font-size-lg)' 
          color='var(--text-primary)'
          fontFamily='var(--font-family-primary)'
        >
          {labels.en}
          {!error && attendanceData > 0 && (
            <Typography
              component='span'
              variant='caption'
              sx={{
                ml: 1,
                color: 'var(--chart-color-5)',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              (Live Data)
            </Typography>
          )}
          {error && (
            <Typography
              component='span'
              variant='caption'
              sx={{
                ml: 1,
                color: 'var(--chart-color-6)',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              (Error)
            </Typography>
          )}
        </Typography>
      </Box>

      {loading ? (
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          height={100}
        >
          <CircularProgress sx={{ color: 'var(--primary-color)' }} />
        </Box>
      ) : error ? (
        <Box
          display='flex'
          flexDirection='column'
          justifyContent='center'
          alignItems='center'
          height={100}
          gap='var(--spacing-lg)'
        >
          <Typography 
            color='var(--chart-color-6)' 
            variant='body2' 
            textAlign='center'
            fontFamily='var(--font-family-primary)'
          >
            {error}
          </Typography>
          <Button 
            variant='contained' 
            size='small'
            sx={{
              backgroundColor: 'var(--primary-color)',
              color: 'var(--primary-text)',
              '&:hover': {
                backgroundColor: 'var(--primary-dark)',
              },
            }}
          >
            Retry
          </Button>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-md)',
            flex: 1,
            justifyContent: 'flex-start',
            overflow: 'hidden',
          }}
        >
          {cards.map(card => (
            <Box
              key={card.title}
              sx={{
                flex: '0 0 auto',
                height: 'fit-content',
              }}
            >
              <AvailabilityCardComponent {...card} />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default EmployeesAvailability;
