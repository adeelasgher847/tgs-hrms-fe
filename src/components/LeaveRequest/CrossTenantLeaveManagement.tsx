import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import LeaveHistory from './LeaveHistory';

// ✅ Mock Data for Table
const mockLeaves = [
  {
    id: 1,
    tenantName: 'Tenant 1',
    employeeName: 'John Doe',
    department: 'HR',
    status: 'approved',
    startDate: '2025-10-01',
    endDate: '2025-10-03',
  },
  {
    id: 2,
    tenantName: 'Tenant 1',
    employeeName: 'Jane Smith',
    department: 'Finance',
    status: 'pending',
    startDate: '2025-10-10',
    endDate: '2025-10-12',
  },
  {
    id: 3,
    tenantName: 'Tenant 2',
    employeeName: 'Ali Raza',
    department: 'IT',
    status: 'rejected',
    startDate: '2025-09-20',
    endDate: '2025-09-21',
  },
  {
    id: 4,
    tenantName: 'Tenant 2',
    employeeName: 'Sara Khan',
    department: 'Marketing',
    status: 'approved',
    startDate: '2025-09-25',
    endDate: '2025-09-27',
  },
];

// ✅ Mock Data for Summary Chart
const mockSummary = [
  { tenantName: 'Tenant 1', approved: 5, pending: 2, rejected: 1 },
  { tenantName: 'Tenant 2', approved: 3, pending: 1, rejected: 2 },
  { tenantName: 'Tenant 3', approved: 7, pending: 0, rejected: 0 },
];

const CrossTenantLeaveManagement: React.FC = () => {
  const [filters, setFilters] = useState<{
    tenantId: string;
    status: string;
    startDate: Dayjs | null;
    endDate: Dayjs | null;
  }>({
    tenantId: '',
    status: '',
    startDate: null,
    endDate: null,
  });

  const [leaves, setLeaves] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // 🔹 Handle filter changes
  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // 🔹 Load mock data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800)); // simulate API delay

      let filteredLeaves = [...mockLeaves];

      // Tenant filter
      if (filters.tenantId) {
        filteredLeaves = filteredLeaves.filter(
          l => l.tenantName === `Tenant ${filters.tenantId}`
        );
      }

      // Status filter
      if (filters.status) {
        filteredLeaves = filteredLeaves.filter(
          l => l.status === filters.status
        );
      }

      // Date range filter
      if (filters.startDate) {
        filteredLeaves = filteredLeaves.filter(l =>
          dayjs(l.endDate).isAfter(filters.startDate)
        );
      }
      if (filters.endDate) {
        filteredLeaves = filteredLeaves.filter(l =>
          dayjs(l.startDate).isBefore(filters.endDate)
        );
      }

      setLeaves(filteredLeaves);
      setTotalItems(filteredLeaves.length);
      setTotalPages(1);
      setSummary(mockSummary);

      setSnackbar({
        open: true,
        message: 'Mock data loaded successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Failed to load mock data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load mock data',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading)
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        height='80vh'
      >
        <CircularProgress />
      </Box>
    );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ background: '#f7f7f7', minHeight: '100vh', p: 3 }}>
        {/* 🔹 Filters Section */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant='h6' fontWeight={700} mb={2}>
            Cross-Tenant Leave Management
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Box display='flex' flexWrap='wrap' gap={2}>
            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel>Tenant</InputLabel>
              <Select
                label='Tenant'
                value={filters.tenantId}
                onChange={e => handleFilterChange('tenantId', e.target.value)}
              >
                <MenuItem value=''>All</MenuItem>
                <MenuItem value='1'>Tenant 1</MenuItem>
                <MenuItem value='2'>Tenant 2</MenuItem>
                <MenuItem value='3'>Tenant 3</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel>Status</InputLabel>
              <Select
                label='Status'
                value={filters.status}
                onChange={e => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value=''>All</MenuItem>
                <MenuItem value='approved'>Approved</MenuItem>
                <MenuItem value='pending'>Pending</MenuItem>
                <MenuItem value='rejected'>Rejected</MenuItem>
              </Select>
            </FormControl>

            <DatePicker
              label='Start Date'
              value={filters.startDate}
              onChange={newDate => handleFilterChange('startDate', newDate)}
            />
            <DatePicker
              label='End Date'
              value={filters.endDate}
              onChange={newDate => handleFilterChange('endDate', newDate)}
            />

            <Button
              variant='contained'
              sx={{ backgroundColor: '#3c3572' }}
              onClick={() => {
                setCurrentPage(1);
                loadData();
              }}
            >
              Apply Filters
            </Button>

            <Button
              variant='outlined'
              color='secondary'
              onClick={() =>
                setFilters({
                  tenantId: '',
                  status: '',
                  startDate: null,
                  endDate: null,
                })
              }
            >
              Clear Filters
            </Button>
          </Box>
        </Paper>

        {/* 🔹 Summary Chart */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant='subtitle1' fontWeight={600} mb={2}>
            Leave Summary (Per Tenant)
          </Typography>
          <ResponsiveContainer width='100%' height={300}>
            <BarChart data={summary}>
              <XAxis dataKey='tenantName' />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey='approved' name='Approved' fill='#4caf50' />
              <Bar dataKey='pending' name='Pending' fill='#ffb300' />
              <Bar dataKey='rejected' name='Rejected' fill='#f44336' />
            </BarChart>
          </ResponsiveContainer>
        </Paper>

        {/* 🔹 Leave Table */}
        <LeaveHistory
          leaves={leaves}
          isAdmin
          isManager={false}
          onAction={() => {}}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={setCurrentPage}
        />

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default CrossTenantLeaveManagement;
