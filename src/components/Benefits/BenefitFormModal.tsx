import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Snackbar,
  Alert,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

export interface BenefitFormValues {
  name: string;
  type: string;
  description: string;
  eligibility: 'All Employees' | 'Full-time Employees' | 'Part-time Employees';
  status: 'Active' | 'Inactive';
}

interface BenefitFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: BenefitFormValues) => void;
  benefit?: BenefitFormValues | null;
}

const schema = yup.object({
  name: yup.string().required('Benefit name is required'),
  type: yup.string().required('Benefit type is required'),
  description: yup.string().required('Description is required'),
  eligibility: yup.string().required('Eligibility is required'),
  status: yup.string().required('Status is required'),
});

export const BenefitFormModal: React.FC<BenefitFormModalProps> = ({
  open,
  onClose,
  onSubmit,
  benefit,
}) => {
  const [showToast, setShowToast] = React.useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BenefitFormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      type: '',
      description: '',
      eligibility: 'All Employees',
      status: 'Active',
    },
  });

  useEffect(() => {
    if (benefit) {
      reset(benefit);
    } else {
      reset({
        name: '',
        type: '',
        description: '',
        eligibility: 'All Employees',
        status: 'Active',
      });
    }
  }, [benefit, reset]);

  const handleFormSubmit = (data: BenefitFormValues) => {
    try {
      onSubmit(data);
      setShowToast(true);
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
          sx: {
            borderRadius: 2,
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle>
          <Typography variant='h6' fontWeight={600}>
            {benefit ? 'Edit Benefit' : 'Create Benefit'}
          </Typography>
        </DialogTitle>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogContent
            sx={{
              px: 2,
              maxHeight: '60vh',
              overflowY: 'visible',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', gap: 3 }}>
                <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                  <Controller
                    name='name'
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label='Benefit Name'
                        error={!!errors.name}
                        helperText={errors.name?.message}
                      />
                    )}
                  />
                </Box>

                <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                  <Controller
                    name='type'
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label='Type'
                        placeholder='Health, Allowance, Voucher...'
                        error={!!errors.type}
                        helperText={errors.type?.message}
                      />
                    )}
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                  <Controller
                    name='description'
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label='Description'
                        multiline
                        rows={2}
                        error={!!errors.description}
                        helperText={errors.description?.message}
                      />
                    )}
                  />
                </Box>

                <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                  <Controller
                    name='eligibility'
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Eligibility</InputLabel>
                        <Select {...field} label='Eligibility'>
                          <MenuItem value='All Employees'>
                            All Employees
                          </MenuItem>
                          <MenuItem value='Full-time Employees'>
                            Full-time Employees
                          </MenuItem>
                          <MenuItem value='Part-time Employees'>
                            Part-time Employees
                          </MenuItem>
                        </Select>
                        {errors.eligibility && (
                          <Typography variant='caption' color='error'>
                            {errors.eligibility.message}
                          </Typography>
                        )}
                      </FormControl>
                    )}
                  />
                </Box>
              </Box>

              <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                <Controller
                  name='status'
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select {...field} label='Status'>
                        <MenuItem value='Active'>Active</MenuItem>
                        <MenuItem value='Inactive'>Inactive</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Box>
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
              {benefit ? 'Update' : 'Create'}
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
          Benefit {benefit ? 'updated' : 'created'} successfully!
        </Alert>
      </Snackbar>
    </>
  );
};

export default BenefitFormModal;
