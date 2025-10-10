import React, { useState, useEffect } from 'react';
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
              onClick={() => handleDateClick(date, index)}
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
                boxShadow: 'none',
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
        disabled={disabled || isNextDisabled}
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
