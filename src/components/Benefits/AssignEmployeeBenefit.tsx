import React, { useEffect, useState } from 'react';
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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssignEmployeeBenefitValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      employeeId: '',
      benefitIds: [],
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
    },
  });

  useEffect(() => {
    if (!open) return;

    const fetchData = async () => {
      try {
        setFetching(true);
        const [employeesData, benResp] = await Promise.all([
          employeeApi.getAllEmployeesWithoutPagination(),
          benefitsApi.getBenefits(1),
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
          (b: any) => b.status?.toLowerCase() === 'active'
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

  const handleFormSubmit = async (data: AssignEmployeeBenefitValues) => {
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

      setShowToast(true);
      reset();
      onClose();
      onAssigned?.(); 
    } catch (err: any) {
      console.error('Error assigning benefit:', err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
        <DialogTitle>
          <Typography variant='h6' fontWeight={600}>
            Assign Benefits to Employee
          </Typography>
        </DialogTitle>

        {fetching ? (
          <Box display='flex' justifyContent='center' alignItems='center' p={5}>
            <CircularProgress />
          </Box>
        ) : (
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Controller
                  name='employeeId'
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.employeeId}>
                      <InputLabel>Select Employee</InputLabel>
                      <Select
                        {...field}
                        label='Select Employee'
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
                      <InputLabel>Select Benefits</InputLabel>
                      <Select
                        {...field}
                        multiple
                        label='Select Benefits'
                        renderValue={selected =>
                          benefits
                            .filter(b => selected.includes(b.id))
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
                      label='Start Date'
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
                      label='End Date'
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

            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={onClose} variant='outlined'>
                Cancel
              </Button>
              <Button type='submit' variant='contained' disabled={loading}>
                {loading ? 'Assigning...' : 'Assign'}
              </Button>
            </DialogActions>
          </form>
        )}
      </Dialog>

      <Snackbar
        open={showToast}
        autoHideDuration={3000}
        onClose={() => setShowToast(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity='success' variant='filled'>
          Benefits assigned successfully!
        </Alert>
      </Snackbar>
    </>
  );
};

export default AssignEmployeeBenefit;
