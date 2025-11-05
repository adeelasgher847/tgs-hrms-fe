import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Stack,
  TextField,
  MenuItem,
  useTheme,
  Grid,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Box,
} from '@mui/material';
import Chart from 'react-apexcharts';
import {
  systemPerformanceApiService,
  type PerformanceRecord,
} from '../../api/systemPerformanceApi';
import {
  systemEmployeeApiService,
  type SystemEmployee,
} from '../../api/systemEmployeeApi';

interface PerformanceTrendProps {
  tenantId: string;
}

const PerformanceTrend: React.FC<PerformanceTrendProps> = ({ tenantId }) => {
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [employees, setEmployees] = useState<SystemEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const theme = useTheme();

  const fetchPerformance = useCallback(async () => {
    const data = await systemPerformanceApiService.getPerformanceRecords({
      tenantId,
    });
    setRecords(data || []);
  }, [tenantId]);

  const fetchEmployees = useCallback(async () => {
    const data = await systemEmployeeApiService.getSystemEmployees({
      tenantId,
    });
    setEmployees(data || []);
  }, [tenantId]);

  useEffect(() => {
    if (tenantId) {
      fetchEmployees();
      fetchPerformance();
    }
  }, [tenantId, fetchEmployees, fetchPerformance]);

  const employeeMap = useMemo(() => {
    return employees.reduce(
      (map, emp) => {
        map[emp.id] = emp.user?.fullname || emp.name || 'N/A';
        return map;
      },
      {} as Record<string, string>
    );
  }, [employees]);

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const matchesEmployee = selectedEmployee
        ? record.employee_id === selectedEmployee
        : true;
      const matchesStatus = statusFilter
        ? record.status === statusFilter
        : true;
      const matchesStartDate = startDate
        ? new Date(record.createdAt) >= new Date(startDate)
        : true;
      const matchesEndDate = endDate
        ? new Date(record.createdAt) <= new Date(endDate)
        : true;
      return (
        matchesEmployee && matchesStatus && matchesStartDate && matchesEndDate
      );
    });
  }, [records, selectedEmployee, statusFilter, startDate, endDate]);

  // Calculate gauge score based on selected employee or all employees
  const gaugeScore = useMemo(() => {
    // When employee is selected, calculate average of ALL that employee's records
    // (ignoring status/date filters for gauge calculation)
    if (selectedEmployee) {
      const employeeRecords = records.filter(
        record => record.employee_id === selectedEmployee
      );
      if (employeeRecords.length === 0) {
        return 0;
      }
      const averageScore =
        employeeRecords.reduce((sum, r) => sum + (r.overallScore || 0), 0) /
        employeeRecords.length;
      return averageScore * 20; // Convert to percentage (assuming 0-5 scale)
    }

    // When no employee selected, calculate average of all employees' records
    if (records.length === 0) {
      return 0;
    }
    const averageScore =
      records.reduce((sum, r) => sum + (r.overallScore || 0), 0) /
      records.length;
    return averageScore * 20; // Convert to percentage (assuming 0-5 scale)
  }, [records, selectedEmployee]);

  // Memoize chart options to ensure proper updates
  const chartOptions = useMemo(
    () => ({
      chart: {
        type: 'radialBar' as const,
        toolbar: { show: false },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
        },
      },
      plotOptions: {
        radialBar: {
          startAngle: -90,
          endAngle: 90,
          hollow: {
            margin: 0,
            size: '70%',
            background: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
          },
          track: {
            background: theme.palette.mode === 'dark' ? '#333' : '#e0e0e0',
            strokeWidth: '67%',
            margin: 0,
          },
          dataLabels: {
            show: true,
            name: {
              show: false,
            },
            value: {
              offsetY: -10,
              fontSize: '22px',
              fontWeight: 600,
              color: theme.palette.text.primary,
              formatter: (val: number) => {
                return `${val.toFixed(1)}%`;
              },
            },
          },
        },
      },
      fill: {
        type: 'gradient' as const,
        gradient: {
          shade: 'dark' as const,
          type: 'horizontal' as const,
          shadeIntensity: 0.5,
          gradientToColors:
            gaugeScore >= 60
              ? ['#4CAF50']
              : gaugeScore >= 30
                ? ['#FFC371']
                : ['#FF5F6D'],
          inverseColors: false,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 100],
        },
      },
      colors:
        gaugeScore >= 60
          ? ['#4CAF50']
          : gaugeScore >= 30
            ? ['#FFC371']
            : ['#FF5F6D'],
      stroke: {
        lineCap: 'round' as const,
      },
      labels: [selectedEmployee ? 'Employee Score' : 'Overall Score'],
    }),
    [
      gaugeScore,
      selectedEmployee,
      theme.palette.mode,
      theme.palette.text.primary,
    ]
  );

  const chartSeries = useMemo(
    () => [Math.min(Math.max(gaugeScore, 0), 100)],
    [gaugeScore]
  );

  return (
    <Card>
      <CardHeader
        title='Company Performance'
        subheader='Overview gauge by tenant'
        titleTypographyProps={{ variant: 'h5', fontWeight: 600 }}
      />

      <CardContent>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
          <TextField
            select
            fullWidth
            label='Select Employee'
            value={selectedEmployee}
            onChange={e => setSelectedEmployee(e.target.value)}
            size='small'
          >
            <MenuItem value=''>All Employees</MenuItem>
            {employees.map(emp => (
              <MenuItem key={emp.id} value={emp.id}>
                {employeeMap[emp.id]}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label='Status'
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            size='small'
          >
            <MenuItem value=''>All Statuses</MenuItem>
            <MenuItem value='completed'>Completed</MenuItem>
            <MenuItem value='under_review'>Under Review</MenuItem>
            <MenuItem value='pending'>Pending</MenuItem>
          </TextField>

          <TextField
            type='date'
            fullWidth
            label='Start Date'
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            size='small'
          />

          <TextField
            type='date'
            fullWidth
            label='End Date'
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            size='small'
          />
        </Stack>

        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Chart
                key={`gauge-${gaugeScore}-${selectedEmployee || 'all'}`}
                options={chartOptions}
                series={chartSeries}
                type='radialBar'
                height={280}
              />
              <Typography align='center' variant='h6' mt={1}>
                {selectedEmployee
                  ? `Employee Score: ${gaugeScore.toFixed(1)}%`
                  : `Overall Score: ${gaugeScore.toFixed(1)}%`}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper elevation={1} sx={{ width: '100%', overflow: 'auto' }}>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Cycle</TableCell>
                    <TableCell>Overall Score</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map(row => (
                      <TableRow key={row.id}>
                        <TableCell>
                          {employeeMap[row.employee?.id] || 'N/A'}
                        </TableCell>
                        <TableCell>{row.cycle}</TableCell>
                        <TableCell>{row.overallScore}</TableCell>
                        <TableCell>{row.status}</TableCell>
                        <TableCell>
                          {new Date(row.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align='center'>
                        No performance records found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default PerformanceTrend;
