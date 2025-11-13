import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  MenuItem,
  TextField,
  useMediaQuery,
  useTheme,
  InputAdornment,
  Typography,
  Dialog,
  DialogContent,
  IconButton,
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
  cnicFrontPicture?: File | null;
  cnicBackPicture?: File | null;
};

type Errors = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  password?: string;
  designationId?: string;
  departmentId?: string;
  gender?: string;
  role?: string;
  role_name?: string;
  role_id?: string;
  team_id?: string;
  cnicNumber?: string;
  general?: string;
  profilePicture?: string;
  cnicFrontPicture?: string;
  cnicBackPicture?: string;
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
    cnicNumber?: string;
    profilePicture?: string; // URL or path to existing image
    cnicFrontPicture?: string; // URL or path to existing image
    cnicBackPicture?: string; // URL or path to existing image
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
    cnicNumber: initialData?.cnicNumber ?? '',
    profilePicture: null, // Will be set when user uploads new image
    cnicFrontPicture: null, // Will be set when user uploads new image
    cnicBackPicture: null, // Will be set when user uploads new image
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
    cnicNumber: initialData?.cnicNumber ?? '',
    profilePicture: null,
    cnicFrontPicture: null,
    cnicBackPicture: null,
  });

  const [errors, setErrors] = useState<Errors>({});
  const [departments, setDepartments] = useState<BackendDepartment[]>([]);
  const [designations, setDesignations] = useState<BackendDesignation[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingDesignations, setLoadingDesignations] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [previewImage, setPreviewImage] = useState<{
    src: string;
    title: string;
  } | null>(null);
  // Track initialization to avoid clearing designation on first prefill
  const isInitializingRef = useRef<boolean>(true);

  const roleOptions = React.useMemo(() => {
    const allowedRoles = ['Employee', 'Manager', 'hr-admin', 'network-admin'];

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
        cnicNumber: initialData.cnicNumber ?? prev.cnicNumber,
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
      values.team_id !== originalValues.team_id ||
      values.cnicNumber !== originalValues.cnicNumber ||
      values.profilePicture !== null ||
      values.cnicFrontPicture !== null ||
      values.cnicBackPicture !== null
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
      values.team_id !== '' ||
      values.cnicNumber !== '' ||
      values.profilePicture !== null ||
      values.cnicFrontPicture !== null ||
      values.cnicBackPicture !== null;

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
      const response = await designationApiService.getDesignationsByDepartment(
        departmentId,
        null
      ); // Pass null to get all designations for dropdown
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

  // Handle image uploads
  const handleImageUpload =
    (type: 'profile' | 'cnicFront' | 'cnicBack') =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          setErrors(prev => ({
            ...prev,
            general: 'Please select a valid image file',
          }));
          return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          setErrors(prev => ({
            ...prev,
            general: 'Image size should not exceed 5MB',
          }));
          return;
        }

        setValues(prev => ({
          ...prev,
          [type === 'profile'
            ? 'profilePicture'
            : type === 'cnicFront'
              ? 'cnicFrontPicture'
              : 'cnicBackPicture']: file,
        }));

        // Clear errors
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.general;
          // Clear the specific picture error
          if (type === 'profile') {
            delete newErrors.profilePicture;
          } else if (type === 'cnicFront') {
            delete newErrors.cnicFrontPicture;
          } else if (type === 'cnicBack') {
            delete newErrors.cnicBackPicture;
          }
          return newErrors;
        });
      }
    };

  // Handle CNIC number formatting
  const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits

    // Format CNIC: 12345-1234567-1
    if (value.length > 5) {
      value = value.substring(0, 5) + '-' + value.substring(5);
    }
    if (value.length > 13) {
      value = value.substring(0, 13) + '-' + value.substring(13);
    }
    if (value.length > 15) {
      value = value.substring(0, 15);
    }

    setValues({ ...values, cnicNumber: value });

    // Clear CNIC validation error when user starts typing
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.cnicNumber;
      delete newErrors.general;
      return newErrors;
    });
  };

  // Handle image preview click
  const handleImagePreviewClick = (src: string, title: string) => {
    setPreviewImage({ src, title });
  };

  // Close image preview
  const handleClosePreview = () => {
    setPreviewImage(null);
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
    // CNIC validation
    if (!values.cnicNumber) {
      newErrors.cnicNumber = label(
        'CNIC Number is required',
        'رقم الهوية الوطنية مطلوب'
      );
    } else {
      const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
      if (!cnicRegex.test(values.cnicNumber)) {
        newErrors.cnicNumber = label(
          'Please enter a valid CNIC number (12345-1234567-1)',
          'يرجى إدخال رقم هوية وطنية صحيح (12345-1234567-1)'
        );
      }
    }

    // Picture validation only when creating new employee
    if (!initialData) {
      if (!values.profilePicture) {
        newErrors.profilePicture = label(
          'Profile picture is required',
          'الصورة الشخصية مطلوبة'
        );
      }
      if (!values.cnicFrontPicture) {
        newErrors.cnicFrontPicture = label(
          'CNIC front picture is required',
          'صورة الهوية الأمامية مطلوبة'
        );
      }
      if (!values.cnicBackPicture) {
        newErrors.cnicBackPicture = label(
          'CNIC back picture is required',
          'صورة الهوية الخلفية مطلوبة'
        );
      }
    }

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
      cnicNumber: '',
      profilePicture: null,
      cnicFrontPicture: null,
      cnicBackPicture: null,
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
    if (!values.cnicNumber) return false;
    if (!initialData && !values.gender) return false;
    if (!initialData && !values.role) return false;

    // Require pictures only for create; for edit they are optional
    if (!initialData) {
      if (!values.profilePicture) return false;
      if (!values.cnicFrontPicture) return false;
      if (!values.cnicBackPicture) return false;
    }

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

        {/* CNIC Number */}
        <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
          <TextField
            fullWidth
            label={label('CNIC Number', 'رقم الهوية الوطنية')}
            value={values.cnicNumber}
            onChange={handleCnicChange}
            error={!!errors.cnicNumber}
            // helperText={errors.cnicNumber || label('Format: 12345-1234567-1', 'التنسيق: 12345-1234567-1')}
            sx={darkInputStyles}
            placeholder='12345-1234567-1'
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

        {/* Profile Picture Upload */}
        <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
          <TextField
            fullWidth
            label={label('Profile Picture', 'الصورة الشخصية')}
            value={values.profilePicture ? values.profilePicture.name : ''}
            error={!!errors.profilePicture}
            helperText={errors.profilePicture}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position='end'>
                  <input
                    accept='image/*'
                    style={{ display: 'none' }}
                    id='profile-picture-upload'
                    type='file'
                    onChange={handleImageUpload('profile')}
                  />
                  <label htmlFor='profile-picture-upload'>
                    <Button
                      variant='outlined'
                      component='span'
                      size='small'
                      sx={{ textTransform: 'none' }}
                    >
                      {label('Upload', 'رفع')}
                    </Button>
                  </label>
                </InputAdornment>
              ),
            }}
            sx={darkInputStyles}
            placeholder={label('Select profile picture', 'اختر الصورة الشخصية')}
          />
        </Box>

        {/* CNIC Front Picture Upload */}
        <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
          <TextField
            fullWidth
            label={label('CNIC Front Side', 'الوجه الأمامي للهوية')}
            value={values.cnicFrontPicture ? values.cnicFrontPicture.name : ''}
            error={!!errors.cnicFrontPicture}
            helperText={errors.cnicFrontPicture}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position='end'>
                  <input
                    accept='image/*'
                    style={{ display: 'none' }}
                    id='cnic-front-upload'
                    type='file'
                    onChange={handleImageUpload('cnicFront')}
                  />
                  <label htmlFor='cnic-front-upload'>
                    <Button
                      variant='outlined'
                      component='span'
                      size='small'
                      sx={{ textTransform: 'none' }}
                    >
                      {label('Upload', 'رفع')}
                    </Button>
                  </label>
                </InputAdornment>
              ),
            }}
            sx={darkInputStyles}
            placeholder={label(
              'Select CNIC front side',
              'اختر الوجه الأمامي للهوية'
            )}
          />
        </Box>

        {/* CNIC Back Picture Upload */}
        <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
          <TextField
            fullWidth
            label={label('CNIC Back Side', 'الوجه الخلفي للهوية')}
            value={values.cnicBackPicture ? values.cnicBackPicture.name : ''}
            error={!!errors.cnicBackPicture}
            helperText={errors.cnicBackPicture}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position='end'>
                  <input
                    accept='image/*'
                    style={{ display: 'none' }}
                    id='cnic-back-upload'
                    type='file'
                    onChange={handleImageUpload('cnicBack')}
                  />
                  <label htmlFor='cnic-back-upload'>
                    <Button
                      variant='outlined'
                      component='span'
                      size='small'
                      sx={{ textTransform: 'none' }}
                    >
                      {label('Upload', 'رفع')}
                    </Button>
                  </label>
                </InputAdornment>
              ),
            }}
            sx={darkInputStyles}
            placeholder={label(
              'Select CNIC back side',
              'اختر الوجه الخلفي للهوية'
            )}
          />
        </Box>

        {/* Image Previews - Show uploaded or existing (when editing) */}
        {(values.profilePicture ||
          values.cnicFrontPicture ||
          values.cnicBackPicture ||
          initialData?.profilePicture ||
          initialData?.cnicFrontPicture ||
          initialData?.cnicBackPicture) && (
          <Box flex='1 1 100%' sx={{ mt: 2 }}>
            <Box display='flex' flexWrap='wrap' gap={2} justifyContent='center'>
              {/* Profile Picture Preview */}
              {(values.profilePicture || initialData?.profilePicture) && (
                <Box sx={{ textAlign: 'center' }}>
                  <Box
                    component='img'
                    src={
                      values.profilePicture
                        ? URL.createObjectURL(values.profilePicture)
                        : initialData?.profilePicture || ''
                    }
                    alt='Profile Preview'
                    sx={{
                      width: 150,
                      height: 150,
                      objectFit: 'cover',
                      borderRadius: 2,
                      border: '2px solid',
                      borderColor: 'primary.main',
                      mb: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        opacity: 0.8,
                        transform: 'scale(1.05)',
                        transition: 'all 0.2s ease-in-out',
                      },
                    }}
                    onClick={() =>
                      handleImagePreviewClick(
                        values.profilePicture
                          ? URL.createObjectURL(values.profilePicture)
                          : initialData?.profilePicture || '',
                        label('Profile Picture', 'الصورة الشخصية')
                      )
                    }
                  />
                  <Typography
                    variant='caption'
                    display='block'
                    sx={{ fontWeight: 600 }}
                  >
                    {label('Profile Picture', 'الصورة الشخصية')}
                  </Typography>
                </Box>
              )}

              {/* CNIC Front Picture Preview */}
              {(values.cnicFrontPicture || initialData?.cnicFrontPicture) && (
                <Box sx={{ textAlign: 'center' }}>
                  <Box
                    component='img'
                    src={
                      values.cnicFrontPicture
                        ? URL.createObjectURL(values.cnicFrontPicture)
                        : initialData?.cnicFrontPicture || ''
                    }
                    alt='CNIC Front Preview'
                    sx={{
                      width: 150,
                      height: 150,
                      objectFit: 'cover',
                      borderRadius: 2,
                      border: '2px solid',
                      borderColor: 'success.main',
                      mb: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        opacity: 0.8,
                        transform: 'scale(1.05)',
                        transition: 'all 0.2s ease-in-out',
                      },
                    }}
                    onClick={() =>
                      handleImagePreviewClick(
                        values.cnicFrontPicture
                          ? URL.createObjectURL(values.cnicFrontPicture)
                          : initialData?.cnicFrontPicture || '',
                        label('CNIC Front Side', 'الوجه الأمامي للهوية')
                      )
                    }
                  />
                  <Typography
                    variant='caption'
                    display='block'
                    sx={{ fontWeight: 600 }}
                  >
                    {label('CNIC Front Side', 'الوجه الأمامي للهوية')}
                  </Typography>
                </Box>
              )}

              {/* CNIC Back Picture Preview */}
              {(values.cnicBackPicture || initialData?.cnicBackPicture) && (
                <Box sx={{ textAlign: 'center' }}>
                  <Box
                    component='img'
                    src={
                      values.cnicBackPicture
                        ? URL.createObjectURL(values.cnicBackPicture)
                        : initialData?.cnicBackPicture || ''
                    }
                    alt='CNIC Back Preview'
                    sx={{
                      width: 150,
                      height: 150,
                      objectFit: 'cover',
                      borderRadius: 2,
                      border: '2px solid',
                      borderColor: 'warning.main',
                      mb: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        opacity: 0.8,
                        transform: 'scale(1.05)',
                        transition: 'all 0.2s ease-in-out',
                      },
                    }}
                    onClick={() =>
                      handleImagePreviewClick(
                        values.cnicBackPicture
                          ? URL.createObjectURL(values.cnicBackPicture)
                          : initialData?.cnicBackPicture || '',
                        label('CNIC Back Side', 'الوجه الخلفي للهوية')
                      )
                    }
                  />
                  <Typography
                    variant='caption'
                    display='block'
                    sx={{ fontWeight: 600 }}
                  >
                    {label('CNIC Back Side', 'الوجه الخلفي للهوية')}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}

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

      {/* Image Preview Dialog */}
      <Dialog
        open={!!previewImage}
        onClose={handleClosePreview}
        maxWidth='md'
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            backgroundColor: 'transparent',
            boxShadow: 'none',
          },
        }}
      >
        <DialogContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 0,
            position: 'relative',
          }}
        >
          <IconButton
            onClick={handleClosePreview}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              zIndex: 1,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
              },
            }}
          >
            ✕
          </IconButton>
          {previewImage && (
            <>
              <Box
                component='img'
                src={previewImage.src}
                alt={previewImage.title}
                sx={{
                  maxWidth: '90vw',
                  maxHeight: '90vh',
                  objectFit: 'contain',
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                }}
              />
              <Typography
                variant='h6'
                sx={{
                  mt: 2,
                  color: 'white',
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  px: 2,
                  py: 1,
                  borderRadius: 1,
                }}
              >
                {previewImage.title}
              </Typography>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default AddEmployeeForm;
