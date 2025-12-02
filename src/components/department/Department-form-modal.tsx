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
    description: '',
  });

  const [originalData, setOriginalData] = useState<DepartmentFormData>({
    name: '',
    description: '',
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
      // When editing, populate fields from database
      const initialData = {
        name: department.name,
        description: department.description || '',
      };
      setFormData(initialData);
      setOriginalData(initialData);
    } else {
      const initialData = {
        name: '',
        description: '',
      };
      setFormData(initialData);
      setOriginalData(initialData);
    }
    setErrors({});
  }, [department, open]);

  // Check if form has changes
  const hasChanges = isEditing
    ? formData.name !== originalData.name ||
      (formData.description || '') !== (originalData.description || '')
    : formData.name.trim() !== '' || (formData.description || '').trim() !== '';

  /* ---------- validation helpers ---------- */
  const validateForm = (): boolean => {
    const newErrors: DepartmentFormErrors = {};

    // Name is required
    if (!formData.name.trim()) {
      newErrors.name = isRtl
        ? 'اسم القسم مطلوب'
        : 'Department name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = isRtl
        ? 'اسم القسم يجب أن يكون على الأقل حرفين'
        : 'Department name must be at least 2 characters';
    }

    // Description is optional but validate length if provided
    if (formData.description && formData.description.length > 500) {
      newErrors.description = isRtl
        ? 'الوصف يجب أن يكون أقل من 500 حرف'
        : 'Description must be less than 500 characters';
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
        direction: 'ltr',
        color: darkMode ? '#e0e0e0' : undefined,
      }}
    >
      {/* Department name */}
      <TextField
        fullWidth
        label={isRtl ? 'اسم القسم' : 'Department Name'}
        value={formData.name}
        onChange={handleInputChange('name')}
        error={!!errors.name}
        helperText={errors.name}
        required
        InputLabelProps={{ sx: { color: darkMode ? '#ccc' : undefined } }}
        InputProps={{
          sx: {
            color: darkMode ? '#fff' : 'inherit',
          },
        }}
      />

      {/* Description */}
      <TextField
        fullWidth
        label={isRtl ? 'الوصف (اختياري)' : 'Description (Optional)'}
        value={formData.description || ''}
        onChange={handleInputChange('description')}
        error={!!errors.description}
        helperText={errors.description}
        multiline
        rows={3}
        InputLabelProps={{ sx: { color: darkMode ? '#ccc' : undefined } }}
        InputProps={{
          sx: {
            color: darkMode ? '#fff' : 'inherit',
          },
        }}
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
        disabled={isSubmitting || !hasChanges}
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
    // Force LTR layout for this modal while still allowing labels/text to be localized
    direction: 'ltr',
    backgroundColor: darkMode ? '#1e1e1e' : '#fff',
    color: darkMode ? '#e0e0e0' : undefined,
  };

  /* ---------- MOBILE drawer ---------- */
  if (isMobile) {
    return (
      <Drawer
        anchor={'left'}
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
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 3,
              // swap order for RTL: title right, close left
            }}
          >
            <Typography
              variant='h6'
              sx={{
                flexGrow: 1,
                textAlign: isRtl ? 'right' : 'left',
                order: isRtl ? 2 : 1,
              }}
            >
              {title}
            </Typography>
            <IconButton
              onClick={onClose}
              size='small'
              sx={{ order: isRtl ? 1 : 2 }}
            >
              <CloseIcon sx={{ color: darkMode ? '#fff' : undefined }} />
            </IconButton>
          </Box>
          {formContent}
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              mt: 3,
              justifyContent: isRtl ? 'flex-start' : 'flex-end',
            }}
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
      <DialogTitle
        sx={{
          ...paperSx,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            order: isRtl ? 2 : 1,
            textAlign: isRtl ? 'right' : 'left',
          }}
        >
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '1.25rem',
              lineHeight: 1.6,
              letterSpacing: '0.0075em',
            }}
          >
            {title}
          </Typography>
        </Box>

        <IconButton onClick={onClose} sx={{ order: isRtl ? 1 : 2 }}>
          <CloseIcon sx={{ color: darkMode ? '#fff' : undefined }} />
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

      <DialogActions
        sx={{
          p: 3,
          pt: 2,
          ...paperSx,
          justifyContent: isRtl ? 'flex-start' : 'flex-end',
        }}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>{actionButtons}</Box>
      </DialogActions>
    </Dialog>
  );
};
