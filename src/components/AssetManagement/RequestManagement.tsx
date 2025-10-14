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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Tabs,
  Tab,
  InputAdornment,
  Avatar,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Stack,
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import type { AssetRequest, ProcessRequestRequest, AssetCategory, Asset } from '../../types/asset';
import { assetApi, type AssetRequest as ApiAssetRequest } from '../../api/assetApi';
import employeeApi from '../../api/employeeApi';
import StatusChip from './StatusChip';
import ConfirmationDialog from './ConfirmationDialog';
import { showSuccessToast, showErrorToast } from './NotificationToast';
import { assetCategories, getCategoryById } from '../../data/assetCategories';

const schema = yup.object({
  action: yup.string().required('Action is required'),
  rejectionReason: yup.string().notRequired(),
  assignedAssetId: yup.string().when('action', {
    is: 'approve',
    then: (schema) => schema.required('Please select an asset to assign'),
    otherwise: (schema) => schema.notRequired(),
  }),
});

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const RequestManagement: React.FC = () => {
  const [requests, setRequests] = useState<AssetRequest[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AssetRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  // Get all subcategories from comprehensive categories
  const commonCategories = assetCategories.flatMap(cat => cat.subcategories || [cat.name]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      action: '',
      rejectionReason: '',
      assignedAssetId: '',
    },
  });

  const selectedAction = watch('action');
  const selectedCategoryId = selectedRequest?.category.id;

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

  // Fetch data from API
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setInitialLoading(true);
        
        // Fetch asset requests
        const apiRequests = await assetApi.getAllAssetRequests();
        
        // Fetch user names for all unique user IDs
        const uniqueUserIds = new Set<string>();
        apiRequests.forEach((req: ApiAssetRequest) => {
          if (req.requested_by) uniqueUserIds.add(req.requested_by);
          if (req.approved_by) uniqueUserIds.add(req.approved_by);
        });

        // Create a map of userId to userName
        const userNameMap = new Map<string, string>();
        await Promise.all(
          Array.from(uniqueUserIds).map(async (userId) => {
            const name = await fetchUserName(userId);
            userNameMap.set(userId, name);
          })
        );

        const transformedRequests: AssetRequest[] = apiRequests.map((apiRequest: ApiAssetRequest) => {
          // Try to find matching category from our comprehensive list
          const matchingCategory = assetCategories.find(cat => 
            cat.name.toLowerCase() === apiRequest.asset_category.toLowerCase() ||
            cat.subcategories?.some(sub => sub.toLowerCase() === apiRequest.asset_category.toLowerCase())
          );

          return {
            id: apiRequest.id,
            employeeId: apiRequest.requested_by,
            employeeName: apiRequest.requestedByName || userNameMap.get(apiRequest.requested_by) || `User ${apiRequest.requested_by}`,
            category: matchingCategory ? {
              id: matchingCategory.id,
              name: matchingCategory.name,
              nameAr: matchingCategory.nameAr,
              description: matchingCategory.description,
              color: matchingCategory.color,
              subcategories: matchingCategory.subcategories
            } : { 
              id: apiRequest.asset_category, 
              name: apiRequest.asset_category, 
              nameAr: apiRequest.asset_category, 
              description: '',
              color: '#757575'
            },
            remarks: apiRequest.remarks,
            status: apiRequest.status,
            requestedDate: apiRequest.requested_date,
            processedDate: apiRequest.approved_date,
            processedBy: apiRequest.approved_by,
            processedByName: apiRequest.approvedByName || (apiRequest.approved_by ? userNameMap.get(apiRequest.approved_by) || `User ${apiRequest.approved_by}` : undefined),
            rejectionReason: undefined, // Not provided by API
            assignedAssetId: undefined, // Not provided by API
            assignedAssetName: undefined, // Not provided by API
          };
        });
        
        setRequests(transformedRequests);

        // Fetch assets for assignment
        const apiAssets = await assetApi.getAllAssets();
        const transformedAssets: Asset[] = apiAssets.map((apiAsset: any) => {
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
            assignedToName: undefined,
            serialNumber: '',
            purchaseDate: apiAsset.purchase_date,
            location: '',
            description: '',
            createdAt: apiAsset.created_at,
            updatedAt: apiAsset.created_at,
          };
        });
        
        setAssets(transformedAssets);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        showErrorToast('Failed to load data');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter requests
  const filteredRequests = useMemo(() => {
    if (!searchTerm) return requests;

    return requests.filter(request =>
      request.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [requests, searchTerm]);

  // Get available assets for the selected category
  const availableAssets = useMemo(() => {
    if (!selectedCategoryId) return [];
    return assets.filter(asset => 
      asset.category.id === selectedCategoryId && asset.status === 'available'
    );
  }, [selectedCategoryId, assets]);

  // Filter by tab
  const getFilteredRequestsByTab = (statusFilter?: string) => {
    if (!statusFilter) return filteredRequests;
    return filteredRequests.filter(request => request.status === statusFilter);
  };

  const handleProcessRequest = (request: AssetRequest) => {
    setSelectedRequest(request);
    setIsProcessModalOpen(true);
    reset({
      action: '',
      rejectionReason: '',
      assignedAssetId: '',
    });
    setAnchorEl(null);
  };

  const handleViewRequest = (request: AssetRequest) => {
    setSelectedRequest(request);
    setIsViewModalOpen(true);
    setAnchorEl(null);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, requestId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedRequestId(requestId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRequestId(null);
  };

  const handleProcessSubmit = async (data: any) => {
    if (!selectedRequest) return;

    setLoading(true);
    try {
      if (data.action === 'approve') {
        await assetApi.approveAssetRequest(selectedRequest.id, {
          asset_id: data.assignedAssetId
        });
      } else if (data.action === 'reject') {
        await assetApi.rejectAssetRequest(selectedRequest.id);
      }

      // Refresh data from API
      const apiRequests = await assetApi.getAllAssetRequests();
      
      // Fetch user names for all unique user IDs
      const uniqueUserIds = new Set<string>();
      apiRequests.forEach((req: ApiAssetRequest) => {
        if (req.requested_by) uniqueUserIds.add(req.requested_by);
        if (req.approved_by) uniqueUserIds.add(req.approved_by);
      });

      // Create a map of userId to userName
      const userNameMap = new Map<string, string>();
      await Promise.all(
        Array.from(uniqueUserIds).map(async (userId) => {
          const name = await fetchUserName(userId);
          userNameMap.set(userId, name);
        })
      );

      const transformedRequests: AssetRequest[] = apiRequests.map((apiRequest: ApiAssetRequest) => ({
        id: apiRequest.id,
        employeeId: apiRequest.requested_by,
        employeeName: apiRequest.requestedByName || userNameMap.get(apiRequest.requested_by) || `User ${apiRequest.requested_by}`,
        category: { id: apiRequest.asset_category, name: apiRequest.asset_category, nameAr: apiRequest.asset_category, description: '' },
        remarks: apiRequest.remarks,
        status: apiRequest.status,
        requestedDate: apiRequest.requested_date,
        processedDate: apiRequest.approved_date,
        processedBy: apiRequest.approved_by,
        processedByName: apiRequest.approvedByName || (apiRequest.approved_by ? userNameMap.get(apiRequest.approved_by) || `User ${apiRequest.approved_by}` : undefined),
        rejectionReason: undefined,
        assignedAssetId: undefined,
        assignedAssetName: undefined,
      }));
      
      setRequests(transformedRequests);

      showSuccessToast(`Request ${data.action}ed successfully`);
      setIsProcessModalOpen(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Failed to process request:', error);
      showErrorToast('Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusCounts = () => {
    return {
      all: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
    };
  };

  const statusCounts = getStatusCounts();

  if (initialLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Stack alignItems="center" py={4}>
          <CircularProgress />
        </Stack>
      </Box>
    );
  }

  const renderRequestRow = (request: AssetRequest) => (
    <TableRow key={request.id} hover>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
            {request.employeeName.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {request.employeeName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {request.category.name}
            </Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <StatusChip status={request.status} type="request" />
      </TableCell>
      <TableCell>
        {new Date(request.requestedDate).toLocaleDateString()}
      </TableCell>
      <TableCell>
        {request.remarks && (
          <Tooltip title={request.remarks} arrow>
            <Typography variant="body2" sx={{ 
              maxWidth: 200, 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {request.remarks}
            </Typography>
          </Tooltip>
        )}
      </TableCell>
      <TableCell>
        {request.assignedAssetName && (
          <Chip 
            label={request.assignedAssetName} 
            size="small" 
            color="success" 
            variant="outlined"
          />
        )}
        {request.rejectionReason && (
          <Typography variant="caption" color="error">
            {request.rejectionReason}
          </Typography>
        )}
      </TableCell>
      <TableCell align="right">
        <IconButton
          onClick={(e) => handleMenuClick(e, request.id)}
          size="small"
        >
          <MoreVertIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl) && selectedRequestId === request.id}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleViewRequest(request)}>
            <ListItemIcon>
              <ViewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
          {request.status === 'pending' && (
            <MenuItem onClick={() => handleProcessRequest(request)}>
              <ListItemIcon>
                <AssignmentIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Process Request</ListItemText>
            </MenuItem>
          )}
        </Menu>
      </TableCell>
    </TableRow>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3,flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h4" fontWeight={600}>
          Asset Request Management
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
        <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Requests
              </Typography>
              <Typography variant="h4" fontWeight={600}>
                {statusCounts.all}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending
              </Typography>
              <Typography variant="h4" fontWeight={600} color="warning.main">
                {statusCounts.pending}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Approved
              </Typography>
              <Typography variant="h4" fontWeight={600} color="success.main">
                {statusCounts.approved}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Rejected
              </Typography>
              <Typography variant="h4" fontWeight={600} color="error.main">
                {statusCounts.rejected}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Search */}
      <Card sx={{ mb: 3,}}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search requests by employee, category, or status..."
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
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="All Requests" />
            <Tab label="Pending Approval" />
            <Tab label="Approved" />
            <Tab label="Rejected" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee & Asset</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Requested Date</TableCell>
                  <TableCell>Remarks</TableCell>
                  <TableCell>Assignment/Reason</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredRequestsByTab().map(renderRequestRow)}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee & Asset</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Requested Date</TableCell>
                  <TableCell>Remarks</TableCell>
                  <TableCell>Assignment/Reason</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredRequestsByTab('pending').map(renderRequestRow)}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee & Asset</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Requested Date</TableCell>
                  <TableCell>Remarks</TableCell>
                  <TableCell>Assignment/Reason</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredRequestsByTab('approved').map(renderRequestRow)}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee & Asset</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Requested Date</TableCell>
                  <TableCell>Remarks</TableCell>
                  <TableCell>Assignment/Reason</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredRequestsByTab('rejected').map(renderRequestRow)}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Card>

      {/* Process Request Modal */}
      <Dialog
        open={isProcessModalOpen}
        onClose={() => setIsProcessModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={600}>
            Process Asset Request
          </Typography>
          {selectedRequest && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {selectedRequest.employeeName} - {selectedRequest.category.name}
            </Typography>
          )}
        </DialogTitle>

        <form onSubmit={handleSubmit(handleProcessSubmit)}>
          <DialogContent >
            <Box sx={{ pt: 1 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, flexDirection: 'column' }}>
                <Box >
                  <Controller
                    name="action"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.action}>
                        <InputLabel>Action</InputLabel>
                        <Select
                          {...field}
                          label="Action"
                          disabled={loading}
                        >
                          <MenuItem value="approve">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <ApproveIcon color="success" />
                              Approve Request
                            </Box>
                          </MenuItem>
                          <MenuItem value="reject">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <RejectIcon color="error" />
                              Reject Request
                            </Box>
                          </MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                </Box>

                {selectedAction === 'approve' && (
                  <Box>
                    <Controller
                      name="assignedAssetId"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.assignedAssetId}>
                          <InputLabel>Assign Asset</InputLabel>
                          <Select
                            {...field}
                            label="Assign Asset"
                            disabled={loading || availableAssets.length === 0}
                          >
                            {availableAssets.length === 0 ? (
                              <MenuItem disabled>
                                No available assets in this category
                              </MenuItem>
                            ) : (
                              availableAssets.map((asset) => (
                                <MenuItem key={asset.id} value={asset.id}>
                                  {asset.name} - {asset.serialNumber}
                                </MenuItem>
                              ))
                            )}
                          </Select>
                        </FormControl>
                      )}
                    />
                    {availableAssets.length === 0 && (
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        No available assets found in this category. Please add assets or wait for assets to become available.
                      </Alert>
                    )}
                  </Box>
                )}

                {selectedAction === 'reject' && (
                  <Box>
                    <Controller
                      name="rejectionReason"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Rejection Reason (Optional)"
                          multiline
                          rows={3}
                          placeholder="Optionally provide a reason for rejection..."
                          error={!!errors.rejectionReason}
                          helperText={errors.rejectionReason?.message}
                          disabled={loading}
                        />
                      )}
                    />
                  </Box>
                )}

                {selectedRequest?.remarks && (
                  <Box>
                    <Alert severity="info">
                      <Typography variant="body2">
                        <strong>Employee Remarks:</strong> {selectedRequest.remarks}
                      </Typography>
                    </Alert>
                  </Box>
                )}
              </Box>
            </Box>
          </DialogContent>

          <DialogActions sx={{ padding: '16px 24px', gap: 1 }}>
            <Button
              onClick={() => setIsProcessModalOpen(false)}
              variant="outlined"
              disabled={loading}
              sx={{ minWidth: 80 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || (selectedAction === 'approve' && availableAssets.length === 0)}
              sx={{ minWidth: 80 }}
            >
              {loading ? 'Processing...' : (selectedAction === 'approve' ? 'Approve' : 'Reject')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Details Modal */}
      <Dialog
        open={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            {selectedRequest?.employeeName.charAt(0)}
          </Avatar>
          Request Details
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {/* Employee Information */}
                <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                  <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom color="primary">
                      Employee Information
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2">
                        <strong>Name:</strong> {selectedRequest.employeeName}
                      </Typography>
                    </Box>
                  </Card>
                </Box>

                {/* Request Information */}
                <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                  <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom color="primary">
                      Request Information
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2">
                        <strong>Category:</strong> {selectedRequest.category.name}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Status:</strong> 
                        <Box component="span" sx={{ ml: 1 }}>
                          <StatusChip status={selectedRequest.status} type="request" />
                        </Box>
                      </Typography>
                      <Typography variant="body2">
                        <strong>Requested Date:</strong> {new Date(selectedRequest.requestedDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Card>
                </Box>

                {/* Remarks */}
                {selectedRequest.remarks && (
                  <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                    <Card variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom color="primary">
                        Employee Remarks
                      </Typography>
                      <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                        "{selectedRequest.remarks}"
                      </Typography>
                    </Card>
                  </Box>
                )}

                {/* Processing Information */}
                {(selectedRequest.processedDate || selectedRequest.assignedAssetName || selectedRequest.rejectionReason) && (
                  <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                    <Card variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom color="primary">
                        Processing Information
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {selectedRequest.processedDate && (
                          <Typography variant="body2">
                            <strong>Processed Date:</strong> {new Date(selectedRequest.processedDate).toLocaleDateString()}
                          </Typography>
                        )}
                        {selectedRequest.processedByName && (
                          <Typography variant="body2">
                            <strong>Processed By:</strong> {selectedRequest.processedByName}
                          </Typography>
                        )}
                        {selectedRequest.assignedAssetName && (
                          <Alert severity="success" sx={{ mt: 1 }}>
                            <Typography variant="body2">
                              <strong>Assigned Asset:</strong> {selectedRequest.assignedAssetName}
                            </Typography>
                          </Alert>
                        )}
                        {selectedRequest.rejectionReason && (
                          <Alert severity="error" sx={{ mt: 1 }}>
                            <Typography variant="body2">
                              <strong>Rejection Reason:</strong> {selectedRequest.rejectionReason}
                            </Typography>
                          </Alert>
                        )}
                      </Box>
                    </Card>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setIsViewModalOpen(false)}
            variant="contained"
            sx={{ minWidth: 80 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RequestManagement;
