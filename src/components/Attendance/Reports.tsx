import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { leaveReportApi, type EmployeeReport } from '../../api/leaveReportApi';
import { useIsDarkMode } from '../../theme';

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

const ITEMS_PER_PAGE = 10;

const Reports: React.FC = () => {
  const darkMode = useIsDarkMode();
  const [tab, setTab] = useState(0);
  const [teamSummary, setTeamSummary] = useState<TeamMemberSummary[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance[]>([]);
  const [allLeaveReports, setAllLeaveReports] = useState<EmployeeReport[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{
    userId: string | null;
    isManager: boolean;
    isHrAdmin: boolean;
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
        isSystemAdmin: false,
      });
    }
  }, []);

  const { userId, isManager, isHrAdmin, isSystemAdmin } = userInfo || {
    userId: null,
    isManager: false,
    isHrAdmin: false,
    isSystemAdmin: false,
  };

  const isAdminView = isHrAdmin || isSystemAdmin;

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => setTab(newValue);

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
          'Approved',
          'Pending',
          'Rejected',
        ];

        const rows = allLeaveReports.flatMap(emp =>
          emp.leaveSummary.map(summary => [
            emp.employeeName,
            emp.department,
            emp.designation,
            summary.leaveTypeName,
            summary.maxDaysPerYear,
            summary.totalDays,
            summary.remainingDays,
            emp.totals.approvedRequests,
            emp.totals.pendingRequests,
            emp.totals.rejectedRequests,
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
      console.error('Export failed:', err);
    }
  };

  const fetchAllLeaveReports = async (pageNum: number) => {
    try {
      setLoading(true);
      const data = await leaveReportApi.getAllLeaveReports(pageNum);
      setAllLeaveReports(data.employeeReports || []);
      setTotalPages(data.totalPages || 1);
      setTotalRecords(data.total || 0);
      setPage(data.page || 1);
      setError(null);
    } catch (err: unknown) {
      console.error('Error fetching reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userInfo || !userInfo.userId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (isAdminView) {
          await fetchAllLeaveReports(page);
        } else if (tab === 0) {
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
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tab, userInfo, page, isAdminView, isManager]);

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
                    <b>Approved</b>
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ color: darkMode ? '#fff' : '#000' }}
                  >
                    <b>Pending</b>
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ color: darkMode ? '#fff' : '#000' }}
                  >
                    <b>Rejected</b>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allLeaveReports.length === 0 ? (
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
                  allLeaveReports.flatMap(emp =>
                    emp.leaveSummary && emp.leaveSummary.length > 0 ? (
                      emp.leaveSummary.map((summary, index) => (
                        <TableRow
                          key={`${emp.employeeId}-${index}`}
                          sx={{
                            backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
                            '&:hover': {
                              backgroundColor: darkMode ? '#2a2a2a' : '#f5f5f5',
                            },
                          }}
                        >
                          <TableCell
                            sx={{ color: darkMode ? '#ccc' : '#000' }}
                          >
                            {emp.employeeName}
                          </TableCell>
                          <TableCell
                            sx={{ color: darkMode ? '#ccc' : '#000' }}
                          >
                            {emp.department}
                          </TableCell>
                          <TableCell
                            sx={{ color: darkMode ? '#ccc' : '#000' }}
                          >
                            {emp.designation}
                          </TableCell>
                          <TableCell
                            sx={{ color: darkMode ? '#ccc' : '#000' }}
                          >
                            {summary.leaveTypeName}
                          </TableCell>
                          <TableCell
                            align='center'
                            sx={{ color: darkMode ? '#ccc' : '#000' }}
                          >
                            {summary.maxDaysPerYear}
                          </TableCell>
                          <TableCell
                            align='center'
                            sx={{ color: darkMode ? '#ccc' : '#000' }}
                          >
                            {summary.totalDays}
                          </TableCell>
                          <TableCell
                            align='center'
                            sx={{ color: darkMode ? '#ccc' : '#000' }}
                          >
                            {summary.remainingDays}
                          </TableCell>
                          <TableCell
                            align='center'
                            sx={{ color: darkMode ? '#ccc' : '#000' }}
                          >
                            {emp.totals?.approvedRequests || 0}
                          </TableCell>
                          <TableCell
                            align='center'
                            sx={{ color: darkMode ? '#ccc' : '#000' }}
                          >
                            {emp.totals?.pendingRequests || 0}
                          </TableCell>
                          <TableCell
                            align='center'
                            sx={{ color: darkMode ? '#ccc' : '#000' }}
                          >
                            {emp.totals?.rejectedRequests || 0}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow
                        key={`${emp.employeeId}-no-leaves`}
                        sx={{
                          backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
                        }}
                      >
                        <TableCell sx={{ color: darkMode ? '#ccc' : '#000' }}>
                          {emp.employeeName}
                        </TableCell>
                        <TableCell sx={{ color: darkMode ? '#ccc' : '#000' }}>
                          {emp.department}
                        </TableCell>
                        <TableCell sx={{ color: darkMode ? '#ccc' : '#000' }}>
                          {emp.designation}
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
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box
              display='flex'
              flexDirection='column'
              alignItems='center'
              justifyContent='center'
              mt={3}
              gap={1}
            >
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color='primary'
                shape='rounded'
                size='small'
                sx={{
                  '& .MuiPaginationItem-root': {
                    borderRadius: '50%',
                    minWidth: 32,
                    height: 32,
                  },
                }}
              />
              <Typography
                variant='body2'
                sx={{ color: darkMode ? '#ccc' : 'text.secondary' }}
              >
                Showing {(page - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(page * ITEMS_PER_PAGE, totalRecords)} of{' '}
                {totalRecords} records
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {!isAdminView && (
        <>
          {isManager && (
            <Tabs
              value={tab}
              onChange={handleTabChange}
              variant='scrollable'
              scrollButtons='auto'
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label='My Leave Summary' />
              <Tab label='Team Leave Summary' />
            </Tabs>
          )}
          <TabPanel value={tab} index={0}>
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
                      Used: {item.used} / {item.maxDaysPerYear}
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
                    sx={{
                      backgroundColor: darkMode ? '#2a2a2a' : '#ffffff',
                    }}
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
                        {item.carryForward ? 'Yes' : 'No'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {isManager && (
            <TabPanel value={tab} index={1}>
              {!teamSummary.length && (
                <Typography sx={{ color: darkMode ? '#ccc' : '#000' }}>
                  No team data found.
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
                        <TableCell sx={{ color: darkMode ? '#fff' : '#000' }}>
                          Employee
                        </TableCell>
                        <TableCell sx={{ color: darkMode ? '#fff' : '#000' }}>
                          Email
                        </TableCell>
                        <TableCell sx={{ color: darkMode ? '#fff' : '#000' }}>
                          Department
                        </TableCell>
                        <TableCell sx={{ color: darkMode ? '#fff' : '#000' }}>
                          Designation
                        </TableCell>
                        <TableCell sx={{ color: darkMode ? '#fff' : '#000' }}>
                          Total Leave Days
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {teamSummary.map((member, idx) => (
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
                            {member.name}
                          </TableCell>
                          <TableCell sx={{ color: darkMode ? '#ccc' : '#000' }}>
                            {member.email}
                          </TableCell>
                          <TableCell sx={{ color: darkMode ? '#ccc' : '#000' }}>
                            {member.department}
                          </TableCell>
                          <TableCell sx={{ color: darkMode ? '#ccc' : '#000' }}>
                            {member.designation}
                          </TableCell>
                          <TableCell sx={{ color: darkMode ? '#ccc' : '#000' }}>
                            {member.totalLeaveDays}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </TabPanel>
          )}
        </>
      )}
    </Box>
  );
};

export default Reports;
