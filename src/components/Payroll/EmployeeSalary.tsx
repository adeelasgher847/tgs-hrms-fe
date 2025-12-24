import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Paper,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  TextField,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Pagination,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { useTheme } from '@mui/material/styles';
import { useIsDarkMode } from '../../theme';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { IoEyeOutline } from 'react-icons/io5';
import { Icons } from '../../assets/icons';
import {
  payrollApi,
  type EmployeeSalary,
  type EmployeeSalaryAllowance,
  type EmployeeSalaryDeduction,
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
import { PAGINATION } from '../../constants/appConstants';
import AppTable from '../common/AppTable';
import AppDropdown from '../common/AppDropdown';
import AppFormModal from '../common/AppFormModal';

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
  const currentUser = getCurrentUser();
  const role = normalizeRole(getUserRole());

  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<EmployeeSalaryListItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = PAGINATION.DEFAULT_PAGE_SIZE;
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

  // `baseSalary` state was previously used for display but base components
  // are now tracked in `basePayComponents`. Keep no separate baseSalary state.
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
    } catch {
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
    } catch {
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
      } catch {
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

        // total base salary is derived from `basePayComponents`

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
        // reset base salary via basePayComponents
        setAllowances([]);
        setDeductions([]);
      }
    } catch {
      // Use empty defaults if config fails to load
      setBasePayComponents({
        basic: 0,
        houseRent: 0,
        medical: 0,
        transport: 0,
      });
      // reset base salary via basePayComponents
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

        // base salary value derived from components; no separate state
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
          // total base salary is derived from `basePayComponents`
        } else {
          // Use defaults from API response
          setBasePayComponents({
            basic: response.defaults.baseSalary || 0,
            houseRent: 0,
            medical: 0,
            transport: 0,
          });
          // base salary value derived from defaults via basePayComponents
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
    } catch {
      snackbar.error('Failed to load salary information');
    }
  };

  const handleSaveSalary = async () => {
    try {
      if (!selectedEmployeeId && !currentEmployeeId) {
        snackbar.error('Please select an employee');
        return;
      }

      const employeeId = selectedEmployeeId || currentEmployeeId;
      if (!employeeId) {
        snackbar.error('Employee ID is required');
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
        snackbar.success('Salary structure updated successfully');
      } else {
        await payrollApi.createEmployeeSalary({
          employee_id: employeeId,
          ...salaryData,
        });
        snackbar.success('Salary structure created successfully');
      }

      setEditModalOpen(false);
      setPayrollConfig(null);
      setConfigLoading(false);
      if (isAdminRole) {
        loadAllEmployeeSalaries();
      } else {
        loadMySalary();
      }
    } catch {
      snackbar.error('Failed to save salary structure');
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
    basePayComponents.basic,
    basePayComponents.houseRent,
    basePayComponents.medical,
    basePayComponents.transport,
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
    basePayComponents.basic,
    basePayComponents.houseRent,
    basePayComponents.medical,
    basePayComponents.transport,
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
          <Alert severity='info'>
            No salary structure has been assigned to you yet.
          </Alert>
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
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography
            variant='h4'
            sx={{ fontWeight: 600, color: darkMode ? '#fff' : '#000' }}
          >
            My Salary Structure
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
              Base Salary
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
                Allowances
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
        '& .MuiButton-contained': {
          backgroundColor: 'var(--primary-dark-color)',
          '&:hover': { backgroundColor: 'var(--primary-dark-color)' },
        },
        '& .MuiButton-outlined': {
          borderColor: 'var(--primary-dark-color)',
          color: 'var(--primary-dark-color)',
          '&:hover': {
            borderColor: 'var(--primary-dark-color)',
            backgroundColor: 'var(--primary-color)',
          },
        },
      }}
    >
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography
          variant='h4'
          sx={{
            fontWeight: 600,
            fontSize: { xs: '32px', lg: '48px' },
            color: darkMode ? '#fff' : '#000',
          }}
        >
          Employee Salary Structure
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
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
            Add Salary Structure
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
          <AppTable>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{ color: darkMode ? '#fff' : '#000', fontWeight: 600 }}
                >
                  Employee
                </TableCell>
                <TableCell
                  sx={{ color: darkMode ? '#fff' : '#000', fontWeight: 600 }}
                >
                  Department
                </TableCell>
                <TableCell
                  sx={{ color: darkMode ? '#fff' : '#000', fontWeight: 600 }}
                >
                  Designation
                </TableCell>
                <TableCell
                  sx={{ color: darkMode ? '#fff' : '#000', fontWeight: 600 }}
                >
                  Base Salary
                </TableCell>
                <TableCell
                  sx={{ color: darkMode ? '#fff' : '#000', fontWeight: 600 }}
                >
                  Status
                </TableCell>
                <TableCell
                  sx={{ color: darkMode ? '#fff' : '#000', fontWeight: 600 }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map(item => (
                <TableRow key={item.employee.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                      : 'Not Assigned'}
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
                      <Chip label='inactive' size='small' />
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
                            <IoEyeOutline size={20} />
                          </IconButton>
                          <IconButton
                            size='small'
                            onClick={() => handleEditSalary(item)}
                            sx={{ color: theme.palette.primary.main }}
                          >
                            <Box
                              component='img'
                              src={Icons.edit}
                              alt='Edit'
                              sx={{ width: 20, height: 20 }}
                            />
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
                              setEditModalOpen(true);
                            } catch {
                              snackbar.error('Failed to load salary defaults');
                            }
                          }}
                        >
                          Assign
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </AppTable>
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
              Showing page {currentPage} of {totalPages} ({totalRecords} total
              records)
            </Typography>
          </Box>
        )}
      </Paper>

      <AppFormModal
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        onSubmit={() => {}}
        title={
          selectedEmployee
            ? `${selectedEmployee.employee.user.first_name} ${selectedEmployee.employee.user.last_name} - Salary Structure`
            : 'Salary Structure'
        }
        cancelLabel='Close'
        showSubmitButton={false}
        maxWidth='md'
        paperSx={{ backgroundColor: darkMode ? '#1e1e1e' : '#fff' }}
      >
        <Box sx={{ pr: 1 }}>
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
                  variant='h6'
                  sx={{ mb: 1, color: darkMode ? '#fff' : '#000' }}
                >
                  Base Salary
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
                      variant='h6'
                      sx={{ mb: 2, color: darkMode ? '#fff' : '#000' }}
                    >
                      Allowances
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
                            Amount: {formatCurrency(allowance.amount)} |
                            Percentage: {formatPercentage(allowance.percentage)}
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
                      variant='h6'
                      sx={{ mb: 2, color: darkMode ? '#fff' : '#000' }}
                    >
                      Deductions
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
                            Amount: {formatCurrency(deduction.amount)} |
                            Percentage: {formatPercentage(deduction.percentage)}
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
                    Effective Date
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
                      End Date
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
                    Status
                  </Typography>
                  <Chip
                    label={selectedSalary.status}
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
                      Notes
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
                    variant='h6'
                    sx={{
                      mb: 2,
                      color: darkMode ? '#fff' : '#000',
                      fontWeight: 600,
                    }}
                  >
                    Salary History
                  </Typography>
                  {historyLoading ? (
                    <Box
                      sx={{ display: 'flex', justifyContent: 'center', p: 2 }}
                    >
                      <CircularProgress size={24} />
                    </Box>
                  ) : (
                    <AppTable
                      component={Paper}
                      sx={{
                        backgroundColor: darkMode ? '#2d2d2d' : '#f9f9f9',
                        border: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <TableHead>
                        <TableRow>
                          <TableCell
                            sx={{
                              color: darkMode ? '#fff' : '#000',
                              fontWeight: 600,
                            }}
                          >
                            Effective Date
                          </TableCell>
                          <TableCell
                            sx={{
                              color: darkMode ? '#fff' : '#000',
                              fontWeight: 600,
                            }}
                          >
                            End Date
                          </TableCell>
                          <TableCell
                            sx={{
                              color: darkMode ? '#fff' : '#000',
                              fontWeight: 600,
                            }}
                          >
                            Base Salary
                          </TableCell>
                          <TableCell
                            sx={{
                              color: darkMode ? '#fff' : '#000',
                              fontWeight: 600,
                            }}
                          >
                            Status
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
                                  ? dayjs(salary.endDate).format('MMM DD, YYYY')
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
                    </AppTable>
                  )}
                </Box>
              )}
            </Box>
          ) : (
            <Alert severity='info'>No salary structure assigned</Alert>
          )}
        </Box>
      </AppFormModal>

      <AppFormModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setPayrollConfig(null);
          setConfigLoading(false);
        }}
        onSubmit={handleSaveSalary}
        title={selectedSalary ? 'Edit Salary Structure' : 'Create Salary Structure'}
        submitLabel={selectedSalary ? 'Update' : 'Create'}
        cancelLabel='Cancel'
        hasChanges={isFormValid() && (!selectedSalary || hasChanges())}
        maxWidth='md'
        paperSx={{ backgroundColor: darkMode ? '#1e1e1e' : '#fff' }}
      >
        <Box sx={{ pr: 1 }}>
          {!selectedSalary && payrollConfig && (
            <Typography
              variant='caption'
              sx={{
                color: darkMode ? '#8f8f8f' : '#666',
                display: 'block',
                fontStyle: 'italic',
                mb: 1,
              }}
            >
              Pre-filled with current payroll configuration defaults
            </Typography>
          )}
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
                  Current Payroll Configuration
                </Typography>
                <Typography variant='caption' sx={{ display: 'block' }}>
                  Base Salary:{' '}
                  {formatCurrency(payrollConfig.basePayComponents?.basic || 0)}{' '}
                  • Allowances: {payrollConfig.allowances?.length || 0} •
                  Deductions:{' '}
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
              <AppDropdown
                label='Select Employee'
                value={selectedEmployeeId || ''}
                onChange={async (e: SelectChangeEvent<string | number>) => {
                  const employeeId = String(e.target.value || '');
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
                                (config.basePayComponents.medical || 0) * ratio
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

                        // base salary is derived from `basePayComponents`
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
                            houseRent: config.basePayComponents.houseRent || 0,
                            medical: config.basePayComponents.medical || 0,
                            transport: config.basePayComponents.transport || 0,
                          });
                          // total base salary is derived from `basePayComponents`
                        } else {
                          setBasePayComponents({
                            basic: response.defaults.baseSalary || 0,
                            houseRent: 0,
                            medical: 0,
                            transport: 0,
                          });
                          // defaults applied to `basePayComponents`
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
                    } catch {
                      snackbar.error('Failed to load salary information');
                    }
                  }
                }}
                options={employees
                  .filter(item => item.salary === null && item.employee.status === 'active')
                  .map(item => ({
                    value: item.employee.id,
                    label: `${item.employee.user.first_name} ${item.employee.user.last_name} - ${item.employee.user.email}`,
                  }))}
                placeholder='Select Employee'
                showLabel={false}
                inputBackgroundColor={darkMode ? '#2d2d2d' : '#fff'}
                containerSx={{ width: '100%' }}
                sx={{
                  '& .MuiSelect-select': {
                    color: darkMode ? '#fff' : '#000',
                  },
                  '& .MuiSelect-icon': {
                    color: darkMode ? '#fff' : '#000',
                  },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: theme.palette.divider,
                    },
                  },
                }}
              />
            )}

            <Box>
              <Typography
                variant='h6'
                sx={{
                  mb: 2,
                  fontWeight: 600,
                  color: darkMode ? '#fff' : '#000',
                }}
              >
                Base Pay Components
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
                      key.charAt(0).toUpperCase() +
                      key.slice(1).replace(/([A-Z])/g, ' $1')
                    }
                    type='number'
                    inputProps={{ min: 0 }}
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
                      // Update local base pay components; total computed elsewhere
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
                Total Base Salary:{' '}
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
                  Allowances
                </Typography>
                <Button
                  size='small'
                  startIcon={<AddIcon />}
                  onClick={handleAddAllowance}
                >
                  Add Allowance
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
                      label='Type'
                      value={allowance.type}
                      onChange={e =>
                        handleUpdateAllowance(index, 'type', e.target.value)
                      }
                      size='small'
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
                      label='Amount'
                      type='number'
                      inputProps={{ min: 0 }}
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
                      label='Percentage'
                      type='number'
                      inputProps={{ min: 0 }}
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
                    label='Description'
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
                  Deductions
                </Typography>
                <Button
                  size='small'
                  startIcon={<AddIcon />}
                  onClick={handleAddDeduction}
                >
                  Add Deduction
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
                      label='Type'
                      value={deduction.type}
                      onChange={e =>
                        handleUpdateDeduction(index, 'type', e.target.value)
                      }
                      size='small'
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
                      label='Amount'
                      type='number'
                      inputProps={{ min: 0 }}
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
                      label='Percentage'
                      type='number'
                      inputProps={{ min: 0 }}
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
                    label='Description'
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
              <AppDropdown
                label='Effective Month'
                value={effectiveMonth}
                onChange={(e: SelectChangeEvent<string | number>) =>
                  setEffectiveMonth(Number(e.target.value))
                }
                options={monthOptions.map(option => ({
                  value: option.value,
                  label: option.label,
                }))}
                placeholder='Effective Month'
                showLabel={false}
                inputBackgroundColor={darkMode ? '#2d2d2d' : '#fff'}
                containerSx={{ width: '100%' }}
                sx={{
                  '& .MuiSelect-select': {
                    color: darkMode ? '#fff' : '#000',
                  },
                  '& .MuiSelect-icon': {
                    color: darkMode ? '#fff' : '#000',
                  },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: theme.palette.divider,
                    },
                  },
                }}
              />
              <TextField
                label='Effective Year'
                type='number'
                inputProps={{ min: 0 }}
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
              sx={{ color: darkMode ? '#8f8f8f' : '#666', mt: -1, mb: 1 }}
            >
              Effective date will be set to the 1st of the selected month
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Box sx={{ mt: 2 }}>
                <DatePicker
                  label='End Date (Optional)'
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
            </LocalizationProvider>

            <AppDropdown
              label='Status'
              value={status}
              onChange={(e: SelectChangeEvent<string | number>) =>
                setStatus(e.target.value as 'active' | 'inactive')
              }
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              placeholder='Status'
              showLabel={false}
              inputBackgroundColor={darkMode ? '#2d2d2d' : '#fff'}
              containerSx={{ width: '100%' }}
              sx={{
                '& .MuiSelect-select': {
                  color: darkMode ? '#fff' : '#000',
                },
                '& .MuiSelect-icon': {
                  color: darkMode ? '#fff' : '#000',
                },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: theme.palette.divider,
                  },
                },
              }}
            />

            <TextField
              fullWidth
              label='Notes (Optional)'
              value={notes}
              onChange={e => setNotes(e.target.value)}
              multiline
              rows={3}
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
        </Box>
      </AppFormModal>
    </Box>
  );
};

export default EmployeeSalaryPage;
