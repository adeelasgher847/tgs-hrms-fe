import React, { useState } from 'react';
import { Box, TextField, Button, MenuItem, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import type { CreateLeaveRequest } from '../../api/leaveApi';

const leaveTypes = [
  { value: 'Sick', label: 'Sick' },
  { value: 'Casual', label: 'Casual' },
  { value: 'Vacation', label: 'Vacation' },
  { value: 'Emergency', label: 'Emergency' },
  { value: 'Other', label: 'Other' },
];

const LeaveForm = ({
  onSubmit,
}: {
  onSubmit: (data: CreateLeaveRequest) => void;
}) => {
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [reason, setReason] = useState('');
  const [type, setType] = useState('sick');

  // Get tomorrow's date (minimum selectable date)
  const getTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  };

  const handleFromDateChange = (newValue: Date | null) => {
    setFromDate(newValue);

    // Auto-adjust toDate if it's before the new fromDate
    if (newValue && toDate && newValue > toDate) {
      setToDate(newValue);
    }
  };

  const handleToDateChange = (newValue: Date | null) => {
    setToDate(newValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fromDate || !toDate) {
      return;
    }

    onSubmit({
      fromDate: fromDate.toISOString().split('T')[0],
      toDate: toDate.toISOString().split('T')[0],
      reason,
      type,
    });

    // Clear form fields after successful submission
    setFromDate(null);
    setToDate(null);
    setReason('');
    setType('sick');
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        component='form'
        onSubmit={handleSubmit}
        sx={{
          backgroundColor: 'background.paper',
          p: 4,
          borderRadius: 2,
          // boxShadow: 1,
          maxWidth: 600,
          mx: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Typography variant='h5' color='primary' mb={2}>
          Apply for Leave
        </Typography>

        <DatePicker
          label='From Date'
          value={fromDate}
          onChange={handleFromDateChange}
          minDate={getTomorrow()}
          slotProps={{
            textField: {
              fullWidth: true,
              required: true,
            },
          }}
        />

        <DatePicker
          label='To Date'
          value={toDate}
          onChange={handleToDateChange}
          minDate={fromDate || getTomorrow()}
          slotProps={{
            textField: {
              fullWidth: true,
              required: true,
            },
          }}
        />

        <TextField
          label='Reason'
          multiline
          minRows={2}
          value={reason}
          onChange={e => setReason(e.target.value)}
          required
        />

        <TextField
          select
          label='Type'
          value={type}
          onChange={e => setType(e.target.value)}
        >
          {leaveTypes.map(option => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <Button
          type='submit'
          variant='contained'
          color='primary'
          sx={{ mt: 2 }}
        >
          Apply
        </Button>
      </Box>
    </LocalizationProvider>
  );
};

export default LeaveForm;
