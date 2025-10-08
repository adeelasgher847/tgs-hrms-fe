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
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon2,
  Pending as PendingIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import type { AssetRequest, CreateAssetRequest, AssetCategory } from '../../types/asset';
import { mockAssetRequests, mockAssetCategories } from '../../data/assetMockData';
import StatusChip from './StatusChip';
import ConfirmationDialog from './ConfirmationDialog';
import { showSuccessToast, showErrorToast } from './NotificationToast';

// Mock current user - in real app this would come from auth context
const currentUserId = '4'; // Sarah Wilson

const schema = yup.object({
  categoryId: yup.string().required('Category is required'),
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
  // Initialize with localStorage data if available, otherwise use mock data
  const [requests, setRequests] = useState<AssetRequest[]>(() => {
    const savedRequests = localStorage.getItem('assetRequests');
    return savedRequests ? JSON.parse(savedRequests) : mockAssetRequests;
  });
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState<AssetRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      categoryId: '',
      remarks: '',
    },
  });

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

  const handleSubmitRequest = async (data: CreateAssetRequest) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newRequest: AssetRequest = {
        id: Date.now().toString(),
        employeeId: currentUserId,
        employeeName: 'Sarah Wilson', // This would come from auth context
        category: mockAssetCategories.find(c => c.id === data.categoryId)!,
        remarks: data.remarks,
        status: 'pending',
        requestedDate: new Date().toISOString(),
      };

      const updatedRequests = [newRequest, ...requests];
      setRequests(updatedRequests);
      
      // Update localStorage to sync with RequestManagement component
      localStorage.setItem('assetRequests', JSON.stringify(updatedRequests));
      
      setIsRequestModalOpen(false);
      reset();
      showSuccessToast('Asset request submitted successfully');
    } catch (error) {
      showErrorToast('Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = (request: AssetRequest) => {
    setRequestToCancel(request);
    setIsCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!requestToCancel) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedRequests = requests.map(request =>
        request.id === requestToCancel.id
          ? { ...request, status: 'cancelled' as const }
          : request
      );
      
      setRequests(updatedRequests);
      
      // Update localStorage to sync with RequestManagement component
      localStorage.setItem('assetRequests', JSON.stringify(updatedRequests));

      showSuccessToast('Request cancelled successfully');
      setIsCancelDialogOpen(false);
      setRequestToCancel(null);
    } catch (error) {
      showErrorToast('Failed to cancel request');
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
      cancelled: userRequests.filter(r => r.status === 'cancelled').length,
    };
  };

  const statusCounts = getStatusCounts();

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
      <TableCell>
        {request.rejectionReason && (
          <Typography variant="caption" color="error">
            {request.rejectionReason}
          </Typography>
        )}
        {request.assignedAssetName && (
          <Typography variant="caption" color="success.main">
            Assigned: {request.assignedAssetName}
          </Typography>
        )}
      </TableCell>
      <TableCell align="right">
        {request.status === 'pending' && (
          <IconButton
            onClick={() => handleCancelRequest(request)}
            size="small"
            color="error"
          >
            <CancelIcon />
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
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsRequestModalOpen(true)}
        >
          Request Asset
        </Button>
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
        <Box flex={1} sx={{ minWidth: '150px' }} >
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Cancelled
              </Typography>
              <Typography variant="h4" fontWeight={600} color="text.secondary">
                {statusCounts.cancelled}
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
                  <TableCell>Notes</TableCell>
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
                  <TableCell>Notes</TableCell>
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
                  <TableCell>Notes</TableCell>
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
                  <TableCell>Notes</TableCell>
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
                    name="categoryId"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.categoryId}>
                        <InputLabel>Asset Category</InputLabel>
                        <Select
                          {...field}
                          label="Asset Category"
                          disabled={loading}
                        >
                          {mockAssetCategories.map((category) => (
                            <MenuItem key={category.id} value={category.id}>
                              {category.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
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

      {/* Cancel Request Confirmation Dialog */}
      <ConfirmationDialog
        open={isCancelDialogOpen}
        title="Cancel Request"
        message={`Are you sure you want to cancel your request for "${requestToCancel?.category.name}"?`}
        confirmText="Cancel Request"
        onConfirm={handleConfirmCancel}
        onCancel={() => setIsCancelDialogOpen(false)}
        severity="warning"
        loading={loading}
      />
    </Box>
  );
};

export default AssetRequests;
