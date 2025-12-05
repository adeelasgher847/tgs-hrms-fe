import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Fab,
  useMediaQuery,
  Paper,
  Divider,
  // Snackbar,
  // Alert,
  CircularProgress,
  useTheme,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { Add as AddIcon, Business as BusinessIcon } from '@mui/icons-material';
import { useOutletContext } from 'react-router-dom';
import type { DepartmentFormData } from '../../types';
import { DepartmentCard } from './DepartmentCard';
import { DepartmentFormModal } from './DepartmentFormModal';
import DeleteConfirmationDialog from '../Common/DeleteConfirmationDialog';
import { useLanguage } from '../../hooks/useLanguage';
import {
  departmentApiService,
  type FrontendDepartment,
} from '../../api/departmentApi';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../Common/ErrorSnackbar';
import {
  isSystemAdmin as isSystemAdminFn,
} from '../../utils/roleUtils';
import { SystemTenantApi } from '../../api/systemTenantApi';
import type { SystemTenant } from '../../api/systemTenantApi';
import { COLORS } from '../../constants/appConstants';

const labels = {
  en: {
    title: 'Departments',
    create: 'Create Department',
    createFirst: 'Create First Department',
    noDepartments: 'No Departments Found',
    description: 'Get started by creating your first department',
  },
  ar: {
    title: 'إدارة الأقسام',
    create: 'إنشاء قسم',
    createFirst: 'إنشاء قسم جديد',
    noDepartments: 'لا توجد أقسام',
    description: 'ابدأ بإنشاء قسم جديد لإدارة مؤسستك',
  },
};

export const DepartmentList: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const { language } = useLanguage();

  const isRtl = language === 'ar';
  const lang = labels[language];

  const bgPaper = darkMode ? '#1b1b1b' : '#fff';
  const textPrimary = darkMode ? '#e0e0e0' : theme.palette.text.primary;
  const textSecond = darkMode ? '#9a9a9a' : theme.palette.text.secondary;
  const dividerCol = darkMode ? '#333' : '#ccc';
  const textColor = darkMode ? '#8f8f8f' : '#000';
  const borderColor = darkMode ? '#252525' : '#f0f0f0';

  // Get user role
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);
  const userRoleValue = user?.role;
  const isSystemAdmin = isSystemAdminFn(userRoleValue);

  const [departments, setDepartments] = useState<FrontendDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] =
    useState<FrontendDepartment | null>(null);
  const [allTenants, setAllTenants] = useState<SystemTenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('all');
  const [loadingTenants, setLoadingTenants] = useState(false);
  const { snackbar, showError, showSuccess, closeSnackbar } = useErrorHandler();

  // Fetch tenants for system admin
  useEffect(() => {
    if (!isSystemAdmin) return;

    const fetchTenants = async () => {
      try {
        setLoadingTenants(true);
        const tenants = await SystemTenantApi.getAllTenants(false);
        const activeTenants = tenants.filter(
          t => t.status === 'active' && t.isDeleted === false
        );
        setAllTenants(activeTenants);

        // Default to "All Tenants" - no need to set selectedTenantId
      } catch {
        // Leave tenant filter empty on failure
      } finally {
        setLoadingTenants(false);
      }
    };

    fetchTenants();
  }, [isSystemAdmin]);

  /* ---------- API handlers ---------- */
  const fetchDepartments = async () => {
    try {
      setLoading(true);

      if (isSystemAdmin) {
        // Use new API for system admin
        // Pass tenant_id only if a specific tenant is selected (not "all")
        const tenantIdParam =
          selectedTenantId && selectedTenantId !== 'all'
            ? selectedTenantId
            : undefined;
        const response =
          await departmentApiService.getAllTenantsWithDepartments(
            tenantIdParam
          );

        // Filter departments based on selected tenant
        const allDepartments: FrontendDepartment[] = [];
        response.tenants.forEach(tenant => {
          // If "All Tenants" is selected or no tenant selected, show all departments
          // Otherwise, only show departments from selected tenant
          if (
            selectedTenantId === 'all' ||
            !selectedTenantId ||
            tenant.tenant_id === selectedTenantId
          ) {
            tenant.departments.forEach(dept => {
              allDepartments.push({
                id: dept.id,
                name: dept.name,
                nameAr: '',
                description: dept.description || '',
                descriptionAr: '',
              });
            });
          }
        });

        setDepartments(allDepartments);
      } else {
        // Use existing API for other roles
        const backendDepartments =
          await departmentApiService.getAllDepartments();
        const frontendDepartments = backendDepartments.map(dept =>
          departmentApiService.convertBackendToFrontend(dept)
        );
        setDepartments(frontendDepartments);
      }
    } catch (error: unknown) {
      showError(error, { operation: 'fetch', resource: 'department' });
    } finally {
      setLoading(false);
    }
  };

  // Load departments on component mount and when tenant changes
  useEffect(() => {
    fetchDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSystemAdmin, selectedTenantId]);

  const handleTenantChange = (event: SelectChangeEvent<string>) => {
    setSelectedTenantId(event.target.value);
  };

  const handleCreateDepartment = async (data: DepartmentFormData) => {
    try {
      // Only send English fields to backend
      const departmentDto = {
        name: data.name,
        description: data.description, // Send empty string if description is cleared
      };

      const newBackendDepartment =
        await departmentApiService.createDepartment(departmentDto);
      const newFrontendDepartment =
        departmentApiService.convertBackendToFrontend(newBackendDepartment);

      // Create frontend department
      const newDepartment: FrontendDepartment = {
        ...newFrontendDepartment,
      };

      setDepartments(prev => [newDepartment, ...prev]);
      setIsFormModalOpen(false);
      showSuccess('Department created successfully');
    } catch (error: unknown) {
      showError(error, { operation: 'create', resource: 'department' });
    }
  };

  const handleEditDepartment = async (data: DepartmentFormData) => {
    if (!selectedDepartment) return;

    try {
      // Only send English fields to backend
      const departmentDto = {
        name: data.name,
        description: data.description, // Send empty string if description is cleared
      };

      const updatedBackendDepartment =
        await departmentApiService.updateDepartment(
          selectedDepartment.id,
          departmentDto
        );
      const updatedFrontendDepartment =
        departmentApiService.convertBackendToFrontend(updatedBackendDepartment);

      // Create updated frontend department
      const updatedDepartment: FrontendDepartment = {
        ...updatedFrontendDepartment,
      };

      setDepartments(prev =>
        prev.map(d => (d.id === selectedDepartment.id ? updatedDepartment : d))
      );
      setSelectedDepartment(null);
      setIsFormModalOpen(false);
      showSuccess('Department updated successfully');
    } catch (error: unknown) {
      showError(error, { operation: 'update', resource: 'department' });
    }
  };

  const handleDeleteDepartment = async () => {
    if (!selectedDepartment) return;

    try {
      await departmentApiService.deleteDepartment(selectedDepartment.id);
      setDepartments(prev => prev.filter(d => d.id !== selectedDepartment.id));
      setSelectedDepartment(null);
      setIsDeleteModalOpen(false);
      showSuccess('Department deleted successfully');
    } catch (error: unknown) {
      showError(error, { operation: 'delete', resource: 'department' });
    }
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        direction: isRtl ? 'rtl' : 'ltr',
        minHeight: '100vh',
        color: textPrimary,
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <Paper
        elevation={0} // No shadow
        sx={{
          mb: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          backgroundColor: 'unset',
          color: textColor,
          boxShadow: 'none', // Ensure no shadow
        }}
      >
        <Typography
          variant='h4'
          fontWeight={700}
          sx={{ textAlign: isRtl ? 'right' : 'left', py: 1.5 }}
        >
          {lang.title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isSystemAdmin && (
            <FormControl
              size='small'
              sx={{ minWidth: 200, maxWidth: { xs: '100%', sm: '400px' } }}
            >
              <Select
                value={selectedTenantId}
                onChange={handleTenantChange}
                displayEmpty
                sx={{
                  color: textColor,
                  backgroundColor: bgPaper,
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: borderColor,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: borderColor,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: borderColor,
                  },
                }}
              >
                <MenuItem value='all'>
                  {language === 'ar' ? 'جميع المستأجرين' : 'All Tenants'}
                </MenuItem>
                {allTenants.map((tenant: SystemTenant) => (
                  <MenuItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {!isMobile && !isSystemAdmin && (
            <Button
              variant='contained'
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedDepartment(null);
                setIsFormModalOpen(true);
              }}
              sx={{
                borderRadius: '0.375rem',
                textTransform: 'none',
                fontWeight: 600,
                bgcolor: darkMode ? COLORS.PRIMARY : COLORS.PRIMARY,
                boxShadow: 'none', // Remove button shadow
                '&:hover': {
                  bgcolor: darkMode ? COLORS.PRIMARY : COLORS.PRIMARY,
                  boxShadow: 'none',
                },
              }}
            >
              {lang.create}
            </Button>
          )}
        </Box>
      </Paper>

      <Divider sx={{ mb: 4, borderColor: dividerCol }} />

      {/* Content */}
      {loading ? (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            bgcolor: bgPaper,
            color: textPrimary,
            boxShadow: 'none',
          }}
        >
          <Box
            display='flex'
            justifyContent='center'
            alignItems='center'
            height={200}
          >
            <CircularProgress />
          </Box>
        </Paper>
      ) : departments.length === 0 ? (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            bgcolor: bgPaper,
            color: textPrimary,
            boxShadow: 'none',
          }}
        >
          <BusinessIcon sx={{ fontSize: 64, color: textSecond, mb: 2 }} />
          <Typography variant='h6' color={textSecond} gutterBottom>
            {lang.noDepartments}
          </Typography>
          <Typography variant='body2' color={textSecond} sx={{ mb: 3 }}>
            {lang.description}
          </Typography>
          {!isSystemAdmin && (
            <Button
              variant='contained'
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedDepartment(null);
                setIsFormModalOpen(true);
              }}
              sx={{
                backgroundColor: COLORS.PRIMARY,
                boxShadow: 'none',
                '&:hover': { boxShadow: 'none' },
              }}
            >
              {lang.createFirst}
            </Button>
          )}
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            justifyContent: 'flex-start',
          }}
        >
          {departments.map(d => (
            <Box
              key={d.id}
              sx={{
                width: {
                  xs: '100%',
                  sm: 'calc(50% - 12px)',
                  md: 'calc(50% - 12px)',
                },
              }}
            >
              <DepartmentCard
                department={d}
                onEdit={
                  isSystemAdmin
                    ? undefined
                    : dept => {
                        setSelectedDepartment(dept);
                        setIsFormModalOpen(true);
                      }
                }
                onDelete={
                  isSystemAdmin
                    ? undefined
                    : dept => {
                        setSelectedDepartment(dept);
                        setIsDeleteModalOpen(true);
                      }
                }
                isRtl={isRtl}
              />
            </Box>
          ))}
        </Box>
      )}

      {/* FAB (mobile) */}
      {isMobile && !isSystemAdmin && (
        <Fab
          color='primary'
          onClick={() => {
            setSelectedDepartment(null);
            setIsFormModalOpen(true);
          }}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: isRtl ? 'auto' : 24,
            left: isRtl ? 24 : 'auto',
            boxShadow: 'none', // Remove FAB shadow
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Modals */}
      <DepartmentFormModal
        open={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedDepartment(null);
        }}
        onSubmit={
          selectedDepartment ? handleEditDepartment : handleCreateDepartment
        }
        department={selectedDepartment}
        isRtl={isRtl}
      />

      <DeleteConfirmationDialog
        open={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedDepartment(null);
        }}
        onConfirm={handleDeleteDepartment}
        message={
          selectedDepartment
            ? isRtl
              ? `هل أنت متأكد من أنك تريد حذف قسم "${selectedDepartment.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`
              : `Are you sure you want to delete the department "${selectedDepartment.name}"? This action cannot be undone.`
            : ''
        }
        itemName={selectedDepartment?.name}
        isRTL={isRtl}
      />

      {/* Snackbar for notifications */}
      <ErrorSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Box>
  );
};
