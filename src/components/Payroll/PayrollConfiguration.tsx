import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useLanguage } from '../../hooks/useLanguage';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useIsDarkMode } from '../../theme';
import {
  payrollApi,
  type PayrollConfig,
  type Allowance,
} from '../../api/payrollApi';
import { snackbar } from '../../utils/snackbar';

const PayrollConfiguration: React.FC = () => {
  const theme = useTheme();
  const darkMode = useIsDarkMode();

  const { language } = useLanguage();

  const labels = {
    en: {
      title: 'Payroll Configuration',
      createConfig: 'Create Configuration',
      createModalTitle: 'Create Payroll Configuration',
      editModalTitle: 'Edit Payroll Configuration',
      noConfig: 'No payroll configuration found. Please create one.',
      salaryCycle: 'Salary Cycle',
      monthly: 'Monthly',
      weekly: 'Weekly',
      biweekly: 'Bi-weekly',
      basePay: 'Base Pay Components',
      basicLabel: 'Basic',
      houseRentLabel: 'House Rent',
      medicalLabel: 'Medical',
      transportLabel: 'Transport',
      allowances: 'Allowances',
      addAllowance: 'Add Allowance',
      noAllowances: 'No allowances added. Click "Add Allowance" to add one.',
      deductions: 'Deductions',
      overtimePolicy: 'Overtime Policy',
      enableOvertime: 'Enable Overtime',
      rateMultiplier: 'Rate Multiplier',
      maxHours: 'Max Hours Per Month',
      leaveDeductionPolicy: 'Leave Deduction Policy',
      unpaidLeaveDeduction: 'Unpaid Leave Deduction',
      halfDayDeduction: 'Half Day Deduction (%)',
      customFields: 'Custom Fields',
      typeLabel: 'Type',
      amountLabel: 'Amount',
      percentageLabel: 'Percentage (%)',
      placeholderExample: 'e.g., travel, meal, etc.',
      cancel: 'Cancel',
      creating: 'Creating...',
      updating: 'Updating...',
      updateConfig: 'Update Configuration',
      saveSuccessCreated: 'Payroll configuration created successfully',
      saveSuccessUpdated: 'Payroll configuration updated successfully',
      saveFailure: 'Failed to save payroll configuration',
      allowanceLabel: 'Allowance',
      seeMore: 'See More',
      showLess: 'Show Less',
      noCustomFields:
        'No custom fields added. Click "Add Custom Field" to add one.',
      addCustomField: 'Add Custom Field',
      fieldNameLabel: 'Field Name (Key)',
      valueLabel: 'Value',
      textType: 'Text',
      numberType: 'Number',
      enterValuePlaceholder: 'Enter value',
      taxPercentageLabel: 'Tax (%)',
      insurancePercentageLabel: 'Insurance (%)',
      providentFundPercentageLabel: 'Provident Fund (%)',
      customField: 'Custom Field',
      // validation / errors
      errBasicSalary: 'Basic salary must be greater than 0',
      errAllowanceType: 'All allowances must have a type',
      errOvertimeMultiplier: 'Overtime rate multiplier must be greater than 0',
      errMaxOvertimeHours:
        'Max overtime hours per month must be greater than 0',
      errFillAll: 'Please fill all required fields correctly',
    },
    ar: {
      title: 'تكوين الرواتب',
      createConfig: 'إنشاء التكوين',
      createModalTitle: 'إنشاء تكوين الرواتب',
      editModalTitle: 'تعديل تكوين الرواتب',
      noConfig: 'لم يتم العثور على تكوين الرواتب. الرجاء إنشاء واحد.',
      salaryCycle: 'دورة الراتب',
      monthly: 'شهري',
      weekly: 'أسبوعي',
      biweekly: 'نصف شهري',
      basePay: 'مكونات الراتب الأساسي',
      basicLabel: 'الأساسي',
      houseRentLabel: 'بدل السكن',
      medicalLabel: 'بدل طبي',
      transportLabel: 'بدل النقل',
      allowances: 'البدلات',
      addAllowance: 'إضافة بدل',
      noAllowances: 'لم تتم إضافة بدلات. انقر "إضافة بدل" لإضافة واحد.',
      deductions: 'الخصومات',
      overtimePolicy: 'سياسة العمل الإضافي',
      enableOvertime: 'تمكين العمل الإضافي',
      rateMultiplier: 'معدل الضرب',
      maxHours: 'أقصى ساعات في الشهر',
      leaveDeductionPolicy: 'سياسة خصم الإجازة',
      unpaidLeaveDeduction: 'خصم الإجازة غير المدفوعة',
      halfDayDeduction: 'خصم نصف يوم (%)',
      customFields: 'حقول مخصصة',
      typeLabel: 'النوع',
      amountLabel: 'المبلغ',
      percentageLabel: 'النسبة (%)',
      placeholderExample: 'مثل: سفر، وجبة، الخ',
      cancel: 'إلغاء',
      creating: 'جارٍ الإنشاء...',
      updating: 'جارٍ التحديث...',
      updateConfig: 'تحديث التكوين',
      saveSuccessCreated: 'تم إنشاء تكوين الرواتب بنجاح',
      saveSuccessUpdated: 'تم تحديث تكوين الرواتب بنجاح',
      saveFailure: 'فشل في حفظ تكوين الرواتب',
      allowanceLabel: 'بدل',
      seeMore: 'المزيد',
      showLess: 'إظهار أقل',
      noCustomFields: 'لم تتم إضافة حقول مخصصة. انقر "إضافة حقل مخصص" لإضافته.',
      addCustomField: 'إضافة حقل مخصص',
      fieldNameLabel: 'اسم الحقل (المفتاح)',
      valueLabel: 'القيمة',
      textType: 'نص',
      numberType: 'رقم',
      enterValuePlaceholder: 'أدخل القيمة',
      taxPercentageLabel: 'الضريبة (%)',
      insurancePercentageLabel: 'التأمين (%)',
      providentFundPercentageLabel: 'صندوق التقاعد (%)',
      customField: 'حقل مخصص',
      // validation / errors
      errBasicSalary: 'يجب أن تكون قيمة الراتب الأساسي أكبر من 0',
      errAllowanceType: 'يجب أن تحتوي جميع البدلات على نوع',
      errOvertimeMultiplier: 'يجب أن يكون معدل العمل الإضافي أكبر من 0',
      errMaxOvertimeHours:
        'يجب أن تكون أقصى ساعات العمل الإضافي في الشهر أكبر من 0',
      errFillAll: 'يرجى ملء جميع الحقول المطلوبة بشكل صحيح',
    },
  } as const;

  const L = labels[language as 'en' | 'ar'] || labels.en;

  const deductionLabelForKey = (key: string) => {
    switch (key) {
      case 'taxPercentage':
        return L.taxPercentageLabel;
      case 'insurancePercentage':
        return L.insurancePercentageLabel;
      case 'providentFundPercentage':
        return L.providentFundPercentageLabel;
      default:
        return key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase())
          .replace('Percentage', ' (%)');
    }
  };

  const basePayLabelForKey = (key: string) => {
    switch (key) {
      case 'basic':
        return L.basicLabel;
      case 'houseRent':
        return L.houseRentLabel;
      case 'medical':
        return L.medicalLabel;
      case 'transport':
        return L.transportLabel;
      default:
        return (
          key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
        );
    }
  };

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<PayrollConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [showAllAllowances, setShowAllAllowances] = useState(false);

  // Form state for modal
  const [salaryCycle, setSalaryCycle] = useState<
    'monthly' | 'weekly' | 'biweekly'
  >('monthly');
  const [basePayComponents, setBasePayComponents] = useState({
    basic: 0,
    houseRent: 0,
    medical: 0,
    transport: 0,
  });
  const [allowances, setAllowances] = useState<Allowance[]>([]);
  const [deductions, setDeductions] = useState({
    taxPercentage: 0,
    insurancePercentage: 0,
    providentFundPercentage: 0,
  });
  const [overtimePolicy, setOvertimePolicy] = useState({
    enabled: false,
    rateMultiplier: 1.5,
    maxHoursPerMonth: 40,
  });
  const [leaveDeductionPolicy, setLeaveDeductionPolicy] = useState({
    unpaidLeaveDeduction: false,
    halfDayDeduction: 50,
  });
  const [customFields, setCustomFields] = useState<
    Array<{ key: string; value: string; type: 'text' | 'number' }>
  >([]);

  // Load existing configuration
  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true);
      setError(null);
      try {
        const existingConfig = await payrollApi.getConfig();
        if (existingConfig) {
          setConfig(existingConfig);
        }
      } catch (err) {
        console.error('Failed to load payroll config:', err);
        setError('Failed to load payroll configuration');
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  const handleOpenCreateModal = () => {
    // Reset form to defaults for new config
    setSalaryCycle('monthly');
    setBasePayComponents({
      basic: 0,
      houseRent: 0,
      medical: 0,
      transport: 0,
    });
    setAllowances([]);
    setDeductions({
      taxPercentage: 0,
      insurancePercentage: 0,
      providentFundPercentage: 0,
    });
    setOvertimePolicy({
      enabled: false,
      rateMultiplier: 1.5,
      maxHoursPerMonth: 40,
    });
    setLeaveDeductionPolicy({
      unpaidLeaveDeduction: false,
      halfDayDeduction: 50,
    });
    setCustomFields([]);
    setEditModalOpen(true);
  };

  const handleOpenEditModal = () => {
    if (config) {
      setSalaryCycle(config.salaryCycle);
      setBasePayComponents(config.basePayComponents);
      setAllowances(config.allowances || []);
      setDeductions(config.deductions);
      setOvertimePolicy(config.overtimePolicy);
      setLeaveDeductionPolicy(config.leaveDeductionPolicy);
      // Load custom fields if they exist
      const configWithCustomFields = config as PayrollConfig & {
        customFields?: Record<string, unknown>;
      };
      if (configWithCustomFields.customFields) {
        const customFieldsObj = configWithCustomFields.customFields;
        // Convert object to array format
        if (
          typeof customFieldsObj === 'object' &&
          !Array.isArray(customFieldsObj)
        ) {
          const fieldsArray = Object.entries(customFieldsObj).map(
            ([key, value]) => ({
              key,
              value: String(value),
              type:
                typeof value === 'number'
                  ? ('number' as const)
                  : ('text' as const),
            })
          );
          setCustomFields(fieldsArray);
        } else if (Array.isArray(customFieldsObj)) {
          setCustomFields(customFieldsObj);
        } else {
          setCustomFields([]);
        }
      } else {
        setCustomFields([]);
      }
    }
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setError(null);
  };

  const handleBasePayChange = (
    field: keyof typeof basePayComponents,
    value: number | ''
  ) => {
    setBasePayComponents(prev => ({
      ...prev,
      [field]: value === '' ? 0 : value,
    }));
  };

  const handleAllowanceChange = (
    index: number,
    field: keyof Allowance,
    value: string | number | ''
  ) => {
    setAllowances(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value === '' ? 0 : value } : item
      )
    );
  };

  const handleAddAllowance = () => {
    setAllowances(prev => [
      ...prev,
      { type: '', amount: 0, percentage: 0, description: '' },
    ]);
  };

  const handleRemoveAllowance = (index: number) => {
    setAllowances(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddCustomField = () => {
    setCustomFields(prev => [...prev, { key: '', value: '', type: 'text' }]);
  };

  const handleRemoveCustomField = (index: number) => {
    setCustomFields(prev => prev.filter((_, i) => i !== index));
  };

  const handleCustomFieldChange = (
    index: number,
    field: 'key' | 'value' | 'type',
    value: string
  ) => {
    setCustomFields(prev =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleDeductionChange = (
    field: keyof typeof deductions,
    value: number | ''
  ) => {
    setDeductions(prev => ({
      ...prev,
      [field]: value === '' ? 0 : value,
    }));
  };

  const handleOvertimeChange = (
    field: keyof typeof overtimePolicy,
    value: boolean | number | ''
  ) => {
    setOvertimePolicy(prev => ({
      ...prev,
      [field]: value === '' ? 0 : value,
    }));
  };

  const handleLeaveDeductionChange = (
    field: keyof typeof leaveDeductionPolicy,
    value: boolean | number | ''
  ) => {
    setLeaveDeductionPolicy(prev => ({
      ...prev,
      [field]: value === '' ? 0 : value,
    }));
  };

  const isFormValid = useCallback((): boolean => {
    // Check base pay components
    if (basePayComponents.basic <= 0) {
      return false;
    }
    if (basePayComponents.houseRent < 0) {
      return false;
    }
    if (basePayComponents.medical < 0) {
      return false;
    }
    if (basePayComponents.transport < 0) {
      return false;
    }

    // Check allowances - all must have type, amount >= 0, percentage >= 0
    for (const allowance of allowances) {
      if (!allowance.type || allowance.type.trim() === '') {
        return false;
      }
      if (allowance.amount < 0) {
        return false;
      }
      if (allowance.percentage < 0) {
        return false;
      }
    }

    // Check deductions - all must be >= 0
    if (deductions.taxPercentage < 0) {
      return false;
    }
    if (deductions.insurancePercentage < 0) {
      return false;
    }
    if (deductions.providentFundPercentage < 0) {
      return false;
    }

    // Check overtime policy if enabled
    if (overtimePolicy.enabled) {
      if (overtimePolicy.rateMultiplier <= 0) {
        return false;
      }
      if (overtimePolicy.maxHoursPerMonth <= 0) {
        return false;
      }
    }

    // Check leave deduction policy
    if (leaveDeductionPolicy.halfDayDeduction < 0) {
      return false;
    }

    return true;
  }, [
    basePayComponents,
    allowances,
    deductions,
    overtimePolicy,
    leaveDeductionPolicy,
  ]);

  const validateForm = (): boolean => {
    if (!isFormValid()) {
      if (basePayComponents.basic <= 0) {
        setError(L.errBasicSalary);
      } else if (allowances.some(a => !a.type.trim())) {
        setError(L.errAllowanceType);
      } else if (overtimePolicy.enabled && overtimePolicy.rateMultiplier <= 0) {
        setError(L.errOvertimeMultiplier);
      } else if (
        overtimePolicy.enabled &&
        overtimePolicy.maxHoursPerMonth <= 0
      ) {
        setError(L.errMaxOvertimeHours);
      } else {
        setError(L.errFillAll);
      }
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      interface PayloadType {
        salaryCycle: 'monthly' | 'weekly' | 'biweekly';
        basePayComponents: {
          basic: number;
          houseRent: number;
          medical: number;
          transport: number;
        };
        allowances: Array<{
          type: string;
          amount: number;
          percentage: number;
          description?: string;
        }>;
        deductions: {
          taxPercentage: number;
          insurancePercentage: number;
          providentFundPercentage: number;
        };
        overtimePolicy: {
          enabled: boolean;
          rateMultiplier: number;
          maxHoursPerMonth: number;
        };
        leaveDeductionPolicy: {
          unpaidLeaveDeduction: boolean;
          halfDayDeduction: number;
        };
        customFields?: Record<string, string | number>;
      }

      const payload: PayloadType = {
        salaryCycle: salaryCycle as 'monthly' | 'weekly' | 'biweekly',
        basePayComponents,
        allowances,
        deductions,
        overtimePolicy,
        leaveDeductionPolicy,
      };

      // Add custom fields if any exist
      if (customFields.length > 0) {
        const validCustomFields = customFields.filter(
          field => field.key.trim() !== ''
        );
        if (validCustomFields.length > 0) {
          payload.customFields = validCustomFields.reduce(
            (acc, field) => {
              const value =
                field.type === 'number'
                  ? parseFloat(field.value) || 0
                  : field.value;
              acc[field.key] = value;
              return acc;
            },
            {} as Record<string, string | number>
          );
        }
      }

      let savedConfig: PayrollConfig;
      if (config) {
        savedConfig = await payrollApi.updateConfig(payload);
      } else {
        savedConfig = await payrollApi.createConfig(payload);
      }

      setConfig(savedConfig);
      snackbar.success(config ? L.saveSuccessUpdated : L.saveSuccessCreated);
      handleCloseEditModal();
    } catch (err) {
      console.error('Failed to save payroll config:', err);
      const errorMessage =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message || 'Failed to save payroll configuration'
          : 'Failed to save payroll configuration';
      setError(errorMessage);
      snackbar.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value}%`;
  };

  // Check if form has changes
  const hasChanges = useCallback(() => {
    if (!config) return true; // New config, always has changes

    // Check salary cycle
    if (config.salaryCycle !== salaryCycle) return true;

    // Check base pay components
    if (
      config.basePayComponents.basic !== basePayComponents.basic ||
      config.basePayComponents.houseRent !== basePayComponents.houseRent ||
      config.basePayComponents.medical !== basePayComponents.medical ||
      config.basePayComponents.transport !== basePayComponents.transport
    )
      return true;

    // Check allowances
    if (JSON.stringify(config.allowances || []) !== JSON.stringify(allowances))
      return true;

    if (
      config.deductions.taxPercentage !== deductions.taxPercentage ||
      config.deductions.insurancePercentage !==
        deductions.insurancePercentage ||
      config.deductions.providentFundPercentage !==
        deductions.providentFundPercentage
    )
      return true;

    if (
      config.overtimePolicy.enabled !== overtimePolicy.enabled ||
      config.overtimePolicy.rateMultiplier !== overtimePolicy.rateMultiplier ||
      config.overtimePolicy.maxHoursPerMonth !== overtimePolicy.maxHoursPerMonth
    )
      return true;

    // Check leave deduction policy
    if (
      config.leaveDeductionPolicy.unpaidLeaveDeduction !==
        leaveDeductionPolicy.unpaidLeaveDeduction ||
      config.leaveDeductionPolicy.halfDayDeduction !==
        leaveDeductionPolicy.halfDayDeduction
    )
      return true;

    // Check custom fields
    const configWithCustomFields = config as PayrollConfig & {
      customFields?: Record<string, unknown>;
    };
    const configCustomFields = configWithCustomFields.customFields || {};
    const currentCustomFieldsObj = customFields
      .filter(field => field.key.trim() !== '')
      .reduce(
        (acc, field) => {
          const value =
            field.type === 'number'
              ? parseFloat(field.value) || 0
              : field.value;
          acc[field.key] = value;
          return acc;
        },
        {} as Record<string, string | number>
      );
    if (
      JSON.stringify(configCustomFields) !==
      JSON.stringify(currentCustomFieldsObj)
    )
      return true;

    return false;
  }, [
    config,
    salaryCycle,
    basePayComponents,
    allowances,
    deductions,
    overtimePolicy,
    leaveDeductionPolicy,
    customFields,
  ]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!config) {
    return (
      <Box>
        <Box
          sx={{
            mb: 4,
            display: 'flex',
            flexDirection: {
              xs: 'column',
              sm: language === 'ar' ? 'row-reverse' : 'row',
            },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: { xs: 1, sm: 0 },
          }}
        >
          <Typography
            variant='h4'
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            sx={{
              fontWeight: 600,
              color: darkMode ? '#fff' : '#000',
              mb: 1,
              textAlign: language === 'ar' ? 'right' : 'left',
            }}
          >
            {L.title}
          </Typography>
          <Box dir='ltr'>
            <Button
              onClick={handleOpenCreateModal}
              variant='contained'
              startIcon={<AddIcon />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                px: 2,
                py: 1,
              }}
            >
              {L.createConfig}
            </Button>
          </Box>
        </Box>
        <Paper
          sx={{
            p: 4,
            backgroundColor: darkMode ? '#1a1a1a' : '#fff',
            color: darkMode ? '#fff' : '#000',
            boxShadow: 'none',
          }}
        >
          <Typography
            variant='body1'
            sx={{ textAlign: 'center', color: darkMode ? '#8f8f8f' : '#666' }}
          >
            {L.noConfig}
          </Typography>
        </Paper>

        <Dialog
          open={editModalOpen}
          onClose={handleCloseEditModal}
          maxWidth='md'
          fullWidth
          PaperProps={{
            sx: { borderRadius: 1, bgcolor: darkMode ? '#1e1e1e' : '#fff' },
          }}
        >
          <DialogTitle
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexDirection: language === 'ar' ? 'row-reverse' : 'row',
              color: darkMode ? '#fff' : '#000',
              borderRadius: 0,
              pb: 2,
              textAlign: language === 'ar' ? 'right' : 'left',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                order: language === 'ar' ? 2 : 1,
              }}
            >
              <AddIcon /> {L.createModalTitle}
            </Box>
            <IconButton
              onClick={handleCloseEditModal}
              size='small'
              sx={{
                order: language === 'ar' ? 1 : 2,
                color: theme.palette.text.secondary,
                '&:hover': {
                  color: theme.palette.text.primary,
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent
            sx={{
              pt: 3,
              maxHeight: '70vh',
              overflowY: 'auto',
              direction: 'ltr',
            }}
          >
            {error && (
              <Alert
                severity='error'
                sx={{ mb: 2 }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                marginTop: 2,
              }}
            >
              <FormControl fullWidth>
                <InputLabel
                  sx={{
                    color: darkMode ? '#ccc' : undefined,
                  }}
                >
                  {L.salaryCycle}
                </InputLabel>
                <Select
                  value={salaryCycle}
                  onChange={e =>
                    setSalaryCycle(
                      e.target.value as 'monthly' | 'weekly' | 'biweekly'
                    )
                  }
                  label={L.salaryCycle}
                  sx={{
                    backgroundColor: darkMode ? '#2d2d2d' : '#fff',
                    color: darkMode ? '#fff' : '#000',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.divider,
                    },
                  }}
                >
                  <MenuItem value='monthly'>{L.monthly}</MenuItem>
                  <MenuItem value='weekly'>{L.weekly}</MenuItem>
                </Select>
              </FormControl>

              <Box>
                <Typography
                  variant='h6'
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                  sx={{
                    mb: 2,
                    fontWeight: 600,
                    color: darkMode ? '#fff' : '#000',
                    textAlign: language === 'ar' ? 'right' : 'left',
                  }}
                >
                  {L.basePay}
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(2, 1fr)',
                      md: 'repeat(4, 1fr)',
                    },
                    gap: 2,
                  }}
                >
                  {Object.entries(basePayComponents).map(([key, value]) => (
                    <TextField
                      key={key}
                      fullWidth
                      label={basePayLabelForKey(key)}
                      type='number'
                      inputProps={{ min: 0 }}
                      value={value === 0 ? '' : value}
                      onChange={e => {
                        const inputValue = e.target.value;
                        const numValue =
                          inputValue === ''
                            ? ''
                            : Math.max(0, parseFloat(inputValue) || 0);
                        handleBasePayChange(
                          key as keyof typeof basePayComponents,
                          numValue
                        );
                      }}
                      InputLabelProps={{
                        sx: { color: darkMode ? '#ccc' : undefined },
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: darkMode ? '#2d2d2d' : '#fff',
                          color: darkMode ? '#fff' : '#000',
                          '& fieldset': {
                            borderColor: theme.palette.divider,
                          },
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>

              <Box>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: {
                      xs: 'column',
                      sm: language === 'ar' ? 'row-reverse' : 'row',
                    },
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                    gap: { xs: 1, sm: 0 },
                  }}
                >
                  <Typography
                    variant='h6'
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                    sx={{
                      fontWeight: 600,
                      color: darkMode ? '#fff' : '#000',
                      textAlign: language === 'ar' ? 'right' : 'left',
                    }}
                  >
                    {L.allowances}
                  </Typography>
                  <Box dir='ltr'>
                    <Button
                      variant='outlined'
                      size='small'
                      startIcon={<AddIcon />}
                      onClick={handleAddAllowance}
                      sx={{
                        textTransform: 'none',
                        borderColor: theme.palette.divider,
                        color: darkMode ? '#fff' : '#000',
                      }}
                    >
                      {L.addAllowance}
                    </Button>
                  </Box>
                </Box>
                {allowances.length === 0 ? (
                  <Typography
                    variant='body2'
                    sx={{
                      color: darkMode ? '#8f8f8f' : '#666',
                      fontStyle: 'italic',
                    }}
                  >
                    {L.noAllowances}
                  </Typography>
                ) : (
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                  >
                    {allowances.map((allowance, index) => (
                      <Box
                        key={index}
                        sx={{
                          p: 2,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 1,
                          backgroundColor: darkMode ? '#2d2d2d' : '#f9f9f9',
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            mb: 2,
                          }}
                        >
                          <Typography
                            variant='subtitle2'
                            sx={{
                              color: darkMode ? '#fff' : '#000',
                              fontWeight: 600,
                            }}
                          >
                            {L.allowanceLabel} {index + 1}
                          </Typography>
                          <IconButton
                            size='small'
                            onClick={() => handleRemoveAllowance(index)}
                            sx={{
                              color: theme.palette.error.main,
                            }}
                          >
                            <DeleteIcon fontSize='small' />
                          </IconButton>
                        </Box>
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                              xs: '1fr',
                              sm: 'repeat(3, 1fr)',
                            },
                            gap: 2,
                          }}
                        >
                          <TextField
                            fullWidth
                            label={L.typeLabel}
                            value={allowance.type}
                            onChange={e =>
                              handleAllowanceChange(
                                index,
                                'type',
                                e.target.value
                              )
                            }
                            placeholder={L.placeholderExample}
                            InputLabelProps={{
                              sx: { color: darkMode ? '#ccc' : undefined },
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: darkMode ? '#1a1a1a' : '#fff',
                                color: darkMode ? '#fff' : '#000',
                                '& fieldset': {
                                  borderColor: theme.palette.divider,
                                },
                              },
                            }}
                          />
                          <TextField
                            fullWidth
                            label={L.amountLabel}
                            type='number'
                            inputProps={{ min: 0 }}
                            value={
                              allowance.amount === 0 ? '' : allowance.amount
                            }
                            onChange={e => {
                              const value = e.target.value;
                              const numValue =
                                value === ''
                                  ? ''
                                  : Math.max(0, parseFloat(value) || 0);
                              handleAllowanceChange(index, 'amount', numValue);
                            }}
                            InputLabelProps={{
                              sx: { color: darkMode ? '#ccc' : undefined },
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: darkMode ? '#1a1a1a' : '#fff',
                                color: darkMode ? '#fff' : '#000',
                                '& fieldset': {
                                  borderColor: theme.palette.divider,
                                },
                              },
                            }}
                          />
                          <TextField
                            fullWidth
                            label={L.percentageLabel}
                            type='number'
                            inputProps={{ min: 0 }}
                            value={
                              allowance.percentage === 0
                                ? ''
                                : allowance.percentage
                            }
                            onChange={e => {
                              const value = e.target.value;
                              const numValue =
                                value === ''
                                  ? ''
                                  : Math.max(0, parseFloat(value) || 0);
                              handleAllowanceChange(
                                index,
                                'percentage',
                                numValue
                              );
                            }}
                            InputLabelProps={{
                              sx: { color: darkMode ? '#ccc' : undefined },
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: darkMode ? '#1a1a1a' : '#fff',
                                color: darkMode ? '#fff' : '#000',
                                '& fieldset': {
                                  borderColor: theme.palette.divider,
                                },
                              },
                            }}
                          />
                        </Box>
                        <TextField
                          fullWidth
                          label='Description'
                          value={allowance.description || ''}
                          onChange={e =>
                            handleAllowanceChange(
                              index,
                              'description',
                              e.target.value
                            )
                          }
                          placeholder='Optional description'
                          multiline
                          rows={2}
                          InputLabelProps={{
                            sx: { color: darkMode ? '#ccc' : undefined },
                          }}
                          sx={{
                            mt: 2,
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: darkMode ? '#1a1a1a' : '#fff',
                              color: darkMode ? '#fff' : '#000',
                              '& fieldset': {
                                borderColor: theme.palette.divider,
                              },
                            },
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>

              <Box>
                <Typography
                  variant='h6'
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                  sx={{
                    mb: 2,
                    fontWeight: 600,
                    color: darkMode ? '#fff' : '#000',
                    textAlign: language === 'ar' ? 'right' : 'left',
                  }}
                >
                  {L.deductions}
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                    gap: 2,
                  }}
                >
                  {Object.entries(deductions).map(([key, value]) => (
                    <TextField
                      key={key}
                      fullWidth
                      label={deductionLabelForKey(key)}
                      type='number'
                      inputProps={{ min: 0 }}
                      value={value === 0 ? '' : value}
                      onChange={e => {
                        const inputValue = e.target.value;
                        const numValue =
                          inputValue === ''
                            ? ''
                            : Math.max(0, parseFloat(inputValue) || 0);
                        handleDeductionChange(
                          key as keyof typeof deductions,
                          numValue
                        );
                      }}
                      InputLabelProps={{
                        sx: { color: darkMode ? '#ccc' : undefined },
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: darkMode ? '#2d2d2d' : '#fff',
                          color: darkMode ? '#fff' : '#000',
                          '& fieldset': {
                            borderColor: theme.palette.divider,
                          },
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>

              <Box>
                <Typography
                  variant='h6'
                  sx={{
                    mb: 2,
                    fontWeight: 600,
                    color: darkMode ? '#fff' : '#000',
                  }}
                >
                  {L.overtimePolicy}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={overtimePolicy.enabled}
                        onChange={e =>
                          handleOvertimeChange('enabled', e.target.checked)
                        }
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: theme.palette.primary.main,
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':
                            {
                              backgroundColor: theme.palette.primary.main,
                            },
                        }}
                      />
                    }
                    label={L.enableOvertime}
                    sx={{ color: darkMode ? '#fff' : '#000' }}
                  />
                  {overtimePolicy.enabled && (
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: '1fr',
                          sm: 'repeat(2, 1fr)',
                        },
                        gap: 2,
                      }}
                    >
                      <TextField
                        fullWidth
                        label={L.rateMultiplier}
                        type='number'
                        inputProps={{ min: 0 }}
                        value={
                          overtimePolicy.rateMultiplier === 0
                            ? ''
                            : overtimePolicy.rateMultiplier
                        }
                        onChange={e => {
                          const value = e.target.value;
                          const numValue =
                            value === ''
                              ? ''
                              : Math.max(0, parseFloat(value) || 0);
                          handleOvertimeChange('rateMultiplier', numValue);
                        }}
                        InputLabelProps={{
                          sx: { color: darkMode ? '#ccc' : undefined },
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: darkMode ? '#2d2d2d' : '#fff',
                            color: darkMode ? '#fff' : '#000',
                            '& fieldset': {
                              borderColor: theme.palette.divider,
                            },
                          },
                        }}
                      />
                      <TextField
                        fullWidth
                        label={L.maxHours}
                        type='number'
                        inputProps={{ min: 0 }}
                        value={
                          overtimePolicy.maxHoursPerMonth === 0
                            ? ''
                            : overtimePolicy.maxHoursPerMonth
                        }
                        onChange={e => {
                          const value = e.target.value;
                          const numValue =
                            value === ''
                              ? ''
                              : Math.max(0, parseInt(value) || 0);
                          handleOvertimeChange('maxHoursPerMonth', numValue);
                        }}
                        InputLabelProps={{
                          sx: { color: darkMode ? '#ccc' : undefined },
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: darkMode ? '#2d2d2d' : '#fff',
                            color: darkMode ? '#fff' : '#000',
                            '& fieldset': {
                              borderColor: theme.palette.divider,
                            },
                          },
                        }}
                      />
                    </Box>
                  )}
                </Box>
              </Box>

              <Box>
                <Typography
                  variant='h6'
                  sx={{
                    mb: 2,
                    fontWeight: 600,
                    color: darkMode ? '#fff' : '#000',
                  }}
                >
                  {L.leaveDeductionPolicy}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={leaveDeductionPolicy.unpaidLeaveDeduction}
                        onChange={e =>
                          handleLeaveDeductionChange(
                            'unpaidLeaveDeduction',
                            e.target.checked
                          )
                        }
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: theme.palette.primary.main,
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':
                            {
                              backgroundColor: theme.palette.primary.main,
                            },
                        }}
                      />
                    }
                    label={L.unpaidLeaveDeduction}
                    sx={{ color: darkMode ? '#fff' : '#000' }}
                  />
                  <TextField
                    fullWidth
                    label={L.halfDayDeduction}
                    type='number'
                    inputProps={{ min: 0 }}
                    value={
                      leaveDeductionPolicy.halfDayDeduction === 0
                        ? ''
                        : leaveDeductionPolicy.halfDayDeduction
                    }
                    onChange={e => {
                      const value = e.target.value;
                      const numValue =
                        value === '' ? '' : Math.max(0, parseFloat(value) || 0);
                      handleLeaveDeductionChange('halfDayDeduction', numValue);
                    }}
                    sx={{
                      maxWidth: 400,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: darkMode ? '#2d2d2d' : '#fff',
                        color: darkMode ? '#fff' : '#000',
                      },
                    }}
                    InputLabelProps={{
                      sx: { color: darkMode ? '#ccc' : undefined },
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions
            sx={{
              p: 3,
              pt: 1,
              justifyContent: language === 'ar' ? 'flex-start' : 'flex-end',
            }}
          >
            <Button
              onClick={handleCloseEditModal}
              variant='outlined'
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                mr: language === 'ar' ? 1 : 0,
              }}
            >
              {L.cancel}
            </Button>
            <Button
              onClick={handleSave}
              variant='contained'
              startIcon={saving ? <CircularProgress size={16} /> : <AddIcon />}
              disabled={saving || !isFormValid()}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                ml: language === 'ar' ? 0 : 1,
              }}
            >
              {saving ? L.creating : L.createConfig}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.default,
        minHeight: '100vh',
      }}
    >
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          flexDirection: {
            xs: 'column',
            sm: language === 'ar' ? 'row-reverse' : 'row',
          },
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: { xs: 1, sm: 0 },
        }}
      >
        <Typography
          variant='h4'
          dir={language === 'ar' ? 'rtl' : 'ltr'}
          sx={{
            fontWeight: 600,
            color: darkMode ? '#fff' : '#000',
            mb: 1,
            textAlign: language === 'ar' ? 'right' : 'left',
          }}
        >
          {L.title}
        </Typography>
        <Box dir='ltr'>
          <Button
            onClick={handleOpenEditModal}
            variant='outlined'
            startIcon={<EditIcon />}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              px: 2,
              py: 1,
              color: theme.palette.text.primary,
              '&:hover': {
                borderColor: theme.palette.primary.main,
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            {L.updateConfig}
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          p: 3,
          backgroundColor: darkMode ? '#1a1a1a' : '#fff',
          borderRadius: 1,
        }}
      >
        <Paper
          sx={{
            p: 3,
            backgroundColor: darkMode ? '#1a1a1a' : '#fff',
            boxShadow: 'none',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
          }}
        >
          <Typography
            variant='h6'
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            sx={{
              mb: 2,
              fontWeight: 600,
              color: darkMode ? '#fff' : '#000',
              textAlign: language === 'ar' ? 'right' : 'left',
            }}
          >
            {L.salaryCycle}
          </Typography>
          <Typography
            variant='body1'
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            sx={{
              color: darkMode ? '#fff' : '#000',
              textTransform: 'capitalize',
              fontSize: '16px',
              textAlign: language === 'ar' ? 'right' : 'left',
            }}
          >
            {config.salaryCycle === 'monthly'
              ? L.monthly
              : config.salaryCycle === 'weekly'
                ? L.weekly
                : L.biweekly}
          </Typography>
        </Paper>

        <Paper
          sx={{
            p: 3,
            backgroundColor: darkMode ? '#1a1a1a' : '#fff',
            boxShadow: 'none',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
          }}
        >
          <Typography
            variant='h6'
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            sx={{
              mb: 2,
              fontWeight: 600,
              color: darkMode ? '#fff' : '#000',
              textAlign: language === 'ar' ? 'right' : 'left',
            }}
          >
            {L.basePay}
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)',
              },
              gap: 2,
            }}
          >
            {Object.entries(config.basePayComponents).map(([key, value]) => (
              <Box key={key}>
                <Typography
                  variant='body2'
                  sx={{
                    color: darkMode ? '#8f8f8f' : '#666',
                    mb: 0.5,
                    fontSize: '12px',
                  }}
                >
                  {basePayLabelForKey(key)}
                </Typography>
                <Typography
                  variant='body1'
                  sx={{
                    color: darkMode ? '#fff' : '#000',
                    fontWeight: 500,
                    fontSize: '16px',
                  }}
                >
                  {formatCurrency(value)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        <Paper
          sx={{
            p: 3,
            backgroundColor: darkMode ? '#1a1a1a' : '#fff',
            boxShadow: 'none',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
          }}
        >
          <Typography
            variant='h6'
            sx={{
              mb: 2,
              fontWeight: 600,
              color: darkMode ? '#fff' : '#000',
            }}
          >
            {L.allowances}
          </Typography>
          {config.allowances && config.allowances.length > 0 ? (
            <>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                  },
                  gap: 2,
                  mb:
                    (config.allowances || []).length > 6 && !showAllAllowances
                      ? 2
                      : 0,
                }}
              >
                {(showAllAllowances
                  ? config.allowances
                  : config.allowances.slice(0, 6)
                ).map((allowance, index) => (
                  <Paper
                    key={index}
                    sx={{
                      p: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 2,
                      backgroundColor: darkMode ? '#2d2d2d' : '#f9f9f9',
                      boxShadow: 'none',
                      flexGrow: 1,
                    }}
                  >
                    <Typography
                      variant='subtitle2'
                      sx={{
                        color: darkMode ? '#fff' : '#000',
                        fontWeight: 600,
                        mb: 1.5,
                      }}
                    >
                      {allowance.type || `${L.allowanceLabel} ${index + 1}`}
                    </Typography>
                    <Box
                      sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                    >
                      <Box>
                        <Typography
                          variant='body2'
                          sx={{
                            color: darkMode ? '#8f8f8f' : '#666',
                            mb: 0.5,
                            fontSize: '12px',
                          }}
                        >
                          {L.amountLabel}
                        </Typography>
                        <Typography
                          variant='body1'
                          sx={{
                            color: darkMode ? '#fff' : '#000',
                            fontWeight: 500,
                          }}
                        >
                          {formatCurrency(allowance.amount)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant='body2'
                          sx={{
                            color: darkMode ? '#8f8f8f' : '#666',
                            mb: 0.5,
                            fontSize: '12px',
                          }}
                        >
                          {L.percentageLabel}
                        </Typography>
                        <Typography
                          variant='body1'
                          sx={{
                            color: darkMode ? '#fff' : '#000',
                            fontWeight: 500,
                          }}
                        >
                          {formatPercentage(allowance.percentage)}
                        </Typography>
                      </Box>
                      {allowance.description && (
                        <Box>
                          <Typography
                            variant='body2'
                            sx={{
                              color: darkMode ? '#8f8f8f' : '#666',
                              mb: 0.5,
                              fontSize: '12px',
                            }}
                          >
                            Description
                          </Typography>
                          <Typography
                            variant='body1'
                            sx={{
                              color: darkMode ? '#fff' : '#000',
                              fontStyle: 'italic',
                            }}
                          >
                            {allowance.description}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                ))}
              </Box>
              {(config.allowances || []).length > 6 && !showAllAllowances && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button
                    variant='outlined'
                    onClick={() => setShowAllAllowances(true)}
                    sx={{
                      textTransform: 'none',
                      borderColor: theme.palette.divider,
                      color: darkMode ? '#fff' : '#000',
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                        backgroundColor: theme.palette.action.hover,
                      },
                    }}
                  >
                    {L.seeMore} ({(config.allowances || []).length - 6} more)
                  </Button>
                </Box>
              )}
              {showAllAllowances && (config.allowances || []).length > 6 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button
                    variant='outlined'
                    onClick={() => setShowAllAllowances(false)}
                    sx={{
                      textTransform: 'none',
                      borderColor: theme.palette.divider,
                      color: darkMode ? '#fff' : '#000',
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                        backgroundColor: theme.palette.action.hover,
                      },
                    }}
                  >
                    Show Less
                  </Button>
                </Box>
              )}
            </>
          ) : (
            <Typography
              variant='body2'
              sx={{
                color: darkMode ? '#8f8f8f' : '#666',
                fontStyle: 'italic',
              }}
            >
              {L.noAllowances}
            </Typography>
          )}
        </Paper>

        <Paper
          sx={{
            p: 3,
            backgroundColor: darkMode ? '#1a1a1a' : '#fff',
            boxShadow: 'none',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
          }}
        >
          <Typography
            variant='h6'
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            sx={{
              mb: 2,
              fontWeight: 600,
              color: darkMode ? '#fff' : '#000',
              textAlign: language === 'ar' ? 'right' : 'left',
            }}
          >
            {L.deductions}
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              gap: 2,
            }}
          >
            {Object.entries(config.deductions).map(([key, value]) => (
              <Box key={key}>
                <Typography
                  variant='body2'
                  sx={{
                    color: darkMode ? '#8f8f8f' : '#666',
                    mb: 0.5,
                    fontSize: '12px',
                  }}
                >
                  {deductionLabelForKey(key)}
                </Typography>
                <Typography
                  variant='body1'
                  sx={{
                    color: darkMode ? '#fff' : '#000',
                    fontWeight: 500,
                    fontSize: '16px',
                  }}
                >
                  {formatPercentage(value)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 3,
          }}
        >
          <Paper
            sx={{
              p: 3,
              backgroundColor: darkMode ? '#1a1a1a' : '#fff',
              boxShadow: 'none',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
            }}
          >
            <Typography
              variant='h6'
              sx={{
                mb: 2,
                fontWeight: 600,
                color: darkMode ? '#fff' : '#000',
              }}
            >
              {L.overtimePolicy}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.overtimePolicy.enabled}
                    disabled
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: theme.palette.primary.main,
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':
                        {
                          backgroundColor: theme.palette.primary.main,
                        },
                    }}
                  />
                }
                label={L.enableOvertime}
                sx={{ color: darkMode ? '#fff' : '#000' }}
              />
              {config.overtimePolicy.enabled && (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography
                      variant='body2'
                      sx={{
                        color: darkMode ? '#8f8f8f' : '#666',
                        mb: 0.5,
                        fontSize: '12px',
                      }}
                    >
                      {L.rateMultiplier}
                    </Typography>
                    <Typography
                      variant='body1'
                      sx={{
                        color: darkMode ? '#fff' : '#000',
                        fontWeight: 500,
                        fontSize: '16px',
                      }}
                    >
                      {config.overtimePolicy.rateMultiplier}x
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant='body2'
                      sx={{
                        color: darkMode ? '#8f8f8f' : '#666',
                        mb: 0.5,
                        fontSize: '12px',
                      }}
                    >
                      {L.maxHours}
                    </Typography>
                    <Typography
                      variant='body1'
                      sx={{
                        color: darkMode ? '#fff' : '#000',
                        fontWeight: 500,
                        fontSize: '16px',
                      }}
                    >
                      {config.overtimePolicy.maxHoursPerMonth} hours
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>

          <Paper
            sx={{
              p: 3,
              backgroundColor: darkMode ? '#1a1a1a' : '#fff',
              boxShadow: 'none',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
            }}
          >
            <Typography
              variant='h6'
              sx={{
                mb: 2,
                fontWeight: 600,
                color: darkMode ? '#fff' : '#000',
              }}
            >
              {L.leaveDeductionPolicy}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.leaveDeductionPolicy.unpaidLeaveDeduction}
                    disabled
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: theme.palette.primary.main,
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':
                        {
                          backgroundColor: theme.palette.primary.main,
                        },
                    }}
                  />
                }
                label={L.unpaidLeaveDeduction}
                sx={{ color: darkMode ? '#fff' : '#000' }}
              />
              <Box>
                <Typography
                  variant='body2'
                  sx={{
                    color: darkMode ? '#8f8f8f' : '#666',
                    mb: 0.5,
                    fontSize: '12px',
                  }}
                >
                  {L.halfDayDeduction}
                </Typography>
                <Typography
                  variant='body1'
                  sx={{
                    color: darkMode ? '#fff' : '#000',
                    fontWeight: 500,
                    fontSize: '16px',
                  }}
                >
                  {formatPercentage(
                    config.leaveDeductionPolicy.halfDayDeduction
                  )}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>

      <Dialog
        open={editModalOpen}
        onClose={handleCloseEditModal}
        maxWidth='md'
        fullWidth
        PaperProps={{
          sx: { borderRadius: 1, bgcolor: darkMode ? '#1e1e1e' : '#fff' },
        }}
      >
        <DialogTitle
          dir={language === 'ar' ? 'rtl' : 'ltr'}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexDirection: language === 'ar' ? 'row-reverse' : 'row',
            color: darkMode ? '#fff' : '#000',
            borderRadius: 0,
            pb: 2,
            textAlign: language === 'ar' ? 'right' : 'left',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              order: language === 'ar' ? 2 : 1,
            }}
          >
            {L.editModalTitle}
          </Box>
          <IconButton
            onClick={handleCloseEditModal}
            size='small'
            sx={{
              order: language === 'ar' ? 1 : 2,
              color: theme.palette.text.secondary,
              '&:hover': {
                color: theme.palette.text.primary,
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{ pt: 3, maxHeight: '70vh', overflowY: 'auto', direction: 'ltr' }}
        >
          {error && (
            <Alert
              severity='error'
              sx={{ mb: 2 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              marginTop: 2,
            }}
          >
            <FormControl fullWidth>
              <InputLabel
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                sx={{
                  color: darkMode ? '#ccc' : undefined,
                  textAlign: language === 'ar' ? 'right' : 'left',
                }}
              >
                {L.salaryCycle}
              </InputLabel>
              <Select
                value={salaryCycle}
                onChange={e =>
                  setSalaryCycle(
                    e.target.value as 'monthly' | 'weekly' | 'biweekly'
                  )
                }
                label={L.salaryCycle}
                sx={{
                  backgroundColor: darkMode ? '#2d2d2d' : '#fff',
                  color: darkMode ? '#fff' : '#000',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.divider,
                  },
                }}
              >
                <MenuItem value='monthly'>{L.monthly}</MenuItem>
                <MenuItem value='weekly'>{L.weekly}</MenuItem>
              </Select>
            </FormControl>

            <Box>
              <Typography
                variant='h6'
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                sx={{
                  mb: 2,
                  fontWeight: 600,
                  color: darkMode ? '#fff' : '#000',
                  textAlign: language === 'ar' ? 'right' : 'left',
                }}
              >
                {L.basePay}
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(4, 1fr)',
                  },
                  gap: 2,
                }}
              >
                {Object.entries(basePayComponents).map(([key, value]) => (
                  <TextField
                    key={key}
                    fullWidth
                    label={basePayLabelForKey(key)}
                    type='number'
                    inputProps={{ min: 0 }}
                    value={value}
                    onChange={e => {
                      const numValue = Math.max(
                        0,
                        parseFloat(e.target.value) || 0
                      );
                      handleBasePayChange(
                        key as keyof typeof basePayComponents,
                        numValue
                      );
                    }}
                    InputLabelProps={{
                      sx: { color: darkMode ? '#ccc' : undefined },
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: darkMode ? '#2d2d2d' : '#fff',
                        color: darkMode ? '#fff' : '#000',
                        '& fieldset': {
                          borderColor: theme.palette.divider,
                        },
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>

            <Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: {
                      xs: 'column',
                      sm: language === 'ar' ? 'row-reverse' : 'row',
                    },
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: { xs: 1, sm: 0 },
                  }}
                >
                  <Typography
                    variant='h6'
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                    sx={{
                      fontWeight: 600,
                      color: darkMode ? '#fff' : '#000',
                      textAlign: language === 'ar' ? 'right' : 'left',
                    }}
                  >
                    {L.allowances}
                  </Typography>
                  <Box dir='ltr'>
                    <Button
                      variant='outlined'
                      size='small'
                      startIcon={<AddIcon />}
                      onClick={handleAddAllowance}
                      sx={{
                        textTransform: 'none',
                        borderColor: theme.palette.divider,
                        color: darkMode ? '#fff' : '#000',
                      }}
                    >
                      {L.addAllowance}
                    </Button>
                  </Box>
                </Box>
              </Box>
              {allowances.length === 0 ? (
                <Typography
                  variant='body2'
                  sx={{
                    color: darkMode ? '#8f8f8f' : '#666',
                    fontStyle: 'italic',
                  }}
                >
                  {L.noAllowances}
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {allowances.map((allowance, index) => (
                    <Box
                      key={index}
                      sx={{
                        p: 2,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        backgroundColor: darkMode ? '#2d2d2d' : '#f9f9f9',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 2,
                        }}
                      >
                        <Typography
                          variant='subtitle2'
                          sx={{
                            color: darkMode ? '#fff' : '#000',
                            fontWeight: 600,
                          }}
                        >
                          Allowance {index + 1}
                        </Typography>
                        <IconButton
                          size='small'
                          onClick={() => handleRemoveAllowance(index)}
                          sx={{
                            color: theme.palette.error.main,
                          }}
                        >
                          <DeleteIcon fontSize='small' />
                        </IconButton>
                      </Box>
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(3, 1fr)',
                          },
                          gap: 2,
                        }}
                      >
                        <TextField
                          fullWidth
                          label={L.typeLabel}
                          value={allowance.type}
                          onChange={e =>
                            handleAllowanceChange(index, 'type', e.target.value)
                          }
                          placeholder={L.placeholderExample}
                          InputLabelProps={{
                            sx: { color: darkMode ? '#ccc' : undefined },
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: darkMode ? '#1a1a1a' : '#fff',
                              color: darkMode ? '#fff' : '#000',
                              '& fieldset': {
                                borderColor: theme.palette.divider,
                              },
                            },
                          }}
                        />
                        <TextField
                          fullWidth
                          label={L.amountLabel}
                          type='number'
                          inputProps={{ min: 0 }}
                          value={allowance.amount === 0 ? '' : allowance.amount}
                          onChange={e => {
                            const value = e.target.value;
                            const numValue =
                              value === ''
                                ? ''
                                : Math.max(0, parseFloat(value) || 0);
                            handleAllowanceChange(index, 'amount', numValue);
                          }}
                          InputLabelProps={{
                            sx: { color: darkMode ? '#ccc' : undefined },
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: darkMode ? '#1a1a1a' : '#fff',
                              color: darkMode ? '#fff' : '#000',
                              '& fieldset': {
                                borderColor: theme.palette.divider,
                              },
                            },
                          }}
                        />
                        <TextField
                          fullWidth
                          label={L.percentageLabel}
                          type='number'
                          inputProps={{ min: 0 }}
                          value={
                            allowance.percentage === 0
                              ? ''
                              : allowance.percentage
                          }
                          onChange={e => {
                            const value = e.target.value;
                            const numValue =
                              value === ''
                                ? ''
                                : Math.max(0, parseFloat(value) || 0);
                            handleAllowanceChange(
                              index,
                              'percentage',
                              numValue
                            );
                          }}
                          InputLabelProps={{
                            sx: { color: darkMode ? '#ccc' : undefined },
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: darkMode ? '#1a1a1a' : '#fff',
                              color: darkMode ? '#fff' : '#000',
                              '& fieldset': {
                                borderColor: theme.palette.divider,
                              },
                            },
                          }}
                        />
                      </Box>
                      <TextField
                        fullWidth
                        label='Description'
                        value={allowance.description || ''}
                        onChange={e =>
                          handleAllowanceChange(
                            index,
                            'description',
                            e.target.value
                          )
                        }
                        placeholder='Optional description'
                        multiline
                        rows={2}
                        InputLabelProps={{
                          sx: { color: darkMode ? '#ccc' : undefined },
                        }}
                        sx={{
                          mt: 2,
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: darkMode ? '#1a1a1a' : '#fff',
                            color: darkMode ? '#fff' : '#000',
                            '& fieldset': {
                              borderColor: theme.palette.divider,
                            },
                          },
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            <Box>
              <Typography
                variant='h6'
                sx={{
                  mb: 2,
                  fontWeight: 600,
                  color: darkMode ? '#fff' : '#000',
                }}
              >
                {L.deductions}
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                  gap: 2,
                }}
              >
                {Object.entries(deductions).map(([key, value]) => (
                  <TextField
                    key={key}
                    fullWidth
                    label={deductionLabelForKey(key)}
                    type='number'
                    inputProps={{ min: 0 }}
                    value={value === 0 ? '' : value}
                    onChange={e => {
                      const inputValue = e.target.value;
                      const numValue =
                        inputValue === ''
                          ? ''
                          : Math.max(0, parseFloat(inputValue) || 0);
                      handleDeductionChange(
                        key as keyof typeof deductions,
                        numValue
                      );
                    }}
                    InputLabelProps={{
                      sx: { color: darkMode ? '#ccc' : undefined },
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: darkMode ? '#2d2d2d' : '#fff',
                        color: darkMode ? '#fff' : '#000',
                        '& fieldset': {
                          borderColor: theme.palette.divider,
                        },
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>

            <Box>
              <Typography
                variant='h6'
                sx={{
                  mb: 2,
                  fontWeight: 600,
                  color: darkMode ? '#fff' : '#000',
                }}
              >
                {L.overtimePolicy}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={overtimePolicy.enabled}
                      onChange={e =>
                        handleOvertimeChange('enabled', e.target.checked)
                      }
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: theme.palette.primary.main,
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':
                          {
                            backgroundColor: theme.palette.primary.main,
                          },
                      }}
                    />
                  }
                  label={L.enableOvertime}
                  sx={{ color: darkMode ? '#fff' : '#000' }}
                />
                {overtimePolicy.enabled && (
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                      gap: 2,
                    }}
                  >
                    <TextField
                      fullWidth
                      label={L.rateMultiplier}
                      type='number'
                      inputProps={{ min: 0 }}
                      value={
                        overtimePolicy.rateMultiplier === 0
                          ? ''
                          : overtimePolicy.rateMultiplier
                      }
                      onChange={e => {
                        const value = e.target.value;
                        const numValue =
                          value === ''
                            ? ''
                            : Math.max(0, parseFloat(value) || 0);
                        handleOvertimeChange('rateMultiplier', numValue);
                      }}
                      InputLabelProps={{
                        sx: { color: darkMode ? '#ccc' : undefined },
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: darkMode ? '#2d2d2d' : '#fff',
                          color: darkMode ? '#fff' : '#000',
                          '& fieldset': {
                            borderColor: theme.palette.divider,
                          },
                        },
                      }}
                    />
                    <TextField
                      fullWidth
                      label={L.maxHours}
                      type='number'
                      inputProps={{ min: 0 }}
                      value={
                        overtimePolicy.maxHoursPerMonth === 0
                          ? ''
                          : overtimePolicy.maxHoursPerMonth
                      }
                      onChange={e => {
                        const value = e.target.value;
                        const numValue =
                          value === '' ? '' : Math.max(0, parseInt(value) || 0);
                        handleOvertimeChange('maxHoursPerMonth', numValue);
                      }}
                      InputLabelProps={{
                        sx: { color: darkMode ? '#ccc' : undefined },
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: darkMode ? '#2d2d2d' : '#fff',
                          color: darkMode ? '#fff' : '#000',
                          '& fieldset': {
                            borderColor: theme.palette.divider,
                          },
                        },
                      }}
                    />
                  </Box>
                )}
              </Box>
            </Box>

            <Box>
              <Typography
                variant='h6'
                sx={{
                  mb: 2,
                  fontWeight: 600,
                  color: darkMode ? '#fff' : '#000',
                }}
              >
                {L.leaveDeductionPolicy}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={leaveDeductionPolicy.unpaidLeaveDeduction}
                      onChange={e =>
                        handleLeaveDeductionChange(
                          'unpaidLeaveDeduction',
                          e.target.checked
                        )
                      }
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: theme.palette.primary.main,
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':
                          {
                            backgroundColor: theme.palette.primary.main,
                          },
                      }}
                    />
                  }
                  label={L.unpaidLeaveDeduction}
                  sx={{ color: darkMode ? '#fff' : '#000' }}
                />
                <TextField
                  fullWidth
                  label={L.halfDayDeduction}
                  type='number'
                  inputProps={{ min: 0 }}
                  value={
                    leaveDeductionPolicy.halfDayDeduction === 0
                      ? ''
                      : leaveDeductionPolicy.halfDayDeduction
                  }
                  onChange={e => {
                    const value = e.target.value;
                    const numValue =
                      value === '' ? '' : Math.max(0, parseFloat(value) || 0);
                    handleLeaveDeductionChange('halfDayDeduction', numValue);
                  }}
                  sx={{
                    maxWidth: 400,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: darkMode ? '#2d2d2d' : '#fff',
                      color: darkMode ? '#fff' : '#000',
                    },
                  }}
                  InputLabelProps={{
                    sx: { color: darkMode ? '#ccc' : undefined },
                  }}
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            p: 3,
            pt: 1,
            justifyContent: language === 'ar' ? 'flex-start' : 'flex-end',
          }}
        >
          <Button
            onClick={handleCloseEditModal}
            variant='outlined'
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              mr: language === 'ar' ? 1 : 0,
            }}
          >
            {L.cancel}
          </Button>
          <Button
            onClick={handleSave}
            variant='contained'
            startIcon={saving ? <CircularProgress size={16} /> : <EditIcon />}
            disabled={saving || !isFormValid() || !hasChanges()}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              ml: language === 'ar' ? 0 : 1,
            }}
          >
            {saving ? L.updating : L.updateConfig}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PayrollConfiguration;
