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
import systemDashboardApiService from '../../api/systemDashboardApi';
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
        <CircularProgress />
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

        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          <FormControl
            size='small'
            sx={{
              minWidth: { xs: '100%', sm: 140 },
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            <Select
              value={selectedTenant}
              onChange={e => setSelectedTenant(e.target.value)}
              sx={{
                color: theme.palette.text.primary,
                backgroundColor: theme.palette.background.paper,
                '.MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.divider,
                },
                '.MuiSelect-select': {
                  display: 'flex',
                  alignItems: 'center',
                  maxWidth: { xs: '100%', sm: 200 },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: theme.palette.background.paper,
                    '& .MuiMenuItem-root': {
                      color: theme.palette.text.primary,
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      },
                      '&.Mui-selected': {
                        backgroundColor:
                          theme.palette.mode === 'dark'
                            ? 'var(--primary-light-color)'
                            : 'var(--primary-dark-color)',
                        color: '#ffffff',
                        '&:hover': {
                          backgroundColor:
                            theme.palette.mode === 'dark'
                              ? 'var(--primary-light-color)'
                              : 'var(--primary-dark-color)',
                        },
                      },
                    },
                  },
                },
              }}
            >
              {tenants.map(tenant => (
                <MenuItem key={tenant.id} value={tenant.id}>
                  <Tooltip title={tenant.name}>
                    <Box
                      sx={{
                        maxWidth: 220,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {tenant.name}
                    </Box>
                  </Tooltip>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl
            size='small'
            sx={{
              minWidth: { xs: '100%', sm: 120 },
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            <Select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              displayEmpty
              disabled={availableMonths.length === 0}
              sx={{
                color: theme.palette.text.primary,
                backgroundColor: theme.palette.background.paper,
                '.MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.divider,
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: theme.palette.background.paper,
                    '& .MuiMenuItem-root': {
                      color: theme.palette.text.primary,
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      },
                      '&.Mui-selected': {
                        backgroundColor:
                          theme.palette.mode === 'dark'
                            ? 'var(--primary-light-color)'
                            : 'var(--primary-dark-color)',
                        color: '#ffffff',
                        '&:hover': {
                          backgroundColor:
                            theme.palette.mode === 'dark'
                              ? 'var(--primary-light-color)'
                              : 'var(--primary-dark-color)',
                        },
                      },
                    },
                  },
                },
              }}
            >
              <MenuItem value=''>
                {language === 'ar' ? 'كل الشهور' : 'All Months'}
              </MenuItem>
              {availableMonths.map(month => {
                const monthData = tenantGrowthData.find(d => d.month === month);
                return (
                  <MenuItem key={month} value={month}>
                    {monthData?.monthName || month}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <TimeRangeSelector
            value={selectedYear}
            options={yearOptions}
            onChange={value => {
              if (value === 'all-time' || value === null) {
                setSelectedYear(currentYear);
                return;
              }
              setSelectedYear(Number(value));
            }}
            allTimeLabel={language === 'ar' ? 'كل الوقت' : 'All Time'}
            language={language}
            buttonSx={{
              // Figma (light mode): bg #E0ECFA, radius 8px, height 36px, padding 8px 16px, gap 10px
              backgroundColor:
                theme.palette.mode === 'dark'
                  ? theme.palette.action.hover
                  : '#E0ECFA',
              border:
                theme.palette.mode === 'dark'
                  ? `1px solid ${theme.palette.divider}`
                  : 'none',
              borderRadius: '8px',
              px: '16px',
              py: '8px',
              gap: '10px',
              height: '36px',
              minWidth: { xs: '100%', sm: '108px' },
              width: { xs: '100%', sm: 'auto' },
            }}
            labelSx={{
              // Figma (light mode): SF Pro Rounded, 14px/20px, 400, letter spacing -1%, color #2462A5
              fontFamily: 'SF Pro Rounded, sans-serif',
              fontSize: '14px',
              lineHeight: '20px',
              letterSpacing: '-0.01em',
              fontWeight: 400,
              color:
                theme.palette.mode === 'dark'
                  ? theme.palette.text.primary
                  : '#2462A5',
            }}
            iconSx={{
              width: 20,
              height: 20,
              // Figma (light mode): dark blue #2462A5
              filter:
                theme.palette.mode === 'dark'
                  ? 'brightness(0) saturate(100%) invert(56%)'
                  : 'brightness(0) saturate(100%) invert(32%) sepia(98%) saturate(1495%) hue-rotate(190deg) brightness(92%) contrast(92%)',
            }}
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
