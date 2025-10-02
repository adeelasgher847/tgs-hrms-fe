import React from 'react';
import { Box, IconButton, Typography, Paper } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

interface DateNavigationProps {
  currentDate: string; // YYYY-MM-DD format or 'all' for showing all records
  onDateChange: (newDate: string) => void;
  disabled?: boolean;
}

const DateNavigation: React.FC<DateNavigationProps> = ({
  currentDate,
  onDateChange,
  disabled = false,
}) => {
  // Get the current date and generate 5 consecutive dates (including current date)
  const getDateSequence = (dateStr: string) => {
    // If dateStr is 'all', use today's date as the center
    const centerDate = dateStr === 'all' ? new Date() : new Date(dateStr);
    const dates = [];
    
    // Start from 4 days before the current date to show 5 days total
    for (let i = 4; i >= 0; i--) {
      const d = new Date(centerDate);
      d.setDate(centerDate.getDate() - i);
      dates.push(d);
    }
    
    return dates.reverse();
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
    if (currentDate === 'all') {
      // If currently showing all, navigate from today
      const date = new Date();
      date.setDate(date.getDate() - 1);
      onDateChange(formatDateToString(date));
    } else {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - 1);
      onDateChange(formatDateToString(date));
    }
  };

  const handleNext = () => {
    if (currentDate === 'all') {
      // If currently showing all, navigate from today
      const date = new Date();
      date.setDate(date.getDate() + 1);
      onDateChange(formatDateToString(date));
    } else {
      const date = new Date(currentDate);
      date.setDate(date.getDate() + 1);
      onDateChange(formatDateToString(date));
    }
  };

  const handleDateClick = (date: Date) => {
    onDateChange(formatDateToString(date));
  };

  const dateSequence = getDateSequence(currentDate);
  const today = formatDateToString(new Date());

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3,justifyContent: 'center', mt: 3 }}>
      {/* Previous Button */}
      <IconButton
        onClick={handlePrevious}
        disabled={disabled}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '8px',
          width: 40,
          height: 40,
        }}
      >
        <ChevronLeft />
      </IconButton>

      {/* Date Sequence */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center',}}>
        {dateSequence.map((date, index) => {
          const dateStr = formatDateToString(date);
          const isToday = dateStr === today;
          const isSelected = currentDate === 'all' ? false : dateStr === currentDate;
          
          return (
            <Paper
              key={dateStr}
              onClick={() => handleDateClick(date)}
              sx={{
                p: 1,
                minWidth: 56,
                textAlign: 'center',
                cursor: 'pointer',
                border: isSelected ? '2px solid' : '1px solid',
                borderColor: isSelected ? 'primary.main' : 'divider',
                backgroundColor: isSelected ? 'primary.50' : isToday ? 'action.hover' : 'background.paper',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
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
                  fontWeight: isSelected ? 600 : isToday ? 500 : 400,
                  color: isSelected ? 'primary.main' : isToday ? 'primary.dark' : 'text.primary',
                  fontSize: '0.875rem',
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
        disabled={disabled}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '8px',
          width: 40,
          height: 40,
        }}
      >
        <ChevronRight />
      </IconButton>
    </Box>
  );
};

export default DateNavigation;
