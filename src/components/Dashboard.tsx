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
  Button,
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
import TopPerformersProps from './DashboardContent/TopPerformance/TopPerformersProps';
import IconImageCardProps from './DashboardContent/TotalApplication/IconImageCardProps';
import ApplicationStats from './DashboardContent/ApplicationStats/ApplicationStats';
import UpcomingInterviews from './DashboardContent/ComingInterview/UpcomingInterviews';
import KPICard from './DashboardContent/KPICard';

import ApartmentIcon from '@mui/icons-material/Apartment';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import TenantGrowthChart from './DashboardContent/TenantGrowthChart';
import SystemUptimeCard from './DashboardContent/SystemUptimeCard';
import RecentActivityLogs from './DashboardContent/RecentActivityLogs';
import { getCurrentUser } from '../utils/auth';
import { isSystemAdmin } from '../utils/roleUtils';

const labels = {
  en: { title: 'Dashboard' },
  ar: { title: 'لوحة تحكم الموارد البشرية' },
};

const Dashboard: React.FC = () => {
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const { language } = useLanguage();
  const lang = labels[language];
  const theme = useTheme();

  const currentUser = getCurrentUser();
  const userRole = currentUser?.role;
  const isSysAdmin = isSystemAdmin(userRole);

  const [dashboardData, setDashboardData] =
    useState<SystemDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [logs, setLogs] = useState<RecentLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const totalPages = Math.ceil(logs.length / itemsPerPage);
  const paginatedLogs = logs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Box sx={{ minHeight: '100vh', color: theme.palette.text.primary }}>
      <Typography
        variant='h4'
        mb={3}
        sx={{
          direction: language === 'ar' ? 'rtl' : 'ltr',
          color: darkMode ? '#8f8f8f' : '#000',
          textAlign: { xs: 'center', md: 'left' },
        }}
      >
        {lang.title}
      </Typography>

      {isSysAdmin ? (
        <Box sx={{ width: '100%' }}>
          <Paper
            elevation={3}
            sx={{
              mt: 3,
              p: { xs: 2, sm: 3 },
              width: '100%',
              borderRadius: 2,
              backgroundColor: theme.palette.background.paper,
              boxShadow: 'none',
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={6} lg={6} flexGrow={1}>
                <KPICard
                  title='Total Tenants'
                  value={dashboardData?.totalTenants ?? 0}
                  icon={<ApartmentIcon />}
                  color={theme.palette.primary.main}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={6} lg={6} flexGrow={1}>
                <KPICard
                  title='Active Tenants'
                  value={dashboardData?.activeTenants ?? 0}
                  icon={<VerifiedUserIcon />}
                  color={theme.palette.success.main}
                />
              </Grid>

              <Grid item xs={12} flexGrow={1}>
                <TenantGrowthChart />
              </Grid>
            </Grid>
          </Paper>

          <Grid
            container
            spacing={2}
            sx={{
              mt: 2,
              flexWrap: { xs: 'wrap', md: 'nowrap' },
            }}
          >
            <Grid
              item
              xs={12}
              md={6}
              flexGrow={1}
              sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              <Paper
                elevation={3}
                sx={{
                  p: { xs: 2, sm: 3 },
                  borderRadius: 2,
                  backgroundColor: theme.palette.background.paper,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  boxShadow: 'none',
                }}
              >
                <Box sx={{ flexShrink: 0 }}>
                  <KPICard
                    title='Total Employees'
                    value={dashboardData?.totalEmployees ?? 0}
                    icon={<PeopleAltIcon />}
                    color={theme.palette.info.main}
                  />
                </Box>

                <Box
                  sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
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
                    Active Employees per Tenant
                  </Typography>

                  <Box
                    sx={{
                      flexGrow: 1,
                      overflowY: 'auto',
                      overflowX: 'auto',
                      px: 2,
                      pb: 2,
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

                <Box sx={{ flexShrink: 0, mt: 1 }}>
                  <EmployeesInfoChart />
                </Box>
              </Paper>
            </Grid>

            <Grid
              item
              xs={12}
              md={6}
              flexGrow={1}
              sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
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
              mt: 2,
              p: { xs: 2, sm: 3 },
              borderRadius: 2,
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
                System Logs
              </Typography>
              <Tooltip title='Export Recent 1000 system logs'>
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
                    <TableCell>Action</TableCell>
                    <TableCell>Entity</TableCell>
                    <TableCell>User Role</TableCell>
                    <TableCell>Route</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>IP</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logsLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} align='center'>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : paginatedLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align='center'>
                        No logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedLogs.map(log => (
                      <TableRow key={log.id} hover>
                        <TableCell>{log.action}</TableCell>
                        <TableCell>{log.entityType}</TableCell>
                        <TableCell>{log.userRole || '-'}</TableCell>
                        <TableCell>{log.route}</TableCell>
                        <TableCell>{log.method}</TableCell>
                        <TableCell>{log.ip}</TableCell>
                        <TableCell>
                          {new Date(log.createdAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>

            {totalPages > 1 && (
              <Box display='flex' justifyContent='center' mt={2}>
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

            {logs.length > 0 && (
              <Box display='flex' justifyContent='center' mt={1}>
                <Typography variant='body2' color='textSecondary'>
                  Showing page {currentPage} of {totalPages} ({logs.length}{' '}
                  total records)
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      ) : (
        <>
          {/* Non-system-admin layout */}
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

            <Box
              sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              <IconImageCardProps />
              <ApplicationStats />
              <UpcomingInterviews />
            </Box>
          </Box>

          <Box mt={2}>
            <TopPerformersProps />
          </Box>
        </>
      )}
    </Box>
  );
};

export default Dashboard;
