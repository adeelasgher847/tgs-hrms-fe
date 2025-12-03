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
import { useLanguage } from '../../hooks/useLanguage';
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
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = 25;

  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeWithTenantName | null>(null);
  const [openProfile, setOpenProfile] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const darkMode = theme.palette.mode === 'dark';

  // Fetch departments + tenants once on mount
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

  // Fetch designations for department dropdown
  const fetchDesignationsByDepartment = async (departmentId: string) => {
    if (!departmentId) {
      setDesignations([]);
      return;
    }
    try {
      const res = await designationApiService.getDesignationsByDepartment(
        departmentId,
        null
      );
      setDesignations(res.items || []);
    } catch (err) {
      console.error('Error fetching designations by department:', err);
    }
  };

  // Fetch employees. Not memoized so it always uses latest tenants/filters/currentPage.
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
      };
      if (filters.tenantId) params.tenantId = filters.tenantId;
      if (filters.departmentId) params.departmentId = filters.departmentId;
      if (filters.designationId) params.designationId = filters.designationId;

      const res = await systemEmployeeApiService.getSystemEmployees(params);
      const employeesData: SystemEmployee[] = Array.isArray(res)
        ? res
        : res.items || [];

      // Map flat API fields to include tenantName (match by tenantId)
      const mapped: EmployeeWithTenantName[] = employeesData.map(emp => {
        const tenantId =
          (emp as any).tenantId ||
          (emp as any).tenant_id ||
          (emp as any).tenant?.id;
        const matchedTenant = tenants.find(t => t.id === tenantId);
        return {
          ...emp,
          tenantName: matchedTenant ? matchedTenant.name : '', // show empty until tenants loaded
        };
      });

      setEmployees(mapped);

      // pagination info
      if (!Array.isArray(res) && typeof res.totalPages !== 'undefined') {
        setTotalPages(res.totalPages || 1);
        setTotalRecords(res.total || mapped.length);
      } else {
        // fallback estimate
        const hasMore = mapped.length === itemsPerPage;
        setTotalPages(hasMore ? currentPage + 1 : currentPage);
        setTotalRecords(
          hasMore
            ? currentPage * itemsPerPage
            : (currentPage - 1) * itemsPerPage + mapped.length
        );
      }
    } catch (err) {
      console.error('Error fetching system employees:', err);
    } finally {
      setLoading(false);
    }
  };

  // mount: load tenants & departments
  useEffect(() => {
    fetchFiltersData();
  }, []);

  // whenever tenants OR filters OR page changes, load employees
  // -> guarantees that when tenants arrive, employees are fetched/mapped again to pick up tenant names
  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tenants,
    filters.tenantId,
    filters.departmentId,
    filters.designationId,
    currentPage,
  ]);

  useEffect(() => {
    if (filters.departmentId)
      fetchDesignationsByDepartment(filters.departmentId);
    else setDesignations([]);
  }, [filters.departmentId]);

  // Update tenantName for currently shown employees when tenants array updates,
  // but only if there is a change (prevents unnecessary rerenders).
  useEffect(() => {
    if (!tenants.length || !employees.length) return;

    setEmployees(prev => {
      let changed = false;
      const updated = prev.map(emp => {
        const tenantId =
          (emp as any).tenantId ||
          (emp as any).tenant_id ||
          (emp as any).tenant?.id;
        const match = tenants.find(t => t.id === tenantId);
        const name = match ? match.name : '';
        if (emp.tenantName !== name) {
          changed = true;
          return { ...emp, tenantName: name };
        }
        return emp;
      });
      return changed ? updated : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenants]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    if (key === 'departmentId') {
      // reset designation when department changes
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
      alert(pageLabels[language].noDataToDownload);
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
        csvEscape((emp as any).departmentName),
        csvEscape((emp as any).designationTitle),
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

  const handleOpenProfile = (employee: EmployeeWithTenantName) => {
    setSelectedEmployee(employee);
    setOpenProfile(true);
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

  const hasMorePages = employees.length === itemsPerPage;
  const estimatedTotalRecords =
    totalRecords ||
    (hasMorePages
      ? currentPage * itemsPerPage
      : (currentPage - 1) * itemsPerPage + employees.length);
  const estimatedTotalPages =
    totalPages || (hasMorePages ? currentPage + 1 : currentPage);

  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const pageLabels = {
    en: {
      title: 'Employee List',
      tenantLabel: 'Tenant',
      departmentLabel: 'Department',
      designationLabel: 'Designation',
      exportTooltip: 'Export Employee List',
      noEmployees: 'No employees found',
      noDataToDownload: 'No data to download.',
      clearFilters: 'Clear Filters',
      showingInfo: (page: number, totalPages: number, total: number) =>
        `Showing page ${page} of ${totalPages} (${total} total records)`,
    },
    ar: {
      title: 'قائمة الموظفين',
      tenantLabel: 'المستأجر',
      departmentLabel: 'القسم',
      designationLabel: 'المسمى الوظيفي',
      exportTooltip: 'تصدير قائمة الموظفين',
      noEmployees: 'لم يتم العثور على موظفين',
      noDataToDownload: 'لا توجد بيانات للتنزيل.',
      clearFilters: 'مسح الفلاتر',
      showingInfo: (page: number, totalPages: number, total: number) =>
        `عرض الصفحة ${page} من ${totalPages} (${total} سجلات)`,
    },
  } as const;

  const tableHeaders = {
    en: {
      name: 'Name',
      tenant: 'Tenant',
      department: 'Department',
      designation: 'Designation',
      status: 'Status',
      createdAt: 'Created At',
      actions: 'Actions',
    },
    ar: {
      name: 'الاسم',
      tenant: 'المستأجر',
      department: 'القسم',
      designation: 'المسمى الوظيفي',
      status: 'الحالة',
      createdAt: 'تاريخ الإنشاء',
      actions: 'الإجراءات',
    },
  } as const;

  return (
    <Box dir='ltr' sx={{ direction: 'ltr' }}>
      <Typography
        dir={isRTL ? 'rtl' : 'ltr'}
        variant='h5'
        fontWeight='bold'
        mb={3}
        sx={{ textAlign: isRTL ? 'right' : 'left' }}
        style={{ textAlign: isRTL ? 'right' : 'left' }}
      >
        {pageLabels[language].title}
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
            label={pageLabels[language].tenantLabel}
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
            label={pageLabels[language].departmentLabel}
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
            label={pageLabels[language].designationLabel}
            value={filters.designationId}
            onChange={e => handleFilterChange('designationId', e.target.value)}
            size='small'
            disabled={!filters.departmentId}
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
            sx={{ borderColor: filterBtn, color: textColor }}
          >
            {pageLabels[language].clearFilters}
          </Button>
        </Stack>

        <Tooltip title={pageLabels[language].exportTooltip}>
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
                <TableCell>{tableHeaders[language].name}</TableCell>
                <TableCell>{tableHeaders[language].tenant}</TableCell>
                <TableCell>{tableHeaders[language].department}</TableCell>
                <TableCell>{tableHeaders[language].designation}</TableCell>
                <TableCell>{tableHeaders[language].status}</TableCell>
                <TableCell>{tableHeaders[language].createdAt}</TableCell>
                <TableCell align='center'>
                  {tableHeaders[language].actions}
                </TableCell>
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
                    <TableCell>{emp.tenantName || <em>—</em>}</TableCell>
                    <TableCell>{(emp as any).departmentName}</TableCell>
                    <TableCell>{(emp as any).designationTitle}</TableCell>
                    <TableCell>{emp.status}</TableCell>
                    <TableCell>
                      {emp.createdAt ? formatDate(emp.createdAt) : 'N/A'}
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
                    {pageLabels[language].noEmployees}
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
            {pageLabels[language].showingInfo(
              currentPage,
              estimatedTotalPages,
              estimatedTotalRecords
            )}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default TenantBasedEmployeeManager;
