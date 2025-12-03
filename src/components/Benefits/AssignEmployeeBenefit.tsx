import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import type { AlertColor } from '@mui/material/Alert';

import employeeApi from '../../api/employeeApi';
import benefitsApi from '../../api/benefitApi';
import employeeBenefitApi from '../../api/employeeBenefitApi';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  name?: string;
}

interface Benefit {
  id: string;
  name: string;
}

interface AssignEmployeeBenefitValues {
  employeeId: string;
  benefitIds: string[];
  startDate: string;
  endDate: string;
}

const schema = yup.object({
  employeeId: yup.string().required('Employee is required'),
  benefitIds: yup
    .array()
    .min(1, 'Select at least one benefit')
    .required('Benefits are required'),
  startDate: yup.string().required('Start date is required'),
  endDate: yup.string().required('End date is required'),
});

const AssignEmployeeBenefit: React.FC<{
  open: boolean;
  onClose: () => void;
  onAssigned?: () => void;
}> = ({ open, onClose, onAssigned }) => {
  const { language } = useLanguage();

  const labels = {
    en: {
      title: 'Assign Benefits to Employee',
      selectEmployee: 'Select Employee',
      selectBenefits: 'Select Benefits',
      startDate: 'Start Date',
      endDate: 'End Date',
      cancel: 'Cancel',
      assigning: 'Assigning...',
      assign: 'Assign',
      selectBenefitsLabel: 'Select Benefits',
    },
    ar: {
      title: 'تعيين المزايا للموظف',
      selectEmployee: 'اختر موظفًا',
      selectBenefits: 'اختر المزايا',
      startDate: 'تاريخ البدء',
      endDate: 'تاريخ الانتهاء',
      cancel: 'إلغاء',
      assigning: 'جاري التعيين...',
      assign: 'تعيين',
      selectBenefitsLabel: 'اختر المزايا',
    },
  } as const;

  const L = labels[language as 'en' | 'ar'] || labels.en;
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [assignedBenefitIds, setAssignedBenefitIds] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    severity: AlertColor;
    message: string;
  }>({ open: false, severity: 'success', message: '' });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm<AssignEmployeeBenefitValues>({
    resolver: yupResolver(schema),
    mode: 'onChange', // Validate on change to enable/disable button
    defaultValues: {
      employeeId: '',
      benefitIds: [],
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
    },
  });

  // Watch all form values to check if they're filled
  const watchedValues = watch();
  const selectedEmployeeId = watch('employeeId');
  const isFormValid =
    watchedValues.employeeId &&
    watchedValues.benefitIds?.length > 0 &&
    watchedValues.startDate &&
    watchedValues.endDate &&
    isValid;

  useEffect(() => {
    if (!open) return;

    const fetchData = async () => {
      try {
        setFetching(true);
        const [employeesData, benResp] = await Promise.all([
          employeeApi.getAllEmployeesWithoutPagination(),
          benefitsApi.getBenefits(null), // Pass null to get all benefits for dropdown
        ]);

        const normalizedEmployees = employeesData.map(emp => ({
          id: emp.id,
          firstName: emp.firstName,
          lastName: emp.lastName,
          name: emp.name || `${emp.firstName} ${emp.lastName}`,
        }));

        const allBenefits: Benefit[] = Array.isArray(benResp)
          ? benResp
          : benResp.items || [];

        const activeBenefits = allBenefits.filter(
          (b: { status?: string }) => b.status?.toLowerCase() === 'active'
        );

        setEmployees(normalizedEmployees);
        setBenefits(activeBenefits);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setFetching(false);
      }
    };

    fetchData();
  }, [open]);

  useEffect(() => {
    if (!selectedEmployeeId) {
      setAssignedBenefitIds([]);
      return;
    }

    let isMounted = true;

    const fetchAssignedBenefits = async () => {
      try {
        const response = await employeeBenefitApi.getFilteredEmployeeBenefits({
          employeeId: selectedEmployeeId,
          page: 1,
        });

        if (!isMounted) return;

        const employeeRecord = response?.find(entry => {
          if (!entry?.employeeId) return false;
          if (entry.employeeId === selectedEmployeeId) return true;
          return (
            entry.employeeId.toLowerCase() === selectedEmployeeId.toLowerCase()
          );
        });

        const benefitIds = employeeRecord?.benefits?.map(b => b.id) || [];
        setAssignedBenefitIds(benefitIds);
      } catch (error) {
        console.error('Failed to load assigned benefits:', error);
        if (isMounted) setAssignedBenefitIds([]);
      }
    };

    fetchAssignedBenefits();

    return () => {
      isMounted = false;
    };
  }, [selectedEmployeeId]);

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleFormSubmit = async (data: AssignEmployeeBenefitValues) => {
    const duplicateBenefitIds = data.benefitIds.filter(benefitId =>
      assignedBenefitIds.includes(benefitId)
    );

    if (duplicateBenefitIds.length > 0) {
      const duplicateBenefitNames = benefits
        .filter(benefit => duplicateBenefitIds.includes(benefit.id))
        .map(benefit => benefit.name)
        .join(', ');

      setSnackbar({
        open: true,
        severity: 'warning',
        message: duplicateBenefitNames
          ? `${duplicateBenefitNames} already assigned to this employee.`
          : duplicateBenefitIds.length === 1
            ? 'Selected benefit is already assigned to this employee.'
            : 'Some selected benefits are already assigned to this employee.',
      });
      return;
    }

    try {
      setLoading(true);

      const assignments = data.benefitIds.map(benefitId =>
        employeeBenefitApi.assignBenefit({
          employeeId: data.employeeId,
          benefitId,
          startDate: data.startDate,
          endDate: data.endDate,
          status: 'active',
        })
      );

      await Promise.all(assignments);

      setSnackbar({
        open: true,
        severity: 'success',
        message: 'Benefits assigned successfully!',
      });
      reset();
      onClose();
      onAssigned?.();
    } catch (err: unknown) {
      console.error(
        'Error assigning benefit:',
        (err as { response?: { data?: unknown } }).response?.data || err
      );

      let errorMessage = 'Failed to assign benefits';
      const responseData = (
        err as {
          response?: { data?: unknown };
          message?: string;
        }
      ).response?.data;

      if (responseData && typeof responseData === 'object') {
        const message = (responseData as { message?: string }).message;
        if (message) {
          errorMessage = message;
        }
      } else if (err instanceof Error && err.message) {
        errorMessage = err.message;
      }

      setSnackbar({
        open: true,
        severity: 'error',
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
        <DialogTitle
          dir={language === 'ar' ? 'rtl' : 'ltr'}
          sx={{ textAlign: language === 'ar' ? 'right' : 'left' }}
        >
          <Typography variant='h6' fontWeight={600}>
            {L.title}
          </Typography>
        </DialogTitle>

        {fetching ? (
          <Box display='flex' justifyContent='center' alignItems='center' p={5}>
            <CircularProgress />
          </Box>
        ) : (
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <DialogContent dir='ltr'>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Controller
                  name='employeeId'
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.employeeId}>
                      <InputLabel>{L.selectEmployee}</InputLabel>
                      <Select
                        {...field}
                        label={L.selectEmployee}
                        MenuProps={{
                          PaperProps: {
                            style: { maxHeight: 300, overflowY: 'auto' },
                          },
                        }}
                        sx={{
                          '& .MuiSelect-select': {
                            display: 'flex',
                            alignItems: 'center',
                            height: '1.4375em',
                            padding: '16.5px 14px',
                          },
                        }}
                      >
                        {employees.map(emp => (
                          <MenuItem key={emp.id} value={emp.id}>
                            {emp.name || `${emp.firstName} ${emp.lastName}`}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.employeeId && (
                        <Typography variant='caption' color='error'>
                          {errors.employeeId.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />

                <Controller
                  name='benefitIds'
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.benefitIds}>
                      <InputLabel>{L.selectBenefits}</InputLabel>
                      <Select
                        {...field}
                        multiple
                        label={L.selectBenefitsLabel}
                        renderValue={(selected: any) =>
                          benefits
                            .filter(b => (selected as string[]).includes(b.id))
                            .map(b => b.name)
                            .join(', ')
                        }
                        MenuProps={{
                          PaperProps: {
                            style: { maxHeight: 300, overflowY: 'auto' },
                          },
                        }}
                        sx={{
                          '& .MuiSelect-select': {
                            display: 'flex',
                            alignItems: 'center',
                            height: '1.4375em',
                            padding: '16.5px 14px',
                          },
                        }}
                      >
                        {benefits.map(b => (
                          <MenuItem key={b.id} value={b.id}>
                            <Checkbox checked={field.value.includes(b.id)} />
                            <ListItemText primary={b.name} />
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.benefitIds && (
                        <Typography variant='caption' color='error'>
                          {errors.benefitIds.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />

                <Controller
                  name='startDate'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={L.startDate}
                      type='date'
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.startDate}
                      helperText={errors.startDate?.message}
                      sx={{ mt: 1 }}
                    />
                  )}
                />

                <Controller
                  name='endDate'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={L.endDate}
                      type='date'
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.endDate}
                      helperText={errors.endDate?.message}
                      sx={{ mt: 1 }}
                    />
                  )}
                />
              </Box>
            </DialogContent>

            <DialogActions
              sx={{
                px: 3,
                pb: 2,
                justifyContent: language === 'ar' ? 'flex-start' : 'flex-end',
              }}
            >
              <Button onClick={onClose} variant='outlined'>
                {L.cancel}
              </Button>
              <Button
                type='submit'
                variant='contained'
                disabled={loading || !isFormValid}
              >
                {loading ? L.assigning : L.assign}
              </Button>
            </DialogActions>
          </form>
        )}
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          variant='filled'
          onClose={handleSnackbarClose}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AssignEmployeeBenefit;
