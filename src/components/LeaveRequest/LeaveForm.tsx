import React, { useState, useEffect } from 'react';
import { Box, TextField, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import type { SelectChangeEvent } from '@mui/material/Select';

import AppButton from '../common/AppButton';
import AppDropdown from '../common/AppDropdown';
import { leaveApi, type LeaveType } from '../../api/leaveApi';
import AppPageTitle from '../common/AppPageTitle';
import type { LeaveResponse as Leave } from '../../api/leaveApi';

interface LeaveFormProps {
  /** create | edit */
  mode?: 'create' | 'edit';

  /** required for edit */
  leaveId?: string;
  initialData?: Leave;

  /** create callback (optional – backward compatible) */
  onSubmit?: (data: {
    employeeId?: string;
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason: string;
    documents?: File[];
  }) => void;

  onSuccess?: () => void;
  onError?: (message: string) => void;
  employees?: { id: string; name: string }[];
}

const LeaveForm: React.FC<LeaveFormProps> = ({
  mode = 'create',
  leaveId,
  initialData,
  onSubmit,
  onSuccess,
  onError,
  employees,
}) => {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loadingLeaveTypes, setLoadingLeaveTypes] = useState(true);

  const [employeeId, setEmployeeId] = useState('');
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [reason, setReason] = useState('');
  const [documents, setDocuments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  /* ------------------ PREFILL (EDIT MODE) ------------------ */
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setEmployeeId(initialData.employeeId || '');
      setLeaveTypeId(initialData.leaveTypeId || '');
      setStartDate(new Date(initialData.startDate));
      setEndDate(new Date(initialData.endDate));
      setReason(initialData.reason || '');
    }
  }, [mode, initialData]);

  /* ------------------ FETCH LEAVE TYPES ------------------ */
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

  const getToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  /* ------------------ FILE HANDLING ------------------ */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const newFiles = Array.from(e.target.files);
    setDocuments(prev => {
      const existing = new Set(prev.map(f => f.name));
      return [...prev, ...newFiles.filter(f => !existing.has(f.name))];
    });

    e.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  /* ------------------ SUBMIT ------------------ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !leaveTypeId ||
      !startDate ||
      !endDate ||
      !reason.trim() ||
      (employees && !employeeId)
    ) {
      onError?.('Please fill in all required fields.');
      return;
    }

    setLoading(true);

    try {
      /* -------- EDIT MODE (PATCH) -------- */
      if (mode === 'edit' && leaveId && initialData) {
        const payload: any = {};

        if (leaveTypeId !== initialData.leaveTypeId)
          payload.leaveTypeId = leaveTypeId;

        if (formatDate(startDate) !== initialData.startDate)
          payload.startDate = formatDate(startDate);

        if (formatDate(endDate) !== initialData.endDate)
          payload.endDate = formatDate(endDate);

        if (reason.trim() !== initialData.reason)
          payload.reason = reason.trim();

        if (documents.length > 0) payload.documents = documents;

        if (Object.keys(payload).length === 0) {
          onError?.('No changes to update.');
          return;
        }

        await leaveApi.updateLeave(leaveId, payload);
        onSuccess?.();
        return;
      }

      /* -------- CREATE MODE -------- */
      const payload = {
        employeeId: employees ? employeeId : undefined,
        leaveTypeId,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        reason: reason.trim(),
        documents: documents.length > 0 ? documents : undefined,
      };

      onSubmit?.(payload);
      onSuccess?.();

      setEmployeeId('');
      setLeaveTypeId('');
      setStartDate(null);
      setEndDate(null);
      setReason('');
      setDocuments([]);
    } catch {
      onError?.('Failed to submit leave request.');
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ UI ------------------ */
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
        <AppPageTitle>
          {mode === 'edit' ? 'Edit Leave' : 'Apply for Leave'}
        </AppPageTitle>

        {employees && mode === 'create' && (
          <AppDropdown
            label='Employee'
            value={employeeId}
            onChange={(e: SelectChangeEvent) =>
              setEmployeeId(String(e.target.value))
            }
            options={employees.map(emp => ({
              value: emp.id,
              label: emp.name,
            }))}
            required
            containerSx={{ width: '100%' }}
            placeholder='Select Employee'
            showLabel
          />
        )}

        <AppDropdown
          label='Leave Type'
          value={leaveTypeId}
          onChange={(e: SelectChangeEvent) =>
            setLeaveTypeId(String(e.target.value))
          }
          options={leaveTypes.map(type => ({
            value: type.id,
            label: type.name,
          }))}
          disabled={loadingLeaveTypes}
          containerSx={{ width: '100%' }}
          placeholder='Leave Type'
          showLabel
        />

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
          slotProps={{ textField: { fullWidth: true, required: true } }}
        />

        <DatePicker
          label='End Date'
          value={endDate}
          onChange={setEndDate}
          minDate={startDate || getToday()}
          slotProps={{ textField: { fullWidth: true, required: true } }}
        />

        <TextField
          label='Reason'
          multiline
          minRows={2}
          value={reason}
          onChange={e => setReason(e.target.value)}
          required
        />

        <Box>
          <Typography variant='subtitle2' mb={0.5}>
            Supporting Documents (Optional)
          </Typography>

          <TextField
            type='file'
            inputProps={{ multiple: true }}
            onChange={handleFileChange}
            fullWidth
          />

          {documents.length > 0 && (
            <Box mt={1}>
              {documents.map((file, index) => (
                <Box
                  key={`${file.name}-${index}`}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mt: 0.5,
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: 'action.hover',
                  }}
                >
                  <Typography variant='body2' noWrap>
                    {file.name}
                  </Typography>
                  <Typography
                    variant='body2'
                    color='error'
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleRemoveFile(index)}
                  >
                    Remove
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <AppButton
          type='submit'
          variantType='contained'
          text={loading ? 'Saving...' : mode === 'edit' ? 'Update' : 'Apply'}
          disabled={loading}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default LeaveForm;
