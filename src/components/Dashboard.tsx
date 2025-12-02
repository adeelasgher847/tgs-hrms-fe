import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  useTheme,
  Grid,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  CircularProgress,
  Pagination,
  Tooltip,
  IconButton,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { useOutletContext } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import systemDashboardApiService, {
  type SystemDashboardResponse,
  type RecentLog,
} from '../api/systemDashboardApi';

import EmployeesInfoChart from './DashboardContent/EmployeesInfoChart';
import AvailabilityCardsGrid from './DashboardContent/AvailabilityCard/AvailabilityCardsGrid';
import GenderPercentageChart from './DashboardContent/GenderPercentageChart';
// import TopPerformersProps from './DashboardContent/TopPerformance/TopPerformersProps';
// import IconImageCardProps from './DashboardContent/TotalApplication/IconImageCardProps';
// import ApplicationStats from './DashboardContent/ApplicationStats/ApplicationStats';
// import UpcomingInterviews from './DashboardContent/ComingInterview/UpcomingInterviews';
import KPICard from './DashboardContent/KPICard';

import ApartmentIcon from '@mui/icons-material/Apartment';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import TenantGrowthChart from './DashboardContent/TenantGrowthChart';
import EmployeeGrowthChart from './DashboardContent/EmployeeGrowthChart';
import SystemUptimeCard from './DashboardContent/SystemUptimeCard';
import RecentActivityLogs from './DashboardContent/RecentActivityLogs';
import { getCurrentUser } from '../utils/auth';
import { isSystemAdmin } from '../utils/roleUtils';

const labels = {
  en: {
    title: 'Dashboard',
    activeEmployeesHeading: 'Active Employees per Tenant',
    systemLogs: 'System Logs',
    exportTooltip: 'Export Recent 1000 system logs',
    noLogs: 'No logs found',
    totalTenants: 'Total Tenants',
    activeTenants: 'Active Tenants',
    totalEmployees: 'Total Employees',
  },
  ar: {
    title: 'لوحة تحكم الموارد البشرية',
    activeEmployeesHeading: 'الموظفون النشطون لكل مستأجر',
    systemLogs: 'سجلات النظام',
    exportTooltip: 'تصدير أحدث 1000 سجل نظام',
    noLogs: 'لم يتم العثور على سجلات',
    totalTenants: 'إجمالي المستأجرين',
    activeTenants: 'المستأجرون النشطون',
    totalEmployees: 'إجمالي الموظفين',
  },
};

const Dashboard: React.FC = () => {
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const { language } = useLanguage();
  const lang = labels[language];
  const theme = useTheme();

  const pageHelpers = {
    en: {
      showingInfo: (page: number, totalPages: number, total: number) =>
        `Showing page ${page} of ${totalPages} (${total} total records)`,
    },
    ar: {
      showingInfo: (page: number, totalPages: number, total: number) =>
        `عرض الصفحة ${page} من ${totalPages} (${total} سجلات)`,
    },
  } as const;
  const PH = pageHelpers[language] || pageHelpers.en;

  const currentUser = getCurrentUser();
  const userRole = currentUser?.role;
  const isSysAdmin = isSystemAdmin(userRole);

  const [dashboardData, setDashboardData] =
    useState<SystemDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [logs, setLogs] = useState<RecentLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25; // Backend returns 25 records per page

  useEffect(() => {
    const fetchData = async () => {
      if (isSysAdmin) {
        setLoading(true);
        const data = await systemDashboardApiService.getSystemDashboard();
        setDashboardData(data);
        setLoading(false);
      }
    };
    fetchData();
  }, [isSysAdmin]);

  const fetchLogs = useCallback(async (page: number = 1) => {
    try {
      setLogsLoading(true);
      const response = await systemDashboardApiService.getSystemLogs(page);
      setLogs(response);
    } catch (err) {
      console.error('Error fetching system logs:', err);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSysAdmin) fetchLogs(currentPage);
  }, [isSysAdmin, currentPage, fetchLogs]);

  const handleExportLogs = async () => {
    const blob = await systemDashboardApiService.exportSystemLogs();
    if (blob) {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'system_logs.csv';
      link.click();
      window.URL.revokeObjectURL(url);
    }
  };

  if (isSysAdmin && loading) {
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

  // Backend returns 25 records per page (fixed page size)
  // If we get 25 records, there might be more pages
  // If we get less than 25, it's the last page
  const hasMorePages = logs.length === itemsPerPage;
  // Since we don't have total count, we'll show pagination based on current page and whether there are more records
  const showPagination = currentPage > 1 || hasMorePages;
  // Calculate estimated total records
  const estimatedTotalRecords = hasMorePages
    ? currentPage * itemsPerPage
    : (currentPage - 1) * itemsPerPage + logs.length;
  const estimatedTotalPages = hasMorePages ? currentPage + 1 : currentPage;

  const logsTableHeaders = {
    en: {
      action: 'Action',
      entity: 'Entity',
      userRole: 'User Role',
      tenantId: 'Tenant Id',
      timestamp: 'Timestamp',
    },
    ar: {
      action: 'الإجراء',
      entity: 'الكيان',
      userRole: 'دور المستخدم',
      tenantId: 'معرّف المستأجر',
      timestamp: 'الطابع الزمني',
    },
  } as const;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        color: theme.palette.text.primary,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        direction: language === 'ar' ? 'rtl' : 'ltr',
      }}
    >
      <Typography
        variant='h4'
        sx={{
          color: darkMode ? '#8f8f8f' : '#000',
          textAlign: language === 'ar' ? 'right' : 'left',
        }}
      >
        {lang.title}
      </Typography>

      {isSysAdmin ? (
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              width: '100%',
              borderRadius: 1,
              backgroundColor: 'unset',
              boxShadow: 'none',
            }}
          >
            <Grid container spacing={3} sx={{ width: '100%' }}>
              <Grid item xs={6} sm={6} md={6} lg={6} flexGrow={1}>
                <KPICard
                  title={lang.totalTenants}
                  value={dashboardData?.totalTenants ?? 0}
                  icon={<ApartmentIcon />}
                  color={theme.palette.primary.main}
                />
              </Grid>
              <Grid item xs={6} sm={6} md={6} lg={6} flexGrow={1}>
                <KPICard
                  title={lang.activeTenants}
                  value={dashboardData?.activeTenants ?? 0}
                  icon={<VerifiedUserIcon />}
                  color={theme.palette.success.main}
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper
            elevation={3}
            sx={{
              p: { xs: 2, sm: 3 },
              width: '100%',
              borderRadius: 1,
              backgroundColor: theme.palette.background.paper,
              boxShadow: 'none',
            }}
          >
            <TenantGrowthChart />
          </Paper>

          <Grid
            container
            spacing={3}
            sx={{
              width: '100%',
              flexWrap: { xs: 'wrap', md: 'nowrap' },
            }}
          >
            <Grid
              item
              xs={12}
              md={6}
              sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}
            >
              <Paper
                elevation={3}
                sx={{
                  borderRadius: 1,
                  backgroundColor: 'unset',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  boxShadow: 'none',
                  height: '100%',
                  width: '100%',
                }}
              >
                <Box sx={{ flexShrink: 0 }}>
                  <KPICard
                    title={lang.totalEmployees}
                    value={dashboardData?.totalEmployees ?? 0}
                    icon={<PeopleAltIcon />}
                    color={theme.palette.info.main}
                  />
                </Box>

                <Box
                  sx={{
                    overflow: 'hidden',
                    borderRadius: 1,
                    backgroundColor: theme.palette.background.paper,
                  }}
                >
                  <Typography
                    variant='h6'
                    mb={1}
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      px: 2,
                      pt: 2,
                    }}
                  >
                    {lang.activeEmployeesHeading}
                  </Typography>

                  <Box
                    sx={{
                      flexGrow: 1,
                      overflowY: 'auto',
                      overflowX: 'auto',
                      px: 2,
                      pb: 2,
                      maxHeight: '200px', // Fixed height to show scrollbar after ~4 records
                    }}
                  >
                    <Table size='small' stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Tenant</TableCell>
                          <TableCell align='right'>Active Employees</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dashboardData?.activeEmployeesPerTenant?.map(
                          (row, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{row.tenantName}</TableCell>
                              <TableCell align='right'>
                                {row.activeCount}
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </Box>
                </Box>

                <Box sx={{ flexShrink: 0 }}>
                  <EmployeeGrowthChart />
                </Box>
              </Paper>
            </Grid>

            <Grid
              item
              xs={12}
              md={6}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                width: '100%',
              }}
            >
              <SystemUptimeCard
                uptimeSeconds={dashboardData?.systemUptimeSeconds || 0}
              />
              <RecentActivityLogs logs={dashboardData?.recentLogs || []} />
            </Grid>
          </Grid>

          <Paper
            elevation={3}
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 1,
              backgroundColor: theme.palette.background.paper,
              boxShadow: 'none',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                mb: 2,
                gap: 1,
              }}
            >
              <Typography variant='h6' fontWeight='bold'>
                {lang.systemLogs}
              </Typography>
              <Tooltip title={lang.exportTooltip}>
                <IconButton
                  color='primary'
                  onClick={handleExportLogs}
                  sx={{
                    backgroundColor: 'primary.main',
                    color: 'white',
                    borderRadius: '6px',
                    '&:hover': { backgroundColor: 'primary.dark' },
                  }}
                >
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            </Box>

            <Box sx={{ overflowX: 'auto' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>{logsTableHeaders[language].action}</TableCell>
                    <TableCell>{logsTableHeaders[language].entity}</TableCell>
                    <TableCell>{logsTableHeaders[language].userRole}</TableCell>
                    <TableCell>{logsTableHeaders[language].tenantId}</TableCell>
                    <TableCell>
                      {logsTableHeaders[language].timestamp}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logsLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} align='center'>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align='center'>
                        {lang.noLogs}
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map(log => (
                      <TableRow key={log.id} hover>
                        <TableCell>{log.action}</TableCell>
                        <TableCell>{log.entityType}</TableCell>
                        <TableCell>{log.userRole || '-'}</TableCell>
                        <TableCell>{log.tenantId}</TableCell>
                        <TableCell>
                          {new Date(log.createdAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>

            {showPagination && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mt: 2,
                  direction: 'ltr',
                }}
              >
                <Pagination
                  count={estimatedTotalPages}
                  page={currentPage}
                  onChange={(_, page) => setCurrentPage(page)}
                  color='primary'
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}

            {logs.length > 0 && (
              <Box display='flex' justifyContent='center' mt={1}>
                <Typography variant='body2' color='textSecondary'>
                  {PH.showingInfo(
                    currentPage,
                    estimatedTotalPages,
                    estimatedTotalRecords
                  )}
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 2,
            }}
          >
            <Box
              sx={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              <EmployeesInfoChart />
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2,
                }}
              >
                <Box flex={1}>
                  <AvailabilityCardsGrid />
                </Box>
                <Box flex={1}>
                  <GenderPercentageChart />
                </Box>
              </Box>
            </Box>

            {/* <Box
              sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              <IconImageCardProps />
              <ApplicationStats />
              <UpcomingInterviews />
            </Box> */}
          </Box>

          {/* <Box mt={2}>
            <TopPerformersProps />
          </Box> */}
        </>
      )}
    </Box>
  );
};

export default Dashboard;
