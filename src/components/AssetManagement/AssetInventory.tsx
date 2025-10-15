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
  Paper,
  IconButton,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Tooltip,
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
import type { Asset, AssetFilters, AssetCategory, MockUser, AssetStatus } from '../../types/asset';
import { assetApi, type Asset as ApiAsset } from '../../api/assetApi';
import employeeApi from '../../api/employeeApi';
import AssetModal from './AssetModal';
import StatusChip from './StatusChip';
import ConfirmationDialog from './ConfirmationDialog';
import { showSuccessToast, showErrorToast } from './NotificationToast';
import { assetCategories, getCategoryById } from '../../data/assetCategories';

const AssetInventory: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
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
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 25,
    totalPages: 1
  });

  // Mock data for users (these might need to be fetched from API later)
  const mockUsers: MockUser[] = [
    { id: '1', name: 'John Doe', email: 'john.doe@company.com', department: 'IT' },
    { id: '2', name: 'Jane Smith', email: 'jane.smith@company.com', department: 'HR' },
    { id: '3', name: 'Mike Johnson', email: 'mike.johnson@company.com', department: 'Finance' },
  ];

  // Helper function to fetch user name by user ID
  const fetchUserName = async (userId: string): Promise<string> => {
    try {
      const profile = await employeeApi.getEmployeeProfile(userId);
      return profile.name || `User ${userId}`;
    } catch (error) {
      console.error(`Failed to fetch user name for ${userId}:`, error);
      return `User ${userId}`;
    }
  };

  // Fetch assets from API
  const fetchAssets = async (page: number = 1, limit: number = 25) => {
    try {
      setInitialLoading(true);
      console.log('Fetching assets with page:', page, 'limit:', limit);
      
      const response = await assetApi.getAllAssets({ page, limit });
      console.log('AssetInventory - API Response:', response);
      
      const apiAssets = response.assets; // Extract assets from paginated response
      console.log('AssetInventory - Extracted Assets:', apiAssets);
      console.log('AssetInventory - Extracted Assets Length:', apiAssets?.length);
      
      // Update pagination state
      setPagination(response.pagination);
      
      // Check if we have assets
      if (!apiAssets || apiAssets.length === 0) {
        console.log('No assets found in response');
        setAssets([]);
        return;
      }
        
        // Fetch user names for all unique user IDs in assigned_to
        const uniqueUserIds = new Set<string>();
        apiAssets.forEach((asset: ApiAsset) => {
          if (asset.assigned_to) uniqueUserIds.add(asset.assigned_to);
        });

        // Create a map of userId to userName
        const userNameMap = new Map<string, string>();
        await Promise.all(
          Array.from(uniqueUserIds).map(async (userId) => {
            const name = await fetchUserName(userId);
            userNameMap.set(userId, name);
          })
        );
        
        // Transform API assets to match component interface
        const transformedAssets: Asset[] = apiAssets.map((apiAsset: ApiAsset) => {
          // Try to find matching category from our comprehensive list
          const matchingCategory = assetCategories.find(cat => 
            cat.name.toLowerCase() === apiAsset.category.toLowerCase() ||
            cat.subcategories?.some(sub => sub.toLowerCase() === apiAsset.category.toLowerCase())
          );
          
          return {
            id: apiAsset.id,
            name: apiAsset.name,
            category: matchingCategory ? {
              id: matchingCategory.id,
              name: matchingCategory.name,
              nameAr: matchingCategory.nameAr,
              description: matchingCategory.description,
              color: matchingCategory.color,
              subcategories: matchingCategory.subcategories
            } : { 
              id: apiAsset.category, 
              name: apiAsset.category, 
              nameAr: apiAsset.category, 
              description: '',
              color: '#757575'
            },
            status: apiAsset.status,
            assignedTo: apiAsset.assigned_to,
            assignedToName: apiAsset.assigned_to ? userNameMap.get(apiAsset.assigned_to) : undefined,
            serialNumber: '', // Not provided by API
            purchaseDate: apiAsset.purchase_date,
            location: '', // Not provided by API
            description: '', // Not provided by API
            createdAt: apiAsset.created_at,
            updatedAt: apiAsset.created_at,
          };
        });
        
        console.log('AssetInventory - Transformed Assets:', transformedAssets);
        setAssets(transformedAssets);
        
        // Extract unique categories from assets
        const uniqueCategories = [...new Set(transformedAssets.map(asset => asset.category.name))];
        setAvailableCategories(uniqueCategories);
        
      } catch (error) {
        console.error('Failed to fetch assets:', error);
        showErrorToast('Failed to load assets');
      } finally {
        setInitialLoading(false);
      }
    };

  useEffect(() => {
    // Test API connection first
    const testConnection = async () => {
      try {
        await assetApi.testApiConnection();
      } catch (error) {
        console.error('API connection test failed:', error);
        showErrorToast('Failed to connect to API');
      }
    };
    
    testConnection();
    fetchAssets(pagination.page, pagination.limit);
  }, []);

  // Filter and search logic
  useMemo(() => {
    let filtered = assets;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(asset =>
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.assignedToName && asset.assignedToName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(asset => filters.status!.includes(asset.status));
    }

    // Category filter
    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter(asset => filters.category!.includes(asset.category.name));
    }

    console.log('AssetInventory - Filtered Assets:', filtered);
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

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, assetId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedAssetId(assetId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAssetId(null);
  };

  const handleAssetSubmit = async (data: any) => {
    setLoading(true);
    try {
      if (editingAsset) {
        // Update existing asset
        const updateData = {
          name: data.name,
          category: data.category,
          purchaseDate: data.purchaseDate,
        };

        const updatedApiAsset = await assetApi.updateAsset(editingAsset.id, updateData);
        
        // Fetch user name if assigned
        let assignedToName: string | undefined;
        if (updatedApiAsset.assigned_to) {
          assignedToName = await fetchUserName(updatedApiAsset.assigned_to);
        }
        
        // Assets will be refreshed from API
        showSuccessToast('Asset updated successfully');
        // Refresh the current page
        fetchAssets(pagination.page, pagination.limit);
      } else {
        // Create new asset
        const createData = {
          name: data.name,
          category: data.category,
          purchaseDate: data.purchaseDate,
        };

        const newApiAsset = await assetApi.createAsset(createData);
        
        // Fetch user name if assigned
        let assignedToName: string | undefined;
        if (newApiAsset.assigned_to) {
          assignedToName = await fetchUserName(newApiAsset.assigned_to);
        }
        
        // Assets will be refreshed from API
        showSuccessToast('Asset created successfully');
        // Refresh the current page
        fetchAssets(pagination.page, pagination.limit);
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save asset:', error);
      showErrorToast('Failed to save asset');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!assetToDelete) return;

    setLoading(true);
    try {
      await assetApi.deleteAsset(assetToDelete.id);
      
      showSuccessToast('Asset deleted successfully');
      setDeleteDialogOpen(false);
      setAssetToDelete(null);
      // Refresh the current page
      fetchAssets(pagination.page, pagination.limit);
    } catch (error) {
      console.error('Failed to delete asset:', error);
      showErrorToast('Failed to delete asset');
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
      
      showSuccessToast('Asset marked as under maintenance');
      setAnchorEl(null);
      // Refresh the current page
      fetchAssets(pagination.page, pagination.limit);
    } catch (error) {
      console.error('Failed to update asset status:', error);
      showErrorToast('Failed to update asset status');
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
      
      showSuccessToast('Asset marked as available');
      setAnchorEl(null);
      // Refresh the current page
      fetchAssets(pagination.page, pagination.limit);
    } catch (error) {
      console.error('Failed to update asset status:', error);
      showErrorToast('Failed to update asset status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusCounts = () => {
    return {
      total: assets.length,
      available: assets.filter(a => a.status === 'available').length,
      assigned: assets.filter(a => a.status === 'assigned').length,
      underMaintenance: assets.filter(a => a.status === 'under_maintenance').length,
      retired: assets.filter(a => a.status === 'retired').length,
    };
  };

  const statusCounts = getStatusCounts();

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    fetchAssets(page, pagination.limit);
  };

  if (initialLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Stack alignItems="center" py={4}>
          <CircularProgress />
        </Stack>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 ,flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h4" fontWeight={600}>
          Asset Inventory
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddAsset}
        >
          Add Asset
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
        <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Assets
              </Typography>
              <Typography variant="h4" fontWeight={600}>
                {statusCounts.total}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Available
              </Typography>
              <Typography variant="h4" fontWeight={600} color="success.main">
                {statusCounts.available}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Assigned
              </Typography>
              <Typography variant="h4" fontWeight={600} color="info.main">
                {statusCounts.assigned}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Maintenance
              </Typography>
              <Typography variant="h4" fontWeight={600} color="warning.main">
                {statusCounts.underMaintenance}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Retired
              </Typography>
              <Typography variant="h4" fontWeight={600} color="text.secondary">
                {statusCounts.retired}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Filters and Search */}
      <Card sx={{ mb: 3,}}>
        <CardContent sx={{ py: 2, }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ borderRadius: 2 }}
              />
            </Box>
            <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  multiple
                  value={filters.status || []}
                  onChange={(e) => setFilters((prev: AssetFilters) => ({ ...prev, status: e.target.value as AssetStatus[] }))}
                  label="Status"
                >
                  <MenuItem value="available">Available</MenuItem>
                  <MenuItem value="assigned">Assigned</MenuItem>
                  <MenuItem value="under_maintenance">Under Maintenance</MenuItem>
                  <MenuItem value="retired">Retired</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '1 1 150px', minWidth: '150px', }}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  multiple
                  value={filters.category || []}
                  onChange={(e) => setFilters((prev: AssetFilters) => ({ ...prev, category: e.target.value as string[] }))}
                  label="Category"
                >
                  {assetCategories.map((category) => (
                    <MenuItem key={category.id} value={category.name}>
                      <Typography variant="body2">{category.name}</Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '0 0 auto'}}>
              <Button
                variant="outlined"
                // size="small"
                startIcon={<FilterIcon />}
                onClick={() => setFilters({})}
                sx={{ p: 0.9}}
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
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No assets found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssets.map((asset) => (
                <TableRow key={asset.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {asset.name}
                      </Typography>
                      {asset.description && (
                        <Typography variant="caption" color="text.secondary">
                          {asset.description}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {asset.category.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <StatusChip status={asset.status} type="asset" />
                  </TableCell>
                  <TableCell>
                    {asset.assignedToName ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon fontSize="small" />
                        <Typography variant="body2">
                          {asset.assignedToName}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Unassigned
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(asset.purchaseDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={(e) => handleMenuClick(e, asset.id)}
                      size="small"
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
                          <EditIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Edit</ListItemText>
                      </MenuItem>
                      {asset.status !== 'under_maintenance' && (
                        <MenuItem 
                          onClick={() => handleMarkAsMaintenance(asset)}
                          sx={{ color: 'warning.main' }}
                        >
                          <ListItemIcon>
                            <BuildIcon fontSize="small" color="warning" />
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
                            <AvailableIcon fontSize="small" color="success" />
                          </ListItemIcon>
                          <ListItemText>Mark as Available</ListItemText>
                        </MenuItem>
                      )}
                      <MenuItem 
                        onClick={() => handleDeleteAsset(asset)}
                        sx={{ color: 'error.main' }}
                      >
                        <ListItemIcon>
                          <DeleteIcon fontSize="small" color="error" />
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
            color="primary"
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
        title="Delete Asset"
        message={`Are you sure you want to delete "${assetToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        severity="error"
        loading={loading}
      />
    </Box>
  );
};

export default AssetInventory;
