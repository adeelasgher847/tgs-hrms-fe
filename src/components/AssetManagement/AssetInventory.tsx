import React, { useState, useMemo } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import type { Asset, AssetFilters, AssetCategory, MockUser, AssetStatus } from '../../types/asset';
import { mockAssets, mockAssetCategories, mockUsers } from '../../data/assetMockData';
import AssetModal from './AssetModal';
import StatusChip from './StatusChip';
import ConfirmationDialog from './ConfirmationDialog';
import { showSuccessToast, showErrorToast } from './NotificationToast';

const AssetInventory: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>(mockAssets);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>(mockAssets);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<AssetFilters>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assetToAssign, setAssetToAssign] = useState<Asset | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      filtered = filtered.filter(asset => filters.category!.includes(asset.category.id));
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

  const handleAssignAsset = (asset: Asset) => {
    setAssetToAssign(asset);
    setAssignDialogOpen(true);
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (editingAsset) {
        // Update existing asset
        const updatedAsset = {
          ...editingAsset,
          ...data,
          category: mockAssetCategories.find(c => c.id === data.categoryId) || editingAsset.category,
          assignedToName: data.assignedTo ? mockUsers.find(u => u.id === data.assignedTo)?.name : undefined,
          updatedAt: new Date().toISOString(),
        };

        setAssets(prev => prev.map(asset => 
          asset.id === editingAsset.id ? updatedAsset : asset
        ));
        showSuccessToast('Asset updated successfully');
      } else {
        // Create new asset
        const newAsset: Asset = {
          id: Date.now().toString(),
          ...data,
          category: mockAssetCategories.find(c => c.id === data.categoryId)!,
          status: data.assignedTo ? 'assigned' : 'available',
          assignedToName: data.assignedTo ? mockUsers.find(u => u.id === data.assignedTo)?.name : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setAssets(prev => [newAsset, ...prev]);
        showSuccessToast('Asset created successfully');
      }

      setIsModalOpen(false);
    } catch (error) {
      showErrorToast('Failed to save asset');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!assetToDelete) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setAssets(prev => prev.filter(asset => asset.id !== assetToDelete.id));
      showSuccessToast('Asset deleted successfully');
      setDeleteDialogOpen(false);
      setAssetToDelete(null);
    } catch (error) {
      showErrorToast('Failed to delete asset');
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
                  {mockAssetCategories.map(category => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
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
                <TableCell>Serial Number</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Purchase Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAssets.map((asset) => (
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
                  <TableCell>{asset.category.name}</TableCell>
                  <TableCell>{asset.serialNumber}</TableCell>
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
                  <TableCell>{asset.location}</TableCell>
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
                      {asset.status === 'available' && (
                        <MenuItem onClick={() => handleAssignAsset(asset)}>
                          <ListItemIcon>
                            <AssignmentIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText>Assign</ListItemText>
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
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Asset Modal */}
      <AssetModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAssetSubmit}
        asset={editingAsset}
        categories={mockAssetCategories}
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

      {/* Assign Asset Dialog - This would be a separate component in a real app */}
      <ConfirmationDialog
        open={assignDialogOpen}
        title="Assign Asset"
        message={`Assign "${assetToAssign?.name}" to a user?`}
        confirmText="Assign"
        onConfirm={() => {
          // Handle assignment logic here
          setAssignDialogOpen(false);
          setAssetToAssign(null);
        }}
        onCancel={() => setAssignDialogOpen(false)}
        severity="info"
      />
    </Box>
  );
};

export default AssetInventory;
