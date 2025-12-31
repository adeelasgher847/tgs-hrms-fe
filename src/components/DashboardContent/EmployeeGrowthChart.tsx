import {
  Box,
  Typography,
  MenuItem,
  Select,
  FormControl,
  CircularProgress,
  Tooltip,
  useTheme,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { useOutletContext } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import systemEmployeeApiService from '../../api/systemEmployeeApi';
import systemDashboardApiService from '@/api/systemDashboardApi';
import AppDropdown from '../common/AppDropdown';
import TimeRangeSelector from '../common/TimeRangeSelector';

interface Tenant {
  id: string;
  name: string;
  status: string;
  isDeleted: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface TenantGrowth {
  tenantId: string;
  tenantName: string;
  month: string;
  monthName: string;
  employees: number;
  departments: number;
  designations: number;
}

const EmployeeGrowthChart: React.FC = () => {
  const theme = useTheme();
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const { language } = useLanguage();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<string>('Ibex Tech.');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [tenantGrowthData, setTenantGrowthData] = useState<TenantGrowth[]>([]);

  const labels = {
    en: 'Employee Growth',
    ar: 'نمو الموظفين',
  };

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const data = await systemEmployeeApiService.getAllTenants(true);
        // Show all tenants (no filtering)
        setTenants(data as unknown as Tenant[]);

        if (data.length > 0) {
          const ibexTenant = data.find(t => t.name === 'Ibex Tech.');
          if (ibexTenant) {
            setSelectedTenant(ibexTenant.id);
          } else {
            setSelectedTenant(data[0].id);
          }
        }
      } catch {
        // Ignore tenant dropdown errors; chart will just have no data
      } finally {
        setLoadingTenants(false);
      }
    };

    fetchTenants();
  }, []);

  useEffect(() => {
    const fetchTenantGrowth = async () => {
      if (!selectedTenant) return;
      try {
        const data = await systemDashboardApiService.getTenantGrowth(
          selectedYear,
          selectedTenant
        );
        setTenantGrowthData(data);
      } catch {
        setTenantGrowthData([]);
      }
    };

    fetchTenantGrowth();
  }, [selectedTenant, selectedYear]);

  // Filter data by selected month if a month is selected
  const filteredData = selectedMonth
    ? tenantGrowthData.filter(d => d.month === selectedMonth)
    : tenantGrowthData;

  const months = filteredData.map(d => d.monthName);
  const employeesData = filteredData.map(d => d.employees);

  // Get unique months from API response for dropdown
  const availableMonths = Array.from(
    new Set(tenantGrowthData.map(d => d.month))
  ).sort();

  // TimeRangeSelector options (years)
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 6 }, (_, i) => currentYear - i);
  const yearOptions = availableYears.includes(selectedYear)
    ? availableYears
    : [selectedYear, ...availableYears].sort((a, b) => b - a);

  const series = [{ name: 'Employees', data: employeesData }];

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: 'line',
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    stroke: {
      curve: 'smooth',
      width: 3,
      colors: ['#C61952'],
    },
    markers: {
      size: 5,
      colors: ['#C61952'],
      strokeColors: '#fff',
      strokeWidth: 2,
      hover: {
        size: 7,
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: months,
      labels: {
        style: {
          fontSize: '11px',
          colors: theme.palette.text.primary,
        },
      },
    },
    yaxis: {
      labels: {
        formatter: val => `${val}`,
        style: { fontSize: '11px', colors: theme.palette.text.primary },
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: language === 'ar' ? 'left' : 'right',
      labels: { colors: theme.palette.text.primary },
    },
    grid: {
      borderColor: theme.palette.divider,
      padding: { top: 20, left: 10, right: 10, bottom: 10 },
    },
    colors: ['#C61952'],
    tooltip: {
      theme: darkMode ? 'dark' : 'light',
      y: { formatter: (val: number) => `${val}` },
    },
  };

  if (loadingTenants) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        height={400}
      >
        <CircularProgress sx={{ color: 'var(--primary-dark-color)' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '0.375rem',
        backgroundColor: theme.palette.background.paper,
        direction: language === 'ar' ? 'rtl' : 'ltr',
        height: 400,
        display: 'flex',
        flexDirection: 'column',
        padding: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 2,
          flexDirection: { xs: 'column', sm: 'row' },
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography
          fontWeight='bold'
          fontSize={{ xs: '20px', lg: '28px' }}
          sx={{ color: theme.palette.text.primary }}
        >
          {labels[language]} ({selectedYear})
        </Typography>

        <Box display='flex' gap={2} flexWrap='wrap'>
          <AppDropdown
            showLabel={false}
            value={selectedTenant}
            onChange={e => setSelectedTenant(e.target.value as string)}
            options={tenants.map(t => ({ value: t.id, label: t.name }))}
            containerSx={{
              minWidth: { xs: '100%', sm: 140 },
              width: { xs: '100%', sm: 'auto' },
            }}
            sx={{
              '& .MuiSelect-select': {
                color: theme.palette.text.primary,
                display: 'flex',
                alignItems: 'center',
                maxWidth: { xs: '100%', sm: 200 },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.divider,
              },
            }}
          />

          <AppDropdown
            showLabel={false}
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value as string)}
            options={[
              {
                value: '',
                label: language === 'ar' ? 'كل الشهور' : 'All Months',
              },
              ...availableMonths.map(m => ({
                value: m,
                label:
                  tenantGrowthData.find(d => d.month === m)?.monthName || m,
              })),
            ]}
            containerSx={{
              minWidth: { xs: '100%', sm: 120 },
              width: { xs: '100%', sm: 'auto' },
            }}
            sx={{
              '& .MuiSelect-select': {
                color: theme.palette.text.primary,
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.divider,
              },
            }}
            disabled={availableMonths.length === 0}
          />

          <TimeRangeSelector
            value={selectedYear}
            options={Array.from({ length: 5 }, (_, i) => selectedYear - i)}
            onChange={val => {
              if (val === 'all-time' || val === null) return;
              const num =
                typeof val === 'number' ? val : parseInt(val as string);
              if (!isNaN(num)) setSelectedYear(num);
            }}
            allTimeLabel={language === 'ar' ? 'كل الوقت' : 'All Time'}
            containerSx={{
              minWidth: { xs: '100%', sm: 120 },
              width: { xs: '100%', sm: 'auto' },
            }}
            minHeight={'48px'}
          />
        </Box>
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          alignItems: 'center',
        }}
      >
        <Chart options={options} series={series} type='line' height='100%' />
      </Box>
    </Box>
  );
};

export default EmployeeGrowthChart;
