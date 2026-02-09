import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Box,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useOutletContext } from 'react-router-dom';
import AppButton from '../common/AppButton';
import AppInputField from '../common/AppInputField';
import AppDropdown from '../common/AppDropdown';
import type { SelectChangeEvent } from '@mui/material/Select';
import {
  type CreateJobRequisitionDto,
  type UpdateJobRequisitionDto,
  type EmploymentType,
  type WorkLocation,
} from '../../api/jobRequisitionApi';
import { departmentApiService } from '../../api/departmentApi';
import employeeApi from '../../api/employeeApi';
import { extractErrorMessage } from '../../utils/errorHandler';

interface JobRequisitionFormProps {
  initialData?: any;
  onSubmit: (data: CreateJobRequisitionDto | UpdateJobRequisitionDto) => Promise<{ success: boolean; errors?: Record<string, string> }>;
  isSubmitting?: boolean;
  isUpdate?: boolean;
  onCancel?: () => void;
  hideFormActions?: boolean;
}

interface Department {
  id: string;
  name: string;
}

interface Manager {
  id: string;
  name: string;
}

interface FormErrors {
  jobTitle?: string;
  departmentId?: string;
  reportingManagerId?: string;
  employmentType?: string;
  workLocation?: string;
  numberOfOpenings?: string;
  budgetedSalaryMin?: string;
  budgetedSalaryMax?: string;
  jobDescription?: string;
  responsibilities?: string;
  requiredSkills?: string;
  requiredExperience?: string;
  justificationForHire?: string;
  general?: string;
}

interface OutletContext {
  darkMode: boolean;
  language: 'en' | 'ar';
}

const employmentTypeOptions: { label: string; value: EmploymentType }[] = [
  { label: 'Full-time', value: 'Full-time' },
  { label: 'Part-time', value: 'Part-time' },
  { label: 'Contract', value: 'Contract' },
];

const workLocationOptions: { label: string; value: WorkLocation }[] = [
  { label: 'Remote', value: 'Remote' },
  { label: 'Onsite', value: 'Onsite' },
  { label: 'Hybrid', value: 'Hybrid' },
];

const JobRequisitionForm = forwardRef<{ submit: () => void }, JobRequisitionFormProps>(
  ({
    initialData,
    onSubmit,
    isSubmitting = false,
    isUpdate = false,
    onCancel,
    hideFormActions = false,
  }, ref) => {
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down('sm'));
  const { language } = useOutletContext<OutletContext>();

  const [formData, setFormData] = useState({
    jobTitle: initialData?.jobTitle || '',
    departmentId: initialData?.department?.id || '',
    reportingManagerId: initialData?.reportingManager?.id || '',
    employmentType: (initialData?.employmentType || 'Full-time') as EmploymentType,
    workLocation: (initialData?.workLocation || 'Onsite') as WorkLocation,
    numberOfOpenings: initialData?.numberOfOpenings || 1,
    budgetedSalaryMin: initialData?.budgetedSalaryMin || '',
    budgetedSalaryMax: initialData?.budgetedSalaryMax || '',
    jobDescription: initialData?.jobDescription || '',
    responsibilities: initialData?.responsibilities || '',
    requiredSkills: initialData?.requiredSkills || '',
    requiredExperience: initialData?.requiredExperience || '',
    justificationForHire: initialData?.justificationForHire || '',
  });

  const [originalFormData] = useState({ ...formData });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(true);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingManagers, setLoadingManagers] = useState(false);

  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const label = (en: string, ar: string) => (language === 'ar' ? ar : en);

  // Load departments and managers
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [depts, emps] = await Promise.all([
          departmentApiService.getAllDepartments(),
          employeeApi.getAllEmployeesWithoutPagination(),
        ]);

        setDepartments(
          (depts || []).map((dept: any) => ({
            id: dept.id,
            name: dept.name,
          }))
        );

        // Extract unique managers from employees
        const uniqueManagers = new Map<string, Manager>();
        if (emps) {
          emps.forEach((emp: any) => {
            if (emp.id && emp.name) {
              uniqueManagers.set(emp.id, { id: emp.id, name: emp.name });
            }
          });
        }
        setManagers(Array.from(uniqueManagers.values()));
      } catch (error) {
        console.error('Error loading form data:', extractErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Check if form has changes
  const hasChanges = isUpdate
    ? formData.jobTitle !== originalFormData.jobTitle ||
      formData.departmentId !== originalFormData.departmentId ||
      formData.reportingManagerId !== originalFormData.reportingManagerId ||
      formData.employmentType !== originalFormData.employmentType ||
      formData.workLocation !== originalFormData.workLocation ||
      formData.numberOfOpenings !== originalFormData.numberOfOpenings ||
      formData.budgetedSalaryMin !== originalFormData.budgetedSalaryMin ||
      formData.budgetedSalaryMax !== originalFormData.budgetedSalaryMax ||
      formData.jobDescription !== originalFormData.jobDescription ||
      formData.responsibilities !== originalFormData.responsibilities ||
      formData.requiredSkills !== originalFormData.requiredSkills ||
      formData.requiredExperience !== originalFormData.requiredExperience ||
      formData.justificationForHire !== originalFormData.justificationForHire
    : formData.jobTitle.trim() !== '' ||
      formData.departmentId !== '' ||
      formData.reportingManagerId !== '' ||
      formData.numberOfOpenings !== 1 ||
      formData.budgetedSalaryMin !== '' ||
      formData.budgetedSalaryMax !== '' ||
      formData.jobDescription.trim() !== '' ||
      formData.responsibilities.trim() !== '' ||
      formData.requiredSkills.trim() !== '';

  // Dropdown control styling to match AppInputField
  const dropdownControlSx = {
    '& .MuiOutlinedInput-root': {
      height: { xs: 40, sm: 44 },
      minHeight: { xs: 40, sm: 44 },
    },
    '& .MuiSelect-select': {
      padding: { xs: '8px 12px !important', sm: '10px 16px !important' },
      fontSize: { xs: '16px', sm: '14px' },
      lineHeight: 1.2,
      display: 'flex',
      alignItems: 'center',
    },
    '& .MuiInputBase-input': {
      padding: { xs: '8px 12px !important', sm: '10px 16px !important' },
      fontSize: { xs: '16px', sm: '14px' },
      lineHeight: 1.2,
    },
  } as const;

  // Match the common form control background used across modals
  const controlBg =
    theme.palette.mode === 'dark'
      ? theme.palette.background.default
      : '#F8F8F8';

  // Handlers
  const setFieldValue = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear field-specific and general errors when user starts typing
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field as keyof FormErrors];
      delete newErrors.general;
      return newErrors;
    });
  };

  const handleChange = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFieldValue(field, (e.target.value ?? '').toString());
    };

  const handleSelectChange = (field: string) =>
    (e: SelectChangeEvent<string | number | string[]>) => {
      const value = e.target.value;
      // Handle array case (multi-select) by taking first element, or single value
      const singleValue = Array.isArray(value) ? value[0] : value;
      setFieldValue(field, singleValue);
    };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.jobTitle.trim())
      newErrors.jobTitle = label('Job title is required', 'المسمى الوظيفي مطلوب');

    if (!formData.departmentId)
      newErrors.departmentId = label(
        'Department is required',
        'القسم مطلوب'
      );

    if (!formData.reportingManagerId)
      newErrors.reportingManagerId = label(
        'Reporting manager is required',
        'المدير المباشر مطلوب'
      );

    if (formData.numberOfOpenings < 1)
      newErrors.numberOfOpenings = label(
        'Must be at least 1',
        'يجب أن يكون على الأقل 1'
      );

    if (formData.budgetedSalaryMin && isNaN(Number(formData.budgetedSalaryMin)))
      newErrors.budgetedSalaryMin = label(
        'Must be a valid number',
        'يجب أن يكون رقمًا صحيحًا'
      );

    if (formData.budgetedSalaryMax && isNaN(Number(formData.budgetedSalaryMax)))
      newErrors.budgetedSalaryMax = label(
        'Must be a valid number',
        'يجب أن يكون رقمًا صحيحًا'
      );

    if (
      formData.budgetedSalaryMin &&
      formData.budgetedSalaryMax &&
      Number(formData.budgetedSalaryMin) > Number(formData.budgetedSalaryMax)
    ) {
      newErrors.budgetedSalaryMin = label(
        'Minimum salary cannot exceed maximum salary',
        'الحد الأدنى للراتب لا يمكن أن يتجاوز الحد الأقصى'
      );
    }

    if (!formData.jobDescription.trim())
      newErrors.jobDescription = label(
        'Job description is required',
        'وصف الوظيفة مطلوب'
      );

    if (!formData.responsibilities.trim())
      newErrors.responsibilities = label(
        'Responsibilities are required',
        'المسؤوليات مطلوبة'
      );

    if (!formData.requiredSkills.trim())
      newErrors.requiredSkills = label(
        'Required skills are required',
        'المهارات المطلوبة مطلوبة'
      );

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper to check if all required fields are filled
  const isFormComplete = () => {
    if (!formData.jobTitle.trim()) return false;
    if (!formData.departmentId) return false;
    if (!formData.reportingManagerId) return false;
    if (formData.numberOfOpenings < 1) return false;
    if (!formData.jobDescription.trim()) return false;
    if (!formData.responsibilities.trim()) return false;
    if (!formData.requiredSkills.trim()) return false;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const submitData: CreateJobRequisitionDto | UpdateJobRequisitionDto = {
        ...formData,
        numberOfOpenings: Number(formData.numberOfOpenings),
        budgetedSalaryMin: formData.budgetedSalaryMin ? Number(formData.budgetedSalaryMin) : 0,
        budgetedSalaryMax: formData.budgetedSalaryMax ? Number(formData.budgetedSalaryMax) : 0,
      };
      const result = await onSubmit(submitData);
      if (result && result.success) {
        // Reset or navigate handled by parent
      } else if (result && !result.success && result.errors) {
        setErrors(result.errors as FormErrors);
      }
    } catch (error) {
      console.error('Submit error:', extractErrorMessage(error));
    }
  };

  useImperativeHandle(ref, () => ({
    submit: () => {
      handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    },
  }));

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
        {/* Job Title */}
        <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
          <AppInputField
            label={label('Job Title', 'المسمى الوظيفي')}
            value={formData.jobTitle}
            onChange={handleChange('jobTitle')}
            error={!!errors.jobTitle}
            helperText={errors.jobTitle}
            placeholder={label('Enter job title', 'أدخل المسمى الوظيفي')}
            inputBackgroundColor={controlBg}
          />
        </Box>

        {/* Department */}
        <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
          <AppDropdown
            label={label('Department', 'القسم')}
            value={formData.departmentId || 'all'}
            onChange={handleSelectChange('departmentId')}
            error={!!errors.departmentId}
            helperText={errors.departmentId}
            disabled={loadingDepartments}
            inputBackgroundColor={controlBg}
            placeholder={label('Select department', 'اختر القسم')}
            sx={dropdownControlSx}
            options={[
              {
                value: 'all',
                label:
                  departments.length === 0
                    ? label('No departments', 'لا توجد أقسام')
                    : label('Select department', 'اختر القسم'),
              },
              ...departments.map(dept => ({
                value: dept.id,
                label: dept.name,
              })),
            ]}
          />
        </Box>

        {/* Reporting Manager */}
        <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
          <AppDropdown
            label={label('Reporting Manager', 'المدير المباشر')}
            value={formData.reportingManagerId || 'all'}
            onChange={handleSelectChange('reportingManagerId')}
            error={!!errors.reportingManagerId}
            helperText={errors.reportingManagerId}
            disabled={loadingManagers}
            inputBackgroundColor={controlBg}
            placeholder={label('Select manager', 'اختر المدير')}
            sx={dropdownControlSx}
            options={[
              {
                value: 'all',
                label:
                  managers.length === 0
                    ? label('No managers', 'لا يوجد مديرين')
                    : label('Select manager', 'اختر المدير'),
              },
              ...managers.map(mgr => ({
                value: mgr.id,
                label: mgr.name,
              })),
            ]}
          />
        </Box>

        {/* Employment Type */}
        <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
          <AppDropdown
            label={label('Employment Type', 'نوع التوظيف')}
            value={formData.employmentType || 'all'}
            onChange={handleSelectChange('employmentType')}
            error={!!errors.employmentType}
            helperText={errors.employmentType}
            inputBackgroundColor={controlBg}
            placeholder={label('Select employment type', 'اختر نوع التوظيف')}
            sx={dropdownControlSx}
            options={[
              {
                value: 'all',
                label: label('Select type', 'اختر النوع'),
              },
              ...employmentTypeOptions.map(opt => ({
                value: opt.value,
                label: opt.label,
              })),
            ]}
          />
        </Box>

        {/* Work Location */}
        <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
          <AppDropdown
            label={label('Work Location', 'مكان العمل')}
            value={formData.workLocation || 'all'}
            onChange={handleSelectChange('workLocation')}
            error={!!errors.workLocation}
            helperText={errors.workLocation}
            inputBackgroundColor={controlBg}
            placeholder={label('Select location', 'اختر الموقع')}
            sx={dropdownControlSx}
            options={[
              {
                value: 'all',
                label: label('Select location', 'اختر الموقع'),
              },
              ...workLocationOptions.map(opt => ({
                value: opt.value,
                label: opt.label,
              })),
            ]}
          />
        </Box>

        {/* Number of Openings */}
        <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
          <AppInputField
            label={label('Number of Openings', 'عدد الفرص المتاحة')}
            type='number'
            value={formData.numberOfOpenings}
            onChange={handleChange('numberOfOpenings')}
            error={!!errors.numberOfOpenings}
            helperText={errors.numberOfOpenings}
            placeholder={label('Number of openings', 'عدد الفرص')}
            inputBackgroundColor={controlBg}
          />
        </Box>

        {/* Budgeted Salary Min */}
        <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
          <AppInputField
            label={label('Budgeted Salary (Min)', 'الحد الأدنى للراتب')}
            type='number'
            value={formData.budgetedSalaryMin}
            onChange={handleChange('budgetedSalaryMin')}
            error={!!errors.budgetedSalaryMin}
            helperText={errors.budgetedSalaryMin}
            placeholder={label('Minimum salary', 'الحد الأدنى')}
            inputBackgroundColor={controlBg}
          />
        </Box>

        {/* Budgeted Salary Max */}
        <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
          <AppInputField
            label={label('Budgeted Salary (Max)', 'الحد الأقصى للراتب')}
            type='number'
            value={formData.budgetedSalaryMax}
            onChange={handleChange('budgetedSalaryMax')}
            error={!!errors.budgetedSalaryMax}
            helperText={errors.budgetedSalaryMax}
            placeholder={label('Maximum salary', 'الحد الأقصى')}
            inputBackgroundColor={controlBg}
          />
        </Box>

        {/* Job Description - Full Width */}
        <Box flex='1 1 100%'>
          <AppInputField
            label={label('Job Description', 'وصف الوظيفة')}
            value={formData.jobDescription}
            onChange={handleChange('jobDescription')}
            error={!!errors.jobDescription}
            helperText={errors.jobDescription}
            placeholder={label(
              'Provide a detailed job description...',
              'قدم وصفًا تفصيليًا للوظيفة...'
            )}
            inputBackgroundColor={controlBg}
            multiline
            rows={4}
          />
        </Box>

        {/* Key Responsibilities - Full Width */}
        <Box flex='1 1 100%'>
          <AppInputField
            label={label('Key Responsibilities', 'المسؤوليات الرئيسية')}
            value={formData.responsibilities}
            onChange={handleChange('responsibilities')}
            error={!!errors.responsibilities}
            helperText={errors.responsibilities}
            placeholder={label(
              'List key responsibilities (one per line or comma-separated)...',
              'قائمة المسؤوليات الرئيسية (واحد لكل سطر أو مفصول بفواصل)...'
            )}
            inputBackgroundColor={controlBg}
            multiline
            rows={4}
          />
        </Box>

        {/* Required Skills - Full Width */}
        <Box flex='1 1 100%'>
          <AppInputField
            label={label('Required Skills', 'المهارات المطلوبة')}
            value={formData.requiredSkills}
            onChange={handleChange('requiredSkills')}
            error={!!errors.requiredSkills}
            helperText={errors.requiredSkills}
            placeholder={label(
              'List required skills (one per line or comma-separated)...',
              'قائمة المهارات المطلوبة (واحد لكل سطر أو مفصول بفواصل)...'
            )}
            inputBackgroundColor={controlBg}
            multiline
            rows={3}
          />
        </Box>

        {/* Required Experience - Full Width (Optional) */}
        <Box flex='1 1 100%'>
          <AppInputField
            label={label('Required Experience', 'الخبرة المطلوبة')}
            value={formData.requiredExperience}
            onChange={handleChange('requiredExperience')}
            error={!!errors.requiredExperience}
            helperText={errors.requiredExperience}
            placeholder={label(
              'Describe required experience, education, and certifications...',
              'وصف الخبرة والتعليم والشهادات المطلوبة...'
            )}
            inputBackgroundColor={controlBg}
            multiline
            rows={3}
          />
        </Box>

        {/* Justification for Hire - Full Width (Optional) */}
        <Box flex='1 1 100%'>
          <AppInputField
            label={label('Justification for Hire', 'تبرير التوظيف')}
            value={formData.justificationForHire}
            onChange={handleChange('justificationForHire')}
            error={!!errors.justificationForHire}
            helperText={errors.justificationForHire}
            placeholder={label(
              'Explain why this hire is needed (new role / replacement / expansion)...',
              'اشرح سبب الحاجة إلى هذا التوظيف (دور جديد / استبدال / توسع)...'
            )}
            inputBackgroundColor={controlBg}
            multiline
            rows={3}
          />
        </Box>

        {/* Submit Button */}
        {!hideFormActions && (
          <Box
            flex='1 1 100%'
            display='flex'
            justifyContent={
              isSm ? 'center' : language === 'ar' ? 'flex-start' : 'flex-end'
            }
            gap={2}
          >
            {onCancel && (
              <AppButton
                variant='outlined'
                variantType='secondary'
                onClick={onCancel}
                disabled={isSubmitting}
                text={label('Cancel', 'إلغاء')}
                sx={{
                  fontSize: 'var(--body-font-size)',
                  lineHeight: 'var(--body-line-height)',
                  letterSpacing: 'var(--body-letter-spacing)',
                  boxShadow: 'none',
                  minWidth: { xs: 'auto', sm: 120 },
                  px: { xs: 1.5, sm: 2 },
                  py: { xs: 0.75, sm: 1 },
                }}
              />
            )}
            <AppButton
              variant='contained'
              variantType='primary'
              type='submit'
              disabled={!hasChanges || isSubmitting || !isFormComplete()}
              startIcon={
                isSubmitting ? (
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
              sx={{
                fontSize: 'var(--body-font-size)',
                lineHeight: 'var(--body-line-height)',
                letterSpacing: 'var(--body-letter-spacing)',
                boxShadow: 'none',
                minWidth: { xs: 'auto', sm: 200 },
                px: { xs: 1.5, sm: 2 },
                py: { xs: 0.75, sm: 1 },
                '& .MuiButton-startIcon': {
                  marginRight: { xs: 0.5, sm: 1 },
                  '& > *:nth-of-type(1)': {
                    fontSize: { xs: '18px', sm: '20px' },
                  },
                },
              }}
              text={
                isSubmitting
                  ? label(
                      isUpdate ? 'Updating...' : 'Creating...',
                      isUpdate ? 'جاري التحديث...' : 'جاري الإنشاء...'
                    )
                  : label(
                      isUpdate ? 'Update Requisition' : 'Create Requisition',
                      isUpdate ? 'تحديث الطلب' : 'إنشاء الطلب'
                    )
              }
            />
          </Box>
        )}
      </Box>
    </Box>
  );
});

export default JobRequisitionForm;
