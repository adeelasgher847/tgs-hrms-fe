import {
  Box,
  Typography,
  MenuItem,
  Select,
  FormControl,
  CircularProgress,
  TextField,
  Tooltip,
  useTheme,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { useOutletContext } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import systemEmployeeApiService from '../../api/systemEmployeeApi';
import systemDashboardApiService from '@/api/systemDashboardApi';
import { getCurrentUser } from '../../utils/auth';
import { isSystemAdmin } from '../../utils/roleUtils';

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
  const theme = useTheme();
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const { language } = useLanguage();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [tenantGrowthData, setTenantGrowthData] = useState<TenantGrowth[]>([]);

  // Check if user is system admin
  const currentUser = getCurrentUser();
  const userRole = currentUser?.role;
  const isSysAdmin = isSystemAdmin(userRole);

  const labels = {
    en: 'Tenant Growth Overview',
    ar: 'نظرة عامة على نمو المستأجرين',
  };

  useEffect(() => {
    // Only fetch tenants for system admin
    if (!isSysAdmin) {
      setLoadingTenants(false);
      return;
    }

    const fetchTenants = async () => {
      try {
        // Use the same API as Employee List to get all tenants
        const data = await systemEmployeeApiService.getAllTenants(true);
        // Show all tenants (no filtering) - same as Employee List
        setTenants((data || []) as unknown as Tenant[]);

        if (data && data.length > 0) {
          const ibexTenant = data.find((t: Record<string, unknown>) => t.name === 'Ibex Tech.');
          if (ibexTenant) {
            setSelectedTenant(ibexTenant.id as string);
          } else {
            setSelectedTenant((data[0] as Record<string, unknown>).id as string);
          }
        }
      } catch {
        // Ignore tenant dropdown errors; chart will just have no data
      } finally {
        setLoadingTenants(false);
      }
    };

    fetchTenants();
  }, [isSysAdmin]);

  useEffect(() => {
    // Only fetch tenant growth data for system admin
    if (!isSysAdmin || !selectedTenant) return;

    const fetchTenantGrowth = async () => {
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
  }, [isSysAdmin, selectedTenant, selectedYear]);

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
      labels: {
        style: { fontSize: '12px', colors: theme.palette.text.primary },
      },
    },
    yaxis: {
      labels: {
        formatter: val => `${val}`,
        style: { fontSize: '12px', colors: theme.palette.text.primary },
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
        borderRadius: '0.375rem',
        backgroundColor: theme.palette.background.paper,
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
        <Typography
          fontWeight='bold'
          fontSize={20}
          sx={{ color: theme.palette.text.primary }}
        >
          {labels[language]} ({selectedYear})
        </Typography>

        <Box display='flex' gap={2}>
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
              width: 120,
              '& .MuiOutlinedInput-root': {
                color: theme.palette.text.primary,
                '& fieldset': {
                  borderColor: theme.palette.divider,
                },
                // '&:hover fieldset': {
                //   borderColor: theme.palette.divider,
                // },
                '&.Mui-focused fieldset': {
                  borderColor: theme.palette.divider,
                },
              },
            }}
            inputProps={{
              min: 2000,
              max: 2100,
            }}
          />

          <FormControl size='small' sx={{ minWidth: 160 }}>
            <Select
              value={selectedTenant}
              onChange={e => setSelectedTenant(e.target.value)}
              sx={{
                color: theme.palette.text.primary,
                '.MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.divider,
                },
                '.MuiSelect-select': {
                  display: 'flex',
                  alignItems: 'center',
                  maxWidth: 200,
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
