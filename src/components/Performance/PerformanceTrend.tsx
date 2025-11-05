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
} from '@mui/material';
import GaugeChart from 'react-gauge-chart';
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

  const overallScore =
    records.length > 0
      ? (records.reduce((sum, r) => sum + r.overallScore, 0) / records.length) *
        20
      : 0;

  const filteredRecord = selectedEmployee
    ? records.find(rec => rec.employee_id === selectedEmployee)
    : null;

  const gaugeScore =
    selectedEmployee && filteredRecord
      ? filteredRecord.overallScore * 20
      : selectedEmployee && !filteredRecord
        ? 0
        : overallScore;

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
            <GaugeChart
              id='overall-gauge'
              nrOfLevels={20}
              percent={gaugeScore / 100}
              textColor={theme.palette.text.primary}
              colors={['#FF5F6D', '#FFC371', '#4CAF50']}
              arcWidth={0.3}
            />
            <Typography align='center' variant='h6' mt={2}>
              {selectedEmployee
                ? `Employee Score: ${gaugeScore.toFixed(1)}%`
                : `Overall Score: ${gaugeScore.toFixed(1)}%`}
            </Typography>
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
