import React, { useEffect, useState, useCallback } from 'react';
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
  Button,
  Stack,
  Tooltip,
  useMediaQuery,
  Pagination,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useTheme } from '@mui/material/styles';
import systemEmployeeApiService, {
  type SystemEmployee,
} from '../../api/systemEmployeeApi';
import {
  designationApiService,
  type BackendDesignation,
} from '../../api/designationApi';
import {
  departmentApiService,
  type BackendDepartment,
} from '../../api/departmentApi';
import SystemEmployeeProfileView from './SystemEmployeeProfileView';
import { formatDate } from '../../utils/dateUtils';

type EmployeeWithTenantName = SystemEmployee & {
  tenantName: string;
  user?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    profile_pic?: string | null;
  };
  designation?: {
    id: string;
    title: string;
  };
  department?: {
    id: string;
    name: string;
  };
  team?: {
    id: string;
    name: string;
  };
};


const TenantBasedEmployeeManager: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeWithTenantName[]>([]);
  const [departments, setDepartments] = useState<BackendDepartment[]>([]);
  const [designations, setDesignations] = useState<BackendDesignation[]>([]);
  const [tenants, setTenants] = useState<SystemEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    tenantId: '',
    departmentId: '',
    designationId: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = 25; // Backend returns 25 records per page

  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeWithTenantName | null>(null);
  const [openProfile, setOpenProfile] = useState(false);

  const handleOpenProfile = (employee: EmployeeWithTenantName) => {
    setSelectedEmployee(employee);
    setOpenProfile(true);
  };
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const darkMode = theme.palette.mode === 'dark';

  const fetchFiltersData = async () => {
    try {
      const [deptRes, tenantRes] = await Promise.all([
        departmentApiService.getAllDepartments(),
        systemEmployeeApiService.getAllTenants(true),
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
      const res = await designationApiService.getDesignationsByDepartment(
        departmentId,
        null
      ); // Pass null to get all designations for dropdown
      setDesignations(res.items || []);
    } catch (err) {
      console.error('Error fetching designations by department:', err);
    }
  };

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        tenantId: filters.tenantId || undefined,
        departmentId: filters.departmentId || undefined,
        designationId: filters.designationId || undefined,
        page: currentPage, // Pass page parameter to backend
      };

      const res = await systemEmployeeApiService.getSystemEmployees(params);
      // Handle both array and paginated response
      const employeesData = Array.isArray(res)
        ? res
        : 'items' in res
          ? res.items
          : [];

      // Get pagination info from response if available
      const paginationInfo = Array.isArray(res)
        ? null
        : 'total' in res && 'totalPages' in res
          ? res
          : null;

      console.log('Raw employees data from API:', employeesData);
      console.log('First employee sample:', employeesData[0]);

      const updatedEmployees = employeesData.map(
        (emp: SystemEmployee): EmployeeWithTenantName => {
          // Try to find tenant from current tenants state, but don't block on it
          const matchedTenant = tenants.find(
            (t: SystemEmployee) => t.id === emp.tenantId
          );

          // Type assertion for API response which includes nested objects
          const empWithNested = emp as SystemEmployee & {
            user?: {
              id: string;
              first_name?: string;
              last_name?: string;
              email?: string;
              profile_pic?: string | null;
            };
            designation?: { id: string; title: string };
            department?: { id: string; name: string };
            team?: { id: string; name: string } | string;
          };

          // Log to see what we're getting
          if (!empWithNested.user) {
            console.warn('Employee missing user object:', emp.id, emp);
          }

          // Preserve all fields from API including user, designation, department, team objects
          const mapped: EmployeeWithTenantName = {
            ...emp,
            // Map flat fields if they exist in nested objects
            name:
              emp.name ||
              (empWithNested.user
                ? `${empWithNested.user.first_name || ''} ${empWithNested.user.last_name || ''}`.trim()
                : ''),
            email: emp.email || empWithNested.user?.email || '',
            departmentName: emp.departmentName || empWithNested.department?.name || '',
            designationTitle:
              emp.designationTitle || empWithNested.designation?.title || '',
            // Set tenant name if available, otherwise will be updated when tenants load
            tenantName: matchedTenant ? matchedTenant.name : 'Loading...',
            // Explicitly preserve the user object for accessing user.id later
            user: empWithNested.user || undefined,
            designation: empWithNested.designation || undefined,
            department: empWithNested.department || undefined,
            team: typeof empWithNested.team === 'object' ? empWithNested.team : undefined,
          };

          return mapped;
        }
      );

      console.log(
        'Mapped employees with user objects:',
        updatedEmployees.filter((e: EmployeeWithTenantName) => e.user)
      );

      setEmployees(updatedEmployees);

      // Store pagination info if available from backend
      if (paginationInfo) {
        setTotalRecords(paginationInfo.total || updatedEmployees.length);
        setTotalPages(paginationInfo.totalPages || 1);
      } else {
        // Fallback: estimate based on current page and records received
        const hasMorePages = updatedEmployees.length === itemsPerPage;
        setTotalRecords(
          hasMorePages
            ? currentPage * itemsPerPage
            : (currentPage - 1) * itemsPerPage + updatedEmployees.length
        );
        setTotalPages(hasMorePages ? currentPage + 1 : currentPage);
      }
    } catch (err) {
      console.error('Error fetching system employees:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage]);

  useEffect(() => {
    fetchFiltersData();
    // Fetch employees immediately without waiting for tenants
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (filters.departmentId) {
      fetchDesignationsByDepartment(filters.departmentId);
    } else {
      setDesignations([]);
    }
  }, [filters.departmentId]);

  useEffect(() => {
    // Fetch employees when filters or page changes
    fetchEmployees();
  }, [fetchEmployees, currentPage]);

  // Update tenant names in employees when tenants are loaded
  useEffect(() => {
    if (tenants.length > 0 && employees.length > 0) {
      setEmployees(prevEmployees =>
        prevEmployees.map(emp => {
          const matchedTenant = tenants.find(
            (t: SystemEmployee) => t.id === emp.tenantId
          );
          const newTenantName = matchedTenant ? matchedTenant.name : 'Unknown Tenant';
          // Only update if tenant name is different to avoid unnecessary re-renders
          if (emp.tenantName !== newTenantName) {
            return {
              ...emp,
              tenantName: newTenantName,
            };
          }
          return emp;
        })
      );
    }
  }, [tenants]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    if (key === 'departmentId') {
      setFilters(prev => ({ ...prev, departmentId: value, designationId: '' }));
    }
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({ tenantId: '', departmentId: '', designationId: '' });
    setCurrentPage(1);
  };

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
        csvEscape(
          emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : 'N/A'
        ),
      ].join(',')
    );

    const csvContent = [csvHeader.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `EmployeeList_Page${currentPage}.csv`);
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

  // Backend returns 25 records per page (fixed page size)
  // If we get 25 records, there might be more pages
  // If we get less than 25, it's the last page
  const hasMorePages = employees.length === itemsPerPage;
  // Calculate estimated total records if not provided by backend
  const estimatedTotalRecords =
    totalRecords ||
    (hasMorePages
      ? currentPage * itemsPerPage
      : (currentPage - 1) * itemsPerPage + employees.length);
  const estimatedTotalPages =
    totalPages || (hasMorePages ? currentPage + 1 : currentPage);

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
            disabled={!filters.departmentId} // Disable when no department is selected
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

      <Paper sx={{ mt: 3, boxShadow: 'none' }}>
        <TableContainer>
          <Table stickyHeader>
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
                  <TableCell colSpan={7} align='center'>
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
                      {emp.createdAt
                        ? formatDate(emp.createdAt)
                        : 'N/A'}
                    </TableCell>
                    <TableCell align='center'>
                      <IconButton onClick={() => handleOpenProfile(emp)}>
                        <VisibilityIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align='center'>
                    No employees found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {openProfile && selectedEmployee && (
        <SystemEmployeeProfileView
          open={openProfile}
          onClose={() => {
            setOpenProfile(false);
            setSelectedEmployee(null);
          }}
          employeeId={selectedEmployee.id}
        />
      )}

      {estimatedTotalPages > 1 && (
        <Box display='flex' justifyContent='center' mt={2} mb={1}>
          <Pagination
            count={estimatedTotalPages}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color='primary'
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {employees.length > 0 && (
        <Box display='flex' justifyContent='center' mb={2}>
          <Typography variant='body2' color='textSecondary'>
            Showing page {currentPage} of {estimatedTotalPages} (
            {estimatedTotalRecords} total records)
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default TenantBasedEmployeeManager;
