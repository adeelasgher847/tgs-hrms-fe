import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, MenuItem, Typography } from '@mui/material';
import { useLanguage } from '../../hooks/useLanguage';
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

  const { language } = useLanguage();
  const labels = {
    en: {
      heading: 'Apply for Leave',
      pleaseFill: 'Please fill in all required fields.',
      success: 'Leave request submitted successfully.',
      failed: 'Failed to submit leave request.',
      leaveType: 'Leave Type',
      noLeaveTypes: 'No leave types available',
      startDate: 'Start Date',
      endDate: 'End Date',
      reason: 'Reason',
      submitting: 'Submitting...',
      apply: 'Apply',
    },
    ar: {
      heading: 'تقديم طلب إجازة',
      pleaseFill: 'يرجى ملء جميع الحقول المطلوبة.',
      success: 'تم تقديم طلب الإجازة بنجاح.',
      failed: 'فشل في إرسال طلب الإجازة.',
      leaveType: 'نوع الإجازة',
      noLeaveTypes: 'لا توجد أنواع إجازة متاحة',
      startDate: 'تاريخ البدء',
      endDate: 'تاريخ الانتهاء',
      reason: 'السبب',
      submitting: 'جاري الإرسال...',
      apply: 'تقديم',
    },
  } as const;
  const L = labels[language as 'en' | 'ar'] || labels.en;

  // ✅ Fetch leave types
  const failedMsg = L.failed;
  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        const response = await leaveApi.getLeaveTypes({ page: 1, limit: 50 });
        setLeaveTypes(response.items || []);
      } catch (error) {
        console.error('Failed to load leave types:', error);
        onError?.('Failed to load leave types.');
      } finally {
        setLoadingLeaveTypes(false);
      }
    };

    fetchLeaveTypes();
    // intentionally run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const response = await leaveApi.createLeave(payload);
      console.log('Leave created:', response);
      onSubmit?.(payload);
      setLeaveTypeId('');
      setStartDate(null);
      setEndDate(null);
      setReason('');
    } catch (error: unknown) {
      console.error('Error creating leave:', error);

      let errorMessage: string = L.failed;
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
        <Typography
          variant='h5'
          color='primary'
          mb={2}
          dir={language === 'ar' ? 'rtl' : 'ltr'}
          sx={{ textAlign: language === 'ar' ? 'right' : 'left' }}
        >
          {L.heading}
        </Typography>

        <TextField
          select
          label={L.leaveType}
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
            <MenuItem disabled>{L.noLeaveTypes}</MenuItem>
          )}
        </TextField>

        {/* Start Date */}
        <DatePicker
          label={L.startDate}
          value={startDate}
          onChange={newValue => {
            setStartDate(newValue as unknown as Date | null);
            if (newValue && endDate && newValue > endDate) {
              setEndDate(newValue as unknown as Date | null);
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
          label={L.endDate}
          value={endDate}
          onChange={newValue => setEndDate(newValue as unknown as Date | null)}
          minDate={startDate || getToday()}
          slotProps={{
            textField: {
              fullWidth: true,
              required: true,
            },
          }}
        />

        <TextField
          label={L.reason}
          multiline
          minRows={2}
          value={reason}
          onChange={e => setReason(e.target.value)}
          required
        />

        <Box sx={{ display: 'flex' }}>
          <Button
            type='submit'
            variant='contained'
            color='primary'
            disabled={loading}
            sx={{
              alignSelf: language === 'ar' ? 'flex-start' : 'flex-end',
            }}
          >
            {loading ? L.submitting : L.apply}
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default LeaveForm;
