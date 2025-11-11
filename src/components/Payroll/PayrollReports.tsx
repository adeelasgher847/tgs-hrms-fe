import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useOutletContext } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { payrollApi, type PayrollStatistics } from '../../api/payrollApi';
import { useIsDarkMode } from '../../theme';
import { useUser } from '../../hooks/useUser';

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
  const [statsStartDate, setStatsStartDate] = useState<Dayjs | null>(null);
  const [statsEndDate, setStatsEndDate] = useState<Dayjs | null>(null);

  const bgColor = effectiveDarkMode
    ? '#121212'
    : theme.palette.background.default;
  const cardBg = effectiveDarkMode ? '#1a1a1a' : '#fff';
  const textColor = effectiveDarkMode ? '#fff' : '#000';

  const loadStatistics = useCallback(async () => {
    try {
      setStatsLoading(true);
      const data = await payrollApi.getPayrollStatistics({
        startDate: statsStartDate
          ? statsStartDate.format('YYYY-MM-DD')
          : undefined,
        endDate: statsEndDate ? statsEndDate.format('YYYY-MM-DD') : undefined,
      });
      setStatistics(data);
    } catch (error) {
      console.error('Failed to load payroll statistics:', error);
      snackbar.error('Failed to load payroll statistics');
      setStatistics(null);
    } finally {
      setStatsLoading(false);
    }
  }, [statsStartDate, statsEndDate]);

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
    const seriesData =
      statistics?.departmentComparison.map(
        item => Number(item.totalNet) || 0
      ) || [];

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
        },
      },
      colors: ['#484c7f'],
      grid: {
        borderColor: effectiveDarkMode ? '#333' : '#e0e0e0',
      },
      tooltip: {
        theme: effectiveDarkMode ? 'dark' : 'light',
        x: {
          formatter: val => String(val),
        },
        y: {
          formatter: val => formatCurrency(val),
        },
      },
      series: [
        {
          name: 'Net Salary',
          data: seriesData,
        },
      ],
    } as ApexOptions;
  }, [statistics, effectiveDarkMode]);

  return (
    <Box
      sx={{
        backgroundColor: bgColor,
        minHeight: '100vh',
        p: { xs: 2, md: 3 },
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
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography
          variant='h6'
          sx={{ fontWeight: 600, mb: 2, color: textColor }}
        >
          Statistics
        </Typography>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems='flex-start'
          >
            <DatePicker
              label='Start date'
              value={statsStartDate}
              onChange={value => setStatsStartDate(value)}
              slotProps={{
                textField: {
                  size: 'small',
                  sx: { minWidth: 180 },
                },
              }}
            />
            <DatePicker
              label='End date'
              value={statsEndDate}
              onChange={value => setStatsEndDate(value)}
              slotProps={{
                textField: {
                  size: 'small',
                  sx: { minWidth: 180 },
                },
              }}
            />
          </Stack>
        </LocalizationProvider>

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
          <Grid container spacing={3} mt={1}>
            <Grid item xs={12} md={7}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: effectiveDarkMode ? '#121212' : '#fff',
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
                    series={
                      (trendOptions.series as ApexOptions['series']) || []
                    }
                    type='line'
                    height={320}
                  />
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} md={5}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: effectiveDarkMode ? '#121212' : '#fff',
                  height: '100%',
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
            </Grid>
          </Grid>
        )}
      </Paper>
    </Box>
  );
};

export default PayrollReports;
