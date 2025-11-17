import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, CircularProgress, Paper, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useOutletContext } from 'react-router-dom';
import dayjs from 'dayjs';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { payrollApi, type PayrollStatistics } from '../../api/payrollApi';
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

  const bgColor = effectiveDarkMode
    ? '#121212'
    : theme.palette.background.default;
  const cardBg = effectiveDarkMode ? '#1a1a1a' : '#fff';
  const textColor = effectiveDarkMode ? '#fff' : '#000';

  const loadStatistics = useCallback(async () => {
    try {
      setStatsLoading(true);
      const data = await payrollApi.getPayrollStatistics({});
      setStatistics(data);
    } catch (error) {
      console.error('Failed to load payroll statistics:', error);
      snackbar.error('Failed to load payroll statistics');
      setStatistics(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const trendOptions: ApexOptions = useMemo(() => {
    const categories =
      statistics?.monthlyTrend.map(item =>
        dayjs(`${item.year}-${item.month}-01`).format('MMM YYYY')
      ) || [];
    const series = [
      {
        name: 'Gross',
        data:
          statistics?.monthlyTrend.map(item => Number(item.totalGross) || 0) ||
          [],
      },
      {
        name: 'Deductions',
        data:
          statistics?.monthlyTrend.map(
            item => Number(item.totalDeductions) || 0
          ) || [],
      },
      {
        name: 'Bonuses',
        data:
          statistics?.monthlyTrend.map(
            item => Number(item.totalBonuses) || 0
          ) || [],
      },
      {
        name: 'Net',
        data:
          statistics?.monthlyTrend.map(item => Number(item.totalNet) || 0) ||
          [],
      },
    ];

    const colors = ['#484c7f', '#f19828', '#f5558d', '#6dd3ff'];

    return {
      chart: {
        type: 'line',
        toolbar: { show: false },
        zoom: { enabled: false },
      },
      stroke: {
        curve: 'smooth',
        width: 3,
      },
      markers: {
        size: 4,
      },
      xaxis: {
        categories,
        labels: {
          style: { colors: effectiveDarkMode ? '#d0d0d0' : '#666' },
        },
      },
      yaxis: {
        labels: {
          formatter: val => `$${val / 1000}k`,
          style: { colors: effectiveDarkMode ? '#d0d0d0' : '#666' },
        },
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
      series,
    } as ApexOptions;
  }, [statistics, effectiveDarkMode]);

  const departmentOptions: ApexOptions = useMemo(() => {
    const categories =
      statistics?.departmentComparison.map(item => item.department) || [];

    const grossData =
      statistics?.departmentComparison.map(
        item => Number(item.totalGross) || 0
      ) || [];
    const deductionsData =
      statistics?.departmentComparison.map(
        item => Number(item.totalDeductions) || 0
      ) || [];
    const bonusesData =
      statistics?.departmentComparison.map(
        item => Number(item.totalBonuses) || 0
      ) || [];
    const netData =
      statistics?.departmentComparison.map(
        item => Number(item.totalNet) || 0
      ) || [];

    const colors = ['#484c7f', '#f19828', '#f5558d', '#6dd3ff'];

    return {
      chart: {
        type: 'bar',
        toolbar: { show: false },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: '50%',
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
          style: { colors: effectiveDarkMode ? '#d0d0d0' : '#666' },
          formatter: val => formatCurrency(val),
        },
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
      series: [
        {
          name: 'Gross',
          data: grossData,
        },
        {
          name: 'Deductions',
          data: deductionsData,
        },
        {
          name: 'Bonuses',
          data: bonusesData,
        },
        {
          name: 'Net',
          data: netData,
        },
      ],
    } as ApexOptions;
  }, [statistics, effectiveDarkMode]);

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
      </Box>

      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 3,
          backgroundColor: cardBg,
          borderRadius: 1,
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
              {statistics.monthlyTrend.length === 0 ? (
                <Box sx={{ py: 4 }}>
                  <Alert
                    severity='info'
                    sx={{ backgroundColor: 'transparent' }}
                  >
                    No trend data available for the selected date range.
                  </Alert>
                </Box>
              ) : (
                <Chart
                  options={trendOptions}
                  series={(trendOptions.series as ApexOptions['series']) || []}
                  type='line'
                  height={320}
                />
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
              {statistics.departmentComparison.length === 0 ? (
                <Box sx={{ py: 4 }}>
                  <Alert
                    severity='info'
                    sx={{ backgroundColor: 'transparent' }}
                  >
                    No department comparison data available.
                  </Alert>
                </Box>
              ) : (
                <Chart
                  options={departmentOptions}
                  series={
                    (departmentOptions.series as ApexOptions['series']) || []
                  }
                  type='bar'
                  height={320}
                />
              )}
            </Paper>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default PayrollReports;
