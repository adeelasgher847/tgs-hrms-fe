import React, { useState, useEffect } from 'react';
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
  DialogActions,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WarningIcon from '@mui/icons-material/Warning';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
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
import { extractErrorMessage } from '../../utils/errorHandler';
import { exportCSV } from '../../api/exportApi';
interface Employee {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  departmentId: string;
  designationId: string;
  status?: string;
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
  const [submitting, setSubmitting] = useState(false);
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

  // Delete confirmation dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteName, setPendingDeleteName] = useState<string>('');

  // Dark mode
  const bgColor = darkMode ? '#111' : '#fff';
  const textColor = darkMode ? '#8f8f8f' : '#000';
  const borderColor = darkMode ? '#333' : '#ddd';
  const filterBtn = darkMode ? '#555' : '#484c7f';

  // Dark mode input styles
  const darkInputStyles = darkMode
    ? {
        '& .MuiOutlinedInput-root': {
          '& fieldset': { borderColor: '#555' },
          '&:hover fieldset': { borderColor: '#888' },
          '&.Mui-focused fieldset': { borderColor: '#90caf9' },
        },
        '& .MuiInputLabel-root': { color: '#8f8f8f' },
        '& input, & .MuiSelect-select': { color: '#eee' },
        backgroundColor: '#2e2e2e',
      }
    : {};

  // Load employees on component mount
  useEffect(() => {
    loadEmployees(1);
    loadDepartmentsAndDesignations();
  }, []);

  // Re-fetch from backend when filters change, reset to first page
  useEffect(() => {
    setCurrentPage(1);
    loadEmployees(1);
  }, [departmentFilter, designationFilter]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadEmployees(page);
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

      // Load all designations
      const desigData = await designationApiService.getAllDesignations();
      const desigMap: Record<string, string> = {};
      desigData.forEach(desig => {
        desigMap[desig.id] = desig.title;
      });
      setDesignations(desigMap);
      setDesignationList(desigData);
    } catch {
      // Handle error silently
    } finally {
      setLoadingFilters(false);
    }
  };

  const loadEmployees = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const filters = {
        departmentId: departmentFilter || undefined,
        designationId: designationFilter || undefined,
      };

      const response = await employeeApi.getAllEmployees(filters, page);

      // If requested page exceeds available totalPages (possible after filters), clamp and refetch
      if (response.totalPages > 0 && page > response.totalPages) {
        setCurrentPage(response.totalPages);
        const retry = await employeeApi.getAllEmployees(
          filters,
          response.totalPages
        );
        const convertedEmployeesRetry: Employee[] = retry.items.map(emp => ({
          id: emp.id,
          name: emp.name,
          firstName: emp.firstName,
          lastName: emp.lastName,
          email: emp.email,
          phone: emp.phone,
          departmentId: emp.departmentId,
          designationId: emp.designationId,
          status: emp.status,
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

        setEmployees(convertedEmployeesRetry);
        setTotalPages(retry.totalPages);
        setTotalItems(retry.total);
        return;
      }

      // Convert BackendEmployee to Employee
      const convertedEmployees: Employee[] = response.items.map(emp => ({
        id: emp.id,
        name: emp.name,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        phone: emp.phone,
        departmentId: emp.departmentId,
        designationId: emp.designationId,
        status: emp.status,
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
    } catch (error: unknown) {
      const errorResult = extractErrorMessage(error);
      setError(errorResult.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (
    employeeData: Partial<EmployeeDto> & {
      departmentId?: string;
      designationId?: string;
      role?: string;
    }
  ) => {
    try {
      setSubmitting(true);
      setError(null);

      // Ensure required fields are present
      if (
        !employeeData.first_name ||
        !employeeData.last_name ||
        !employeeData.email ||
        !employeeData.designationId
      ) {
        throw new Error('Required fields are missing');
      }

      // Use different API endpoints based on role
      const newEmployee =
        employeeData.role === 'manager'
          ? await employeeApi.createManager(employeeData as EmployeeDto)
          : await employeeApi.createEmployee(employeeData as EmployeeDto);

      // Fetch the complete employee data to get proper department and designation info
      const completeEmployee = await employeeApi.getEmployeeById(
        newEmployee.id
      );

      // Convert BackendEmployee to Employee using the complete data
      const convertedEmployee: Employee = {
        id: completeEmployee.id,
        name: completeEmployee.name,
        firstName: completeEmployee.firstName,
        lastName: completeEmployee.lastName,
        email: completeEmployee.email,
        phone: completeEmployee.phone,
        departmentId: completeEmployee.departmentId,
        designationId: completeEmployee.designationId,
        status: completeEmployee.status,
        department: completeEmployee.department || {
          id: completeEmployee.departmentId,
          name:
            departments[completeEmployee.departmentId] || 'Unknown Department',
          description: '',
          tenantId: completeEmployee.tenantId,
          createdAt: completeEmployee.createdAt,
          updatedAt: completeEmployee.updatedAt,
        },
        designation: completeEmployee.designation || {
          id: completeEmployee.designationId,
          title:
            designations[completeEmployee.designationId] ||
            'Unknown Designation',
          tenantId: completeEmployee.tenantId,
          departmentId: completeEmployee.departmentId,
          createdAt: completeEmployee.createdAt,
          updatedAt: completeEmployee.updatedAt,
        },
        tenantId: completeEmployee.tenantId,
        createdAt: completeEmployee.createdAt,
        updatedAt: completeEmployee.updatedAt,
      };

      // Add to the beginning of the list (most recent first)
      setEmployees(prev => [convertedEmployee, ...prev]);
      setTotalItems(prev => prev + 1);

      // Reload department and designation mappings
      await loadDepartmentsAndDesignations();

      setSuccessMessage(
        'Employee added successfully! A password reset link has been sent to their email.'
      );
      setOpen(false);

      return { success: true };
    } catch (err: unknown) {
      // Debug: Log the actual error structure
      if (err && typeof err === 'object' && 'response' in err) {
        // Error has response property
      }

      // Handle backend validation errors
      const errorResponse = err as {
        response?: {
          data?: { message?: string; errors?: Record<string, string[]> };
        };
      };

      if (errorResponse?.response?.data) {
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
      const errorResult = extractErrorMessage(err);

      // Check if this is a global tenant/department/designation error
      const isGlobalError =
        errorResult.message.toLowerCase().includes('global') ||
        errorResult.message
          .toLowerCase()
          .includes('does not belong to your organization') ||
        errorResult.message.toLowerCase().includes('invalid designation id');

      if (isGlobalError) {
        // For global errors, only show snackbar, don't set form error
        setError(errorResult.message); // This will show in the snackbar
        return { success: false, errors: {} }; // Return empty errors to avoid form display
      } else {
        // For other errors, show both snackbar and form error
        setError(errorResult.message);
        return { success: false, errors: { general: errorResult.message } };
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditOpen = (emp: Employee) => {
    setEditing(emp);
    setOpen(true);
  };

  const handleUpdateEmployee = async (
    updates: Partial<EmployeeDto> & {
      designationId?: string;
      password?: string;
    }
  ) => {
    if (!editing)
      return { success: false, errors: { general: 'No employee selected' } };
    try {
      setSubmitting(true);
      setError(null);
      // Ensure a valid designationId is sent if user selected a new one; otherwise keep current
      const nextDesignationId =
        updates.designationId && updates.designationId !== ''
          ? updates.designationId
          : editing.designationId;
      const updatedEmployee = await employeeApi.updateEmployee(editing.id, {
        first_name: updates.first_name,
        last_name: updates.last_name,
        email: updates.email,
        phone: updates.phone,
        password: updates.password,
        designationId: nextDesignationId,
      });

      // Update the employee in the list without reloading
      const designationName =
        designations[nextDesignationId] ||
        designations[editing.designationId] ||
        'Unknown Designation';

      // Get the department ID for the new designation from the designation list
      const newDesignation = designationList.find(
        desig => desig.id === nextDesignationId
      );
      const newDepartmentId =
        newDesignation?.departmentId ||
        updatedEmployee.departmentId ||
        editing.departmentId;
      const departmentName =
        departments[newDepartmentId] || 'Unknown Department';

      setEmployees(prev =>
        prev.map(emp =>
          emp.id === editing.id
            ? {
                ...emp,
                name: updatedEmployee.name,
                firstName: updatedEmployee.firstName,
                lastName: updatedEmployee.lastName,
                email: updatedEmployee.email,
                phone: updatedEmployee.phone,
                departmentId: newDepartmentId,
                designationId: nextDesignationId,
                status: updatedEmployee.status || emp.status,
                department: {
                  ...emp.department,
                  id: newDepartmentId,
                  name: departmentName,
                },
                designation: {
                  ...emp.designation,
                  id: nextDesignationId,
                  title: designationName,
                  departmentId: newDepartmentId,
                },
                updatedAt: updatedEmployee.updatedAt,
              }
            : emp
        )
      );

      setSuccessMessage('Employee updated successfully!');
      setOpen(false);
      setEditing(null);
      return { success: true };
    } catch (error: unknown) {
      const errorResult = extractErrorMessage(error);

      // Check if this is a global tenant/department/designation error
      const isGlobalError =
        errorResult.message.toLowerCase().includes('global') ||
        errorResult.message
          .toLowerCase()
          .includes('does not belong to your organization') ||
        errorResult.message.toLowerCase().includes('invalid designation id');

      if (isGlobalError) {
        // For global errors, only show snackbar, don't set form error
        setError(errorResult.message); // This will show in the snackbar
        return { success: false, errors: {} }; // Return empty errors to avoid form display
      } else {
        // For other errors, show both snackbar and form error
        setError(errorResult.message);
        return {
          success: false,
          errors: { general: errorResult.message },
        };
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      setError(null);
      await employeeApi.deleteEmployee(id);
      setEmployees(prev => prev.filter(emp => emp.id !== id));
      setTotalItems(prev => prev - 1);
      setSuccessMessage('Employee deleted successfully!');
    } catch (error: unknown) {
      const errorResult = extractErrorMessage(error);
      setError(errorResult.message);
    }
  };

  // New: open confirmation before delete (accepts Employee or id)
  const requestDeleteEmployee = (toDelete: Employee | string) => {
    const id = typeof toDelete === 'string' ? toDelete : toDelete.id;
    const name = typeof toDelete === 'string' ? '' : toDelete.name;
    setPendingDeleteId(id);
    setPendingDeleteName(name || '');
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    await handleDeleteEmployee(pendingDeleteId);
    setConfirmOpen(false);
    setPendingDeleteId(null);
    setPendingDeleteName('');
  };

  const cancelDelete = () => {
    setConfirmOpen(false);
    setPendingDeleteId(null);
    setPendingDeleteName('');
  };

  const handleClearFilters = () => {
    setDepartmentFilter('');
    setDesignationFilter('');
  };

  // Server-driven filtering; render employees as-is

  const getLabel = (en: string, ar: string) => (direction === 'rtl' ? ar : en);

  // Delete modal texts
  const deleteTitle = getLabel('Confirm Delete', 'تأكيد الحذف');
  const deleteMessage = pendingDeleteName
    ? getLabel(
        `Are you sure you want to delete employee "${pendingDeleteName}"? This action cannot be undone.`,
        `هل أنت متأكد أنك تريد حذف الموظف "${pendingDeleteName}"؟ لا يمكن التراجع عن هذا الإجراء.`
      )
    : getLabel(
        'Are you sure you want to delete this employee? This action cannot be undone.',
        'هل أنت متأكد أنك تريد حذف هذا الموظف؟ لا يمكن التراجع عن هذا الإجراء.'
      );

  const token = localStorage.getItem('token');
  const filters = { page: '1' };

  return (
    <Box>
      <Typography variant='h6' gutterBottom>
        Employee List
      </Typography>
      {/* Add Employee Button */}
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
              '&.MuiFormControl-root': {
                backgroundColor: 'transparent !important',
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
            size='small'
            sx={{
              width: isMobile ? '100%' : 190,
              my: 0.5,
              '&.MuiFormControl-root': {
                backgroundColor: 'transparent !important',
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
              {getLabel('All Designations', 'كل المسميات')}
            </MenuItem>
            {designationList.map(des => (
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

              {/* Add Employee Button */}
        <Button
          variant='contained'
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          sx={{
            backgroundColor: darkMode ? '#464b8a' : '#484c7f',
            width: isMobile ? '100%' : 'auto',
            '&:hover': {
              backgroundColor: darkMode ? '#464b8a' : '#5b56a0',
            },
          }}
        >
          {getLabel('Add Employee', 'إضافة موظف')}
        </Button>
        </Stack>
        <Box display='flex' justifyContent='flex-end'>
        <Tooltip title="Export Employees CSV">
          <IconButton
            color="primary"
            onClick={() =>
              exportCSV('/employees/export', 'employees.csv', token, filters)
            }
            sx={{
              backgroundColor: 'primary.main',
              borderRadius: '6px',
              padding: '6px',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            }}
          >
            <FileDownloadIcon />
          </IconButton>
        </Tooltip>
      </Box>
      </Box>

      {/* Employee List */}
      <Paper elevation={3} sx={{ boxShadow: 'none' }}>
        <EmployeeList
          employees={employees}
          onDelete={requestDeleteEmployee}
          onEdit={(employee: any) => handleEditOpen(employee as any)}
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

      {/* Delete Confirmation - Department modal style */}
      <Dialog
        open={confirmOpen}
        onClose={cancelDelete}
        maxWidth='sm'
        fullWidth
        PaperProps={{
          sx: {
            direction: direction === 'rtl' ? 'rtl' : 'ltr',
            backgroundColor: bgColor,
            color: textColor,
            border: `1px solid ${borderColor}`,
          },
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1, color: textColor }}>
          {deleteTitle}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center' }}>
            <WarningIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
            <Typography
              variant='body1'
              sx={{ mb: 2, lineHeight: 1.6, color: textColor }}
            >
              {deleteMessage}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', p: 3, pt: 1 }}>
          <Button
            onClick={cancelDelete}
            variant='outlined'
            sx={{ color: textColor, borderColor }}
          >
            {getLabel('Cancel', 'إلغاء')}
          </Button>
          <Button onClick={confirmDelete} variant='contained' color='error'>
            {getLabel('Delete', 'حذف')}
          </Button>
        </DialogActions>
      </Dialog>

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
                    firstName: editing.firstName || '',
                    lastName: editing.lastName || '',
                    email: editing.email,
                    phone: editing.phone,
                    designationId: editing.designationId,
                    departmentId: editing.departmentId,
                  }
                : null
            }
            submitting={submitting}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default EmployeeManager;
