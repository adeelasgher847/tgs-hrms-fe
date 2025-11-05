import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Pagination,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import Chart from 'react-apexcharts';
import { TenantLeaveApi } from '../../api/TenantLeaveApi';
import type { SystemLeaveFilters } from '../../api/TenantLeaveApi';
import { SystemTenantApi } from '../../api/systemTenantApi';
import axiosInstance from '../../api/axiosInstance';

const CrossTenantLeaveManagement: React.FC = () => {
  const [filters, setFilters] = useState<{
    tenantId: string;
    departmentId: string;
    status: string;
    startDate: Dayjs | null;
    endDate: Dayjs | null;
  }>({
    tenantId: '',
    departmentId: '',
    status: '',
    startDate: null,
    endDate: null,
  });

  const [tenants, setTenants] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const isInitialTenantSet = useRef(false);
  const isInitialLoad = useRef(true);

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const fetchTenants = useCallback(async () => {
    try {
      const allTenants = await SystemTenantApi.getAllTenants(false);

      const activeTenants = allTenants.filter(
        tenant => tenant.status === 'active' && !tenant.isDeleted
      );

      setTenants(activeTenants);

      if (activeTenants.length > 0 && !isInitialTenantSet.current) {
        const ibexTech = activeTenants.find(t =>
          t.name.toLowerCase().includes('ibex')
        );

        const defaultTenant = ibexTech || activeTenants[0];

        if (defaultTenant) {
          isInitialTenantSet.current = true;
          setFilters(prev => ({
            ...prev,
            tenantId: defaultTenant.id,
          }));
        }
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to load tenant list',
        severity: 'error',
      });
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get('/departments');
      setDepartments(Array.isArray(data) ? data : []);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to load departments',
        severity: 'error',
      });
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const summaryData = await TenantLeaveApi.getSystemLeaveSummary({
        tenantId: filters.tenantId || undefined,
        status:
          filters.status && filters.status !== ''
            ? (filters.status as
                | 'pending'
                | 'approved'
                | 'rejected'
                | 'withdrawn'
                | 'cancelled')
            : undefined,
        startDate: filters.startDate
          ? dayjs(filters.startDate).format('YYYY-MM-DD')
          : undefined,
        endDate: filters.endDate
          ? dayjs(filters.endDate).format('YYYY-MM-DD')
          : undefined,
      });

      let filteredData = summaryData;
      if (filters.tenantId && filters.tenantId !== '') {
        filteredData = summaryData.filter(
          item => item.tenantId === filters.tenantId
        );

        if (filteredData.length === 0) {
          const selectedTenant = tenants.find(t => t.id === filters.tenantId);
          if (selectedTenant) {
            filteredData = [
              {
                tenantId: selectedTenant.id,
                tenantName: selectedTenant.name,
                totalLeaves: 0,
                approvedCount: 0,
                rejectedCount: 0,
                pendingCount: 0,
                cancelledCount: 0,
              },
            ];
          }
        }
      }

      const sortedSummary = [...filteredData].sort((a, b) =>
        (a.tenantName || '').localeCompare(b.tenantName || '')
      );

      const mapped = sortedSummary.map(item => ({
        tenantId: item.tenantId,
        tenantName: item.tenantName || 'Unknown Tenant',
        totalLeaves: item.totalLeaves || 0,
        approved: item.approvedCount || 0,
        rejected: item.rejectedCount || 0,
        pending: item.pendingCount || 0,
        cancelled: item.cancelledCount || 0,
      }));

      setSummary(mapped);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to load summary',
        severity: 'error',
      });
    }
  }, [filters, tenants]);

  const fetchLeaves = useCallback(async () => {
    try {
      // Don't show loading on initial load when default tenant is set
      if (!isInitialLoad.current) {
        setLoading(true);
      }
      const apiFilters: SystemLeaveFilters = {
        tenantId: filters.tenantId || undefined,
        status:
          filters.status && filters.status !== ''
            ? (filters.status as
                | 'pending'
                | 'approved'
                | 'rejected'
                | 'withdrawn'
                | 'cancelled')
            : undefined,
        startDate: filters.startDate
          ? filters.startDate.format('YYYY-MM-DD')
          : undefined,
        endDate: filters.endDate
          ? filters.endDate.format('YYYY-MM-DD')
          : undefined,
        page: currentPage,
        limit: itemsPerPage,
      };

      const response = await TenantLeaveApi.getSystemLeaves(apiFilters);

      const mappedLeaves = response.items.map((leave: any) => ({
        ...leave,
        tenantName:
          leave.tenantName ||
          leave.tenant?.name ||
          leave.tenant?.tenantName ||
          'Unknown Tenant',
        employeeName:
          leave.employeeName || leave.employee?.name || 'Unknown Employee',
        leaveType: leave.leaveType || leave.leaveType?.name || 'N/A',
      }));

      setLeaves(mappedLeaves);
      setTotalPages(
        response.totalPages || Math.ceil(response.total / itemsPerPage)
      );

      // Mark initial load as complete
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to load leave data',
        severity: 'error',
      });
      // Mark initial load as complete even on error
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
      }
    } finally {
      if (!isInitialLoad.current) {
        setLoading(false);
      }
    }
  }, [filters, currentPage]);

  useEffect(() => {
    fetchTenants();
    fetchDepartments();
  }, [fetchTenants, fetchDepartments]);

  useEffect(() => {
    // Only fetch summary if tenantId is set (either default or user-selected)
    if (filters.tenantId) {
      fetchSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.tenantId, filters.status, filters.startDate, filters.endDate]);

  useEffect(() => {
    // Only fetch leaves if tenantId is set (either default or user-selected)
    if (filters.tenantId) {
      fetchLeaves();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.tenantId,
    filters.status,
    filters.startDate,
    filters.endDate,
    filters.departmentId,
    currentPage,
  ]);

  const handleCloseSnackbar = () =>
    setSnackbar(prev => ({ ...prev, open: false }));

  const handlePageChange = (_: any, page: number) => setCurrentPage(page);

  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'bar',
      stacked: !!filters.tenantId,
      toolbar: { show: true },
      zoom: { enabled: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: filters.tenantId ? '40%' : '20%',
        borderRadius: 4,
        distributed: !filters.tenantId,
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 1, colors: ['#fff'] },
    xaxis: {
      categories: summary.map(item => item.tenantName),
      labels: {
        rotate: -45,
        hideOverlappingLabels: false,
        style: { fontSize: '12px', colors: '#555' },
      },
      tickPlacement: 'on',
    },
    yaxis: {
      labels: {
        formatter: val => `${val}`,
        style: { fontSize: '12px', colors: '#555' },
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      labels: { colors: '#555' },
    },
    grid: {
      borderColor: '#e0e0e0',
      padding: { top: 20, left: 10, right: 10, bottom: 10 },
    },
    colors: filters.tenantId
      ? ['#4E79A7', '#4CAF50', '#E15759', '#FFB300', '#9E9E9E']
      : [
          '#4E79A7',
          '#F28E2B',
          '#E15759',
          '#76B7B2',
          '#59A14F',
          '#EDC948',
          '#AF7AA1',
          '#FF9DA7',
          '#9C755F',
          '#BAB0AC',
        ],
    tooltip: {
      theme: 'light',
      y: { formatter: (val: number) => `${val}` },
    },
  };

  const chartSeries = filters.tenantId
    ? [
        { name: 'Approved', data: summary.map(s => s.approved) },
        { name: 'Rejected', data: summary.map(s => s.rejected) },
        { name: 'Pending', data: summary.map(s => s.pending) },
        { name: 'Cancelled', data: summary.map(s => s.cancelled) },
      ]
    : [
        {
          name: 'Total Leaves',
          data: summary.map(s => s.totalLeaves),
        },
      ];

  if (loading)
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        height='80vh'
      >
        <CircularProgress />
      </Box>
    );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ background: '#f7f7f7', minHeight: '100vh', p: 3 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant='h6' fontWeight={700} mb={2}>
            Tenant Leave Management
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {/* Filters */}
          <Box display='flex' flexWrap='wrap' gap={2}>
            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel>Tenant</InputLabel>
              <Select
                label='Tenant'
                value={filters.tenantId}
                onChange={e => handleFilterChange('tenantId', e.target.value)}
              >
                <MenuItem value=''>All</MenuItem>
                {tenants.map(tenant => (
                  <MenuItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel>Department</InputLabel>
              <Select
                label='Department'
                value={filters.departmentId}
                onChange={e =>
                  handleFilterChange('departmentId', e.target.value)
                }
              >
                <MenuItem value=''>All</MenuItem>
                {departments.map(dep => (
                  <MenuItem key={dep.id} value={dep.id}>
                    {dep.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* Chart */}
        <Paper sx={{ p: 3, mb: 3, overflowX: 'auto' }}>
          <Typography variant='subtitle1' fontWeight={600} mb={2}>
            Leave Summary
          </Typography>
          <Box sx={{ minWidth: summary.length * 60 }}>
            <Chart
              options={chartOptions}
              series={chartSeries}
              type='bar'
              height={400}
            />
          </Box>
        </Paper>

        {/* Table */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant='subtitle1' fontWeight={600} mb={2}>
            Leave Requests
          </Typography>

          {/* Filters */}
          <Box display='flex' flexWrap='wrap' gap={2} mb={3}>
            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel>Status</InputLabel>
              <Select
                label='Status'
                value={filters.status}
                onChange={e => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value=''>All</MenuItem>
                <MenuItem value='pending'>Pending</MenuItem>
                <MenuItem value='approved'>Approved</MenuItem>
                <MenuItem value='rejected'>Rejected</MenuItem>
                <MenuItem value='cancelled'>Cancelled</MenuItem>
              </Select>
            </FormControl>

            <DatePicker
              label='Start Date'
              value={filters.startDate}
              onChange={newDate => handleFilterChange('startDate', newDate)}
            />
            <DatePicker
              label='End Date'
              value={filters.endDate}
              onChange={newDate => handleFilterChange('endDate', newDate)}
            />
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f0f0f0' }}>
                <TableRow>
                  <TableCell>Tenant</TableCell>
                  <TableCell>Employee</TableCell>
                  <TableCell>Leave Type</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Total Days</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Reason</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaves.length > 0 ? (
                  leaves.map(leave => (
                    <TableRow key={leave.id}>
                      <TableCell>{leave.tenantName}</TableCell>
                      <TableCell>{leave.employeeName}</TableCell>
                      <TableCell>{leave.leaveType}</TableCell>
                      <TableCell>
                        {dayjs(leave.startDate).format('YYYY-MM-DD')}
                      </TableCell>
                      <TableCell>
                        {dayjs(leave.endDate).format('YYYY-MM-DD')}
                      </TableCell>
                      <TableCell>{leave.totalDays}</TableCell>
                      <TableCell
                        sx={{
                          color:
                            leave.status === 'approved'
                              ? 'green'
                              : leave.status === 'rejected'
                                ? 'red'
                                : '#ff9800',
                          fontWeight: 600,
                        }}
                      >
                        {leave.status}
                      </TableCell>
                      <TableCell>{leave.reason}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align='center'>
                      No records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box display='flex' justifyContent='center' mt={3}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color='primary'
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </Paper>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default CrossTenantLeaveManagement;
