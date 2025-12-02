import React, { useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
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
  const { language } = useLanguage();

  const labels = {
    en: {
      titleCreate: 'Create Benefit',
      titleEdit: 'Edit Benefit',
      name: 'Benefit Name',
      type: 'Benefit Type',
      typePlaceholder: 'Health, Allowance, Voucher...',
      description: 'Description',
      eligibility: 'Eligibility',
      eligibilityPlaceholder: 'e.g., All Employees / Full-time / etc.',
      status: 'Status',
      statusPlaceholder: 'Active / Inactive',
      cancel: 'Cancel',
      create: 'Create',
      update: 'Update',
    },
    ar: {
      titleCreate: 'إنشاء ميزة',
      titleEdit: 'تعديل الميزة',
      name: 'اسم الميزة',
      type: 'نوع الميزة',
      typePlaceholder: 'صحة، بدل، قسيمة...',
      description: 'الوصف',
      eligibility: 'معايير الأهلية',
      eligibilityPlaceholder: 'مثل: جميع الموظفين / دوام كامل / الخ',
      status: 'الحالة',
      statusPlaceholder: 'نشط / غير نشط',
      cancel: 'إلغاء',
      create: 'إنشاء',
      update: 'تحديث',
    },
  } as const;

  const L = labels[language as 'en' | 'ar'] || labels.en;
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
      <DialogTitle
        dir={language === 'ar' ? 'rtl' : 'ltr'}
        sx={{ textAlign: language === 'ar' ? 'right' : 'left' }}
      >
        <Typography variant='h6' fontWeight={600}>
          {benefit ? L.titleEdit : L.titleCreate}
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent
          dir='ltr'
          sx={{ px: 2, maxHeight: '60vh', overflowY: 'visible' }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Controller
                name='name'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label={L.name}
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
                    label={L.type}
                    placeholder={L.typePlaceholder}
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
                  label={L.description}
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
                  label={L.eligibility}
                  placeholder={L.eligibilityPlaceholder}
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
                  label={L.status}
                  placeholder={L.statusPlaceholder}
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
            justifyContent: language === 'ar' ? 'flex-start' : 'flex-end',
          }}
        >
          <Button onClick={onClose} variant='outlined'>
            {L.cancel}
          </Button>
          <Button type='submit' variant='contained' disabled={!isFormValid}>
            {benefit ? L.update : L.create}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default BenefitFormModal;
