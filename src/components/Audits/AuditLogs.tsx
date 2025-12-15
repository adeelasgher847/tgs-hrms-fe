import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  useTheme,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  IconButton,
  Tooltip,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import systemDashboardApiService, {
  type RecentLog,
} from '../../api/systemDashboardApi';
import systemEmployeeApiService from '../../api/systemEmployeeApi';
import rolesApiService, { type Role } from '../../api/rolesApi';
import { PAGINATION } from '../../constants/appConstants';

interface Tenant {
  id: string;
  name: string;
}

const AuditLogs: React.FC = () => {
  const theme = useTheme();

  const [logs, setLogs] = useState<RecentLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = PAGINATION.DEFAULT_PAGE_SIZE; // Backend returns records per page

  // Filter states
  const [selectedUserRole, setSelectedUserRole] = useState<string>('');
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);

  // HTTP methods
  const httpMethods = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'];

  // Fetch tenants for filter
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setTenantsLoading(true);
        // Use the same API as Employee List to get all tenants
        const data = await systemEmployeeApiService.getAllTenants(true);
        // Show all tenants (no filtering) - same as Employee List
        const allTenants = (data || []).map((t: any) => ({
          id: t.id,
          name: t.name || t.tenant_name || '',
        }));
        setTenants(allTenants);
      } catch {
        setTenants([]);
      } finally {
        setTenantsLoading(false);
      }
    };
    fetchTenants();
  }, []);

  // Fetch roles for filter
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setRolesLoading(true);
        const allRoles = await rolesApiService.getAllRoles();
        // Convert role names to lowercase
        const rolesWithLowercaseNames = allRoles.map(role => ({
          ...role,
          name: role.name.toLowerCase(),
        }));
        setRoles(rolesWithLowercaseNames);
      } catch {
        setRoles([]);
      } finally {
        setRolesLoading(false);
      }
    };
    fetchRoles();
  }, []);

  const fetchLogs = useCallback(
    async (page: number = 1) => {
      try {
        setLogsLoading(true);
        const filters: {
          userRole?: string;
          tenantId?: string;
          method?: string;
        } = {};
        if (selectedUserRole) {
          filters.userRole = selectedUserRole;
        }
        if (selectedTenantId) {
          filters.tenantId = selectedTenantId;
        }
        if (selectedMethod) {
          filters.method = selectedMethod;
        }
        const response = await systemDashboardApiService.getSystemLogs(
          page,
          filters
        );
        setLogs(response);
      } catch {
        // Keep previous logs if fetch fails
      } finally {
        setLogsLoading(false);
      }
    },
    [selectedUserRole, selectedTenantId, selectedMethod]
  );

  useEffect(() => {
    fetchLogs(currentPage);
  }, [fetchLogs, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedUserRole, selectedTenantId, selectedMethod]);

  const handleExportLogs = async () => {
    const blob = await systemDashboardApiService.exportSystemLogs();
    if (blob) {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'audit_logs.csv';
      link.click();
      window.URL.revokeObjectURL(url);
    }
  };

  // Backend returns 25 records per page (fixed page size)
  // If we get 25 records, there might be more pages
  // If we get less than 25, it's the last page
  const hasMorePages = logs.length === itemsPerPage;
  // Since we don't have total count, we'll show pagination based on current page and whether there are more records
  const showPagination = currentPage > 1 || hasMorePages;
  // Calculate estimated total records
  const estimatedTotalRecords = hasMorePages
    ? currentPage * itemsPerPage
    : (currentPage - 1) * itemsPerPage + logs.length;
  const estimatedTotalPages = hasMorePages ? currentPage + 1 : currentPage;

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={2}
      >
        <Typography
          variant='h4'
          sx={{
            color: theme.palette.text.primary,
            textAlign: { xs: 'center', md: 'left' },
          }}
        >
          Audit Logs
        </Typography>
        <Tooltip title='Export Audit Logs (CSV)'>
          <IconButton
            color='primary'
            onClick={handleExportLogs}
            sx={{
              backgroundColor: 'primary.main',
              color: 'white',
              borderRadius: '6px',
              '&:hover': { backgroundColor: 'primary.dark' },
            }}
          >
            <DownloadIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Filters */}
      <Box
        display='flex'
        gap={2}
        mb={3}
        flexWrap='wrap'
        sx={{
          '& .MuiFormControl-root': {
            minWidth: { xs: '100%', sm: '200px' },
          },
        }}
      >
        <FormControl size='small'>
          <InputLabel>User Role</InputLabel>
          <Select
            value={selectedUserRole}
            onChange={e => setSelectedUserRole(e.target.value)}
            label='User Role'
            disabled={rolesLoading}
          >
            <MenuItem value=''>All</MenuItem>
            {roles.map(role => (
              <MenuItem key={role.id || role.name} value={role.name}>
                {role.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size='small'>
          <InputLabel>Tenant</InputLabel>
          <Select
            value={selectedTenantId}
            onChange={e => setSelectedTenantId(e.target.value)}
            label='Tenant'
            disabled={tenantsLoading}
          >
            <MenuItem value=''>All</MenuItem>
            {tenants.map(tenant => (
              <MenuItem key={tenant.id} value={tenant.id}>
                {tenant.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size='small'>
          <InputLabel>HTTP Method</InputLabel>
          <Select
            value={selectedMethod}
            onChange={e => setSelectedMethod(e.target.value)}
            label='HTTP Method'
          >
            <MenuItem value=''>All</MenuItem>
            {httpMethods.map(method => (
              <MenuItem key={method} value={method}>
                {method}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box
        sx={{
          overflowX: 'auto',
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Action</TableCell>
              <TableCell>Entity</TableCell>
              <TableCell>User Role</TableCell>
              <TableCell>Tenant Id</TableCell>
              <TableCell>Timestamp</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logsLoading ? (
              <TableRow>
                <TableCell colSpan={5} align='center'>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align='center'>
                  No logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map(log => (
                <TableRow key={log.id} hover>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{log.entityType}</TableCell>
                  <TableCell>{log.userRole || '-'}</TableCell>
                  <TableCell>{log.tenantId}</TableCell>
                  <TableCell>
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Box>

      {showPagination && (
        <Box display='flex' justifyContent='center' mt={2}>
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

      {logs.length > 0 && (
        <Box display='flex' justifyContent='center' mt={1}>
          <Typography variant='body2' color='textSecondary'>
            Showing page {currentPage} of {estimatedTotalPages} (
            {estimatedTotalRecords} total records)
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default AuditLogs;
