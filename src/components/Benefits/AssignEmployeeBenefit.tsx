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

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

interface Benefit {
  id: string;
  name: string;
}

export interface AssignEmployeeBenefitValues {
  employeeId: string;
  benefitIds: string[];
  benefitType: string;
  startDate: string;
}

interface AssignEmployeeBenefitProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AssignEmployeeBenefitValues) => void;
  employees: Employee[];
  benefits: Benefit[];
}

const schema = yup.object({
  employeeId: yup.string().required('Employee is required'),
  benefitIds: yup
    .array()
    .min(1, 'Select at least one benefit')
    .required('Benefits are required'),
  benefitType: yup.string().required('Benefit type is required'),
  startDate: yup.string().required('Start date is required'),
});

const AssignEmployeeBenefit: React.FC<AssignEmployeeBenefitProps> = ({
  open,
  onClose,
  onSubmit,
  employees,
  benefits,
}) => {
  const [showToast, setShowToast] = useState(false);

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
      benefitType: '',
      startDate: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    reset({
      employeeId: '',
      benefitIds: [],
      benefitType: '',
      startDate: new Date().toISOString().split('T')[0],
    });
  }, [open, reset]);

  const handleFormSubmit = (data: AssignEmployeeBenefitValues) => {
    try {
      onSubmit(data);
      setShowToast(true);
      reset();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth='sm'
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2, overflow: 'hidden' },
        }}
      >
        <DialogTitle>
          <Typography variant='h6' fontWeight={600}>
            Assign Benefits to Employee
          </Typography>
        </DialogTitle>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogContent
            sx={{ px: 2, maxHeight: '60vh', overflowY: 'visible' }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Employee Selection */}
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

              {/* Benefits Selection */}
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
                      {benefits.map(benefit => (
                        <MenuItem key={benefit.id} value={benefit.id}>
                          <Checkbox
                            checked={field.value.includes(benefit.id)}
                          />
                          <ListItemText primary={benefit.name} />
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
                name='benefitType'
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.benefitType}>
                    <InputLabel>Benefit Type</InputLabel>
                    <Select {...field} label='Benefit Type'>
                      <MenuItem value='Monetary'>Monetary</MenuItem>
                      <MenuItem value='Non-Monetary'>Non-Monetary</MenuItem>
                    </Select>
                    {errors.benefitType && (
                      <Typography variant='caption' color='error'>
                        {errors.benefitType.message}
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
            </Box>
          </DialogContent>

          <DialogActions
            sx={{
              position: 'sticky',
              bottom: 0,
              backgroundColor: 'background.paper',
              px: 2,
              py: 2,
              gap: 1,
            }}
          >
            <Button onClick={onClose} variant='outlined'>
              Cancel
            </Button>
            <Button type='submit' variant='contained'>
              Assign
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={showToast}
        autoHideDuration={2500}
        onClose={() => setShowToast(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          severity='success'
          variant='filled'
          onClose={() => setShowToast(false)}
        >
          Benefit(s) assigned successfully!
        </Alert>
      </Snackbar>
    </>
  );
};

export default AssignEmployeeBenefit;
