import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
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
import EmployeeViewModal from './EmployeeViewModal';
import employeeApi from '../../api/employeeApi';
import type { EmployeeDto } from '../../api/employeeApi';
import { useLanguage } from '../../hooks/useLanguage';
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
  user_id?: string; // User ID for fetching profile pictures
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  departmentId: string;
  designationId: string;
  role_name?: string;
  status?: string;
  cnic_number?: string;
  profile_picture?: string;
  cnic_picture?: string;
  cnic_back_picture?: string;
  department: {
    id: string;
    name: string;
    description: string;
    tenantId: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  designation: {
    id: string;
    title: string;
    tenantId: string;
    departmentId: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

interface OutletContext {
  darkMode: boolean;
}

const EmployeeManager: React.FC = () => {
  const theme = useTheme();
  const direction = theme.direction;
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { darkMode } = useOutletContext<OutletContext>();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<null | Employee>(null);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]); // Store all employees
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Pagination state - now for client-side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationLimit, setPaginationLimit] = useState(25); // Backend limit, default 25

  // Calculate pagination from all employees using backend limit
  const totalItems = allEmployees.length;
  const itemsPerPage = paginationLimit || 25; // Use backend limit

  // Calculate total pages - only count pages that have actual data
  // For example: 50 records / 25 limit = 2 pages (not 3)
  // Ensure we only show pages with actual data - no empty pages
  let totalPages = 1;
  if (totalItems > 0 && itemsPerPage > 0) {
    totalPages = Math.ceil(totalItems / itemsPerPage);
    // Ensure totalPages is at least 1
    totalPages = Math.max(1, totalPages);
  }

  // Get paginated employees for current page
  const employees = useMemo(() => {
    // Ensure current page doesn't exceed total pages
    const validPage = Math.min(
      currentPage,
      Math.max(1, Math.ceil(allEmployees.length / itemsPerPage))
    );
    if (validPage !== currentPage && allEmployees.length > 0) {
      // Reset to valid page if current page is invalid
      setCurrentPage(validPage);
      return [];
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return allEmployees.slice(startIndex, endIndex);
  }, [allEmployees, currentPage, itemsPerPage]);

  const [departmentFilter, setDepartmentFilter] = useState('');
  const [designationFilter, setDesignationFilter] = useState('');
  const [departments, setDepartments] = useState<Record<string, string>>({});
  const [designations, setDesignations] = useState<Record<string, string>>({});
  const [departmentList, setDepartmentList] = useState<BackendDepartment[]>([]);
  const [designationList, setDesignationList] = useState<BackendDesignation[]>(
    []
  );
  // const [loadingFilters, setLoadingFilters] = useState(false);

  // Delete confirmation dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteName, setPendingDeleteName] = useState<string>('');

  // View modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  // Track initial mount to prevent duplicate API calls
  const isInitialMount = useRef(true);
  const isLoadingRef = useRef(false);

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

  const loadDepartmentsAndDesignations = useCallback(async () => {
    try {
      // setLoadingFilters(true);
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
      // setLoadingFilters(false);
    }
  }, []);

  // Helper function to convert BackendEmployee to Employee
  const convertToEmployee = (emp: any): Employee => ({
    id: emp.id,
    user_id: emp.user_id,
    name: emp.name,
    firstName: emp.firstName,
    lastName: emp.lastName,
    email: emp.email,
    phone: emp.phone,
    departmentId: emp.departmentId,
    designationId: emp.designationId,
    role_name: emp.role_name,
    status: emp.status,
    cnic_number: emp.cnic_number,
    profile_picture: emp.profile_picture,
    cnic_picture: emp.cnic_picture,
    cnic_back_picture: emp.cnic_back_picture,
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
  });

  // Fetch all employees from all pages
  const loadEmployees = useCallback(async () => {
    // Prevent duplicate calls
    if (isLoadingRef.current) {
      return;
    }

    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);

      const filters = {
        departmentId: departmentFilter || undefined,
        designationId: designationFilter || undefined,
      };

      // Fetch all pages sequentially
      const allEmployeesData: Employee[] = [];
      let page = 1;
      let hasMorePages = true;
      let backendLimit = 25; // Default limit

      while (hasMorePages) {
        const response = await employeeApi.getAllEmployees(filters, page);

        // Extract limit from first page response
        if (page === 1 && response.limit) {
          backendLimit = response.limit;
          setPaginationLimit(backendLimit);
        }

        // Convert and add employees
        const convertedEmployees: Employee[] =
          response.items.map(convertToEmployee);
        allEmployeesData.push(...convertedEmployees);

        // Check if there are more pages
        if (response.totalPages) {
          // Use backend pagination info
          hasMorePages = page < response.totalPages;
          page++;
        } else {
          // Estimate: if we got less than backend limit, it's the last page
          hasMorePages = convertedEmployees.length >= backendLimit;
          page++;
        }
      }

      setAllEmployees(allEmployeesData);
      // Reset to page 1 when data is loaded
      setCurrentPage(1);

      // Debug: Log pagination info
      const calculatedTotalPages =
        allEmployeesData.length > 0
          ? Math.ceil(allEmployeesData.length / (backendLimit || 25))
          : 1;
      console.log('Employee pagination:', {
        totalItems: allEmployeesData.length,
        limit: backendLimit,
        calculatedTotalPages,
      });
    } catch (error: unknown) {
      const errorResult = extractErrorMessage(error);
      setError(errorResult.message);
      setAllEmployees([]);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [departmentFilter, designationFilter]);

  // Mark initial mount as complete after first render
  useEffect(() => {
    isInitialMount.current = false;
  }, []);

  // Load employees on component mount
  useEffect(() => {
    loadDepartmentsAndDesignations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load employees when filters change (fetches all records)
  useEffect(() => {
    // Skip on initial mount to prevent duplicate API call
    if (isInitialMount.current) {
      return;
    }
    setCurrentPage(1); // Reset to page 1 when filters change
    loadEmployees();
  }, [departmentFilter, designationFilter, loadEmployees]);

  // Load employees on initial mount
  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Handle page change (client-side pagination, no API call needed)
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAddEmployee = async (
    employeeData: Partial<EmployeeDto> & {
      departmentId?: string;
      designationId?: string;
      role?: string;
      role_name?: string;
      role_id?: string;
      team_id?: string;
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

      // Remove role_id before submitting
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { role_id, ...employeePayload } = employeeData;
      const newEmployee = await employeeApi.createEmployee(
        employeePayload as EmployeeDto
      );

      // Fetch the complete employee data to get proper department and designation info
      const completeEmployee = await employeeApi.getEmployeeById(
        newEmployee.id
      );

      // Convert BackendEmployee to Employee using the complete data
      const convertedEmployee: Employee = {
        id: completeEmployee.id,
        user_id: completeEmployee.user_id,
        name: completeEmployee.name,
        firstName: completeEmployee.firstName,
        lastName: completeEmployee.lastName,
        email: completeEmployee.email,
        phone: completeEmployee.phone,
        departmentId: completeEmployee.departmentId,
        designationId: completeEmployee.designationId,
        role_name: completeEmployee.role_name,
        status: completeEmployee.status,
        cnic_number: completeEmployee.cnic_number,
        profile_picture: completeEmployee.profile_picture,
        cnic_picture: completeEmployee.cnic_picture,
        cnic_back_picture: completeEmployee.cnic_back_picture,
        department: completeEmployee.department
          ? {
              id: completeEmployee.department.id,
              name: completeEmployee.department.name,
              description: completeEmployee.department.description,
              tenantId: completeEmployee.department.tenantId,
              createdAt: completeEmployee.department.createdAt,
              updatedAt: completeEmployee.department.updatedAt,
            }
          : {
              id: completeEmployee.departmentId,
              name:
                departments[completeEmployee.departmentId] ||
                'Unknown Department',
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
      setAllEmployees(prev => [convertedEmployee, ...prev]);

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
        return { success: false }; // Return empty errors to avoid form display
      } else {
        // For other errors, show both snackbar and form error
        setError(errorResult.message);
        return { success: false, errors: { general: errorResult.message } };
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditOpen = useCallback((emp: Employee) => {
    setEditing(emp);
    setOpen(true);
  }, []);

  const handleUpdateEmployee = async (
    updates: Partial<EmployeeDto> & {
      designationId?: string;
      password?: string;
      role?: string;
      role_name?: string;
      team_id?: string;
      cnicNumber?: string;
      profilePicture?: File | null;
      cnicFrontPicture?: File | null;
      cnicBackPicture?: File | null;
    }
  ) => {
    if (!editing)
      return { success: false, errors: { general: 'No employee selected' } };

    try {
      setSubmitting(true);
      setError(null);

      const nextDesignationId =
        updates.designationId && updates.designationId !== ''
          ? updates.designationId
          : editing.designationId;

      // Handle role update - check both role and role_name from form
      const nextRoleName =
        updates.role_name && updates.role_name.trim() !== ''
          ? updates.role_name.trim()
          : updates.role && updates.role.trim() !== ''
            ? updates.role.trim()
            : editing.role_name;

      const updatedEmployee = await employeeApi.updateEmployee(editing.id, {
        first_name: updates.first_name,
        last_name: updates.last_name,
        email: updates.email,
        phone: updates.phone,
        password: updates.password,
        designationId: nextDesignationId,
        role_name: nextRoleName,
        cnicNumber: updates.cnicNumber,
        profilePicture: updates.profilePicture,
        cnicFrontPicture: updates.cnicFrontPicture,
        cnicBackPicture: updates.cnicBackPicture,
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

      setAllEmployees(prev =>
        prev.map(emp =>
          emp.id === editing.id
            ? {
                ...emp,
                user_id: updatedEmployee.user_id || emp.user_id,
                name: updatedEmployee.name,
                firstName: updatedEmployee.firstName,
                lastName: updatedEmployee.lastName,
                email: updatedEmployee.email,
                phone: updatedEmployee.phone,
                departmentId: newDepartmentId,
                designationId: nextDesignationId,
                role_name:
                  updatedEmployee.role_name || nextRoleName || emp.role_name,
                status: updatedEmployee.status || emp.status,
                cnic_number: updatedEmployee.cnic_number || emp.cnic_number,
                profile_picture:
                  updatedEmployee.profile_picture || emp.profile_picture,
                cnic_picture: updatedEmployee.cnic_picture || emp.cnic_picture,
                cnic_back_picture:
                  updatedEmployee.cnic_back_picture || emp.cnic_back_picture,
                department: emp.department
                  ? {
                      ...emp.department,
                      id: newDepartmentId,
                      name: departmentName,
                    }
                  : {
                      id: newDepartmentId,
                      name: departmentName,
                      description: '',
                      tenantId: emp.tenantId,
                      createdAt: emp.createdAt,
                      updatedAt: emp.updatedAt,
                    },
                designation: emp.designation
                  ? {
                      ...emp.designation,
                      id: nextDesignationId,
                      title: designationName,
                      departmentId: newDepartmentId,
                    }
                  : {
                      id: nextDesignationId,
                      title: designationName,
                      tenantId: emp.tenantId,
                      departmentId: newDepartmentId,
                      createdAt: emp.createdAt,
                      updatedAt: emp.updatedAt,
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
        return { success: false }; // Return empty errors to avoid form display
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
      setAllEmployees(prev => prev.filter(emp => emp.id !== id));
      setSuccessMessage('Employee deleted successfully!');
    } catch (error: unknown) {
      const errorResult = extractErrorMessage(error);
      setError(errorResult.message);
    }
  };

  // New: open confirmation before delete (accepts Employee or id)
  const requestDeleteEmployee = useCallback((toDelete: Employee | string) => {
    const id = typeof toDelete === 'string' ? toDelete : toDelete.id;
    const name = typeof toDelete === 'string' ? '' : toDelete.name;
    setPendingDeleteId(id);
    setPendingDeleteName(name || '');
    setConfirmOpen(true);
  }, []);

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

  const handleResendInvite = useCallback(async (employee: Employee) => {
    try {
      setError(null);

      // Immediately update the status to "Invite Sent" in the local state
      setAllEmployees(prev =>
        prev.map(emp =>
          emp.id === employee.id ? { ...emp, status: 'Invite Sent' } : emp
        )
      );

      await employeeApi.resendInvite(employee.id);
      setSuccessMessage(`Invite resent successfully to ${employee.name}!`);
    } catch (error: unknown) {
      // If API call fails, revert the status back to "Invite Expired"
      setAllEmployees(prev =>
        prev.map(emp =>
          emp.id === employee.id ? { ...emp, status: 'Invite Expired' } : emp
        )
      );

      const errorResult = extractErrorMessage(error);
      setError(errorResult.message);
    }
  }, []);

  const handleViewEmployee = useCallback((employee: Employee) => {
    setViewingEmployee(employee);
    setViewModalOpen(true);
  }, []);

  // Server-driven filtering; render employees as-is

  // Delete modal texts
  // Use LanguageContext for static UI labels (keep DB data unchanged)
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const L = {
    en: {
      pageTitle: 'Employee List',
      department: 'Department',
      allDepartments: 'All Departments',
      designation: 'Designation',
      allDesignations: 'All Designations',
      clearFilters: 'Clear Filters',
      addEmployee: 'Add Employee',
      exportTooltip: 'Export Employees CSV',
      confirmDeleteTitle: 'Confirm Delete',
      confirmDeleteMessage: (name?: string) =>
        name
          ? `Are you sure you want to delete employee "${name}"? This action cannot be undone.`
          : 'Are you sure you want to delete this employee? This action cannot be undone.',
      cancel: 'Cancel',
      delete: 'Delete',
      addNewEmployee: 'Add New Employee',
      editEmployee: 'Edit Employee',
      showingInfo: (page: number, totalPages: number, total: number) =>
        `Showing page ${page} of ${totalPages} (${total} total records)`,
    },
    ar: {
      pageTitle: 'قائمة الموظفين',
      department: 'القسم',
      allDepartments: 'كل الأقسام',
      designation: 'المسمى الوظيفي',
      allDesignations: 'كل المسميات',
      clearFilters: 'مسح الفلاتر',
      addEmployee: 'إضافة موظف',
      exportTooltip: 'تصدير الموظفين (CSV)',
      confirmDeleteTitle: 'تأكيد الحذف',
      confirmDeleteMessage: (name?: string) =>
        name
          ? `هل أنت متأكد أنك تريد حذف الموظف "${name}"؟ لا يمكن التراجع عن هذا الإجراء.`
          : 'هل أنت متأكد أنك تريد حذف هذا الموظف؟ لا يمكن التراجع عن هذا الإجراء.',
      cancel: 'إلغاء',
      delete: 'حذف',
      addNewEmployee: 'إضافة موظف جديد',
      editEmployee: 'تعديل الموظف',
      showingInfo: (page: number, totalPages: number, total: number) =>
        `عرض الصفحة ${page} من ${totalPages} (${total} سجلات)`,
    },
  } as const;
  const LL = L[language] || L.en;

  const token = localStorage.getItem('token');
  const filters = { page: '1' };

  // Build absolute media URL from backend path
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  const toAbsoluteUrl = (path?: string | null) => {
    if (!path) return '';
    const trimmed = path.trim();
    const isAbsolute = /^https?:\/\//i.test(trimmed);
    const base = API_BASE_URL.replace(/\/$/, '');
    const url = isAbsolute
      ? trimmed
      : `${base}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
    return `${url}?t=${Date.now()}`;
  };

  return (
    <Box dir='ltr' sx={{ direction: 'ltr' }}>
      <Typography
        dir={isRTL ? 'rtl' : 'ltr'}
        variant='h6'
        gutterBottom
        sx={{ textAlign: isRTL ? 'right' : 'left' }}
        style={{ textAlign: isRTL ? 'right' : 'left' }}
      >
        {LL.pageTitle}
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
            label={LL.department}
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
            <MenuItem value=''>{LL.allDepartments}</MenuItem>
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
            label={LL.designation}
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
            <MenuItem value=''>{LL.allDesignations}</MenuItem>
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
            {LL.clearFilters}
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
            {LL.addEmployee}
          </Button>
        </Stack>
        <Box display='flex' justifyContent='flex-end'>
          <Tooltip title={LL.exportTooltip}>
            <IconButton
              color='primary'
              onClick={() =>
                exportCSV(
                  '/employees/export',
                  'employees.csv',
                  token || '',
                  filters
                )
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
          onEdit={handleEditOpen}
          onResendInvite={handleResendInvite}
          onView={handleViewEmployee}
          loading={loading}
          departments={departments}
          designations={designations}
        />
      </Paper>

      {/* Pagination */}
      {(() => {
        // Get current page record count
        const currentPageRowsCount = employees.length;

        // Pagination buttons logic:
        // - On first page: Only show if current page has full limit (to indicate more pages exist)
        // - On other pages (including last page): Always show if there are multiple pages
        // But don't show if current page has no records (invalid page)
        const shouldShowPagination =
          totalPages > 1 &&
          currentPageRowsCount > 0 && // Don't show if current page has no records
          (currentPage === 1
            ? currentPageRowsCount === itemsPerPage // First page: only show if full limit
            : true); // Other pages: always show if totalPages > 1 and has records

        // Ensure we only show pages that have actual data
        // For example: 50 records with limit 25 = exactly 2 pages (not 3)
        // Recalculate to ensure accuracy - no empty pages
        const exactTotalPages =
          totalItems > 0 && itemsPerPage > 0
            ? Math.ceil(totalItems / itemsPerPage)
            : 1;

        // Use the exact calculated pages (no rounding errors)
        const finalTotalPages = exactTotalPages;

        return shouldShowPagination && finalTotalPages > 1 ? (
          <Box display='flex' justifyContent='center' mt={2}>
            <Pagination
              count={finalTotalPages}
              page={Math.min(currentPage, finalTotalPages)}
              onChange={(_, page) => {
                // Ensure page doesn't exceed valid total pages
                const validPage = Math.min(page, finalTotalPages);
                handlePageChange(validPage);
              }}
              color='primary'
              showFirstButton
              showLastButton
            />
          </Box>
        ) : null;
      })()}

      {/* Pagination Info */}
      {totalItems > 0 && (
        <Box display='flex' justifyContent='center' mt={1}>
          <Typography variant='body2' color='textSecondary'>
            {LL.showingInfo(currentPage, totalPages, totalItems)}
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
          {LL.confirmDeleteTitle}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center' }}>
            <WarningIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
            <Typography
              variant='body1'
              sx={{ mb: 2, lineHeight: 1.6, color: textColor }}
            >
              {LL.confirmDeleteMessage(pendingDeleteName || undefined)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', p: 3, pt: 1 }}>
          <Button
            onClick={cancelDelete}
            variant='outlined'
            sx={{ color: textColor, borderColor }}
          >
            {LL.cancel}
          </Button>
          <Button onClick={confirmDelete} variant='contained' color='error'>
            {LL.delete}
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
          dir={isRTL ? 'rtl' : 'ltr'}
          sx={{
            textAlign: isRTL ? 'right' : 'left',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: isRTL ? 'row-reverse' : 'row',
            color: textColor,
          }}
        >
          <Box component='span' sx={{ fontWeight: 600, order: isRTL ? 2 : 1 }}>
            {editing ? LL.editEmployee : LL.addNewEmployee}
          </Box>
          <IconButton
            onClick={() => setOpen(false)}
            sx={{
              order: isRTL ? 1 : 2,
              color: darkMode ? '#ccc' : theme.palette.grey[500],
            }}
            aria-label='close'
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ direction: 'ltr' }}>
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
                    cnicNumber: editing.cnic_number || ' ',
                    profilePicture: toAbsoluteUrl(editing.profile_picture),
                    cnicFrontPicture: toAbsoluteUrl(editing.cnic_picture),
                    cnicBackPicture: toAbsoluteUrl(editing.cnic_back_picture),
                    role: editing.role_name || '',
                    role_name: editing.role_name || '',
                    designationId: editing.designationId,
                    departmentId: editing.departmentId,
                  }
                : null
            }
            submitting={submitting}
          />
        </DialogContent>
      </Dialog>

      {/* Employee View Modal */}
      <EmployeeViewModal
        open={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setViewingEmployee(null);
        }}
        employee={viewingEmployee}
      />
    </Box>
  );
};

// Export default component only
export default EmployeeManager;
