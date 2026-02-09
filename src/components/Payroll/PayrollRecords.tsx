import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Chip,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import dayjs from 'dayjs';
import { useTheme } from '@mui/material/styles';
import { useOutletContext } from 'react-router-dom';
import GenerateIcon from '@mui/icons-material/PlayCircleFilledRounded';
import { IoEyeOutline } from 'react-icons/io5';
import { useUser } from '../../hooks/useUser';
import { Icons } from '../../assets/icons';
import {
  payrollApi,
  type PayrollRecord,
  type PayrollStatus,
} from '../../api/payrollApi';
import { snackbar } from '../../utils/snackbar';
import { useIsDarkMode } from '../../theme';
import dayjsPluginLocalizedFormat from 'dayjs/plugin/localizedFormat';
import { isSystemAdmin, isHRAdmin, isAdmin } from '../../utils/roleUtils';
import { PAGINATION } from '../../constants/appConstants';
import AppTable from '../common/AppTable';
import AppCard from '../common/AppCard';
import AppButton from '../common/AppButton';
import AppDropdown from '../common/AppDropdown';
import AppFormModal from '../common/AppFormModal';
import AppPageTitle from '../common/AppPageTitle';
import AppInputField from '../common/AppInputField';
import AppSearch from '../common/AppSearch';

dayjs.extend(dayjsPluginLocalizedFormat);

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

const yearOptions = Array.from({ length: 11 }, (_, i) => {
  const year = dayjs().year() - 5 + i;
  return { label: year.toString(), value: year };
}).reverse();

type UIStatus = 'unpaid' | 'paid';
const statusOptions: UIStatus[] = ['unpaid', 'paid'];

const mapStatusToBackend = (uiStatus: UIStatus): PayrollStatus => {
  if (uiStatus === 'paid') return 'paid';
  return 'pending';
};

const mapStatusFromBackend = (backendStatus: string): UIStatus => {
  if (backendStatus === 'paid') return 'paid';
  return 'unpaid';
};

const formatCurrency = (value: number | string | undefined) => {
  if (value === undefined || value === null) return '-';
  const numberValue = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(numberValue)) return String(value);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(numberValue);
};

const PayrollRecords: React.FC = () => {
  const theme = useTheme();
  const darkMode = useIsDarkMode();

  const outletContext = useOutletContext<{ darkMode?: boolean }>();
  const outletDarkMode = outletContext?.darkMode;
  const effectiveDarkMode =
    typeof outletDarkMode === 'boolean' ? outletDarkMode : darkMode;

  const userContext = useUser();
  const user = userContext?.user;
  const userRole = user?.role;

  const isSystemAdminUser = isSystemAdmin(userRole);
  const isHrAdminUser = isHRAdmin(userRole);
  const isTenantAdminUser = isAdmin(userRole);
  const canGeneratePayroll =
    isSystemAdminUser || isHrAdminUser || isTenantAdminUser;

  const currentDate = dayjs();
  const [month, setMonth] = useState<number>(currentDate.month() + 1);
  const [year, setYear] = useState<number | ''>(currentDate.year());
  const [employeeFilter, setEmployeeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = PAGINATION.DEFAULT_PAGE_SIZE;
  const [employees, setEmployees] = useState<
    Array<{
      id: string;
      name: string;
      salary?: {
        effectiveDate: string;
        endDate?: string | null;
        status: string;
      } | null;
    }>
  >([]);
  const [generateMonth, setGenerateMonth] = useState<number>(
    currentDate.month() + 1
  );
  const [generateYear, setGenerateYear] = useState<number | ''>(
    currentDate.year()
  );
  const [generateEmployeeId, setGenerateEmployeeId] = useState<string>('');
  const [generating, setGenerating] = useState<boolean>(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState<boolean>(false);

  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(
    null
  );
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);

  const [statusDialogOpen, setStatusDialogOpen] = useState<boolean>(false);
  const [statusRecord, setStatusRecord] = useState<PayrollRecord | null>(null);
  const [statusValue, setStatusValue] = useState<'unpaid' | 'paid'>('unpaid');
  const [statusRemarks, setStatusRemarks] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);

  const [historyRecords, setHistoryRecords] = useState<PayrollRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const bgColor = effectiveDarkMode
    ? '#121212'
    : theme.palette.background.default;
  const cardBg = effectiveDarkMode ? '#1a1a1a' : '#fff';
  const textColor = effectiveDarkMode ? '#fff' : '#000';

  const totals = useMemo(() => {
    if (!records.length) {
      return { gross: 0, deductions: 0, bonuses: 0, net: 0 };
    }
    return records.reduce(
      (acc, record) => {
        const gross = Number(record.grossSalary) || 0;
        const deductions = Number(record.totalDeductions) || 0;
        const bonuses = Number(record.bonuses || 0) || 0;
        const net = Number(record.netSalary) || 0;
        return {
          gross: acc.gross + gross,
          deductions: acc.deductions + deductions,
          bonuses: acc.bonuses + bonuses,
          net: acc.net + net,
        };
      },
      { gross: 0, deductions: 0, bonuses: 0, net: 0 }
    );
  }, [records]);

  const isSalaryActiveForPeriod = useCallback(
    (
      salary: {
        effectiveDate: string;
        endDate?: string | null;
        status: string;
      } | null,
      month: number,
      year: number
    ): boolean => {
      if (!salary || salary.status !== 'active') {
        return false;
      }

      const periodStart = dayjs(`${year}-${month}-01`).startOf('month');
      const periodEnd = dayjs(`${year}-${month}-01`).endOf('month');
      const effectiveDate = dayjs(salary.effectiveDate);
      const endDate = salary.endDate ? dayjs(salary.endDate) : null;

      if (effectiveDate.isAfter(periodEnd)) {
        return false;
      }

      if (endDate && endDate.isBefore(periodStart)) {
        return false;
      }

      return true;
    },
    []
  );

  const loadEmployees = useCallback(async () => {
    try {
      let allData: Array<{
        employee: {
          id: string;
          user: {
            first_name: string;
            last_name: string;
          };
          status: string;
        };
        salary: {
          status: string;
          effectiveDate: string;
          endDate?: string | null;
        } | null;
      }> = [];

      try {
        const response = await payrollApi.getAllEmployeeSalaries({
          page: null,
        });
        const data = Array.isArray(response) ? response : response.items || [];
        allData = data;

        if (
          !Array.isArray(response) &&
          response.totalPages &&
          response.totalPages > 1
        ) {
          const promises: Promise<{
            items?: Array<{
              employee: {
                id: string;
                user: {
                  first_name: string;
                  last_name: string;
                };
                status: string;
              };
              salary: {
                status: string;
                effectiveDate: string;
                endDate?: string | null;
              } | null;
            }>;
            totalPages?: number;
          }>[] = [];
          for (let page = 2; page <= response.totalPages; page++) {
            promises.push(
              payrollApi.getAllEmployeeSalaries({
                page,
                limit: PAGINATION.DEFAULT_PAGE_SIZE,
              })
            );
          }
          const additionalResponses = await Promise.all(promises);
          additionalResponses.forEach(resp => {
            const additionalData = Array.isArray(resp)
              ? resp
              : resp.items || [];
            allData = [...allData, ...additionalData];
          });
        }
      } catch {
        const response = await payrollApi.getAllEmployeeSalaries({
          page: 1,
          limit: PAGINATION.DEFAULT_PAGE_SIZE,
        });
        const data = Array.isArray(response) ? response : response.items || [];
        allData = data;
      }

      const mapped = allData
        .filter(
          item =>
            item.salary &&
            item.salary.status === 'active' &&
            item.employee?.status?.toLowerCase() === 'active' &&
            item.employee?.id &&
            item.employee?.user?.first_name &&
            item.employee?.user?.last_name
        )
        .map(item => ({
          id: item.employee.id,
          name: `${item.employee.user.first_name} ${item.employee.user.last_name}`,
          salary: item.salary,
        }));
      setEmployees(mapped);
    } catch {
      setEmployees([]);
    }
  }, []);

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      const yearNum =
        typeof year === 'string' && year === ''
          ? dayjs().year()
          : year || dayjs().year();
      if (statusFilter === 'unpaid') {
        // Fetch first page to learn totalPages
        const first = await payrollApi.getPayrollRecords({
          month,
          year: yearNum,
          page: 1,
          limit: itemsPerPage,
          employee_id: employeeFilter || undefined,
        });

        let allItems = first.items || [];
        const totalPagesFromBackend = first.totalPages || 1;

        if (totalPagesFromBackend > 1) {
          const pages: Promise<{
            items: PayrollRecord[];
            total?: number;
            page?: number;
            totalPages?: number;
          }>[] = [];
          for (let p = 2; p <= totalPagesFromBackend; p++) {
            pages.push(
              payrollApi.getPayrollRecords({
                month,
                year: yearNum,
                page: p,
                limit: itemsPerPage,
                employee_id: employeeFilter || undefined,
              })
            );
          }
          try {
            const more = await Promise.all(pages);
            more.forEach(m => {
              allItems = [...allItems, ...(m.items || [])];
            });
          } catch {
            // swallow and continue with what we have
          }
        }

        // Keep records that are not 'paid' according to mapping
        const filtered = allItems.filter(
          r => mapStatusFromBackend(r.status) !== 'paid'
        );

        const start = (currentPage - 1) * itemsPerPage;
        const paginated = filtered.slice(start, start + itemsPerPage);

        setRecords(paginated);
        const total = filtered.length;
        setTotalRecords(total);
        setTotalPages(total > 0 ? Math.ceil(total / itemsPerPage) : 1);
      } else {
        const response = await payrollApi.getPayrollRecords({
          month,
          year: yearNum,
          page: currentPage,
          limit: itemsPerPage,
          employee_id: employeeFilter || undefined,
          status: statusFilter
            ? mapStatusToBackend(statusFilter as UIStatus)
            : undefined,
        });
        setRecords(response.items || []);
        if (response.totalPages !== undefined) {
          setTotalPages(response.totalPages);
        } else if (response.total !== undefined) {
          setTotalPages(Math.ceil(response.total / itemsPerPage));
        } else {
          const itemsCount = response.items?.length || 0;
          setTotalPages(
            itemsCount > itemsPerPage ? Math.ceil(itemsCount / itemsPerPage) : 1
          );
        }
        setTotalRecords(response.total || response.items?.length || 0);
      }
    } catch {
      snackbar.error('Failed to load payroll records');
      setRecords([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [month, year, currentPage, itemsPerPage, employeeFilter, statusFilter]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  useEffect(() => {
    setEmployeeFilter('');
    setCurrentPage(1);
  }, [month, year]);

  useEffect(() => {
    setCurrentPage(1);
  }, [employeeFilter]);
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

  const openDetails = (record: PayrollRecord) => {
    setSelectedRecord(record);
    setDetailsOpen(true);

    const employeeIdentifier =
      record.employee?.id ||
      record.employee_id ||
      record.employee?.user?.id ||
      '';

    if (!employeeIdentifier) {
      setHistoryRecords([]);
      setHistoryError('Employee information unavailable for this record.');
      return;
    }

    setHistoryLoading(true);
    setHistoryError(null);
    payrollApi
      .getPayrollHistory(employeeIdentifier)
      .then(response => {
        const history = response.items || [];
        const sorted = [...history].sort(
          (a, b) =>
            dayjs(`${b.year}-${b.month}-01`).valueOf() -
            dayjs(`${a.year}-${a.month}-01`).valueOf()
        );
        setHistoryRecords(sorted);
      })
      .catch(() => {
        setHistoryRecords([]);
        setHistoryError('Failed to load payroll history.');
      })
      .finally(() => {
        setHistoryLoading(false);
      });
  };

  const closeDetails = () => {
    setSelectedRecord(null);
    setDetailsOpen(false);
    setHistoryRecords([]);
    setHistoryError(null);
  };

  const openStatusDialog = (record: PayrollRecord) => {
    setStatusRecord(record);
    setStatusValue(mapStatusFromBackend(record.status));
    setStatusRemarks(record.remarks || '');
    setStatusDialogOpen(true);
  };

  const closeStatusDialog = () => {
    setStatusDialogOpen(false);
    setStatusRecord(null);
    setStatusRemarks('');
    setStatusValue('unpaid');
  };

  const handleStatusUpdate = async () => {
    if (!statusRecord) return;
    try {
      setUpdatingStatus(true);
      const backendStatus = mapStatusToBackend(statusValue);
      const updated = await payrollApi.updatePayrollStatus(statusRecord.id, {
        status: backendStatus,
        remarks: statusRemarks || undefined,
      });
      setRecords(prev =>
        prev.map(record =>
          record.id === updated.id ? { ...record, ...updated } : record
        )
      );
      snackbar.success('Payroll status updated successfully');
      closeStatusDialog();
    } catch {
      snackbar.error('Failed to update payroll status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const recordEmployees = useMemo(() => {
    const map = new Map<string, string>();
    records.forEach(record => {
      const id =
        record.employee?.id ||
        record.employee_id ||
        record.employee?.user?.id ||
        '';
      if (!id || map.has(id)) return;
      const name = record.employee?.user
        ? `${record.employee.user.first_name} ${record.employee.user.last_name}`
        : record.employee_id || 'Employee';
      map.set(id, name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [records]);

  const employeesForGenerateDialog = useMemo(() => {
    if (!generateMonth || !generateYear) {
      return [];
    }

    const employeesWithActiveSalary = employees.filter(emp => {
      if (!emp.salary) return false;
      return isSalaryActiveForPeriod(emp.salary, generateMonth, generateYear);
    });

    const existingEmployeeIds = new Set(
      records
        .filter(
          record =>
            record.month === generateMonth && record.year === generateYear
        )
        .map(
          record =>
            record.employee?.id ||
            record.employee_id ||
            record.employee?.user?.id ||
            ''
        )
        .filter(Boolean)
    );

    return employeesWithActiveSalary
      .filter(emp => !existingEmployeeIds.has(emp.id))
      .map(emp => ({ id: emp.id, name: emp.name }));
  }, [
    employees,
    records,
    generateMonth,
    generateYear,
    isSalaryActiveForPeriod,
  ]);

  const displayedRecords = useMemo(() => {
    // Start with all records fetched from backend
    let list = records.slice();

    // Apply status filter (client-side) if provided
    if (statusFilter && String(statusFilter).trim() !== '') {
      list = list.filter(r => mapStatusFromBackend(r.status) === statusFilter);
    }

    // Apply search filter (name/email) if provided
    if (searchQuery && String(searchQuery).trim() !== '') {
      const q = String(searchQuery).toLowerCase().trim();
      list = list.filter(record => {
        const name = record.employee?.user
          ? `${record.employee.user.first_name} ${record.employee.user.last_name}`
          : '';
        const email = record.employee?.user?.email || '';
        return (
          name.toLowerCase().includes(q) || email.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [records, searchQuery, statusFilter]);

  const handleGenerate = useCallback(async () => {
    if (!generateMonth || !generateYear) {
      snackbar.error('Select both month and year to generate payroll');
      return;
    }

    if (generateEmployeeId) {
      const selectedEmployee = employeesForGenerateDialog.find(
        emp => emp.id === generateEmployeeId
      );
      if (!selectedEmployee) {
        snackbar.error(
          'Selected employee is not available for payroll generation. The employee may already have a payroll record for this period or may not have an active salary structure for the selected month/year.'
        );
        return;
      }
    } else {
      if (employeesForGenerateDialog.length === 0) {
        snackbar.error(
          'No employees available for payroll generation. All employees already have payroll records for the selected period or do not have active salary structures for the selected month/year.'
        );
        return;
      }
    }

    try {
      setGenerating(true);
      const response = await payrollApi.generatePayroll({
        month: generateMonth,
        year:
          typeof generateYear === 'string' && generateYear === ''
            ? dayjs().year()
            : generateYear || dayjs().year(),
        employee_id: generateEmployeeId || undefined,
      });

      const yearNum =
        typeof generateYear === 'string' && generateYear === ''
          ? dayjs().year()
          : generateYear || dayjs().year();
      const refreshedResponse = await payrollApi.getPayrollRecords({
        month: generateMonth,
        year: yearNum,
        page: currentPage,
        limit: itemsPerPage,
        employee_id: employeeFilter || undefined,
      });
      const refreshedRecords = refreshedResponse.items || [];
      setTotalPages(refreshedResponse.totalPages || 1);
      setTotalRecords(refreshedResponse.total || 0);

      const previousRecordsCount = records.filter(
        r => r.month === generateMonth && r.year === generateYear
      ).length;
      const newRecordsCount = refreshedRecords.filter(
        r => r.month === generateMonth && r.year === generateYear
      ).length;

      if (newRecordsCount > previousRecordsCount) {
        const generatedCount = newRecordsCount - previousRecordsCount;
        snackbar.success(
          `Payroll generated successfully for ${generatedCount} employee(s)`
        );
      } else if (response && response.length > 0) {
        snackbar.success(
          `Payroll generated successfully for ${response.length} employee(s)`
        );
      } else {
        snackbar.info(
          'No payroll records were generated for the selected period'
        );
      }

      setRecords(refreshedRecords);
      setMonth(generateMonth);
      setYear(
        typeof generateYear === 'string' && generateYear === ''
          ? dayjs().year()
          : generateYear || dayjs().year()
      );
      setGenerateDialogOpen(false);
      setGenerateEmployeeId('');
    } catch {
      snackbar.error('Failed to generate payroll. Please try again.');
    } finally {
      setGenerating(false);
    }
  }, [
    generateMonth,
    generateYear,
    generateEmployeeId,
    employeesForGenerateDialog,
    itemsPerPage,
    employeeFilter,
    statusFilter,
    records,
    currentPage,
  ]);

  const openGenerateDialog = useCallback(() => {
    setGenerateMonth(month);
    setGenerateYear(year);
    setGenerateEmployeeId('');
    setGenerateDialogOpen(true);
  }, [month, year]);

  return (
    <Box
      sx={{
        backgroundColor: bgColor,
        minHeight: '100vh',
        color: textColor,
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
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
          mb: 3,
        }}
      >
        <Box sx={{ width: '100%' }}>
          <AppPageTitle>Payroll Records</AppPageTitle>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
          mb: 3,
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems='flex-start'
          sx={{ width: { xs: '100%', md: 'auto' } }}
        >
          <AppDropdown
            label='Month'
            showLabel={false}
            value={month}
            onChange={(event: SelectChangeEvent<string | number>) =>
              setMonth(Number(event.target.value))
            }
            options={monthOptions.map(option => ({
              value: option.value,
              label: option.label,
            }))}
            placeholder='Month'
            containerSx={{ width: { xs: '100%', md: 160 } }}
            inputBackgroundColor={effectiveDarkMode ? '#1e1e1e' : '#fff'}
            sx={{
              '& .MuiSelect-select': {
                color: effectiveDarkMode ? '#fff' : '#000',
              },
              '& .MuiSelect-icon': {
                color: effectiveDarkMode ? '#fff' : '#000',
              },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: theme.palette.divider },
              },
            }}
          />

          <AppDropdown
            label='Year'
            showLabel={false}
            value={year}
            onChange={(event: SelectChangeEvent<string | number>) =>
              setYear(Number(event.target.value))
            }
            options={yearOptions}
            placeholder='Year'
            containerSx={{ width: { xs: '100%', md: 140 } }}
            inputBackgroundColor={effectiveDarkMode ? '#1e1e1e' : '#fff'}
            sx={{
              '& .MuiSelect-select': {
                color: effectiveDarkMode ? '#fff' : '#000',
              },
              '& .MuiSelect-icon': {
                color: effectiveDarkMode ? '#fff' : '#000',
              },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: theme.palette.divider },
              },
            }}
          />
        </Stack>

        {canGeneratePayroll && (
          <AppButton
            variant='contained'
            variantType='primary'
            startIcon={<GenerateIcon />}
            onClick={openGenerateDialog}
            disabled={generating}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              width: { xs: '100%', md: 'auto' },
            }}
          >
            Generate Payroll
          </AppButton>
        )}
      </Box>

      {records.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            p: 3,
            backgroundColor: cardBg,
            borderRadius: 2,
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(4, minmax(0, 1fr))',
              },
            }}
          >
            {[
              {
                label: 'Total Records',
                value: records.length,
              },
              {
                label: 'Gross Payouts',
                value: formatCurrency(totals.gross),
              },
              {
                label: 'Total Deductions',
                value: formatCurrency(totals.deductions),
              },
              {
                label: 'Net Payouts',
                value: formatCurrency(totals.net),
              },
            ].map(card => (
              <AppCard
                key={card.label}
                compact
                sx={{
                  boxShadow: 'none',
                  textAlign: 'center',
                  backgroundColor: effectiveDarkMode ? '#121212' : '#f8f9fa',
                  border: effectiveDarkMode
                    ? `1px solid ${theme.palette.divider}`
                    : 'none',
                }}
              >
                <Typography
                  variant='caption'
                  sx={{ color: effectiveDarkMode ? '#b5b5b5' : '#666' }}
                >
                  {card.label}
                </Typography>
                <Typography
                  variant='h6'
                  sx={{ fontWeight: 700, color: theme.palette.text.primary }}
                >
                  {card.value}
                </Typography>
              </AppCard>
            ))}
          </Box>
        </Paper>
      )}
      {/* Search bar (using shared AppSearch) placed below the month/year/generate controls */}
      <AppCard sx={{ mb: 3 }}>
        <AppSearch
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setSearchQuery(String(e.target.value || ''));
            setCurrentPage(1);
          }}
          placeholder='Search employee name or email'
          sx={{ borderRadius: 2, width: '100%' }}
        />
      </AppCard>
      <Paper
        elevation={0}
        sx={{
          p: 0,
          backgroundColor: 'transparent',
          boxShadow: 'none',
        }}
      >
        <Box
          sx={{
            py: 2,
            // borderBottom: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <AppDropdown
            value={employeeFilter}
            onChange={(event: SelectChangeEvent<string | number>) =>
              setEmployeeFilter(String(event.target.value || ''))
            }
            options={
              recordEmployees.length === 0
                ? [{ value: '', label: 'No employees for this period' }]
                : [
                    { value: '', label: 'All employees' },
                    ...recordEmployees.map(emp => ({
                      value: emp.id,
                      label: emp.name,
                    })),
                  ]
            }
            label='Employee'
            showLabel={false}
            placeholder={
              recordEmployees.length === 0
                ? 'No employees for this period'
                : 'All employees'
            }
            disabled={recordEmployees.length === 0}
            containerSx={{ minWidth: 220, width: { xs: '100%', md: 'auto' } }}
            inputBackgroundColor={effectiveDarkMode ? '#1e1e1e' : '#fff'}
            sx={{
              '& .MuiSelect-select': {
                color: effectiveDarkMode ? '#fff' : '#000',
              },
              '& .MuiSelect-icon': {
                color: effectiveDarkMode ? '#fff' : '#000',
              },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: theme.palette.divider },
              },
            }}
          />

          <AppDropdown
            value={statusFilter}
            onChange={(event: SelectChangeEvent<string | number>) => {
              setStatusFilter(String(event.target.value || ''));
              setCurrentPage(1);
            }}
            options={[
              { value: '', label: 'All statuses' },
              { value: 'paid', label: 'Paid' },
              { value: 'unpaid', label: 'Unpaid' },
            ]}
            label='Status'
            showLabel={false}
            placeholder='All statuses'
            containerSx={{ minWidth: 230, width: { xs: '100%', md: 'auto' } }}
            inputBackgroundColor={effectiveDarkMode ? '#1e1e1e' : '#fff'}
            sx={{
              '& .MuiSelect-select': {
                color: effectiveDarkMode ? '#fff' : '#000',
              },
              '& .MuiSelect-icon': {
                color: effectiveDarkMode ? '#fff' : '#000',
              },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: theme.palette.divider },
              },
            }}
          />
        </Box>
        {loading ? (
          <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : displayedRecords.length === 0 ? (
          <Box sx={{ p: 4 }}>
            <Alert severity='info' sx={{ backgroundColor: 'transparent' }}>
              No payroll records found.
            </Alert>
          </Box>
        ) : (
          <AppTable>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Period</TableCell>
                <TableCell align='center'>Gross</TableCell>
                <TableCell align='center'>Deductions</TableCell>
                <TableCell align='center'>Net</TableCell>
                <TableCell align='center'>Status</TableCell>
                <TableCell align='center'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedRecords.map(record => (
                <TableRow key={record.id} hover>
                  <TableCell>
                    <Typography
                      variant='subtitle2'
                      sx={{ color: theme.palette.text.primary }}
                    >
                      {record.employee?.user
                        ? `${record.employee.user.first_name} ${record.employee.user.last_name}`
                        : record.employee_id}
                    </Typography>
                    <Typography
                      variant='caption'
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      {record.employee?.user?.email || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {record.month}/{record.year}
                  </TableCell>
                  <TableCell align='center'>
                    {formatCurrency(record.grossSalary)}
                  </TableCell>
                  <TableCell align='center'>
                    {formatCurrency(record.totalDeductions)}
                  </TableCell>
                  <TableCell align='center'>
                    {formatCurrency(record.netSalary)}
                  </TableCell>
                  <TableCell align='center'>
                    <Typography
                      variant='caption'
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        textTransform: 'capitalize',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        backgroundColor:
                          mapStatusFromBackend(record.status) === 'paid'
                            ? theme.palette.success.light
                            : theme.palette.error.light,
                        color:
                          mapStatusFromBackend(record.status) === 'paid'
                            ? theme.palette.success.contrastText
                            : theme.palette.error.contrastText,
                      }}
                    >
                      {mapStatusFromBackend(record.status)
                        .charAt(0)
                        .toUpperCase() +
                        mapStatusFromBackend(record.status).slice(1)}
                    </Typography>
                  </TableCell>
                  <TableCell align='center'>
                    <Stack direction='row' spacing={1} justifyContent='center'>
                      <Tooltip title='View breakdown'>
                        <IconButton
                          size='small'
                          onClick={() => openDetails(record)}
                          sx={{ color: theme.palette.text.primary }}
                        >
                          <IoEyeOutline size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Update status'>
                        <span>
                          <IconButton
                            size='small'
                            onClick={() => openStatusDialog(record)}
                            disabled={updatingStatus}
                          >
                            <Box
                              component='img'
                              src={Icons.edit}
                              alt='Edit'
                              sx={{ width: 18, height: 18 }}
                            />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </AppTable>
        )}
        {!loading && displayedRecords.length > 0 && totalPages > 1 && (
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
        {!loading && displayedRecords.length > 0 && totalRecords > 0 && (
          <Box display='flex' justifyContent='center' pb={2}>
            <Typography variant='body2' color='textSecondary'>
              Showing page {currentPage} of {totalPages} ({totalRecords} total
              records)
            </Typography>
          </Box>
        )}
      </Paper>

      <AppFormModal
        open={detailsOpen && !!selectedRecord}
        onClose={closeDetails}
        onSubmit={() => {}}
        title='Payroll Breakdown'
        cancelLabel='Close'
        showSubmitButton={false}
        maxWidth='md'
        paperSx={{ backgroundColor: effectiveDarkMode ? '#1e1e1e' : '#fff' }}
      >
        {selectedRecord && (
          <Stack spacing={3}>
            <Box>
              <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 1 }}>
                Employee Details
              </Typography>
              <Typography
                variant='body2'
                sx={{ color: effectiveDarkMode ? '#b5b5b5' : '#555' }}
              >
                Name:{' '}
                <strong>
                  {selectedRecord.employee?.user
                    ? `${selectedRecord.employee.user.first_name} ${selectedRecord.employee.user.last_name}`
                    : selectedRecord.employee_id}
                </strong>
              </Typography>
              <Typography
                variant='body2'
                sx={{ color: effectiveDarkMode ? '#b5b5b5' : '#555' }}
              >
                Email: {selectedRecord.employee?.user?.email || '—'}
              </Typography>
              <Typography
                variant='body2'
                sx={{ color: effectiveDarkMode ? '#b5b5b5' : '#555' }}
              >
                PeriodYear: {selectedRecord.month}/{selectedRecord.year}
              </Typography>
            </Box>

            <Divider />

            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))',
                  // md: 'repeat(4, minmax(0, 1fr))',
                },
              }}
            >
              {[
                {
                  label: 'Gross Salary',
                  value: formatCurrency(selectedRecord.grossSalary),
                },
                {
                  label: 'Total Deductions',
                  value: formatCurrency(selectedRecord.totalDeductions),
                },
                {
                  label: 'Bonuses',
                  value: formatCurrency(selectedRecord.bonuses || 0),
                },
                {
                  label: 'Net Salary',
                  value: formatCurrency(selectedRecord.netSalary),
                },
              ].map(card => (
                <Paper
                  key={card.label}
                  elevation={0}
                  sx={{
                    p: 2,
                    backgroundColor: effectiveDarkMode ? '#111' : '#f7f7fa',
                  }}
                >
                  <Typography variant='caption'>{card.label}</Typography>
                  <Typography variant='h6'>{card.value}</Typography>
                </Paper>
              ))}
            </Box>

            {selectedRecord.salaryBreakdown?.allowances &&
              selectedRecord.salaryBreakdown.allowances.length > 0 && (
                <Box>
                  <Typography
                    variant='subtitle1'
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    Allowances
                  </Typography>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell align='right'>Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedRecord.salaryBreakdown.allowances.map(
                        (item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.type}</TableCell>
                            <TableCell>{item.description || '—'}</TableCell>
                            <TableCell align='right'>
                              {formatCurrency(item.amount)}
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </Box>
              )}

            {selectedRecord.deductionsBreakdown && (
              <Box>
                <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 1 }}>
                  Deductions
                </Typography>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align='right'>Amount</TableCell>
                      <TableCell align='right'>Percentage</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Tax</TableCell>
                      <TableCell>—</TableCell>
                      <TableCell align='right'>
                        {formatCurrency(
                          selectedRecord.deductionsBreakdown.tax || 0
                        )}
                      </TableCell>
                      <TableCell align='right'>—</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Insurance</TableCell>
                      <TableCell>—</TableCell>
                      <TableCell align='right'>
                        {formatCurrency(
                          selectedRecord.deductionsBreakdown.insurance || 0
                        )}
                      </TableCell>
                      <TableCell align='right'>—</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Leave Deductions</TableCell>
                      <TableCell>—</TableCell>
                      <TableCell align='right'>
                        {formatCurrency(
                          selectedRecord.deductionsBreakdown.leaveDeductions ||
                            0
                        )}
                      </TableCell>
                      <TableCell align='right'>—</TableCell>
                    </TableRow>
                    {selectedRecord.deductionsBreakdown.otherDeductions?.map(
                      (item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.type}</TableCell>
                          <TableCell align='right'>
                            {formatCurrency(item.amount)}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </Box>
            )}

            {selectedRecord.bonusesBreakdown && (
              <Box>
                <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 1 }}>
                  Bonuses
                </Typography>
                <Table size='small'>
                  <TableBody>
                    <TableRow>
                      <TableCell>Performance Bonus</TableCell>
                      <TableCell align='right'>
                        {formatCurrency(
                          selectedRecord.bonusesBreakdown.performanceBonus || 0
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Overtime Bonus</TableCell>
                      <TableCell align='right'>
                        {formatCurrency(
                          selectedRecord.bonusesBreakdown.overtimeBonus || 0
                        )}
                      </TableCell>
                    </TableRow>
                    {selectedRecord.bonusesBreakdown.otherBonuses?.map(
                      (item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.type}</TableCell>
                          <TableCell align='right'>
                            {formatCurrency(item.amount)}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </Box>
            )}

            <Box sx={{ mt: 4 }}>
              <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 1 }}>
                Payroll History
              </Typography>
              {historyLoading ? (
                <Box sx={{ py: 3, display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress size={24} />
                </Box>
              ) : historyError ? (
                <Alert severity='error'>{historyError}</Alert>
              ) : historyRecords.length === 0 ? (
                <Alert severity='info'>No payroll history available.</Alert>
              ) : (
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Period</TableCell>
                      <TableCell align='right'>Gross</TableCell>
                      <TableCell align='right'>Net</TableCell>
                      <TableCell align='center'>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historyRecords.map(record => {
                      const isCurrent = record.id === selectedRecord?.id;
                      return (
                        <TableRow key={record.id} selected={isCurrent}>
                          <TableCell>{`${record.month}/${record.year}`}</TableCell>
                          <TableCell align='right'>
                            {formatCurrency(record.grossSalary)}
                          </TableCell>
                          <TableCell align='right'>
                            {formatCurrency(record.netSalary)}
                          </TableCell>
                          <TableCell align='center'>
                            <Chip
                              label={
                                mapStatusFromBackend(record.status)
                                  .charAt(0)
                                  .toUpperCase() +
                                mapStatusFromBackend(record.status).slice(1)
                              }
                              size='small'
                              color={
                                mapStatusFromBackend(record.status) === 'paid'
                                  ? 'success'
                                  : 'error'
                              }
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </Box>

            {selectedRecord.remarks && (
              <Box>
                <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 1 }}>
                  Remarks
                </Typography>
                <Typography variant='body2'>
                  {selectedRecord.remarks}
                </Typography>
              </Box>
            )}
          </Stack>
        )}
      </AppFormModal>

      {/* Status dialog */}
      <AppFormModal
        open={statusDialogOpen && !!statusRecord}
        onClose={closeStatusDialog}
        onSubmit={handleStatusUpdate}
        title='Update Payroll Status'
        submitLabel={updatingStatus ? 'Updating...' : 'Update Status'}
        cancelLabel='Cancel'
        isSubmitting={updatingStatus}
        hasChanges={true}
        maxWidth='sm'
        paperSx={{ backgroundColor: effectiveDarkMode ? '#1e1e1e' : '#fff' }}
      >
        {statusRecord && (
          <Stack spacing={2}>
            <Typography
              variant='body2'
              sx={{ color: theme.palette.text.secondary }}
            >
              {statusRecord.employee?.user
                ? `${statusRecord.employee.user.first_name} ${statusRecord.employee.user.last_name}`
                : statusRecord.employee_id}{' '}
              — {statusRecord.month}/{statusRecord.year}
            </Typography>
            <AppDropdown
              label='Status'
              value={statusValue}
              onChange={(event: SelectChangeEvent<string | number>) =>
                setStatusValue(event.target.value as 'unpaid' | 'paid')
              }
              options={statusOptions.map(option => ({
                value: option,
                label: option.charAt(0).toUpperCase() + option.slice(1),
              }))}
              placeholder='Status'
              showLabel
              inputBackgroundColor={effectiveDarkMode ? '#1e1e1e' : '#fff'}
              sx={{
                '& .MuiSelect-select': {
                  color: theme.palette.text.primary,
                },
                '& .MuiSelect-icon': {
                  color: theme.palette.text.primary,
                },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: theme.palette.divider },
                },
              }}
            />
            <TextField
              label='Remarks'
              multiline
              minRows={3}
              value={statusRemarks}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setStatusRemarks(event.target.value)
              }
              placeholder='Optional remarks (e.g. payment method)'
            />
          </Stack>
        )}
      </AppFormModal>

      <AppFormModal
        open={generateDialogOpen}
        onClose={() => setGenerateDialogOpen(false)}
        onSubmit={handleGenerate}
        title='Generate Payroll'
        submitLabel={generating ? 'Generating...' : 'Generate Payroll'}
        cancelLabel='Cancel'
        isSubmitting={generating}
        hasChanges={employeesForGenerateDialog.length > 0}
        maxWidth='sm'
        paperSx={{ backgroundColor: effectiveDarkMode ? '#1e1e1e' : '#fff' }}
      >
        <Stack spacing={2} marginTop={2}>
          <AppDropdown
            label='Month'
            value={generateMonth}
            onChange={(event: SelectChangeEvent<string | number>) =>
              setGenerateMonth(Number(event.target.value))
            }
            options={monthOptions.map(option => ({
              value: option.value,
              label: option.label,
            }))}
            placeholder='Month'
            containerSx={{ minWidth: 160 }}
            inputBackgroundColor={effectiveDarkMode ? '#1e1e1e' : '#fff'}
            sx={{
              '& .MuiSelect-select': {
                color: theme.palette.text.primary,
              },
              '& .MuiSelect-icon': {
                color: theme.palette.text.primary,
              },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: theme.palette.divider },
              },
            }}
          />
          <AppInputField
            label='Year'
            type='number'
            inputProps={{ min: 0 }}
            sx={{ minWidth: 140 }}
            value={generateYear === 0 ? '' : generateYear}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              const value = event.target.value;
              const numValue =
                value === '' ? '' : Math.max(0, Number(value) || 0);
              setGenerateYear(numValue);
            }}
          />
          <AppDropdown
            label='Employee'
            value={generateEmployeeId}
            onChange={(event: SelectChangeEvent<string | number>) =>
              setGenerateEmployeeId(String(event.target.value || ''))
            }
            options={
              employeesForGenerateDialog.length === 0
                ? [
                    {
                      value: '',
                      label:
                        employees.length === 0
                          ? 'No employees with salary configuration'
                          : 'All employees are already processed',
                    },
                  ]
                : [
                    { value: '', label: 'All employees' },
                    ...employeesForGenerateDialog.map(emp => ({
                      value: emp.id,
                      label: emp.name,
                    })),
                  ]
            }
            placeholder={
              employeesForGenerateDialog.length === 0
                ? employees.length === 0
                  ? 'No employees with salary configuration'
                  : 'All employees are already processed'
                : 'All employees'
            }
            disabled={employeesForGenerateDialog.length === 0}
            containerSx={{ minWidth: 220 }}
            inputBackgroundColor={effectiveDarkMode ? '#1e1e1e' : '#fff'}
            sx={{
              '& .MuiSelect-select': {
                color: theme.palette.text.primary,
              },
              '& .MuiSelect-icon': {
                color: theme.palette.text.primary,
              },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: theme.palette.divider },
              },
            }}
          />
          {employeesForGenerateDialog.length === 0 && employees.length > 0 && (
            <Alert severity='warning' sx={{ m: 0 }}>
              All employees already have payroll records for the selected period
              ({generateMonth}/{generateYear}). No new payroll can be generated
              to avoid duplicates.
            </Alert>
          )}
        </Stack>
      </AppFormModal>
    </Box>
  );
};

export default PayrollRecords;
