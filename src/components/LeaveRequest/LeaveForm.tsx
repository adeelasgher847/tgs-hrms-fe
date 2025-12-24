import React, { useState, useEffect } from 'react';
import { Box, TextField, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { leaveApi, type LeaveType } from '../../api/leaveApi';
import AppButton from '../common/AppButton';
import AppDropdown from '../common/AppDropdown';
import type { SelectChangeEvent } from '@mui/material/Select';

interface LeaveFormProps {
  onSubmit?: (data: {
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason: string;
  }) => void;
  onError?: (message: string) => void;
}

const LeaveForm: React.FC<LeaveFormProps> = ({ onSubmit, onError }) => {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loadingLeaveTypes, setLoadingLeaveTypes] = useState(true);

  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ Fetch leave types
  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        const response = await leaveApi.getLeaveTypes({ page: 1, limit: 50 });
        setLeaveTypes(response.items || []);
      } catch {
        onError?.('Failed to load leave types.');
      } finally {
        setLoadingLeaveTypes(false);
      }
    };

    fetchLeaveTypes();
  }, [onError]);

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
      onError?.('Please fill in all required fields.');
      return;
    }

    const payload = {
      leaveTypeId,
      startDate: formatDateLocal(startDate),
      endDate: formatDateLocal(endDate),
      reason: reason.trim(),
    };

    setLoading(true);

    try {
      await leaveApi.createLeave(payload);
      onSubmit?.(payload);
      setLeaveTypeId('');
      setStartDate(null);
      setEndDate(null);
      setReason('');
    } catch (error: unknown) {
      let errorMessage = 'Failed to submit leave request.';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      }

      onError?.(errorMessage);
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

        <AppDropdown
          label='Leave Type'
          value={leaveTypeId || ''}
          onChange={(e: SelectChangeEvent<string | number>) =>
            setLeaveTypeId(String(e.target.value || ''))
          }
          options={
            leaveTypes.length > 0
              ? leaveTypes.map(type => ({ value: type.id, label: type.name }))
              : [{ value: '', label: 'No leave types available' }]
          }
          disabled={loadingLeaveTypes || leaveTypes.length === 0}
          containerSx={{ width: '100%' }}
          placeholder='Leave Type'
          showLabel
        />

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

        <AppButton
          type='submit'
          variantType='contained'
          text={loading ? 'Submitting...' : 'Apply'}
          disabled={loading}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default LeaveForm;
