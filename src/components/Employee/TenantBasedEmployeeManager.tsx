import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  TextField,
  MenuItem,
  IconButton,
  CircularProgress,
  Pagination,
  Button,
  Stack,
  Tooltip,
  useMediaQuery,
  Card,
  CardContent,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useTheme } from '@mui/material/styles';
import systemEmployeeApiService from '../../api/systemEmployeeApi';
import { designationApiService } from '../../api/designationApi';
import { departmentApiService } from '../../api/departmentApi';
import EmployeeProfileViewSystem from './EmployeeProfileView';

const TenantBasedEmployeeManager: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    tenantId: '',
    departmentId: '',
    designationId: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const darkMode = theme.palette.mode === 'dark';

  const fetchFiltersData = async () => {
    try {
      const [deptRes, tenantRes] = await Promise.all([
        departmentApiService.getAllDepartments(),
        systemEmployeeApiService.getTenants(pagination.page, true), 
      ]);
      setDepartments(deptRes || []);
      setTenants(tenantRes || []);
    } catch (err) {
      console.error('Error fetching filter data:', err);
    }
  };

  const fetchDesignationsByDepartment = async (departmentId: string) => {
    if (!departmentId) {
      setDesignations([]);
      return;
    }
    try {
      const res =
        await designationApiService.getDesignationsByDepartment(departmentId);
      setDesignations(res.items || []);
    } catch (err) {
      console.error('Error fetching designations by department:', err);
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = {
        tenantId: filters.tenantId || undefined,
        departmentId: filters.departmentId || undefined,
        designationId: filters.designationId || undefined,
        page: pagination.page,
        limit: pagination.limit,
      };

      const res = await systemEmployeeApiService.getSystemEmployees(params);

      const employeesData = Array.isArray(res) ? res : res.data || [];

      const updatedEmployees = employeesData.map((emp: any) => {
        const matchedTenant = tenants.find((t: any) => t.id === emp.tenantId);
        return {
          ...emp,
          tenantName: matchedTenant ? matchedTenant.name : 'Unknown Tenant',
        };
      });

      setEmployees(updatedEmployees);
      setPagination(prev => ({
        ...prev,
        total: updatedEmployees.length,
        totalPages: Math.ceil(updatedEmployees.length / prev.limit),
      }));
    } catch (err) {
      console.error('Error fetching system employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiltersData();
  }, []);

  useEffect(() => {
    if (filters.departmentId) {
      fetchDesignationsByDepartment(filters.departmentId);
    } else {
      setDesignations([]);
    }
  }, [filters.departmentId]);

  useEffect(() => {
    if (tenants.length > 0) fetchEmployees();
  }, [filters, pagination.page, tenants]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    if (key === 'departmentId') {
      setFilters(prev => ({ ...prev, departmentId: value, designationId: '' }));
    }
  };

  const handleClearFilters = () => {
    setFilters({ tenantId: '', departmentId: '', designationId: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (_: any, value: number) =>
    setPagination(prev => ({ ...prev, page: value }));

  const handleView = (employee: any) => setSelectedEmployee(employee);
  const handleCloseView = () => setSelectedEmployee(null);

  const csvEscape = (value: string | null | undefined): string => {
    if (!value) return '';
    const stringValue = String(value).replace(/"/g, '""');
    return `"${stringValue}"`;
  };

  const handleDownload = () => {
    if (employees.length === 0) {
      alert('No data to download.');
      return;
    }

    const csvHeader = [
      'Name',
      'Tenant',
      'Department',
      'Designation',
      'Status',
      'Created At',
    ];

    const rows = employees.map(emp =>
      [
        csvEscape(emp.name),
        csvEscape(emp.tenantName),
        csvEscape(emp.departmentName),
        csvEscape(emp.designationTitle),
        csvEscape(emp.status),
        csvEscape(new Date(emp.createdAt).toLocaleDateString()),
      ].join(',')
    );

    const csvContent = [csvHeader.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `EmployeeList_Page${pagination.page}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filterBtn = darkMode ? '#888' : '#999';
  const textColor = darkMode ? '#fff' : '#000';
  const darkInputStyles = darkMode
    ? {
        '& .MuiOutlinedInput-root': {
          backgroundColor: '#1e1e1e',
          color: '#fff',
        },
        '& .MuiInputLabel-root': { color: '#ccc' },
      }
    : {};

  return (
    <Box>
      <Typography variant='h5' fontWeight='bold' mb={3}>
        Employee List
      </Typography>

      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='flex-start'
        flexWrap='wrap'
        flexDirection={isMobile ? 'column' : 'row'}
        gap={2}
        mb={2}
      >
        <Stack
          direction={isMobile ? 'column' : 'row'}
          spacing={2}
          sx={{ flex: 1, width: isMobile ? '100%' : 'auto' }}
        >
          <TextField
            select
            fullWidth
            label='Tenant'
            value={filters.tenantId}
            onChange={e => handleFilterChange('tenantId', e.target.value)}
            size='small'
            sx={{ width: isMobile ? '100%' : 190, ...darkInputStyles }}
          >
            <MenuItem value=''>All Tenants</MenuItem>
            {tenants.map(tenant => (
              <MenuItem key={tenant.id} value={tenant.id}>
                {tenant.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label='Department'
            value={filters.departmentId}
            onChange={e => handleFilterChange('departmentId', e.target.value)}
            size='small'
            sx={{ width: isMobile ? '100%' : 190, ...darkInputStyles }}
          >
            <MenuItem value=''>All Departments</MenuItem>
            {departments.map(dept => (
              <MenuItem key={dept.id} value={dept.id}>
                {dept.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label='Designation'
            value={filters.designationId}
            onChange={e => handleFilterChange('designationId', e.target.value)}
            size='small'
            sx={{ width: isMobile ? '100%' : 190, ...darkInputStyles }}
          >
            <MenuItem value=''>All Designations</MenuItem>
            {designations.map(des => (
              <MenuItem key={des.id} value={des.id}>
                {des.title}
              </MenuItem>
            ))}
          </TextField>

          <Button
            variant='outlined'
            onClick={handleClearFilters}
            sx={{
              borderColor: filterBtn,
              color: textColor,
            }}
          >
            Clear Filters
          </Button>
        </Stack>

        <Tooltip title='Export Employee List'>
          <IconButton
            color='primary'
            onClick={handleDownload}
            sx={{
              backgroundColor: 'primary.main',
              borderRadius: '6px',
              padding: '6px',
              color: 'white',
              '&:hover': { backgroundColor: 'primary.dark' },
            }}
          >
            <FileDownloadIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Paper sx={{ mt: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Tenant</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Designation</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell align='center'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align='center'>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : employees.length ? (
                employees.map(emp => (
                  <TableRow key={emp.id}>
                    <TableCell>{emp.name}</TableCell>
                    <TableCell>{emp.tenantName}</TableCell>
                    <TableCell>{emp.departmentName}</TableCell>
                    <TableCell>{emp.designationTitle}</TableCell>
                    <TableCell>{emp.status}</TableCell>
                    <TableCell>
                      {new Date(emp.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align='center'>
                      <IconButton onClick={() => handleView(emp)}>
                        <VisibilityIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align='center'>
                    No employees found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {pagination.totalPages > 1 && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Typography variant='body2' color='text.secondary'>
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
                of {pagination.total} employees
              </Typography>
              <Pagination
                count={pagination.totalPages}
                page={pagination.page}
                onChange={handlePageChange}
                color='primary'
                disabled={loading}
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {selectedEmployee && (
        <EmployeeProfileViewSystem
          employeeId={selectedEmployee.id} 
          onClose={handleCloseView}
        />
      )}
    </Box>
  );
};

export default TenantBasedEmployeeManager;
