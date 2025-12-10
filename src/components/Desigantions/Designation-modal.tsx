import type React from 'react';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
  MenuItem,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useLanguage } from '../../hooks/useLanguage';
import {
  departmentApiService,
  type FrontendDepartment,
} from '../../api/departmentApi';

interface Designation {
  id: string;
  title: string;
  titleAr: string;
  departmentId: string;
}

interface DesignationModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    titleAr: string;
    departmentId: string;
  }) => void;
  designation: Designation | null;
  isRTL: boolean;
}

export default function DesignationModal({
  open,
  onClose,
  onSave,
  designation,
  isRTL,
}: DesignationModalProps) {
  const { language } = useLanguage();
  const getText = (en: string, ar: string) => (language === 'ar' ? ar : en);
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [title, setTitle] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [originalTitle, setOriginalTitle] = useState('');
  const [originalTitleAr, setOriginalTitleAr] = useState('');
  const [originalDepartmentId, setOriginalDepartmentId] = useState('');
  const [departments, setDepartments] = useState<FrontendDepartment[]>([]);
  // const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    titleAr?: string;
    departmentId?: string;
  }>({});

  // Load departments when modal opens
  useEffect(() => {
    if (open) {
      loadDepartments();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      departmentApiService.getAllDepartments().then(setDepartments);
    }
    if (designation) {
      setTitle(designation.title);
      setTitleAr(designation.titleAr || '');
      setDepartmentId(designation.departmentId);
      setOriginalTitle(designation.title);
      setOriginalTitleAr(designation.titleAr || '');
      setOriginalDepartmentId(designation.departmentId);
    } else {
      setTitle('');
      setTitleAr('');
      setDepartmentId('');
      setOriginalTitle('');
      setOriginalTitleAr('');
      setOriginalDepartmentId('');
    }
    setErrors({});
  }, [designation, open]);

  const loadDepartments = async () => {
    try {
      // setLoadingDepartments(true);
      const backendDepartments = await departmentApiService.getAllDepartments();
      const frontendDepartments = backendDepartments.map(dept =>
        departmentApiService.convertBackendToFrontend(dept)
      );
      setDepartments(frontendDepartments);
    } catch (error) {
      console.error('Error loading departments:', error);
      setDepartments([]);
    } finally {
      // setLoadingDepartments(false);
    }
  };

  // Check if form has changes
  const hasChanges = designation
    ? title !== originalTitle ||
      titleAr !== originalTitleAr ||
      departmentId !== originalDepartmentId
    : title.trim() !== '' || titleAr.trim() !== '' || departmentId !== '';

  const validateForm = () => {
    const newErrors: {
      title?: string;
      titleAr?: string;
      departmentId?: string;
    } = {};

    if (!title.trim()) {
      newErrors.title = getText(
        'Designation title is required',
        'عنوان المسمى الوظيفي مطلوب'
      );
    }

    if (!designation && !departmentId) {
      newErrors.departmentId = getText(
        'Please select a department',
        'يرجى اختيار قسم'
      );
    }

    // Arabic title is optional but if provided, validate it
    if (titleAr.trim() && titleAr.trim().length < 2) {
      newErrors.titleAr = getText(
        'Arabic title must be at least 2 characters',
        'العنوان بالعربية يجب أن يكون على الأقل حرفين'
      );
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSave({ title: title.trim(), titleAr: titleAr.trim(), departmentId });
      handleClose();
    }
  };

  const handleClose = () => {
    setTitle('');
    setTitleAr('');
    setDepartmentId('');
    setErrors({});
    onClose();
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog
      className='Ramish first'
      open={open}
      onClose={handleClose}
      fullScreen={false} // ❌ force disable fullscreen
      PaperProps={{
        sx: {
          width: '100%',
          maxWidth: 600, // set a max width for mobile
          borderRadius: 1,
          m: 2, // margin around
        },
      }}
      sx={{
        '& .MuiDialog-paper': {
          width: '100%',
          maxWidth: 600,
          margin: '16px', // keeps it centered with spacing
        },
      }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <DialogTitle>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant='h6'>
            {designation
              ? getText('Edit Designation', 'تعديل المسمى الوظيفي')
              : getText('Create New Designation', 'إنشاء مسمى وظيفي جديد')}
          </Typography>
          <IconButton onClick={handleClose} size='small'>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          <TextField
            select
            label={getText('Department', 'القسم')}
            value={departmentId}
            onChange={e => setDepartmentId(e.target.value)}
            error={!!errors.departmentId}
            helperText={errors.departmentId}
            fullWidth
            required
          >
            {departments.map(dept => (
              <MenuItem key={dept.id} value={dept.id}>
                {dept.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label={getText(
              'Designation Title',
              'عنوان المسمى الوظيفي (بالإنجليزية)'
            )}
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyPress={handleKeyPress}
            error={!!errors.title}
            helperText={errors.title}
            fullWidth
            required
            autoFocus={designation ? !isMobile : false}
            inputProps={{
              dir: 'ltr',
            }}
          />
          {/* <TextField
            label={getText(
              'Designation Title (Arabic - Optional)',
              'عنوان المسمى الوظيفي (بالعربية - اختياري)'
            )}
            value={titleAr}
            onChange={e => setTitleAr(e.target.value)}
            onKeyPress={handleKeyPress}
            error={!!errors.titleAr}
            helperText={errors.titleAr}
            fullWidth
            inputProps={{
              dir: 'rtl',
            }}
          /> */}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button onClick={handleClose} color='inherit' size='large'>
          {getText('Cancel', 'إلغاء')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant='contained'
          disabled={!hasChanges}
          size='large'
          sx={{ backgroundColor: '#464b8a' }}
        >
          {designation
            ? getText('Update', 'تحديث')
            : getText('Create', 'إنشاء')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
