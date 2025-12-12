import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
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
import { DeleteConfirmationDialog } from '../common/DeleteConfirmationDialog';
import { assetCategories } from '../../Data/assetCategories';
import { isHRAdmin } from '../../utils/roleUtils';
import { formatDate } from '../../utils/dateUtils';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import AppCard from '../common/AppCard';
import AppTable from '../common/AppTable';
import AppSelect from '../common/AppSelect';
import AppButton from '../common/AppButton';
import AppTextField from '../common/AppTextField';
import ErrorSnackbar from '../common/ErrorSnackbar';
import { PAGINATION } from '../../constants/appConstants';

// Extended interface for API asset response that may include additional user information
interface ApiAssetWithUser extends ApiAsset {
  assignedToName?: string;
  assignedByUser?: {
    name: string;
  };
}

type InventoryAsset = Asset & {
  categoryName?: string;
  category_id?: string;
  purchase_date?: string;
  subcategoryName?: string;
};

const resolveCategoryName = (asset: InventoryAsset): string =>
  asset.category?.name ?? asset.categoryName ?? '';

const resolveCategoryId = (asset: InventoryAsset): string =>
  asset.category?.id ?? asset.category_id ?? '';

const resolvePurchaseDate = (asset: InventoryAsset): string =>
  asset.purchaseDate || asset.purchase_date || '';

const resolveSubcategoryName = (asset: InventoryAsset): string | undefined =>
  asset.subcategoryName;

const AssetInventory: React.FC = () => {
  const [assets, setAssets] = useState<InventoryAsset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<InventoryAsset[]>([]);
  const [statusCounts, setStatusCounts] = useState<{
    total: number;
    available: number;
    assigned: number;
    retired: number;
    under_maintenance: number;
    pending: number;
  }>({
    total: 0,
    available: 0,
    assigned: 0,
    retired: 0,
    under_maintenance: 0,
    pending: 0,
  }); // Store counts from API response
  const initialLoadRef = React.useRef(false); // Track if initial load has been done
  const fetchingRef = React.useRef(false); // Track if fetch is in progress to prevent duplicate calls
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<AssetFilters>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<InventoryAsset | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<InventoryAsset | null>(
    null
  );
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { snackbar, showError, showSuccess, closeSnackbar } = useErrorHandler();
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = storedUser.role;

  const hideActions = isHRAdmin(userRole);

  const showSnackbar = (
    message: string,
    severity: 'success' | 'error' | 'warning' | 'info' = 'success'
  ) => {
    if (severity === 'success') {
      showSuccess(message);
    } else {
      // Use centralized error handler for non-success notifications
      showError(message);
    }
  };
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({
    total: 0,
    page: 1,
    limit: PAGINATION.DEFAULT_PAGE_SIZE, // Backend returns records per page
    totalPages: 1,
  });
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
    (apiAssets: ApiAssetWithUser[]): InventoryAsset[] => {
      return apiAssets.map((apiAsset: ApiAssetWithUser) => {
        // Handle new API response structure where category is an object
        const categoryObj =
          typeof apiAsset.category === 'object'
            ? apiAsset.category
            : {
                id: apiAsset.category_id || '',
                name: apiAsset.categoryName || apiAsset.category || '',
              };

        // Handle subcategory - can be object or string
        const subcategoryObj = apiAsset.subcategory
          ? typeof apiAsset.subcategory === 'object'
            ? apiAsset.subcategory
            : {
                id: apiAsset.subcategory_id || '',
                name: apiAsset.subcategoryName || apiAsset.subcategory || '',
              }
          : undefined;

        return {
          id: apiAsset.id,
          name: apiAsset.name,
          category: {
            id: categoryObj.id || apiAsset.category_id || '',
            name: categoryObj.name || apiAsset.categoryName || '',
            nameAr: categoryObj.name || apiAsset.categoryName || '',
            description: categoryObj.description || undefined,
            color: undefined,
            subcategories: undefined,
          },
          status: apiAsset.status,
          assignedTo: apiAsset.assigned_to || undefined,
          assignedToName:
            apiAsset.assignedToName ||
            apiAsset.assignedToUser?.name ||
            (apiAsset.assigned_to ? getUserName(apiAsset) : undefined),
          serialNumber: '', // Not provided by API
          purchaseDate: apiAsset.purchase_date,
          location: '', // Not provided by API
          description: '', // Not provided by API
          createdAt: apiAsset.created_at,
          updatedAt: apiAsset.created_at,
          subcategoryId:
            subcategoryObj?.id || apiAsset.subcategory_id || undefined,
          subcategoryName:
            subcategoryObj?.name || apiAsset.subcategoryName || undefined,
          categoryName: apiAsset.categoryName,
          category_id: apiAsset.category_id,
          purchase_date: apiAsset.purchase_date,
        };
      });
    },
    [getUserName]
  );

  // Removed fetchAllAssetsForStats - using counts from API response instead

  // Fetch assets from API
  const fetchAssets = React.useCallback(
    async (
      page: number = 1,
      limit: number = PAGINATION.DEFAULT_PAGE_SIZE,
      isInitialLoad: boolean = false
    ) => {
      // Prevent duplicate calls
      if (fetchingRef.current) {
        return;
      }

      try {
        fetchingRef.current = true;

        // Only show initial loading on very first load, not on pagination or when returning to page 1
        if (isInitialLoad && page === 1) {
          setInitialLoading(true);
        }

        // Ensure page and limit are always provided
        const response = await assetApi.getAllAssets({
          page: page || 1,
          limit: limit || PAGINATION.DEFAULT_PAGE_SIZE,
        });

        const apiAssets = response.assets; // Extract assets from paginated response

        // Backend returns 25 records per page (fixed page size)
        // If we get 25 records, there might be more pages
        // If we get less than 25, it's the last page
        const hasMorePages = apiAssets.length === limit;

        // Use backend pagination info if available, otherwise estimate
        if (
          response.pagination &&
          response.pagination.total &&
          response.pagination.totalPages
        ) {
          setPagination(response.pagination);
        } else {
          // Fallback: estimate based on current page and records received
          const estimatedTotal = hasMorePages
            ? page * limit
            : (page - 1) * limit + apiAssets.length;
          const estimatedTotalPages = hasMorePages ? page + 1 : page;

          setPagination({
            total: estimatedTotal,
            page: page,
            limit: (limit || PAGINATION.DEFAULT_PAGE_SIZE) as number,
            totalPages: estimatedTotalPages,
          });
        }

        // Update counts from API response if available
        if (response.counts) {
          setStatusCounts({
            total: response.counts.total || 0,
            available: response.counts.available || 0,
            assigned: response.counts.assigned || 0,
            retired: response.counts.retired || 0,
            under_maintenance: response.counts.under_maintenance || 0,
            pending: response.counts.pending || 0,
          });
        }

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
        // Use centralized error handler when available
        try {
          showError(error);
        } catch {
          // Fallback to local snackbar
          showSnackbar('Failed to load assets', 'error');
        }
      } finally {
        fetchingRef.current = false;
        // Only set initial loading to false on very first load
        if (isInitialLoad && page === 1) {
          setInitialLoading(false);
        }
      }
    },
    [transformApiAssets, showError, showSnackbar]
  );

  // Initial load: fetch paginated assets (counts are included in API response)
  useEffect(() => {
    // Only run initial load once
    if (initialLoadRef.current) {
      return;
    }
    if (fetchingRef.current) {
      return; // Don't fetch if already fetching
    }

    initialLoadRef.current = true;

    // Fetch paginated assets (counts are included in API response)
    fetchAssets(pagination.page, pagination.limit, true);
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
  useEffect(() => {
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
        asset => resolveCategoryName(asset) === filters.category
      );
    }

    setFilteredAssets(filtered);
  }, [assets, searchTerm, filters]);

  const handleAddAsset = () => {
    setEditingAsset(null);
    setIsModalOpen(true);
  };

  const handleEditAsset = (asset: InventoryAsset) => {
    setEditingAsset(asset);
    setIsModalOpen(true);
    setAnchorEl(null);
  };

  const handleDeleteAsset = (asset: InventoryAsset) => {
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
    categoryId: string;
    subcategoryId?: string;
    purchaseDate: string;
    assignedTo?: string;
  }) => {
    setLoading(true);
    try {
      if (editingAsset) {
        // Update existing asset
        const updateData: {
          name: string;
          categoryId: string;
          subcategoryId?: string;
          purchaseDate: string;
        } = {
          name: data.name,
          categoryId: data.categoryId,
          purchaseDate: data.purchaseDate,
        };

        // Only include subcategoryId if it's provided
        if (data.subcategoryId && data.subcategoryId.trim() !== '') {
          updateData.subcategoryId = data.subcategoryId;
        }

        await assetApi.updateAsset(editingAsset.id, updateData);

        // User name will be fetched in the refresh

        // Assets will be refreshed from API
        showSuccess('Asset updated successfully');
        // Refresh the current page to update counts (not initial load)
        fetchAssets(pagination.page, pagination.limit, false);
      } else {
        // Create new asset
        const createData: {
          name: string;
          categoryId: string;
          subcategoryId?: string;
          purchaseDate: string;
        } = {
          name: data.name,
          categoryId: data.categoryId,
          purchaseDate: data.purchaseDate,
        };

        // Only include subcategoryId if it's provided
        if (data.subcategoryId && data.subcategoryId.trim() !== '') {
          createData.subcategoryId = data.subcategoryId;
        }

        await assetApi.createAsset(createData);

        // User name will be fetched in the refresh

        // Assets will be refreshed from API
        showSuccess('Asset created successfully');
        // Refresh the current page to update counts (not initial load)
        fetchAssets(pagination.page, pagination.limit, false);
      }

      setIsModalOpen(false);
    } catch (error: unknown) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!assetToDelete) return;

    setLoading(true);
    try {
      await assetApi.deleteAsset(assetToDelete.id);

      showSuccess('Asset deleted successfully');
      setDeleteDialogOpen(false);
      setAssetToDelete(null);
      // Refresh the current page to update counts
      fetchAssets(pagination.page, pagination.limit, false);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsMaintenance = async (asset: InventoryAsset) => {
    setLoading(true);
    try {
      await assetApi.updateAssetStatus(asset.id, 'under_maintenance', {
        name: asset.name,
        categoryId: resolveCategoryId(asset) || asset.category?.name || '',
        purchaseDate: resolvePurchaseDate(asset),
      });

      showSuccess('Asset marked as under maintenance');
      setAnchorEl(null);
      // Refresh the current page to update counts
      fetchAssets(pagination.page, pagination.limit, false);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsAvailable = async (asset: InventoryAsset) => {
    setLoading(true);
    try {
      await assetApi.updateAssetStatus(asset.id, 'available', {
        name: asset.name,
        categoryId: resolveCategoryId(asset) || asset.category?.name || '',
        purchaseDate: resolvePurchaseDate(asset),
      });

      showSuccess('Asset marked as available');
      setAnchorEl(null);
      // Refresh the current page to update counts
      fetchAssets(pagination.page, pagination.limit, false);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  // Use counts from API response
  const displayCounts = useMemo(() => {
    // Use counts from API response if available
    if (
      statusCounts.total > 0 ||
      statusCounts.available > 0 ||
      statusCounts.assigned > 0 ||
      statusCounts.retired > 0 ||
      statusCounts.under_maintenance > 0
    ) {
      return {
        total: statusCounts.total,
        available: statusCounts.available,
        assigned: statusCounts.assigned,
        retired: statusCounts.retired,
        underMaintenance: statusCounts.under_maintenance,
      };
    }

    // Fallback: Use total from pagination, show 0 for status counts until API provides them
    return {
      total: pagination.total || 0,
      available: 0,
      assigned: 0,
      underMaintenance: 0,
      retired: 0,
    };
  }, [statusCounts, pagination.total]);

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
          <AppButton
            variant='contained'
            variantType='primary'
            startIcon={<AddIcon />}
            onClick={handleAddAsset}
          >
            Add Asset
          </AppButton>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
        <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
          <AppCard compact>
            <Typography color='textSecondary' gutterBottom>
              Total Assets
            </Typography>
            <Typography variant='h4' fontWeight={600}>
              {displayCounts.total}
            </Typography>
          </AppCard>
        </Box>
        <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
          <AppCard compact>
            <Typography color='textSecondary' gutterBottom>
              Available
            </Typography>
            <Typography variant='h4' fontWeight={600} color='success.main'>
              {displayCounts.available}
            </Typography>
          </AppCard>
        </Box>
        <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
          <AppCard compact>
            <Typography color='textSecondary' gutterBottom>
              Assigned
            </Typography>
            <Typography variant='h4' fontWeight={600} color='info.main'>
              {displayCounts.assigned}
            </Typography>
          </AppCard>
        </Box>
        <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
          <AppCard compact>
            <Typography color='textSecondary' gutterBottom>
              Maintenance
            </Typography>
            <Typography variant='h4' fontWeight={600} color='warning.main'>
              {displayCounts.underMaintenance}
            </Typography>
          </AppCard>
        </Box>
        <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
          <AppCard compact>
            <Typography color='textSecondary' gutterBottom>
              Retired
            </Typography>
            <Typography variant='h4' fontWeight={600} color='text.secondary'>
              {displayCounts.retired}
            </Typography>
          </AppCard>
        </Box>
      </Box>

      {/* Filters and Search */}
      <AppCard sx={{ mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            alignItems: 'center',
            py: 2,
          }}
        >
          <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
            <AppTextField
              inputProps={{ placeholder: 'Search assets...' }}
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchTerm(e.target.value)
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{
                borderRadius: 2,
                width: '100%',
                '& .MuiInputBase-root': { height: '40px' },
              }}
            />
          </Box>
          <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
            <AppSelect
              label='Status'
              size='small'
              fullWidth
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
            >
              <MenuItem value=''>All</MenuItem>
              <MenuItem value='available'>Available</MenuItem>
              <MenuItem value='assigned'>Assigned</MenuItem>
              <MenuItem value='under_maintenance'>Under Maintenance</MenuItem>
              <MenuItem value='retired'>Retired</MenuItem>
            </AppSelect>
          </Box>
          <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
            <AppSelect
              label='Category'
              size='small'
              fullWidth
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
            >
              <MenuItem value=''>All</MenuItem>
              {assetCategories.map(category => (
                <MenuItem key={category.id} value={category.name}>
                  <Typography variant='body2'>{category.name}</Typography>
                </MenuItem>
              ))}
            </AppSelect>
          </Box>
          <Box sx={{ flex: '0 0 auto' }}>
            <AppButton
              variant='outlined'
              variantType='secondary'
              startIcon={<FilterIcon />}
              onClick={() => setFilters({})}
              sx={{ p: 0.9 }}
            >
              Clear Filters
            </AppButton>
          </Box>
        </Box>
      </AppCard>

      {/* Assets Table */}
      <AppCard sx={{ padding: 0 }}>
        <AppTable>
          <TableHead>
            <TableRow>
              <TableCell>Asset Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Purchase Date</TableCell>
              {!hideActions && <TableCell align='right'>Actions</TableCell>}
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
                    <Box>
                      <Typography variant='body2' fontWeight={500}>
                        {resolveCategoryName(asset) || 'N/A'}
                      </Typography>
                      {resolveSubcategoryName(asset) && (
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          sx={{ display: 'block', mt: 0.5 }}
                        >
                          {resolveSubcategoryName(asset)}
                        </Typography>
                      )}
                    </Box>
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

                  <TableCell>{formatDate(asset.purchaseDate)}</TableCell>

                  {!hideActions && (
                    <TableCell align='right'>
                      <IconButton
                        onClick={e => handleMenuClick(e, asset.id)}
                        size='small'
                        aria-label={`Actions menu for asset ${asset.name}`}
                        aria-haspopup='true'
                        aria-expanded={
                          Boolean(anchorEl) && selectedAssetId === asset.id
                        }
                      >
                        <MoreVertIcon aria-hidden='true' />
                      </IconButton>

                      <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl) && selectedAssetId === asset.id}
                        onClose={handleMenuClose}
                        role='menu'
                        aria-label='Asset actions menu'
                      >
                        <MenuItem
                          onClick={() => handleEditAsset(asset)}
                          role='menuitem'
                          aria-label={`Edit asset ${asset.name}`}
                        >
                          <ListItemIcon>
                            <EditIcon fontSize='small' aria-hidden='true' />
                          </ListItemIcon>
                          <ListItemText>Edit</ListItemText>
                        </MenuItem>

                        {asset.status !== 'under_maintenance' && (
                          <MenuItem
                            onClick={() => handleMarkAsMaintenance(asset)}
                            sx={{ color: 'warning.main' }}
                            role='menuitem'
                            aria-label={`Mark asset ${asset.name} as under maintenance`}
                          >
                            <ListItemIcon>
                              <BuildIcon
                                fontSize='small'
                                color='warning'
                                aria-hidden='true'
                              />
                            </ListItemIcon>
                            <ListItemText>Mark as Maintenance</ListItemText>
                          </MenuItem>
                        )}

                        {asset.status === 'under_maintenance' && (
                          <MenuItem
                            onClick={() => handleMarkAsAvailable(asset)}
                            sx={{ color: 'success.main' }}
                            role='menuitem'
                            aria-label={`Mark asset ${asset.name} as available`}
                          >
                            <ListItemIcon>
                              <AvailableIcon
                                fontSize='small'
                                color='success'
                                aria-hidden='true'
                              />
                            </ListItemIcon>
                            <ListItemText>Mark as Available</ListItemText>
                          </MenuItem>
                        )}

                        <MenuItem
                          onClick={() => handleDeleteAsset(asset)}
                          sx={{ color: 'error.main' }}
                          role='menuitem'
                          aria-label={`Delete asset ${asset.name}`}
                        >
                          <ListItemIcon>
                            <DeleteIcon
                              fontSize='small'
                              color='error'
                              aria-hidden='true'
                            />
                          </ListItemIcon>
                          <ListItemText>Delete</ListItemText>
                        </MenuItem>
                      </Menu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </AppTable>
      </AppCard>

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

      {/* Pagination Info */}
      {assets.length > 0 && (
        <Box display='flex' justifyContent='center' mt={1}>
          <Typography variant='body2' color='textSecondary'>
            Showing page {pagination.page} of {pagination.totalPages} (
            {pagination.total} total records)
          </Typography>
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
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        title='Delete Asset'
        message={`Are you sure you want to delete "${assetToDelete?.name}"? This action cannot be undone.`}
        confirmText='Delete'
        cancelText='Cancel'
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteDialogOpen(false)}
        itemName={assetToDelete?.name}
        loading={loading}
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

export default AssetInventory;
