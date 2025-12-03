import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  useMediaQuery,
  Paper,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  Tooltip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Card,
  Pagination,
  Avatar,
} from '@mui/material';
import { useLanguage } from '../hooks/useLanguage';
import type { SelectChangeEvent } from '@mui/material/Select';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import {
  SystemTenantApi,
  type SystemTenant,
  type SystemTenantDetail,
} from '../api/systemTenantApi';
// companyApi import removed (not used in this file)
import { formatDate } from '../utils/dateUtils';

type StatusFilterOption = 'All' | 'active' | 'suspended' | 'deleted';

const createEmptyTenantForm = () => ({
  name: '',
  domain: '',
  logo: '',
  adminName: '',
  adminEmail: '',
});

const TENANT_STRINGS = {
  en: {
    pageTitle: 'Tenant Management',
    createTenant: 'Create Company',
    failedFetch: 'Failed to fetch tenants',
    selectImage: 'Please select an image file',
    fileTooLarge: 'File size should be less than 5MB',
    allFieldsRequired: 'All fields are required',
    invalidAdminEmail: 'Please enter a valid admin email',
    namesOnlyLetters: 'Names can only contain letters and spaces',
    tenantCreated: 'Tenant created successfully',
    failedCreate: 'Failed to create tenant',
    tenantExists: 'Tenant already exists',
    companyNameDomainRequired: 'Company name and domain are required',
    failedUploadLogo: 'Failed to upload logo',
    tenantUpdated: 'Tenant updated successfully',
    failedUpdate: 'Failed to update tenant',
    viewDetails: 'View Details',
    editTenant: 'Edit Tenant',
    delete: 'Delete',
    restoreTenant: 'Restore Tenant',
    noTenantsFound: 'No tenants found.',
    tenantDetails: 'Tenant Details',
    noLogo: 'No Logo',
    tenantInformation: 'Tenant Information',
    companyInformation: 'Company Information',
    summary: 'Summary',
    departments: 'Departments',
    createdLabel: 'Created:',
    planLabel: 'Plan',
    paidLabelText: 'Paid',
    employeesLabel: 'Employees',
    domainLabel: 'Domain:',
    statusLabel: 'Status:',
    companyNameLabel: 'Company Name',
    tenantNameLabel: 'Company Name',
    adminNameLabel: 'Admin Name',
    adminEmailLabel: 'Admin Email',
    uploadLogo: 'Upload Company Logo',
    changeLogo: 'Change Logo',
    currentLogo: 'Current Logo',
    uploadButtonUploading: 'Uploading...',
    save: 'Save',
    cancel: 'Cancel',
    confirmDeleteTitle: 'Confirm Delete',
    confirmDeleteText: (name: string) =>
      `Are you sure you want to delete ${name}?`,
    deleteConfirmButton: 'Delete',
    close: 'Close',
    updating: 'Updating...',
    update: 'Update',
    paidLabel: (isPaid: boolean) => (isPaid ? 'Paid' : 'Free'),
    deletedLabel: 'Deleted',
  },
  ar: {
    pageTitle: 'إدارة المستأجرين',
    createTenant: 'إنشاء شركة',
    failedFetch: 'فشل في جلب المستأجرين',
    selectImage: 'يرجى اختيار ملف صورة',
    fileTooLarge: 'يجب أن يكون حجم الملف أقل من 5 ميغابايت',
    allFieldsRequired: 'جميع الحقول مطلوبة',
    invalidAdminEmail: 'يرجى إدخال بريد إلكتروني صالح للمسؤول',
    namesOnlyLetters: 'يمكن أن تحتوي الأسماء على أحرف ومسافات فقط',
    tenantCreated: 'تم إنشاء المستأجر بنجاح',
    failedCreate: 'فشل في إنشاء المستأجر',
    tenantExists: 'المستأجر موجود بالفعل',
    companyNameDomainRequired: 'اسم الشركة والنطاق مطلوبان',
    failedUploadLogo: 'فشل في تحميل الشعار',
    tenantUpdated: 'تم تحديث المستأجر بنجاح',
    failedUpdate: 'فشل في تحديث المستأجر',
    viewDetails: 'عرض التفاصيل',
    editTenant: 'تعديل المستأجر',
    delete: 'حذف',
    restoreTenant: 'استعادة المستأجر',
    noTenantsFound: 'لم يتم العثور على مستأجرين.',
    tenantDetails: 'تفاصيل المستأجر',
    noLogo: 'لا يوجد شعار',
    tenantInformation: 'معلومات المستأجر',
    companyInformation: 'معلومات الشركة',
    summary: 'ملخص',
    departments: 'الأقسام',
    createdLabel: 'تاريخ الإنشاء:',
    planLabel: 'الخطة',
    paidLabelText: 'مدفوع',
    employeesLabel: 'الموظفين',
    domainLabel: 'النطاق:',
    statusLabel: 'الحالة:',
    companyNameLabel: 'اسم الشركة',
    tenantNameLabel: 'اسم الشركة',
    adminNameLabel: 'اسم المسؤول',
    adminEmailLabel: 'البريد الإلكتروني للمسؤول',
    uploadLogo: 'تحميل شعار الشركة',
    changeLogo: 'تغيير الشعار',
    currentLogo: 'الشعار الحالي',
    uploadButtonUploading: 'جارٍ التحميل...',
    save: 'حفظ',
    cancel: 'إلغاء',
    confirmDeleteTitle: 'تأكيد الحذف',
    confirmDeleteText: (name: string) => `هل أنت متأكد من حذف ${name}؟`,
    deleteConfirmButton: 'حذف',
    close: 'إغلاق',
    updating: 'جارٍ التحديث...',
    update: 'تحديث',
    paidLabel: (isPaid: boolean) => (isPaid ? 'مدفوع' : 'مجاني'),
    deletedLabel: 'محذوف',
  },
} as const;

export const TenantPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [tenants, setTenants] = useState<SystemTenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('All');

  const [selectedTenant, setSelectedTenant] = useState<SystemTenant | null>(
    null
  );
  const [tenantDetail, setTenantDetail] = useState<SystemTenantDetail | null>(
    null
  );

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [tenantForm, setTenantForm] = useState(createEmptyTenantForm);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTenantId, setEditTenantId] = useState<string | null>(null);
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editDomain, setEditDomain] = useState('');
  const [editLogo, setEditLogo] = useState('');
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null);
  const [uploadingEditLogo, setUploadingEditLogo] = useState(false);

  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Track logo load failure in details modal to fall back to initials
  const [detailLogoFailed, setDetailLogoFailed] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = 25;

  const { language } = useLanguage();

  const S = useMemo(
    () => TENANT_STRINGS[language as 'en' | 'ar'] || TENANT_STRINGS.en,
    [language]
  );

  const fetchTenants = useCallback(
    async (page: number = 1) => {
      try {
        setIsLoading(true);
        const res = await SystemTenantApi.getAll({
          page,
          limit: itemsPerPage,
          includeDeleted:
            statusFilter === 'All' ? true : statusFilter === 'deleted',
        });
        let filtered = res.data;
        if (statusFilter === 'active' || statusFilter === 'suspended') {
          filtered = res.data.filter(
            t => !t.isDeleted && t.status === statusFilter
          );
        } else if (statusFilter === 'deleted') {
          filtered = res.data.filter(t => t.isDeleted);
        }

        setTenants(filtered);
        const hasMorePages = res.data.length === itemsPerPage;
        if (res.totalPages && res.total) {
          setTotalPages(res.totalPages);
          setTotalRecords(res.total);
        } else {
          setTotalPages(hasMorePages ? page + 1 : page);
          setTotalRecords(
            hasMorePages
              ? page * itemsPerPage
              : (page - 1) * itemsPerPage + res.data.length
          );
        }
      } catch (err) {
        console.error(err);
        setSnackbar({
          open: true,
          message: S.failedFetch,
          severity: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [statusFilter, itemsPerPage, S]
  );

  useEffect(() => {
    fetchTenants(currentPage);
  }, [currentPage, statusFilter, fetchTenants]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const labels = {
    en: 'Tenant Management',
    ar: 'إدارة المستأجرين',
  } as const;

  // Add pagination helper localized strings
  const pageHelpers = {
    en: {
      showingInfo: (page: number, totalPages: number, total: number) =>
        `Showing page ${page} of ${totalPages} (${total} total records)`,
    },
    ar: {
      showingInfo: (page: number, totalPages: number, total: number) =>
        `عرض الصفحة ${page} من ${totalPages} (${total} سجلات)`,
    },
  } as const;
  const PH = pageHelpers[language] || pageHelpers.en;

  const tableHeaders = {
    en: {
      name: 'Name',
      status: 'Status',
      created: 'Created',
      actions: 'Actions',
    },
    ar: {
      name: 'الاسم',
      status: 'الحالة',
      created: 'تاريخ الإنشاء',
      actions: 'الإجراءات',
    },
  } as const;

  const closeCreateModal = () => {
    setIsFormOpen(false);
    setTenantForm(createEmptyTenantForm());
    setSelectedLogoFile(null);
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogoPreview(null);
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSnackbar({
        open: true,
        message: S.selectImage,
        severity: 'error',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSnackbar({
        open: true,
        message: S.fileTooLarge,
        severity: 'error',
      });
      return;
    }
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }

    setSelectedLogoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);
  };

  const handleRemoveLogoFile = () => {
    setSelectedLogoFile(null);
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogoPreview(null);
  };

  const handleCreate = async () => {
    const { name, domain, adminName, adminEmail } = tenantForm;
    if (
      !name.trim() ||
      !domain.trim() ||
      !adminName.trim() ||
      !adminEmail.trim()
    ) {
      setSnackbar({
        open: true,
        message: S.allFieldsRequired,
        severity: 'error',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail.trim())) {
      setSnackbar({
        open: true,
        message: S.invalidAdminEmail,
        severity: 'error',
      });
      return;
    }

    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(name.trim()) || !nameRegex.test(adminName.trim())) {
      setSnackbar({
        open: true,
        message: S.namesOnlyLetters,
        severity: 'error',
      });
      return;
    }

    try {
      setUploadingLogo(true);
      const tenantData: {
        name: string;
        domain: string;
        logo?: File;
        adminName: string;
        adminEmail: string;
      } = {
        name: name.trim(),
        domain: domain.trim(),
        adminName: adminName.trim(),
        adminEmail: adminEmail.trim(),
      };

      if (selectedLogoFile) {
        tenantData.logo = selectedLogoFile;
      }

      console.log('Creating tenant with data:', {
        name: tenantData.name,
        domain: tenantData.domain,
        logo: tenantData.logo?.name || 'No logo',
        adminName: tenantData.adminName,
        adminEmail: tenantData.adminEmail,
      });

      await SystemTenantApi.create(tenantData);
      fetchTenants();
      setSnackbar({
        open: true,
        message: S.tenantCreated,
        severity: 'success',
      });
      closeCreateModal();
    } catch (error) {
      console.error('Error creating tenant:', error);

      let errorMessage: string = S.failedCreate;

      const maybeAxiosError = error as {
        response?: {
          status?: number;
          data?: {
            message?: string;
            errors?: Array<{ field: string; message: string }>;
          };
        };
      };

      if (maybeAxiosError.response?.data?.errors) {
        const errors = maybeAxiosError.response.data.errors;
        const errorMessages = errors
          .map(e => `${e.field}: ${e.message}`)
          .join(', ');
        errorMessage = `Validation errors: ${errorMessages}`;
        console.error('Validation errors:', errors);
      } else if (maybeAxiosError.response?.data?.message) {
        errorMessage = maybeAxiosError.response.data.message;
      }

      const alreadyExists =
        maybeAxiosError.response?.status === 409 ||
        maybeAxiosError.response?.data?.message
          ?.toLowerCase()
          .includes('already');

      if (alreadyExists) {
        errorMessage = S.tenantExists;
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setUploadingLogo(false);
    }
  };
  const handleUpdate = async () => {
    if (!editTenantId || !editCompanyName.trim() || !editDomain.trim()) {
      setSnackbar({
        open: true,
        message: S.companyNameDomainRequired,
        severity: 'error',
      });
      return;
    }

    try {
      setUploadingEditLogo(true);

      const updateData: {
        tenantId: string;
        companyName: string;
        domain: string;
        logo?: string | File;
      } = {
        tenantId: editTenantId,
        companyName: editCompanyName.trim(),
        domain: editDomain.trim(),
      };

      // If a new logo file is selected, pass it directly (will be sent as multipart)
      // Otherwise, pass the existing logo URL if available
      if (editLogoFile) {
        updateData.logo = editLogoFile;
      } else if (editLogo) {
        updateData.logo = editLogo;
      }

      const updatedTenant = await SystemTenantApi.update(updateData);
      setTenants(prev =>
        prev.map(t => (t.id === editTenantId ? { ...t, ...updatedTenant } : t))
      );
      setSnackbar({
        open: true,
        message: S.tenantUpdated,
        severity: 'success',
      });
      setIsEditOpen(false);
      // Reset edit form
      setEditTenantId(null);
      setEditCompanyName('');
      setEditDomain('');
      setEditLogo('');
      setEditLogoFile(null);
      if (editLogoPreview) {
        URL.revokeObjectURL(editLogoPreview);
      }
      setEditLogoPreview(null);
      fetchTenants();
    } catch (error) {
      console.error('Failed to update tenant:', error);
      setSnackbar({
        open: true,
        message: S.failedUpdate,
        severity: 'error',
      });
    } finally {
      setUploadingEditLogo(false);
    }
  };

  const handleEditLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSnackbar({
        open: true,
        message: 'Please select an image file',
        severity: 'error',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSnackbar({
        open: true,
        message: 'File size should be less than 5MB',
        severity: 'error',
      });
      return;
    }

    if (editLogoPreview) {
      URL.revokeObjectURL(editLogoPreview);
    }

    setEditLogoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setEditLogoPreview(previewUrl);
  };

  const handleRemoveEditLogoFile = () => {
    setEditLogoFile(null);
    if (editLogoPreview) {
      URL.revokeObjectURL(editLogoPreview);
    }
    setEditLogoPreview(null);
  };

  const toggleStatus = async (tenant: SystemTenant) => {
    try {
      const newStatus = tenant.status === 'active' ? 'suspended' : 'active';
      const updatedTenant = await SystemTenantApi.updateStatus(
        tenant.id,
        newStatus
      );
      setTenants(prev =>
        prev.map(t => (t.id === updatedTenant.id ? updatedTenant : t))
      );
      setSnackbar({
        open: true,
        message: `Tenant "${tenant.name}" status changed to "${
          updatedTenant.status.charAt(0).toUpperCase() +
          updatedTenant.status.slice(1).toLowerCase()
        }"`,
        severity: 'success',
      });
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: 'Failed to update status',
        severity: 'error',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedTenant) return;
    try {
      await SystemTenantApi.remove(selectedTenant.id);
      fetchTenants();
      setSnackbar({
        open: true,
        message: 'Tenant deleted successfully',
        severity: 'success',
      });
    } catch {
      setSnackbar({
        open: true,
        message: 'Failed to delete tenant',
        severity: 'error',
      });
    } finally {
      setIsDeleteOpen(false);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await SystemTenantApi.restore(id);
      fetchTenants();
      setSnackbar({
        open: true,
        message: 'Tenant restored successfully',
        severity: 'success',
      });
    } catch {
      setSnackbar({
        open: true,
        message: 'Failed to restore tenant',
        severity: 'error',
      });
    }
  };

  const handleViewDetails = async (tenant: SystemTenant) => {
    try {
      setDetailLogoFailed(false);
      const detail = await SystemTenantApi.getById(tenant.id);
      setTenantDetail(detail);
      setIsDetailOpen(true);
    } catch {
      setSnackbar({
        open: true,
        message: 'Failed to load tenant details',
        severity: 'error',
      });
    }
  };

  const handleOpenEdit = async (tenant: SystemTenant) => {
    try {
      setEditTenantId(tenant.id);
      setEditCompanyName(tenant.name);

      // Fetch tenant details to get domain and logo
      try {
        const tenantDetail = await SystemTenantApi.getById(tenant.id);

        // Set domain from tenant detail
        if (tenantDetail.domain) {
          setEditDomain(tenantDetail.domain);
        } else if (tenantDetail.company?.domain) {
          setEditDomain(tenantDetail.company.domain);
        }

        // Set logo from tenant detail
        let logoUrl = tenantDetail.logo || tenantDetail.company?.logo_url;

        // Convert relative path to full URL if needed
        if (logoUrl && typeof logoUrl === 'string' && logoUrl.startsWith('/')) {
          const baseURL =
            import.meta.env.VITE_API_BASE_URL || 'http://localhost:5173';
          logoUrl = `${baseURL}${logoUrl}`;
        }

        if (
          logoUrl &&
          typeof logoUrl === 'string' &&
          logoUrl !== '[object Object]'
        ) {
          setEditLogo(logoUrl);
          setEditLogoPreview(logoUrl);
        }
      } catch (err) {
        console.log('Could not fetch tenant details:', err);
        // Set domain from tenant object as fallback
        setEditDomain('');
      }

      setIsEditOpen(true);
    } catch (error) {
      console.error('Failed to open edit modal:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load tenant details',
        severity: 'error',
      });
    }
  };

  return (
    <Box sx={{ direction: 'ltr' }}>
      {/* Header */}
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems={isMobile ? 'stretch' : 'center'}
        flexDirection={isMobile ? 'column' : 'row'}
        gap={2}
        mb={3}
      >
        {language === 'ar' ? (
          <>
            <Box display='flex' flexWrap='wrap' gap={2}>
              <FormControl size='small' sx={{ minWidth: 140 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label='Status'
                  onChange={(event: SelectChangeEvent<StatusFilterOption>) => {
                    const value = event.target.value as StatusFilterOption;
                    setStatusFilter(value);
                  }}
                >
                  <MenuItem value='All'>All</MenuItem>
                  <MenuItem value='active'>Active</MenuItem>
                  <MenuItem value='suspended'>Suspended</MenuItem>
                  <MenuItem value='deleted'>Deleted</MenuItem>
                </Select>
              </FormControl>
              <Button variant='contained' onClick={() => setIsFormOpen(true)}>
                <AddIcon /> {S.createTenant}
              </Button>
            </Box>

            <Typography
              variant='h5'
              fontWeight={700}
              dir='rtl'
              sx={{ textAlign: { xs: 'center', md: 'right' } }}
            >
              {labels[language]}
            </Typography>
          </>
        ) : (
          <>
            <Typography
              variant='h5'
              fontWeight={700}
              dir='ltr'
              sx={{ textAlign: { xs: 'center', md: 'left' } }}
            >
              {labels[language]}
            </Typography>

            <Box display='flex' flexWrap='wrap' gap={2}>
              <FormControl size='small' sx={{ minWidth: 140 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label='Status'
                  onChange={(event: SelectChangeEvent<StatusFilterOption>) => {
                    const value = event.target.value as StatusFilterOption;
                    setStatusFilter(value);
                  }}
                >
                  <MenuItem value='All'>All</MenuItem>
                  <MenuItem value='active'>Active</MenuItem>
                  <MenuItem value='suspended'>Suspended</MenuItem>
                  <MenuItem value='deleted'>Deleted</MenuItem>
                </Select>
              </FormControl>
              <Button variant='contained' onClick={() => setIsFormOpen(true)}>
                <AddIcon /> {S.createTenant}
              </Button>
            </Box>
          </>
        )}
      </Box>

      {/* Table */}
      {isLoading ? (
        <Box display='flex' justifyContent='center' alignItems='center' mt={6}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ borderRadius: 1, overflow: 'hidden', boxShadow: 'none' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ textAlign: 'left' }}>
                    <strong>{tableHeaders[language].name}</strong>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'left' }}>
                    <strong>{tableHeaders[language].status}</strong>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'left' }}>
                    <strong>{tableHeaders[language].created}</strong>
                  </TableCell>
                  <TableCell align='center'>
                    <strong>{tableHeaders[language].actions}</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tenants.map(t => (
                  <TableRow key={t.id} hover>
                    <TableCell sx={{ textAlign: 'left' }}>{t.name}</TableCell>
                    <TableCell sx={{ textAlign: 'left' }}>
                      {!t.isDeleted && (
                        <Switch
                          checked={t.status === 'active'}
                          onChange={() => toggleStatus(t)}
                          color='primary'
                        />
                      )}
                      {t.isDeleted
                        ? 'Deleted'
                        : t.status.charAt(0).toUpperCase() +
                          t.status.slice(1).toLowerCase()}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'left' }}>{formatDate(t.created_at)}</TableCell>
                    <TableCell align='center'>
                      {!t.isDeleted ? (
                        <>
                          <Tooltip title={S.viewDetails}>
                            <IconButton onClick={() => handleViewDetails(t)}>
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={S.editTenant}>
                            <IconButton
                              color='primary'
                              onClick={() => handleOpenEdit(t)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title={S.delete}>
                            <IconButton
                              color='error'
                              onClick={() => {
                                setSelectedTenant(t);
                                setIsDeleteOpen(true);
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : (
                        <Tooltip title={S.restoreTenant}>
                          <IconButton
                            color='success'
                            onClick={() => handleRestore(t.id)}
                          >
                            <RestoreIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}

                {tenants.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align='center'>
                      <Alert severity='info' sx={{ my: 2, borderRadius: 2 }}>
                        {S.noTenantsFound}
                      </Alert>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
      {(() => {
        // Get current page record count
        const currentPageRowsCount = tenants.length;

        // Pagination buttons logic:
        // - On first page: Only show if current page has full limit (to indicate more pages exist)
        // - On other pages (including last page): Always show if there are multiple pages
        // This allows navigation between pages even from the last page
        const shouldShowPagination =
          totalPages > 1 &&
          (currentPage === 1
            ? currentPageRowsCount === itemsPerPage // First page: only show if full limit
            : true); // Other pages: always show if totalPages > 1

        return shouldShowPagination ? (
          <Box display='flex' justifyContent='center' mt={2}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(_, page) => setCurrentPage(page)}
              color='primary'
              showFirstButton
              showLastButton
            />
          </Box>
        ) : null;
      })()}
      {totalRecords > 0 && (
        <Box display='flex' justifyContent='center' mt={1}>
          <Typography variant='body2' color='textSecondary'>
            {PH.showingInfo(currentPage, totalPages, totalRecords)}
          </Typography>
        </Box>
      )}

      {/* Detail Modal (Updated) */}
      <Dialog
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle
          dir={language === 'ar' ? 'rtl' : 'ltr'}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            textAlign: language === 'ar' ? 'right' : 'left',
          }}
          style={{ textAlign: language === 'ar' ? 'right' : 'left' }}
        >
          {S.tenantDetails}
        </DialogTitle>
        <DialogContent sx={{ direction: 'ltr' }}>
          {tenantDetail ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Tenant + Logo Section */}
              <Card
                sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 3 }}
              >
                {(() => {
                  // Prefer API-processed logo string; fall back to company logo_url only if it's a string
                  const rawLogo =
                    (typeof tenantDetail.logo === 'string'
                      ? tenantDetail.logo
                      : undefined) ??
                    (typeof tenantDetail.company?.logo_url === 'string'
                      ? tenantDetail.company.logo_url
                      : undefined);

                  let logoUrl: string | null = rawLogo ?? null;

                  // If logo is a relative path, convert it to full URL
                  if (logoUrl && logoUrl.startsWith('/')) {
                    const baseURL =
                      import.meta.env.VITE_API_BASE_URL ||
                      'http://localhost:5173';
                    logoUrl = `${baseURL}${logoUrl}`;
                  }

                  const isValidLogo =
                    !detailLogoFailed &&
                    typeof logoUrl === 'string' &&
                    logoUrl.trim() !== '';

                  const companyName =
                    tenantDetail.company?.company_name ||
                    tenantDetail.name ||
                    '';
                  const initials =
                    companyName
                      .trim()
                      .split(/\s+/)
                      .slice(0, 2)
                      .map(word => word.charAt(0).toUpperCase())
                      .join('') || 'NA';

                  return isValidLogo && logoUrl ? (
                    <img
                      src={logoUrl}
                      alt='Tenant Logo'
                      style={{
                        width: 70,
                        height: 70,
                        borderRadius: '10px',
                        objectFit: 'cover',
                        border: '1px solid #ddd',
                      }}
                      onError={() => {
                        setDetailLogoFailed(true);
                      }}
                    />
                  ) : (
                    <Avatar
                      sx={{
                        width: 70,
                        height: 70,
                        borderRadius: '10px',
                        bgcolor: '#3f51b5',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: 20,
                      }}
                      variant='rounded'
                    >
                      {initials}
                    </Avatar>
                  );
                })()}

                <Box>
                  <Typography variant='h6' fontWeight={600}>
                    {tenantDetail.name}
                  </Typography>
                </Box>
              </Card>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 2,
                }}
              >
                {/* Tenant Info */}
                <Card variant='outlined' sx={{ p: 2 }}>
                  <Typography
                    variant='subtitle1'
                    color='primary'
                    fontWeight={600}
                  >
                    {S.tenantInformation}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography>
                      <strong>{S.domainLabel}</strong> {tenantDetail.domain}
                    </Typography>
                    <Typography>
                      <strong>{S.statusLabel}</strong>{' '}
                      <Chip
                        label={
                          tenantDetail.status.charAt(0).toUpperCase() +
                          tenantDetail.status.slice(1).toLowerCase()
                        }
                        color={
                          tenantDetail.status === 'active'
                            ? 'success'
                            : tenantDetail.status === 'suspended'
                              ? 'warning'
                              : 'error'
                        }
                        size='small'
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                    <Typography>
                      <strong>{S.createdLabel}</strong>{' '}
                      {formatDate(tenantDetail.created_at)}
                    </Typography>
                  </Box>
                </Card>

                {/* Company Info */}
                {tenantDetail.company && (
                  <Card variant='outlined' sx={{ p: 2 }}>
                    <Typography
                      variant='subtitle1'
                      color='primary'
                      fontWeight={600}
                    >
                      {S.companyInformation}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Typography>
                        <strong>{S.companyNameLabel}:</strong>{' '}
                        {tenantDetail.company.company_name}
                      </Typography>
                      <Typography>
                        <strong>{S.planLabel}:</strong>{' '}
                        {tenantDetail.company.plan_id}
                      </Typography>
                      <Typography>
                        <strong>{S.paidLabelText}:</strong>{' '}
                        <Chip
                          label={S.paidLabel(tenantDetail.company.is_paid)}
                          color={
                            tenantDetail.company.is_paid ? 'success' : 'warning'
                          }
                          size='small'
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                    </Box>
                  </Card>
                )}

                {/* Summary */}
                <Card variant='outlined' sx={{ p: 2 }}>
                  <Typography
                    variant='subtitle1'
                    color='primary'
                    fontWeight={600}
                  >
                    {S.summary}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography>
                      <strong>{S.departments}:</strong>{' '}
                      {tenantDetail.departmentCount}
                    </Typography>
                    <Typography>
                      <strong>{S.employeesLabel}:</strong>{' '}
                      {tenantDetail.employeeCount}
                    </Typography>
                  </Box>
                </Card>
              </Box>

              {/* Departments */}
              {tenantDetail.departments?.length > 0 && (
                <Card variant='outlined' sx={{ p: 2 }}>
                  <Typography
                    variant='subtitle1'
                    color='primary'
                    fontWeight={600}
                  >
                    {S.departments}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    {tenantDetail.departments.map(dep => (
                      <Chip
                        key={dep.id}
                        label={dep.name}
                        size='small'
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Box>
                </Card>
              )}
            </Box>
          ) : (
            <Box display='flex' justifyContent='center' mt={2}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            p: 2,
            // Mirror Close button: left in Arabic, right in English
            direction: 'ltr',
            justifyContent: language === 'ar' ? 'flex-start' : 'flex-end',
          }}
        >
          <Button
            onClick={() => setIsDetailOpen(false)}
            variant='contained'
            sx={{ minWidth: 80 }}
          >
            {S.close}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Modal */}
      <Dialog
        open={isFormOpen}
        onClose={closeCreateModal}
        fullWidth
        maxWidth='sm'
      >
        <DialogTitle
          dir={language === 'ar' ? 'rtl' : 'ltr'}
          sx={{ textAlign: language === 'ar' ? 'right' : 'left' }}
          style={{ textAlign: language === 'ar' ? 'right' : 'left' }}
        >
          {S.createTenant}
        </DialogTitle>
        <DialogContent dividers sx={{ direction: 'ltr' }}>
          <TextField
            label={S.tenantNameLabel}
            value={tenantForm.name}
            onChange={e => {
              const value = e.target.value;
              if (/^[A-Za-z\s]*$/.test(value)) {
                setTenantForm(prev => ({ ...prev, name: value }));
              }
            }}
            fullWidth
            sx={{ mt: 2 }}
            inputProps={{
              maxLength: 50,
              style: { direction: 'ltr', textAlign: 'left' },
            }}
            InputLabelProps={{ sx: { textAlign: 'left', width: '100%' } }}
            FormHelperTextProps={{ sx: { textAlign: 'left' } }}
            helperText={S.namesOnlyLetters}
          />
          <TextField
            label={S.domainLabel}
            value={tenantForm.domain}
            onChange={e =>
              setTenantForm(prev => ({ ...prev, domain: e.target.value }))
            }
            fullWidth
            sx={{ mt: 2 }}
            placeholder='example.com'
            inputProps={{
              style: { direction: 'ltr', textAlign: 'left' },
            }}
            InputLabelProps={{
              sx: {
                textAlign: 'left',
                width: '100%',
              },
            }}
          />

          {/* Logo Upload Section */}
          <Box sx={{ mt: 2 }}>
            <input
              accept='image/*'
              style={{ display: 'none' }}
              id='logo-upload-button'
              type='file'
              onChange={handleLogoFileChange}
            />
            <label htmlFor='logo-upload-button'>
              <Button
                variant='outlined'
                component='span'
                startIcon={<CloudUploadIcon />}
                fullWidth
                sx={{ mb: 2 }}
              >
                {selectedLogoFile ? S.changeLogo : S.uploadLogo}
              </Button>
            </label>
            {logoPreview && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mt: 2,
                  p: 2,
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                }}
              >
                <Avatar
                  src={logoPreview}
                  alt='Logo preview'
                  sx={{ width: 80, height: 80 }}
                  variant='rounded'
                />
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant='body2'
                    fontWeight='bold'
                    sx={{ textAlign: 'left' }}
                  >
                    {selectedLogoFile?.name}
                  </Typography>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    sx={{ textAlign: 'left' }}
                  >
                    {(selectedLogoFile?.size || 0) / 1024} KB
                  </Typography>
                </Box>
                <IconButton
                  onClick={handleRemoveLogoFile}
                  color='error'
                  size='small'
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            )}
          </Box>
          <TextField
            label={S.adminNameLabel}
            value={tenantForm.adminName}
            onChange={e => {
              const value = e.target.value;
              if (/^[A-Za-z\s]*$/.test(value)) {
                setTenantForm(prev => ({ ...prev, adminName: value }));
              }
            }}
            fullWidth
            sx={{ mt: 2 }}
            inputProps={{
              maxLength: 50,
              style: { direction: 'ltr', textAlign: 'left' },
            }}
            InputLabelProps={{ sx: { textAlign: 'left', width: '100%' } }}
            FormHelperTextProps={{ sx: { textAlign: 'left' } }}
            helperText={S.namesOnlyLetters}
          />
          <TextField
            label={S.adminEmailLabel}
            value={tenantForm.adminEmail}
            onChange={e =>
              setTenantForm(prev => ({ ...prev, adminEmail: e.target.value }))
            }
            fullWidth
            sx={{ mt: 2 }}
            type='email'
            inputProps={{
              style: { direction: 'ltr', textAlign: 'left' },
            }}
            InputLabelProps={{
              sx: {
                textAlign: 'left',
                width: '100%',
              },
            }}
          />
        </DialogContent>
        <DialogActions
          dir={language === 'ar' ? 'rtl' : 'ltr'}
          sx={{
            // Keep dialog content LTR for DB values, but align action buttons to the right
            direction: language === 'ar' ? 'rtl' : 'ltr',
            justifyContent: 'flex-end',
          }}
        >
          <Button onClick={closeCreateModal} disabled={uploadingLogo}>
            {S.cancel}
          </Button>
          <Button
            variant='contained'
            onClick={handleCreate}
            disabled={uploadingLogo}
          >
            {uploadingLogo ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                {S.uploadButtonUploading}
              </Box>
            ) : (
              S.save
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        fullWidth
        maxWidth='xs'
      >
        <DialogTitle
          dir={language === 'ar' ? 'rtl' : 'ltr'}
          sx={{ textAlign: language === 'ar' ? 'right' : 'left' }}
          style={{ textAlign: language === 'ar' ? 'right' : 'left' }}
        >
          {S.confirmDeleteTitle}
        </DialogTitle>
        <DialogContent dividers sx={{ direction: 'ltr' }}>
          <Typography>
            {S.confirmDeleteText(selectedTenant?.name || '')}
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{
            p: 2,
            // Mirror action buttons: left in Arabic, right in English
            direction: 'ltr',
            justifyContent: language === 'ar' ? 'flex-start' : 'flex-end',
          }}
        >
          <Button onClick={() => setIsDeleteOpen(false)}>{S.cancel}</Button>
          <Button color='error' variant='contained' onClick={handleDelete}>
            {S.deleteConfirmButton}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Edit Tenant Modal */}
      <Dialog
        open={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          // Reset edit form
          setEditTenantId(null);
          setEditCompanyName('');
          setEditDomain('');
          setEditLogo('');
          setEditLogoFile(null);
          if (editLogoPreview) {
            URL.revokeObjectURL(editLogoPreview);
          }
          setEditLogoPreview(null);
        }}
        fullWidth
        maxWidth='sm'
      >
        <DialogTitle
          dir={language === 'ar' ? 'rtl' : 'ltr'}
          sx={{ textAlign: language === 'ar' ? 'right' : 'left' }}
          style={{ textAlign: language === 'ar' ? 'right' : 'left' }}
        >
          {S.editTenant}
        </DialogTitle>
        <DialogContent dividers sx={{ direction: 'ltr' }}>
          <TextField
            label={S.companyNameLabel}
            value={editCompanyName}
            onChange={e => {
              const value = e.target.value;
              if (/^[A-Za-z\s]*$/.test(value)) {
                setEditCompanyName(value);
              }
            }}
            fullWidth
            sx={{ mt: 2 }}
            inputProps={{
              maxLength: 50,
              style: { direction: 'ltr', textAlign: 'left' },
            }}
            InputLabelProps={{ sx: { textAlign: 'left', width: '100%' } }}
            FormHelperTextProps={{ sx: { textAlign: 'left' } }}
            helperText={S.namesOnlyLetters}
            required
          />
          <TextField
            label={S.domainLabel}
            value={editDomain}
            onChange={e => setEditDomain(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
            placeholder='example.com'
            required
            inputProps={{
              style: { direction: 'ltr', textAlign: 'left' },
            }}
            InputLabelProps={{
              sx: {
                textAlign: 'left',
                width: '100%',
              },
            }}
          />

          {/* Logo Upload Section */}
          <Box sx={{ mt: 2 }}>
            <input
              accept='image/*'
              style={{ display: 'none' }}
              id='edit-logo-upload-button'
              type='file'
              onChange={handleEditLogoFileChange}
            />
            <label htmlFor='edit-logo-upload-button'>
              <Button
                variant='outlined'
                component='span'
                startIcon={<CloudUploadIcon />}
                fullWidth
                sx={{ mb: 2 }}
              >
                {editLogoFile ? S.changeLogo : S.uploadLogo}
              </Button>
            </label>
            {(editLogoPreview || editLogo) && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mt: 2,
                  p: 2,
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                }}
              >
                <Avatar
                  src={editLogoPreview || editLogo}
                  alt='Logo preview'
                  sx={{ width: 80, height: 80 }}
                  variant='rounded'
                />
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant='body2'
                    fontWeight='bold'
                    sx={{ textAlign: 'left' }}
                  >
                    {editLogoFile?.name || 'Current Logo'}
                  </Typography>
                  {editLogoFile && (
                    <Typography variant='caption' color='text.secondary'>
                      {(editLogoFile.size || 0) / 1024} KB
                    </Typography>
                  )}
                </Box>
                {editLogoFile && (
                  <IconButton
                    onClick={handleRemoveEditLogoFile}
                    color='error'
                    size='small'
                  >
                    <CloseIcon />
                  </IconButton>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            p: 2,
            // Mirror action buttons: left in Arabic, right in English
            direction: 'ltr',
            justifyContent: language === 'ar' ? 'flex-start' : 'flex-end',
          }}
        >
          <Button
            onClick={() => {
              setIsEditOpen(false);
              // Reset edit form
              setEditTenantId(null);
              setEditCompanyName('');
              setEditDomain('');
              setEditLogo('');
              setEditLogoFile(null);
              if (editLogoPreview) {
                URL.revokeObjectURL(editLogoPreview);
              }
              setEditLogoPreview(null);
            }}
            disabled={uploadingEditLogo}
          >
            {S.cancel}
          </Button>
          <Button
            variant='contained'
            onClick={handleUpdate}
            disabled={uploadingEditLogo}
          >
            {uploadingEditLogo ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                {S.updating}
              </Box>
            ) : (
              S.update
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default TenantPage;
