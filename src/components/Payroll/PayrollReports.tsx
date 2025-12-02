import React, { useEffect, useMemo, useState } from 'react';
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
import { useLanguage } from '@/hooks/useLanguage';

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

const PAYROLL_STRINGS = {
  en: {
    pageTitle: 'Payroll Reports',
    tenantLabel: 'Tenant',
    allTenants: 'All Tenants',
    monthlyTrend: 'Monthly Trend',
    departmentComparison: 'Department Comparison',
    noStatistics: 'No statistics available for the selected filters.',
    noTrendData: 'No trend data available for the selected date range.',
    noDepartmentData: 'No department comparison data available.',
    gross: 'Gross',
    deductions: 'Deductions',
    bonuses: 'Bonuses',
    net: 'Net',
  },
  ar: {
    pageTitle: 'تقارير الرواتب',
    tenantLabel: 'المستأجر',
    allTenants: 'جميع المستأجرين',
    monthlyTrend: 'الاتجاه الشهري',
    departmentComparison: 'مقارنة الأقسام',
    noStatistics: 'لا توجد إحصاءات متاحة للمرشحات المحددة.',
    noTrendData: 'لا توجد بيانات للاتجاه للفترة المحددة.',
    noDepartmentData: 'لا توجد بيانات مقارنة للأقسام.',
    gross: 'الإجمالي',
    deductions: 'الاستقطاعات',
    bonuses: 'المكافآت',
    net: 'الصافي',
  },
} as const;

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

  const { language } = useLanguage();

  const L = useMemo(
    () => PAYROLL_STRINGS[language as 'en' | 'ar'] || PAYROLL_STRINGS.en,
    [language]
  );

  const bgColor = effectiveDarkMode
    ? '#121212'
    : theme.palette.background.default;
  const cardBg = effectiveDarkMode ? '#1a1a1a' : '#fff';
  const textColor = effectiveDarkMode ? '#fff' : '#000';

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoadingTenants(true);
        setStatsLoading(true);

        const allTenants = await systemEmployeeApiService.getAllTenants(true);
        // Filter to only show active tenants
        const activeTenants = allTenants.filter(t => t.status === 'active');
        setTenants(activeTenants);

        // Default tenant: "Testify Solutions"
        let defaultTenantId = '';
        const testifyTenant = activeTenants.find(
          t => t.name.toLowerCase() === 'testify solutions'
        );
        if (testifyTenant) {
          defaultTenantId = testifyTenant.id;
        } else if (activeTenants.length > 0) {
          defaultTenantId = activeTenants[0].id;
        }
        setSelectedTenantId(defaultTenantId);

        // Load statistics for default tenant
        const stats = await payrollApi.getPayrollStatistics({
          tenantId: defaultTenantId,
        });
        setStatistics(stats);
      } catch (error) {
        console.error('Error loading initial payroll data:', error);
        snackbar.error('Failed to load payroll data');
      } finally {
        setLoadingTenants(false);
        setStatsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (!selectedTenantId) return;

    const loadStats = async () => {
      try {
        setStatsLoading(true);
        const stats = await payrollApi.getPayrollStatistics({
          tenantId: selectedTenantId,
        });
        setStatistics(stats);
      } catch {
        snackbar.error('Failed to load payroll statistics');
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, [selectedTenantId]);

  const trendSeries = useMemo(() => {
    if (!statistics?.monthlyTrend || statistics.monthlyTrend.length === 0)
      return [];
    return [
      {
        name: L.gross,
        data: statistics.monthlyTrend.map(item => Number(item.totalGross) || 0),
      },
      {
        name: L.deductions,
        data: statistics.monthlyTrend.map(
          item => Number(item.totalDeductions) || 0
        ),
      },
      {
        name: L.bonuses,
        data: statistics.monthlyTrend.map(
          item => Number(item.totalBonuses) || 0
        ),
      },
      {
        name: L.net,
        data: statistics.monthlyTrend.map(item => Number(item.totalNet) || 0),
      },
    ];
  }, [statistics, L.gross, L.deductions, L.bonuses, L.net]);

  const trendOptions: ApexOptions = useMemo(() => {
    const categories =
      statistics?.monthlyTrend?.map(item =>
        dayjs(`${item.year}-${item.month}-01`).format('MMM YYYY')
      ) ?? [];
    return {
      chart: { type: 'line', toolbar: { show: false } },
      stroke: { curve: 'smooth', width: 3 },
      markers: { size: 4 },
      xaxis: { categories },
      tooltip: { y: { formatter: val => formatCurrency(val) } },
    };
  }, [statistics]);

  const departmentSeries = useMemo(() => {
    if (
      !statistics?.departmentComparison ||
      statistics.departmentComparison.length === 0
    )
      return [];
    return [
      {
        name: L.gross,
        data: statistics.departmentComparison.map(
          item => Number(item.totalGross) || 0
        ),
      },
      {
        name: L.deductions,
        data: statistics.departmentComparison.map(
          item => Number(item.totalDeductions) || 0
        ),
      },
      {
        name: L.bonuses,
        data: statistics.departmentComparison.map(
          item => Number(item.totalBonuses) || 0
        ),
      },
      {
        name: L.net,
        data: statistics.departmentComparison.map(
          item => Number(item.totalNet) || 0
        ),
      },
    ];
  }, [statistics, L.gross, L.deductions, L.bonuses, L.net]);

  const departmentOptions: ApexOptions = useMemo(() => {
    if (
      !statistics?.departmentComparison ||
      statistics.departmentComparison.length === 0
    ) {
      return {
        chart: { type: 'bar', toolbar: { show: false } },
        plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
        yaxis: { labels: { style: { fontSize: '13px', colors: textColor } } },
        xaxis: { labels: { formatter: val => formatCurrency(val) } },
        dataLabels: { enabled: false },
        tooltip: { y: { formatter: val => formatCurrency(val) } },
      };
    }

    // Extract department names in the same order as the data
    const categories = statistics.departmentComparison.map(item =>
      item.department.trim()
    );

    return {
      chart: { type: 'bar', toolbar: { show: false } },
      plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
      yaxis: {
        categories: categories,
        labels: {
          style: { fontSize: '13px', colors: textColor },
          formatter: (val: number) => {
            // ApexCharts passes numeric index, map it to category name
            if (val >= 0 && val < categories.length) {
              return categories[Math.floor(val)];
            }
            return String(val);
          },
        },
      },
      xaxis: { labels: { formatter: val => formatCurrency(val) } },
      dataLabels: { enabled: false },
      tooltip: { y: { formatter: val => formatCurrency(val) } },
    };
  }, [statistics, textColor]);

  return (
    <Box
      sx={{ backgroundColor: bgColor, minHeight: '100vh', color: textColor }}
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
        {language === 'ar' ? (
          <>
            <Box>
              <TextField
                select
                label={L.tenantLabel}
                value={selectedTenantId}
                onChange={e => setSelectedTenantId(e.target.value)}
                size='small'
                sx={{ minWidth: 200 }}
                disabled={loadingTenants}
                dir='ltr'
              >
                <MenuItem value=''>{L.allTenants}</MenuItem>
                {tenants.map(tenant => (
                  <MenuItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box>
              <Typography
                variant='h4'
                dir='rtl'
                sx={{ fontWeight: 600, color: textColor, textAlign: 'right' }}
              >
                {L.pageTitle}
              </Typography>
            </Box>
          </>
        ) : (
          <>
            <Box>
              <Typography
                variant='h4'
                dir='ltr'
                sx={{ fontWeight: 600, color: textColor, textAlign: 'left' }}
              >
                {L.pageTitle}
              </Typography>
            </Box>

            <Stack direction='row' spacing={2} alignItems='center'>
              <TextField
                select
                label={L.tenantLabel}
                value={selectedTenantId}
                onChange={e => setSelectedTenantId(e.target.value)}
                size='small'
                sx={{ minWidth: 200 }}
                disabled={loadingTenants}
              >
                <MenuItem value=''>{L.allTenants}</MenuItem>
                {tenants.map(tenant => (
                  <MenuItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </>
        )}
      </Box>

      <Paper sx={{ backgroundColor:'unset',boxShadow:'none' }}>
        {statsLoading ? (
          <Box sx={{ textAlign: 'center', py: 4}}>
            <CircularProgress />
          </Box>
        ) : !statistics ? (
          <Alert severity='info'>No statistics available</Alert>
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
              <Typography
                variant='subtitle1'
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                sx={{
                  fontWeight: 600,
                  mb: 1,
                  textAlign: language === 'ar' ? 'right' : 'left',
                }}
              >
                {L.monthlyTrend}
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
                <Chart
                  options={trendOptions}
                  series={trendSeries}
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
              <Typography
                variant='subtitle1'
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                sx={{
                  fontWeight: 600,
                  mb: 1,
                  textAlign: language === 'ar' ? 'right' : 'left',
                }}
              >
                {L.departmentComparison}
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
                <Chart
                  options={departmentOptions}
                  series={departmentSeries}
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
