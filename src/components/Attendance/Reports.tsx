import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  CircularProgress,
  Tooltip,
  IconButton,
  Pagination,
  TextField,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import {
  leaveReportApi,
  type EmployeeReport,
  type LeaveSummaryItem,
} from '../../api/leaveReportApi';
import { useIsDarkMode } from '../../theme';
import { useLanguage } from '../../hooks/useLanguage';

const getCardStyle = (darkMode: boolean) => ({
  flex: '1 1 calc(33.33% - 16px)',
  minWidth: '250px',
  boxShadow: 'none',
  borderRadius: '0.5rem',
  backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
});

interface TeamMemberSummary {
  name: string;
  email: string;
  department: string;
  designation: string;
  totalLeaveDays: number;
}

interface LeaveBalance {
  leaveTypeName: string;
  used: number;
  remaining: number;
  maxDaysPerYear: number;
  carryForward: boolean;
}

function TabPanel({
  children,
  value,
  index,
}: {
  children?: React.ReactNode;
  value: number;
  index: number;
}) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const Reports: React.FC = () => {
  const darkMode = useIsDarkMode();
  const { language } = useLanguage();

  const labels = {
    en: {
      pageTitle: 'Leave Reports',
      exportTooltip: 'Export CSV',
      employeeName: 'Employee Name',
      email: 'Email',
      department: 'Department',
      designation: 'Designation',
      leaveType: 'Leave Type',
      total: 'Total',
      totalLeaveDays: 'Total Leave Days',
      used: 'Used',
      remaining: 'Remaining',
      approvedDays: 'Approved Days',
      pendingDays: 'Pending Days',
      rejectedDays: 'Rejected Days',
      noData: 'No leave reports found',
      tabMySummary: 'My Leave Summary',
      tabTeamSummary: 'Team Leave Summary',
      cardUsedFormat: 'Used: {used} / {max}',
      tableNoData: 'No leave data available',
      noTeamData: 'No team data found.',
      leaveTypeHeader: 'Leave Type',
      maxDaysHeader: 'Max Days',
      carryForward: 'Carry Forward',
      yes: 'Yes',
      no: 'No',
      showingPage: 'Showing page {page} of {total} ({records} total records)',
      showingAll: 'Showing all {records} records',
    },
    ar: {
      pageTitle: 'تقارير الإجازات',
      exportTooltip: 'تصدير CSV',
      employeeName: 'اسم الموظف',
      email: 'البريد الإلكتروني',
      department: 'القسم',
      designation: 'المسمى',
      leaveType: 'نوع الإجازة',
      total: 'الإجمالي',
      totalLeaveDays: 'إجمالي أيام الإجازة',
      used: 'المستهلَك',
      remaining: 'المتبقي',
      approvedDays: 'الأيام المعتمدة',
      pendingDays: 'الأيام المعلقة',
      rejectedDays: 'الأيام المرفوضة',
      noData: 'لم يتم العثور على تقارير الإجازات',
      tabMySummary: 'ملخص إجازاتي',
      tabTeamSummary: 'ملخص إجازات الفريق',
      cardUsedFormat: 'المستهلَك: {used} / {max}',
      tableNoData: 'لا تتوفر بيانات الإجازة',
      noTeamData: 'لم يتم العثور على بيانات الفريق.',
      leaveTypeHeader: 'نوع الإجازة',
      maxDaysHeader: 'أقصى عدد أيام',
      carryForward: 'نقل',
      yes: 'نعم',
      no: 'لا',
      showingPage: 'عرض الصفحة {page} من {total} ({records} إجمالي السجلات)',
      showingAll: 'عرض جميع {records} سجلات',
    },
  } as const;

  const L = labels[language as 'en' | 'ar'] || labels.en;
  // Format numbers using western digits so numeric counts remain '14' even in Arabic
  const formatNumber = (n: number) => new Intl.NumberFormat('en-US').format(n);

  const formatLabel = (
    tpl: string,
    vars: Record<string, number | string>
  ): string =>
    tpl.replace(/{(\w+)}/g, (_, k) => {
      const v = vars[k];
      return typeof v === 'number' ? formatNumber(v) : String(v ?? '');
    });
  const [tab, setTab] = useState(0);
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [teamSummary, setTeamSummary] = useState<TeamMemberSummary[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance[]>([]);
  const [allLeaveReports, setAllLeaveReports] = useState<EmployeeReport[]>([]);
  const [page, setPage] = useState(1);
  const [paginationLimit, setPaginationLimit] = useState(25); // Backend limit, default 25
  const [loading, setLoading] = useState(true);
  const [loadingTab, setLoadingTab] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{
    userId: string | null;
    isManager: boolean;
    isHrAdmin: boolean;
    isAdmin: boolean;
    isSystemAdmin: boolean;
  } | null>(null);

  useEffect(() => {
    try {
      const info = leaveReportApi.getUserInfo();
      setUserInfo(info);
    } catch (err) {
      console.error('Error loading user info:', err);
      setError('Failed to load user information');
      setUserInfo({
        userId: null,
        isManager: false,
        isHrAdmin: false,
        isAdmin: false,
        isSystemAdmin: false,
      });
    }
  }, []);

  const { userId, isManager, isHrAdmin, isAdmin, isSystemAdmin } = userInfo || {
    userId: null,
    isManager: false,
    isHrAdmin: false,
    isAdmin: false,
    isSystemAdmin: false,
  };

  const isAdminView = isHrAdmin || isAdmin || isSystemAdmin;

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) =>
    setTab(newValue);

  const handleMonthChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = event.target.value; // format: "YYYY-MM"
    if (!value) return;
    const [yearStr, monthStr] = value.split('-');
    const parsedYear = parseInt(yearStr, 10);
    const parsedMonth = parseInt(monthStr, 10);

    if (!Number.isNaN(parsedYear) && !Number.isNaN(parsedMonth)) {
      setSelectedYear(parsedYear);
      setSelectedMonth(parsedMonth);
    }
  };

  const filteredEmployeeReports = useMemo(() => {
    if (!allLeaveReports || allLeaveReports.length === 0) return [];

    const monthStart = new Date(selectedYear, selectedMonth - 1, 1);
    const monthEnd = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);
    const yearStart = new Date(selectedYear, 0, 1);

    const calculateDays = (startDate: string, endDate: string): number => {
      try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diff = Math.floor(
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        );
        return diff >= 0 ? diff + 1 : 0;
      } catch {
        return 0;
      }
    };

    return allLeaveReports
      .map(emp => {
        const leaveRecords = emp.leaveRecords || [];

        // Records that overlap the selected month (for monthly stats)
        const filteredRecords = leaveRecords.filter(record => {
          if (!record.startDate || !record.endDate) return false;
          const start = new Date(record.startDate);
          const end = new Date(record.endDate);
          if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            return false;
          }
          return start <= monthEnd && end >= monthStart;
        });

        if (filteredRecords.length === 0) {
          return null;
        }

        // Year‑to‑date approved days (from start of year up to end of selected month)
        const ytdApprovedMap = new Map<string, number>();

        leaveRecords.forEach(record => {
          if (!record.startDate || !record.endDate) return;
          const start = new Date(record.startDate);
          const end = new Date(record.endDate);
          if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime()) ||
            end < yearStart ||
            start > monthEnd
          ) {
            return;
          }

          if (record.status !== 'approved') return;

          let days = record.totalDays;
          if (days === null || days === undefined) {
            days = calculateDays(record.startDate, record.endDate);
          }

          const key = record.leaveTypeName?.toLowerCase() || 'unknown';
          const current = ytdApprovedMap.get(key) ?? 0;
          ytdApprovedMap.set(key, current + days);
        });

        const statsMap = new Map<
          string,
          {
            approvedDays: number;
            pendingDays: number;
            rejectedDays: number;
            totalDays: number;
          }
        >();

        filteredRecords.forEach(record => {
          const key = record.leaveTypeName?.toLowerCase() || 'unknown';
          let days = record.totalDays;
          if (days === null || days === undefined) {
            days = calculateDays(record.startDate, record.endDate);
          }

          const current = statsMap.get(key) || {
            approvedDays: 0,
            pendingDays: 0,
            rejectedDays: 0,
            totalDays: 0,
          };

          if (record.status === 'approved') {
            current.approvedDays += days;
          } else if (record.status === 'pending') {
            current.pendingDays += days;
          } else if (record.status === 'rejected') {
            current.rejectedDays += days;
          }
          current.totalDays += days;

          statsMap.set(key, current);
        });

        const newLeaveSummary: LeaveSummaryItem[] = Array.from(
          statsMap.entries()
        ).map(([key, stats]) => {
          const base = emp.leaveSummary?.find(
            s => s.leaveTypeName.toLowerCase() === key
          );

          const matchingRecord = filteredRecords.find(
            r => r.leaveTypeName?.toLowerCase() === key
          );

          const approvedYtd = ytdApprovedMap.get(key) ?? stats.approvedDays;
          const maxPerYear = base?.maxDaysPerYear ?? 0;
          // Allow negative remaining when over-used, to reflect backend behaviour
          const remaining = maxPerYear - approvedYtd;

          return {
            leaveTypeId: base?.leaveTypeId ?? key,
            leaveTypeName:
              base?.leaveTypeName ?? matchingRecord?.leaveTypeName ?? 'Unknown',
            maxDaysPerYear: base?.maxDaysPerYear ?? 0,
            approvedDays: stats.approvedDays,
            pendingDays: stats.pendingDays,
            rejectedDays: stats.rejectedDays,
            totalDays: stats.totalDays,
            // Yearly-style remaining days
            remainingDays: remaining,
            // Fields from the simpler LeaveSummaryItem interface
            type:
              base?.leaveTypeName ?? matchingRecord?.leaveTypeName ?? 'Unknown',
            used: approvedYtd,
            remaining,
          };
        });

        return {
          ...emp,
          leaveSummary: newLeaveSummary,
          leaveRecords: filteredRecords,
        };
      })
      .filter((emp): emp is EmployeeReport => emp !== null);
  }, [allLeaveReports, selectedMonth, selectedYear]);

  const handleExport = async () => {
    try {
      let blob;

      if (isAdminView) {
        const headers = [
          'Employee Name',
          'Department',
          'Designation',
          'Leave Type',
          'Max Days',
          'Used',
          'Remaining',
          'Approved Days',
          'Pending Days',
          'Rejected Days',
        ];

        const rows = filteredEmployeeReports.flatMap(emp =>
          emp.leaveSummary.map(summary => [
            emp.employeeName,
            emp.department,
            emp.designation,
            summary.leaveTypeName,
            summary.maxDaysPerYear,
            summary.used ??
              (summary.approvedDays ?? 0) + (summary.pendingDays ?? 0),
            summary.remaining ?? summary.remainingDays ?? 0,
            summary.approvedDays ?? 0,
            summary.pendingDays ?? 0,
            summary.rejectedDays ?? 0,
          ])
        );

        const csvContent = [
          headers.join(','),
          ...rows.map(row =>
            row
              .map(value =>
                typeof value === 'string' && value.includes(',')
                  ? `"${value}"`
                  : (value ?? '')
              )
              .join(',')
          ),
        ].join('\n');

        blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      } else {
        if (tab === 0) blob = await leaveReportApi.exportLeaveBalanceCSV();
        if (isManager && tab === 1)
          blob = await leaveReportApi.exportTeamLeaveSummaryCSV(
            selectedMonth,
            selectedYear
          );
      }

      if (blob) {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `Leave_Report_${now.toISOString().slice(0, 10)}.csv`;
        link.click();
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const fetchAllLeaveReports = async () => {
    try {
      setLoadingTab(true);

      // First, fetch page 1 to get total pages and limit
      let allEmployeeReports: EmployeeReport[] = [];
      let paginationLimit = 25;
      let totalPagesFromBackend = 1;
      let leaveTypes: unknown[] = [];

      const firstPageData = await leaveReportApi.getAllLeaveReports(
        1,
        selectedMonth,
        selectedYear
      );

      // Extract limit and total pages from first page
      if (
        firstPageData.employeeReports &&
        typeof firstPageData.employeeReports === 'object' &&
        'items' in firstPageData.employeeReports
      ) {
        const reportsObj = firstPageData.employeeReports as {
          items: EmployeeReport[];
          total?: number;
          page?: number;
          limit?: number;
          totalPages?: number;
        };
        paginationLimit = reportsObj.limit || firstPageData.limit || 25;
        totalPagesFromBackend =
          reportsObj.totalPages || firstPageData.totalPages || 1;

        // Get first page employees
        if (reportsObj.items && reportsObj.items.length > 0) {
          allEmployeeReports = [...reportsObj.items];
        }
      } else if (Array.isArray(firstPageData.employeeReports)) {
        allEmployeeReports = [...firstPageData.employeeReports];
        paginationLimit = firstPageData.limit || 25;
        totalPagesFromBackend = firstPageData.totalPages || 1;
      }

      // Store organization stats and leave types from first page
      // Store leave types from first page
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      leaveTypes = firstPageData.leaveTypes || [];
      // Fetch all remaining pages if there are more pages
      if (totalPagesFromBackend > 1) {
        for (let page = 2; page <= totalPagesFromBackend; page++) {
          try {
            const pageData = await leaveReportApi.getAllLeaveReports(
              page,
              selectedMonth,
              selectedYear
            );

            let pageEmployeeReports: EmployeeReport[] = [];
            if (
              pageData.employeeReports &&
              typeof pageData.employeeReports === 'object' &&
              'items' in pageData.employeeReports
            ) {
              const reportsObj = pageData.employeeReports as {
                items: EmployeeReport[];
              };
              pageEmployeeReports = reportsObj.items || [];
            } else if (Array.isArray(pageData.employeeReports)) {
              pageEmployeeReports = pageData.employeeReports;
            }

            if (pageEmployeeReports.length > 0) {
              allEmployeeReports = [
                ...allEmployeeReports,
                ...pageEmployeeReports,
              ];
            }
          } catch (err) {
            console.error(`Error fetching page ${page}:`, err);
            // Continue with next page even if one fails
          }
        }
      }

      // Store all fetched records
      setAllLeaveReports(allEmployeeReports);

      // Store the limit in state so it can be used in pagination rendering
      setPaginationLimit(paginationLimit);

      // Calculate total leave type rows from all fetched employees
      // Each employee can have multiple leave types, so we count all leave type rows
      const totalLeaveTypeRows = allEmployeeReports.reduce((total, emp) => {
        return (
          total +
          (emp.leaveSummary && emp.leaveSummary.length > 0
            ? emp.leaveSummary.length
            : 1)
        );
      }, 0);

      // Calculate total pages based on leave type rows for frontend pagination
      // We'll use the backend limit for frontend pagination
      const ITEMS_PER_PAGE_LEAVE_ROWS = paginationLimit || 25;
      const finalTotalPages = Math.ceil(
        totalLeaveTypeRows / ITEMS_PER_PAGE_LEAVE_ROWS
      );

      // Store pagination info for frontend pagination
      // Store pagination info for frontend pagination
      setPage(1);
      console.log('Pagination info:', {
        totalPages: finalTotalPages,
        total: totalLeaveTypeRows,
        totalEmployees: allEmployeeReports.length,
        totalLeaveTypeRows: totalLeaveTypeRows,
        paginationLimit: paginationLimit,
      });

      setError(null);
    } catch (err: unknown) {
      console.error('Error fetching reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setLoadingTab(false);
    }
  };

  useEffect(() => {
    if (!userInfo || !userInfo.userId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setError(null);

        if (isAdminView) {
          // fetchAllLeaveReports handles its own loading state
          // Fetch all records from backend, then paginate leave type rows client-side
          await fetchAllLeaveReports();
        } else {
          // For tab changes, use tab-specific loading instead of full page loading
          setLoadingTab(true);
          if (tab === 0) {
            const data = await leaveReportApi.getLeaveBalance();
            setLeaveBalance(data.balances || []);
          } else if (isManager && tab === 1) {
            const data = await leaveReportApi.getTeamLeaveSummary(
              selectedMonth,
              selectedYear
            );
            setTeamSummary(data.teamMembers || []);
          }
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        if (!isAdminView) {
          setLoadingTab(false);
        }
      }
    };

    fetchData();
    // Remove 'page' from dependencies - we use client-side pagination for leave type rows
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, userInfo, isAdminView, isManager, selectedMonth, selectedYear]);

  if (!userInfo) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight={400}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!userId) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight={400}
      >
        <Typography color='error'>User not found. Please re-login.</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='60vh'
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        flexWrap='wrap'
        gap={1}
        mb={2}
        // reverse the header on larger screens for RTL so title moves right and button moves left
        sx={{
          flexDirection: {
            xs: 'column',
            sm: language === 'ar' ? 'row-reverse' : 'row',
          },
        }}
      >
        <Typography
          variant='h4'
          fontWeight={600}
          dir={language === 'ar' ? 'rtl' : 'ltr'}
          sx={{
            color: darkMode ? '#fff' : '#000',
            textAlign: language === 'ar' ? 'right' : 'left',
          }}
        >
          {L.pageTitle}
        </Typography>
        <Box display='flex' alignItems='center' gap={1} flexWrap='wrap'>
          {isAdminView && (
            <TextField
              label='Month'
              type='month'
              size='small'
              value={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}`}
              onChange={handleMonthChange}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 180 }}
            />
          )}
          {(isAdminView || isManager) && (
            <Tooltip title='Export CSV'>
              <IconButton
                color='primary'
                onClick={handleExport}
                sx={{
                  backgroundColor: 'primary.main',
                  borderRadius: '6px',
                  color: 'white',
                  '&:hover': { backgroundColor: 'primary.dark' },
                }}
              >
                <FileDownloadIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {isAdminView && (
        <Box>
          {error && <Typography color='error'>{error}</Typography>}
          <TableContainer
            component={Card}
            sx={{
              boxShadow: 'none',
              backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
            }}
          >
            <Table>
              <TableHead
                sx={{ backgroundColor: darkMode ? '#2a2a2a' : '#f5f5f5' }}
              >
                <TableRow>
                  <TableCell sx={{ color: darkMode ? '#fff' : '#000' }}>
                    <b>{L.employeeName}</b>
                  </TableCell>
                  <TableCell sx={{ color: darkMode ? '#fff' : '#000' }}>
                    <b>{L.department}</b>
                  </TableCell>
                  <TableCell sx={{ color: darkMode ? '#fff' : '#000' }}>
                    <b>{L.designation}</b>
                  </TableCell>
                  <TableCell sx={{ color: darkMode ? '#fff' : '#000' }}>
                    <b>{L.leaveType}</b>
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ color: darkMode ? '#fff' : '#000' }}
                  >
                    <b>{L.total}</b>
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ color: darkMode ? '#fff' : '#000' }}
                  >
                    <b>{L.used}</b>
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ color: darkMode ? '#fff' : '#000' }}
                  >
                    <b>{L.remaining}</b>
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ color: darkMode ? '#fff' : '#000' }}
                  >
                    <b>{L.approvedDays}</b>
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ color: darkMode ? '#fff' : '#000' }}
                  >
                    <b>{L.pendingDays}</b>
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ color: darkMode ? '#fff' : '#000' }}
                  >
                    <b>{L.rejectedDays}</b>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingTab ? (
                  <TableRow
                    sx={{
                      backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
                    }}
                  >
                    <TableCell
                      colSpan={11}
                      align='center'
                      sx={{ color: darkMode ? '#ccc' : '#000' }}
                    >
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : filteredEmployeeReports.length === 0 ? (
                  <TableRow
                    sx={{
                      backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
                    }}
                  >
                    <TableCell
                      colSpan={11}
                      align='center'
                      sx={{ color: darkMode ? '#ccc' : '#000' }}
                    >
                      {L.noData}
                    </TableCell>
                  </TableRow>
                ) : (
                  (() => {
                    // Flatten all leave type rows first
                    type LeaveTypeRow = {
                      employeeId: string;
                      employeeName: string;
                      department: string;
                      designation: string;
                      summary: LeaveSummaryItem | null;
                      index: number;
                      key: string;
                    };

                    const allLeaveTypeRows: LeaveTypeRow[] =
                      filteredEmployeeReports.flatMap(emp => {
                        if (emp.leaveSummary && emp.leaveSummary.length > 0) {
                          return emp.leaveSummary.map(
                            (summary, index): LeaveTypeRow => ({
                              employeeId: emp.employeeId,
                              employeeName: emp.employeeName,
                              department: emp.department,
                              designation: emp.designation,
                              summary: summary,
                              index,
                              key: `${emp.employeeId}-${index}`,
                            })
                          );
                        } else {
                          return [
                            {
                              employeeId: emp.employeeId,
                              employeeName: emp.employeeName,
                              department: emp.department,
                              designation: emp.designation,
                              summary: null,
                              index: -1,
                              key: `${emp.employeeId}-no-leaves`,
                            } as LeaveTypeRow,
                          ];
                        }
                      });

                    // Paginate the flattened leave type rows using backend limit
                    const ITEMS_PER_PAGE = paginationLimit || 25;
                    const startIndex = (page - 1) * ITEMS_PER_PAGE;
                    const endIndex = startIndex + ITEMS_PER_PAGE;
                    const paginatedRows = allLeaveTypeRows.slice(
                      startIndex,
                      endIndex
                    );

                    return paginatedRows.map((row: LeaveTypeRow) =>
                      row.summary ? (
                        <TableRow
                          key={row.key}
                          sx={{
                            backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
                            '&:hover': {
                              backgroundColor: darkMode ? '#2a2a2a' : '#f5f5f5',
                            },
                          }}
                        >
                          <TableCell sx={{ color: darkMode ? '#ccc' : '#000' }}>
                            {row.employeeName}
                          </TableCell>
                          <TableCell sx={{ color: darkMode ? '#ccc' : '#000' }}>
                            {row.department}
                          </TableCell>
                          <TableCell sx={{ color: darkMode ? '#ccc' : '#000' }}>
                            {row.designation}
                          </TableCell>
                          <TableCell sx={{ color: darkMode ? '#ccc' : '#000' }}>
                            {row.summary.leaveTypeName}
                          </TableCell>
                          <TableCell
                            align='center'
                            sx={{ color: darkMode ? '#ccc' : '#000' }}
                          >
                            {row.summary.maxDaysPerYear}
                          </TableCell>
                          <TableCell
                            align='center'
                            sx={{ color: darkMode ? '#ccc' : '#000' }}
                          >
                            {row.summary.used ??
                              (row.summary.approvedDays ?? 0) +
                                (row.summary.pendingDays ?? 0)}
                          </TableCell>
                          <TableCell
                            align='center'
                            sx={{ color: darkMode ? '#ccc' : '#000' }}
                          >
                            {row.summary.remaining ??
                              row.summary.remainingDays ??
                              0}
                          </TableCell>
                          <TableCell
                            align='center'
                            sx={{ color: darkMode ? '#ccc' : '#000' }}
                          >
                            {row.summary.approvedDays ?? 0}
                          </TableCell>
                          <TableCell
                            align='center'
                            sx={{ color: darkMode ? '#ccc' : '#000' }}
                          >
                            {row.summary.pendingDays ?? 0}
                          </TableCell>
                          <TableCell
                            align='center'
                            sx={{ color: darkMode ? '#ccc' : '#000' }}
                          >
                            {row.summary.rejectedDays ?? 0}
                          </TableCell>
                        </TableRow>
                      ) : (
                        <TableRow
                          key={row.key}
                          sx={{
                            backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
                          }}
                        >
                          <TableCell sx={{ color: darkMode ? '#ccc' : '#000' }}>
                            {row.employeeName}
                          </TableCell>
                          <TableCell sx={{ color: darkMode ? '#ccc' : '#000' }}>
                            {row.department}
                          </TableCell>
                          <TableCell sx={{ color: darkMode ? '#ccc' : '#000' }}>
                            {row.designation}
                          </TableCell>
                          <TableCell
                            colSpan={8}
                            align='center'
                            sx={{ color: darkMode ? '#ccc' : '#000' }}
                          >
                            No leave data available
                          </TableCell>
                        </TableRow>
                      )
                    );
                  })()
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {(() => {
            // Calculate all leave type rows for pagination logic
            type LeaveTypeRow = {
              employeeId: string;
              employeeName: string;
              department: string;
              designation: string;
              summary: LeaveSummaryItem | null;
              index: number;
              key: string;
            };

            const allLeaveTypeRows: LeaveTypeRow[] =
              filteredEmployeeReports.flatMap(emp => {
                if (emp.leaveSummary && emp.leaveSummary.length > 0) {
                  return emp.leaveSummary.map(
                    (summary, index): LeaveTypeRow => ({
                      employeeId: emp.employeeId,
                      employeeName: emp.employeeName,
                      department: emp.department,
                      designation: emp.designation,
                      summary: summary,
                      index,
                      key: `${emp.employeeId}-${index}`,
                    })
                  );
                } else {
                  return [
                    {
                      employeeId: emp.employeeId,
                      employeeName: emp.employeeName,
                      department: emp.department,
                      designation: emp.designation,
                      summary: null,
                      index: -1,
                      key: `${emp.employeeId}-no-leaves`,
                    } as LeaveTypeRow,
                  ];
                }
              });

            // Use backend limit (stored in state) or default to 25
            const ITEMS_PER_PAGE = paginationLimit || 25;
            const totalLeaveTypeRows = allLeaveTypeRows.length;
            const calculatedTotalPages = Math.ceil(
              totalLeaveTypeRows / ITEMS_PER_PAGE
            );

            // Get current page rows
            const startIndex = (page - 1) * ITEMS_PER_PAGE;
            const endIndex = startIndex + ITEMS_PER_PAGE;
            const currentPageRows = allLeaveTypeRows.slice(
              startIndex,
              endIndex
            );
            const currentPageRowsCount = currentPageRows.length;

            // Pagination buttons logic:
            // - On first page: Only show if current page has full limit (to indicate more pages exist)
            // - On other pages (including last page): Always show if there are multiple pages
            // This allows navigation between pages even from the last page
            const shouldShowPagination =
              calculatedTotalPages > 1 &&
              (page === 1
                ? currentPageRowsCount === ITEMS_PER_PAGE // First page: only show if full limit
                : true); // Other pages: always show if totalPages > 1

            return (
              <>
                {shouldShowPagination && (
                  <Box display='flex' justifyContent='center' mt={2}>
                    <Pagination
                      count={calculatedTotalPages}
                      page={page}
                      onChange={(_, value) => setPage(value)}
                      color='primary'
                      shape='rounded'
                      size='small'
                      showFirstButton
                      showLastButton
                      sx={{
                        '& .MuiPaginationItem-root': {
                          borderRadius: '50%',
                          minWidth: 32,
                          height: 32,
                        },
                      }}
                    />
                  </Box>
                )}
                {totalLeaveTypeRows > 0 && (
                  <Box display='flex' justifyContent='center' mt={1}>
                    <Typography
                      variant='body2'
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                      sx={{
                        color: darkMode ? '#ccc' : 'text.secondary',
                        width: '100%',
                        textAlign: 'center',
                      }}
                    >
                      {
                        // If only one page show the 'showingAll' template, else show page template
                        ((): string => {
                          const ITEMS_PER_PAGE = paginationLimit || 25;
                          if (totalLeaveTypeRows <= ITEMS_PER_PAGE) {
                            return formatLabel(L.showingAll, {
                              records: totalLeaveTypeRows,
                            });
                          }
                          return formatLabel(L.showingPage, {
                            page,
                            total: calculatedTotalPages,
                            records: totalLeaveTypeRows,
                          });
                        })()
                      }
                    </Typography>
                  </Box>
                )}
              </>
            );
          })()}
        </Box>
      )}

      {!isAdminView && (
        <>
          <Tabs value={tab} onChange={handleTabChange}>
            <Tab label={L.tabMySummary} />
            <Tab label={L.tabTeamSummary} />
          </Tabs>
          <TabPanel value={tab} index={0}>
            {loadingTab ? (
              <Box
                display='flex'
                justifyContent='center'
                alignItems='center'
                py={4}
              >
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                  {leaveBalance.map((item, idx) => (
                    <Card key={idx} sx={getCardStyle(darkMode)}>
                      <CardContent>
                        <Typography
                          sx={{ color: darkMode ? '#ccc' : 'text.secondary' }}
                          gutterBottom
                        >
                          {item.leaveTypeName}
                        </Typography>
                        <Typography
                          variant='h4'
                          fontWeight={600}
                          color='primary.main'
                        >
                          {item.remaining}
                        </Typography>
                        <Typography
                          variant='body2'
                          sx={{ color: darkMode ? '#ccc' : 'text.secondary' }}
                        >
                          {`${L.used}: ${item.used} / ${item.maxDaysPerYear}`}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
                <TableContainer
                  component={Card}
                  sx={{
                    boxShadow: 'none',
                    backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow
                        hover
                        sx={{
                          backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
                        }}
                      >
                        <TableCell sx={{ color: darkMode ? '#fff' : '#000' }}>
                          {L.leaveTypeHeader}
                        </TableCell>
                        <TableCell sx={{ color: darkMode ? '#fff' : '#000' }}>
                          {L.maxDaysHeader}
                        </TableCell>
                        <TableCell sx={{ color: darkMode ? '#fff' : '#000' }}>
                          {L.used}
                        </TableCell>
                        <TableCell sx={{ color: darkMode ? '#fff' : '#000' }}>
                          {L.remaining}
                        </TableCell>
                        <TableCell sx={{ color: darkMode ? '#fff' : '#000' }}>
                          {L.carryForward}
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {leaveBalance.map((item, idx) => (
                        <TableRow
                          key={idx}
                          hover
                          sx={{
                            backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
                            '&:hover': {
                              backgroundColor: darkMode ? '#2a2a2a' : '#f5f5f5',
                            },
                          }}
                        >
                          <TableCell sx={{ color: darkMode ? '#ccc' : '#000' }}>
                            {item.leaveTypeName}
                          </TableCell>
                          <TableCell sx={{ color: darkMode ? '#ccc' : '#000' }}>
                            {item.maxDaysPerYear}
                          </TableCell>
                          <TableCell sx={{ color: darkMode ? '#ccc' : '#000' }}>
                            {item.used}
                          </TableCell>
                          <TableCell sx={{ color: darkMode ? '#ccc' : '#000' }}>
                            {item.remaining}
                          </TableCell>
                          <TableCell sx={{ color: darkMode ? '#ccc' : '#000' }}>
                            {item.carryForward ? L.yes : L.no}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </TabPanel>

          {isManager && (
            <TabPanel value={tab} index={1}>
              {loadingTab ? (
                <Box
                  display='flex'
                  justifyContent='center'
                  alignItems='center'
                  py={4}
                >
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  {!teamSummary.length && (
                    <Typography sx={{ color: darkMode ? '#ccc' : '#000' }}>
                      {L.noTeamData}
                    </Typography>
                  )}
                  {!!teamSummary.length && (
                    <TableContainer
                      component={Card}
                      sx={{
                        boxShadow: 'none',
                        backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
                      }}
                    >
                      <Table>
                        <TableHead>
                          <TableRow
                            sx={{
                              backgroundColor: darkMode ? '#2a2a2a' : '#f5f5f5',
                            }}
                          >
                            <TableCell
                              sx={{ color: darkMode ? '#fff' : '#000' }}
                            >
                              {L.employeeName}
                            </TableCell>
                            <TableCell
                              sx={{ color: darkMode ? '#fff' : '#000' }}
                            >
                              {L.email}
                            </TableCell>
                            <TableCell
                              sx={{ color: darkMode ? '#fff' : '#000' }}
                            >
                              {L.department}
                            </TableCell>
                            <TableCell
                              sx={{ color: darkMode ? '#fff' : '#000' }}
                            >
                              {L.designation}
                            </TableCell>
                            <TableCell
                              sx={{ color: darkMode ? '#fff' : '#000' }}
                            >
                              {L.totalLeaveDays}
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {teamSummary.map((member, idx) => (
                            <TableRow
                              key={idx}
                              hover
                              sx={{
                                backgroundColor: darkMode
                                  ? '#1e1e1e'
                                  : '#ffffff',
                                '&:hover': {
                                  backgroundColor: darkMode
                                    ? '#2a2a2a'
                                    : '#f5f5f5',
                                },
                              }}
                            >
                              <TableCell
                                sx={{ color: darkMode ? '#ccc' : '#000' }}
                              >
                                {member.name}
                              </TableCell>
                              <TableCell
                                sx={{ color: darkMode ? '#ccc' : '#000' }}
                              >
                                {member.email}
                              </TableCell>
                              <TableCell
                                sx={{ color: darkMode ? '#ccc' : '#000' }}
                              >
                                {member.department}
                              </TableCell>
                              <TableCell
                                sx={{ color: darkMode ? '#ccc' : '#000' }}
                              >
                                {member.designation}
                              </TableCell>
                              <TableCell
                                sx={{ color: darkMode ? '#ccc' : '#000' }}
                              >
                                {member.totalLeaveDays}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </>
              )}
            </TabPanel>
          )}
        </>
      )}
    </Box>
  );
};

export default Reports;
