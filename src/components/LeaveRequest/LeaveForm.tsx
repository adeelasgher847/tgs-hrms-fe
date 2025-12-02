import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, MenuItem, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { leaveApi, type LeaveType } from '../../api/leaveApi';

interface LeaveFormProps {
  onSubmit?: (data: {
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason: string;
  }) => void;
}

const LeaveForm: React.FC<LeaveFormProps> = ({ onSubmit }) => {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loadingLeaveTypes, setLoadingLeaveTypes] = useState(true);

  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // ✅ Fetch leave types
  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        const response = await leaveApi.getLeaveTypes({ page: 1, limit: 50 });
        setLeaveTypes(response.items || []);
      } catch (error) {
        console.error('Failed to load leave types:', error);
        setMessage('Failed to load leave types.');
      } finally {
        setLoadingLeaveTypes(false);
      }
    };

    fetchLeaveTypes();
  }, []);

  // ✅ Allow same day leave
  const getToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  // Format date YYYY-MM-DD for backend
  const formatDateLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!leaveTypeId.trim() || !startDate || !endDate || !reason.trim()) {
      setMessage('Please fill in all required fields.');
      return;
    }

    const payload = {
      leaveTypeId,
      startDate: formatDateLocal(startDate),
      endDate: formatDateLocal(endDate),
      reason: reason.trim(),
    };

    setLoading(true);
    setMessage(null);

    try {
      const response = await leaveApi.createLeave(payload);
      console.log('Leave created:', response);
      setMessage('Leave request submitted successfully.');

      onSubmit?.(payload);
      setLeaveTypeId('');
      setStartDate(null);
      setEndDate(null);
      setReason('');
    } catch (error: unknown) {
      console.error('Error creating leave:', error);

      let errorMessage = 'Failed to submit leave request.';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      }

      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
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

        {message && (
          <Typography
            variant='body1'
            sx={{
              color: message.includes('successfully') ? 'green' : 'error.main',
              mb: 1,
            }}
          >
            {message}
          </Typography>
        )}

        <TextField
          select
          label='Leave Type'
          value={leaveTypeId}
          onChange={e => setLeaveTypeId(e.target.value)}
          required
          fullWidth
          disabled={loadingLeaveTypes}
        >
          {leaveTypes.length > 0 ? (
            leaveTypes.map(type => (
              <MenuItem key={type.id} value={type.id}>
                {type.name}
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled>No leave types available</MenuItem>
          )}
        </TextField>

        {/* Start Date */}
        <DatePicker
          label='Start Date'
          value={startDate}
          onChange={newValue => {
            setStartDate(newValue);
            if (newValue && endDate && newValue > endDate) {
              setEndDate(newValue);
            }
          }}
          minDate={getToday()}
          slotProps={{
            textField: {
              fullWidth: true,
              required: true,
            },
          }}
        />

        {/* End Date */}
        <DatePicker
          label='End Date'
          value={endDate}
          onChange={newValue => setEndDate(newValue)}
          minDate={startDate || getToday()}
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

        <Button
          type='submit'
          variant='contained'
          color='primary'
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Apply'}
        </Button>
      </Box>
    </LocalizationProvider>
  );
};

export default LeaveForm;
