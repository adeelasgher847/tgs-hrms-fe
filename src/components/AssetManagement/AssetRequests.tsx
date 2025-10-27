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
  Tabs,
  Tab,
  InputAdornment,
  CircularProgress,
  Stack,
  Pagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import type { AssetRequest, AssetCategory } from '../../types/asset';
import { assetApi, type AssetRequest as ApiAssetRequest } from '../../api/assetApi';
import StatusChip from './StatusChip';
import ConfirmationDialog from './ConfirmationDialog';
import { Snackbar, Alert } from '@mui/material';
import { type AssetSubcategory } from '../../api/assetApi';

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

// Normalize status to ensure it matches expected values
const normalizeRequestStatus = (status: string): 'pending' | 'approved' | 'rejected' | 'cancelled' => {
  const normalized = status.toLowerCase().trim();
  switch (normalized) {
    case 'pending':
      return 'pending';
    case 'approved':
      return 'approved';
    case 'rejected':
      return 'rejected';
    case 'cancelled':
    case 'canceled':
      return 'cancelled';
    default:
      console.warn('Unknown status received from API:', status, 'normalized to:', normalized);
      return 'pending'; // Default fallback
  }
};

const schema = yup.object({
  category: yup.string().required('Category is required'),
  subcategory: yup.string(),
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
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<AssetSubcategory[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });

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
      category: '',
      subcategory: '',
      remarks: '',
    },
  });

  // Watch category changes to update subcategory options
  const watchedCategory = watch('category');
  
  React.useEffect(() => {
    if (watchedCategory) {
      setSelectedCategory(watchedCategory);
      // Reset subcategory when category changes
      setValue('subcategory', '');
    } else {
      setSelectedCategory('');
    }
  }, [watchedCategory, setValue]);

  // Fetch categories and subcategories from backend
  React.useEffect(() => {
    const fetchCategoriesAndSubcategories = async () => {
      try {
        setLoadingData(true);
        const [categoriesData, subcategoriesData] = await Promise.all([
          assetApi.getAssetSubcategoriesByCategory(),
          assetApi.getAllAssetSubcategories()
        ]);
        
        
        // Extract unique categories
        setCategories(categoriesData);
        
        // Store all subcategories
        setSubcategories(subcategoriesData.items || subcategoriesData);
      } catch (error) {
        console.error('❌ AssetRequests - Failed to fetch categories and subcategories:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchCategoriesAndSubcategories();
  }, []);

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
        // Only show initial loading on first load, not on pagination
        if (pagination.page === 1) {
          setInitialLoading(true);
        }
        // Use getAssetRequestById to get current user's requests with pagination
        const apiResponse = await assetApi.getAssetRequestById(currentUserId, {
          page: pagination.page,
          limit: pagination.limit,
        });
        
        
        // Transform API requests to component format
        const transformedRequests: AssetRequest[] = (apiResponse.items || []).map((apiRequest: ApiAssetRequest) => {
          
          // Parse the original request category to extract main category and subcategory
          let mainCategoryName = apiRequest.asset_category;
          let subcategoryName = '';
          
          // Check if API response has subcategory information in different possible fields
          if ((apiRequest as any).subcategory_name) {
            subcategoryName = (apiRequest as any).subcategory_name;
          } else if ((apiRequest as any).subcategory) {
            // Handle case where subcategory is an object
            const subcategory = (apiRequest as any).subcategory;
            if (typeof subcategory === 'object' && subcategory !== null) {
              // Try different possible property names for the subcategory name
              subcategoryName = subcategory.name || 
                               subcategory.title || 
                               subcategory.subcategory_name || 
                               subcategory.subcategoryName ||
                               subcategory.display_name ||
                               subcategory.label ||
                               (subcategory as any).name ||
                               JSON.stringify(subcategory);
            } else {
              subcategoryName = subcategory;
            }
          } else if ((apiRequest as any).subcategoryId && (apiRequest as any).subcategoryName) {
            subcategoryName = (apiRequest as any).subcategoryName;
          } else if (apiRequest.asset_category.includes(' - ')) {
            [mainCategoryName, subcategoryName] = apiRequest.asset_category.split(' - ');
          } else if (apiRequest.asset_category.includes(' / ')) {
            [mainCategoryName, subcategoryName] = apiRequest.asset_category.split(' / ');
          } else {
            // If no subcategory found, check if the category itself might be a subcategory
            // This handles cases where the API returns just the subcategory name
          }
          

          return {
            id: apiRequest.id,
            employeeId: apiRequest.requested_by,
            employeeName: apiRequest.requestedByName || 
              (apiRequest.requestedByUser ? 
                apiRequest.requestedByUser.name : 
                `User ${apiRequest.requested_by}`),
            category: { 
              id: apiRequest.asset_category, 
              name: mainCategoryName, 
              nameAr: apiRequest.asset_category, 
              description: '',
              color: '#757575',
              requestedItem: subcategoryName || undefined
            },
            remarks: apiRequest.remarks,
            status: normalizeRequestStatus(apiRequest.status),
          requestedDate: apiRequest.requested_date,
          processedDate: apiRequest.approved_date || undefined,
          processedBy: apiRequest.approved_by || undefined,
          processedByName: apiRequest.approvedByName || 
            (apiRequest.approvedByUser ? 
              apiRequest.approvedByUser.name : 
              apiRequest.approved_by ? `User ${apiRequest.approved_by}` : undefined),
          rejectionReason: (apiRequest as any).rejection_reason && (apiRequest as any).rejection_reason !== null ? (apiRequest as any).rejection_reason : undefined,
          assignedAssetId: undefined,
          assignedAssetName: undefined,
          };
        });
        
        setRequests(transformedRequests);
        
        // Update pagination info from API response
        setPagination(prev => ({
          ...prev,
          total: apiResponse.total || 0,
          totalPages: apiResponse.totalPages || 1,
        }));

        
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        // Only set initial loading to false on first page
        if (pagination.page === 1) {
          setInitialLoading(false);
        }
      }
    };

    fetchData();
  }, [currentUserId, pagination.page, pagination.limit]);

  // Since we're now fetching only current user's requests, we can use requests directly
  const userRequests = useMemo(() => {
    return requests; // All requests are already filtered for current user
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

  const handleSubmitRequest = async (data: { category: string; subcategory?: string; remarks?: string }) => {
    setLoading(true);
    try {
      // Find the selected subcategory to get its ID
      const selectedSubcategory = subcategories.find(sub => 
        sub.category === data.category && sub.name === data.subcategory
      );
      
      // Send only main category name, not combined with subcategory
      const requestData = {
        assetCategory: data.category, // Only main category name
        subcategoryId: selectedSubcategory?.id || undefined,
        remarks: data.remarks || '',
      };


      const newApiRequest = await assetApi.createAssetRequest(requestData);
      
      // Transform and add to local state
      const newRequest: AssetRequest = {
        id: newApiRequest.id,
        employeeId: newApiRequest.requested_by,
        employeeName: `Employee ${newApiRequest.requested_by}`,
        category: { 
          id: newApiRequest.asset_category, 
          name: data.category, 
          nameAr: newApiRequest.asset_category, 
          description: '',
          color: '#757575',
          requestedItem: data.subcategory || data.category
        },
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
      
      // Show success snackbar
      showSnackbar(`Asset request for "${data.category}" has been submitted successfully`, 'success');
      
      setIsRequestModalOpen(false);
      setSelectedCategory('');
      reset();
    } catch (error) {
      console.error('Failed to submit request:', error);
      // Show error snackbar
      showSnackbar('Failed to submit asset request. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = (request: AssetRequest) => {
    setRequestToCancel(request);
    setIsCancelDialogOpen(true);
  };

  const handleOpenRequestModal = () => {
    setSelectedCategory('');
    setIsRequestModalOpen(true);
  };

  // Removed unused handleRefreshData function - keeping for future use

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setPagination(prev => ({ ...prev, page }));
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

      // Show success snackbar
      showSnackbar(`Asset request for "${requestToCancel.category.name}" has been deleted successfully`, 'success');

      setIsCancelDialogOpen(false);
      setRequestToCancel(null);
    } catch (error) {
      console.error('Failed to delete request:', error);
      // Show error snackbar
      showSnackbar('Failed to delete asset request. Please try again.', 'error');
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
        <Stack alignItems="center" py={4}>
          <CircularProgress />
        </Stack>
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
          {(request.category as AssetCategory & { requestedItem?: string }).requestedItem && (request.category as AssetCategory & { requestedItem?: string }).requestedItem !== request.category.name && (
            <Typography variant="caption" color="primary.main" sx={{ display: 'block', fontWeight: 500 }}>
              {`${(request.category as AssetCategory & { requestedItem?: string }).requestedItem}`}
            </Typography>
          )}
        </Box>
      </TableCell>
      <TableCell>
        {request.remarks && (
          <Typography variant="body2" color="text.secondary">
            {request.remarks}
          </Typography>
        )}
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
        {request.rejectionReason && request.rejectionReason !== null && request.rejectionReason.trim() !== '' && (
          <Typography variant="body2" color="text.primary">
            {request.rejectionReason}
          </Typography>
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
                  <TableCell>Remarks</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Requested Date</TableCell>
                  <TableCell>Processed Date</TableCell>
                  <TableCell>Rejection Reason</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredRequestsByTab().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No records found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  getFilteredRequestsByTab().map(renderRequestRow)
                )}
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
                  <TableCell>Remarks</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Requested Date</TableCell>
                  <TableCell>Processed Date</TableCell>
                  <TableCell>Rejection Reason</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredRequestsByTab('pending').length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No records found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  getFilteredRequestsByTab('pending').map(renderRequestRow)
                )}
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
                  <TableCell>Remarks</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Requested Date</TableCell>
                  <TableCell>Processed Date</TableCell>
                  <TableCell>Rejection Reason</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredRequestsByTab('approved').length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No records found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  getFilteredRequestsByTab('approved').map(renderRequestRow)
                )}
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
                  <TableCell>Remarks</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Requested Date</TableCell>
                  <TableCell>Processed Date</TableCell>
                  <TableCell>Rejection Reason</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredRequestsByTab('rejected').length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No records found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  getFilteredRequestsByTab('rejected').map(renderRequestRow)
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Card>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2
            }}>
              <Typography variant="body2" color="text.secondary">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} requests
              </Typography>
              <Pagination
                count={pagination.totalPages}
                page={pagination.page}
                onChange={handlePageChange}
                color="primary"
                disabled={initialLoading}
              />
            </Box>
          </CardContent>
        </Card>
      )}

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
                      <FormControl fullWidth error={!!errors.category}>
                        <InputLabel>Asset Category</InputLabel>
                        <Select
                          {...field}
                          label="Asset Category"
                          disabled={loading}
                          MenuProps={{
                            PaperProps: {
                              style: {
                                maxHeight: 300,
                              },
                            },
                          }}
                        >
                          {categories.map((category) => (
                            <MenuItem key={category} value={category}>
                              <Typography variant="body1" fontWeight={500}>
                                {category}
                              </Typography>
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.category && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                            {errors.category.message}
                          </Typography>
                        )}
                        {!errors.category && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.75 }}>
                            Select the asset category you need
                          </Typography>
                        )}
                      </FormControl>
                    )}
                  />
                </Box>

                {/* Subcategory selection - only show if a category with subcategories is selected */}
                {selectedCategory && subcategories.filter(sub => sub.category === selectedCategory).length > 0 && (
                  <Box>
                    <Controller
                      name="subcategory"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Specific Item (Optional)</InputLabel>
                          <Select
                            {...field}
                            label="Specific Item (Optional)"
                            disabled={loading || loadingData}
                            MenuProps={{
                              PaperProps: {
                                style: {
                                  maxHeight: 300,
                                },
                              },
                            }}
                          >
                            <MenuItem value="">
                              <em>None - General Request</em>
                            </MenuItem>
                            {subcategories
                              .filter(sub => sub.category === selectedCategory)
                              .map((subcategory) => (
                                <MenuItem key={subcategory.id} value={subcategory.name}>
                                  <Box>
                                    <Typography variant="body2">{subcategory.name}</Typography>
                                    {subcategory.description && (
                                      <Typography variant="caption" color="text.secondary">
                                        {subcategory.description}
                                      </Typography>
                                    )}
                                  </Box>
                                </MenuItem>
                              ))}
                          </Select>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.75 }}>
                            Optionally specify the exact item you need
                          </Typography>
                        </FormControl>
                      )}
                    />
                  </Box>
                )}

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

export default AssetRequests;
