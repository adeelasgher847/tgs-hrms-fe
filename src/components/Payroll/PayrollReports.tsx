import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Stack,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useOutletContext } from 'react-router-dom';
import dayjs from 'dayjs';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { payrollApi, type PayrollStatistics } from '../../api/payrollApi';
import systemEmployeeApiService, {
  type SystemEmployee,
} from '../../api/systemEmployeeApi';
import { useIsDarkMode } from '../../theme';
import { snackbar } from '../../utils/snackbar';

const formatCurrency = (value: number | string | undefined) => {
  if (value === undefined || value === null) return '-';
  const numberValue = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(numberValue)) return String(value);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(numberValue);
};

const PayrollReports: React.FC = () => {
  const theme = useTheme();
  const darkMode = useIsDarkMode();
  const { darkMode: outletDarkMode } = useOutletContext<{
    darkMode: boolean;
  }>();
  const effectiveDarkMode =
    typeof outletDarkMode === 'boolean' ? outletDarkMode : darkMode;

  const [statistics, setStatistics] = useState<PayrollStatistics | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);
  const [tenants, setTenants] = useState<SystemEmployee[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [loadingTenants, setLoadingTenants] = useState<boolean>(false);

  const bgColor = effectiveDarkMode
    ? '#121212'
    : theme.palette.background.default;
  const cardBg = effectiveDarkMode ? '#1a1a1a' : '#fff';
  const textColor = effectiveDarkMode ? '#fff' : '#000';

  const loadTenants = useCallback(async () => {
    try {
      setLoadingTenants(true);
      const data = await systemEmployeeApiService.getAllTenants(true);
      console.log('Loaded tenants:', data.length);
      setTenants(data);

      // Set TGS as default tenant if it exists
      const tgsTenant = data.find(
        tenant => tenant.name?.toLowerCase() === 'tgs'
      );
      if (tgsTenant) {
        setSelectedTenantId(tgsTenant.id);
      }
    } catch (error) {
      console.error('Failed to load tenants:', error);
      snackbar.error('Failed to load tenants');
    } finally {
      setLoadingTenants(false);
    }
  }, []);

  const loadStatistics = useCallback(async () => {
    try {
      setStatsLoading(true);
      const params: {
        tenantId?: string;
      } = {};
      if (selectedTenantId) {
        params.tenantId = selectedTenantId;
      }
      const data = await payrollApi.getPayrollStatistics(params);
      console.log('Payroll statistics data:', data);
      console.log('Monthly trend:', data?.monthlyTrend);
      console.log('Department comparison:', data?.departmentComparison);
      setStatistics(data);
    } catch (error) {
      console.error('Failed to load payroll statistics:', error);
      snackbar.error('Failed to load payroll statistics');
      setStatistics(null);
    } finally {
      setStatsLoading(false);
    }
  }, [selectedTenantId]);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const trendSeries = useMemo(() => {
    if (
      !statistics ||
      !statistics.monthlyTrend ||
      !Array.isArray(statistics.monthlyTrend) ||
      statistics.monthlyTrend.length === 0
    )
      return [];
    const series = [
      {
        name: 'Gross',
        data: statistics.monthlyTrend.map(item => Number(item.totalGross) || 0),
      },
      {
        name: 'Deductions',
        data: statistics.monthlyTrend.map(
          item => Number(item.totalDeductions) || 0
        ),
      },
      {
        name: 'Bonuses',
        data: statistics.monthlyTrend.map(
          item => Number(item.totalBonuses) || 0
        ),
      },
      {
        name: 'Net',
        data: statistics.monthlyTrend.map(item => Number(item.totalNet) || 0),
      },
    ];
    console.log('Trend series data:', series);
    return series;
  }, [statistics]);

  const trendOptions: ApexOptions = useMemo(() => {
    const categories =
      statistics?.monthlyTrend && Array.isArray(statistics.monthlyTrend)
        ? statistics.monthlyTrend.map(item =>
            dayjs(`${item.year}-${item.month}-01`).format('MMM YYYY')
          )
        : [];

    console.log('Trend chart series:', trendSeries);
    console.log('Trend chart categories:', categories);

    const colors = ['#484c7f', '#f19828', '#f5558d', '#6dd3ff'];

    return {
      chart: {
        type: 'line',
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: {
          enabled: true,
        },
      },
      stroke: {
        curve: 'smooth',
        width: 3,
      },
      markers: {
        size: 4,
        hover: {
          size: 6,
        },
      },
      xaxis: {
        categories,
        labels: {
          style: { colors: effectiveDarkMode ? '#d0d0d0' : '#666' },
        },
      },
      yaxis: {
        labels: {
          formatter: val => {
            if (val === 0) return '$0';
            if (val < 1000) return `$${val}`;
            return `$${val / 1000}k`;
          },
          style: { colors: effectiveDarkMode ? '#d0d0d0' : '#666' },
        },
        min: 0,
        max: undefined,
        forceNiceScale: true,
        tickAmount: 5,
      },
      legend: {
        position: 'top',
        horizontalAlign: 'center',
        labels: { colors: effectiveDarkMode ? '#d0d0d0' : '#333' },
      },
      grid: {
        borderColor: effectiveDarkMode ? '#333' : '#e0e0e0',
      },
      colors,
      tooltip: {
        theme: effectiveDarkMode ? 'dark' : 'light',
        y: {
          formatter: val => formatCurrency(val),
        },
      },
    } as ApexOptions;
  }, [statistics, effectiveDarkMode, trendSeries]);

  const departmentSeries = useMemo(() => {
    if (
      !statistics ||
      !statistics.departmentComparison ||
      !Array.isArray(statistics.departmentComparison) ||
      statistics.departmentComparison.length === 0
    )
      return [];
    const series = [
      {
        name: 'Gross',
        data: statistics.departmentComparison.map(
          item => Number(item.totalGross) || 0
        ),
      },
      {
        name: 'Deductions',
        data: statistics.departmentComparison.map(
          item => Number(item.totalDeductions) || 0
        ),
      },
      {
        name: 'Bonuses',
        data: statistics.departmentComparison.map(
          item => Number(item.totalBonuses) || 0
        ),
      },
      {
        name: 'Net',
        data: statistics.departmentComparison.map(
          item => Number(item.totalNet) || 0
        ),
      },
    ];
    console.log('Department series data:', series);
    return series;
  }, [statistics]);

  const departmentOptions: ApexOptions = useMemo(() => {
    const categories =
      statistics?.departmentComparison &&
      Array.isArray(statistics.departmentComparison)
        ? statistics.departmentComparison.map(item => item.department.trim())
        : [];

    console.log('Department chart series:', departmentSeries);
    console.log('Department chart categories:', categories);

    const colors = ['#484c7f', '#f19828', '#f5558d', '#6dd3ff'];

    return {
      chart: {
        type: 'bar',
        toolbar: { show: false },
        animations: {
          enabled: true,
        },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: '50%',
          dataLabels: {
            position: 'top',
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      xaxis: {
        categories,
        labels: {
          style: { colors: effectiveDarkMode ? '#d0d0d0' : '#666' },
        },
      },
      yaxis: {
        labels: {
          style: { colors: effectiveDarkMode ? '#d0d0d0' : '#666' },
          formatter: val => formatCurrency(val),
        },
        min: 0,
        max: undefined,
        forceNiceScale: true,
        tickAmount: 5,
      },
      colors,
      grid: {
        borderColor: effectiveDarkMode ? '#333' : '#e0e0e0',
      },
      legend: {
        position: 'top',
        horizontalAlign: 'center',
        labels: { colors: effectiveDarkMode ? '#d0d0d0' : '#333' },
      },
      tooltip: {
        theme: effectiveDarkMode ? 'dark' : 'light',
        y: {
          formatter: val => formatCurrency(val),
        },
      },
    } as ApexOptions;
  }, [statistics, effectiveDarkMode, departmentSeries]);

  return (
    <Box
      sx={{
        backgroundColor: bgColor,
        minHeight: '100vh',
        color: textColor,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant='h4' sx={{ fontWeight: 600, color: textColor }}>
            Payroll Reports
          </Typography>
        </Box>
        <Stack direction='row' spacing={2} alignItems='center'>
          <TextField
            select
            label='Tenant'
            value={selectedTenantId}
            onChange={e => setSelectedTenantId(e.target.value)}
            size='small'
            sx={{
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                backgroundColor: effectiveDarkMode ? '#1e1e1e' : '#fff',
                color: textColor,
              },
              '& .MuiInputLabel-root': {
                color: effectiveDarkMode ? '#ccc' : '#666',
              },
            }}
            disabled={loadingTenants}
          >
            <MenuItem value=''>All Tenants</MenuItem>
            {tenants.map(tenant => (
              <MenuItem key={tenant.id} value={tenant.id}>
                {tenant.name}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Box>

      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 3,
          backgroundColor: cardBg,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        {statsLoading ? (
          <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : !statistics ? (
          <Box sx={{ py: 4 }}>
            <Alert severity='info' sx={{ backgroundColor: 'transparent' }}>
              No statistics available for the selected filters.
            </Alert>
          </Box>
        ) : (
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: effectiveDarkMode ? '#121212' : '#fff',
                width: '100%',
              }}
            >
              <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 1 }}>
                Monthly Trend
              </Typography>
              {!statistics.monthlyTrend ||
              statistics.monthlyTrend.length === 0 ? (
                <Box sx={{ py: 4 }}>
                  <Alert
                    severity='info'
                    sx={{ backgroundColor: 'transparent' }}
                  >
                    No trend data available for the selected date range.
                  </Alert>
                </Box>
              ) : (
                <Box>
                  <Chart
                    options={trendOptions}
                    series={trendSeries}
                    type='line'
                    height={320}
                  />
                </Box>
              )}
            </Paper>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: effectiveDarkMode ? '#121212' : '#fff',
                width: '100%',
              }}
            >
              <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 1 }}>
                Department Comparison
              </Typography>
              {!statistics.departmentComparison ||
              statistics.departmentComparison.length === 0 ? (
                <Box sx={{ py: 4 }}>
                  <Alert
                    severity='info'
                    sx={{ backgroundColor: 'transparent' }}
                  >
                    No department comparison data available.
                  </Alert>
                </Box>
              ) : (
                <Box>
                  <Chart
                    options={departmentOptions}
                    series={departmentSeries}
                    type='bar'
                    height={320}
                  />
                </Box>
              )}
            </Paper>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default PayrollReports;
