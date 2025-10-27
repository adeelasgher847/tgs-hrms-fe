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

const cardStyle = {
  flex: '1 1 calc(33.33% - 16px)',
  minWidth: '250px',
  boxShadow: 'none',
  border: '1px solid #e0e0e0',
  borderRadius: '0.5rem',
  backgroundColor: '#ffffff',
};

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

  const handleTabChange = (_: any, newValue: number) => setTab(newValue);

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
    } catch (err: any) {
      console.error('Error fetching reports:', err);
      setError(err.message);
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
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tab, userInfo, page]);

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
        mb={3}
        flexWrap='wrap'
        gap={1}
      >
        <Typography variant='h4' fontWeight={600}>
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
            sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}
          >
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell>
                    <b>Employee Name</b>
                  </TableCell>
                  <TableCell>
                    <b>Department</b>
                  </TableCell>
                  <TableCell>
                    <b>Designation</b>
                  </TableCell>
                  <TableCell>
                    <b>Leave Type</b>
                  </TableCell>
                  <TableCell align='center'>
                    <b>Total</b>
                  </TableCell>
                  <TableCell align='center'>
                    <b>Used</b>
                  </TableCell>
                  <TableCell align='center'>
                    <b>Remaining</b>
                  </TableCell>
                  <TableCell align='center'>
                    <b>Approved</b>
                  </TableCell>
                  <TableCell align='center'>
                    <b>Pending</b>
                  </TableCell>
                  <TableCell align='center'>
                    <b>Rejected</b>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allLeaveReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} align='center'>
                      No leave reports found
                    </TableCell>
                  </TableRow>
                ) : (
                  allLeaveReports.flatMap(emp =>
                    emp.leaveSummary && emp.leaveSummary.length > 0 ? (
                      emp.leaveSummary.map((summary, index) => (
                        <TableRow key={`${emp.employeeId}-${index}`}>
                          <TableCell>{emp.employeeName}</TableCell>
                          <TableCell>{emp.department}</TableCell>
                          <TableCell>{emp.designation}</TableCell>
                          <TableCell>{summary.leaveTypeName}</TableCell>
                          <TableCell align='center'>
                            {summary.maxDaysPerYear}
                          </TableCell>
                          <TableCell align='center'>
                            {summary.totalDays}
                          </TableCell>
                          <TableCell align='center'>
                            {summary.remainingDays}
                          </TableCell>
                          <TableCell align='center'>
                            {emp.totals?.approvedRequests || 0}
                          </TableCell>
                          <TableCell align='center'>
                            {emp.totals?.pendingRequests || 0}
                          </TableCell>
                          <TableCell align='center'>
                            {emp.totals?.rejectedRequests || 0}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow key={`${emp.employeeId}-no-leaves`}>
                        <TableCell>{emp.employeeName}</TableCell>
                        <TableCell>{emp.department}</TableCell>
                        <TableCell>{emp.designation}</TableCell>
                        <TableCell colSpan={8} align='center'>
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
              <Typography variant='body2' color='text.secondary'>
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
                <Card key={idx} sx={cardStyle}>
                  <CardContent>
                    <Typography color='textSecondary' gutterBottom>
                      {item.leaveTypeName}
                    </Typography>
                    <Typography
                      variant='h4'
                      fontWeight={600}
                      color='primary.main'
                    >
                      {item.remaining}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Used: {item.used} / {item.maxDaysPerYear}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
            <TableContainer component={Card}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#ffffff' }}>
                    <TableCell>Leave Type</TableCell>
                    <TableCell>Max Days</TableCell>
                    <TableCell>Used</TableCell>
                    <TableCell>Remaining</TableCell>
                    <TableCell>Carry Forward</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaveBalance.map((item, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>{item.leaveTypeName}</TableCell>
                      <TableCell>{item.maxDaysPerYear}</TableCell>
                      <TableCell>{item.used}</TableCell>
                      <TableCell>{item.remaining}</TableCell>
                      <TableCell>{item.carryForward ? 'Yes' : 'No'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {isManager && (
            <TabPanel value={tab} index={1}>
              {!teamSummary.length && (
                <Typography>No team data found.</Typography>
              )}
              {!!teamSummary.length && (
                <TableContainer component={Card}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Department</TableCell>
                        <TableCell>Designation</TableCell>
                        <TableCell>Total Leave Days</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {teamSummary.map((member, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell>{member.name}</TableCell>
                          <TableCell>{member.email}</TableCell>
                          <TableCell>{member.department}</TableCell>
                          <TableCell>{member.designation}</TableCell>
                          <TableCell>{member.totalLeaveDays}</TableCell>
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
