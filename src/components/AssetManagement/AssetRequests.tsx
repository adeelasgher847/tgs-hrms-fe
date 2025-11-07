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
import {
  assetApi,
  type AssetRequest as ApiAssetRequest,
} from '../../api/assetApi';
import StatusChip from './StatusChip';
import ConfirmationDialog from './ConfirmationDialog';
import { Snackbar, Alert } from '@mui/material';
import { type AssetSubcategory } from '../../api/assetApi';

// Extended interface for API asset request response that may include additional fields
interface ApiAssetRequestExtended extends ApiAssetRequest {
  category_id?: string;
  subcategory_id?: string | null;
  subcategory_name?: string;
  category?:
    | string
    | {
        id?: string;
        name?: string;
        description?: string | null;
        icon?: string | null;
      };
  subcategory?:
    | string
    | {
        name?: string;
        title?: string;
        subcategory_name?: string;
        subcategoryName?: string;
        display_name?: string;
        label?: string;
      };
  subcategoryId?: string;
  subcategoryName?: string;
  rejection_reason?: string | null;
  // Legacy field for backward compatibility
  asset_category?: string;
}

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
const normalizeRequestStatus = (
  status: string
): 'pending' | 'approved' | 'rejected' | 'cancelled' => {
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
      console.warn(
        'Unknown status received from API:',
        status,
        'normalized to:',
        normalized
      );
      return 'pending'; // Default fallback
  }
};

const schema = yup.object({
  category: yup.string().required('Category is required'),
  subcategory: yup.string().required('Subcategory is required'),
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
      role='tabpanel'
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
  const [allRequestsForStats, setAllRequestsForStats] = useState<
    AssetRequest[]
  >([]); // Store all requests for statistics
  const [statusCounts, setStatusCounts] = useState<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
  }>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
  }); // Store counts from API response
  const [rawApiRequests, setRawApiRequests] = useState<ApiAssetRequestExtended[]>([]); // Store raw API requests for re-transformation
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState<AssetRequest | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [categories, setCategories] = useState<Array<{ id: string; name: string; description?: string }>>([]);
  const [subcategories, setSubcategories] = useState<AssetSubcategory[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const initialLoadRef = React.useRef(false); // Track if initial load has been done
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  const showSnackbar = (
    message: string,
    severity: 'success' | 'error' | 'warning' | 'info' = 'success'
  ) => {
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
  const watchedCategoryId = watch('category');

  React.useEffect(() => {
    if (watchedCategoryId) {
      setSelectedCategoryId(watchedCategoryId);
      // Reset subcategory when category changes
      setValue('subcategory', '');
    } else {
      setSelectedCategoryId('');
      setSubcategories([]);
    }
  }, [watchedCategoryId, setValue]);

  // Fetch categories from backend - load once on component mount for table display
  React.useEffect(() => {
    const fetchCategories = async () => {
      // If categories are already loaded, don't fetch again
      if (categories.length > 0) return;
      
      try {
        setLoadingData(true);
        const response = await assetApi.getAllAssetCategories();
        
        // Handle different response structures
        let categoriesData: Array<{ id: string; name: string; description?: string }> = [];
        if (Array.isArray(response)) {
          categoriesData = response;
        } else if (response.data && Array.isArray(response.data)) {
          categoriesData = response.data;
        } else if (response.items && Array.isArray(response.items)) {
          categoriesData = response.items;
        } else if (response.categories && Array.isArray(response.categories)) {
          categoriesData = response.categories;
        }

        setCategories(categoriesData);
      } catch (error) {
        console.error('❌ AssetRequests - Failed to fetch categories:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchCategories();
  }, []); // Load once on mount

  // Fetch subcategories when category is selected
  React.useEffect(() => {
    const fetchSubcategories = async () => {
      if (!selectedCategoryId) {
        setSubcategories([]);
        return;
      }

      try {
        setLoadingData(true);
        const response = await assetApi.getAssetSubcategoriesByCategoryId(
          selectedCategoryId
        );

        // Handle different response structures
        let subcategoriesData: AssetSubcategory[] = [];
        if (Array.isArray(response)) {
          subcategoriesData = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          subcategoriesData = response.data;
        } else if (response && response.items && Array.isArray(response.items)) {
          subcategoriesData = response.items;
        } else if (
          response &&
          response.subcategories &&
          Array.isArray(response.subcategories)
        ) {
          subcategoriesData = response.subcategories;
        }

        // Filter subcategories by selected category ID
        const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
        const filteredSubcategories = subcategoriesData.filter(sub => {
          if (sub.category === selectedCategoryId) {
            return true;
          }
          if (selectedCategory && sub.category === selectedCategory.name) {
            return true;
          }
          if (sub.category && typeof sub.category === 'object' && 'id' in sub.category) {
            return (sub.category as any).id === selectedCategoryId;
          }
          return false;
        });

        setSubcategories(filteredSubcategories);
      } catch (error) {
        console.error('❌ AssetRequests - Failed to fetch subcategories:', error);
        setSubcategories([]);
      } finally {
        setLoadingData(false);
      }
    };

    if (selectedCategoryId) {
      fetchSubcategories();
    }
  }, [selectedCategoryId, categories]);

  // Helper function to transform API requests
  const transformApiRequests = React.useCallback(
    (apiRequests: ApiAssetRequestExtended[]): AssetRequest[] => {
      return apiRequests.map((apiRequest: ApiAssetRequestExtended) => {
        // Handle new API response structure with category_id and subcategory_id
        const categoryId = apiRequest.category_id || apiRequest.asset_category || '';
        const subcategoryId = apiRequest.subcategory_id || undefined;
        
        // Find category name - first try from API response category object
        let categoryName = '';
        if (apiRequest.category && typeof apiRequest.category === 'object' && apiRequest.category !== null) {
          categoryName = apiRequest.category.name || '';
        }
        
        // If not found in API response, try from categories list
        if (!categoryName) {
          const categoryObj = categories.find(cat => cat.id === categoryId);
          categoryName = categoryObj?.name || '';
        }
        
        // If still not found, fallback to ID (but log warning)
        if (!categoryName && categoryId) {
          if (categories.length === 0) {
            console.warn('⚠️ Categories not loaded yet for category ID:', categoryId);
          }
          categoryName = categoryId; // Fallback to ID if name not found
        }

        // Find subcategory name if subcategory_id exists
        // First try to get from API response subcategory object
        let subcategoryName = '';
        if (apiRequest.subcategory) {
          if (typeof apiRequest.subcategory === 'object' && apiRequest.subcategory !== null) {
            subcategoryName = apiRequest.subcategory.name || apiRequest.subcategoryName || '';
          } else {
            subcategoryName = apiRequest.subcategory || '';
          }
        }
        
        // If not found in API response, try to find from subcategories list
        if (!subcategoryName && subcategoryId) {
          const subcategoryObj = subcategories.find(sub => sub.id === subcategoryId);
          subcategoryName = subcategoryObj?.name || '';
        }
        
        // Also check subcategoryName field directly
        if (!subcategoryName && apiRequest.subcategoryName) {
          subcategoryName = apiRequest.subcategoryName;
        }

        return {
          id: apiRequest.id,
          employeeId: apiRequest.requested_by,
          employeeName:
            apiRequest.requestedByName ||
            (apiRequest.requestedByUser
              ? apiRequest.requestedByUser.name
              : `User ${apiRequest.requested_by}`),
          category: {
            id: categoryId,
            name: categoryName,
            nameAr: categoryName,
            description: '',
            color: '#757575',
            requestedItem: subcategoryName || undefined,
          },
          subcategoryId: subcategoryId || undefined,
          subcategoryName: subcategoryName || undefined,
          remarks: apiRequest.remarks,
          status: normalizeRequestStatus(apiRequest.status),
          requestedDate: apiRequest.requested_date,
          processedDate: apiRequest.approved_date || undefined,
          processedBy: apiRequest.approved_by || undefined,
          processedByName:
            apiRequest.approvedByName ||
            (apiRequest.approvedByUser
              ? apiRequest.approvedByUser.name
              : apiRequest.approved_by
                ? `User ${apiRequest.approved_by}`
                : undefined),
          rejectionReason:
            apiRequest.rejection_reason && apiRequest.rejection_reason !== null
              ? apiRequest.rejection_reason
              : undefined,
          assignedAssetId: undefined,
          assignedAssetName: undefined,
        };
      });
    },
    [categories, subcategories]
  );

  // Fetch all requests for statistics (without pagination)
  const fetchAllRequestsForStats = React.useCallback(async () => {
    if (!currentUserId) return;

    try {
      // Fetch all requests by looping through all pages
      let allApiRequests: ApiAssetRequestExtended[] = [];
      let currentPage = 1;
      let hasMorePages = true;
      const limit = 1000; // Use a high limit per page

      while (hasMorePages) {
        const response = await assetApi.getAssetRequestById(currentUserId, {
          page: currentPage,
          limit,
        });

        const apiRequests = response.items || [];
        const paginationInfo = {
          total: response.total || 0,
          totalPages: response.totalPages || 1,
        };

        if (apiRequests && apiRequests.length > 0) {
          allApiRequests = [...allApiRequests, ...apiRequests];
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

      if (allApiRequests.length > 0) {
        // Store raw API requests for re-transformation
        setRawApiRequests(prev => {
          // Merge with existing raw requests, avoiding duplicates
          const existingIds = new Set(prev.map(r => r.id));
          const newRequests = allApiRequests.filter(r => !existingIds.has(r.id));
          return [...prev, ...newRequests];
        });
        
        const transformedRequests = transformApiRequests(allApiRequests);
        setAllRequestsForStats(transformedRequests);
      } else {
        setAllRequestsForStats([]);
      }
    } catch (error) {
      console.error('Failed to fetch all requests for statistics:', error);
      // Don't show snackbar for this as it's a background operation
    }
  }, [currentUserId, transformApiRequests]);

  // Get current user ID on component mount
  React.useEffect(() => {
    const userId = getCurrentUserId();
    setCurrentUserId(userId);
  }, []);

  // Fetch user's asset requests and available categories from API
  const fetchRequests = React.useCallback(
    async (
      page: number = 1,
      limit: number = 25,
      isInitialLoad: boolean = false
    ) => {
      if (!currentUserId) return; // Don't fetch until we have user ID

      try {
        // Only show initial loading on very first load, not on pagination or when returning to page 1
        if (isInitialLoad && page === 1) {
          setInitialLoading(true);
        }

        // Use getAssetRequestById to get current user's requests with pagination
        const apiResponse = await assetApi.getAssetRequestById(currentUserId, {
          page,
          limit,
        });

        // Store raw API requests for re-transformation when categories are loaded
        const apiRequests = apiResponse.items || [];
        setRawApiRequests(apiRequests);

        // Transform API requests to component format
        const transformedRequests = transformApiRequests(apiRequests);
        setRequests(transformedRequests);

        // Update pagination info from API response
        setPagination(prev => ({
          ...prev,
          total: apiResponse.total || 0,
          totalPages: apiResponse.totalPages || 1,
        }));

        // Update counts from API response if available
        if (apiResponse.counts) {
          setStatusCounts({
            total: apiResponse.counts.total || 0,
            pending: apiResponse.counts.pending || 0,
            approved: apiResponse.counts.approved || 0,
            rejected: apiResponse.counts.rejected || 0,
            cancelled: apiResponse.counts.cancelled || 0,
          });
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        // Only set initial loading to false on very first load
        if (isInitialLoad && page === 1) {
          setInitialLoading(false);
        }
      }
    },
    [currentUserId, transformApiRequests]
  );

  // Re-transform requests when categories are loaded to update category names
  React.useEffect(() => {
    if (categories.length > 0 && rawApiRequests.length > 0) {
      // Re-transform raw API requests with updated categories
      const transformedRequests = transformApiRequests(rawApiRequests);
      setRequests(transformedRequests);
    }
  }, [categories, rawApiRequests, transformApiRequests]);

  // Initial load: fetch stats FIRST, then paginated requests
  React.useEffect(() => {
    if (!currentUserId) return; // Don't fetch until we have user ID

    // Only run initial load once
    if (initialLoadRef.current) {
      return;
    }

    initialLoadRef.current = true;

    // Initialize data: fetch stats FIRST, then paginated requests
    // This ensures correct counts are shown immediately when page loads
    const initializeData = async () => {
      // Fetch all requests for statistics FIRST to get accurate counts immediately
      await fetchAllRequestsForStats();
      // Then fetch paginated requests for the table (isInitialLoad = true)
      await fetchRequests(pagination.page, pagination.limit, true);
    };

    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]); // Only run when currentUserId is available

  // Handle page changes: only fetch paginated requests, not stats
  React.useEffect(() => {
    if (!currentUserId || !initialLoadRef.current) return; // Don't fetch if initial load hasn't happened

    // Only fetch paginated requests when page changes, not stats
    // Stats are already loaded and don't need to be refreshed on page change
    if (pagination.page > 0) {
      fetchRequests(pagination.page, pagination.limit, false);
    }
  }, [pagination.page, pagination.limit, currentUserId, fetchRequests]);

  // Since we're now fetching only current user's requests, we can use requests directly
  const userRequests = useMemo(() => {
    return requests; // All requests are already filtered for current user
  }, [requests]);

  // Filter by search term
  const filteredRequests = useMemo(() => {
    if (!searchTerm) return userRequests;

    return userRequests.filter(
      request =>
        request.category.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        request.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [userRequests, searchTerm]);

  // Filter by tab
  const getFilteredRequestsByTab = (statusFilter?: string) => {
    if (!statusFilter) return filteredRequests;
    return filteredRequests.filter(request => request.status === statusFilter);
  };

  const handleSubmitRequest = async (data: {
    category: string;
    subcategory?: string;
    remarks?: string;
  }) => {
    setLoading(true);
    try {
      // Get category ID and subcategory ID
      const categoryId = data.category; // This is already the category ID from dropdown
      const subcategoryId = data.subcategory && data.subcategory.trim() !== '' 
        ? data.subcategory 
        : undefined;

      const requestData = {
        categoryId: categoryId,
        subcategoryId: subcategoryId,
        remarks: data.remarks || '',
      };

      const newApiRequest = await assetApi.createAssetRequest(requestData);

      // Find category and subcategory names
      const categoryObj = categories.find(cat => cat.id === categoryId);
      const categoryName = categoryObj?.name || categoryId;
      const subcategoryObj = subcategories.find(sub => sub.id === subcategoryId);
      const subcategoryName = subcategoryObj?.name || '';

      // Transform and add to local state
      const newRequest: AssetRequest = {
        id: newApiRequest.id,
        employeeId: newApiRequest.requested_by,
        employeeName: `Employee ${newApiRequest.requested_by}`,
        category: {
          id: categoryId,
          name: categoryName,
          nameAr: categoryName,
          description: '',
          color: '#757575',
          requestedItem: subcategoryName || undefined,
        },
        subcategoryId: subcategoryId || undefined,
        remarks: newApiRequest.remarks,
        status: newApiRequest.status,
        requestedDate: newApiRequest.requested_date,
        processedDate: newApiRequest.approved_date,
        processedBy: newApiRequest.approved_by,
        processedByName: newApiRequest.approved_by
          ? `Admin ${newApiRequest.approved_by}`
          : undefined,
        rejectionReason: undefined,
        assignedAssetId: undefined,
        assignedAssetName: undefined,
      };

      setRequests(prev => [newRequest, ...prev]);

      // Refresh all requests for statistics
      fetchAllRequestsForStats();

      // Show success snackbar
      showSnackbar(
        `Asset request for "${categoryName}" has been submitted successfully`,
        'success'
      );

      setIsRequestModalOpen(false);
      setSelectedCategoryId('');
      reset();
    } catch (error) {
      console.error('Failed to submit request:', error);
      // Show error snackbar
      showSnackbar(
        'Failed to submit asset request. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = (request: AssetRequest) => {
    setRequestToCancel(request);
    setIsCancelDialogOpen(true);
  };

  const handleOpenRequestModal = () => {
    setSelectedCategoryId('');
    setIsRequestModalOpen(true);
  };

  // Removed unused handleRefreshData function - keeping for future use

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    page: number
  ) => {
    // Page change is not initial load, so pass false
    setPagination(prev => ({ ...prev, page }));
  };

  const handleConfirmCancel = async () => {
    if (!requestToCancel) return;

    setLoading(true);
    try {
      // Delete the request using DELETE API
      await assetApi.deleteAssetRequest(requestToCancel.id);

      // Remove from local state
      const updatedRequests = requests.filter(
        request => request.id !== requestToCancel.id
      );
      setRequests(updatedRequests);

      // Refresh all requests for statistics
      fetchAllRequestsForStats();

      // Refresh the current page (not initial load)
      fetchRequests(pagination.page, pagination.limit, false);

      // Show success snackbar
      showSnackbar(
        `Asset request for "${requestToCancel.category.name}" has been deleted successfully`,
        'success'
      );

      setIsCancelDialogOpen(false);
      setRequestToCancel(null);
    } catch (error) {
      console.error('Failed to delete request:', error);
      // Show error snackbar
      showSnackbar(
        'Failed to delete asset request. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Use counts from API response if available, otherwise calculate from allRequestsForStats
  const displayCounts = useMemo(() => {
    // If we have counts from API response, use them (most accurate)
    if (statusCounts.total > 0 || statusCounts.pending > 0 || statusCounts.approved > 0 || statusCounts.rejected > 0) {
      return {
        all: statusCounts.total,
        pending: statusCounts.pending,
        approved: statusCounts.approved,
        rejected: statusCounts.rejected,
      };
    }

    // Fallback: Calculate from allRequestsForStats if available
    if (allRequestsForStats.length > 0) {
      return {
        all: pagination.total || allRequestsForStats.length,
        pending: allRequestsForStats.filter(r => r.status === 'pending').length,
        approved: allRequestsForStats.filter(r => r.status === 'approved').length,
        rejected: allRequestsForStats.filter(r => r.status === 'rejected').length,
      };
    }

    // If nothing is loaded yet, show total from pagination but show 0 for status counts
    return {
      all: pagination.total || 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    };
  }, [statusCounts, allRequestsForStats, pagination.total]);

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

  const renderRequestRow = (request: AssetRequest) => (
    <TableRow key={request.id} hover>
      <TableCell>
        <Box>
          <Box>
            <Typography variant='body2' fontWeight={500}>
              {request.category.name}
            </Typography>
            {((request as any).subcategoryName || (request.category as AssetCategory & { requestedItem?: string }).requestedItem) && (
              <Typography
                variant='caption'
                color='text.secondary'
                sx={{ display: 'block', mt: 0.5 }}
              >
                {(request as any).subcategoryName || (request.category as AssetCategory & { requestedItem?: string }).requestedItem}
              </Typography>
            )}
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        {request.remarks && (
          <Typography variant='body2' color='text.secondary'>
            {request.remarks}
          </Typography>
        )}
      </TableCell>
      <TableCell>
        <StatusChip status={request.status} type='request' />
      </TableCell>
      <TableCell>
        {new Date(request.requestedDate).toLocaleDateString()}
      </TableCell>
      <TableCell>
        {request.processedDate &&
          new Date(request.processedDate).toLocaleDateString()}
      </TableCell>
      <TableCell>
        {request.rejectionReason &&
          request.rejectionReason !== null &&
          request.rejectionReason.trim() !== '' && (
            <Typography variant='body2' color='text.primary'>
              {request.rejectionReason}
            </Typography>
          )}
      </TableCell>
      <TableCell align='right'>
        {request.status === 'pending' && (
          <IconButton
            onClick={() => handleCancelRequest(request)}
            size='small'
            color='error'
            title='Delete Request'
          >
            <DeleteIcon />
          </IconButton>
        )}
        {request.status === 'approved' && request.assignedAssetName && (
          <IconButton size='small' color='success'>
            <CheckCircleIcon />
          </IconButton>
        )}
      </TableCell>
    </TableRow>
  );

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
          My Asset Requests
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant='contained'
            startIcon={<AddIcon />}
            onClick={handleOpenRequestModal}
          >
            Request Asset
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Box flex={1} sx={{ minWidth: '150px' }}>
          <Card>
            <CardContent>
              <Typography color='textSecondary' gutterBottom>
                Total Requests
              </Typography>
              <Typography variant='h4' fontWeight={600}>
                {displayCounts.all}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box flex={1} sx={{ minWidth: '150px' }}>
          <Card>
            <CardContent>
              <Typography color='textSecondary' gutterBottom>
                Pending
              </Typography>
              <Typography variant='h4' fontWeight={600} color='warning.main'>
                {displayCounts.pending}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box flex={1} sx={{ minWidth: '150px' }}>
          <Card>
            <CardContent>
              <Typography color='textSecondary' gutterBottom>
                Approved
              </Typography>
              <Typography variant='h4' fontWeight={600} color='success.main'>
                {displayCounts.approved}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box flex={1} sx={{ minWidth: '150px' }}>
          <Card>
            <CardContent>
              <Typography color='textSecondary' gutterBottom>
                Rejected
              </Typography>
              <Typography variant='h4' fontWeight={600} color='error.main'>
                {displayCounts.rejected}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder='Search requests...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
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
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
          >
            <Tab label='All Requests' />
            <Tab label='Pending' />
            <Tab label='Approved' />
            <Tab label='Rejected' />
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
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredRequestsByTab().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align='center' sx={{ py: 4 }}>
                      <Typography variant='body2' color='text.secondary'>
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
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredRequestsByTab('pending').length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align='center' sx={{ py: 4 }}>
                      <Typography variant='body2' color='text.secondary'>
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
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredRequestsByTab('approved').length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align='center' sx={{ py: 4 }}>
                      <Typography variant='body2' color='text.secondary'>
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
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredRequestsByTab('rejected').length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align='center' sx={{ py: 4 }}>
                      <Typography variant='body2' color='text.secondary'>
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
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mt: 3,
          }}
        >
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={handlePageChange}
            color='primary'
            disabled={initialLoading}
          />
        </Box>
      )}

      {/* Request Asset Modal */}
      <Dialog
        open={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        maxWidth='sm'
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 1,
          },
        }}
      >
        <DialogTitle>
          <Typography variant='h6' fontWeight={600}>
            Request New Asset
          </Typography>
        </DialogTitle>

        <form onSubmit={handleSubmit(handleSubmitRequest)}>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  flexWrap: 'wrap',
                  flexDirection: 'column',
                }}
              >
                <Box>
                  <Controller
                    name='category'
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.category}>
                        <InputLabel>Asset Category</InputLabel>
                        <Select
                          {...field}
                          label='Asset Category'
                          disabled={loading || loadingData}
                          onChange={e => {
                            field.onChange(e);
                            setValue('subcategory', ''); // Reset subcategory when category changes
                          }}
                          MenuProps={{
                            PaperProps: {
                              style: {
                                maxHeight: 300,
                              },
                            },
                          }}
                        >
                          {categories.map(category => (
                            <MenuItem key={category.id} value={category.id}>
                              <Typography variant='body1' fontWeight={500}>
                                {category.name}
                              </Typography>
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.category && (
                          <Typography
                            variant='caption'
                            color='error'
                            sx={{ mt: 0.5, ml: 1.75 }}
                          >
                            {errors.category.message}
                          </Typography>
                        )}
                        {!errors.category && (
                          <Typography
                            variant='caption'
                            color='text.secondary'
                            sx={{ mt: 0.5, ml: 1.75 }}
                          >
                            Select the asset category you need
                          </Typography>
                        )}
                      </FormControl>
                    )}
                  />
                </Box>

                {/* Subcategory selection - only show if a category with subcategories is selected */}
                {selectedCategoryId && subcategories.length > 0 && (
                    <Box>
                      <Controller
                        name='subcategory'
                        control={control}
                        render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel>Subcategory</InputLabel>
                            <Select
                              {...field}
                              label='Subcategory'
                              disabled={loading || loadingData || !selectedCategoryId}
                              MenuProps={{
                                PaperProps: {
                                  style: {
                                    maxHeight: 300,
                                  },
                                },
                              }}
                            >
                              {subcategories.map(subcategory => (
                                  <MenuItem
                                    key={subcategory.id}
                                    value={subcategory.id}
                                  >
                                    <Box>
                                      <Typography variant='body2'>
                                        {subcategory.name}
                                      </Typography>
                                      {subcategory.description && (
                                        <Typography
                                          variant='caption'
                                          color='text.secondary'
                                        >
                                          {subcategory.description}
                                        </Typography>
                                      )}
                                    </Box>
                                  </MenuItem>
                                ))}
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Box>
                  )}

                <Box>
                  <Controller
                    name='remarks'
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label='Remarks (Optional)'
                        multiline
                        rows={3}
                        placeholder='Please provide details about why you need this asset...'
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
              variant='outlined'
              disabled={loading}
              sx={{ minWidth: 80 }}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              variant='contained'
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
        title='Delete Request'
        message={`Are you sure you want to delete your request for "${requestToCancel?.category.name}"? This action cannot be undone.`}
        confirmText='Delete Request'
        onConfirm={handleConfirmCancel}
        onCancel={() => setIsCancelDialogOpen(false)}
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

export default AssetRequests;
