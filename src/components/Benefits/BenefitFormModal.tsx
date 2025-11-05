import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

export interface BenefitFormValues {
  name: string;
  type: string;
  description: string;
  eligibilityCriteria: string;
  status: string;
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
  eligibilityCriteria: yup.string().required('Eligibility is required'),
  status: yup.string().required('Status is required'),
});

const BenefitFormModal: React.FC<BenefitFormModalProps> = ({
  open,
  onClose,
  onSubmit,
  benefit,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm<BenefitFormValues>({
    resolver: yupResolver(schema),
    mode: 'onChange', // Validate on change to enable/disable button
    defaultValues: {
      name: '',
      type: '',
      description: '',
      eligibilityCriteria: '',
      status: '',
    },
  });

  // Watch all form values to check if they're filled
  const watchedValues = watch();
  const isFormValid =
    watchedValues.name?.trim() &&
    watchedValues.type?.trim() &&
    watchedValues.description?.trim() &&
    watchedValues.eligibilityCriteria?.trim() &&
    watchedValues.status?.trim() &&
    isValid;

  useEffect(() => {
    if (benefit) reset(benefit);
    else
      reset({
        name: '',
        type: '',
        description: '',
        eligibilityCriteria: '',
        status: '',
      });
  }, [benefit, reset]);

  const handleFormSubmit = (data: BenefitFormValues) => {
    onSubmit(data);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='sm'
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle>
        <Typography variant='h6' fontWeight={600}>
          {benefit ? 'Edit Benefit' : 'Create Benefit'}
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent sx={{ px: 2, maxHeight: '60vh', overflowY: 'visible' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', gap: 3 }}>
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

              <Controller
                name='type'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Benefit Type'
                    placeholder='Health, Allowance, Voucher...'
                    error={!!errors.type}
                    helperText={errors.type?.message}
                  />
                )}
              />
            </Box>

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

            <Controller
              name='eligibilityCriteria'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Eligibility'
                  placeholder='e.g., All Employees / Full-time / etc.'
                  error={!!errors.eligibilityCriteria}
                  helperText={errors.eligibilityCriteria?.message}
                />
              )}
            />

            <Controller
              name='status'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Status'
                  placeholder='Active / Inactive'
                  error={!!errors.status}
                  helperText={errors.status?.message}
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
          <Button type='submit' variant='contained' disabled={!isFormValid}>
            {benefit ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default BenefitFormModal;
