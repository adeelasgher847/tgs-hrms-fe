import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import employeeApi from '../../api/employeeApi';
import benefitsApi from '../../api/benefitApi';
import employeeBenefitApi from '../../api/employeeBenefitApi';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../common/ErrorSnackbar';
import AppFormModal from '../common/AppFormModal';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { CalendarToday as CalendarIcon } from '@mui/icons-material';

interface Employee {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
}

interface Benefit {
  id: string;
  name: string;
  status?: string;
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
  const theme = useTheme();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [assignedBenefitIds, setAssignedBenefitIds] = useState<string[]>([]);
  const { snackbar, showError, showSuccess, showWarning, closeSnackbar } =
    useErrorHandler();
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
    mode: 'onChange',
    defaultValues: {
      employeeId: '',
      benefitIds: [],
      startDate: dayjs().format('YYYY-MM-DD'),
      endDate: '',
    },
  });

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
          benefitsApi.getBenefits(null),
        ]);

        setEmployees(
          employeesData.map(emp => ({
            id: emp.id,
            firstName: emp.firstName,
            lastName: emp.lastName,
            name: emp.name || `${emp.firstName} ${emp.lastName}`,
          }))
        );

        const allBenefits: Benefit[] = Array.isArray(benResp)
          ? benResp
          : (benResp as { items?: Benefit[] })?.items || [];

        setBenefits(
          allBenefits.filter(b => b.status?.toLowerCase() === 'active')
        );
      } catch (err) {
        setEmployees([]);
        setBenefits([]);
        showError(err);
      } finally {
        setFetching(false);
      }
    };

    fetchData();
  }, [open, showError]);

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

        type EmployeeWithBenefitsEntry = {
          employeeId?: string;
          benefits?: { id: string }[];
        };
        const list: EmployeeWithBenefitsEntry[] = Array.isArray(response)
          ? (response as EmployeeWithBenefitsEntry[])
          : (response as { items?: EmployeeWithBenefitsEntry[] })?.items ?? [];
        const employeeRecord = list.find(
          entry =>
            entry?.employeeId?.toLowerCase() === selectedEmployeeId.toLowerCase()
        );

        const benefitIds = employeeRecord?.benefits?.map(b => b.id) || [];
        setAssignedBenefitIds(benefitIds);
      } catch (err) {
        if (isMounted) setAssignedBenefitIds([]);
        showError(err);
      }
    };

    fetchAssignedBenefits();
    return () => {
      isMounted = false;
    };
  }, [selectedEmployeeId, showError]);

  const handleFormSubmit = async (data: AssignEmployeeBenefitValues) => {
    const duplicateBenefitIds = data.benefitIds.filter(id =>
      assignedBenefitIds.includes(id)
    );

    if (duplicateBenefitIds.length > 0) {
      const duplicateNames = benefits
        .filter(b => duplicateBenefitIds.includes(b.id))
        .map(b => b.name)
        .join(', ');
      showWarning(
        duplicateNames
          ? `${duplicateNames} already assigned to this employee.`
          : 'Some selected benefits are already assigned.'
      );
      return;
    }

    try {
      setLoading(true);
      await Promise.all(
        data.benefitIds.map(benefitId =>
          employeeBenefitApi.assignBenefit({
            employeeId: data.employeeId,
            benefitId,
            startDate: data.startDate,
            endDate: data.endDate,
            status: 'active',
          })
        )
      );
      showSuccess('Benefits assigned successfully!');
      reset();
      onClose();
      onAssigned?.();
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  const iconColor = theme.palette.text.primary;

  return (
    <>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <AppFormModal
          open={open}
          onClose={onClose}
          title='Assign Benefits to Employee'
          onSubmit={() => handleSubmit(handleFormSubmit)()}
          isSubmitting={loading}
          hasChanges={!!isFormValid}
          maxWidth='sm'
          fields={[
            {
              name: 'assign',
              label: '',
              value: '',
              onChange: () => {},
              component: fetching ? (
                <Box
                  display='flex'
                  justifyContent='center'
                  alignItems='center'
                  p={5}
                >
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Employee Select */}
                  <Controller
                    name='employeeId'
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.employeeId}>
                        <InputLabel>Select Employee</InputLabel>
                        <Select {...field} label='Select Employee'>
                          {employees.map(emp => (
                            <MenuItem key={emp.id} value={emp.id}>
                              {emp.name}
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

                  {/* Benefits Multi-Select */}
                  <Controller
                    name='benefitIds'
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.benefitIds}>
                        <InputLabel shrink={field.value?.length > 0}>
                          Select Benefits
                        </InputLabel>
                        <Select
                          {...field}
                          multiple
                          label='Select Benefits'
                          notched={field.value?.length > 0}
                          renderValue={selected =>
                            benefits
                              .filter(b => selected.includes(b.id))
                              .map(b => b.name)
                              .join(', ')
                          }
                          sx={{
                            '& .MuiSelect-select': {
                              pt: field.value?.length > 0 ? 1.5 : 1,
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

                  {/* Start Date */}
                  <Controller
                    name='startDate'
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        label='Start Date'
                        value={field.value ? dayjs(field.value) : null}
                        onChange={date =>
                          field.onChange(date ? date.format('YYYY-MM-DD') : '')
                        }
                        slots={{ openPickerIcon: CalendarIcon }}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!errors.startDate,
                            InputProps: {
                              sx: {
                                '& svg': { color: iconColor },
                              },
                            },
                            sx: {
                              input: { color: theme.palette.text.primary },
                              label: { color: theme.palette.text.secondary },
                              backgroundColor:
                                theme.palette.mode === 'dark'
                                  ? theme.palette.background.paper
                                  : undefined,
                            },
                          },
                        }}
                      />
                    )}
                  />

                  {/* End Date */}
                  <Controller
                    name='endDate'
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        label='End Date'
                        value={field.value ? dayjs(field.value) : null}
                        onChange={date =>
                          field.onChange(date ? date.format('YYYY-MM-DD') : '')
                        }
                        slots={{ openPickerIcon: CalendarIcon }}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!errors.endDate,
                            InputProps: {
                              sx: {
                                '& svg': { color: iconColor },
                              },
                            },
                            sx: {
                              input: { color: theme.palette.text.primary },
                              label: { color: theme.palette.text.secondary },
                              backgroundColor:
                                theme.palette.mode === 'dark'
                                  ? theme.palette.background.paper
                                  : undefined,
                            },
                          },
                        }}
                      />
                    )}
                  />
                </Box>
              ),
            },
          ]}
        />
      </LocalizationProvider>

      <ErrorSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </>
  );
};

export default AssignEmployeeBenefit;
