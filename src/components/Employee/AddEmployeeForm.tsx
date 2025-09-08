import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  MenuItem,
  TextField,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import type { SxProps, Theme } from '@mui/system';
import { useOutletContext } from 'react-router-dom';
import type { EmployeeDto } from '../../api/employeeApi';
import {
  departmentApiService,
  type BackendDepartment,
} from '../../api/departmentApi';
import {
  designationApiService,
  type BackendDesignation,
} from '../../api/designationApi';

// Types
type FormValues = EmployeeDto & { departmentId?: string; gender: string };

type Errors = Partial<FormValues> & {
  general?: string;
};

interface AddEmployeeFormProps {
  onSubmit?: (
    data: Partial<EmployeeDto> & {
      departmentId?: string;
      designationId?: string;
    }
  ) => Promise<{ success: boolean; errors?: Record<string, string> }>;
  initialData?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone: string;
    designationId: string;
    departmentId?: string;
    gender?: string;
  } | null;
}

interface OutletContext {
  darkMode: boolean;
  language: 'en' | 'ar';
}

// Component
const AddEmployeeForm: React.FC<AddEmployeeFormProps> = ({
  onSubmit,
  initialData,
}) => {
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down('sm'));
  const { darkMode, language } = useOutletContext<OutletContext>();

  const [values, setValues] = useState<FormValues>({
    first_name: initialData?.firstName ?? '',
    last_name: initialData?.lastName ?? '',
    email: initialData?.email ?? '',
    phone: initialData?.phone ?? '',
    designationId: initialData?.designationId ?? '',
    departmentId: initialData?.departmentId ?? '',
    gender: initialData?.gender ?? '', // <-- Add gender to state
  });

  const [errors, setErrors] = useState<Errors>({});
  const [departments, setDepartments] = useState<BackendDepartment[]>([]);
  const [designations, setDesignations] = useState<BackendDesignation[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingDesignations, setLoadingDesignations] = useState(false);

  // Track initialization to avoid clearing designation on first prefill
  const isInitializingRef = useRef<boolean>(true);

  // Load departments on component mount
  useEffect(() => {
    (async () => {
      await loadDepartments();
      // If we have initial department and designation, ensure options include them
      if (initialData?.departmentId) {
        await loadDesignations(initialData.departmentId);
      }
      isInitializingRef.current = false;
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prefill from initialData when it changes
  useEffect(() => {
    if (initialData) {
      setValues(prev => ({
        ...prev,
        first_name: initialData.firstName ?? '',
        last_name: initialData.lastName ?? '',
        email: initialData.email,
        phone: initialData.phone,
        designationId: initialData.designationId,
        departmentId: initialData.departmentId ?? prev.departmentId,
        gender: initialData.gender ?? prev.gender,
      }));
      if (initialData.departmentId) {
        // Load designations for department; keep designationId as provided
        (async () => {
          await loadDesignations(initialData.departmentId!);
          isInitializingRef.current = false;
        })();
      } else {
        isInitializingRef.current = false;
      }
    } else {
      isInitializingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.id]);

  // Load designations when department changes
  useEffect(() => {
    if (values.departmentId) {
      loadDesignations(values.departmentId);
      // If not initializing and current designationId may not belong, clear it
      if (!isInitializingRef.current) {
        setValues(prev => ({ ...prev, designationId: '' }));
      }
    } else {
      setDesignations([]);
      if (!isInitializingRef.current) {
        setValues(prev => ({ ...prev, designationId: '' }));
      }
    }
  }, [values.departmentId]);

  const loadDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const data = await departmentApiService.getAllDepartments();
      setDepartments(data);
    } catch {
      // Handle error silently
    } finally {
      setLoadingDepartments(false);
    }
  };

  const loadDesignations = async (departmentId: string) => {
    try {
      setLoadingDesignations(true);
      const response =
        await designationApiService.getDesignationsByDepartment(departmentId);
      setDesignations(response.items);
    } catch {
      setDesignations([]);
    } finally {
      setLoadingDesignations(false);
    }
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const label = (en: string, ar: string) => (language === 'ar' ? ar : en);

  // Dark‑mode
  const darkInputStyles: SxProps<Theme> = darkMode
    ? {
        '& .MuiOutlinedInput-root': {
          '& fieldset': { borderColor: '#555' },
          '&:hover fieldset': { borderColor: '#888' },
          '&.Mui-focused fieldset': { borderColor: '#90caf9' },
        },
        '& .MuiInputLabel-root': { color: '#ccc' },
        '& input, & .MuiSelect-select': { color: '#eee' },
      }
    : {};

  //Handlers
  const handleChange =
    (field: keyof FormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues({ ...values, [field]: e.target.value });
      // Clear both field-specific and general errors when user starts typing
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        delete newErrors.general;
        return newErrors;
      });
    };

  const validate = (): boolean => {
    const newErrors: Errors = {};
    if (!values.first_name)
      newErrors.first_name = label(
        'First name is required',
        'الاسم الأول مطلوب'
      );
    if (!values.last_name)
      newErrors.last_name = label('Last name is required', 'اسم العائلة مطلوب');
    if (!values.email)
      newErrors.email = label('Email is required', 'البريد الإلكتروني مطلوب');
    else if (!/[^\s@]+@[^\s@]+\.[^\s@]+/.test(values.email))
      newErrors.email = label(
        'Invalid email address',
        'عنوان البريد الإلكتروني غير صالح'
      );
    if (!values.phone)
      newErrors.phone = label('Phone is required', 'رقم الهاتف مطلوب');
    if (!values.designationId)
      newErrors.designationId = label(
        'Please select a designation',
        'يرجى اختيار المسمى الوظيفي'
      );
    // Only require gender when creating new employee, not when editing
    if (!initialData && !values.gender) newErrors.gender = 'Gender is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setValues({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      designationId: '',
      departmentId: '',
      gender: '', // <-- Reset gender
    });
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const result = await onSubmit?.(values);
      if (result && result.success) {
        // Reset form on successful submission
        resetForm();
      } else if (result && !result.success && result.errors) {
        // Set backend validation errors
        setErrors(result.errors);
      }
    } catch {
      /* Error handled silently */
    }
  };

  return (
    <Box component='form' onSubmit={handleSubmit} dir={dir}>
      {/* General Error Display */}
      {errors.general && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            bgcolor: 'error.light',
            color: 'error.contrastText',
            borderRadius: 1,
          }}
        >
          {errors.general}
        </Box>
      )}

      <Box display='flex' flexWrap='wrap' gap={2} sx={{ mt: 1 }}>
        {/* First Name */}
        <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
          <TextField
            fullWidth
            label={label('First Name', 'الاسم الأول')}
            value={values.first_name}
            onChange={handleChange('first_name')}
            error={!!errors.first_name}
            helperText={errors.first_name}
            sx={darkInputStyles}
          />
        </Box>

        {/* Last Name */}
        <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
          <TextField
            fullWidth
            label={label('Last Name', 'اسم العائلة')}
            value={values.last_name}
            onChange={handleChange('last_name')}
            error={!!errors.last_name}
            helperText={errors.last_name}
            sx={darkInputStyles}
          />
        </Box>

        {/* Email */}
        <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
          <TextField
            fullWidth
            label={label('Email', 'البريد الإلكتروني')}
            value={values.email}
            onChange={handleChange('email')}
            error={!!errors.email}
            helperText={errors.email}
            sx={darkInputStyles}
          />
        </Box>

        {/* Phone */}
        <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
          <TextField
            fullWidth
            label={label('Phone', 'رقم الهاتف')}
            value={values.phone}
            onChange={handleChange('phone')}
            error={!!errors.phone}
            helperText={errors.phone}
            sx={darkInputStyles}
          />
        </Box>

        {/* Gender - Only show when creating new employee, not when editing */}
        {!initialData && (
          <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
            <TextField
              select
              fullWidth
              label='Gender'
              value={values.gender ?? ''}
              onChange={handleChange('gender')}
              error={!!errors.gender}
              helperText={errors.gender}
              sx={darkInputStyles}
            >
              <MenuItem value=''>
                {/* No gender selected */}
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  Select Gender
                </span>
              </MenuItem>
              <MenuItem value='male'>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <svg
                    width='20'
                    height='20'
                    viewBox='0 0 24 24'
                    fill='none'
                    style={{ marginRight: 8 }}
                  >
                    <path
                      d='M19 4h-5a1 1 0 1 0 0 2h2.586l-4.243 4.243a6 6 0 1 0 1.414 1.414L18 7.414V10a1 1 0 1 0 2 0V5a1 1 0 0 0-1-1Zm-7 14a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z'
                      fill='#1976d2'
                    />
                  </svg>
                  Male
                </span>
              </MenuItem>
              <MenuItem value='female'>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <svg
                    width='20'
                    height='20'
                    viewBox='0 0 24 24'
                    fill='none'
                    style={{ marginRight: 8 }}
                  >
                    <path
                      d='M12 2a6 6 0 0 0-1 11.917V16H8a1 1 0 1 0 0 2h3v2a1 1 0 1 0 2 0v-2h3a1 1 0 1 0 0-2h-3v-2.083A6 6 0 0 0 12 2Zm0 10a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z'
                      fill='#d81b60'
                    />
                  </svg>
                  Female
                </span>
              </MenuItem>
            </TextField>
          </Box>
        )}

        {/* Department */}
        <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
          <TextField
            select
            fullWidth
            label={label('Department', 'القسم')}
            value={values.departmentId ?? ''}
            onChange={handleChange('departmentId')}
            error={!!errors.departmentId}
            helperText={errors.departmentId}
            disabled={loadingDepartments}
            sx={darkInputStyles}
          >
            {departments.length === 0 && (
              <MenuItem value=''>
                {label('No departments', 'لا توجد أقسام')}
              </MenuItem>
            )}
            {departments.map(dept => (
              <MenuItem key={dept.id} value={dept.id}>
                {dept.name}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* Designation */}
        <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
          <TextField
            select
            fullWidth
            disabled={!values.departmentId || loadingDesignations}
            label={label('Designation', 'المسمى الوظيفي')}
            value={values.designationId ?? ''}
            onChange={handleChange('designationId')}
            error={!!errors.designationId}
            helperText={errors.designationId}
            sx={darkInputStyles}
          >
            {designations.length === 0 && (
              <MenuItem value=''>
                {label('No designations', 'لا توجد مسميات')}
              </MenuItem>
            )}
            {designations.map(des => (
              <MenuItem key={des.id} value={des.id}>
                {des.title}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* Password reset info - show only on create (no initialData) */}
        {!initialData && (
          <Box flex='1 1 100%'>
            <Box
              sx={{
                p: 2,
                bgcolor: '#484c7f',
                color: 'info.contrastText',
                borderRadius: 1,
                textAlign: 'center',
              }}
            >
              {label(
                "A temporary password will be generated and sent to the employee's email for password reset.",
                'سيتم إنشاء كلمة مرور مؤقتة وإرسالها إلى بريد الموظف الإلكتروني لإعادة تعيين كلمة المرور.'
              )}
            </Box>
          </Box>
        )}

        {/* Submit */}
        <Box
          flex='1 1 100%'
          display='flex'
          justifyContent={
            isSm ? 'center' : language === 'ar' ? 'flex-start' : 'flex-end'
          }
        >
          <Button
            variant='contained'
            type='submit'
            sx={{ backgroundColor: '#484c7f' }}
          >
            {label(
              initialData ? 'Update Employee' : 'Add Employee',
              initialData ? 'تحديث الموظف' : 'إضافة موظف'
            )}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default AddEmployeeForm;
