import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  Tooltip,
  IconButton,
  Pagination,
  TextField,
  useTheme,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import {
  leaveReportApi,
  type EmployeeReport,
  type LeaveSummaryItem,
  type TeamMember,
} from '../../api/leaveReportApi';
import employeeApi from '../../api/employeeApi';
import { useIsDarkMode } from '../../theme';
import AppCard from '../common/AppCard';
import AppTable from '../common/AppTable';
import AppPageTitle from '../common/AppPageTitle';

const getCardStyle = (darkMode: boolean) => ({
  flex: '1 1 calc(33.33% - 16px)',
  minWidth: '250px',
  boxShadow: 'none',
  borderRadius: '0.5rem',
  backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
});

interface LeaveBalance {
  leaveTypeName: string;
  used: number;
  remaining: number;
  maxDaysPerYear: number;
  carryForward: boolean;
}

const Reports: React.FC = () => {
  const darkMode = useIsDarkMode();
  const [tab] = useState(0);
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance[]>([]);
  const [allLeaveReports, setAllLeaveReports] = useState<EmployeeReport[]>([]);
  const [page, setPage] = useState(1);
  const [, setTotalPages] = useState(1);
  const [, setTotalRecords] = useState(0);
  const [paginationLimit, setPaginationLimit] = useState(25); // Backend limit, default 25
  const [loading, setLoading] = useState(true);
  const [loadingTab, setLoadingTab] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [, setAllEmployees] = useState<Array<{ id: string; name: string }>>([]);
  const [, setTeamSummary] = useState<TeamMember[]>([]);
  const [, setLoadingEmployees] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    userId: string | null;
    isManager: boolean;
    isHrAdmin: boolean;
    isAdmin: boolean;
    isSystemAdmin: boolean;
  } | null>(null);

  const theme = useTheme();

  useEffect(() => {
    try {
      const info = leaveReportApi.getUserInfo();
      setUserInfo(info);
    } catch {
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

  // Fetch all employees for admin/HR admin view
  useEffect(() => {
    const fetchAllEmployees = async () => {
      if (!isAdminView) {
        setAllEmployees([]);
        return;
      }

      try {
        setLoadingEmployees(true);
        const employees = await employeeApi.getAllEmployeesWithoutPagination();
        setAllEmployees(
          employees.map(emp => ({
            id: emp.id,
            name: emp.name,
          }))
        );
      } catch (err) {
        console.error('Error fetching all employees:', err);
        setAllEmployees([]);
      } finally {
        setLoadingEmployees(false);
      }
    };

    if (userInfo) {
      fetchAllEmployees();
    }
  }, [isAdminView, userInfo]);

  // handleTabChange removed — `tab` is not dynamically changed in this component

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

  // Extract employee names from fetched allEmployees for the filter dropdown
  // availableEmployees not used — derived list removed

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

    // First filter by employee name if selected
    let employeesToProcess = allLeaveReports;
    if (selectedEmployee) {
      employeesToProcess = allLeaveReports.filter(
        emp => emp.employeeName === selectedEmployee
      );
    }

    return employeesToProcess
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
  }, [allLeaveReports, selectedMonth, selectedYear, selectedEmployee]);

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
    } catch {
      // Silently fail export; user can retry
    }
  };

  const fetchAllLeaveReports = async () => {
    try {
      setLoadingTab(true);

      // First, fetch page 1 to get total pages and limit
      let allEmployeeReports: EmployeeReport[] = [];
      let paginationLimit = 25;
      let totalPagesFromBackend = 1;
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
          } catch {
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
      setTotalPages(Math.max(1, finalTotalPages));
      setTotalRecords(totalLeaveTypeRows);
      // Reset page to 1 when new data is loaded from backend (for client-side pagination)
      setPage(1);

      setError(null);
    } catch (err: unknown) {
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

  // Reset employee filter when month/year changes
  useEffect(() => {
    setSelectedEmployee(null);
    setPage(1);
  }, [selectedMonth, selectedYear]);

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
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexWrap: 'wrap',
          gap: 1,
          mb: 2,
          width: '100%',
        }}
      >
        <AppPageTitle>Leave Reports</AppPageTitle>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'space-between', sm: 'flex-end' },
          }}
        >
          {/* Month picker should be visible only to admin roles (hide for managers and employees) */}
          {isAdminView && (
            <TextField
              type='month'
              size='small'
              value={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}`}
              onChange={handleMonthChange}
              InputLabelProps={{ shrink: true }}
              sx={theme => ({
                minWidth: { xs: '100%', sm: 180 },

                '& input': {
                  color: theme.palette.text.primary,
                },

                '& label': {
                  color: theme.palette.text.secondary,
                },

                '& input::-webkit-calendar-picker-indicator': {
                  filter:
                    theme.palette.mode === 'dark' ? 'invert(1)' : 'invert(0)',
                  opacity: theme.palette.mode === 'dark' ? 0.5 : 1,
                  cursor: 'pointer',
                },
              })}
            />
          )}

          {(isAdminView || isManager) && (
            <Tooltip title='Export CSV'>
              <IconButton
                color='primary'
                onClick={handleExport}
                sx={{
                  backgroundColor: 'var(--primary-dark-color)',
                  borderRadius: '6px',
                  color: 'white',
                  '&:hover': { backgroundColor: 'var(--primary-dark-color)' },
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
          <AppCard
            sx={{
              padding: 0,
              backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
              overflowX: 'auto',
            }}
          >
            <AppTable sx={{ minWidth: 1100 }}>
              <TableHead
                sx={{ backgroundColor: darkMode ? '#2a2a2a' : '#f5f5f5' }}
              >
                <TableRow>
                  <TableCell sx={{ color: theme.palette.text.primary }}>
                    <b>Employee Name</b>
                  </TableCell>
                  <TableCell sx={{ color: theme.palette.text.primary }}>
                    <b>Department</b>
                  </TableCell>
                  <TableCell sx={{ color: theme.palette.text.primary }}>
                    <b>Designation</b>
                  </TableCell>
                  <TableCell sx={{ color: theme.palette.text.primary }}>
                    <b>Leave Type</b>
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ color: theme.palette.text.primary }}
                  >
                    <b>Total</b>
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ color: theme.palette.text.primary }}
                  >
                    <b>Used</b>
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ color: theme.palette.text.primary }}
                  >
                    <b>Remaining</b>
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ color: theme.palette.text.primary }}
                  >
                    <b>Approved Days</b>
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ color: theme.palette.text.primary }}
                  >
                    <b>Pending Days</b>
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ color: theme.palette.text.primary }}
                  >
                    <b>Rejected Days</b>
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
                      sx={{ color: theme.palette.text.secondary }}
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
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      No leave reports found
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
                          <TableCell sx={{ color: theme.palette.text.secondary }}>
                            {row.employeeName}
                          </TableCell>
                          <TableCell sx={{ color: theme.palette.text.secondary }}>
                            {row.department}
                          </TableCell>
                          <TableCell sx={{ color: theme.palette.text.secondary }}>
                            {row.designation}
                          </TableCell>
                          <TableCell sx={{ color: theme.palette.text.secondary }}>
                            {row.summary.leaveTypeName}
                          </TableCell>
                          <TableCell
                            align='center'
                            sx={{ color: theme.palette.text.secondary }}
                          >
                            {row.summary.maxDaysPerYear}
                          </TableCell>
                          <TableCell
                            align='center'
                            sx={{ color: theme.palette.text.secondary }}
                          >
                            {row.summary.used ??
                              (row.summary.approvedDays ?? 0) +
                                (row.summary.pendingDays ?? 0)}
                          </TableCell>
                          <TableCell
                            align='center'
                            sx={{ color: theme.palette.text.secondary }}
                          >
                            {row.summary.remaining ??
                              row.summary.remainingDays ??
                              0}
                          </TableCell>
                          <TableCell
                            align='center'
                            sx={{ color: theme.palette.text.secondary }}
                          >
                            {row.summary.approvedDays ?? 0}
                          </TableCell>
                          <TableCell
                            align='center'
                            sx={{ color: theme.palette.text.secondary }}
                          >
                            {row.summary.pendingDays ?? 0}
                          </TableCell>
                          <TableCell
                            align='center'
                            sx={{ color: theme.palette.text.secondary }}
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
                          <TableCell sx={{ color: theme.palette.text.secondary }}>
                            {row.employeeName}
                          </TableCell>
                          <TableCell sx={{ color: theme.palette.text.secondary }}>
                            {row.department}
                          </TableCell>
                          <TableCell sx={{ color: theme.palette.text.secondary }}>
                            {row.designation}
                          </TableCell>
                          <TableCell
                            colSpan={8}
                            align='center'
                            sx={{ color: theme.palette.text.secondary }}
                          >
                            No leave data available
                          </TableCell>
                        </TableRow>
                      )
                    );
                  })()
                )}
              </TableBody>
            </AppTable>
          </AppCard>

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
                      sx={{ color: darkMode ? '#ccc' : 'text.secondary' }}
                    >
                      Showing page {page} of {calculatedTotalPages} (
                      {totalLeaveTypeRows} total records)
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
                  <AppCard key={idx} compact sx={getCardStyle(darkMode)}>
                    <Typography
                      sx={{ color: theme.palette.text.primary }}
                      gutterBottom
                    >
                      {item.leaveTypeName}
                    </Typography>
                    <Typography
                      variant='h4'
                      fontWeight={600}
                      sx={{ color: theme.palette.primary.main }}
                    >
                      {item.remaining}
                    </Typography>
                    <Typography
                      sx={{ color: theme.palette.text.primary }}
                      variant='body2'
                    >
                      Used: {item.used} / {item.maxDaysPerYear}
                    </Typography>
                  </AppCard>
                ))}
              </Box>

              <AppCard
                sx={{
                  p: 0,
                  boxShadow: 'none',
                  backgroundColor: 'unset',
                  overflowX: 'auto',
                }}
              >
                <AppTable sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow
                      sx={{ backgroundColor: darkMode ? '#2a2a2a' : '#ffffff' }}
                    >
                      <TableCell sx={{ color: theme.palette.text.primary }}>
                        Leave Type
                      </TableCell>
                      <TableCell sx={{ color: theme.palette.text.primary }}>
                        Max Days
                      </TableCell>
                      <TableCell sx={{ color: theme.palette.text.primary }}>
                        Used
                      </TableCell>
                      <TableCell sx={{ color: theme.palette.text.primary }}>
                        Remaining
                      </TableCell>
                      <TableCell sx={{ color: theme.palette.text.primary }}>
                        Carry Forward
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
                        }}
                      >
                        <TableCell sx={{ color: theme.palette.text.primary }}>
                          {item.leaveTypeName}
                        </TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary }}>
                          {item.maxDaysPerYear}
                        </TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary }}>
                          {item.used}
                        </TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary }}>
                          {item.remaining}
                        </TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary }}>
                          {item.carryForward ? 'Yes' : 'No'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </AppTable>
              </AppCard>
            </>
          )}
        </>
      )}
    </Box>
  );
};

export default Reports;
