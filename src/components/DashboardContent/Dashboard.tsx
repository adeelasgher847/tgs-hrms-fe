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
import { useLanguage } from '../../hooks/useLanguage';
import systemDashboardApiService, {
  type SystemDashboardResponse,
  type RecentLog,
} from '../../api/systemDashboardApi';

import EmployeesInfoChart from './EmployeesInfoChart';
import AvailabilityCardsGrid from './AvailabilityCard/AvailabilityCardsGrid';
import GenderPercentageChart from './GenderPercentageChart';
// import TopPerformersProps from '../DashboardContent/TopPerformance/TopPerformersProps';
// import IconImageCardProps from '../DashboardContent/TotalApplication/IconImageCardProps';
// import ApplicationStats from '../DashboardContent/ApplicationStats/ApplicationStats';
// import UpcomingInterviews from '../DashboardContent/ComingInterview/UpcomingInterviews';
import KPICard from './KPICard';

import ApartmentIcon from '@mui/icons-material/Apartment';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import TenantGrowthChart from './TenantGrowthChart';
import EmployeeGrowthChart from './EmployeeGrowthChart';
import SystemUptimeCard from './SystemUptimeCard';
import RecentActivityLogs from './RecentActivityLogs';
import { getCurrentUser } from '../../utils/auth';
import { isSystemAdmin } from '../../utils/roleUtils';
import { PAGINATION } from '../../constants/appConstants';

const labels = {
  en: { title: 'Dashboard' },
  ar: { title: 'لوحة تحكم الموارد البشرية' },
};

const Dashboard: React.FC = () => {
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
  const itemsPerPage = PAGINATION.DEFAULT_PAGE_SIZE; // Backend returns records per page

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

  const hasMorePages = logs.length === itemsPerPage;
  const estimatedTotalRecords = hasMorePages
    ? currentPage * itemsPerPage
    : (currentPage - 1) * itemsPerPage + logs.length;
  const estimatedTotalPages = hasMorePages ? currentPage + 1 : currentPage;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        color: theme.palette.text.primary,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      <Typography
        sx={{
          direction: language === 'ar' ? 'rtl' : 'ltr',
          color: theme.palette.text.primary,
          textAlign: { xs: 'left' },
          fontWeight: 500,
          fontSize: { xs: '32px', lg: '48px' },
          lineHeight: '44px',
          letterSpacing: '-2%',
          mb: 3,
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
            elevation={0}
            sx={{
              width: '100%',
              borderRadius: '20px',
              backgroundColor: 'transparent',
              boxShadow: 'none',
            }}
          >
            <Grid container spacing={3} sx={{ width: '100%' }}>
              <Grid item xs={6} sm={6} md={6} lg={6} flexGrow={1}>
                <KPICard
                  title='Total Tenants'
                  value={dashboardData?.totalTenants ?? 0}
                  icon={<ApartmentIcon />}
                  color={theme.palette.primary.main}
                />
              </Grid>
              <Grid item xs={6} sm={6} md={6} lg={6} flexGrow={1}>
                <KPICard
                  title='Active Tenants'
                  value={dashboardData?.activeTenants ?? 0}
                  icon={<VerifiedUserIcon />}
                  color={theme.palette.success.main}
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3 },
              width: '100%',
              borderRadius: '20px',
              backgroundColor: theme.palette.background.paper,
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 1px 3px rgba(0,0,0,0.3)' 
                : '0 1px 3px rgba(0,0,0,0.1)',
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
                elevation={0}
                sx={{
                  borderRadius: '20px',
                  backgroundColor: 'transparent',
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
                    title='Total Employees'
                    value={dashboardData?.totalEmployees ?? 0}
                    icon={<PeopleAltIcon />}
                    color={theme.palette.info.main}
                  />
                </Box>

                <Box
                  sx={{
                    overflow: 'hidden',
                    borderRadius: '20px',
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
                      maxHeight: '200px', // Fixed height to show scrollbar after ~4 records
                    }}
                  >
                    <Table size='small' stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell
                            sx={{
                              backgroundColor:
                                theme.palette.mode === 'dark'
                                  ? 'var(--primary-light-color)'
                                  : 'var(--primary-color)',
                              color:
                                theme.palette.mode === 'dark'
                                  ? '#ffffff'
                                  : '#2C2C2C',
                              fontWeight: 700,
                            }}
                          >
                            Tenant
                          </TableCell>
                          <TableCell
                            align='right'
                            sx={{
                              backgroundColor:
                                theme.palette.mode === 'dark'
                                  ? 'var(--primary-light-color)'
                                  : 'var(--primary-color)',
                              color:
                                theme.palette.mode === 'dark'
                                  ? '#ffffff'
                                  : '#2C2C2C',
                              fontWeight: 700,
                            }}
                          >
                            Active Employees
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dashboardData?.activeEmployeesPerTenant?.map(
                          (row, idx) => (
                            <TableRow
                              key={idx}
                              sx={{
                                '&:hover': {
                                  backgroundColor: theme.palette.action.hover,
                                },
                              }}
                            >
                              <TableCell
                                sx={{
                                  color: theme.palette.text.primary,
                                  borderBottom: `0.5px solid ${theme.palette.divider}`,
                                }}
                              >
                                {row.tenantName}
                              </TableCell>
                              <TableCell
                                align='right'
                                sx={{
                                  color: theme.palette.text.primary,
                                  borderBottom: `0.5px solid ${theme.palette.divider}`,
                                }}
                              >
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
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: '20px',
              backgroundColor: theme.palette.background.paper,
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 1px 3px rgba(0,0,0,0.3)' 
                : '0 1px 3px rgba(0,0,0,0.1)',
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
              <Typography 
                variant='h6' 
                fontWeight='bold'
                sx={{ color: theme.palette.text.primary }}
              >
                System Logs
              </Typography>
              <Tooltip title='Export Recent 1000 system logs'>
                <IconButton
                  color='primary'
                  onClick={handleExportLogs}
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    borderRadius: '6px',
                    '&:hover': { backgroundColor: theme.palette.primary.dark },
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
                    <TableCell
                      sx={{
                        backgroundColor:
                          theme.palette.mode === 'dark'
                            ? 'var(--primary-light-color)'
                            : 'var(--primary-color)',
                        color:
                          theme.palette.mode === 'dark'
                            ? '#ffffff'
                            : '#2C2C2C',
                        fontWeight: 700,
                      }}
                    >
                      Action
                    </TableCell>
                    <TableCell
                      sx={{
                        backgroundColor:
                          theme.palette.mode === 'dark'
                            ? 'var(--primary-light-color)'
                            : 'var(--primary-color)',
                        color:
                          theme.palette.mode === 'dark'
                            ? '#ffffff'
                            : '#2C2C2C',
                        fontWeight: 700,
                      }}
                    >
                      Entity
                    </TableCell>
                    <TableCell
                      sx={{
                        backgroundColor:
                          theme.palette.mode === 'dark'
                            ? 'var(--primary-light-color)'
                            : 'var(--primary-color)',
                        color:
                          theme.palette.mode === 'dark'
                            ? '#ffffff'
                            : '#2C2C2C',
                        fontWeight: 700,
                      }}
                    >
                      User Role
                    </TableCell>
                    <TableCell
                      sx={{
                        backgroundColor:
                          theme.palette.mode === 'dark'
                            ? 'var(--primary-light-color)'
                            : 'var(--primary-color)',
                        color:
                          theme.palette.mode === 'dark'
                            ? '#ffffff'
                            : '#2C2C2C',
                        fontWeight: 700,
                      }}
                    >
                      Tenant Id
                    </TableCell>
                    <TableCell
                      sx={{
                        backgroundColor:
                          theme.palette.mode === 'dark'
                            ? 'var(--primary-light-color)'
                            : 'var(--primary-color)',
                        color:
                          theme.palette.mode === 'dark'
                            ? '#ffffff'
                            : '#2C2C2C',
                        fontWeight: 700,
                      }}
                    >
                      Timestamp
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
                      <TableCell
                        colSpan={7}
                        align='center'
                        sx={{ color: theme.palette.text.secondary }}
                      >
                        No logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map(log => (
                      <TableRow
                        key={log.id}
                        hover
                        sx={{
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <TableCell
                          sx={{
                            color: theme.palette.text.primary,
                            borderBottom: `0.5px solid ${theme.palette.divider}`,
                          }}
                        >
                          {log.action}
                        </TableCell>
                        <TableCell
                          sx={{
                            color: theme.palette.text.primary,
                            borderBottom: `0.5px solid ${theme.palette.divider}`,
                          }}
                        >
                          {log.entityType}
                        </TableCell>
                        <TableCell
                          sx={{
                            color: theme.palette.text.primary,
                            borderBottom: `0.5px solid ${theme.palette.divider}`,
                          }}
                        >
                          {log.userRole || '-'}
                        </TableCell>
                        <TableCell
                          sx={{
                            color: theme.palette.text.primary,
                            borderBottom: `0.5px solid ${theme.palette.divider}`,
                          }}
                        >
                          {log.tenantId}
                        </TableCell>
                        <TableCell
                          sx={{
                            color: theme.palette.text.primary,
                            borderBottom: `0.5px solid ${theme.palette.divider}`,
                          }}
                        >
                          {new Date(log.createdAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>

            {(() => {
              const currentPageRowsCount = logs.length;
              const shouldShowPagination =
                estimatedTotalPages > 1 &&
                (currentPage === 1
                  ? currentPageRowsCount === itemsPerPage
                  : true);

              return shouldShowPagination ? (
                <Box display='flex' justifyContent='center' mt={2}>
                  <Pagination
                    count={estimatedTotalPages}
                    page={currentPage}
                    onChange={(_, page) => setCurrentPage(page)}
                    color='primary'
                    showFirstButton
                    showLastButton
                  />
                </Box>
              ) : null;
            })()}

            {estimatedTotalRecords > 0 && (
              <Box display='flex' justifyContent='center' mt={1}>
                <Typography 
                  variant='body2' 
                  sx={{ color: theme.palette.text.secondary }}
                >
                  Showing page {currentPage} of {estimatedTotalPages} (
                  {estimatedTotalRecords} total records)
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          {/* Employee Growth Chart - Full Width */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '20px',
              backgroundColor: theme.palette.background.paper,
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 1px 3px rgba(0,0,0,0.3)' 
                : '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <EmployeesInfoChart />
          </Paper>

          {/* Employees Availability and Activity Cards - Side by Side */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 3,
            }}
          >
            {/* Employees Availability Card */}
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                p: 3,
                borderRadius: '20px',
                backgroundColor: theme.palette.background.paper,
                boxShadow: theme.palette.mode === 'dark' 
                  ? '0 1px 3px rgba(0,0,0,0.3)' 
                  : '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <AvailabilityCardsGrid />
            </Paper>

            {/* Activity Card */}
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                p: 3,
                borderRadius: '20px',
                backgroundColor: theme.palette.background.paper,
                boxShadow: theme.palette.mode === 'dark' 
                  ? '0 1px 3px rgba(0,0,0,0.3)' 
                  : '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <GenderPercentageChart />
            </Paper>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Dashboard;
