import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Box,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useOutletContext } from 'react-router-dom';
import type { AppOutletContext } from '../../types/outletContexts';
import AppButton from '../common/AppButton';
import AppInputField from '../common/AppInputField';
import AppDropdown from '../common/AppDropdown';
import type { SelectChangeEvent } from '@mui/material/Select';
import { useForm, Controller } from 'react-hook-form';
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

type FormValues = {
  jobTitle: string;
  departmentId: string;
  reportingManagerId: string;
  employmentType: EmploymentType;
  workLocation: WorkLocation;
  numberOfOpenings: number | string;
  budgetedSalaryMin: string;
  budgetedSalaryMax: string;
  jobDescription: string;
  responsibilities: string;
  requiredSkills: string;
  requiredExperience: string;
  justificationForHire: string;
};


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
  const { language } = useOutletContext<AppOutletContext>();

  const defaultValues: FormValues = {
    jobTitle: initialData?.jobTitle || '',
    departmentId: initialData?.department?.id || 'all',
    reportingManagerId: initialData?.reportingManager?.id || 'all',
    employmentType: (initialData?.employmentType || 'Full-time') as EmploymentType,
    workLocation: (initialData?.workLocation || 'Onsite') as WorkLocation,
    numberOfOpenings: initialData?.numberOfOpenings ?? 1,
    budgetedSalaryMin: initialData?.budgetedSalaryMin ? String(initialData.budgetedSalaryMin) : '',
    budgetedSalaryMax: initialData?.budgetedSalaryMax ? String(initialData.budgetedSalaryMax) : '',
    jobDescription: initialData?.jobDescription || '',
    responsibilities: initialData?.responsibilities || '',
    requiredSkills: initialData?.requiredSkills || '',
    requiredExperience: initialData?.requiredExperience || '',
    justificationForHire: initialData?.justificationForHire || '',
  };

  const [originalFormData] = useState({ ...defaultValues });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [generalError, setGeneralError] = useState<string | null>(null);
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

  // react-hook-form setup
  const { control, handleSubmit, setError, clearErrors, formState: { errors }, watch, getValues } = useForm<FormValues>({
    defaultValues,
  });

  const hasChanges = (() => {
    const current = getValues();
    if (isUpdate) {
      return (
        current.jobTitle !== originalFormData.jobTitle ||
        current.departmentId !== originalFormData.departmentId ||
        current.reportingManagerId !== originalFormData.reportingManagerId ||
        current.employmentType !== originalFormData.employmentType ||
        current.workLocation !== originalFormData.workLocation ||
        String(current.numberOfOpenings) !== String(originalFormData.numberOfOpenings) ||
        current.budgetedSalaryMin !== originalFormData.budgetedSalaryMin ||
        current.budgetedSalaryMax !== originalFormData.budgetedSalaryMax ||
        current.jobDescription !== originalFormData.jobDescription ||
        current.responsibilities !== originalFormData.responsibilities ||
        current.requiredSkills !== originalFormData.requiredSkills ||
        current.requiredExperience !== originalFormData.requiredExperience ||
        current.justificationForHire !== originalFormData.justificationForHire
      );
    }
    return (
      (current.jobTitle && current.jobTitle.toString().trim() !== '') ||
      (current.departmentId && current.departmentId !== 'all') ||
      (current.reportingManagerId && current.reportingManagerId !== 'all') ||
      (String(current.numberOfOpenings) !== '1') ||
      (current.budgetedSalaryMin && current.budgetedSalaryMin !== '') ||
      (current.budgetedSalaryMax && current.budgetedSalaryMax !== '') ||
      (current.jobDescription && current.jobDescription.toString().trim() !== '') ||
      (current.responsibilities && current.responsibilities.toString().trim() !== '') ||
      (current.requiredSkills && current.requiredSkills.toString().trim() !== '')
    );
  })();

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

  const isFormComplete = (vals?: FormValues) => {
    const v = vals || getValues();
    if (!v.jobTitle?.toString().trim()) return false;
    if (!v.departmentId || v.departmentId === 'all') return false;
    if (!v.reportingManagerId || v.reportingManagerId === 'all') return false;
    if (Number(v.numberOfOpenings) < 1) return false;
    if (!v.jobDescription?.toString().trim()) return false;
    if (!v.responsibilities?.toString().trim()) return false;
    if (!v.requiredSkills?.toString().trim()) return false;
    return true;
  };

  const onSubmitInternal = async (data: FormValues) => {
    setGeneralError(null);
    clearErrors();

    if (data.budgetedSalaryMin && isNaN(Number(data.budgetedSalaryMin))) {
      setError('budgetedSalaryMin', { type: 'manual', message: label('Must be a valid number', 'يجب أن يكون رقمًا صحيحًا') });
      return;
    }
    if (data.budgetedSalaryMax && isNaN(Number(data.budgetedSalaryMax))) {
      setError('budgetedSalaryMax', { type: 'manual', message: label('Must be a valid number', 'يجب أن يكون رقمًا صحيحًا') });
      return;
    }
    if (data.budgetedSalaryMin && data.budgetedSalaryMax && Number(data.budgetedSalaryMin) > Number(data.budgetedSalaryMax)) {
      setError('budgetedSalaryMin', { type: 'manual', message: label('Minimum salary cannot exceed maximum salary', 'الحد الأدنى للراتب لا يمكن أن يتجاوز الحد الأقصى') });
      return;
    }

    try {
      const submitData: CreateJobRequisitionDto | UpdateJobRequisitionDto = {
        ...data,
        numberOfOpenings: Number(data.numberOfOpenings),
        budgetedSalaryMin: data.budgetedSalaryMin ? Number(data.budgetedSalaryMin) : 0,
        budgetedSalaryMax: data.budgetedSalaryMax ? Number(data.budgetedSalaryMax) : 0,
      } as any;
      const result = await onSubmit(submitData);
      if (result && result.success) {
        // handled by parent
      } else if (result && !result.success && result.errors) {
        const errs = result.errors as Record<string, string>;
        Object.keys(errs).forEach(k => setError(k as any, { type: 'server', message: errs[k] }));
        if (errs.general) setGeneralError(errs.general);
      }
    } catch (error) {
      const err = extractErrorMessage(error);
      console.error('Submit error:', err);
      setGeneralError(err.message);
    }
  };

  useImperativeHandle(ref, () => ({
    submit: () => {
      handleSubmit(onSubmitInternal)();
    },
  }));
  return (
    <Box component='form' onSubmit={handleSubmit(onSubmitInternal)} dir={dir}>
      {/* General Error Display */}
      {generalError && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            bgcolor: 'error.light',
            color: 'error.contrastText',
            borderRadius: 1,
          }}
        >
          {generalError}
        </Box>
      )}

      <Box display='flex' flexWrap='wrap' gap={2} sx={{ mt: 1 }}>
        {/* Job Title */}
        <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
          <Controller
            name='jobTitle'
            control={control}
            rules={{ required: label('Job title is required', 'المسمى الوظيفي مطلوب') }}
            render={({ field }) => (
              <AppInputField
                label={label('Job Title', 'المسمى الوظيفي')}
                value={field.value}
                onChange={(e: any) => field.onChange(e.target ? e.target.value : e)}
                error={!!errors.jobTitle}
                helperText={errors.jobTitle?.message as string}
                placeholder={label('Enter job title', 'أدخل المسمى الوظيفي')}
                inputBackgroundColor={controlBg}
              />
            )}
          />
        </Box>

        {/* Department */}
        <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
          <Controller
            name='departmentId'
            control={control}
            rules={{
              validate: (v: string) => (v && v !== 'all') || label('Department is required', 'القسم مطلوب'),
            }}
            render={({ field }) => (
              <AppDropdown
                label={label('Department', 'القسم')}
                value={field.value || 'all'}
                onChange={(e: SelectChangeEvent<string | number | string[]>) => field.onChange(Array.isArray(e.target.value) ? e.target.value[0] : e.target.value)}
                error={!!errors.departmentId}
                helperText={errors.departmentId?.message as string}
                disabled={loadingDepartments}
                inputBackgroundColor={controlBg}
                placeholder={label('Select department', 'اختر القسم')}
                sx={dropdownControlSx}
                options={[
                  {
                    value: 'all',
                    label: departments.length === 0 ? label('No departments', 'لا توجد أقسام') : label('Select department', 'اختر القسم'),
                  },
                  ...departments.map(dept => ({ value: dept.id, label: dept.name })),
                ]}
              />
            )}
          />
        </Box>

        {/* Reporting Manager */}
        <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
          <Controller
            name='reportingManagerId'
            control={control}
            rules={{
              validate: (v: string) => (v && v !== 'all') || label('Reporting manager is required', 'المدير المباشر مطلوب'),
            }}
            render={({ field }) => (
              <AppDropdown
                label={label('Reporting Manager', 'المدير المباشر')}
                value={field.value || 'all'}
                onChange={(e: SelectChangeEvent<string | number | string[]>) => field.onChange(Array.isArray(e.target.value) ? e.target.value[0] : e.target.value)}
                error={!!errors.reportingManagerId}
                helperText={errors.reportingManagerId?.message as string}
                disabled={loadingManagers}
                inputBackgroundColor={controlBg}
                placeholder={label('Select manager', 'اختر المدير')}
                sx={dropdownControlSx}
                options={[
                  { value: 'all', label: managers.length === 0 ? label('No managers', 'لا يوجد مديرين') : label('Select manager', 'اختر المدير') },
                  ...managers.map(mgr => ({ value: mgr.id, label: mgr.name })),
                ]}
              />
            )}
          />
        </Box>

        {/* Employment Type */}
        <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
          <Controller
            name='employmentType'
            control={control}
            render={({ field }) => (
              <AppDropdown
                label={label('Employment Type', 'نوع التوظيف')}
                value={field.value || ''}
                onChange={(e: SelectChangeEvent<string | number | string[]>) => field.onChange(Array.isArray(e.target.value) ? e.target.value[0] : e.target.value)}
                error={!!errors.employmentType}
                helperText={errors.employmentType?.message as string}
                inputBackgroundColor={controlBg}
                placeholder={label('Select employment type', 'اختر نوع التوظيف')}
                sx={dropdownControlSx}
                options={[{ value: 'all', label: label('Select type', 'اختر النوع') }, ...employmentTypeOptions.map(opt => ({ value: opt.value, label: opt.label }))]}
              />
            )}
          />
        </Box>

        {/* Work Location */}
        <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
          <Controller
            name='workLocation'
            control={control}
            render={({ field }) => (
              <AppDropdown
                label={label('Work Location', 'مكان العمل')}
                value={field.value || ''}
                onChange={(e: SelectChangeEvent<string | number | string[]>) => field.onChange(Array.isArray(e.target.value) ? e.target.value[0] : e.target.value)}
                error={!!errors.workLocation}
                helperText={errors.workLocation?.message as string}
                inputBackgroundColor={controlBg}
                placeholder={label('Select location', 'اختر الموقع')}
                sx={dropdownControlSx}
                options={[{ value: 'all', label: label('Select location', 'اختر الموقع') }, ...workLocationOptions.map(opt => ({ value: opt.value, label: opt.label }))]}
              />
            )}
          />
        </Box>

        {/* Number of Openings */}
        <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
          <Controller
            name='numberOfOpenings'
            control={control}
            rules={{ min: { value: 1, message: label('Must be at least 1', 'يجب أن يكون على الأقل 1') } }}
            render={({ field }) => (
              <AppInputField
                label={label('Number of Openings', 'عدد الفرص المتاحة')}
                type='number'
                value={field.value as any}
                onChange={(e: any) => field.onChange(e.target ? e.target.value : e)}
                error={!!errors.numberOfOpenings}
                helperText={errors.numberOfOpenings?.message as string}
                placeholder={label('Number of openings', 'عدد الفرص')}
                inputBackgroundColor={controlBg}
              />
            )}
          />
        </Box>

        {/* Budgeted Salary Min */}
        <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
          <Controller
            name='budgetedSalaryMin'
            control={control}
            render={({ field }) => (
              <AppInputField
                label={label('Budgeted Salary (Min)', 'الحد الأدنى للراتب')}
                type='number'
                value={field.value as any}
                onChange={(e: any) => field.onChange(e.target ? e.target.value : e)}
                error={!!errors.budgetedSalaryMin}
                helperText={errors.budgetedSalaryMin?.message as string}
                placeholder={label('Minimum salary', 'الحد الأدنى')}
                inputBackgroundColor={controlBg}
              />
            )}
          />
        </Box>

        {/* Budgeted Salary Max */}
        <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
          <Controller
            name='budgetedSalaryMax'
            control={control}
            render={({ field }) => (
              <AppInputField
                label={label('Budgeted Salary (Max)', 'الحد الأقصى للراتب')}
                type='number'
                value={field.value as any}
                onChange={(e: any) => field.onChange(e.target ? e.target.value : e)}
                error={!!errors.budgetedSalaryMax}
                helperText={errors.budgetedSalaryMax?.message as string}
                placeholder={label('Maximum salary', 'الحد الأقصى')}
                inputBackgroundColor={controlBg}
              />
            )}
          />
        </Box>

        {/* Job Description - Full Width */}
        <Box flex='1 1 100%'>
          <Controller
            name='jobDescription'
            control={control}
            rules={{ required: label('Job description is required', 'وصف الوظيفة مطلوب') }}
            render={({ field }) => (
              <AppInputField
                label={label('Job Description', 'وصف الوظيفة')}
                value={field.value}
                onChange={(e: any) => field.onChange(e.target ? e.target.value : e)}
                error={!!errors.jobDescription}
                helperText={errors.jobDescription?.message as string}
                placeholder={label('Provide a detailed job description...', 'قدم وصفًا تفصيليًا للوظيفة...')}
                inputBackgroundColor={controlBg}
                multiline
                rows={4}
              />
            )}
          />
        </Box>

        {/* Key Responsibilities - Full Width */}
        <Box flex='1 1 100%'>
          <Controller
            name='responsibilities'
            control={control}
            rules={{ required: label('Responsibilities are required', 'المسؤوليات مطلوبة') }}
            render={({ field }) => (
              <AppInputField
                label={label('Key Responsibilities', 'المسؤوليات الرئيسية')}
                value={field.value}
                onChange={(e: any) => field.onChange(e.target ? e.target.value : e)}
                error={!!errors.responsibilities}
                helperText={errors.responsibilities?.message as string}
                placeholder={label('List key responsibilities (one per line or comma-separated)...', 'قائمة المسؤوليات الرئيسية (واحد لكل سطر أو مفصول بفواصل)...')}
                inputBackgroundColor={controlBg}
                multiline
                rows={4}
              />
            )}
          />
        </Box>

        {/* Required Skills - Full Width */}
        <Box flex='1 1 100%'>
          <Controller
            name='requiredSkills'
            control={control}
            rules={{ required: label('Required skills are required', 'المهارات المطلوبة مطلوبة') }}
            render={({ field }) => (
              <AppInputField
                label={label('Required Skills', 'المهارات المطلوبة')}
                value={field.value}
                onChange={(e: any) => field.onChange(e.target ? e.target.value : e)}
                error={!!errors.requiredSkills}
                helperText={errors.requiredSkills?.message as string}
                placeholder={label('List required skills (one per line or comma-separated)...', 'قائمة المهارات المطلوبة (واحد لكل سطر أو مفصول بفواصل)...')}
                inputBackgroundColor={controlBg}
                multiline
                rows={3}
              />
            )}
          />
        </Box>

        {/* Required Experience - Full Width (Optional) */}
        <Box flex='1 1 100%'>
          <Controller
            name='requiredExperience'
            control={control}
            render={({ field }) => (
              <AppInputField
                label={label('Required Experience', 'الخبرة المطلوبة')}
                value={field.value}
                onChange={(e: any) => field.onChange(e.target ? e.target.value : e)}
                error={!!errors.requiredExperience}
                helperText={errors.requiredExperience?.message as string}
                placeholder={label('Describe required experience, education, and certifications...', 'وصف الخبرة والتعليم والشهادات المطلوبة...')}
                inputBackgroundColor={controlBg}
                multiline
                rows={3}
              />
            )}
          />
        </Box>

        {/* Justification for Hire - Full Width (Optional) */}
        <Box flex='1 1 100%'>
          <Controller
            name='justificationForHire'
            control={control}
            render={({ field }) => (
              <AppInputField
                label={label('Justification for Hire', 'تبرير التوظيف')}
                value={field.value}
                onChange={(e: any) => field.onChange(e.target ? e.target.value : e)}
                error={!!errors.justificationForHire}
                helperText={errors.justificationForHire?.message as string}
                placeholder={label('Explain why this hire is needed (new role / replacement / expansion)...', 'اشرح سبب الحاجة إلى هذا التوظيف (دور جديد / استبدال / توسع)...')}
                inputBackgroundColor={controlBg}
                multiline
                rows={3}
              />
            )}
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
