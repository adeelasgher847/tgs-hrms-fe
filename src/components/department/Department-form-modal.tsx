import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  IconButton,
  useMediaQuery,
  Drawer,
  Typography,
  Alert,
  useTheme,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useOutletContext } from 'react-router-dom';
import type { SxProps, Theme } from '@mui/material/styles';
import type {
  Department,
  DepartmentFormData,
  DepartmentFormErrors,
} from '../../types';

interface DepartmentFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: DepartmentFormData) => void;
  department?: Department | null;
  isRtl?: boolean;
}

export const DepartmentFormModal: React.FC<DepartmentFormModalProps> = ({
  open,
  onClose,
  onSubmit,
  department,
  isRtl = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();

  const [formData, setFormData] = useState<DepartmentFormData>({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
  });

  const [errors, setErrors] = useState<DepartmentFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(department);
  const title = isEditing
    ? isRtl
      ? 'تعديل القسم'
      : 'Edit Department'
    : isRtl
      ? 'إنشاء قسم جديد'
      : 'Create New Department';

  useEffect(() => {
    if (department) {
      // When editing, only populate English fields from database
      setFormData({
        name: department.name,
        nameAr: department.nameAr || '', // Arabic fields are optional
        description: department.description || '',
        descriptionAr: department.descriptionAr || '',
      });
    } else {
      setFormData({
        name: '',
        nameAr: '',
        description: '',
        descriptionAr: '',
      });
    }
    setErrors({});
  }, [department, open]);

  /* ---------- validation helpers ---------- */
  const validateForm = (): boolean => {
    const newErrors: DepartmentFormErrors = {};

    // Only English name is required
    if (!formData.name.trim()) {
      newErrors.name = isRtl
        ? 'اسم القسم مطلوب'
        : 'Department name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = isRtl
        ? 'اسم القسم يجب أن يكون على الأقل حرفين'
        : 'Department name must be at least 2 characters';
    }

    // Arabic name is optional but if provided, validate it
    if (
      formData.nameAr &&
      formData.nameAr.trim() &&
      formData.nameAr.trim().length < 2
    ) {
      newErrors.nameAr = isRtl
        ? 'الاسم العربي يجب أن يكون على الأقل حرفين'
        : 'Arabic name must be at least 2 characters';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = isRtl
        ? 'الوصف يجب أن يكون أقل من 500 حرف'
        : 'Description must be less than 500 characters';
    }

    if (formData.descriptionAr && formData.descriptionAr.length > 500) {
      newErrors.descriptionAr = isRtl
        ? 'الوصف العربي يجب أن يكون أقل من 500 حرف'
        : 'Arabic description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ---------- submit ---------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      await new Promise(r => setTimeout(r, 1000)); // fake delay
      onSubmit(formData);
      onClose();
    } catch {
      // Handle error silently
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange =
    (field: keyof DepartmentFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    };

  /* ---------- form JSX ---------- */
  const formContent = (
    <Box
      component='form'
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        mt: 2,
        direction: isRtl ? 'rtl' : 'ltr',
        color: darkMode ? '#e0e0e0' : undefined,
      }}
    >
      {/* English name */}
      <TextField
        fullWidth
        label={isRtl ? 'اسم القسم (بالإنجليزية)' : 'Department Name (English)'}
        value={formData.name}
        onChange={handleInputChange('name')}
        error={!!errors.name}
        helperText={errors.name}
        required
        InputLabelProps={{ sx: { color: darkMode ? '#ccc' : undefined } }}
        InputProps={{
          sx: {
            color: darkMode ? '#fff' : 'inherit', // 👈 Input text color
          },
        }}
      />

      {/* Arabic name */}
      <TextField
        fullWidth
        label={
          isRtl
            ? 'اسم القسم (بالعربية - اختياري)'
            : 'Department Name (Arabic - Optional)'
        }
        value={formData.nameAr || ''}
        onChange={handleInputChange('nameAr')}
        error={!!errors.nameAr}
        helperText={errors.nameAr}
        InputLabelProps={{ sx: { color: darkMode ? '#ccc' : undefined } }}
        InputProps={{
          sx: {
            color: darkMode ? '#fff' : 'inherit', // 👈 Input text color
          },
        }}
        sx={{ '& .MuiInputBase-input': { textAlign: 'right' } }}
      />

      {/* English description */}
      <TextField
        fullWidth
        label={
          isRtl ? 'الوصف (بالإنجليزية - اختياري)' : 'Description (English)'
        }
        value={formData.description || ''}
        onChange={handleInputChange('description')}
        error={!!errors.description}
        helperText={errors.description}
        multiline
        rows={3}
        InputLabelProps={{ sx: { color: darkMode ? '#ccc' : undefined } }}
        InputProps={{
          sx: {
            color: darkMode ? '#fff' : 'inherit', // 👈 Input text color
          },
        }}
      />

      {/* Arabic description */}
      <TextField
        fullWidth
        label={
          isRtl
            ? 'الوصف (بالعربية - اختياري)'
            : 'Description (Arabic - Optional)'
        }
        value={formData.descriptionAr || ''}
        onChange={handleInputChange('descriptionAr')}
        error={!!errors.descriptionAr}
        helperText={errors.descriptionAr}
        multiline
        rows={3}
        InputLabelProps={{ sx: { color: darkMode ? '#ccc' : undefined } }}
        InputProps={{
          sx: {
            color: darkMode ? '#fff' : 'inherit', // 👈 Input text color
          },
        }}
        sx={{ '& .MuiInputBase-input': { textAlign: 'right' } }}
      />

      {Object.keys(errors).length > 0 && (
        <Alert severity='error'>
          {isRtl
            ? 'يرجى تصحيح الأخطاء أعلاه'
            : 'Please correct the errors above'}
        </Alert>
      )}
    </Box>
  );

  /* ---------- action buttons ---------- */
  const actionButtons = (
    <>
      <Button onClick={onClose} disabled={isSubmitting}>
        {isRtl ? 'إلغاء' : 'Cancel'}
      </Button>
      <Button
        type='submit'
        variant='contained'
        disabled={isSubmitting}
        onClick={handleSubmit}
        sx={{ bgcolor: '#484c7f' }}
      >
        {isSubmitting
          ? isRtl
            ? 'جاري الحفظ...'
            : 'Saving...'
          : isEditing
            ? isRtl
              ? 'تحديث'
              : 'Update'
            : isRtl
              ? 'إنشاء'
              : 'Create'}
      </Button>
    </>
  );

  const paperSx: SxProps<Theme> = {
    direction: isRtl ? 'rtl' : 'ltr',
    backgroundColor: darkMode ? '#1e1e1e' : '#fff',
    color: darkMode ? '#e0e0e0' : undefined,
  };

  /* ---------- MOBILE drawer ---------- */
  if (isMobile) {
    return (
      <Drawer
        anchor={isRtl ? 'right' : 'left'}
        open={open}
        onClose={onClose}
        PaperProps={{ sx: { width: '100%', maxWidth: 400, ...paperSx } }}
      >
        <Box
          sx={{
            p: 3,
            overflowY: 'auto',
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography variant='h6' sx={{ flexGrow: 1 }}>
              {title}
            </Typography>
            <IconButton onClick={onClose} size='small'>
              <CloseIcon sx={{ color: darkMode ? '#fff' : undefined }} />
            </IconButton>
          </Box>
          {formContent}
          <Box
            sx={{ display: 'flex', gap: 1, mt: 3, justifyContent: 'flex-end' }}
          >
            {actionButtons}
          </Box>
        </Box>
      </Drawer>
    );
  }

  /* ---------- DESKTOP dialog ---------- */
  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle sx={{ ...paperSx, position: 'relative' }}>
        <Typography sx={{ textAlign: isRtl ? 'right' : 'left', fontWeight: 600, fontSize: '1.25rem', lineHeight: 1.6, letterSpacing: '0.0075em',  }}>
          {title}
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: isRtl ? 'auto' : 8,
            left: isRtl ? 8 : 'auto',
            top: 8,
            color: darkMode ? '#fff' : undefined,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          ...paperSx,
          pt: 2,
          maxHeight: '70vh',
          overflowY: 'auto',
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
        }}
      >
        {formContent}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2, ...paperSx }}>
        {actionButtons}
      </DialogActions>
    </Dialog>
  );
};
