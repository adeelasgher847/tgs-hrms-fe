import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Pagination,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useLanguage } from '../../hooks/useLanguage';
import { useIsDarkMode } from '../../theme';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import {
  payrollApi,
  type EmployeeSalary,
  type EmployeeSalaryAllowance,
  type EmployeeSalaryDeduction,
  type EmployeeSalaryResponse,
  type PayrollConfig,
} from '../../api/payrollApi';
import { getCurrentUser, getUserRole } from '../../utils/auth';
import { normalizeRole } from '../../utils/permissions';
import { snackbar } from '../../utils/snackbar';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { type Dayjs } from 'dayjs';
import employeeApi from '../../api/employeeApi';

const monthOptions = [
  { label: 'January', value: 1 },
  { label: 'February', value: 2 },
  { label: 'March', value: 3 },
  { label: 'April', value: 4 },
  { label: 'May', value: 5 },
  { label: 'June', value: 6 },
  { label: 'July', value: 7 },
  { label: 'August', value: 8 },
  { label: 'September', value: 9 },
  { label: 'October', value: 10 },
  { label: 'November', value: 11 },
  { label: 'December', value: 12 },
];

interface EmployeeSalaryListItem {
  employee: {
    id: string;
    user: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      profile_pic: string | null;
    };
    designation: {
      id: string;
      title: string;
    };
    department: {
      id: string;
      name: string;
    };
    team: { id: string; name: string } | null;
    status: string;
  };
  salary: EmployeeSalary | null;
}

const EmployeeSalaryPage: React.FC = () => {
  const theme = useTheme();
  const darkMode = useIsDarkMode();
  const { language } = useLanguage();

  const labels = {
    en: {
      title: 'Employee Salary Structure',
      addSalaryStructure: 'Add Salary Structure',
      addAllowance: 'Add Allowance',
      addDeduction: 'Add Deduction',
      selectEmployeeLabel: 'Select Employee',
      typeLabel: 'Type',
      amountLabel: 'Amount',
      percentageLabel: 'Percentage',
      descriptionLabel: 'Description',
      close: 'Close',
      cancel: 'Cancel',
      createBtn: 'Create',
      updateBtn: 'Update',
      statusLabel: 'Status',
      activeLabel: 'Active',
      inactiveLabel: 'Inactive',
      notesLabel: 'Notes (Optional)',
      employee: 'Employee',
      department: 'Department',
      designation: 'Designation',
      baseSalary: 'Base Salary',
      status: 'Status',
      actions: 'Actions',
      notAssigned: 'Not Assigned',
      assign: 'Assign',
      showingInfo: (page: number, totalPages: number, total: number) =>
        `Showing page ${page} of ${totalPages} (${total} total records)`,
      salaryStructure: 'Salary Structure',
      baseSalaryHeading: 'Base Salary',
      effectiveDateLabel: 'Effective Date',
      endDateLabel: 'End Date',
      effectiveMonthLabel: 'Effective Month',
      effectiveYearLabel: 'Effective Year',
      endDateOptional: 'End Date (Optional)',
      effectiveDateNote:
        'Effective date will be set to the 1st of the selected month',
      salaryHistory: 'Salary History',
      allowances: 'Allowances',
      deductions: 'Deductions',
      noSalaryAssigned: 'No salary structure assigned',
      mySalaryTitle: 'My Salary Structure',
      editModalTitle: 'Edit Salary Structure',
      createModalTitle: 'Create Salary Structure',
      saveSuccessUpdated: 'Salary structure updated successfully',
      saveSuccessCreated: 'Salary structure created successfully',
      saveFailure: 'Failed to save salary structure',
      selectEmployeeRequired: 'Please select an employee',
      employeeIdRequired: 'Employee ID is required',
      loadFailure: 'Failed to load employee salaries',
      preFilledConfig: 'Pre-filled with current payroll configuration defaults',
      currentPayrollConfig: 'Current Payroll Configuration',
      baseSalaryLabel: 'Base Salary',
      allowancesLabel: 'Allowances',
      deductionsLabel: 'Deductions',
      basePayComponentsTitle: 'Base Pay Components',
      basicLabel: 'Basic',
      houseRentLabel: 'House Rent',
      medicalLabel: 'Medical',
      transportLabel: 'Transport',
      totalBaseSalaryLabel: 'Total Base Salary',
    },
    ar: {
      title: 'هيكل راتب الموظف',
      addSalaryStructure: 'إضافة هيكل راتب',
      addAllowance: 'إضافة بدل',
      addDeduction: 'إضافة خصم',
      selectEmployeeLabel: 'اختر موظفًا',
      typeLabel: 'النوع',
      amountLabel: 'المبلغ',
      percentageLabel: 'النسبة',
      descriptionLabel: 'الوصف',
      close: 'إغلاق',
      cancel: 'إلغاء',
      createBtn: 'إنشاء',
      updateBtn: 'تحديث',
      statusLabel: 'الحالة',
      activeLabel: 'نشط',
      inactiveLabel: 'غير نشط',
      notesLabel: 'ملاحظات (اختياري)',
      employee: 'الموظف',
      department: 'القسم',
      designation: 'المسمى الوظيفي',
      baseSalary: 'الراتب الأساسي',
      status: 'الحالة',
      actions: 'إجراءات',
      notAssigned: 'غير معين',
      assign: 'تعيين',
      showingInfo: (page: number, totalPages: number, total: number) =>
        `عرض الصفحة ${page} من ${totalPages} (${total} إجمالي السجلات)`,
      salaryStructure: 'هيكل الراتب',
      baseSalaryHeading: 'الراتب الأساسي',
      effectiveDateLabel: 'تاريخ السريان',
      endDateLabel: 'تاريخ الانتهاء',
      effectiveMonthLabel: 'شهر السريان',
      effectiveYearLabel: 'سنة السريان',
      endDateOptional: 'تاريخ الانتهاء (اختياري)',
      effectiveDateNote:
        'سيتم تعيين تاريخ السريان إلى اليوم الأول من الشهر المختار',
      salaryHistory: 'سجل الرواتب',
      allowances: 'البدلات',
      deductions: 'الخصومات',
      noSalaryAssigned: 'لم يتم تعيين هيكل راتب',
      mySalaryTitle: 'هيكل راتبي',
      editModalTitle: 'تعديل هيكل الراتب',
      createModalTitle: 'إنشاء هيكل راتب',
      saveSuccessUpdated: 'تم تحديث هيكل الراتب بنجاح',
      saveSuccessCreated: 'تم إنشاء هيكل الراتب بنجاح',
      saveFailure: 'فشل في حفظ هيكل الراتب',
      selectEmployeeRequired: 'الرجاء اختيار موظف',
      employeeIdRequired: 'معرف الموظف مطلوب',
      loadFailure: 'فشل في تحميل رواتب الموظفين',
      preFilledConfig: 'معبأة مسبقًا بإعدادات تكوين الرواتب الحالية',
      currentPayrollConfig: 'تكوين الرواتب الحالي',
      baseSalaryLabel: 'الراتب الأساسي',
      allowancesLabel: 'البدلات',
      deductionsLabel: 'الخصومات',
      basePayComponentsTitle: 'مكونات الأجر الأساسي',
      basicLabel: 'الأساسي',
      houseRentLabel: 'بدل السكن',
      medicalLabel: 'بدل طبي',
      transportLabel: 'بدل النقل',
      totalBaseSalaryLabel: 'إجمالي الراتب الأساسي',
    },
  } as const;

  const L = labels[language as 'en' | 'ar'] || labels.en;
  const pageLabels = {
    en: { showingInfo: labels.en.showingInfo },
    ar: { showingInfo: labels.ar.showingInfo },
  } as const;
  const PL = pageLabels[language as 'en' | 'ar'] || pageLabels.en;
  // Keep form input fields LTR and left-aligned so entered values (numbers/text)
  // don't shift when the UI language switches to Arabic.
  const inputTextAlign = 'left';
  const inputDir = 'ltr';
  const currentUser = getCurrentUser();
  const role = normalizeRole(getUserRole());

  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<EmployeeSalaryListItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = 25;
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeSalaryListItem | null>(null);
  const [selectedSalary, setSelectedSalary] = useState<EmployeeSalary | null>(
    null
  );
  const [salaryHistory, setSalaryHistory] = useState<EmployeeSalary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(
    null
  );
  const [mySalary, setMySalary] = useState<EmployeeSalary | null>(null);
  const [mySalaryLoading, setMySalaryLoading] = useState(false);
  const [payrollConfig, setPayrollConfig] = useState<PayrollConfig | null>(
    null
  );
  const [configLoading, setConfigLoading] = useState(false);

  const [baseSalary, setBaseSalary] = useState<number | ''>(0);
  const [basePayComponents, setBasePayComponents] = useState<{
    basic: number | '';
    houseRent: number | '';
    medical: number | '';
    transport: number | '';
  }>({
    basic: 0,
    houseRent: 0,
    medical: 0,
    transport: 0,
  });
  const [allowances, setAllowances] = useState<EmployeeSalaryAllowance[]>([]);
  const [deductions, setDeductions] = useState<EmployeeSalaryDeduction[]>([]);
  const [effectiveMonth, setEffectiveMonth] = useState<number>(
    dayjs().month() + 1
  );
  const [effectiveYear, setEffectiveYear] = useState<number | ''>(
    dayjs().year()
  );
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [notes, setNotes] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  const isAdminRole = [
    'system-admin',
    'network-admin',
    'admin',
    'hr-admin',
  ].includes(role);
  const isEmployeeRole = role === 'employee' || role === 'user';

  const getCurrentEmployeeId = useCallback(async () => {
    try {
      const userId = currentUser?.id;
      if (!userId) return null;

      const allEmps = await employeeApi.getAllEmployees({}, null);
      const employee = allEmps.items.find(emp => emp.user_id === userId);
      return employee?.id || null;
    } catch (error) {
      console.error('Failed to get current employee ID:', error);
      return null;
    }
  }, [currentUser?.id]);

  const loadAllEmployeeSalaries = useCallback(async () => {
    try {
      setLoading(true);
      const response = await payrollApi.getAllEmployeeSalaries({
        page: currentPage,
        limit: itemsPerPage,
      });
      setEmployees(response.items || []);
      setTotalPages(response.totalPages || 1);
      setTotalRecords(response.total || 0);
    } catch (error) {
      console.error('Failed to load employee salaries:', error);
      snackbar.error('Failed to load employee salaries');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  const loadMySalary = useCallback(async () => {
    try {
      setMySalaryLoading(true);
      const employeeId = await getCurrentEmployeeId();
      if (!employeeId) {
        setMySalaryLoading(false);
        return;
      }
      setCurrentEmployeeId(employeeId);
      const response = await payrollApi.getEmployeeSalary(employeeId);
      setMySalary(response.salary);
    } catch (error) {
      console.error('Failed to load my salary:', error);
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        (error as { response?: { status?: number } }).response?.status !== 404
      ) {
        snackbar.error('Failed to load salary information');
      }
    } finally {
      setMySalaryLoading(false);
    }
  }, [getCurrentEmployeeId]);

  useEffect(() => {
    if (isAdminRole) {
      loadAllEmployeeSalaries();
    } else if (isEmployeeRole) {
      loadMySalary();
    }
  }, [isAdminRole, isEmployeeRole, loadAllEmployeeSalaries, loadMySalary]);

  const handleViewSalary = async (employee: EmployeeSalaryListItem) => {
    setSelectedEmployee(employee);
    setViewModalOpen(true);

    if (employee.employee.id) {
      try {
        setHistoryLoading(true);
        const history = await payrollApi.getEmployeeSalaryHistory(
          employee.employee.id
        );
        const sortedHistory = history.sort((a, b) => {
          if (a.status === 'active' && b.status !== 'active') return -1;
          if (a.status !== 'active' && b.status === 'active') return 1;
          return (
            dayjs(b.effectiveDate).valueOf() - dayjs(a.effectiveDate).valueOf()
          );
        });
        setSalaryHistory(sortedHistory);

        const activeSalary =
          sortedHistory.find(s => s.status === 'active') ||
          sortedHistory[0] ||
          employee.salary;
        setSelectedSalary(activeSalary);
      } catch (error) {
        console.error('Failed to load salary history:', error);
        setSalaryHistory([]);
        setSelectedSalary(employee.salary);
      } finally {
        setHistoryLoading(false);
      }
    } else {
      setSelectedSalary(employee.salary);
    }
  };

  const handleAddSalary = async () => {
    setSelectedEmployee(null);
    setSelectedSalary(null);
    setSelectedEmployeeId('');

    // Load payroll configuration defaults
    try {
      setConfigLoading(true);
      const config = await payrollApi.getConfig();
      setPayrollConfig(config);

      if (config) {
        // Set base pay components from config
        setBasePayComponents({
          basic: config.basePayComponents?.basic || 0,
          houseRent: config.basePayComponents?.houseRent || 0,
          medical: config.basePayComponents?.medical || 0,
          transport: config.basePayComponents?.transport || 0,
        });

        // Calculate total base salary for display/validation
        const totalBaseSalary =
          (config.basePayComponents?.basic || 0) +
          (config.basePayComponents?.houseRent || 0) +
          (config.basePayComponents?.medical || 0) +
          (config.basePayComponents?.transport || 0);
        setBaseSalary(totalBaseSalary || 0);

        // Convert config allowances to employee salary allowances format
        const configAllowances: EmployeeSalaryAllowance[] = (
          config.allowances || []
        ).map(allowance => ({
          type: allowance.type || '',
          amount: allowance.amount || 0,
          percentage: allowance.percentage || 0,
          description: allowance.description || '',
        }));

        // Convert config deductions to employee salary deductions format
        // Note: Config has percentage-based deductions, we'll create deduction items
        const configDeductions: EmployeeSalaryDeduction[] = [];
        if (config.deductions?.taxPercentage) {
          configDeductions.push({
            type: 'Tax',
            amount: 0,
            percentage: config.deductions.taxPercentage,
            description: 'Tax deduction percentage',
          });
        }
        if (config.deductions?.insurancePercentage) {
          configDeductions.push({
            type: 'Insurance',
            amount: 0,
            percentage: config.deductions.insurancePercentage,
            description: 'Insurance deduction percentage',
          });
        }
        if (config.deductions?.providentFundPercentage) {
          configDeductions.push({
            type: 'Provident Fund',
            amount: 0,
            percentage: config.deductions.providentFundPercentage,
            description: 'Provident fund deduction percentage',
          });
        }

        setAllowances(configAllowances);
        setDeductions(configDeductions);
      } else {
        // No config, use empty defaults
        setBasePayComponents({
          basic: 0,
          houseRent: 0,
          medical: 0,
          transport: 0,
        });
        setBaseSalary(0);
        setAllowances([]);
        setDeductions([]);
      }
    } catch (error) {
      console.error('Failed to load payroll config:', error);
      // Use empty defaults if config fails to load
      setBasePayComponents({
        basic: 0,
        houseRent: 0,
        medical: 0,
        transport: 0,
      });
      setBaseSalary(0);
      setAllowances([]);
      setDeductions([]);
    } finally {
      setConfigLoading(false);
    }

    setEffectiveMonth(dayjs().month() + 1);
    setEffectiveYear(dayjs().year());
    setEndDate(null);
    setStatus('active');
    setNotes('');
    setEditModalOpen(true);
  };

  const handleEditSalary = async (employee: EmployeeSalaryListItem) => {
    setSelectedEmployee(employee);
    setSelectedEmployeeId(employee.employee.id);

    try {
      // Fetch the latest salary data with defaults
      const response = await payrollApi.getEmployeeSalary(employee.employee.id);

      // Load payroll config to get basePayComponents structure
      const config = await payrollApi.getConfig();
      setPayrollConfig(config);

      if (response.salary) {
        // Employee has an active salary - use actual saved data
        setSelectedSalary(response.salary);
        const baseSalaryValue =
          typeof response.salary.baseSalary === 'string'
            ? parseFloat(response.salary.baseSalary)
            : response.salary.baseSalary;

        // If config exists, use its proportions to split baseSalary
        // Otherwise, put entire baseSalary in basic
        if (config && config.basePayComponents) {
          const totalConfigBase =
            (config.basePayComponents.basic || 0) +
            (config.basePayComponents.houseRent || 0) +
            (config.basePayComponents.medical || 0) +
            (config.basePayComponents.transport || 0);

          if (totalConfigBase > 0) {
            // Split baseSalary proportionally based on config
            const ratio = baseSalaryValue / totalConfigBase;
            setBasePayComponents({
              basic: Math.round((config.basePayComponents.basic || 0) * ratio),
              houseRent: Math.round(
                (config.basePayComponents.houseRent || 0) * ratio
              ),
              medical: Math.round(
                (config.basePayComponents.medical || 0) * ratio
              ),
              transport: Math.round(
                (config.basePayComponents.transport || 0) * ratio
              ),
            });
          } else {
            // Config has no base pay, put all in basic
            setBasePayComponents({
              basic: baseSalaryValue,
              houseRent: 0,
              medical: 0,
              transport: 0,
            });
          }
        } else {
          // No config, put entire baseSalary in basic
          setBasePayComponents({
            basic: baseSalaryValue,
            houseRent: 0,
            medical: 0,
            transport: 0,
          });
        }

        setBaseSalary(baseSalaryValue);
        setAllowances(response.salary.allowances || []);
        setDeductions(response.salary.deductions || []);
        const effectiveDateObj = dayjs(response.salary.effectiveDate);
        setEffectiveMonth(effectiveDateObj.month() + 1);
        setEffectiveYear(effectiveDateObj.year());
        setEndDate(
          response.salary.endDate ? dayjs(response.salary.endDate) : null
        );
        setStatus(response.salary.status);
        setNotes(response.salary.notes || '');
      } else {
        // No salary assigned - use defaults from payroll config
        setSelectedSalary(null);

        // Load basePayComponents from config if available
        if (config && config.basePayComponents) {
          setBasePayComponents({
            basic: config.basePayComponents.basic || 0,
            houseRent: config.basePayComponents.houseRent || 0,
            medical: config.basePayComponents.medical || 0,
            transport: config.basePayComponents.transport || 0,
          });
          const totalBaseSalary =
            (config.basePayComponents.basic || 0) +
            (config.basePayComponents.houseRent || 0) +
            (config.basePayComponents.medical || 0) +
            (config.basePayComponents.transport || 0);
          setBaseSalary(totalBaseSalary);
        } else {
          // Use defaults from API response
          setBasePayComponents({
            basic: response.defaults.baseSalary || 0,
            houseRent: 0,
            medical: 0,
            transport: 0,
          });
          setBaseSalary(response.defaults.baseSalary);
        }

        setAllowances([...response.defaults.allowances]);
        setDeductions([...response.defaults.deductions]);
        const effectiveDateObj = dayjs(response.defaults.effectiveDate);
        setEffectiveMonth(effectiveDateObj.month() + 1);
        setEffectiveYear(effectiveDateObj.year());
        setEndDate(null);
        setStatus('active');
        setNotes('');
      }
      setEditModalOpen(true);
    } catch (error) {
      console.error('Failed to load employee salary:', error);
      snackbar.error('Failed to load salary information');
    }
  };

  const handleSaveSalary = async () => {
    try {
      if (!selectedEmployeeId && !currentEmployeeId) {
        snackbar.error(L.selectEmployeeRequired);
        return;
      }

      const employeeId = selectedEmployeeId || currentEmployeeId;
      if (!employeeId) {
        snackbar.error(L.employeeIdRequired);
        return;
      }

      const year =
        typeof effectiveYear === 'string' && effectiveYear === ''
          ? dayjs().year()
          : effectiveYear || dayjs().year();
      const effectiveDate = dayjs(`${year}-${effectiveMonth}-01`).format(
        'YYYY-MM-DD'
      );

      // Only send allowances and deductions that are not deleted (have valid data)
      const validAllowances = allowances
        .filter(a => a.type && a.type.trim() !== '')
        .map(a => ({
          ...a,
          amount:
            typeof a.amount === 'string' && a.amount === '' ? 0 : a.amount || 0,
          percentage:
            typeof a.percentage === 'string' && a.percentage === ''
              ? 0
              : a.percentage || 0,
        }));
      const validDeductions = deductions
        .filter(d => d.type && d.type.trim() !== '')
        .map(d => ({
          ...d,
          amount:
            typeof d.amount === 'string' && d.amount === '' ? 0 : d.amount || 0,
          percentage:
            typeof d.percentage === 'string' && d.percentage === ''
              ? 0
              : d.percentage || 0,
        }));

      // Calculate baseSalary from basePayComponents
      const calculatedBaseSalary =
        (typeof basePayComponents.basic === 'string' &&
        basePayComponents.basic === ''
          ? 0
          : basePayComponents.basic || 0) +
        (typeof basePayComponents.houseRent === 'string' &&
        basePayComponents.houseRent === ''
          ? 0
          : basePayComponents.houseRent || 0) +
        (typeof basePayComponents.medical === 'string' &&
        basePayComponents.medical === ''
          ? 0
          : basePayComponents.medical || 0) +
        (typeof basePayComponents.transport === 'string' &&
        basePayComponents.transport === ''
          ? 0
          : basePayComponents.transport || 0);

      const salaryData = {
        baseSalary: calculatedBaseSalary,
        allowances: validAllowances,
        deductions: validDeductions,
        effectiveDate,
        endDate: endDate?.format('YYYY-MM-DD') || undefined,
        status,
        notes: notes || undefined,
      };

      if (selectedSalary) {
        await payrollApi.updateEmployeeSalary(employeeId, salaryData);
        snackbar.success(L.saveSuccessUpdated);
      } else {
        await payrollApi.createEmployeeSalary({
          employee_id: employeeId,
          ...salaryData,
        });
        snackbar.success(L.saveSuccessCreated);
      }

      setEditModalOpen(false);
      setPayrollConfig(null);
      setConfigLoading(false);
      if (isAdminRole) {
        loadAllEmployeeSalaries();
      } else {
        loadMySalary();
      }
    } catch (error) {
      console.error('Failed to save salary:', error);
      snackbar.error(L.saveFailure);
    }
  };

  const handleAddAllowance = () => {
    setAllowances([
      ...allowances,
      { type: '', amount: 0, percentage: 0, description: '' },
    ]);
  };

  const handleRemoveAllowance = (index: number) => {
    setAllowances(allowances.filter((_, i) => i !== index));
  };

  const handleUpdateAllowance = (
    index: number,
    field: keyof EmployeeSalaryAllowance,
    value: string | number | ''
  ) => {
    const updated = [...allowances];
    updated[index] = { ...updated[index], [field]: value };
    setAllowances(updated);
  };

  const handleAddDeduction = () => {
    setDeductions([
      ...deductions,
      { type: '', amount: 0, percentage: 0, description: '' },
    ]);
  };

  const handleRemoveDeduction = (index: number) => {
    setDeductions(deductions.filter((_, i) => i !== index));
  };

  const handleUpdateDeduction = (
    index: number,
    field: keyof EmployeeSalaryDeduction,
    value: string | number | ''
  ) => {
    const updated = [...deductions];
    updated[index] = { ...updated[index], [field]: value };
    setDeductions(updated);
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatPercentage = (value: number) => {
    return `${value}%`;
  };

  const isFormValid = useCallback(() => {
    if (!selectedSalary && !selectedEmployeeId && !currentEmployeeId) {
      return false;
    }
    // Check if at least basic component has a value
    const basicValue =
      typeof basePayComponents.basic === 'string' &&
      basePayComponents.basic === ''
        ? 0
        : basePayComponents.basic || 0;
    if (basicValue <= 0) {
      return false;
    }
    // Calculate total base salary
    const totalBaseSalary =
      (typeof basePayComponents.basic === 'string' &&
      basePayComponents.basic === ''
        ? 0
        : basePayComponents.basic || 0) +
      (typeof basePayComponents.houseRent === 'string' &&
      basePayComponents.houseRent === ''
        ? 0
        : basePayComponents.houseRent || 0) +
      (typeof basePayComponents.medical === 'string' &&
      basePayComponents.medical === ''
        ? 0
        : basePayComponents.medical || 0) +
      (typeof basePayComponents.transport === 'string' &&
      basePayComponents.transport === ''
        ? 0
        : basePayComponents.transport || 0);
    if (totalBaseSalary <= 0) {
      return false;
    }
    const year =
      typeof effectiveYear === 'string' && effectiveYear === ''
        ? 0
        : effectiveYear || 0;
    if (!effectiveMonth || !year) {
      return false;
    }
    for (const allowance of allowances) {
      const amount =
        typeof allowance.amount === 'string' && allowance.amount === ''
          ? 0
          : allowance.amount || 0;
      const percentage =
        typeof allowance.percentage === 'string' && allowance.percentage === ''
          ? 0
          : allowance.percentage || 0;
      if (
        !allowance.type ||
        allowance.type.trim() === '' ||
        amount < 0 ||
        percentage < 0
      ) {
        return false;
      }
    }
    for (const deduction of deductions) {
      const amount =
        typeof deduction.amount === 'string' && deduction.amount === ''
          ? 0
          : deduction.amount || 0;
      const percentage =
        typeof deduction.percentage === 'string' && deduction.percentage === ''
          ? 0
          : deduction.percentage || 0;
      if (
        !deduction.type ||
        deduction.type.trim() === '' ||
        amount < 0 ||
        percentage < 0
      ) {
        return false;
      }
    }
    return true;
  }, [
    selectedSalary,
    selectedEmployeeId,
    currentEmployeeId,
    basePayComponents,
    effectiveMonth,
    effectiveYear,
    allowances,
    deductions,
  ]);

  const hasChanges = useCallback(() => {
    if (!selectedSalary) return true;

    const currentBaseSalary =
      typeof selectedSalary.baseSalary === 'string'
        ? parseFloat(selectedSalary.baseSalary)
        : selectedSalary.baseSalary;
    // Calculate total from basePayComponents
    const totalBaseSalary =
      (typeof basePayComponents.basic === 'string' &&
      basePayComponents.basic === ''
        ? 0
        : basePayComponents.basic || 0) +
      (typeof basePayComponents.houseRent === 'string' &&
      basePayComponents.houseRent === ''
        ? 0
        : basePayComponents.houseRent || 0) +
      (typeof basePayComponents.medical === 'string' &&
      basePayComponents.medical === ''
        ? 0
        : basePayComponents.medical || 0) +
      (typeof basePayComponents.transport === 'string' &&
      basePayComponents.transport === ''
        ? 0
        : basePayComponents.transport || 0);
    if (currentBaseSalary !== totalBaseSalary) return true;

    const year =
      typeof effectiveYear === 'string' && effectiveYear === ''
        ? dayjs().year()
        : effectiveYear || dayjs().year();
    const currentEffectiveDate = dayjs(`${year}-${effectiveMonth}-01`).format(
      'YYYY-MM-DD'
    );
    if (
      dayjs(selectedSalary.effectiveDate).format('YYYY-MM-DD') !==
      currentEffectiveDate
    ) {
      return true;
    }

    const currentEndDate = selectedSalary.endDate
      ? dayjs(selectedSalary.endDate).format('YYYY-MM-DD')
      : null;
    const newEndDate = endDate ? endDate.format('YYYY-MM-DD') : null;
    if (currentEndDate !== newEndDate) return true;

    if (selectedSalary.status !== status) return true;

    if (
      JSON.stringify(selectedSalary.allowances || []) !==
      JSON.stringify(allowances)
    )
      return true;

    if (
      JSON.stringify(selectedSalary.deductions || []) !==
      JSON.stringify(deductions)
    )
      return true;

    if ((selectedSalary.notes || '') !== notes) return true;

    return false;
  }, [
    selectedSalary,
    baseSalary,
    effectiveMonth,
    effectiveYear,
    endDate,
    status,
    allowances,
    deductions,
    notes,
  ]);

  if (isEmployeeRole) {
    if (mySalaryLoading) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '80vh',
          }}
        >
          <CircularProgress />
        </Box>
      );
    }

    if (!mySalary) {
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity='info'>{L.noSalaryAssigned}</Alert>
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
              textAlign: language === 'ar' ? 'right' : 'left',
            }}
          >
            {L.mySalaryTitle}
          </Typography>
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
              sx={{ mb: 2, fontWeight: 600, color: darkMode ? '#fff' : '#000' }}
            >
              {L.baseSalaryHeading}
            </Typography>
            <Typography
              variant='h4'
              sx={{ color: darkMode ? '#fff' : '#000', fontWeight: 600 }}
            >
              {formatCurrency(mySalary.baseSalary)}
            </Typography>
          </Paper>

          {mySalary.allowances && mySalary.allowances.length > 0 && (
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
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                  },
                  gap: 2,
                }}
              >
                {mySalary.allowances.map((allowance, index) => (
                  <Paper
                    key={index}
                    sx={{
                      p: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 2,
                      backgroundColor: darkMode ? '#2d2d2d' : '#f9f9f9',
                      boxShadow: 'none',
                    }}
                  >
                    <Typography
                      variant='subtitle2'
                      sx={{
                        color: darkMode ? '#fff' : '#000',
                        fontWeight: 600,
                        mb: 1,
                      }}
                    >
                      {allowance.type || `Allowance ${index + 1}`}
                    </Typography>
                    <Typography
                      variant='body2'
                      sx={{ color: darkMode ? '#8f8f8f' : '#666', mb: 0.5 }}
                    >
                      Amount: {formatCurrency(allowance.amount)}
                    </Typography>
                    <Typography
                      variant='body2'
                      sx={{ color: darkMode ? '#8f8f8f' : '#666' }}
                    >
                      Percentage: {formatPercentage(allowance.percentage)}
                    </Typography>
                    {allowance.description && (
                      <Typography
                        variant='body2'
                        sx={{
                          color: darkMode ? '#8f8f8f' : '#666',
                          mt: 1,
                          fontStyle: 'italic',
                        }}
                      >
                        {allowance.description}
                      </Typography>
                    )}
                  </Paper>
                ))}
              </Box>
            </Paper>
          )}

          {mySalary.deductions && mySalary.deductions.length > 0 && (
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
                Deductions
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                  },
                  gap: 2,
                }}
              >
                {mySalary.deductions.map((deduction, index) => (
                  <Paper
                    key={index}
                    sx={{
                      p: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 2,
                      backgroundColor: darkMode ? '#2d2d2d' : '#f9f9f9',
                      boxShadow: 'none',
                    }}
                  >
                    <Typography
                      variant='subtitle2'
                      sx={{
                        color: darkMode ? '#fff' : '#000',
                        fontWeight: 600,
                        mb: 1,
                      }}
                    >
                      {deduction.type || `Deduction ${index + 1}`}
                    </Typography>
                    <Typography
                      variant='body2'
                      sx={{ color: darkMode ? '#8f8f8f' : '#666', mb: 0.5 }}
                    >
                      Amount: {formatCurrency(deduction.amount)}
                    </Typography>
                    <Typography
                      variant='body2'
                      sx={{ color: darkMode ? '#8f8f8f' : '#666' }}
                    >
                      Percentage: {formatPercentage(deduction.percentage)}
                    </Typography>
                    {deduction.description && (
                      <Typography
                        variant='body2'
                        sx={{
                          color: darkMode ? '#8f8f8f' : '#666',
                          mt: 1,
                          fontStyle: 'italic',
                        }}
                      >
                        {deduction.description}
                      </Typography>
                    )}
                  </Paper>
                ))}
              </Box>
            </Paper>
          )}

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
              sx={{ mb: 2, fontWeight: 600, color: darkMode ? '#fff' : '#000' }}
            >
              Additional Information
            </Typography>
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
                  sx={{ color: darkMode ? '#8f8f8f' : '#666', mb: 0.5 }}
                >
                  Effective Date
                </Typography>
                <Typography
                  variant='body1'
                  sx={{ color: darkMode ? '#fff' : '#000', fontWeight: 500 }}
                >
                  {dayjs(mySalary.effectiveDate).format('MMM DD, YYYY')}
                </Typography>
              </Box>
              {mySalary.endDate && (
                <Box>
                  <Typography
                    variant='body2'
                    sx={{ color: darkMode ? '#8f8f8f' : '#666', mb: 0.5 }}
                  >
                    End Date
                  </Typography>
                  <Typography
                    variant='body1'
                    sx={{ color: darkMode ? '#fff' : '#000', fontWeight: 500 }}
                  >
                    {dayjs(mySalary.endDate).format('MMM DD, YYYY')}
                  </Typography>
                </Box>
              )}
              <Box>
                <Typography
                  variant='body2'
                  sx={{ color: darkMode ? '#8f8f8f' : '#666', mb: 0.5 }}
                >
                  Status
                </Typography>
                <Chip
                  label={mySalary.status}
                  color={mySalary.status === 'active' ? 'success' : 'default'}
                  size='small'
                />
              </Box>
              {mySalary.notes && (
                <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                  <Typography
                    variant='body2'
                    sx={{ color: darkMode ? '#8f8f8f' : '#666', mb: 0.5 }}
                  >
                    Notes
                  </Typography>
                  <Typography
                    variant='body1'
                    sx={{ color: darkMode ? '#fff' : '#000' }}
                  >
                    {mySalary.notes}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
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
            textAlign: language === 'ar' ? 'right' : 'left',
          }}
        >
          {L.title}
        </Typography>
        <Box dir='ltr' sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant='contained'
            startIcon={<AddIcon />}
            onClick={handleAddSalary}
            sx={{
              backgroundColor: darkMode ? '#464b8a' : '#484c7f',
              '&:hover': {
                backgroundColor: darkMode ? '#464b8a' : '#5b56a0',
              },
            }}
          >
            {L.addSalaryStructure}
          </Button>
        </Box>
      </Box>

      <Paper
        sx={{
          backgroundColor: darkMode ? '#1a1a1a' : '#fff',
          boxShadow: 'none',
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{ color: darkMode ? '#fff' : '#000', fontWeight: 600 }}
                  >
                    {L.employee}
                  </TableCell>
                  <TableCell
                    sx={{ color: darkMode ? '#fff' : '#000', fontWeight: 600 }}
                  >
                    {L.department}
                  </TableCell>
                  <TableCell
                    sx={{ color: darkMode ? '#fff' : '#000', fontWeight: 600 }}
                  >
                    {L.designation}
                  </TableCell>
                  <TableCell
                    sx={{ color: darkMode ? '#fff' : '#000', fontWeight: 600 }}
                  >
                    {L.baseSalary}
                  </TableCell>
                  <TableCell
                    sx={{ color: darkMode ? '#fff' : '#000', fontWeight: 600 }}
                  >
                    {L.status}
                  </TableCell>
                  <TableCell
                    sx={{ color: darkMode ? '#fff' : '#000', fontWeight: 600 }}
                  >
                    {L.actions}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map(item => (
                  <TableRow key={item.employee.id} hover>
                    <TableCell>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Box>
                          <Typography
                            variant='body2'
                            sx={{
                              color: darkMode ? '#fff' : '#000',
                              fontWeight: 500,
                            }}
                          >
                            {`${item.employee.user.first_name} ${item.employee.user.last_name}`}
                          </Typography>
                          <Typography
                            variant='caption'
                            sx={{ color: darkMode ? '#8f8f8f' : '#666' }}
                          >
                            {item.employee.user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{item.employee.department.name}</TableCell>
                    <TableCell>{item.employee.designation.title}</TableCell>
                    <TableCell
                      sx={{
                        color: darkMode ? '#fff' : '#000',
                        fontWeight: 500,
                      }}
                    >
                      {item.salary
                        ? formatCurrency(item.salary.baseSalary)
                        : L.notAssigned}
                    </TableCell>
                    <TableCell>
                      {item.salary ? (
                        <Chip
                          label={item.salary.status}
                          color={
                            item.salary.status === 'active'
                              ? 'success'
                              : 'default'
                          }
                          size='small'
                        />
                      ) : (
                        <Chip label={L.inactiveLabel} size='small' />
                      )}
                    </TableCell>
                    <TableCell>
                      <Stack direction='row' spacing={1}>
                        {item.salary ? (
                          <>
                            <IconButton
                              size='small'
                              onClick={() => handleViewSalary(item)}
                              sx={{ color: theme.palette.primary.main }}
                            >
                              <VisibilityIcon />
                            </IconButton>
                            <IconButton
                              size='small'
                              onClick={() => handleEditSalary(item)}
                              sx={{ color: theme.palette.primary.main }}
                            >
                              <EditIcon />
                            </IconButton>
                          </>
                        ) : (
                          <Button
                            size='small'
                            variant='outlined'
                            onClick={async () => {
                              setSelectedEmployee(item);
                              setSelectedEmployeeId(item.employee.id);

                              try {
                                // Fetch defaults for this employee
                                const response =
                                  await payrollApi.getEmployeeSalary(
                                    item.employee.id
                                  );

                                // Use defaults since salary is null
                                setSelectedSalary(null);
                                setBaseSalary(response.defaults.baseSalary);
                                setAllowances([
                                  ...response.defaults.allowances,
                                ]);
                                setDeductions([
                                  ...response.defaults.deductions,
                                ]);
                                const effectiveDateObj = dayjs(
                                  response.defaults.effectiveDate
                                );
                                setEffectiveMonth(effectiveDateObj.month() + 1);
                                setEffectiveYear(effectiveDateObj.year());
                                setEndDate(null);
                                setStatus('active');
                                setNotes('');
                                setEditModalOpen(true);
                              } catch (error) {
                                console.error(
                                  'Failed to load salary defaults:',
                                  error
                                );
                                snackbar.error(
                                  'Failed to load salary defaults'
                                );
                              }
                            }}
                          >
                            {L.assign}
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {!loading && totalPages > 1 && (
          <Box display='flex' justifyContent='center' p={2}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(_, page) => setCurrentPage(page)}
              color='primary'
              showFirstButton
              showLastButton
            />
          </Box>
        )}
        {!loading && employees.length > 0 && (
          <Box display='flex' justifyContent='center' pb={2}>
            <Typography variant='body2' color='textSecondary'>
              {PL.showingInfo(currentPage, totalPages, totalRecords)}
            </Typography>
          </Box>
        )}
      </Paper>

      <Dialog
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
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
            flexDirection: language === 'ar' ? 'row-reverse' : 'row',
            color: darkMode ? '#fff' : '#000',
            pb: 2,
            textAlign: language === 'ar' ? 'right' : 'left',
          }}
        >
          {language === 'ar' && (
            <IconButton
              onClick={() => setViewModalOpen(false)}
              size='small'
              sx={{
                color: theme.palette.text.secondary,
                '&:hover': {
                  color: theme.palette.text.primary,
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          )}
          <Box
            sx={{ flex: 1, textAlign: language === 'ar' ? 'right' : 'left' }}
          >
            <Typography variant='h6' sx={{ fontWeight: 600 }}>
              {selectedEmployee
                ? `${selectedEmployee.employee.user.first_name} ${selectedEmployee.employee.user.last_name} - ${L.salaryStructure}`
                : L.salaryStructure}
            </Typography>
          </Box>
          {language !== 'ar' && (
            <IconButton
              onClick={() => setViewModalOpen(false)}
              size='small'
              sx={{
                color: theme.palette.text.secondary,
                '&:hover': {
                  color: theme.palette.text.primary,
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent
          sx={{
            pt: 3,
            maxHeight: '70vh',
            overflowY: 'auto',
            direction: language === 'ar' ? 'rtl' : 'ltr',
          }}
        >
          {selectedSalary ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Paper
                sx={{
                  p: 2,
                  boxShadow: 'none',
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Typography
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                  variant='h6'
                  sx={{
                    mb: 1,
                    color: darkMode ? '#fff' : '#000',
                    textAlign: language === 'ar' ? 'right' : 'left',
                  }}
                >
                  {L.baseSalaryHeading}
                </Typography>
                <Typography
                  variant='h4'
                  sx={{ color: darkMode ? '#fff' : '#000', fontWeight: 600 }}
                >
                  {formatCurrency(selectedSalary.baseSalary)}
                </Typography>
              </Paper>

              {selectedSalary.allowances &&
                selectedSalary.allowances.length > 0 && (
                  <Box>
                    <Typography
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                      variant='h6'
                      sx={{
                        mb: 2,
                        color: darkMode ? '#fff' : '#000',
                        textAlign: language === 'ar' ? 'right' : 'left',
                      }}
                    >
                      {L.allowances}
                    </Typography>
                    <Box
                      sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                    >
                      {selectedSalary.allowances.map((allowance, index) => (
                        <Paper
                          key={index}
                          sx={{
                            p: 2,
                            boxShadow: 'none',
                            border: `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          <Typography
                            variant='subtitle2'
                            sx={{
                              color: darkMode ? '#fff' : '#000',
                              fontWeight: 600,
                            }}
                          >
                            {allowance.type}
                          </Typography>
                          <Typography
                            variant='body2'
                            sx={{ color: darkMode ? '#8f8f8f' : '#666' }}
                          >
                            {L.amountLabel}: {formatCurrency(allowance.amount)}{' '}
                            {'|'} {L.percentageLabel}:{' '}
                            {formatPercentage(allowance.percentage)}
                          </Typography>
                          {allowance.description && (
                            <Typography
                              variant='body2'
                              sx={{
                                color: darkMode ? '#8f8f8f' : '#666',
                                mt: 1,
                              }}
                            >
                              {allowance.description}
                            </Typography>
                          )}
                        </Paper>
                      ))}
                    </Box>
                  </Box>
                )}

              {selectedSalary.deductions &&
                selectedSalary.deductions.length > 0 && (
                  <Box>
                    <Typography
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                      variant='h6'
                      sx={{
                        mb: 2,
                        color: darkMode ? '#fff' : '#000',
                        textAlign: language === 'ar' ? 'right' : 'left',
                      }}
                    >
                      {L.deductions}
                    </Typography>
                    <Box
                      sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                    >
                      {selectedSalary.deductions.map((deduction, index) => (
                        <Paper
                          key={index}
                          sx={{
                            p: 2,
                            boxShadow: 'none',
                            border: `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          <Typography
                            variant='subtitle2'
                            sx={{
                              color: darkMode ? '#fff' : '#000',
                              fontWeight: 600,
                            }}
                          >
                            {deduction.type}
                          </Typography>
                          <Typography
                            variant='body2'
                            sx={{ color: darkMode ? '#8f8f8f' : '#666' }}
                          >
                            {L.amountLabel}: {formatCurrency(deduction.amount)}{' '}
                            {'|'} {L.percentageLabel}:{' '}
                            {formatPercentage(deduction.percentage)}
                          </Typography>
                          {deduction.description && (
                            <Typography
                              variant='body2'
                              sx={{
                                color: darkMode ? '#8f8f8f' : '#666',
                                mt: 1,
                              }}
                            >
                              {deduction.description}
                            </Typography>
                          )}
                        </Paper>
                      ))}
                    </Box>
                  </Box>
                )}

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
                    sx={{ color: darkMode ? '#8f8f8f' : '#666', mb: 0.5 }}
                  >
                    {L.effectiveDateLabel}
                  </Typography>
                  <Typography
                    variant='body1'
                    sx={{ color: darkMode ? '#fff' : '#000' }}
                  >
                    {dayjs(selectedSalary.effectiveDate).format('MMM DD, YYYY')}
                  </Typography>
                </Box>
                {selectedSalary.endDate && (
                  <Box>
                    <Typography
                      variant='body2'
                      sx={{ color: darkMode ? '#8f8f8f' : '#666', mb: 0.5 }}
                    >
                      {L.endDateLabel}
                    </Typography>
                    <Typography
                      variant='body1'
                      sx={{ color: darkMode ? '#fff' : '#000' }}
                    >
                      {dayjs(selectedSalary.endDate).format('MMM DD, YYYY')}
                    </Typography>
                  </Box>
                )}
                <Box>
                  <Typography
                    variant='body2'
                    sx={{ color: darkMode ? '#8f8f8f' : '#666', mb: 0.5 }}
                  >
                    {L.statusLabel}
                  </Typography>
                  <Chip
                    label={
                      selectedSalary.status === 'active'
                        ? L.activeLabel
                        : L.inactiveLabel
                    }
                    color={
                      selectedSalary.status === 'active' ? 'success' : 'default'
                    }
                    size='small'
                  />
                </Box>
                {selectedSalary.notes && (
                  <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                    <Typography
                      variant='body2'
                      sx={{ color: darkMode ? '#8f8f8f' : '#666', mb: 0.5 }}
                    >
                      {L.notesLabel}
                    </Typography>
                    <Typography
                      variant='body1'
                      sx={{ color: darkMode ? '#fff' : '#000' }}
                    >
                      {selectedSalary.notes}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Salary History Table */}
              {salaryHistory.length > 1 && (
                <Box sx={{ mt: 4 }}>
                  <Typography
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                    variant='h6'
                    sx={{
                      mb: 2,
                      color: darkMode ? '#fff' : '#000',
                      fontWeight: 600,
                      textAlign: language === 'ar' ? 'right' : 'left',
                    }}
                  >
                    {L.salaryHistory}
                  </Typography>
                  {historyLoading ? (
                    <Box
                      sx={{ display: 'flex', justifyContent: 'center', p: 2 }}
                    >
                      <CircularProgress size={24} />
                    </Box>
                  ) : (
                    <TableContainer
                      component={Paper}
                      sx={{
                        backgroundColor: darkMode ? '#2d2d2d' : '#f9f9f9',
                        border: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <Table size='small'>
                        <TableHead>
                          <TableRow>
                            <TableCell
                              sx={{
                                color: darkMode ? '#fff' : '#000',
                                fontWeight: 600,
                              }}
                            >
                              {L.effectiveDateLabel}
                            </TableCell>
                            <TableCell
                              sx={{
                                color: darkMode ? '#fff' : '#000',
                                fontWeight: 600,
                              }}
                            >
                              {L.endDateLabel}
                            </TableCell>
                            <TableCell
                              sx={{
                                color: darkMode ? '#fff' : '#000',
                                fontWeight: 600,
                              }}
                            >
                              {L.baseSalaryHeading}
                            </TableCell>
                            <TableCell
                              sx={{
                                color: darkMode ? '#fff' : '#000',
                                fontWeight: 600,
                              }}
                            >
                              {L.statusLabel}
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {salaryHistory
                            .filter(s => s.id !== selectedSalary?.id)
                            .map(salary => (
                              <TableRow key={salary.id} hover>
                                <TableCell
                                  sx={{ color: darkMode ? '#8f8f8f' : '#666' }}
                                >
                                  {dayjs(salary.effectiveDate).format(
                                    'MMM DD, YYYY'
                                  )}
                                </TableCell>
                                <TableCell
                                  sx={{ color: darkMode ? '#8f8f8f' : '#666' }}
                                >
                                  {salary.endDate
                                    ? dayjs(salary.endDate).format(
                                        'MMM DD, YYYY'
                                      )
                                    : 'N/A'}
                                </TableCell>
                                <TableCell
                                  sx={{
                                    color: darkMode ? '#fff' : '#000',
                                    fontWeight: 500,
                                  }}
                                >
                                  {formatCurrency(salary.baseSalary)}
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={salary.status}
                                    color={
                                      salary.status === 'active'
                                        ? 'success'
                                        : 'default'
                                    }
                                    size='small'
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}
            </Box>
          ) : (
            <Alert severity='info'>No salary structure assigned</Alert>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            p: 3,
            pt: 2,
            justifyContent: language === 'ar' ? 'flex-start' : 'flex-end',
          }}
        >
          <Button
            sx={{ mr: language === 'ar' ? 1 : 0 }}
            onClick={() => setViewModalOpen(false)}
          >
            {L.close}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setPayrollConfig(null);
          setConfigLoading(false);
        }}
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
            flexDirection: language === 'ar' ? 'row-reverse' : 'row',
            color: darkMode ? '#fff' : '#000',
            pb: 2,
            textAlign: language === 'ar' ? 'right' : 'left',
          }}
        >
          {language === 'ar' && (
            <IconButton
              onClick={() => setEditModalOpen(false)}
              size='small'
              sx={{
                color: theme.palette.text.secondary,
                '&:hover': {
                  color: theme.palette.text.primary,
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          )}
          <Box
            sx={{ flex: 1, textAlign: language === 'ar' ? 'right' : 'left' }}
          >
            <Typography variant='h6' sx={{ fontWeight: 600 }}>
              {selectedSalary ? L.editModalTitle : L.createModalTitle}
            </Typography>
            {!selectedSalary && payrollConfig && (
              <Typography
                variant='caption'
                sx={{
                  color: darkMode ? '#8f8f8f' : '#666',
                  mt: 0.5,
                  display: 'block',
                  fontStyle: 'italic',
                }}
              >
                {L.preFilledConfig}
              </Typography>
            )}
          </Box>
          {language !== 'ar' && (
            <IconButton
              onClick={() => setEditModalOpen(false)}
              size='small'
              sx={{
                color: theme.palette.text.secondary,
                '&:hover': {
                  color: theme.palette.text.primary,
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent
          sx={{
            pt: 3,
            maxHeight: '70vh',
            overflowY: 'auto',
            direction: language === 'ar' ? 'rtl' : 'ltr',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              marginTop: 2,
            }}
          >
            {configLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}
            {!selectedSalary && payrollConfig && (
              <Alert
                severity='info'
                sx={{
                  backgroundColor: darkMode ? '#1e3a5f' : '#e3f2fd',
                  color: darkMode ? '#90caf9' : '#1976d2',
                }}
              >
                <Typography variant='body2' sx={{ fontWeight: 600, mb: 0.5 }}>
                  {L.currentPayrollConfig}
                </Typography>
                <Typography variant='caption' sx={{ display: 'block' }}>
                  {L.baseSalaryLabel}:{' '}
                  {formatCurrency(payrollConfig.basePayComponents?.basic || 0)}{' '}
                  • {L.allowancesLabel}: {payrollConfig.allowances?.length || 0}{' '}
                  • {L.deductionsLabel}:{' '}
                  {
                    [
                      payrollConfig.deductions?.taxPercentage && 'Tax',
                      payrollConfig.deductions?.insurancePercentage &&
                        'Insurance',
                      payrollConfig.deductions?.providentFundPercentage &&
                        'Provident Fund',
                    ].filter(Boolean).length
                  }
                </Typography>
              </Alert>
            )}
            {!selectedSalary && (
              <FormControl fullWidth>
                <InputLabel sx={{ color: darkMode ? '#8f8f8f' : '#666' }}>
                  {L.selectEmployeeLabel}
                </InputLabel>
                <Select
                  value={selectedEmployeeId}
                  onChange={async e => {
                    const employeeId = e.target.value;
                    setSelectedEmployeeId(employeeId);

                    if (employeeId) {
                      try {
                        // Load defaults for the selected employee
                        const response =
                          await payrollApi.getEmployeeSalary(employeeId);

                        // Load payroll config to get basePayComponents structure
                        const config = await payrollApi.getConfig();
                        setPayrollConfig(config);

                        if (response.salary) {
                          // Employee has an active salary - use actual saved data
                          setSelectedSalary(response.salary);
                          const baseSalaryValue =
                            typeof response.salary.baseSalary === 'string'
                              ? parseFloat(response.salary.baseSalary)
                              : response.salary.baseSalary;

                          // If config exists, use its proportions to split baseSalary
                          if (config && config.basePayComponents) {
                            const totalConfigBase =
                              (config.basePayComponents.basic || 0) +
                              (config.basePayComponents.houseRent || 0) +
                              (config.basePayComponents.medical || 0) +
                              (config.basePayComponents.transport || 0);

                            if (totalConfigBase > 0) {
                              const ratio = baseSalaryValue / totalConfigBase;
                              setBasePayComponents({
                                basic: Math.round(
                                  (config.basePayComponents.basic || 0) * ratio
                                ),
                                houseRent: Math.round(
                                  (config.basePayComponents.houseRent || 0) *
                                    ratio
                                ),
                                medical: Math.round(
                                  (config.basePayComponents.medical || 0) *
                                    ratio
                                ),
                                transport: Math.round(
                                  (config.basePayComponents.transport || 0) *
                                    ratio
                                ),
                              });
                            } else {
                              setBasePayComponents({
                                basic: baseSalaryValue,
                                houseRent: 0,
                                medical: 0,
                                transport: 0,
                              });
                            }
                          } else {
                            setBasePayComponents({
                              basic: baseSalaryValue,
                              houseRent: 0,
                              medical: 0,
                              transport: 0,
                            });
                          }

                          setBaseSalary(baseSalaryValue);
                          setAllowances(response.salary.allowances || []);
                          setDeductions(response.salary.deductions || []);
                          const effectiveDateObj = dayjs(
                            response.salary.effectiveDate
                          );
                          setEffectiveMonth(effectiveDateObj.month() + 1);
                          setEffectiveYear(effectiveDateObj.year());
                          setEndDate(
                            response.salary.endDate
                              ? dayjs(response.salary.endDate)
                              : null
                          );
                          setStatus(response.salary.status);
                          setNotes(response.salary.notes || '');
                        } else {
                          // No salary assigned - use defaults from payroll config
                          setSelectedSalary(null);

                          if (config && config.basePayComponents) {
                            setBasePayComponents({
                              basic: config.basePayComponents.basic || 0,
                              houseRent:
                                config.basePayComponents.houseRent || 0,
                              medical: config.basePayComponents.medical || 0,
                              transport:
                                config.basePayComponents.transport || 0,
                            });
                            const totalBaseSalary =
                              (config.basePayComponents.basic || 0) +
                              (config.basePayComponents.houseRent || 0) +
                              (config.basePayComponents.medical || 0) +
                              (config.basePayComponents.transport || 0);
                            setBaseSalary(totalBaseSalary);
                          } else {
                            setBasePayComponents({
                              basic: response.defaults.baseSalary || 0,
                              houseRent: 0,
                              medical: 0,
                              transport: 0,
                            });
                            setBaseSalary(response.defaults.baseSalary);
                          }

                          setAllowances([...response.defaults.allowances]);
                          setDeductions([...response.defaults.deductions]);
                          const effectiveDateObj = dayjs(
                            response.defaults.effectiveDate
                          );
                          setEffectiveMonth(effectiveDateObj.month() + 1);
                          setEffectiveYear(effectiveDateObj.year());
                          setEndDate(null);
                          setStatus('active');
                          setNotes('');
                        }
                      } catch (error) {
                        console.error('Failed to load employee salary:', error);
                        snackbar.error('Failed to load salary information');
                      }
                    }
                  }}
                  label='Select Employee'
                  sx={{
                    color: darkMode ? '#fff' : '#000',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.divider,
                    },
                    '& .MuiSelect-select': {
                      textAlign: inputTextAlign,
                    },
                  }}
                >
                  {employees
                    .filter(item => {
                      return (
                        item.salary === null &&
                        item.employee.status === 'active'
                      );
                    })
                    .map(item => (
                      <MenuItem key={item.employee.id} value={item.employee.id}>
                        {`${item.employee.user.first_name} ${item.employee.user.last_name}`}{' '}
                        - {item.employee.user.email}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            )}

            <Box>
              <Typography
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                variant='h6'
                sx={{
                  mb: 2,
                  fontWeight: 600,
                  color: darkMode ? '#fff' : '#000',
                  textAlign: language === 'ar' ? 'right' : 'left',
                }}
              >
                {L.basePayComponentsTitle}
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
                    label={
                      key === 'basic'
                        ? L.basicLabel
                        : key === 'houseRent'
                          ? L.houseRentLabel
                          : key === 'medical'
                            ? L.medicalLabel
                            : key === 'transport'
                              ? L.transportLabel
                              : key.charAt(0).toUpperCase() + key.slice(1)
                    }
                    type='number'
                    dir={inputDir}
                    inputProps={{
                      min: 0,
                      dir: inputDir,
                      style: { textAlign: inputTextAlign },
                    }}
                    value={value === 0 ? '' : value}
                    onChange={e => {
                      const inputValue = e.target.value;
                      const numValue =
                        inputValue === ''
                          ? ''
                          : Math.max(0, parseFloat(inputValue) || 0);
                      setBasePayComponents(prev => ({
                        ...prev,
                        [key]: numValue,
                      }));
                      // Update total base salary
                      const updated = {
                        ...basePayComponents,
                        [key]: numValue,
                      };
                      const total =
                        (typeof updated.basic === 'string' &&
                        updated.basic === ''
                          ? 0
                          : updated.basic || 0) +
                        (typeof updated.houseRent === 'string' &&
                        updated.houseRent === ''
                          ? 0
                          : updated.houseRent || 0) +
                        (typeof updated.medical === 'string' &&
                        updated.medical === ''
                          ? 0
                          : updated.medical || 0) +
                        (typeof updated.transport === 'string' &&
                        updated.transport === ''
                          ? 0
                          : updated.transport || 0);
                      setBaseSalary(total === 0 ? '' : total);
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: darkMode ? '#fff' : '#000',
                      },
                      '& .MuiInputLabel-root': {
                        color: darkMode ? '#8f8f8f' : '#666',
                      },
                    }}
                  />
                ))}
              </Box>
              <Typography
                variant='caption'
                sx={{
                  color: darkMode ? '#8f8f8f' : '#666',
                  mt: 1,
                  display: 'block',
                }}
              >
                {L.totalBaseSalaryLabel}:{' '}
                {formatCurrency(
                  (typeof basePayComponents.basic === 'string' &&
                  basePayComponents.basic === ''
                    ? 0
                    : basePayComponents.basic || 0) +
                    (typeof basePayComponents.houseRent === 'string' &&
                    basePayComponents.houseRent === ''
                      ? 0
                      : basePayComponents.houseRent || 0) +
                    (typeof basePayComponents.medical === 'string' &&
                    basePayComponents.medical === ''
                      ? 0
                      : basePayComponents.medical || 0) +
                    (typeof basePayComponents.transport === 'string' &&
                    basePayComponents.transport === ''
                      ? 0
                      : basePayComponents.transport || 0)
                )}
              </Typography>
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
                <Typography
                  variant='h6'
                  sx={{ color: darkMode ? '#fff' : '#000' }}
                >
                  {L.allowances}
                </Typography>
                <Button
                  size='small'
                  startIcon={<AddIcon />}
                  onClick={handleAddAllowance}
                >
                  {L.addAllowance}
                </Button>
              </Box>
              {allowances.map((allowance, index) => (
                <Paper
                  key={index}
                  sx={{
                    p: 2,
                    mb: 2,
                    backgroundColor: darkMode ? '#2d2d2d' : '#f9f9f9',
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <TextField
                      fullWidth
                      label={L.typeLabel}
                      value={allowance.type}
                      onChange={e =>
                        handleUpdateAllowance(index, 'type', e.target.value)
                      }
                      size='small'
                      dir={inputDir}
                      inputProps={{ style: { textAlign: inputTextAlign } }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: darkMode ? '#fff' : '#000',
                        },
                        '& .MuiInputLabel-root': {
                          color: darkMode ? '#8f8f8f' : '#666',
                        },
                      }}
                    />
                    <TextField
                      fullWidth
                      label={L.amountLabel}
                      type='number'
                      value={allowance.amount === 0 ? '' : allowance.amount}
                      onChange={e => {
                        const value = e.target.value;
                        const numValue =
                          value === ''
                            ? ''
                            : Math.max(0, parseFloat(value) || 0);
                        handleUpdateAllowance(index, 'amount', numValue);
                      }}
                      size='small'
                      dir={inputDir}
                      inputProps={{
                        min: 0,
                        dir: inputDir,
                        style: { textAlign: inputTextAlign },
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: darkMode ? '#fff' : '#000',
                        },
                        '& .MuiInputLabel-root': {
                          color: darkMode ? '#8f8f8f' : '#666',
                        },
                      }}
                    />
                    <TextField
                      fullWidth
                      label={L.percentageLabel}
                      type='number'
                      value={
                        allowance.percentage === 0 ? '' : allowance.percentage
                      }
                      onChange={e => {
                        const value = e.target.value;
                        const numValue =
                          value === ''
                            ? ''
                            : Math.max(0, parseFloat(value) || 0);
                        handleUpdateAllowance(index, 'percentage', numValue);
                      }}
                      size='small'
                      dir={inputDir}
                      inputProps={{
                        min: 0,
                        dir: inputDir,
                        style: { textAlign: inputTextAlign },
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: darkMode ? '#fff' : '#000',
                        },
                        '& .MuiInputLabel-root': {
                          color: darkMode ? '#8f8f8f' : '#666',
                        },
                      }}
                    />
                    <IconButton
                      onClick={() => handleRemoveAllowance(index)}
                      size='small'
                    >
                      <CloseIcon />
                    </IconButton>
                  </Box>
                  <TextField
                    fullWidth
                    label={L.descriptionLabel}
                    value={allowance.description || ''}
                    onChange={e =>
                      handleUpdateAllowance(
                        index,
                        'description',
                        e.target.value
                      )
                    }
                    multiline
                    rows={2}
                    size='small'
                    dir={inputDir}
                    inputProps={{ style: { textAlign: inputTextAlign } }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: darkMode ? '#fff' : '#000',
                      },
                      '& .MuiInputLabel-root': {
                        color: darkMode ? '#8f8f8f' : '#666',
                      },
                    }}
                  />
                </Paper>
              ))}
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
                <Typography
                  variant='h6'
                  sx={{ color: darkMode ? '#fff' : '#000' }}
                >
                  {L.deductions}
                </Typography>
                <Button
                  size='small'
                  startIcon={<AddIcon />}
                  onClick={handleAddDeduction}
                >
                  {L.addDeduction}
                </Button>
              </Box>
              {deductions.map((deduction, index) => (
                <Paper
                  key={index}
                  sx={{
                    p: 2,
                    mb: 2,
                    backgroundColor: darkMode ? '#2d2d2d' : '#f9f9f9',
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <TextField
                      fullWidth
                      label={L.typeLabel}
                      value={deduction.type}
                      onChange={e =>
                        handleUpdateDeduction(index, 'type', e.target.value)
                      }
                      size='small'
                      dir={inputDir}
                      inputProps={{ style: { textAlign: inputTextAlign } }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: darkMode ? '#fff' : '#000',
                        },
                        '& .MuiInputLabel-root': {
                          color: darkMode ? '#8f8f8f' : '#666',
                        },
                      }}
                    />
                    <TextField
                      fullWidth
                      label={L.amountLabel}
                      type='number'
                      value={deduction.amount === 0 ? '' : deduction.amount}
                      onChange={e => {
                        const value = e.target.value;
                        const numValue =
                          value === ''
                            ? ''
                            : Math.max(0, parseFloat(value) || 0);
                        handleUpdateDeduction(index, 'amount', numValue);
                      }}
                      size='small'
                      dir={inputDir}
                      inputProps={{
                        min: 0,
                        dir: inputDir,
                        style: { textAlign: inputTextAlign },
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: darkMode ? '#fff' : '#000',
                        },
                        '& .MuiInputLabel-root': {
                          color: darkMode ? '#8f8f8f' : '#666',
                        },
                      }}
                    />
                    <TextField
                      fullWidth
                      label={L.percentageLabel}
                      type='number'
                      value={
                        deduction.percentage === 0 ? '' : deduction.percentage
                      }
                      onChange={e => {
                        const value = e.target.value;
                        const numValue =
                          value === ''
                            ? ''
                            : Math.max(0, parseFloat(value) || 0);
                        handleUpdateDeduction(index, 'percentage', numValue);
                      }}
                      size='small'
                      dir={inputDir}
                      inputProps={{
                        min: 0,
                        dir: inputDir,
                        style: { textAlign: inputTextAlign },
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: darkMode ? '#fff' : '#000',
                        },
                        '& .MuiInputLabel-root': {
                          color: darkMode ? '#8f8f8f' : '#666',
                        },
                      }}
                    />
                    <IconButton
                      onClick={() => handleRemoveDeduction(index)}
                      size='small'
                    >
                      <CloseIcon />
                    </IconButton>
                  </Box>
                  <TextField
                    fullWidth
                    label={L.descriptionLabel}
                    value={deduction.description || ''}
                    onChange={e =>
                      handleUpdateDeduction(
                        index,
                        'description',
                        e.target.value
                      )
                    }
                    multiline
                    rows={2}
                    size='small'
                    dir={inputDir}
                    inputProps={{ style: { textAlign: inputTextAlign } }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: darkMode ? '#fff' : '#000',
                      },
                      '& .MuiInputLabel-root': {
                        color: darkMode ? '#8f8f8f' : '#666',
                      },
                    }}
                  />
                </Paper>
              ))}
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: darkMode ? '#8f8f8f' : '#666' }}>
                  {L.effectiveMonthLabel}
                </InputLabel>
                <Select
                  value={effectiveMonth}
                  onChange={e => setEffectiveMonth(Number(e.target.value))}
                  label={L.effectiveMonthLabel}
                  dir={inputDir}
                  sx={{
                    color: darkMode ? '#fff' : '#000',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.divider,
                    },
                    '& .MuiSelect-select': {
                      textAlign: inputTextAlign,
                    },
                  }}
                >
                  {monthOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label={L.effectiveYearLabel}
                type='number'
                dir={inputDir}
                inputProps={{ style: { textAlign: inputTextAlign } }}
                value={effectiveYear === 0 ? '' : effectiveYear}
                onChange={e => {
                  const value = e.target.value;
                  const numValue =
                    value === '' ? '' : Math.max(0, Number(value) || 0);
                  setEffectiveYear(numValue);
                }}
                sx={{
                  width: '100%',
                  '& .MuiOutlinedInput-root': {
                    color: darkMode ? '#fff' : '#000',
                  },
                  '& .MuiInputLabel-root': {
                    color: darkMode ? '#8f8f8f' : '#666',
                  },
                }}
              />
            </Box>
            <Typography
              variant='caption'
              sx={{
                color: darkMode ? '#8f8f8f' : '#666',
                mt: -1,
                mb: 1,
                textAlign: language === 'ar' ? 'right' : 'left',
              }}
            >
              {L.effectiveDateNote}
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Box sx={{ mt: 2 }}>
                <DatePicker
                  label={L.endDateOptional}
                  value={endDate}
                  onChange={(newValue: unknown) => {
                    if (newValue === null) {
                      setEndDate(null);
                    } else if (dayjs.isDayjs(newValue)) {
                      setEndDate(newValue);
                    } else {
                      setEndDate(dayjs(newValue as string | Date));
                    }
                  }}
                  renderInput={params => (
                    <TextField
                      {...params}
                      fullWidth
                      dir={inputDir}
                      inputProps={{
                        ...(params.inputProps || {}),
                        style: { textAlign: inputTextAlign },
                      }}
                      sx={{
                        width: '100%',
                        '& .MuiOutlinedInput-root': {
                          color: darkMode ? '#fff' : '#000',
                        },
                        '& .MuiInputLabel-root': {
                          color: darkMode ? '#8f8f8f' : '#666',
                        },
                      }}
                    />
                  )}
                />
              </Box>
            </LocalizationProvider>

            <FormControl fullWidth>
              <InputLabel sx={{ color: darkMode ? '#8f8f8f' : '#666' }}>
                {L.statusLabel}
              </InputLabel>
              <Select
                value={status}
                onChange={e =>
                  setStatus(e.target.value as 'active' | 'inactive')
                }
                label={L.statusLabel}
                dir={inputDir}
                sx={{
                  color: darkMode ? '#fff' : '#000',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.divider,
                  },
                  '& .MuiSelect-select': {
                    textAlign: inputTextAlign,
                  },
                }}
              >
                <MenuItem value='active'>{L.activeLabel}</MenuItem>
                <MenuItem value='inactive'>{L.inactiveLabel}</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label={L.notesLabel}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              multiline
              rows={3}
              dir={inputDir}
              inputProps={{ style: { textAlign: inputTextAlign } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: darkMode ? '#fff' : '#000',
                },
                '& .MuiInputLabel-root': {
                  color: darkMode ? '#8f8f8f' : '#666',
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            p: 3,
            pt: 2,
            justifyContent: language === 'ar' ? 'flex-start' : 'flex-end',
          }}
        >
          <Button
            onClick={() => {
              setEditModalOpen(false);
              setPayrollConfig(null);
              setConfigLoading(false);
            }}
            sx={{ mr: language === 'ar' ? 1 : 0 }}
          >
            {L.cancel}
          </Button>
          <Button
            variant='contained'
            onClick={handleSaveSalary}
            disabled={!isFormValid() || (!!selectedSalary && !hasChanges())}
            sx={{ ml: language === 'ar' ? 0 : 1 }}
          >
            {selectedSalary ? L.updateBtn : L.createBtn}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeSalaryPage;
