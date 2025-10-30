import React, { useEffect, useMemo, useState } from 'react';
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
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { useOutletContext } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useLanguage } from '../hooks/useLanguage';
import {
  SystemTenantApi,
  type SystemTenant,
  type SystemTenantDetail,
} from '../api/systemTenantApi';

export const TenantPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { darkMode } = useOutletContext<{ darkMode: boolean }>() || {
    darkMode: false,
  };
  const { language } = useLanguage?.() ?? { language: 'en' };

  const [tenants, setTenants] = useState<SystemTenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const [statusFilter, setStatusFilter] = useState<
    'All' | 'active' | 'suspended' | 'deleted'
  >('All');

  const [selectedTenant, setSelectedTenant] = useState<SystemTenant | null>(
    null
  );
  const [tenantDetail, setTenantDetail] = useState<SystemTenantDetail | null>(
    null
  );

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [formName, setFormName] = useState('');

  // ✅ Local pagination setup
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ Fetch all tenants once
  const fetchTenants = async () => {
    try {
      setIsLoading(true);
      const res = await SystemTenantApi.getAll({ includeDeleted: true });
      setTenants(res.data);
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
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  // ✅ Filter tenants
  const filteredTenants = useMemo(() => {
    return tenants.filter(t => {
      if (statusFilter === 'deleted') return t.isDeleted;
      if (statusFilter === 'active' || statusFilter === 'suspended')
        return !t.isDeleted && t.status === statusFilter;
      return true;
    });
  }, [tenants, statusFilter]);

  // ✅ Client-side pagination
  const totalPages = Math.ceil(filteredTenants.length / itemsPerPage);
  const paginatedTenants = filteredTenants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ✅ Create Tenant
  const handleCreate = async () => {
    if (!formName.trim()) {
      setSnackbar({
        open: true,
        message: 'Tenant name is required',
        severity: 'error',
      });
      return;
    }

    try {
      await SystemTenantApi.create({ name: formName.trim() });
      fetchTenants();
      setSnackbar({
        open: true,
        message: 'Tenant created successfully',
        severity: 'success',
      });
      setIsFormOpen(false);
      setFormName('');
    } catch (err: any) {
      console.error('Error creating tenant:', err);

      let errorMessage = 'Failed to create tenant';

      // ✅ Check if backend explicitly reports "already exists"
      if (
        err.response &&
        (err.response.status === 409 ||
          err.response.data?.message?.toLowerCase().includes('already'))
      ) {
        errorMessage = 'Tenant already exists';
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    }
  };

  // ✅ Toggle Status
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

  // ✅ Delete Tenant
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

  // ✅ Restore Tenant
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

  // ✅ View Details
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
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
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
              onChange={(e: SelectChangeEvent) =>
                setStatusFilter(e.target.value as any)
              }
            >
              <MenuItem value='All'>All</MenuItem>
              <MenuItem value='active'>Active</MenuItem>
              <MenuItem value='suspended'>Suspended</MenuItem>
              <MenuItem value='deleted'>Deleted</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant='contained'
            startIcon={<AddIcon />}
            onClick={() => setIsFormOpen(true)}
          >
            Create Tenant
          </Button>
        </Box>
      </Box>

      {/* Table */}
      {isLoading ? (
        <Box display='flex' justifyContent='center' alignItems='center' mt={6}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
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
                {paginatedTenants.map(t => (
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

                {paginatedTenants.length === 0 && (
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

      {/* ✅ Client-side Pagination */}
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
      {filteredTenants.length > 0 && (
        <Box display='flex' justifyContent='center' mt={1}>
          <Typography variant='body2' color='textSecondary'>
            Showing page {currentPage} of {totalPages} ({filteredTenants.length}{' '}
            total records)
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
        onClose={() => setIsFormOpen(false)}
        fullWidth
        maxWidth='sm'
      >
        <DialogTitle>Create Tenant</DialogTitle>
        <DialogContent dividers>
          <TextField
            label='Tenant Name'
            value={formName}
            onChange={e => {
              // Allow only alphabets and spaces
              const value = e.target.value;
              if (/^[A-Za-z\s]*$/.test(value)) {
                setFormName(value);
              }
            }}
            fullWidth
            sx={{ mt: 2 }}
            inputProps={{
              maxLength: 50, // optional: limit length
            }}
            helperText='Only alphabets are allowed'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsFormOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={handleCreate}>
            Save
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
