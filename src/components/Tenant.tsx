import React, { useEffect, useState, useCallback } from 'react';
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
import companyApi from '../api/companyApi';
import { formatDate } from '../utils/dateUtils';

type StatusFilterOption = 'All' | 'active' | 'suspended' | 'deleted';

const createEmptyTenantForm = () => ({
  name: '',
  domain: '',
  logo: '',
  adminName: '',
  adminEmail: '',
});

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

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = 25;

  const fetchTenants = useCallback(async () => {
    try {
      setIsLoading(true);

      const res = await SystemTenantApi.getAll({
        page: 1,
        limit: 'all',
        includeDeleted: true,
      });

      let allTenants = res.data;

      let filtered = allTenants;

      if (statusFilter === 'active') {
        filtered = allTenants.filter(
          t => !t.isDeleted && t.status === 'active'
        );
      } else if (statusFilter === 'suspended') {
        filtered = allTenants.filter(
          t => !t.isDeleted && t.status === 'suspended'
        );
      } else if (statusFilter === 'deleted') {
        filtered = allTenants.filter(t => t.isDeleted);
      }

      setTotalRecords(filtered.length);

      const pages = Math.ceil(filtered.length / itemsPerPage);
      setTotalPages(pages);

      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      setTenants(filtered.slice(start, end));
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: 'Failed to fetch tenants',
        severity: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchTenants();
  }, [currentPage, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

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
        message: 'All fields are required',
        severity: 'error',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail.trim())) {
      setSnackbar({
        open: true,
        message: 'Please enter a valid admin email',
        severity: 'error',
      });
      return;
    }

    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(name.trim()) || !nameRegex.test(adminName.trim())) {
      setSnackbar({
        open: true,
        message: 'Names can only contain letters and spaces',
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
        message: 'Tenant created successfully',
        severity: 'success',
      });
      closeCreateModal();
    } catch (error) {
      console.error('Error creating tenant:', error);

      let errorMessage = 'Failed to create tenant';

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
        errorMessage = 'Tenant already exists';
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
        message: 'Company name and domain are required',
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
        message: 'Tenant updated successfully',
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
        message: 'Failed to update tenant',
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
    <Box>
      {/* Header */}
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems={isMobile ? 'stretch' : 'center'}
        flexDirection={isMobile ? 'column' : 'row'}
        gap={2}
        mb={3}
      >
        <Typography variant='h5' fontWeight={700}>
          Tenant Management
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
            <AddIcon /> Create Tenant
          </Button>
        </Box>
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
                  <TableCell>
                    <strong>Name</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Status</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Created</strong>
                  </TableCell>
                  <TableCell align='center'>
                    <strong>Actions</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tenants.map(t => (
                  <TableRow key={t.id} hover>
                    <TableCell>{t.name}</TableCell>
                    <TableCell>
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
                    <TableCell>{formatDate(t.created_at)}</TableCell>
                    <TableCell align='center'>
                      {!t.isDeleted ? (
                        <>
                          <Tooltip title='View Details'>
                            <IconButton onClick={() => handleViewDetails(t)}>
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title='Edit Tenant'>
                            <IconButton
                              color='primary'
                              onClick={() => handleOpenEdit(t)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title='Delete'>
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
                        <Tooltip title='Restore Tenant'>
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
                        No tenants found.
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
            Showing page {currentPage} of {totalPages} ({totalRecords} total
            records)
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
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          Tenant Details
        </DialogTitle>
        <DialogContent>
          {tenantDetail ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Tenant + Logo Section */}
              <Card
                sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 3 }}
              >
                {(() => {
                  // Check for logo in multiple places: direct logo property or company.logo_url
                  let logoUrl =
                    tenantDetail.logo || tenantDetail.company?.logo_url || null;

                  // If logo is a relative path, convert it to full URL
                  if (
                    logoUrl &&
                    typeof logoUrl === 'string' &&
                    logoUrl.startsWith('/')
                  ) {
                    const baseURL =
                      import.meta.env.VITE_API_BASE_URL ||
                      'http://localhost:5173';
                    logoUrl = `${baseURL}${logoUrl}`;
                  }

                  // Check if logoUrl is valid (not empty, not '[object Object]', and is a string)
                  const isValidLogo =
                    logoUrl &&
                    typeof logoUrl === 'string' &&
                    logoUrl !== '[object Object]' &&
                    logoUrl.trim() !== '' &&
                    !logoUrl.includes('[object Object]');

                  if (!isValidLogo) {
                    console.log('Tenant Detail Logo Debug:', {
                      tenantDetail,
                      logoUrl,
                      logoType: typeof logoUrl,
                      companyLogoUrl: tenantDetail.company?.logo_url,
                      processedLogo: tenantDetail.logo,
                    });
                  }

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
                      onError={e => {
                        console.error('Failed to load logo image:', logoUrl);
                        // Hide broken image
                        (e.target as HTMLImageElement).style.display = 'none';
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
                    Tenant Information
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography>
                      <strong>Domain:</strong> {tenantDetail.domain}
                    </Typography>
                    <Typography>
                      <strong>Status:</strong>{' '}
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
                      <strong>Created:</strong>{' '}
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
                      Company Information
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Typography>
                        <strong>Name:</strong>{' '}
                        {tenantDetail.company.company_name}
                      </Typography>
                      <Typography>
                        <strong>Plan:</strong> {tenantDetail.company.plan_id}
                      </Typography>
                      <Typography>
                        <strong>Paid:</strong>{' '}
                        <Chip
                          label={tenantDetail.company.is_paid ? 'Paid' : 'Free'}
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
                    Summary
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography>
                      <strong>Departments:</strong>{' '}
                      {tenantDetail.departmentCount}
                    </Typography>
                    <Typography>
                      <strong>Employees:</strong> {tenantDetail.employeeCount}
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
                    Departments
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

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setIsDetailOpen(false)}
            variant='contained'
            sx={{ minWidth: 80 }}
          >
            Close
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
        <DialogTitle>Create Tenant</DialogTitle>
        <DialogContent dividers>
          <TextField
            label='Tenant Name'
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
            }}
            helperText='Only alphabets and spaces are allowed'
          />
          <TextField
            label='Domain'
            value={tenantForm.domain}
            onChange={e =>
              setTenantForm(prev => ({ ...prev, domain: e.target.value }))
            }
            fullWidth
            sx={{ mt: 2 }}
            placeholder='example.com'
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
                {selectedLogoFile ? 'Change Logo' : 'Upload Company Logo'}
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
                  <Typography variant='body2' fontWeight='bold'>
                    {selectedLogoFile?.name}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
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
            label='Admin Name'
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
            }}
            helperText='Only alphabets and spaces are allowed'
          />
          <TextField
            label='Admin Email'
            value={tenantForm.adminEmail}
            onChange={e =>
              setTenantForm(prev => ({ ...prev, adminEmail: e.target.value }))
            }
            fullWidth
            sx={{ mt: 2 }}
            type='email'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCreateModal} disabled={uploadingLogo}>
            Cancel
          </Button>
          <Button
            variant='contained'
            onClick={handleCreate}
            disabled={uploadingLogo}
          >
            {uploadingLogo ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                Uploading...
              </Box>
            ) : (
              'Save'
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
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Are you sure you want to delete{' '}
            <strong>{selectedTenant?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
          <Button color='error' variant='contained' onClick={handleDelete}>
            Delete
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
        <DialogTitle>Edit Tenant</DialogTitle>
        <DialogContent dividers>
          <TextField
            label='Company Name'
            value={editCompanyName}
            onChange={e => {
              const value = e.target.value;
              if (/^[A-Za-z\s]*$/.test(value)) {
                setEditCompanyName(value);
              }
            }}
            fullWidth
            sx={{ mt: 2 }}
            inputProps={{ maxLength: 50 }}
            helperText='Only alphabets and spaces are allowed'
            required
          />
          <TextField
            label='Domain'
            value={editDomain}
            onChange={e => setEditDomain(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
            placeholder='example.com'
            required
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
                {editLogoFile ? 'Change Logo' : 'Upload Company Logo'}
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
                  <Typography variant='body2' fontWeight='bold'>
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
        <DialogActions>
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
            Cancel
          </Button>
          <Button
            variant='contained'
            onClick={handleUpdate}
            disabled={uploadingEditLogo}
          >
            {uploadingEditLogo ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                Updating...
              </Box>
            ) : (
              'Update'
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
