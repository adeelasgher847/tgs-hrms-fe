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

  const [baseSalary, setBaseSalary] = useState<number>(0);
  const [allowances, setAllowances] = useState<EmployeeSalaryAllowance[]>([]);
  const [deductions, setDeductions] = useState<EmployeeSalaryDeduction[]>([]);
  const [effectiveMonth, setEffectiveMonth] = useState<number>(
    dayjs().month() + 1
  );
  const [effectiveYear, setEffectiveYear] = useState<number>(dayjs().year());
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
      const salary = await payrollApi.getEmployeeSalary(employeeId);
      setMySalary(salary);
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

  const handleAddSalary = () => {
    setSelectedEmployee(null);
    setSelectedSalary(null);
    setSelectedEmployeeId('');
    setBaseSalary(0);
    setAllowances([]);
    setDeductions([]);
    setEffectiveMonth(dayjs().month() + 1);
    setEffectiveYear(dayjs().year());
    setEndDate(null);
    setStatus('active');
    setNotes('');
    setEditModalOpen(true);
  };

  const handleEditSalary = (employee: EmployeeSalaryListItem) => {
    if (!employee.salary) return;
    setSelectedEmployee(employee);
    setSelectedSalary(employee.salary);
    setSelectedEmployeeId(employee.employee.id);
    setBaseSalary(
      typeof employee.salary.baseSalary === 'string'
        ? parseFloat(employee.salary.baseSalary)
        : employee.salary.baseSalary
    );
    setAllowances(employee.salary.allowances || []);
    setDeductions(employee.salary.deductions || []);
    const effectiveDateObj = dayjs(employee.salary.effectiveDate);
    setEffectiveMonth(effectiveDateObj.month() + 1);
    setEffectiveYear(effectiveDateObj.year());
    setEndDate(employee.salary.endDate ? dayjs(employee.salary.endDate) : null);
    setStatus(employee.salary.status);
    setNotes(employee.salary.notes || '');
    setEditModalOpen(true);
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

      const effectiveDate = dayjs(
        `${effectiveYear}-${effectiveMonth}-01`
      ).format('YYYY-MM-DD');

      const salaryData = {
        baseSalary,
        allowances,
        deductions,
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
      if (isAdminRole) {
        loadAllEmployeeSalaries();
      } else {
        loadMySalary();
      }
    } catch (error) {
      console.error('Failed to save salary:', error);
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
    value: string | number
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
    value: string | number
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
    if (baseSalary <= 0) {
      return false;
    }
    if (!effectiveMonth || !effectiveYear) {
      return false;
    }
    for (const allowance of allowances) {
      if (
        !allowance.type ||
        allowance.type.trim() === '' ||
        allowance.amount < 0 ||
        allowance.percentage < 0
      ) {
        return false;
      }
    }
    for (const deduction of deductions) {
      if (
        !deduction.type ||
        deduction.type.trim() === '' ||
        deduction.amount < 0 ||
        deduction.percentage < 0
      ) {
        return false;
      }
    }
    return true;
  }, [
    selectedSalary,
    selectedEmployeeId,
    currentEmployeeId,
    baseSalary,
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
    if (currentBaseSalary !== baseSalary) return true;

    const currentEffectiveDate = dayjs(
      `${effectiveYear}-${effectiveMonth}-01`
    ).format('YYYY-MM-DD');
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
          <TableContainer>
            <Table>
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
                            onClick={() => {
                              setSelectedEmployee(item);
                              setSelectedSalary(null);
                              setSelectedEmployeeId(item.employee.id);
                              setBaseSalary(0);
                              setAllowances([]);
                              setDeductions([]);
                              setEffectiveMonth(dayjs().month() + 1);
                              setEffectiveYear(dayjs().year());
                              setEndDate(null);
                              setStatus('active');
                              setNotes('');
                              setEditModalOpen(true);
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
              Showing page {currentPage} of {totalPages} ({totalRecords} total
              records)
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
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: darkMode ? '#fff' : '#000',
            pb: 2,
          }}
        >
          <Typography variant='h6' sx={{ fontWeight: 600 }}>
            {selectedEmployee
              ? `${selectedEmployee.employee.user.first_name} ${selectedEmployee.employee.user.last_name} - Salary Structure`
              : 'Salary Structure'}
          </Typography>
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
        </DialogTitle>
        <DialogContent sx={{ pt: 3, maxHeight: '70vh', overflowY: 'auto' }}>
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
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button onClick={() => setViewModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        maxWidth='md'
        fullWidth
        PaperProps={{
          sx: { borderRadius: 1, bgcolor: darkMode ? '#1e1e1e' : '#fff' },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: darkMode ? '#fff' : '#000',
            pb: 2,
          }}
        >
          <Typography variant='h6' sx={{ fontWeight: 600 }}>
            {selectedSalary
              ? 'Edit Salary Structure'
              : 'Create Salary Structure'}
          </Typography>
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
        </DialogTitle>
        <DialogContent sx={{ pt: 3, maxHeight: '70vh', overflowY: 'auto' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3,marginTop: 2 }}>
            {!selectedSalary && (
              <FormControl fullWidth>
                <InputLabel sx={{ color: darkMode ? '#8f8f8f' : '#666' }}>
                  Select Employee
                </InputLabel>
                <Select
                  value={selectedEmployeeId}
                  onChange={e => setSelectedEmployeeId(e.target.value)}
                  label='Select Employee'
                  sx={{
                    color: darkMode ? '#fff' : '#000',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.divider,
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

            <TextField
              fullWidth
              label='Base Salary'
              type='number'
              value={baseSalary}
              onChange={e => setBaseSalary(parseFloat(e.target.value) || 0)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: darkMode ? '#fff' : '#000',
                },
                '& .MuiInputLabel-root': {
                  color: darkMode ? '#8f8f8f' : '#666',
                },
              }}
            />

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
                      value={allowance.amount}
                      onChange={e =>
                        handleUpdateAllowance(
                          index,
                          'amount',
                          parseFloat(e.target.value) || 0
                        )
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
                      label='Percentage'
                      type='number'
                      value={allowance.percentage}
                      onChange={e =>
                        handleUpdateAllowance(
                          index,
                          'percentage',
                          parseFloat(e.target.value) || 0
                        )
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
                      value={deduction.amount}
                      onChange={e =>
                        handleUpdateDeduction(
                          index,
                          'amount',
                          parseFloat(e.target.value) || 0
                        )
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
                      label='Percentage'
                      type='number'
                      value={deduction.percentage}
                      onChange={e =>
                        handleUpdateDeduction(
                          index,
                          'percentage',
                          parseFloat(e.target.value) || 0
                        )
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
              <FormControl fullWidth>
                <InputLabel sx={{ color: darkMode ? '#8f8f8f' : '#666' }}>
                  Effective Month
                </InputLabel>
                <Select
                  value={effectiveMonth}
                  onChange={e => setEffectiveMonth(Number(e.target.value))}
                  label='Effective Month'
                  sx={{
                    color: darkMode ? '#fff' : '#000',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.divider,
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
                label='Effective Year'
                type='number'
                value={effectiveYear}
                onChange={e =>
                  setEffectiveYear(Number(e.target.value) || effectiveYear)
                }
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

            <FormControl fullWidth>
              <InputLabel sx={{ color: darkMode ? '#8f8f8f' : '#666' }}>
                Status
              </InputLabel>
              <Select
                value={status}
                onChange={e =>
                  setStatus(e.target.value as 'active' | 'inactive')
                }
                label='Status'
                sx={{
                  color: darkMode ? '#fff' : '#000',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.divider,
                  },
                }}
              >
                <MenuItem value='active'>Active</MenuItem>
                <MenuItem value='inactive'>Inactive</MenuItem>
              </Select>
            </FormControl>

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
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
          <Button
            variant='contained'
            onClick={handleSaveSalary}
            disabled={!isFormValid() || (!!selectedSalary && !hasChanges())}
          >
            {selectedSalary ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeSalaryPage;
