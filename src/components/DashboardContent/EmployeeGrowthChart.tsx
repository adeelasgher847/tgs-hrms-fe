import {
  Box,
  Typography,
  MenuItem,
  Select,
  FormControl,
  CircularProgress,
  TextField,
  Tooltip,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { useOutletContext } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import systemEmployeeApiService from '../../api/systemEmployeeApi';
import systemDashboardApiService from '@/api/systemDashboardApi';

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
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const { language } = useLanguage();

  const bgColor = darkMode ? '#111' : '#fff';
  const borderColor = darkMode ? '#252525' : '#f0f0f0';
  const textColor = darkMode ? '#8f8f8f' : '#000';

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
      } catch (error) {
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
      } catch (error) {
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

  const monthLabels = {
    en: 'Month',
    ar: 'الشهر',
  };

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
      colors: ['#FF8C00'],
    },
    markers: {
      size: 5,
      colors: ['#FF8C00'],
      strokeColors: '#fff',
      strokeWidth: 2,
      hover: {
        size: 7,
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: months,
      labels: { style: { fontSize: '12px', colors: textColor } },
    },
    yaxis: {
      labels: {
        formatter: val => `${val}`,
        style: { fontSize: '12px', colors: textColor },
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: language === 'ar' ? 'left' : 'right',
      labels: { colors: textColor },
    },
    grid: {
      borderColor: borderColor,
      padding: { top: 20, left: 10, right: 10, bottom: 10 },
    },
    colors: ['#FF8C00'],
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
        border: `1px solid ${borderColor}`,
        borderRadius: '0.375rem',
        backgroundColor: bgColor,
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
          alignItems: 'center',
          mb: 2,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography fontWeight='bold' fontSize={20} color={textColor}>
          {labels[language]} ({selectedYear})
        </Typography>

        <Box display='flex' gap={2} flexWrap='wrap'>
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
                color: textColor,
                '.MuiOutlinedInput-notchedOutline': {
                  borderColor: borderColor,
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
                color: textColor,
                '.MuiOutlinedInput-notchedOutline': {
                  borderColor: borderColor,
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

          <TextField
            type='number'
            value={selectedYear}
            onChange={e => {
              const value = parseInt(e.target.value);
              if (!isNaN(value) && value > 0) {
                setSelectedYear(value);
              }
            }}
            size='small'
            sx={{
              width: { xs: '100%', sm: 120 },
              '& .MuiOutlinedInput-root': {
                color: textColor,
                '& fieldset': {
                  borderColor: borderColor,
                },
                '&:hover fieldset': {
                  borderColor: borderColor,
                },
                '&.Mui-focused fieldset': {
                  borderColor: borderColor,
                },
              },
            }}
            inputProps={{
              min: 2000,
              max: 2100,
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
