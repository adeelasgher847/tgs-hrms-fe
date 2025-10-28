import React from 'react';
import {
  Box,
  Typography,
  Paper,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import DatePicker from 'react-multi-date-picker';
import 'react-multi-date-picker/styles/layouts/mobile.css';
import 'react-multi-date-picker/styles/colors/teal.css';

export interface AttendanceDatePickerProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  format?: string;
  range?: boolean;
  disabled?: boolean;
  responsive?: boolean;
  darkMode?: boolean;
  width?: string | number;
  height?: string | number;
}

// Separate interfaces for better type safety
export interface AttendanceDatePickerRangeProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  format?: string;
  range: true;
  disabled?: boolean;
  responsive?: boolean;
  darkMode?: boolean;
  width?: string | number;
  height?: string | number;
}

export interface AttendanceDatePickerSingleProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  format?: string;
  range: false;
  disabled?: boolean;
  responsive?: boolean;
  darkMode?: boolean;
  width?: string | number;
  height?: string | number;
}

const AttendanceDatePickerComponent: React.FC<AttendanceDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Start Date - End Date',
  format = 'MM/DD/YYYY',
  range = true,
  disabled = false,
  responsive = false,
  darkMode = false,
  width = '100%',
  height = '40px',
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const getResponsiveStyles = () => {
    if (!responsive) {
      return {
        width,
        height,
        padding: '6.5px 14px',
        fontSize: '16px',
      };
    }

    if (isMobile) {
      return {
        width: '100%',
        height: '36px',
        padding: '4px 8px',
        fontSize: '14px',
      };
    }

    if (isTablet) {
      return {
        width: '100%',
        height: '38px',
        padding: '5px 12px',
        fontSize: '15px',
      };
    }

    return {
      width: '100%',
      height: '40px',
      padding: '6.5px 14px',
      fontSize: '16px',
    };
  };

  const getResponsiveContainerStyle = () => {
    if (!responsive) {
      return { width: '100%' };
    }

    if (isMobile) {
      return { width: '100%', maxWidth: '280px' };
    }

    if (isTablet) {
      return { width: '100%', maxWidth: '320px' };
    }

    return { width: '100%', maxWidth: '400px' };
  };

  const handleDateChange = (selectedDates: any) => {
    console.log('Date change triggered:', selectedDates, 'Range:', range);
    
    if (range) {
      // For range selection
      if (selectedDates && selectedDates.length > 0) {
        if (selectedDates.length === 1) {
          // Only start date selected
          const startDate = selectedDates[0]?.format('YYYY-MM-DD') || '';
          onChange([startDate]);
        } else if (selectedDates.length === 2) {
          // Both start and end dates selected
          const startDate = selectedDates[0]?.format('YYYY-MM-DD') || '';
          const endDate = selectedDates[1]?.format('YYYY-MM-DD') || '';
          onChange([startDate, endDate]);
        }
      } else {
        // No dates selected
        onChange([]);
      }
    } else {
      // For single date selection
      if (selectedDates) {
        const singleDate = selectedDates.format('YYYY-MM-DD') || '';
        onChange(singleDate);
      } else {
        onChange('');
      }
    }
  };

  // Convert string values to Date objects for react-multi-date-picker
  const getDatePickerValue = () => {
    if (range) {
      if (Array.isArray(value) && value.length > 0) {
        return value.map(dateStr => new Date(dateStr));
      }
      return [];
    } else {
      if (typeof value === 'string' && value) {
        return new Date(value);
      }
      return null;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <DatePicker
        value={getDatePickerValue()}
        onChange={handleDateChange}
        range={range}
        format={format}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          ...getResponsiveStyles(),
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '4px',
          fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
          backgroundColor: 'transparent',
          outline: 'none',
          color: theme.palette.text.primary,
        }}
        containerStyle={getResponsiveContainerStyle()}
        inputClass={`custom-date-picker-input ${darkMode ? 'theme-dark' : ''}`}
        className={`custom-date-picker ${darkMode ? 'theme-dark' : ''}`}
        editable={false}
        showOtherDays={true}
        onOpen={() => {
          // Prevent body scroll when calendar opens
          document.body.style.overflow = 'hidden';
        }}
        onClose={() => {
          // Restore body scroll when calendar closes
          document.body.style.overflow = 'auto';
        }}
        calendarPosition={responsive && isMobile ? 'bottom-center' : 'bottom-start'}
        numberOfMonths={responsive && isMobile ? 1 : 2}
        weekNumber=""
        highlightToday={true}
        highlightSelectedMonth={true}
        highlightWeekends={true}
        weekDays={['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']}
        months={[
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ]}
        weekStartDayIndex={1} // Start week on Monday
        arrowStyle={{
          color: theme.palette.primary.main,
        }}
        headerStyle={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
        }}
        dayStyle={{
          color: theme.palette.text.primary,
        }}
        selectedDayStyle={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
        }}
        todayStyle={{
          backgroundColor: theme.palette.secondary.main,
          color: theme.palette.secondary.contrastText,
        }}
        weekendStyle={{
          color: theme.palette.error.main,
        }}
        otherMonthDayStyle={{
          color: theme.palette.text.disabled,
        }}
      />
    </Box>
  );
};

export default AttendanceDatePickerComponent;
