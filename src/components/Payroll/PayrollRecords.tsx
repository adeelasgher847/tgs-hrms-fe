import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Chip,
} from '@mui/material';
import dayjs from 'dayjs';
import { useTheme } from '@mui/material/styles';
import { useOutletContext } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import GenerateIcon from '@mui/icons-material/PlayCircleFilledRounded';
import { useUser } from '../../hooks/useUser';
import {
  payrollApi,
  type PayrollRecord,
  type PayrollStatus,
} from '../../api/payrollApi';
import { snackbar } from '../../utils/snackbar';
import { useIsDarkMode } from '../../theme';
import dayjsPluginLocalizedFormat from 'dayjs/plugin/localizedFormat';
import { isSystemAdmin, isHRAdmin, isAdmin } from '../../utils/roleUtils';

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

  const { language } = useLanguage();

  const labels = {
    en: {
      title: 'Payroll Records',
      month: 'Month',
      year: 'Year',
      employee: 'Employee',
      allEmployees: 'All employees',
      noEmployeesForPeriod: 'No employees for this period',
      generatePayroll: 'Generate Payroll',
      selectBothMonthYear: 'Select both month and year to generate payroll',
      totalRecords: 'Total Records',
      grossPayouts: 'Gross Payouts',
      totalDeductions: 'Total Deductions',
      netPayouts: 'Net Payouts',
      noPayrollRecordsFound: 'No payroll records found.',
      employeeSelectAll: 'All employees',
      noEmployeesAvailableForGenerate:
        'No employees available for payroll generation. All employees already have payroll records for the selected period or do not have active salary structures for the selected month/year.',
      selectedEmployeeNotAvailable:
        'Selected employee is not available for payroll generation. The employee may already have a payroll record for this period or may not have an active salary structure for the selected month/year.',
      noRecordsGenerated:
        'No payroll records were generated for the selected period',
      generatedSuccessFor: (n: number) =>
        `Payroll generated successfully for ${n} employee(s)`,
      failedGenerate: 'Failed to generate payroll. Please try again.',
      updateStatusDialogTitle: 'Update Payroll Status',
      statusLabel: 'Status',
      remarksLabel: 'Remarks',
      remarksPlaceholder: 'Optional remarks (e.g. payment method)',
      cancel: 'Cancel',
      updating: 'Updating...',
      updateStatusBtn: 'Update Status',
      generateDialogTitle: 'Generate Payroll',
      noEmployeesWithSalaryConfig: 'No employees with salary configuration',
      allEmployeesAlreadyProcessed: 'All employees are already processed',
      employeesAlreadyHaveRecordsAlert:
        'All employees already have payroll records for the selected period. No new payroll can be generated to avoid duplicates.',
      generating: 'Generating...',
      employeeDetails: 'Employee Details',
      nameLabel: 'Name',
      emailLabel: 'Email',
      grossSalaryLabel: 'Gross Salary',
      totalDeductionsLabel: 'Total Deductions',
      bonusesLabel: 'Bonuses',
      netSalaryLabel: 'Net Salary',
      allowancesLabel: 'Allowances',
      deductionsLabel: 'Deductions',
      payrollHistoryLabel: 'Payroll History',
      typeLabel: 'Type',
      descriptionLabel: 'Description',
      amountLabel: 'Amount',
      percentageLabel: 'Percentage',
      periodLabel: 'Period',
      grossLabel: 'Gross',
      netLabel: 'Net',
      table: {
        employee: 'Employee',
        period: 'Period',
        gross: 'Gross',
        deductions: 'Deductions',
        net: 'Net',
        status: 'Status',
        actions: 'Actions',
      },
      showingInfo: (page: number, totalPages: number, total: number) =>
        `Showing page ${page} of ${totalPages} (${total} total records)`,
      tooltipView: 'View breakdown',
      tooltipUpdate: 'Update status',
    },
    ar: {
      title: 'سجلات الرواتب',
      month: 'الشهر',
      year: 'السنة',
      employee: 'الموظف',
      allEmployees: 'جميع الموظفين',
      noEmployeesForPeriod: 'لا يوجد موظفين لهذه الفترة',
      generatePayroll: 'توليد الرواتب',
      selectBothMonthYear: 'حدد كل من الشهر والسنة لتوليد الرواتب',
      totalRecords: 'إجمالي السجلات',
      grossPayouts: 'إجمالي المدفوعات',
      totalDeductions: 'إجمالي الخصومات',
      netPayouts: 'صافي المدفوعات',
      noPayrollRecordsFound: 'لم يتم العثور على سجلات رواتب.',
      employeeSelectAll: 'جميع الموظفين',
      noEmployeesAvailableForGenerate:
        'لا يوجد موظفين متاحين لتوليد الرواتب. جميع الموظفين لديهم سجلات بالفعل للفترة المحددة أو ليس لديهم هياكل رواتب نشطة للشهر/السنة المحددين.',
      selectedEmployeeNotAvailable:
        'الموظف المحدد غير متاح لتوليد الرواتب. قد يكون لدى الموظف بالفعل سجل رواتب لهذه الفترة أو قد لا يكون لديه هيكل راتب نشط للشهر/السنة المحددين.',
      noRecordsGenerated: 'لم يتم توليد أي سجلات رواتب للفترة المحددة',
      generatedSuccessFor: (n: number) =>
        `تم توليد الرواتب بنجاح لـ ${n} موظف(ين)`,
      failedGenerate: 'فشل في توليد الرواتب. حاول مرة أخرى.',
      updateStatusDialogTitle: 'تحديث حالة الرواتب',
      statusLabel: 'الحالة',
      remarksLabel: 'ملاحظات',
      remarksPlaceholder: 'ملاحظات اختيارية (مثال: طريقة الدفع)',
      cancel: 'إلغاء',
      updating: 'جارٍ التحديث...',
      updateStatusBtn: 'تحديث الحالة',
      generateDialogTitle: 'توليد الرواتب',
      noEmployeesWithSalaryConfig: 'لا يوجد موظفين لديهم تكوين راتب',
      allEmployeesAlreadyProcessed: 'تمت معالجة جميع الموظفين بالفعل',
      employeesAlreadyHaveRecordsAlert:
        'جميع الموظفين لديهم سجلات رواتب بالفعل للفترة المحددة. لا يمكن توليد سجلات جديدة لتجنب التكرار.',
      generating: 'جارٍ التوليد...',
      employeeDetails: 'تفاصيل الموظف',
      nameLabel: 'الاسم',
      emailLabel: 'البريد الإلكتروني',
      grossSalaryLabel: 'الراتب الإجمالي',
      totalDeductionsLabel: 'إجمالي الخصومات',
      bonusesLabel: 'المكافآت',
      netSalaryLabel: 'صافي الراتب',
      allowancesLabel: 'البدلات',
      deductionsLabel: 'الخصومات',
      payrollHistoryLabel: 'تاريخ الرواتب',
      typeLabel: 'النوع',
      descriptionLabel: 'الوصف',
      amountLabel: 'المبلغ',
      percentageLabel: 'النسبة',
      periodLabel: 'الفترة',
      grossLabel: 'الإجمالي',
      netLabel: 'الصافي',
      table: {
        employee: 'الموظف',
        period: 'الفترة',
        gross: 'الإجمالي',
        deductions: 'الخصومات',
        net: 'الصافي',
        status: 'الحالة',
        actions: 'الإجراءات',
      },
      showingInfo: (page: number, totalPages: number, total: number) =>
        `عرض الصفحة ${page} من ${totalPages} (${total} إجمالي السجلات)`,
      tooltipView: 'عرض التفاصيل',
      tooltipUpdate: 'تحديث الحالة',
    },
  } as const;

  const L = labels[language as 'en' | 'ar'] || labels.en;
  const pageLabels = {
    en: { showingInfo: labels.en.showingInfo },
    ar: { showingInfo: labels.ar.showingInfo },
  } as const;
  const PL = pageLabels[language as 'en' | 'ar'] || pageLabels.en;

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
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = 25;
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
              payrollApi.getAllEmployeeSalaries({ page, limit: 25 })
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
      } catch (error) {
        console.error('Error fetching employees:', error);
        const response = await payrollApi.getAllEmployeeSalaries({
          page: 1,
          limit: 25,
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
    } catch (error) {
      console.error('Failed to load employees:', error);
      setEmployees([]);
    }
  }, []);

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Loading payroll records with pagination:', {
        month,
        year,
        page: currentPage,
        limit: itemsPerPage,
        employee_id: employeeFilter || undefined,
      });
      const yearNum =
        typeof year === 'string' && year === ''
          ? dayjs().year()
          : year || dayjs().year();
      const response = await payrollApi.getPayrollRecords({
        month,
        year: yearNum,
        page: currentPage,
        limit: itemsPerPage,
        employee_id: employeeFilter || undefined,
      });
      console.log('Payroll records response:', {
        itemsCount: response.items?.length || 0,
        total: response.total,
        totalPages: response.totalPages,
        page: response.page,
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
    } catch (error) {
      console.error('Failed to load payroll records:', error);
      snackbar.error('Failed to load payroll records');
      setRecords([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [month, year, currentPage, itemsPerPage, employeeFilter]);

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
      .catch(error => {
        console.error('Failed to load payroll history:', error);
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
    } catch (error) {
      console.error('Failed to update payroll status:', error);
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

  const displayedRecords = records;

  const handleGenerate = useCallback(async () => {
    if (!generateMonth || !generateYear) {
      snackbar.error(
        L.selectBothMonthYear ||
          'Select both month and year to generate payroll'
      );
      return;
    }

    if (generateEmployeeId) {
      const selectedEmployee = employeesForGenerateDialog.find(
        emp => emp.id === generateEmployeeId
      );
      if (!selectedEmployee) {
        snackbar.error(L.selectedEmployeeNotAvailable);
        return;
      }
    } else {
      if (employeesForGenerateDialog.length === 0) {
        snackbar.error(L.noEmployeesAvailableForGenerate);
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
        snackbar.success(L.generatedSuccessFor(generatedCount));
      } else if (response && Array.isArray(response) && response.length > 0) {
        snackbar.success(L.generatedSuccessFor(response.length));
      } else {
        snackbar.info(L.noRecordsGenerated);
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
    } catch (error) {
      console.error('Failed to generate payroll:', error);
      snackbar.error(L.failedGenerate);
    } finally {
      setGenerating(false);
    }
  }, [
    generateMonth,
    generateYear,
    generateEmployeeId,
    currentPage,
    itemsPerPage,
    employeesForGenerateDialog,
    records,
    employeeFilter,
    L,
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
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: {
            xs: 'column',
            md: language === 'ar' ? 'row-reverse' : 'row',
          },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant='h4'
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            sx={{
              fontWeight: 600,
              color: textColor,
              textAlign: language === 'ar' ? 'right' : 'left',
            }}
          >
            {L.title}
          </Typography>
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
        >
          <TextField
            select
            label={L.month}
            value={month}
            size='small'
            sx={{ minWidth: 160 }}
            onChange={event => setMonth(Number(event.target.value))}
          >
            {monthOptions.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label={L.year}
            type='number'
            inputProps={{ min: 0 }}
            size='small'
            sx={{ minWidth: 140 }}
            value={year === 0 ? '' : year}
            onChange={event => {
              const value = event.target.value;
              const numValue =
                value === '' ? '' : Math.max(0, Number(value) || 0);
              setYear(numValue);
            }}
          />
        </Stack>

        {canGeneratePayroll && (
          <Button
            variant='contained'
            startIcon={<GenerateIcon />}
            onClick={openGenerateDialog}
            disabled={generating}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {L.generatePayroll}
          </Button>
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
            border: `1px solid ${theme.palette.divider}`,
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
                label: L.totalRecords,
                value: records.length,
              },
              {
                label: L.grossPayouts,
                value: formatCurrency(totals.gross),
              },
              {
                label: L.totalDeductions,
                value: formatCurrency(totals.deductions),
              },
              {
                label: L.netPayouts,
                value: formatCurrency(totals.net),
              },
            ].map(card => (
              <Paper
                key={card.label}
                elevation={0}
                sx={{
                  p: 2,
                  textAlign: 'center',
                  backgroundColor: effectiveDarkMode ? '#121212' : '#f8f9fa',
                  borderRadius: 2,
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
                  sx={{ fontWeight: 700, color: textColor }}
                >
                  {card.value}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Paper>
      )}

      <Paper
        elevation={0}
        sx={{
          p: 0,
          backgroundColor: cardBg,
          borderRadius: 1,
        }}
      >
        <Box
          sx={{
            p: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          <TextField
            select
            label={L.employee}
            size='small'
            sx={{ minWidth: 220 }}
            value={employeeFilter}
            onChange={event => setEmployeeFilter(event.target.value)}
          >
            <MenuItem value=''>{L.allEmployees}</MenuItem>
            {recordEmployees.length === 0 ? (
              <MenuItem value='' disabled>
                {L.noEmployeesForPeriod}
              </MenuItem>
            ) : (
              recordEmployees.map(emp => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.name}
                </MenuItem>
              ))
            )}
          </TextField>
        </Box>
        {loading ? (
          <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : displayedRecords.length === 0 ? (
          <Box sx={{ p: 4 }}>
            <Alert severity='info' sx={{ backgroundColor: 'transparent' }}>
              {L.noPayrollRecordsFound}
            </Alert>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{L.table.employee}</TableCell>
                  <TableCell>{L.table.period}</TableCell>
                  <TableCell align='right'>{L.table.gross}</TableCell>
                  <TableCell align='right'>{L.table.deductions}</TableCell>
                  <TableCell align='right'>{L.table.net}</TableCell>
                  <TableCell align='center'>{L.table.status}</TableCell>
                  <TableCell align='center'>{L.table.actions}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayedRecords.map(record => (
                  <TableRow key={record.id} hover>
                    <TableCell>
                      <Typography variant='subtitle2' sx={{ color: textColor }}>
                        {record.employee?.user
                          ? `${record.employee.user.first_name} ${record.employee.user.last_name}`
                          : record.employee_id}
                      </Typography>
                      <Typography
                        variant='caption'
                        sx={{ color: effectiveDarkMode ? '#b5b5b5' : '#666' }}
                      >
                        {record.employee?.user?.email || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {record.month}/{record.year}
                    </TableCell>
                    <TableCell align='right'>
                      {formatCurrency(record.grossSalary)}
                    </TableCell>
                    <TableCell align='right'>
                      {formatCurrency(record.totalDeductions)}
                    </TableCell>
                    <TableCell align='right'>
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
                      <Stack
                        direction='row'
                        spacing={1}
                        justifyContent='center'
                      >
                        <Tooltip title={L.tooltipView || 'View breakdown'}>
                          <IconButton
                            size='small'
                            onClick={() => openDetails(record)}
                          >
                            <VisibilityIcon fontSize='small' />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={L.tooltipUpdate || 'Update status'}>
                          <span>
                            <IconButton
                              size='small'
                              onClick={() => openStatusDialog(record)}
                              disabled={updatingStatus}
                            >
                              <EditIcon fontSize='small' />
                            </IconButton>
                          </span>
                        </Tooltip>
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
        {!loading && totalRecords > 0 && (
          <Box display='flex' justifyContent='center' pb={2}>
            <Typography variant='body2' color='textSecondary'>
              {PL.showingInfo(currentPage, totalPages, totalRecords)}
            </Typography>
          </Box>
        )}
      </Paper>

      <Dialog
        open={detailsOpen && !!selectedRecord}
        onClose={closeDetails}
        maxWidth='md'
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            backgroundColor: effectiveDarkMode ? '#1e1e1e' : '#fff',
          },
        }}
      >
        <DialogTitle
          dir={language === 'ar' ? 'rtl' : 'ltr'}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: textColor,
            pb: 2,
            textAlign: language === 'ar' ? 'right' : 'left',
          }}
        >
          <Typography variant='h6' sx={{ fontWeight: 600 }}>
            {L.employeeDetails}
          </Typography>
          <IconButton
            onClick={closeDetails}
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
        <DialogContent
          dir={language === 'ar' ? 'rtl' : 'ltr'}
          sx={{ backgroundColor: effectiveDarkMode ? '#1e1e1e' : '#fff' }}
        >
          {selectedRecord && (
            <Stack spacing={3}>
              <Box>
                <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 1 }}>
                  {L.employeeDetails}
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ color: effectiveDarkMode ? '#b5b5b5' : '#555' }}
                >
                  {L.nameLabel}:{' '}
                  <Box component='span' dir='ltr' sx={{ fontWeight: 600 }}>
                    {selectedRecord.employee?.user
                      ? `${selectedRecord.employee.user.first_name} ${selectedRecord.employee.user.last_name}`
                      : selectedRecord.employee_id}
                  </Box>
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ color: effectiveDarkMode ? '#b5b5b5' : '#555' }}
                >
                  {L.emailLabel}:{' '}
                  <Box component='span' dir='ltr'>
                    {selectedRecord.employee?.user?.email || '—'}
                  </Box>
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ color: effectiveDarkMode ? '#b5b5b5' : '#555' }}
                >
                  {L.month}/{L.year}:{' '}
                  <Box component='span' dir='ltr'>
                    {selectedRecord.month}/{selectedRecord.year}
                  </Box>
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
                    md: 'repeat(4, minmax(0, 1fr))',
                  },
                }}
              >
                {[
                  {
                    label: L.grossSalaryLabel,
                    value: formatCurrency(selectedRecord.grossSalary),
                  },
                  {
                    label: L.totalDeductionsLabel,
                    value: formatCurrency(selectedRecord.totalDeductions),
                  },
                  {
                    label: L.bonusesLabel,
                    value: formatCurrency(selectedRecord.bonuses || 0),
                  },
                  {
                    label: L.netSalaryLabel,
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
                      {L.allowancesLabel}
                    </Typography>
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell>{L.typeLabel}</TableCell>
                          <TableCell>{L.descriptionLabel}</TableCell>
                          <TableCell align='right'>{L.amountLabel}</TableCell>
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
                  <Typography
                    variant='subtitle1'
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    {L.deductionsLabel}
                  </Typography>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>{L.typeLabel}</TableCell>
                        <TableCell>{L.descriptionLabel}</TableCell>
                        <TableCell align='right'>{L.amountLabel}</TableCell>
                        <TableCell align='right'>{L.percentageLabel}</TableCell>
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
                            selectedRecord.deductionsBreakdown
                              .leaveDeductions || 0
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
                  <Typography
                    variant='subtitle1'
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    {L.bonusesLabel}
                  </Typography>
                  <Table size='small'>
                    <TableBody>
                      <TableRow>
                        <TableCell>Performance Bonus</TableCell>
                        <TableCell align='right'>
                          {formatCurrency(
                            selectedRecord.bonusesBreakdown.performanceBonus ||
                              0
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
                  {L.payrollHistoryLabel}
                </Typography>
                {historyLoading ? (
                  <Box
                    sx={{ py: 3, display: 'flex', justifyContent: 'center' }}
                  >
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
                        <TableCell>{L.periodLabel}</TableCell>
                        <TableCell align='right'>{L.grossLabel}</TableCell>
                        <TableCell align='right'>{L.netLabel}</TableCell>
                        <TableCell align='center'>{L.table.status}</TableCell>
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
                  <Typography
                    variant='subtitle1'
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    Remarks
                  </Typography>
                  <Typography variant='body2'>
                    {selectedRecord.remarks}
                  </Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            p: 2,
            justifyContent: language === 'ar' ? 'flex-end' : 'flex-start',
          }}
        >
          <Box dir='ltr'>
            <Button onClick={closeDetails}>{L.cancel}</Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Status dialog */}
      <Dialog
        open={statusDialogOpen && !!statusRecord}
        onClose={closeStatusDialog}
        maxWidth='sm'
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            backgroundColor: effectiveDarkMode ? '#1e1e1e' : '#fff',
          },
        }}
      >
        <DialogTitle
          dir={language === 'ar' ? 'rtl' : 'ltr'}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexDirection: language === 'ar' ? 'row-reverse' : 'row',
            color: textColor,
            pb: 2,
            textAlign: language === 'ar' ? 'right' : 'left',
          }}
        >
          {language === 'ar' && (
            <IconButton
              onClick={closeStatusDialog}
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
            component='span'
            sx={{
              fontWeight: 600,
              flex: 1,
              textAlign: language === 'ar' ? 'right' : 'left',
            }}
          >
            {L.updateStatusDialogTitle}
          </Box>

          {language !== 'ar' && (
            <IconButton
              onClick={closeStatusDialog}
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
        <DialogContent>
          {statusRecord && (
            <Stack spacing={2}>
              <Typography
                variant='body2'
                sx={{ color: effectiveDarkMode ? '#b5b5b5' : '#555' }}
              >
                {statusRecord.employee?.user
                  ? `${statusRecord.employee.user.first_name} ${statusRecord.employee.user.last_name}`
                  : statusRecord.employee_id}{' '}
                — {statusRecord.month}/{statusRecord.year}
              </Typography>
              <TextField
                select
                label={L.statusLabel}
                value={statusValue}
                onChange={event =>
                  setStatusValue(event.target.value as 'unpaid' | 'paid')
                }
              >
                {statusOptions.map(option => (
                  <MenuItem key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label={L.remarksLabel}
                multiline
                minRows={3}
                value={statusRemarks}
                onChange={event => setStatusRemarks(event.target.value)}
                placeholder={L.remarksPlaceholder}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            p: 2,
            justifyContent: language === 'ar' ? 'flex-start' : 'flex-end',
          }}
        >
          <Box dir='ltr'>
            <Button
              onClick={closeStatusDialog}
              sx={{ mr: language === 'ar' ? 1 : 0 }}
            >
              {L.cancel}
            </Button>
            <Button
              onClick={handleStatusUpdate}
              variant='contained'
              disabled={updatingStatus}
              startIcon={
                updatingStatus ? <CircularProgress size={16} /> : undefined
              }
              sx={{ textTransform: 'none', ml: language === 'ar' ? 0 : 1 }}
            >
              {updatingStatus ? L.updating : L.updateStatusBtn}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      <Dialog
        open={generateDialogOpen}
        onClose={() => setGenerateDialogOpen(false)}
        maxWidth='sm'
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            backgroundColor: effectiveDarkMode ? '#1e1e1e' : '#fff',
          },
        }}
      >
        <DialogTitle
          dir={language === 'ar' ? 'rtl' : 'ltr'}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexDirection: language === 'ar' ? 'row-reverse' : 'row',
            color: textColor,
            pb: 0,
            pt: 1,
            textAlign: language === 'ar' ? 'right' : 'left',
          }}
        >
          <Box
            component='span'
            sx={{ fontWeight: 600, order: language === 'ar' ? 2 : 1 }}
          >
            {L.generateDialogTitle}
          </Box>
          <IconButton
            onClick={() => setGenerateDialogOpen(false)}
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
          sx={{ pt: 3, direction: 'ltr', maxHeight: '70vh', overflowY: 'auto' }}
        >
          <Stack spacing={2} marginTop={2}>
            <TextField
              select
              label={L.month}
              value={generateMonth}
              size='small'
              sx={{ minWidth: 160 }}
              onChange={event => setGenerateMonth(Number(event.target.value))}
            >
              {monthOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={L.year}
              type='number'
              inputProps={{ min: 0 }}
              size='small'
              sx={{ minWidth: 140 }}
              value={generateYear === 0 ? '' : generateYear}
              onChange={event => {
                const value = event.target.value;
                const numValue =
                  value === '' ? '' : Math.max(0, Number(value) || 0);
                setGenerateYear(numValue);
              }}
            />
            <TextField
              select
              label={L.employee}
              size='small'
              sx={{ minWidth: 220 }}
              value={generateEmployeeId}
              onChange={event => setGenerateEmployeeId(event.target.value)}
            >
              <MenuItem value=''>{L.allEmployees}</MenuItem>
              {employeesForGenerateDialog.length === 0 ? (
                <MenuItem value='' disabled>
                  {employees.length === 0
                    ? L.noEmployeesWithSalaryConfig
                    : L.allEmployeesAlreadyProcessed}
                </MenuItem>
              ) : (
                employeesForGenerateDialog.map(emp => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </MenuItem>
                ))
              )}
            </TextField>
            {employeesForGenerateDialog.length === 0 &&
              employees.length > 0 && (
                <Alert severity='warning' sx={{ m: 0 }}>
                  {L.employeesAlreadyHaveRecordsAlert} ({generateMonth}/
                  {generateYear}). No new payroll can be generated to avoid
                  duplicates.
                </Alert>
              )}
          </Stack>
        </DialogContent>
        <DialogActions
          sx={{
            p: 2,
            justifyContent: language === 'ar' ? 'flex-start' : 'flex-end',
          }}
        >
          <Box dir='ltr'>
            <Button
              onClick={() => setGenerateDialogOpen(false)}
              sx={{ mr: language === 'ar' ? 1 : 0 }}
            >
              {L.cancel}
            </Button>
            <Button
              onClick={handleGenerate}
              variant='contained'
              disabled={generating || employeesForGenerateDialog.length === 0}
              startIcon={
                generating ? <CircularProgress size={16} /> : undefined
              }
              sx={{ textTransform: 'none', ml: language === 'ar' ? 0 : 1 }}
              title={
                employeesForGenerateDialog.length === 0
                  ? L.noEmployeesAvailableForGenerate
                  : ''
              }
            >
              {generating ? L.generating : L.generatePayroll}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PayrollRecords;
