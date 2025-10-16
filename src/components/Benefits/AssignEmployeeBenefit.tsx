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
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import employeeApi from '../../api/employeeApi';
import benefitsApi from '../../api/benefitApi';
import employeeBenefitApi from '../../api/employeeBenefitApi';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
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
}> = ({ open, onClose }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(false);

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
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching employees & benefits...');
        const [empResp, benResp] = await Promise.all([
          employeeApi.getAllEmployees(),
          benefitsApi.getBenefits(1),
        ]);
        console.log('Employees: ', empResp);
        console.log('Benefits: ', benResp);
        setEmployees(empResp.items || []);
        setBenefits(Array.isArray(benResp) ? benResp : benResp.items || []);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); 

  const handleFormSubmit = async (data: AssignEmployeeBenefitValues) => {
    try {
      setLoading(true);
      for (const benefitId of data.benefitIds) {
        await employeeBenefitApi.assignBenefit({
          employeeId: data.employeeId,
          benefitId,
          startDate: data.startDate,
          endDate: data.endDate,
          status: 'active',
        });
      }
      setShowToast(true);
      reset();
      onClose();
    } catch (err) {
      console.error('Error assigning benefit:', err);
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

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Controller
                name='employeeId'
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.employeeId}>
                    <InputLabel>Select Employee</InputLabel>
                    <Select {...field} label='Select Employee'>
                      {employees.map(emp => (
                        <MenuItem key={emp.id} value={emp.id}>
                          {emp.first_name} {emp.last_name}
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
                  />
                )}
              />
            </Box>
          </DialogContent>

          <DialogActions>
            <Button onClick={onClose} variant='outlined'>
              Cancel
            </Button>
            <Button type='submit' variant='contained' disabled={loading}>
              {loading ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogActions>
        </form>
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
