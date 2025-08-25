import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  useTheme,
  IconButton,
  TextField,
  MenuItem,
  Stack,
  useMediaQuery,
  Alert,
  Snackbar,
  Pagination,
  Typography,
  Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useOutletContext } from 'react-router-dom';
import AddEmployeeForm from './AddEmployeeForm';
import EmployeeList from './EmployeeList';
import employeeApi from '../../api/employeeApi';
import type { EmployeeDto } from '../../api/employeeApi';
import {
  departmentApiService,
  type BackendDepartment,
} from '../../api/departmentApi';
import {
  designationApiService,
  type BackendDesignation,
} from '../../api/designationApi';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  departmentId: string;
  designationId: string;
  department: {
    id: string;
    name: string;
    description: string;
    tenantId: string;
    createdAt: string;
    updatedAt: string;
  };
  designation: {
    id: string;
    title: string;
    tenantId: string;
    departmentId: string;
    createdAt: string;
    updatedAt: string;
  };
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

interface OutletContext {
  darkMode: boolean;
  language: 'en' | 'ar';
}

const EmployeeManager: React.FC = () => {
  const theme = useTheme();
  const direction = theme.direction;
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { darkMode } = useOutletContext<OutletContext>();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<null | Employee>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [departmentFilter, setDepartmentFilter] = useState('');
  const [designationFilter, setDesignationFilter] = useState('');
  const [departments, setDepartments] = useState<Record<string, string>>({});
  const [designations, setDesignations] = useState<Record<string, string>>({});
  const [departmentList, setDepartmentList] = useState<BackendDepartment[]>([]);
  const [designationList, setDesignationList] = useState<BackendDesignation[]>(
    []
  );
  const [loadingFilters, setLoadingFilters] = useState(false);

  // Dark mode
  const bgColor = darkMode ? '#1b1b1b' : '#fff';
  const textColor = darkMode ? '#e0e0e0' : '#000';
  const filterBtn = darkMode ? '#555' : '#484c7f';

  // Dark mode input styles
  const darkInputStyles = darkMode
    ? {
        '& .MuiOutlinedInput-root': {
          '& fieldset': { borderColor: '#555' },
          '&:hover fieldset': { borderColor: '#888' },
          '&.Mui-focused fieldset': { borderColor: '#90caf9' },
        },
        '& .MuiInputLabel-root': { color: '#ccc' },
        '& input, & .MuiSelect-select': { color: '#eee' },
        backgroundColor: '#2e2e2e',
      }
    : {};

  // Load employees on component mount
  useEffect(() => {
    loadEmployees(1);
    loadDepartmentsAndDesignations();
  }, []);

  // Handle page change
  const handlePageChange = (page: number) => {
    console.log('🔄 EmployeeManager - Changing to page:', page);
    setCurrentPage(page);
    loadEmployees(page);
  };

  // Handle refresh
  const handleRefresh = () => {
    console.log('🔄 EmployeeManager - Refreshing data');
    loadEmployees(currentPage);
  };

  const loadDepartmentsAndDesignations = async () => {
    try {
      setLoadingFilters(true);
      // Load all departments
      const deptData = await departmentApiService.getAllDepartments();
      const deptMap: Record<string, string> = {};
      deptData.forEach(dept => {
        deptMap[dept.id] = dept.name;
      });
      setDepartments(deptMap);
      setDepartmentList(deptData);
      console.log('Loaded departments:', deptData);

      // Load all designations
      const desigData = await designationApiService.getAllDesignations();
      const desigMap: Record<string, string> = {};
      desigData.forEach(desig => {
        desigMap[desig.id] = desig.title;
      });
      setDesignations(desigMap);
      setDesignationList(desigData);
      console.log('Loaded designations:', desigData);
    } catch (error) {
      console.error('Error loading departments and designations:', error);
    } finally {
      setLoadingFilters(false);
    }
  };

  const loadEmployees = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 EmployeeManager - Loading employees for page:', page);

      const filters = {
        departmentId: departmentFilter || undefined,
        designationId: designationFilter || undefined,
      };

      const response = await employeeApi.getAllEmployees(filters, page);
      console.log('✅ EmployeeManager - API Response:', response);

      // Convert BackendEmployee to Employee
      const convertedEmployees: Employee[] = response.items.map(emp => ({
        id: emp.id,
        name: emp.name,
        email: emp.email,
        phone: emp.phone,
        departmentId: emp.departmentId,
        designationId: emp.designationId,
        department: emp.department || {
          id: '',
          name: '',
          description: '',
          tenantId: '',
          createdAt: '',
          updatedAt: '',
        },
        designation: emp.designation || {
          id: '',
          title: '',
          tenantId: '',
          departmentId: '',
          createdAt: '',
          updatedAt: '',
        },
        tenantId: emp.tenantId,
        createdAt: emp.createdAt,
        updatedAt: emp.updatedAt,
      }));

      setEmployees(convertedEmployees);

      // Update pagination state
      setCurrentPage(response.page);
      setTotalPages(response.totalPages);
      setTotalItems(response.total);
    } catch (err) {
      setError('Failed to load employees');
      console.error('Error loading employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (employeeData: EmployeeDto) => {
    try {
      setLoading(true);
      setError(null);
      const newEmployee = await employeeApi.createEmployee(employeeData);
      console.log('New employee created:', newEmployee);

      // If the new employee doesn't have department/designation objects,
      // we need to fetch the full employee data or reload the list
      if (!newEmployee.department || !newEmployee.designation) {
        console.log(
          'New employee missing department/designation objects, reloading current page...'
        );
        await loadEmployees(currentPage); // Reload the current page to get complete data
      } else {
        // Convert BackendEmployee to Employee and add to current page
        const convertedEmployee: Employee = {
          id: newEmployee.id,
          name: newEmployee.name,
          email: newEmployee.email,
          phone: newEmployee.phone,
          departmentId: newEmployee.departmentId,
          designationId: newEmployee.designationId,
          department: newEmployee.department || {
            id: '',
            name: '',
            description: '',
            tenantId: '',
            createdAt: '',
            updatedAt: '',
          },
          designation: newEmployee.designation || {
            id: '',
            title: '',
            tenantId: '',
            departmentId: '',
            createdAt: '',
            updatedAt: '',
          },
          tenantId: newEmployee.tenantId,
          createdAt: newEmployee.createdAt,
          updatedAt: newEmployee.updatedAt,
        };
        setEmployees(prev => [...prev, convertedEmployee]);
      }

      // Reload department and designation mappings
      await loadDepartmentsAndDesignations();

      setSuccessMessage(
        'Employee added successfully! A password reset link has been sent to their email.'
      );
      setOpen(false);

      return { success: true };
    } catch (err: unknown) {
      console.error('Error adding employee:', err);

      // Debug: Log the actual error response structure
      if (err && typeof err === 'object' && 'response' in err) {
        console.log('Backend error response:', JSON.stringify(err, null, 2));
      }

      // Handle backend validation errors
      const errorResponse = err as {
        response?: {
          data?: { message?: string; errors?: Record<string, string[]> };
        };
      };

      if (errorResponse.response?.data) {
        const responseData = errorResponse.response.data;
        const fieldErrors: Record<string, string> = {};

        // Handle validation errors array format (common in NestJS)
        if (responseData.errors && typeof responseData.errors === 'object') {
          Object.entries(responseData.errors).forEach(([field, messages]) => {
            if (Array.isArray(messages) && messages.length > 0) {
              fieldErrors[field] = messages[0]; // Take first error message
            }
          });
        }

        // Handle single message format
        if (responseData.message) {
          const backendError = responseData.message;

          // Parse common backend error patterns
          if (
            backendError.toLowerCase().includes('email') &&
            backendError.toLowerCase().includes('already exists')
          ) {
            fieldErrors.email = 'Email already exists';
          } else if (
            backendError.toLowerCase().includes('user') &&
            backendError.toLowerCase().includes('already exists')
          ) {
            fieldErrors.email = 'User already exists in this tenant';
          } else if (
            backendError.toLowerCase().includes('phone') &&
            backendError.toLowerCase().includes('already exists')
          ) {
            fieldErrors.phone = 'Phone number already exists';
          } else if (
            backendError.toLowerCase().includes('first') &&
            backendError.toLowerCase().includes('required')
          ) {
            fieldErrors.first_name = 'First name is required';
          } else if (
            backendError.toLowerCase().includes('last') &&
            backendError.toLowerCase().includes('required')
          ) {
            fieldErrors.last_name = 'Last name is required';
          } else if (
            backendError.toLowerCase().includes('email') &&
            backendError.toLowerCase().includes('required')
          ) {
            fieldErrors.email = 'Email is required';
          } else if (
            backendError.toLowerCase().includes('phone') &&
            backendError.toLowerCase().includes('required')
          ) {
            fieldErrors.phone = 'Phone is required';
          } else if (
            backendError.toLowerCase().includes('designation') &&
            backendError.toLowerCase().includes('required')
          ) {
            fieldErrors.designationId = 'Designation is required';
          } else if (
            backendError.toLowerCase().includes('password') &&
            backendError.toLowerCase().includes('required')
          ) {
            fieldErrors.password = 'Password is required';
          } else {
            // Generic error for other cases
            fieldErrors.general = backendError;
          }
        }

        if (Object.keys(fieldErrors).length > 0) {
          return { success: false, errors: fieldErrors };
        }
      }

      // Generic error
      setError('Failed to add employee');
      return { success: false, errors: { general: 'Failed to add employee' } };
    } finally {
      setLoading(false);
    }
  };

  const handleEditOpen = async (emp: Employee) => {
    try {
      setLoading(true);
      const fresh = await employeeApi.getEmployeeById(emp.id);
      setEditing(fresh as unknown as Employee);
      setOpen(true);
    } catch (e) {
      setError('Failed to load employee details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmployee = async (
    updates: Partial<EmployeeDto> & {
      designationId?: string;
      password?: string;
    }
  ) => {
    if (!editing) return { success: false } as any;
    try {
      setLoading(true);
      setError(null);
      // Ensure a valid designationId is sent if user selected a new one; otherwise keep current
      const nextDesignationId =
        updates.designationId && updates.designationId !== ''
          ? updates.designationId
          : editing.designationId;
      const updated = await employeeApi.updateEmployee(editing.id, {
        first_name: (updates as any).first_name,
        last_name: (updates as any).last_name,
        email: updates.email,
        phone: updates.phone,
        password: updates.password,
        designationId: nextDesignationId,
      });
      await loadEmployees();
      setSuccessMessage('Employee updated successfully!');
      setOpen(false);
      setEditing(null);
      return { success: true };
    } catch (err) {
      console.error('Error updating employee:', err);
      setError('Failed to update employee');
      return { success: false } as any;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await employeeApi.deleteEmployee(id);
      setEmployees(prev => prev.filter(emp => emp.id !== id));
      setSuccessMessage('Employee deleted successfully!');
    } catch (err) {
      setError('Failed to delete employee');
      console.error('Error deleting employee:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setDepartmentFilter('');
    setDesignationFilter('');
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      if (departmentFilter && emp.departmentId !== departmentFilter)
        return false;
      if (designationFilter && emp.designationId !== designationFilter)
        return false;
      return true;
    });
  }, [employees, departmentFilter, designationFilter]);

  const getLabel = (en: string, ar: string) => (direction === 'rtl' ? ar : en);

  return (
    <Box p={2}>
      <Typography variant='h6' gutterBottom>
        Employee Management
      </Typography>

      {/* Add Employee Button */}
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='flex-start'
        flexDirection={isMobile ? 'column' : 'row'}
        gap={2}
        mb={2}
      >
        <Stack
          direction={isMobile ? 'column' : 'row'}
          spacing={2}
          sx={{
            flex: 1,
            width: isMobile ? '100%' : 'auto',
          }}
        >
          {/* Department Filter */}
          <TextField
            select
            fullWidth
            label={getLabel('Department', 'القسم')}
            value={departmentFilter}
            onChange={e => {
              setDepartmentFilter(e.target.value);
              setDesignationFilter(''); // Reset designation on department change
            }}
            size='small'
            sx={{
              width: isMobile ? '100%' : 190,
              my: 0.5,
              '& .MuiInputBase-input': {
                // textAlign: "center", center the selected text
              },
              '& .MuiInputBase-root': {
                padding: '0px 8px',
                minHeight: '10px',
              },
              '& .MuiInputLabel-root': {
                fontSize: '0.85rem',
                left: direction === 'rtl' ? 'unset' : undefined, // for RTL support
                right: direction === 'rtl' ? '1.75rem' : undefined,
              },
              ...darkInputStyles,
            }}
          >
            <MenuItem value=''>
              {getLabel('All Departments', 'كل الأقسام')}
            </MenuItem>
            {departmentList.map(dept => (
              <MenuItem key={dept.id} value={dept.id}>
                {dept.name}
              </MenuItem>
            ))}
          </TextField>

          {/* Designation Filter */}
          <TextField
            select
            fullWidth
            label={getLabel('Designation', 'المسمى الوظيفي')}
            value={designationFilter}
            onChange={e => setDesignationFilter(e.target.value)}
            disabled={!departmentFilter || loadingFilters}
            size='small'
            sx={{
              width: isMobile ? '100%' : 190,
              my: 0.5,
              '& .MuiInputBase-root': {
                padding: '0px 8px',
                minHeight: '10px',
              },
              '& .MuiInputLabel-root': {
                fontSize: '0.85rem',
                left: direction === 'rtl' ? 'unset' : undefined, // for RTL support
                right: direction === 'rtl' ? '1.75rem' : undefined,
              },
              ...darkInputStyles,
            }}
          >
            <MenuItem value=''>
              {getLabel('All Designations', 'كل المسميات')}
            </MenuItem>
            {designationList
              .filter(des => des.departmentId === departmentFilter)
              .map(des => (
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
              width: isMobile ? '100%' : 'auto',
              '&:hover': {
                borderColor: darkMode ? '#888' : '#999',
                backgroundColor: darkMode
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(0,0,0,0.04)',
              },
            }}
          >
            {getLabel('Clear Filters', 'مسح الفلاتر')}
          </Button>
        </Stack>

        {/* Add Employee Button */}
        <Button
          variant='contained'
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          sx={{
            backgroundColor: darkMode ? '#605bd4' : '#484c7f',
            width: isMobile ? '100%' : 'auto',
            '&:hover': {
              backgroundColor: darkMode ? '#726df0' : '#5b56a0',
            },
          }}
        >
          {getLabel('Add Employee', 'إضافة موظف')}
        </Button>
      </Box>

      {/* Refresh Button */}
      <Box display='flex' gap={2} mb={2} flexWrap='wrap' alignItems='center'>
        <Button
          variant='outlined'
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
          sx={{
            borderColor: filterBtn,
            color: textColor,
            '&:hover': {
              borderColor: darkMode ? '#888' : '#999',
              backgroundColor: darkMode
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(0,0,0,0.04)',
            },
          }}
        >
          {getLabel('Refresh', 'تحديث')}
        </Button>
      </Box>

      {/* Employee List */}
      <Paper elevation={3}>
        <EmployeeList
          employees={filteredEmployees}
          onDelete={handleDeleteEmployee}
          onEdit={handleEditOpen}
          loading={loading}
          departments={departments}
          designations={designations}
        />
      </Paper>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display='flex' justifyContent='center' mt={2}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => handlePageChange(page)}
            color='primary'
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Pagination Info */}
      {totalItems > 0 && (
        <Box display='flex' justifyContent='center' mt={1}>
          <Typography variant='body2' color='textSecondary'>
            {getLabel(
              `Showing page ${currentPage} of ${totalPages} (${totalItems} total records)`,
              `عرض الصفحة ${currentPage} من ${totalPages} (${totalItems} سجل إجمالي)`
            )}
          </Typography>
        </Box>
      )}

      {/* Notifications */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setError(null)}
          severity='error'
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSuccessMessage(null)}
          severity='success'
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Modal with AddEmployeeForm */}
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        fullWidth
        maxWidth='md'
        PaperProps={{
          sx: {
            backgroundColor: bgColor,
            color: textColor,
          },
        }}
      >
        <DialogTitle
          sx={{
            textAlign: direction === 'rtl' ? 'right' : 'left',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: textColor,
          }}
        >
          {editing
            ? getLabel('Edit Employee', 'تعديل الموظف')
            : getLabel('Add New Employee', 'إضافة موظف جديد')}

          <IconButton
            onClick={() => setOpen(false)}
            sx={{ color: darkMode ? '#ccc' : theme.palette.grey[500] }}
            aria-label='close'
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <AddEmployeeForm
            key={editing ? `edit-${editing.id}` : 'create'}
            onSubmit={editing ? handleUpdateEmployee : handleAddEmployee}
            initialData={
              editing
                ? {
                    id: editing.id,
                    firstName: (editing as any).firstName,
                    lastName: (editing as any).lastName,
                    email: editing.email,
                    phone: editing.phone,
                    designationId: editing.designationId,
                    departmentId: editing.departmentId,
                  }
                : null
            }
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default EmployeeManager;
