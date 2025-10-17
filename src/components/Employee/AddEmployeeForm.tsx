import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  MenuItem,
  TextField,
  useMediaQuery,
  useTheme,
  InputAdornment,
} from '@mui/material';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import '../UserProfile/PhoneInput.css';
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
import { rolesApiService, type Role } from '../../api/rolesApi';

// Types
type FormValues = EmployeeDto & {
  departmentId?: string;
  gender: string;
  role: string;
  role_name?: string;
  role_id?: string;
  team_id?: string;
};

type Errors = Partial<FormValues> & {
  general?: string;
};

interface AddEmployeeFormProps {
  onSubmit?: (
    data: Partial<EmployeeDto> & {
      departmentId?: string;
      designationId?: string;
      role?: string;
      role_name?: string;
      role_id?: string;
      team_id?: string;
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
    role?: string;
    role_name?: string;
    role_id?: string;
    team_id?: string;
  } | null;
  submitting?: boolean;
}

interface OutletContext {
  darkMode: boolean;
  language: 'en' | 'ar';
}

// Component
const AddEmployeeForm: React.FC<AddEmployeeFormProps> = ({
  onSubmit,
  initialData,
  submitting = false,
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
    gender: initialData?.gender ?? '',
    role: initialData?.role ?? 'Employee', // Default to employee
    role_name: initialData?.role_name ?? '',
    //role_id: initialData?.role_id ?? '',
    team_id: initialData?.team_id ?? '',
  });

  const [originalValues] = useState<FormValues>({
    first_name: initialData?.firstName ?? '',
    last_name: initialData?.lastName ?? '',
    email: initialData?.email ?? '',
    phone: initialData?.phone ?? '',
    designationId: initialData?.designationId ?? '',
    departmentId: initialData?.departmentId ?? '',
    gender: initialData?.gender ?? '',
    role: initialData?.role ?? 'Employee',
    role_name: initialData?.role_name ?? '',
    //role_id: initialData?.role_id ?? '',
    team_id: initialData?.team_id ?? '',
  });

  const [errors, setErrors] = useState<Errors>({});
  const [departments, setDepartments] = useState<BackendDepartment[]>([]);
  const [designations, setDesignations] = useState<BackendDesignation[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingDesignations, setLoadingDesignations] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  // Track initialization to avoid clearing designation on first prefill
  const isInitializingRef = useRef<boolean>(true);

  const roleOptions = React.useMemo(() => {
    const allowedRoles = ['Employee', 'Manager', 'hr-admin'];

    return (roles || [])
      .map(r => (r.name || '').trim())
      .filter(name => allowedRoles.includes(name));
  }, [roles]);

  // Load departments and roles on component mount
  useEffect(() => {
    (async () => {
      await Promise.all([loadDepartments(), loadRoles()]);
      // If we have initial department and designation, ensure options include them
      if (initialData?.departmentId) {
        await loadDesignations(initialData.departmentId);
      }
      isInitializingRef.current = false;
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load all designations on mount
  useEffect(() => {
    (async () => {
      const allDesignations = await designationApiService.getAllDesignations();
      setDesignations(allDesignations);
    })();
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
        role: initialData.role ?? prev.role,
        role_name: initialData.role_name ?? prev.role_name,
        // role_id: initialData.role_id ?? prev.role_id,
        team_id: initialData.team_id ?? prev.team_id,
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

  // Check if form has changes
  const hasChanges = initialData
    ? values.first_name !== originalValues.first_name ||
      values.last_name !== originalValues.last_name ||
      values.email !== originalValues.email ||
      values.phone !== originalValues.phone ||
      values.designationId !== originalValues.designationId ||
      values.departmentId !== originalValues.departmentId ||
      values.gender !== originalValues.gender ||
      values.role !== originalValues.role ||
      values.role_name !== originalValues.role_name ||
      // values.role_id !== originalValues.role_id ||
      values.team_id !== originalValues.team_id
    : values.first_name.trim() !== '' ||
      values.last_name.trim() !== '' ||
      values.email.trim() !== '' ||
      values.phone.trim() !== '' ||
      values.designationId !== '' ||
      values.departmentId !== '' ||
      values.gender !== '' ||
      values.role !== 'Employee' ||
      values.role_name !== '' ||
      // values.role_id !== '' ||
      values.team_id !== '';

  // Remove filtering: always show all designations in the dropdown
  // const filteredDesignations = designations;

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

  const loadRoles = async () => {
    try {
      setLoadingRoles(true);
      const data = await rolesApiService.getAllRoles();
      console.log('Loaded roles from API:', data);
      setRoles(data);
    } catch (error) {
      console.error('Error loading roles:', error);
      // Handle error silently
    } finally {
      setLoadingRoles(false);
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
      const value = (e.target.value ?? '').toString();

      // Special handling for role field
      if (field === 'role') {
        const normalized = value.trim();
        setValues(prev => ({
          ...prev,
          role: normalized,
          role_id: normalized, // Use role name as ID since roles don't have separate IDs
          role_name: normalized,
        }));
      } else {
        setValues({ ...values, [field]: value });
      }

      // Clear both field-specific and general errors when user starts typing
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        if (field === 'role') {
          delete newErrors.role_id;
          delete newErrors.role_name;
        }
        delete newErrors.general;
        return newErrors;
      });
    };

  const handlePhoneChange = (value: string | undefined) => {
    const phoneValue = value || '';
    setValues({ ...values, phone: phoneValue });
    // Clear phone validation error when user starts typing
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.phone;
      delete newErrors.general;
      return newErrors;
    });
  };

  // When a designation is selected, set departmentId to its department
  const handleDesignationChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const selectedDesignationId = e.target.value;
    const selectedDesignation = designations.find(
      d => d.id === selectedDesignationId
    );
    setValues(prev => ({
      ...prev,
      designationId: selectedDesignationId,
      departmentId: selectedDesignation?.departmentId || '',
    }));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.designationId;
      delete newErrors.departmentId;
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
    else if (values.phone && values.phone.trim()) {
      // Basic validation for phone number format
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(values.phone)) {
        newErrors.phone = label(
          'Please enter a valid phone number',
          'يرجى إدخال رقم هاتف صحيح'
        );
      }
    }
    if (!values.designationId)
      newErrors.designationId = label(
        'Please select a designation',
        'يرجى اختيار المسمى الوظيفي'
      );
    // Only require gender when creating new employee, not when editing
    if (!initialData && !values.gender) newErrors.gender = 'Gender is required';
    // Only require role when creating new employee, not when editing
    if (!initialData && !values.role) newErrors.role = 'Role is required';
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
      gender: '',
      role: 'Employee', // Reset to default
      role_name: '',
      role_id: '',
      team_id: '',
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

  // Helper to check if all required fields are filled
  const isFormComplete = () => {
    if (!values.first_name.trim()) return false;
    if (!values.last_name.trim()) return false;
    if (!values.email.trim()) return false;
    if (!/[\w.-]+@[\w.-]+\.[A-Za-z]{2,}/.test(values.email)) return false;
    if (!values.phone.trim()) return false;
    if (!values.designationId) return false;
    if (!values.departmentId) return false;
    if (!initialData && !values.gender) return false;
    if (!initialData && !values.role) return false;
    return true;
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
            onChange={e => handlePhoneChange(e.target.value)}
            error={!!errors.phone}
            helperText={errors.phone}
            placeholder={label('Enter phone number', 'أدخل رقم الهاتف')}
            InputProps={{
              startAdornment: (
                <InputAdornment
                  position='start'
                  sx={{ margin: 0, padding: '28px 0px' }}
                >
                  <PhoneInput
                    defaultCountry='pk'
                    value={values.phone}
                    onChange={handlePhoneChange}
                    style={{
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      width: '100%',
                    }}
                    inputStyle={{
                      border: 'none',
                      outline: 'none',
                      padding: '0',
                      margin: '0',
                      fontSize: '1rem',
                      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                      backgroundColor: 'transparent',
                      width: '100%',
                      boxSizing: 'border-box',
                      flex: 1,
                      height: '100%',
                    }}
                    countrySelectorStyleProps={{
                      buttonStyle: {
                        border: 'none',
                        background: 'transparent',
                        padding: '0',
                        margin: '0',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      },
                    }}
                    className='phone-input-textfield-adornment'
                  />
                </InputAdornment>
              ),
            }}
            sx={{
              ...darkInputStyles,
              '& .MuiOutlinedInput-root': {
                padding: '0px',
              },
              '& .MuiInputBase-input': {
                display: 'none', // Hide the TextField input completely
              },
              '& .MuiInputAdornment-root': {
                width: '100%',
                margin: 0,
              },
              '& .MuiInputAdornment-positionStart': {
                marginRight: 0,
              },
            }}
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

        {/* Role Selection */}
          <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
            <TextField
              select
              fullWidth
              label={label('Role', 'الدور')}
              value={(values.role || '').trim()}
              onChange={handleChange('role')}
              error={!!errors.role}
              helperText={errors.role}
              disabled={loadingRoles}
              sx={darkInputStyles}
            >

              {loadingRoles ? (
                <MenuItem value=''>
                  {label('Loading roles...', 'جاري تحميل الأدوار...')}
                </MenuItem>
              ) : roleOptions.length === 0 ? (
                <MenuItem value='' disabled>
                  {label('No roles available', 'لا توجد أدوار متاحة')}
                </MenuItem>
              ) : (
                roleOptions.map((name, index) => (
                  <MenuItem key={`${name}-${index}`} value={name}>
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </MenuItem>
                ))
              )}
            </TextField>
          </Box>

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
            label={label('Designation', 'المسمى الوظيفي')}
            value={values.designationId ?? ''}
            onChange={handleDesignationChange}
            error={!!errors.designationId}
            helperText={errors.designationId}
            disabled={loadingDesignations}
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
            disabled={!hasChanges || submitting || !isFormComplete()}
            sx={{ backgroundColor: '#484c7f' }}
            startIcon={
              submitting ? (
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    border: '2px solid #ffffff',
                    borderTop: '2px solid transparent',
                    animation: 'spin 1s linear infinite',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }}
                />
              ) : null
            }
          >
            {submitting
              ? label(
                  initialData
                    ? 'Updating...'
                    : values.role === 'manager'
                      ? 'Adding Manager...'
                      : 'Adding Employee...',
                  initialData
                    ? 'جاري التحديث...'
                    : values.role === 'manager'
                      ? 'جاري إضافة المدير...'
                      : 'جاري إضافة الموظف...'
                )
              : label(
                  initialData
                    ? 'Update Employee'
                    : values.role === 'manager'
                      ? 'Add Manager'
                      : 'Add Employee',
                  initialData
                    ? 'تحديث الموظف'
                    : values.role === 'manager'
                      ? 'إضافة مدير'
                      : 'إضافة موظف'
                )}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default AddEmployeeForm;
