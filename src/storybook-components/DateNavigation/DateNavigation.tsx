import React, { useState, useEffect } from 'react';
import { Box, IconButton, Typography, Paper, useMediaQuery, useTheme } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

export interface DateNavigationProps {
  currentDate: string; // YYYY-MM-DD format or 'all' for showing all records
  onDateChange: (newDate: string) => void;
  disabled?: boolean;
  responsive?: boolean;
}

const DateNavigationComponent: React.FC<DateNavigationProps> = ({
  currentDate,
  onDateChange,
  disabled = false,
  responsive = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // State to track the center date of the sequence
  const [sequenceCenter, setSequenceCenter] = useState<Date>(new Date());
  
  // Get a date sequence centered around the sequenceCenter state
  const getDateSequence = () => {
    const dates = [];
    
    // Show 5 days centered around sequenceCenter
    for (let i = 2; i >= -2; i--) {
      const d = new Date(sequenceCenter);
      d.setDate(sequenceCenter.getDate() + i);
      dates.push(d);
    }
    
    return dates;
  };

  const formatDate = (date: Date) => {
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    
    // Add ordinal suffix to day
    const getOrdinalSuffix = (day: number) => {
      if (day >= 11 && day <= 13) {
        return 'th';
      }
      switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    
    return `${day}${getOrdinalSuffix(day)} ${month}`;
  };

  const formatDateToString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handlePrevious = () => {
    const newCenter = new Date(sequenceCenter);
    newCenter.setDate(sequenceCenter.getDate() - 1);
    setSequenceCenter(newCenter);
    
    onDateChange(formatDateToString(newCenter));
  };

  const handleNext = () => {
    // Move the sequence center forward by 1 day
    const newCenter = new Date(sequenceCenter);
    newCenter.setDate(sequenceCenter.getDate() + 1);
    setSequenceCenter(newCenter);
    
    onDateChange(formatDateToString(newCenter));
  };

  const handleDateClick = (date: Date, index: number) => {
    // If clicking on the last date (index 4), slide it to position 2 (center)
    if (index === 4) {
      // Move the sequence center to make the clicked date the center
      const newCenter = new Date(date);
      setSequenceCenter(newCenter);
    }
    onDateChange(formatDateToString(date));
  };

  // Reset sequence center to today when currentDate is 'all'
  useEffect(() => {
    if (currentDate === 'all') {
      setSequenceCenter(new Date());
    }
  }, [currentDate]);

  // Ensure the rightmost date doesn't exceed today
  useEffect(() => {
    const dateSequence = getDateSequence();
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    
    const rightmostDate = new Date(dateSequence[dateSequence.length - 1]);
    rightmostDate.setHours(0, 0, 0, 0);
    
    // If rightmost date is in the future, adjust sequence center
    if (rightmostDate > todayDate) {
      const adjustedCenter = new Date(todayDate);
      adjustedCenter.setDate(todayDate.getDate() - 2); // Center should be 2 days before today
      setSequenceCenter(adjustedCenter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sequenceCenter]);

  const dateSequence = getDateSequence();
  const today = formatDateToString(new Date());
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  // Check if the rightmost date exceeds today
  const rightmostDate = new Date(dateSequence[dateSequence.length - 1]);
  rightmostDate.setHours(0, 0, 0, 0);
  
  // Disable next button if the rightmost date is today or in the future
  const isNextDisabled = rightmostDate >= todayDate;

  // Responsive styles
  const getResponsiveStyles = () => {
    if (!responsive) {
      return {
        container: {
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 3,
          justifyContent: 'center',
          mt: 3,
        },
        button: {
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '8px',
          width: 40,
          height: 40,
        },
        datePaper: {
          p: 1,
          minWidth: 56,
          textAlign: 'center',
          cursor: 'pointer',
          borderRadius: '8px',
          transition: 'all 0.2s ease',
          boxShadow: 'none',
        },
        typography: {
          fontSize: '0.875rem',
        },
      };
    }

    if (isMobile) {
      return {
        container: {
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          mb: 2,
          justifyContent: 'center',
          mt: 2,
        },
        button: {
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '6px',
          width: 32,
          height: 32,
        },
        datePaper: {
          p: 0.5,
          minWidth: 60,
          textAlign: 'center',
          cursor: 'pointer',
          borderRadius: '6px',
          transition: 'all 0.2s ease',
          boxShadow: 'none',
        },
        typography: {
          fontSize: '0.75rem',
        },
      };
    }

    if (isTablet) {
      return {
        container: {
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          mb: 2.5,
          justifyContent: 'center',
          mt: 2.5,
        },
        button: {
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '7px',
          width: 36,
          height: 36,
        },
        datePaper: {
          p: 0.75,
          minWidth: 58,
          textAlign: 'center',
          cursor: 'pointer',
          borderRadius: '7px',
          transition: 'all 0.2s ease',
          boxShadow: 'none',
        },
        typography: {
          fontSize: '0.8rem',
        },
      };
    }

    return {
      container: {
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mb: 3,
        justifyContent: 'center',
        mt: 3,
      },
      button: {
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '8px',
        width: 40,
        height: 40,
      },
      datePaper: {
        p: 1,
        minWidth: 56,
        textAlign: 'center',
        cursor: 'pointer',
        borderRadius: '8px',
        transition: 'all 0.2s ease',
        boxShadow: 'none',
      },
      typography: {
        fontSize: '0.875rem',
      },
    };
  };

  const styles = getResponsiveStyles();

  return (
    <Box sx={styles.container}>
      {/* Previous Button */}
      <IconButton
        onClick={handlePrevious}
        disabled={disabled}
        sx={styles.button}
      >
        <ChevronLeft fontSize={responsive && isMobile ? 'small' : 'medium'} />
      </IconButton>

      {/* Date Sequence */}
      <Box sx={{ display: 'flex', gap: responsive ? (isMobile ? 0.5 : isTablet ? 0.75 : 1) : 1, alignItems: 'center' }}>
        {dateSequence.map((date, index) => {
          const dateStr = formatDateToString(date);
          const isToday = dateStr === today;
          const isSelected = currentDate === 'all' ? false : dateStr === currentDate;
          
          return (
            <Paper
              key={dateStr}
              onClick={() => handleDateClick(date, index)}
              sx={{
                ...styles.datePaper,
                border: isSelected ? '2px solid' : '1px solid',
                borderColor: isSelected ? 'primary.main' : 'divider',
                backgroundColor: isSelected ? 'primary.50' : isToday ? 'action.hover' : 'background.paper',
                '&:hover': {
                  backgroundColor: isSelected ? 'primary.100' : 'action.hover',
                  transform: 'translateY(-1px)',
                  boxShadow: 2,
                },
                opacity: disabled ? 0.6 : 1,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  ...styles.typography,
                  fontWeight: isSelected ? 600 : isToday ? 500 : 400,
                  color: isSelected ? 'primary.main' : isToday ? 'primary.dark' : 'text.primary',
                }}
              >
                {formatDate(date)}
              </Typography>
            </Paper>
          );
        })}
      </Box>

      {/* Next Button */}
      <IconButton
        onClick={handleNext}
        disabled={disabled || isNextDisabled}
        sx={styles.button}
      >
        <ChevronRight fontSize={responsive && isMobile ? 'small' : 'medium'} />
      </IconButton>
    </Box>
  );
};

export default DateNavigationComponent;
