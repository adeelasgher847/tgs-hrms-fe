import React, { useEffect, useMemo, useState, useCallback } from 'react';
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
  const [editName, setEditName] = useState('');
  const [editTenantId, setEditTenantId] = useState<string | null>(null);

  // Logo upload state
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = 25; // Backend returns 25 records per page

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

        // Apply client-side filtering for status (active/suspended)
        let filtered = res.data;
        if (statusFilter === 'active' || statusFilter === 'suspended') {
          filtered = res.data.filter(
            t => !t.isDeleted && t.status === statusFilter
          );
        } else if (statusFilter === 'deleted') {
          filtered = res.data.filter(t => t.isDeleted);
        }

        setTenants(filtered);

        // Backend returns 25 records per page (fixed page size)
        // If we get 25 records, there might be more pages
        // If we get less than 25, it's the last page
        const hasMorePages = res.data.length === itemsPerPage;

        // Use backend pagination info if available, otherwise estimate
        if (res.totalPages && res.total) {
          setTotalPages(res.totalPages);
          setTotalRecords(res.total);
        } else {
          // Fallback: estimate based on current page and records received
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
          message: 'Failed to fetch tenants',
          severity: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [statusFilter, itemsPerPage]
  );

  useEffect(() => {
    fetchTenants(currentPage);
  }, [currentPage, fetchTenants]);

  // Reset to page 1 when filter changes
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

    // Clean up previous preview if exists
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
    let logoUrl = '';

    // Validate required fields
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

    // Logo is optional - if provided, it will be uploaded

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

      // Send logo file directly in the tenant creation request (FormData)
      // The backend handles file upload in the same API call
      const tenantData = {
        name: name.trim(),
        domain: domain.trim(),
        logo: selectedLogoFile!, // Send File directly, backend will handle upload
        adminName: adminName.trim(),
        adminEmail: adminEmail.trim(),
      };

      console.log('Creating tenant with data:', {
        name: tenantData.name,
        domain: tenantData.domain,
        logo: tenantData.logo?.name,
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

      // Check for validation errors
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
  const handleUpdate = async (
    tenantId: string,
    updatedData: { name: string }
  ) => {
    try {
      const updatedTenant = await SystemTenantApi.update(tenantId, updatedData);
      setTenants(prev =>
        prev.map(t => (t.id === tenantId ? { ...t, ...updatedTenant } : t))
      );
      setSnackbar({
        open: true,
        message: 'Tenant updated successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Failed to update tenant:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update tenant',
        severity: 'error',
      });
    }
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
        message: `Tenant "${tenant.name}" status changed to "${updatedTenant.status}"`,
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
            <AddIcon />
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
                      {t.isDeleted ? 'Deleted' : t.status}
                    </TableCell>
                    <TableCell>
                      {new Date(t.created_at).toLocaleDateString()}
                    </TableCell>
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
                              onClick={() => {
                                setEditTenantId(t.id);
                                setEditName(t.name);
                                setIsEditOpen(true);
                              }}
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

      {/* Server-side Pagination */}
      {totalPages > 1 && (
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
      )}
      {tenants.length > 0 && (
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
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {/* Basic Info */}
                <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                  <Card variant='outlined' sx={{ p: 2, height: '100%' }}>
                    <Typography variant='h6' gutterBottom color='primary'>
                      Basic Information
                    </Typography>
                    <Box
                      sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                    >
                      <Typography variant='body2'>
                        <strong>Name:</strong> {tenantDetail.name}
                      </Typography>
                      <Typography
                        variant='body2'
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <strong>Status:</strong>
                        <Chip
                          label={tenantDetail.status}
                          color={
                            tenantDetail.status === 'active'
                              ? 'success'
                              : tenantDetail.status === 'suspended'
                                ? 'warning'
                                : 'error'
                          }
                          size='small'
                        />
                      </Typography>
                    </Box>
                  </Card>
                </Box>

                {/* Counts */}
                <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                  <Card variant='outlined' sx={{ p: 2, height: '100%' }}>
                    <Typography variant='h6' gutterBottom color='primary'>
                      Summary
                    </Typography>
                    <Box
                      sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                    >
                      <Typography variant='body2'>
                        <strong>Departments:</strong>{' '}
                        {tenantDetail.departmentCount}
                      </Typography>
                      <Typography variant='body2'>
                        <strong>Employees:</strong> {tenantDetail.employeeCount}
                      </Typography>
                    </Box>
                  </Card>
                </Box>

                {/* Departments List */}
                {tenantDetail.departments.length > 0 && (
                  <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                    <Card variant='outlined' sx={{ p: 2 }}>
                      <Typography variant='h6' gutterBottom color='primary'>
                        Departments
                      </Typography>
                      <ul style={{ paddingLeft: 20 }}>
                        {tenantDetail.departments.map(dep => (
                          <li key={dep.id}>{dep.name}</li>
                        ))}
                      </ul>
                    </Card>
                  </Box>
                )}
              </Box>
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
        onClose={() => setIsEditOpen(false)}
        fullWidth
        maxWidth='sm'
      >
        <DialogTitle>Edit Tenant</DialogTitle>
        <DialogContent dividers>
          <TextField
            label='Tenant Name'
            value={editName}
            onChange={e => {
              const value = e.target.value;
              if (/^[A-Za-z\s]*$/.test(value)) {
                setEditName(value);
              }
            }}
            fullWidth
            sx={{ mt: 2 }}
            inputProps={{ maxLength: 50 }}
            helperText='Only alphabets are allowed'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditOpen(false)}>Cancel</Button>
          <Button
            variant='contained'
            onClick={async () => {
              if (!editTenantId || !editName.trim()) {
                setSnackbar({
                  open: true,
                  message: 'Tenant name is required',
                  severity: 'error',
                });
                return;
              }
              await handleUpdate(editTenantId, { name: editName.trim() });
              setIsEditOpen(false);
              setEditName('');
            }}
          >
            Update
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
