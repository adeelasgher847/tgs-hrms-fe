import {
  Box,
  Typography,
  MenuItem,
  Select,
  FormControl,
  CircularProgress,
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

const TenantGrowthChart: React.FC = () => {
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const { language } = useLanguage();

  const bgColor = darkMode ? '#111' : '#fff';
  const borderColor = darkMode ? '#252525' : '#f0f0f0';
  const textColor = darkMode ? '#8f8f8f' : '#000';

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<string>('Ibex Tech.');
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [tenantGrowthData, setTenantGrowthData] = useState<TenantGrowth[]>([]);
  const [loadingGrowth, setLoadingGrowth] = useState(false);

  const labels = {
    en: 'Tenant Growth Overview',
    ar: 'نظرة عامة على نمو المستأجرين',
  };

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const data = await systemEmployeeApiService.getTenants(1, true);
        const activeTenants = data.filter((t: Tenant) => !t.isDeleted);
        setTenants(activeTenants);
        if (activeTenants.length > 0) {
          const ibexTenant = activeTenants.find(t => t.name === 'Ibex Tech.');
          if (ibexTenant) {
            setSelectedTenant(ibexTenant.id);
          } else {
            setSelectedTenant(activeTenants[0].id); 
          }
        }
      } catch (error) {
        console.error('Error fetching tenants:', error);
      } finally {
        setLoadingTenants(false);
      }
    };

    fetchTenants();
  }, []);

  useEffect(() => {
    const fetchTenantGrowth = async () => {
      if (!selectedTenant) return;
      setLoadingGrowth(true);
      try {
        const data = await systemDashboardApiService.getTenantGrowth(
          selectedYear,
          selectedTenant
        );
        setTenantGrowthData(data);
      } catch (error) {
        console.error('Error fetching tenant growth:', error);
        setTenantGrowthData([]);
      } finally {
        setLoadingGrowth(false);
      }
    };

    fetchTenantGrowth();
  }, [selectedTenant, selectedYear]);

  const months = tenantGrowthData.map(d => d.monthName);
  const employeesData = tenantGrowthData.map(d => d.employees);
  const departmentsData = tenantGrowthData.map(d => d.departments);
  const designationsData = tenantGrowthData.map(d => d.designations);

  const series = [
    { name: 'Employees', data: employeesData },
    { name: 'Departments', data: departmentsData },
    { name: 'Designations', data: designationsData },
  ];

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: 'bar',
      stacked: true,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: { horizontal: false, columnWidth: '55%' },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 1, colors: ['#fff'] },
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
    colors: ['#4E79A7', '#F28E2B', '#E15759'],
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
        mt: 1,
        p: 2,
        mb: 1,
        border: `1px solid ${borderColor}`,
        borderRadius: '0.375rem',
        backgroundColor: bgColor,
        direction: language === 'ar' ? 'rtl' : 'ltr',
        height: 400,
        display: 'flex',
        flexDirection: 'column',
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

        <Box display='flex' gap={2}>
          <FormControl size='small' sx={{ minWidth: 100 }}>
            <Select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              sx={{
                color: textColor,
                '.MuiOutlinedInput-notchedOutline': {
                  borderColor: borderColor,
                },
              }}
            >
              {[2023, 2024, 2025, 2026].map(year => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size='small' sx={{ minWidth: 160 }}>
            <Select
              value={selectedTenant}
              onChange={e => setSelectedTenant(e.target.value)}
              sx={{
                color: textColor,
                '.MuiOutlinedInput-notchedOutline': {
                  borderColor: borderColor,
                },
              }}
            >
              {tenants.map(tenant => (
                <MenuItem key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          alignItems: 'center',
        }}
      >
        <Chart options={options} series={series} type='bar' height='100%' />
      </Box>
    </Box>
  );
};

export default TenantGrowthChart;
