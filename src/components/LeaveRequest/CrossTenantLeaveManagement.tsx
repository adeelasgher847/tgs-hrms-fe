import React, { useEffect, useState, useCallback, useRef, memo } from 'react';
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
  Stack,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import Chart from 'react-apexcharts';
import { TenantLeaveApi } from '../../api/TenantLeaveApi';
import type {
  Department as ApiDepartment,
  SystemLeaveFilters,
  SystemLeaveResponse,
  SystemLeaveSummary,
  TenantDepartment,
} from '../../api/TenantLeaveApi';
import { SystemTenantApi } from '../../api/systemTenantApi';
import type { SystemTenant } from '../../api/systemTenantApi';

type LeaveStatus =
  | ''
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'withdrawn'
  | 'cancelled';

type FiltersState = {
  tenantId: string;
  departmentId: string;
  status: LeaveStatus;
  startDate: Dayjs | null;
  endDate: Dayjs | null;
};

type SnackbarState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
};

type DepartmentOption = Pick<ApiDepartment, 'id' | 'name' | 'tenant_id'>;

const CrossTenantLeaveManagement: React.FC = () => {
  const [filters, setFilters] = useState<FiltersState>({
    tenantId: '',
    departmentId: '',
    status: '',
    startDate: null,
    endDate: null,
  });

  const [tenants, setTenants] = useState<SystemTenant[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [leaves, setLeaves] = useState<SystemLeaveResponse[]>([]);
  const [summary, setSummary] = useState<SystemLeaveSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const isInitialTenantSet = useRef(false);
  const isInitialLoad = useRef(true);
  const hasLoadedDataOnce = useRef(false);
  const isInitialMount = useRef(true);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  const handleFilterChange = useCallback(
    <K extends keyof FiltersState>(field: K, value: FiltersState[K]) => {
      setFilters(prev => {
        if (field === 'tenantId') {
          return {
            ...prev,
            tenantId: value as string,
            departmentId: '',
          };
        }

        return { ...prev, [field]: value };
      });
      setCurrentPage(1);
    },
    []
  );

  const fetchTenants = useCallback(async () => {
    try {
      // Fetch all tenants (including deleted) without pagination
      const allTenants = await SystemTenantApi.getAllTenants(true);
      // Show all tenants (no filtering)
      setTenants(allTenants);

      if (allTenants.length > 0 && !isInitialTenantSet.current) {
        const ibexTech = allTenants.find(t =>
          t.name.toLowerCase().includes('ibex')
        );
        const defaultTenant = ibexTech || allTenants[0];
        if (defaultTenant) {
          isInitialTenantSet.current = true;
          setFilters(prev => ({
            ...prev,
            tenantId: defaultTenant.id,
          }));
        }
      }
    } catch {
      setSnackbar({
        open: true,
        message: 'Failed to load tenant list',
        severity: 'error',
      });
    }
  }, []);

  const fetchDepartments = useCallback(async (tenantId: string | null) => {
    if (!tenantId) return setDepartments([]);
    try {
      const tenantDetails = await TenantLeaveApi.getTenantDetailsById(tenantId);
      if (tenantDetails?.departments?.length) {
        const departmentsFromTenant: TenantDepartment[] =
          tenantDetails.departments ?? [];
        const normalizedDepartments: DepartmentOption[] = departmentsFromTenant
          .filter((dept): dept is TenantDepartment => Boolean(dept))
          .map(dept => ({
            id: dept.id ?? '',
            name: dept.name ?? 'Unnamed Department',
            tenant_id: tenantId,
          }));
        setDepartments(normalizedDepartments);
      } else setDepartments([]);
    } catch {
      setSnackbar({
        open: true,
        message: 'Failed to load departments',
        severity: 'error',
      });
      setDepartments([]);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const summaryData = await TenantLeaveApi.getSystemLeaveSummary({
        tenantId: filters.tenantId || undefined,
        status: filters.status ? filters.status : undefined,
        startDate: filters.startDate
          ? dayjs(filters.startDate).format('YYYY-MM-DD')
          : undefined,
        endDate: filters.endDate
          ? dayjs(filters.endDate).format('YYYY-MM-DD')
          : undefined,
      });

      let filteredData = summaryData;
      if (filters.tenantId) {
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

      setSummary(
        sortedSummary.map(item => ({
          tenantId: item.tenantId,
          tenantName: item.tenantName || 'Unknown Tenant',
          totalLeaves: item.totalLeaves ?? 0,
          approvedCount: item.approvedCount ?? 0,
          rejectedCount: item.rejectedCount ?? 0,
          pendingCount: item.pendingCount ?? 0,
          cancelledCount: item.cancelledCount ?? 0,
        }))
      );
    } catch {
      setSnackbar({
        open: true,
        message: 'Failed to load summary',
        severity: 'error',
      });
    }
  }, [
    filters.tenantId,
    filters.status,
    filters.startDate,
    filters.endDate,
    tenants,
  ]);

  const fetchLeaves = useCallback(async () => {
    const shouldShowFullPageLoader =
      isInitialMount.current &&
      !hasLoadedDataOnce.current &&
      !isInitialTenantSet.current;

    try {
      if (shouldShowFullPageLoader) {
        setLoading(true);
      } else {
        setTableLoading(true);
      }

      const apiFilters: SystemLeaveFilters = {
        tenantId: filters.tenantId || undefined,
        departmentId: filters.departmentId || undefined,
        status: filters.status ? filters.status : undefined,
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
      const mappedLeaves: SystemLeaveResponse[] = response.items.map(leave => ({
        ...leave,
        tenantName: leave.tenantName ?? 'Unknown Tenant',
        departmentName: leave.departmentName ?? 'N/A',
      }));

      setLeaves(mappedLeaves);
      setTotalPages(
        response.totalPages || Math.ceil(response.total / itemsPerPage)
      );

      hasLoadedDataOnce.current = true;
      if (isInitialLoad.current) isInitialLoad.current = false;
      if (isInitialMount.current) isInitialMount.current = false;
    } catch {
      setSnackbar({
        open: true,
        message: 'Failed to load leave data',
        severity: 'error',
      });
      if (isInitialLoad.current) isInitialLoad.current = false;
    } finally {
      if (shouldShowFullPageLoader) {
        setLoading(false);
      } else {
        setTableLoading(false);
      }
    }
  }, [
    filters.tenantId,
    filters.status,
    filters.startDate,
    filters.endDate,
    filters.departmentId,
    currentPage,
  ]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  useEffect(() => {
    if (filters.tenantId) fetchDepartments(filters.tenantId);
    else setDepartments([]);
  }, [filters.tenantId, fetchDepartments]);

  useEffect(() => {
    if (filters.tenantId) fetchSummary();
  }, [
    filters.tenantId,
    filters.status,
    filters.startDate,
    filters.endDate,
    fetchSummary,
  ]);

  useEffect(() => {
    if (filters.tenantId) fetchLeaves();
  }, [
    filters.tenantId,
    filters.status,
    filters.startDate,
    filters.endDate,
    filters.departmentId,
    currentPage,
    fetchLeaves,
  ]);

  const handleCloseSnackbar = () =>
    setSnackbar(prev => ({ ...prev, open: false }));

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) =>
    setCurrentPage(page);

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
    xaxis: { categories: summary.map(item => item.tenantName) },
    yaxis: { labels: { formatter: val => `${val}` } },
    legend: { position: 'top', horizontalAlign: 'right' },
  };

  const chartSeries = filters.tenantId
    ? [
        { name: 'Approved', data: summary.map(s => s.approvedCount) },
        { name: 'Rejected', data: summary.map(s => s.rejectedCount) },
        { name: 'Pending', data: summary.map(s => s.pendingCount) },
        { name: 'Cancelled', data: summary.map(s => s.cancelledCount) },
      ]
    : [{ name: 'Total Leaves', data: summary.map(s => s.totalLeaves) }];

  const ChartSection = memo(() => (
    <Paper sx={{ p: 3, mb: 3, overflowX: 'auto',boxShadow:'none'}}>
      <Typography variant='subtitle1' fontWeight={600} mb={2}>
        Leave Summary
      </Typography>
      <Chart
        options={chartOptions}
        series={chartSeries}
        type='bar'
        height={400}
      />
    </Paper>
  ));

  const TableSection = memo(
    ({
      tableLoading,
      filters,
      leaves,
      departments,
      currentPage,
      totalPages,
      isMobile,
      handleFilterChange,
      handlePageChange,
    }: {
      tableLoading: boolean;
      filters: {
        tenantId: string;
        departmentId: string;
        status: LeaveStatus;
        startDate: Dayjs | null;
        endDate: Dayjs | null;
      };
      leaves: SystemLeaveResponse[];
      departments: DepartmentOption[];
      currentPage: number;
      totalPages: number;
      isMobile: boolean;
      handleFilterChange: <K extends keyof FiltersState>(
        field: K,
        value: FiltersState[K]
      ) => void;
      handlePageChange: (
        event: React.ChangeEvent<unknown>,
        page: number
      ) => void;
    }) => (
      <Paper sx={{ p: 3, position: 'relative', boxShadow:'none' }}>
        <Typography variant='subtitle1' fontWeight={600} mb={2}>
          Leave Management Table
        </Typography>
        <Stack direction={isMobile ? 'column' : 'row'} spacing={2} mb={3}>
          <FormControl sx={{ minWidth: 180 }} size='small'>
            <InputLabel>Department</InputLabel>
            <Select
              label='Department'
              value={filters.departmentId}
              onChange={e =>
                handleFilterChange(
                  'departmentId',
                  e.target.value as FiltersState['departmentId']
                )
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
          <FormControl sx={{ minWidth: 160 }} size='small'>
            <InputLabel>Status</InputLabel>
            <Select
              label='Status'
              value={filters.status}
              onChange={e =>
                handleFilterChange('status', e.target.value as LeaveStatus)
              }
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
            onChange={date =>
              handleFilterChange('startDate', date as Dayjs | null)
            }
            slotProps={{ textField: { size: 'small' } }}
          />
          <DatePicker
            label='End Date'
            value={filters.endDate}
            onChange={date =>
              handleFilterChange('endDate', date as Dayjs | null)
            }
            slotProps={{ textField: { size: 'small' } }}
          />
        </Stack>
        {tableLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              zIndex: 1,
            }}
          >
            <CircularProgress />
          </Box>
        )}
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f0f0f0' }}>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Department</TableCell>
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
                    <TableCell>{leave.employeeName}</TableCell>
                    <TableCell>{leave.departmentName || '-'}</TableCell>
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
    )
  );

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
      <Box
        sx={{ background: '#f7f7f7', minHeight: '100vh',}}
        onKeyDown={handleKeyDown}
      >
        <Paper sx={{ p: 3, mb: 3, boxShadow:'none' }}>
          <Typography variant='h6' fontWeight={700} mb={2}>
            Tenant Leave Management
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack
            direction={isMobile ? 'column' : 'row'}
            spacing={2}
            flexWrap='wrap'
          >
            <FormControl sx={{ minWidth: 160 }} size='small'>
              <InputLabel>Tenant</InputLabel>
              <Select
                label='Tenant'
                value={filters.tenantId}
                onChange={e => handleFilterChange('tenantId', e.target.value)}
              >
                {tenants.map(t => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Paper>
        <ChartSection />
        <TableSection
          tableLoading={tableLoading}
          filters={filters}
          leaves={leaves}
          departments={departments}
          currentPage={currentPage}
          totalPages={totalPages}
          isMobile={isMobile}
          handleFilterChange={handleFilterChange}
          handlePageChange={handlePageChange}
        />

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
