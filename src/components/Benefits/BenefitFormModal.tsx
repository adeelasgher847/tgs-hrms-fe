import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import type { Benefit } from '../../types/benefits';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material';

const schema = yup.object({
  name: yup.string().required('Name is required'),
  type: yup.mixed<Benefit['type']>().oneOf(['health', 'dental', 'vision', 'life', 'retirement', 'other']).required(),
  description: yup.string().required('Description is required'),
  eligibility: yup.string().required('Eligibility is required'),
  status: yup.mixed<Benefit['status']>().oneOf(['active', 'inactive']).required(),
});

export interface BenefitFormModalProps {
  open: boolean;
  initial?: Partial<Benefit> | null;
  onClose: () => void;
  onSubmit: (data: Omit<Benefit, 'id'>) => Promise<void> | void;
}

export default function BenefitFormModal({ open, initial, onClose, onSubmit }: BenefitFormModalProps) {
  const { handleSubmit, control, reset } = useForm<Omit<Benefit, 'id'>>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      type: 'health',
      description: '',
      eligibility: '',
      status: 'active',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: initial?.name || '',
        type: (initial?.type as Benefit['type']) || 'health',
        description: initial?.description || '',
        eligibility: initial?.eligibility || '',
        status: (initial?.status as Benefit['status']) || 'active',
      });
    }
  }, [open, initial, reset]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initial?.id ? 'Edit Benefit' : 'Create Benefit'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <Controller name="name" control={control} render={({ field, fieldState }) => (
            <TextField label="Name" {...field} error={!!fieldState.error} helperText={fieldState.error?.message} />
          )} />
          <Controller name="type" control={control} render={({ field, fieldState }) => (
            <FormControl>
              <InputLabel>Type</InputLabel>
              <Select label="Type" {...field} error={!!fieldState.error}>
                <MenuItem value="health">Health</MenuItem>
                <MenuItem value="dental">Dental</MenuItem>
                <MenuItem value="vision">Vision</MenuItem>
                <MenuItem value="life">Life</MenuItem>
                <MenuItem value="retirement">Retirement</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          )} />
          <Controller name="description" control={control} render={({ field, fieldState }) => (
            <TextField label="Description" multiline minRows={3} {...field} error={!!fieldState.error} helperText={fieldState.error?.message} />
          )} />
          <Controller name="eligibility" control={control} render={({ field, fieldState }) => (
            <TextField label="Eligibility" {...field} error={!!fieldState.error} helperText={fieldState.error?.message} />
          )} />
          <Controller name="status" control={control} render={({ field, fieldState }) => (
            <FormControl>
              <InputLabel>Status</InputLabel>
              <Select label="Status" {...field} error={!!fieldState.error}>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          )} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit(async (data) => { await onSubmit(data); onClose(); })}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}


