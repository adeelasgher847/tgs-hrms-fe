import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  CircularProgress,
  Tooltip,
  IconButton,
  Pagination,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import {
  leaveReportApi,
  type EmployeeReport,
  type LeaveSummaryItem,
} from '../../api/leaveReportApi';
import { useIsDarkMode } from '../../theme';
import AppCard from '../Common/AppCard';
import AppTable from '../Common/AppTable';

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
  const [tab, setTab] = useState(0);
  const [teamSummary, setTeamSummary] = useState<TeamMemberSummary[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance[]>([]);
  const [allLeaveReports, setAllLeaveReports] = useState<EmployeeReport[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
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

  const handleExport = async () => {
    try {
      let blob;
      const now = new Date();

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

        const rows = allLeaveReports.flatMap(emp =>
          emp.leaveSummary.map(summary => [
            emp.employeeName,
            emp.department,
            emp.designation,
            summary.leaveTypeName,
            summary.maxDaysPerYear,
            (summary.approvedDays ?? 0) + (summary.pendingDays ?? 0),
            summary.remainingDays ?? 0,
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
            now.getMonth() + 1,
            now.getFullYear()
          );
      }

      if (blob) {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `Leave_Report_${now.toISOString().slice(0, 10)}.csv`;
        link.click();
      }
    } catch (err) {
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
      let organizationStats: any = null;
      let leaveTypes: any[] = [];

      const firstPageData = await leaveReportApi.getAllLeaveReports(1);

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
      organizationStats = firstPageData.organizationStats;
      leaveTypes = firstPageData.leaveTypes || [];

      // Fetch all remaining pages if there are more pages
      if (totalPagesFromBackend > 1) {
        for (let page = 2; page <= totalPagesFromBackend; page++) {
          try {
            const pageData = await leaveReportApi.getAllLeaveReports(page);

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
            const now = new Date();
            const data = await leaveReportApi.getTeamLeaveSummary(
              now.getMonth() + 1,
              now.getFullYear()
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
  }, [tab, userInfo, isAdminView, isManager]);

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
      >
        <Typography
          variant='h4'
          fontWeight={600}
          sx={{ color: darkMode ? '#fff' : '#000' }}
        >
          Leave Reports
        </Typography>
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
      </Box>

      {isAdminView && (
        <Box>
          {error && <Typography color='error'>{error}</Typography>}
          <AppCard
            noShadow
            sx={{
              backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
            }}
          >
            <AppTable>
              <TableHead
                sx={{ backgroundColor: darkMode ? '#2a2a2a' : '#f5f5f5' }}
              >
                <TableRow>
                  <TableCell sx={{ color: darkMode ? '#fff' : '#000' }}>
                    <b>Employee Name</b>
                  </TableCell>
                  <TableCell sx={{ color: darkMode ? '#fff' : '#000' }}>
                    <b>Department</b>
                  </TableCell>
                  <TableCell sx={{ color: darkMode ? '#fff' : '#000' }}>
                    <b>Designation</b>
                  </TableCell>
                  <TableCell sx={{ color: darkMode ? '#fff' : '#000' }}>
                    <b>Leave Type</b>
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ color: darkMode ? '#fff' : '#000' }}
                  >
                    <b>Total</b>
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ color: darkMode ? '#fff' : '#000' }}
                  >
                    <b>Used</b>
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ color: darkMode ? '#fff' : '#000' }}
                  >
                    <b>Remaining</b>
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ color: darkMode ? '#fff' : '#000' }}
                  >
                    <b>Approved Days</b>
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ color: darkMode ? '#fff' : '#000' }}
                  >
                    <b>Pending Days</b>
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ color: darkMode ? '#fff' : '#000' }}
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
                      sx={{ color: darkMode ? '#ccc' : '#000' }}
                    >
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : allLeaveReports.length === 0 ? (
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
                      allLeaveReports.flatMap(emp => {
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
                            {(row.summary.approvedDays ?? 0) +
                              (row.summary.pendingDays ?? 0)}
                          </TableCell>
                          <TableCell
                            align='center'
                            sx={{ color: darkMode ? '#ccc' : '#000' }}
                          >
                            {row.summary.remainingDays ?? 0}
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

            const allLeaveTypeRows: LeaveTypeRow[] = allLeaveReports.flatMap(
              emp => {
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
              }
            );

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
                      sx={{ color: darkMode ? '#ccc' : 'text.secondary' }}
                      variant='body2'
                    >
                      Used: {item.used} / {item.maxDaysPerYear}
                    </Typography>
                  </AppCard>
                ))}
              </Box>

              <AppCard
                noShadow
                sx={{
                  backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
                }}
              >
                <AppTable>
                  <TableHead>
                    <TableRow
                      sx={{ backgroundColor: darkMode ? '#2a2a2a' : '#ffffff' }}
                    >
                      <TableCell sx={{ color: darkMode ? '#fff' : '#000' }}>
                        Leave Type
                      </TableCell>
                      <TableCell sx={{ color: darkMode ? '#fff' : '#000' }}>
                        Max Days
                      </TableCell>
                      <TableCell sx={{ color: darkMode ? '#fff' : '#000' }}>
                        Used
                      </TableCell>
                      <TableCell sx={{ color: darkMode ? '#fff' : '#000' }}>
                        Remaining
                      </TableCell>
                      <TableCell sx={{ color: darkMode ? '#fff' : '#000' }}>
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
