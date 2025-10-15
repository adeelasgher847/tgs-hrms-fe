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
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon2,
  Pending as PendingIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import type { AssetRequest, CreateAssetRequest, AssetCategory } from '../../types/asset';
import { assetApi, type AssetRequest as ApiAssetRequest } from '../../api/assetApi';
import StatusChip from './StatusChip';
import ConfirmationDialog from './ConfirmationDialog';
import { showSuccessToast, showErrorToast } from './NotificationToast';

// Get current user from localStorage or auth context
const getCurrentUserId = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user.id || user.user_id || '1'; // Fallback to '1' if no ID found
    } catch {
      return '1'; // Fallback if parsing fails
    }
  }
  return '1'; // Default fallback
};

const schema = yup.object({
  category: yup.string().required('Category is required'),
  remarks: yup.string(),
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

const AssetRequests: React.FC = () => {
  const [requests, setRequests] = useState<AssetRequest[]>([]);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState<AssetRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      category: '',
      remarks: '',
    },
  });

  // Get current user ID on component mount
  React.useEffect(() => {
    const userId = getCurrentUserId();
    setCurrentUserId(userId);
  }, []);

  // Fetch user's asset requests and available categories from API
  React.useEffect(() => {
    if (!currentUserId) return; // Don't fetch until we have user ID
    
    const fetchData = async () => {
      try {
        setInitialLoading(true);
        
        // Fetch asset requests
        const apiRequests = await assetApi.getAllAssetRequests();
        // Filter requests for current user
        let requestsToShow = apiRequests.data.filter((request: ApiAssetRequest) => 
          request.requested_by === currentUserId
        );
        
        // If no user-specific requests found, show all requests for debugging
        if (requestsToShow.length === 0 && apiRequests.length > 0) {
          console.log('No user-specific requests found, showing all requests for debugging');
          requestsToShow = apiRequests;
        }
        
        const transformedRequests: AssetRequest[] = requestsToShow.map((apiRequest: ApiAssetRequest) => ({
          id: apiRequest.id,
          employeeId: apiRequest.requested_by,
          employeeName: `Employee ${apiRequest.requested_by}`,
          category: { id: apiRequest.asset_category, name: apiRequest.asset_category, nameAr: apiRequest.asset_category, description: '' },
          remarks: apiRequest.remarks,
          status: apiRequest.status,
          requestedDate: apiRequest.requested_date,
          processedDate: apiRequest.approved_date,
          processedBy: apiRequest.approved_by,
          processedByName: apiRequest.approved_by ? `Admin ${apiRequest.approved_by}` : undefined,
          rejectionReason: undefined,
          assignedAssetId: undefined,
          assignedAssetName: undefined,
        }));
        
        setRequests(transformedRequests);

        // Fetch available assets to get unique categories
        const apiAssets = await assetApi.getAllAssets();
        const uniqueCategories = [...new Set(apiAssets.map((asset: any) => asset.category))] as string[];
        setAvailableCategories(uniqueCategories);
        
      } catch (error) {
        console.error('Failed to fetch data:', error);
     
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [currentUserId]);

  // Filter requests for current user
  const userRequests = useMemo(() => {
    return requests.filter(request => request.employeeId === currentUserId);
  }, [requests]);

  // Filter by search term
  const filteredRequests = useMemo(() => {
    if (!searchTerm) return userRequests;

    return userRequests.filter(request =>
      request.category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [userRequests, searchTerm]);

  // Filter by tab
  const getFilteredRequestsByTab = (statusFilter?: string) => {
    if (!statusFilter) return filteredRequests;
    return filteredRequests.filter(request => request.status === statusFilter);
  };

  const handleSubmitRequest = async (data: { category: string; remarks?: string }) => {
    setLoading(true);
    try {
      const requestData = {
        assetCategory: data.category,
        remarks: data.remarks || '',
      };

      const newApiRequest = await assetApi.createAssetRequest(requestData);
      
      // Transform and add to local state
      const newRequest: AssetRequest = {
        id: newApiRequest.id,
        employeeId: newApiRequest.requested_by,
        employeeName: `Employee ${newApiRequest.requested_by}`,
        category: { id: newApiRequest.asset_category, name: newApiRequest.asset_category, nameAr: newApiRequest.asset_category, description: '' },
        remarks: newApiRequest.remarks,
        status: newApiRequest.status,
        requestedDate: newApiRequest.requested_date,
        processedDate: newApiRequest.approved_date,
        processedBy: newApiRequest.approved_by,
        processedByName: newApiRequest.approved_by ? `Admin ${newApiRequest.approved_by}` : undefined,
        rejectionReason: undefined,
        assignedAssetId: undefined,
        assignedAssetName: undefined,
      };

      setRequests(prev => [newRequest, ...prev]);
      
      setIsRequestModalOpen(false);
      reset();
      showSuccessToast('Asset request submitted successfully');
    } catch (error) {
      console.error('Failed to submit request:', error);
      showErrorToast('Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = (request: AssetRequest) => {
    setRequestToCancel(request);
    setIsCancelDialogOpen(true);
  };

  const handleOpenRequestModal = async () => {
    setIsRequestModalOpen(true);
    // Refresh available categories when opening the modal
    try {
      const apiAssets = await assetApi.getAllAssets();
      const uniqueCategories = [...new Set(apiAssets.map((asset: any) => asset.category))] as string[];
      setAvailableCategories(uniqueCategories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleRefreshData = async () => {
    if (!currentUserId) return;
    
    setInitialLoading(true);
    try {
      
      // Fetch asset requests
      const apiRequests = await assetApi.getAllAssetRequests();
      
      // Filter requests for current user
      let requestsToShow = apiRequests.filter((request: ApiAssetRequest) => 
        request.requested_by === currentUserId
      );
      
      // If no user-specific requests found, show all requests for debugging
      if (requestsToShow.length === 0 && apiRequests.length > 0) {
        console.log('No user-specific requests found, showing all requests for debugging');
        requestsToShow = apiRequests;
      }
      
      const transformedRequests: AssetRequest[] = requestsToShow.map((apiRequest: ApiAssetRequest) => ({
        id: apiRequest.id,
        employeeId: apiRequest.requested_by,
        employeeName: `Employee ${apiRequest.requested_by}`,
        category: { id: apiRequest.asset_category, name: apiRequest.asset_category, nameAr: apiRequest.asset_category, description: '' },
        remarks: apiRequest.remarks,
        status: apiRequest.status,
        requestedDate: apiRequest.requested_date,
        processedDate: apiRequest.approved_date,
        processedBy: apiRequest.approved_by,
        processedByName: apiRequest.approved_by ? `Admin ${apiRequest.approved_by}` : undefined,
        rejectionReason: undefined,
        assignedAssetId: undefined,
        assignedAssetName: undefined,
      }));
      
      setRequests(transformedRequests);

      // Fetch available assets to get unique categories
      const apiAssets = await assetApi.getAllAssets();
      const uniqueCategories = [...new Set(apiAssets.map((asset: any) => asset.category))] as string[];
      setAvailableCategories(uniqueCategories);
      
      showSuccessToast('Data refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh data:', error);
      showErrorToast('Failed to refresh data');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!requestToCancel) return;

    setLoading(true);
    try {
      // Delete the request using DELETE API
      await assetApi.deleteAssetRequest(requestToCancel.id);
      
      // Remove from local state
      const updatedRequests = requests.filter(request => request.id !== requestToCancel.id);
      setRequests(updatedRequests);

      showSuccessToast('Request deleted successfully');
      setIsCancelDialogOpen(false);
      setRequestToCancel(null);
    } catch (error) {
      console.error('Failed to delete request:', error);
      showErrorToast('Failed to delete request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusCounts = () => {
    return {
      all: userRequests.length,
      pending: userRequests.filter(r => r.status === 'pending').length,
      approved: userRequests.filter(r => r.status === 'approved').length,
      rejected: userRequests.filter(r => r.status === 'rejected').length,
    };
  };

  const statusCounts = getStatusCounts();

  if (initialLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Typography>Loading requests...</Typography>
      </Box>
    );
  }

  const renderRequestRow = (request: AssetRequest) => (
    <TableRow key={request.id} hover>
      <TableCell>
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {request.category.name}
          </Typography>
          {request.remarks && (
            <Typography variant="caption" color="text.secondary">
              {request.remarks}
            </Typography>
          )}
        </Box>
      </TableCell>
      <TableCell>
        <StatusChip status={request.status} type="request" />
      </TableCell>
      <TableCell>
        {new Date(request.requestedDate).toLocaleDateString()}
      </TableCell>
      <TableCell>
        {request.processedDate && (
          new Date(request.processedDate).toLocaleDateString()
        )}
      </TableCell>
      <TableCell align="right">
        {request.status === 'pending' && (
          <IconButton
            onClick={() => handleCancelRequest(request)}
            size="small"
            color="error"
            title="Delete Request"
          >
            <DeleteIcon />
          </IconButton>
        )}
        {request.status === 'approved' && request.assignedAssetName && (
          <IconButton size="small" color="success">
            <CheckCircleIcon />
          </IconButton>
        )}
      </TableCell>
    </TableRow>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 ,flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h4" fontWeight={600}>
          My Asset Requests
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefreshData}
            disabled={initialLoading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenRequestModal}
          >
            Request Asset
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Box  sx={{ mb: 3 ,display: 'flex', gap: 1,flexWrap: 'wrap'}}>
        <Box flex={1} sx={{ minWidth: '150px' }} >
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
        <Box flex={1} sx={{ minWidth: '150px' }} >
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
        <Box flex={1} sx={{ minWidth: '150px' }} >
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
        <Box flex={1} sx={{ minWidth: '150px' }} >
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
      <Card sx={{ mb: 3}}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="All Requests" />
            <Tab label="Pending" />
            <Tab label="Approved" />
            <Tab label="Rejected" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Asset Category</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Requested Date</TableCell>
                  <TableCell>Processed Date</TableCell>
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
                  <TableCell>Asset Category</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Requested Date</TableCell>
                  <TableCell>Processed Date</TableCell>
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
                  <TableCell>Asset Category</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Requested Date</TableCell>
                  <TableCell>Processed Date</TableCell>
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
                  <TableCell>Asset Category</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Requested Date</TableCell>
                  <TableCell>Processed Date</TableCell>
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

      {/* Request Asset Modal */}
      <Dialog
        open={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 1,
          },
        }}
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={600}>
            Request New Asset
          </Typography>
        </DialogTitle>

        <form onSubmit={handleSubmit(handleSubmitRequest)}>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <Box sx={{ display: 'flex', gap: 2,flexWrap: 'wrap',flexDirection: 'column' }}>
                <Box>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        {...field}
                        freeSolo
                        options={availableCategories}
                        value={field.value || ''}
                        onChange={(event, newValue) => {
                          field.onChange(newValue || '');
                        }}
                        onInputChange={(event, newInputValue) => {
                          field.onChange(newInputValue);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            label="Asset Category"
                            placeholder="Enter or select from available categories"
                            error={!!errors.category}
                            helperText={errors.category?.message || (availableCategories.length > 0 ? `Available categories: ${availableCategories.join(', ')}` : 'No categories available yet. You can still enter a custom category.')}
                            disabled={loading}
                          />
                        )}
                      />
                    )}
                  />
                </Box>

                <Box>
                  <Controller
                    name="remarks"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Remarks (Optional)"
                        multiline
                        rows={3}
                        placeholder="Please provide details about why you need this asset..."
                        disabled={loading}
                      />
                    )}
                  />
                </Box>
              </Box>
            </Box>
          </DialogContent>

          <DialogActions sx={{ padding: '16px 24px', gap: 1 }}>
            <Button
              onClick={() => setIsRequestModalOpen(false)}
              variant="outlined"
              disabled={loading}
              sx={{ minWidth: 80 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ minWidth: 80 }}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Request Confirmation Dialog */}
      <ConfirmationDialog
        open={isCancelDialogOpen}
        title="Delete Request"
        message={`Are you sure you want to delete your request for "${requestToCancel?.category.name}"? This action cannot be undone.`}
        confirmText="Delete Request"
        onConfirm={handleConfirmCancel}
        onCancel={() => setIsCancelDialogOpen(false)}
        severity="error"
        loading={loading}
      />
    </Box>
  );
};

export default AssetRequests;
