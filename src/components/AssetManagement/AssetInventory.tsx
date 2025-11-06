import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Menu,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Stack,
  Pagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Build as BuildIcon,
  CheckCircle as AvailableIcon,
} from '@mui/icons-material';
import type {
  Asset,
  AssetFilters,
  MockUser,
  AssetStatus,
} from '../../types/asset';
import { assetApi, type Asset as ApiAsset } from '../../api/assetApi';
import AssetModal from './AssetModal';
import StatusChip from './StatusChip';
import ConfirmationDialog from './ConfirmationDialog';
import { Snackbar, Alert } from '@mui/material';
import { assetCategories } from '../../Data/assetCategories';

// Extended interface for API asset response that may include additional user information
interface ApiAssetWithUser extends ApiAsset {
  assignedToName?: string;
  assignedByUser?: {
    name: string;
  };
}

const AssetInventory: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [allAssetsForStats, setAllAssetsForStats] = useState<Asset[]>([]); // Store all assets for statistics
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const initialLoadRef = React.useRef(false); // Track if initial load has been done
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<AssetFilters>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'success' });
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  const showSnackbar = (
    message: string,
    severity: 'success' | 'error' | 'warning' | 'info' = 'success'
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 25,
    totalPages: 1,
  });

  // Mock data for users (these might need to be fetched from API later)
  const mockUsers: MockUser[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@company.com',
      department: 'IT',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane.smith@company.com',
      department: 'HR',
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike.johnson@company.com',
      department: 'Finance',
    },
  ];

  // Helper function to get user name from API response or fallback
  const getUserName = React.useCallback(
    (apiAsset: ApiAssetWithUser): string => {
      // Check if the API response includes user name information
      if (apiAsset.assignedToName) {
        return apiAsset.assignedToName;
      }
      if (apiAsset.assignedByUser?.name) {
        return apiAsset.assignedByUser.name;
      }
      // Fallback to user ID if no name is provided
      return apiAsset.assigned_to
        ? `User ${apiAsset.assigned_to}`
        : 'Unassigned';
    },
    []
  );

  // Helper function to transform API assets
  const transformApiAssets = React.useCallback(
    (apiAssets: ApiAssetWithUser[]): Asset[] => {
      return apiAssets.map((apiAsset: ApiAssetWithUser) => {
        // Try to find matching category from our comprehensive list
        const matchingCategory = assetCategories.find(
          cat =>
            cat.name.toLowerCase() === apiAsset.category.toLowerCase() ||
            cat.subcategories?.some(
              sub => sub.toLowerCase() === apiAsset.category.toLowerCase()
            )
        );

        return {
          id: apiAsset.id,
          name: apiAsset.name,
          category: matchingCategory
            ? {
                id: matchingCategory.id,
                name: matchingCategory.name,
                nameAr: matchingCategory.nameAr,
                description: matchingCategory.description,
                color: matchingCategory.color,
                subcategories: matchingCategory.subcategories,
              }
            : {
                id: apiAsset.category,
                name: apiAsset.category,
                nameAr: apiAsset.category,
                description: '',
                color: '#757575',
              },
          status: apiAsset.status,
          assignedTo: apiAsset.assigned_to || undefined,
          assignedToName: apiAsset.assigned_to
            ? getUserName(apiAsset)
            : undefined,
          serialNumber: '', // Not provided by API
          purchaseDate: apiAsset.purchase_date,
          location: '', // Not provided by API
          description: '', // Not provided by API
          createdAt: apiAsset.created_at,
          updatedAt: apiAsset.created_at,
          subcategoryId: apiAsset.subcategoryId || undefined,
        };
      });
    },
    [getUserName]
  );

  // Fetch all assets for statistics (without pagination)
  const fetchAllAssetsForStats = React.useCallback(async () => {
    try {
      // Fetch all assets by looping through all pages
      let allApiAssets: ApiAssetWithUser[] = [];
      let currentPage = 1;
      let hasMorePages = true;
      const limit = 1000; // Use a high limit per page

      while (hasMorePages) {
        const response = await assetApi.getAllAssets({
          page: currentPage,
          limit,
        });
        const apiAssets = response.assets || [];
        const paginationInfo = response.pagination;

        if (apiAssets && apiAssets.length > 0) {
          allApiAssets = [...allApiAssets, ...apiAssets];
        }

        // Check if there are more pages
        if (paginationInfo && currentPage < paginationInfo.totalPages) {
          currentPage++;
        } else {
          hasMorePages = false;
        }

        // Safety check to prevent infinite loops
        if (currentPage > 100) {
          hasMorePages = false;
        }
      }

      if (allApiAssets.length > 0) {
        const transformedAssets = transformApiAssets(allApiAssets);
        setAllAssetsForStats(transformedAssets);
      } else {
        setAllAssetsForStats([]);
      }
    } catch (error) {
      console.error('Failed to fetch all assets for statistics:', error);
      // Don't show snackbar for this as it's a background operation
    }
  }, [transformApiAssets]);

  // Fetch assets from API
  const fetchAssets = React.useCallback(
    async (
      page: number = 1,
      limit: number = 25,
      isInitialLoad: boolean = false
    ) => {
      try {
        // Only show initial loading on very first load, not on pagination or when returning to page 1
        if (isInitialLoad && page === 1) {
          setInitialLoading(true);
        }

        const response = await assetApi.getAllAssets({ page, limit });

        const apiAssets = response.assets; // Extract assets from paginated response

        // Update pagination state immediately - this gives us total count right away
        setPagination(response.pagination);

        // Check if we have assets
        if (!apiAssets || apiAssets.length === 0) {
          setAssets([]);
          return;
        }

        // Transform API assets to match component interface
        const transformedAssets = transformApiAssets(apiAssets);

        setAssets(transformedAssets);
      } catch (error) {
        console.error('Failed to fetch assets:', error);
        showSnackbar('Failed to load assets', 'error');
      } finally {
        // Only set initial loading to false on very first load
        if (isInitialLoad && page === 1) {
          setInitialLoading(false);
        }
      }
    },
    [transformApiAssets]
  );

  // Initial load: fetch stats FIRST, then paginated assets
  useEffect(() => {
    // Only run initial load once
    if (initialLoadRef.current) {
      return;
    }

    initialLoadRef.current = true;

    // Test API connection first
    const testConnection = async () => {
      try {
        await assetApi.testApiConnection();
      } catch (error) {
        console.error('API connection test failed:', error);
        showSnackbar('Failed to connect to API', 'error');
      }
    };

    testConnection();

    // Initialize data: fetch stats FIRST, then paginated assets
    // This ensures correct counts (26) are shown immediately when page loads, not 25 initially
    const initializeData = async () => {
      // Fetch all assets for statistics FIRST to get accurate counts immediately
      await fetchAllAssetsForStats();
      // Then fetch paginated assets for the table (isInitialLoad = true)
      await fetchAssets(pagination.page, pagination.limit, true);
    };

    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on initial mount

  // Handle page changes: only fetch paginated assets, not stats
  // Note: handlePageChange already calls fetchAssets, so this useEffect is not needed
  // Keeping it commented out to avoid double fetching
  // useEffect(() => {
  //   if (pagination.page > 0) {
  //     fetchAssets(pagination.page, pagination.limit);
  //   }
  // }, [pagination.page, pagination.limit, fetchAssets]);

  // Filter and search logic
  useMemo(() => {
    let filtered = assets;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        asset =>
          asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          asset.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (asset.assignedToName &&
            asset.assignedToName
              .toLowerCase()
              .includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(asset => asset.status === filters.status);
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(
        asset => asset.category.name === filters.category
      );
    }

    setFilteredAssets(filtered);
  }, [assets, searchTerm, filters]);

  const handleAddAsset = () => {
    setEditingAsset(null);
    setIsModalOpen(true);
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setIsModalOpen(true);
    setAnchorEl(null);
  };

  const handleDeleteAsset = (asset: Asset) => {
    setAssetToDelete(asset);
    setDeleteDialogOpen(true);
    setAnchorEl(null);
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    assetId: string
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedAssetId(assetId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAssetId(null);
  };

  const handleAssetSubmit = async (data: {
    name: string;
    category: string;
    subcategoryId?: string;
    purchaseDate: string;
    assignedTo?: string;
  }) => {
    setLoading(true);
    try {
      if (editingAsset) {
        // Update existing asset
        const updateData = {
          name: data.name,
          category: data.category,
          subcategoryId: data.subcategoryId,
          purchaseDate: data.purchaseDate,
        };

        await assetApi.updateAsset(editingAsset.id, updateData);

        // User name will be fetched in the refresh

        // Assets will be refreshed from API
        showSnackbar('Asset updated successfully', 'success');
        // Refresh the current page (not initial load)
        fetchAssets(pagination.page, pagination.limit, false);
        // Refresh all assets for statistics
        fetchAllAssetsForStats();
      } else {
        // Create new asset
        const createData = {
          name: data.name,
          category: data.category,
          subcategoryId: data.subcategoryId,
          purchaseDate: data.purchaseDate,
        };

        await assetApi.createAsset(createData);

        // User name will be fetched in the refresh

        // Assets will be refreshed from API
        showSnackbar('Asset created successfully', 'success');
        // Refresh the current page (not initial load)
        fetchAssets(pagination.page, pagination.limit, false);
        // Refresh all assets for statistics
        fetchAllAssetsForStats();
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save asset:', error);
      showSnackbar('Failed to save asset', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!assetToDelete) return;

    setLoading(true);
    try {
      await assetApi.deleteAsset(assetToDelete.id);

      showSnackbar('Asset deleted successfully', 'success');
      setDeleteDialogOpen(false);
      setAssetToDelete(null);
      // Refresh the current page
      fetchAssets(pagination.page, pagination.limit);
      // Refresh all assets for statistics
      fetchAllAssetsForStats();
    } catch (error) {
      console.error('Failed to delete asset:', error);
      showSnackbar('Failed to delete asset', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsMaintenance = async (asset: Asset) => {
    setLoading(true);
    try {
      await assetApi.updateAssetStatus(asset.id, 'under_maintenance', {
        name: asset.name,
        category: asset.category.name,
        purchaseDate: asset.purchaseDate,
      });

      showSnackbar('Asset marked as under maintenance', 'success');
      setAnchorEl(null);
      // Refresh the current page
      fetchAssets(pagination.page, pagination.limit);
      // Refresh all assets for statistics
      fetchAllAssetsForStats();
    } catch (error) {
      console.error('Failed to update asset status:', error);
      showSnackbar('Failed to update asset status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsAvailable = async (asset: Asset) => {
    setLoading(true);
    try {
      await assetApi.updateAssetStatus(asset.id, 'available', {
        name: asset.name,
        category: asset.category.name,
        purchaseDate: asset.purchaseDate,
      });

      showSnackbar('Asset marked as available', 'success');
      setAnchorEl(null);
      // Refresh the current page
      fetchAssets(pagination.page, pagination.limit);
      // Refresh all assets for statistics
      fetchAllAssetsForStats();
    } catch (error) {
      console.error('Failed to update asset status:', error);
      showSnackbar('Failed to update asset status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusCounts = () => {
    // Always use pagination.total for total count (available immediately from first API call)
    // For status counts, ONLY use allAssetsForStats once it's loaded
    // Don't show incorrect counts from current page assets
    // This ensures we show correct counts immediately when page loads
    if (allAssetsForStats.length > 0) {
      // Use allAssetsForStats for accurate counts across all pages
      return {
        total: pagination.total || allAssetsForStats.length,
        available: allAssetsForStats.filter(a => a.status === 'available')
          .length,
        assigned: allAssetsForStats.filter(a => a.status === 'assigned').length,
        underMaintenance: allAssetsForStats.filter(
          a => a.status === 'under_maintenance'
        ).length,
        retired: allAssetsForStats.filter(a => a.status === 'retired').length,
      };
    }

    // If allAssetsForStats is not loaded yet, show total from pagination but show 0 for status counts
    // This prevents showing incorrect counts (like 25 when it should be 26)
    return {
      total: pagination.total || 0,
      available: 0,
      assigned: 0,
      underMaintenance: 0,
      retired: 0,
    };
  };

  const statusCounts = getStatusCounts();

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    page: number
  ) => {
    // Page change is not initial load, so pass false
    fetchAssets(page, pagination.limit, false);
  };

  if (initialLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <Stack alignItems='center' py={4}>
          <CircularProgress />
        </Stack>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography variant='h4' fontWeight={600}>
          Asset Inventory
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant='contained'
            startIcon={<AddIcon />}
            onClick={handleAddAsset}
          >
            Add Asset
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
        <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
          <Card>
            <CardContent>
              <Typography color='textSecondary' gutterBottom>
                Total Assets
              </Typography>
              <Typography variant='h4' fontWeight={600}>
                {statusCounts.total}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
          <Card>
            <CardContent>
              <Typography color='textSecondary' gutterBottom>
                Available
              </Typography>
              <Typography variant='h4' fontWeight={600} color='success.main'>
                {statusCounts.available}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
          <Card>
            <CardContent>
              <Typography color='textSecondary' gutterBottom>
                Assigned
              </Typography>
              <Typography variant='h4' fontWeight={600} color='info.main'>
                {statusCounts.assigned}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
          <Card>
            <CardContent>
              <Typography color='textSecondary' gutterBottom>
                Maintenance
              </Typography>
              <Typography variant='h4' fontWeight={600} color='warning.main'>
                {statusCounts.underMaintenance}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
          <Card>
            <CardContent>
              <Typography color='textSecondary' gutterBottom>
                Retired
              </Typography>
              <Typography variant='h4' fontWeight={600} color='text.secondary'>
                {statusCounts.retired}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 2 }}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              alignItems: 'center',
            }}
          >
            <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
              <TextField
                fullWidth
                size='small'
                placeholder='Search assets...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ borderRadius: 2 }}
              />
            </Box>
            <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
              <FormControl fullWidth size='small'>
                <InputLabel>Status</InputLabel>
                <Select
                  open={statusDropdownOpen}
                  onOpen={() => setStatusDropdownOpen(true)}
                  onClose={() => setStatusDropdownOpen(false)}
                  value={filters.status || ''}
                  onChange={e => {
                    const value = e.target.value as string;
                    setFilters((prev: AssetFilters) => ({
                      ...prev,
                      status: value === '' ? undefined : (value as AssetStatus),
                    }));
                    setStatusDropdownOpen(false);
                  }}
                  label='Status'
                >
                  <MenuItem value=''>All</MenuItem>
                  <MenuItem value='available'>Available</MenuItem>
                  <MenuItem value='assigned'>Assigned</MenuItem>
                  <MenuItem value='under_maintenance'>
                    Under Maintenance
                  </MenuItem>
                  <MenuItem value='retired'>Retired</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
              <FormControl fullWidth size='small'>
                <InputLabel>Category</InputLabel>
                <Select
                  open={categoryDropdownOpen}
                  onOpen={() => setCategoryDropdownOpen(true)}
                  onClose={() => setCategoryDropdownOpen(false)}
                  value={filters.category || ''}
                  onChange={e => {
                    const value = e.target.value as string;
                    setFilters((prev: AssetFilters) => ({
                      ...prev,
                      category: value === '' ? undefined : value,
                    }));
                    setCategoryDropdownOpen(false);
                  }}
                  label='Category'
                >
                  <MenuItem value=''>All</MenuItem>
                  {assetCategories.map(category => (
                    <MenuItem key={category.id} value={category.name}>
                      <Typography variant='body2'>{category.name}</Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '0 0 auto' }}>
              <Button
                variant='outlined'
                // size="small"
                startIcon={<FilterIcon />}
                onClick={() => setFilters({})}
                sx={{ p: 0.9 }}
              >
                Clear Filters
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Assets Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Asset Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell>Purchase Date</TableCell>
                <TableCell align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align='center'>
                    <Typography variant='body2' color='text.secondary'>
                      No assets found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssets.map(asset => (
                  <TableRow key={asset.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant='body2' fontWeight={500}>
                          {asset.name}
                        </Typography>
                        {asset.description && (
                          <Typography variant='caption' color='text.secondary'>
                            {asset.description}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>
                        {asset.category.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={asset.status} type='asset' />
                    </TableCell>
                    <TableCell>
                      {asset.assignedToName ? (
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <PersonIcon fontSize='small' />
                          <Typography variant='body2'>
                            {asset.assignedToName}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant='body2' color='text.secondary'>
                          Unassigned
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(asset.purchaseDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell align='right'>
                      <IconButton
                        onClick={e => handleMenuClick(e, asset.id)}
                        size='small'
                      >
                        <MoreVertIcon />
                      </IconButton>
                      <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl) && selectedAssetId === asset.id}
                        onClose={handleMenuClose}
                      >
                        <MenuItem onClick={() => handleEditAsset(asset)}>
                          <ListItemIcon>
                            <EditIcon fontSize='small' />
                          </ListItemIcon>
                          <ListItemText>Edit</ListItemText>
                        </MenuItem>
                        {asset.status !== 'under_maintenance' && (
                          <MenuItem
                            onClick={() => handleMarkAsMaintenance(asset)}
                            sx={{ color: 'warning.main' }}
                          >
                            <ListItemIcon>
                              <BuildIcon fontSize='small' color='warning' />
                            </ListItemIcon>
                            <ListItemText>Mark as Maintenance</ListItemText>
                          </MenuItem>
                        )}
                        {asset.status === 'under_maintenance' && (
                          <MenuItem
                            onClick={() => handleMarkAsAvailable(asset)}
                            sx={{ color: 'success.main' }}
                          >
                            <ListItemIcon>
                              <AvailableIcon fontSize='small' color='success' />
                            </ListItemIcon>
                            <ListItemText>Mark as Available</ListItemText>
                          </MenuItem>
                        )}
                        <MenuItem
                          onClick={() => handleDeleteAsset(asset)}
                          sx={{ color: 'error.main' }}
                        >
                          <ListItemIcon>
                            <DeleteIcon fontSize='small' color='error' />
                          </ListItemIcon>
                          <ListItemText>Delete</ListItemText>
                        </MenuItem>
                      </Menu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={handlePageChange}
            color='primary'
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Asset Modal */}
      <AssetModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAssetSubmit}
        asset={editingAsset}
        users={mockUsers}
        loading={loading}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        title='Delete Asset'
        message={`Are you sure you want to delete "${assetToDelete?.name}"? This action cannot be undone.`}
        confirmText='Delete'
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        severity='error'
        loading={loading}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AssetInventory;
