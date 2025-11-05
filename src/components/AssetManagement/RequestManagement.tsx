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
  Avatar,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Stack,
  Pagination,
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  MoreVert as MoreVertIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import type {
  AssetRequest,
  Asset,
  AssetCategory,
  AssetStatus,
} from '../../types/asset';
import {
  assetApi,
  type AssetRequest as ApiAssetRequest,
  type PaginatedResponse,
} from '../../api/assetApi';
import StatusChip from './StatusChip';
import { Snackbar, Alert } from '@mui/material';
import { assetCategories } from '../../Data/assetCategories';

// Extended interface for API asset request response that may include additional fields
interface ApiAssetRequestExtended extends ApiAssetRequest {
  subcategory_name?: string;
  subcategory?: string | {
    name?: string;
    title?: string;
    subcategory_name?: string;
    subcategoryName?: string;
    display_name?: string;
    label?: string;
  };
  subcategoryId?: string;
  subcategoryName?: string;
  subcategory_id?: string;
  rejection_reason?: string | null;
}

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
  action: yup.string().required('Action is required'),
  rejectionReason: yup.string().notRequired(),
  assignedAssetId: yup.string().when('action', {
    is: 'approve',
    then: schema => schema.required('Please select an asset to assign'),
    otherwise: schema => schema.notRequired(),
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

const RequestManagement: React.FC = () => {
  const [requests, setRequests] = useState<AssetRequest[]>([]);
  const [allRequestsForStats, setAllRequestsForStats] = useState<AssetRequest[]>([]); // Store all requests for statistics
  const [statsLoading, setStatsLoading] = useState(true); // Track if stats are being loaded
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AssetRequest | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const initialLoadRef = React.useRef(false); // Track if initial load has been done
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
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null
  );

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
    // setValue,
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

  const transformApiRequests = React.useCallback((apiRequests: ApiAssetRequestExtended[]): AssetRequest[] => {
    return apiRequests.map((apiRequest: ApiAssetRequestExtended) => {
      // Try to find matching category from our comprehensive list
      const matchingCategory = assetCategories.find(
        cat =>
          cat.name.toLowerCase() ===
            apiRequest.asset_category.toLowerCase() ||
          cat.subcategories?.some(
            sub =>
              sub.toLowerCase() ===
              apiRequest.asset_category.toLowerCase()
          )
      );

      // Use asset_category as main category name (no need to split)
      let mainCategoryName = apiRequest.asset_category;
      let subcategoryName = '';
      
      // Check if API response has subcategory information in different possible fields
      if (apiRequest.subcategory_name) {
        subcategoryName = apiRequest.subcategory_name;
      } else if (apiRequest.subcategory) {
        // Handle case where subcategory is an object
        const subcategory = apiRequest.subcategory;
        if (typeof subcategory === 'object' && subcategory !== null) {
          // Try different possible property names for the subcategory name
          subcategoryName = subcategory.name || 
                           subcategory.title || 
                           subcategory.subcategory_name || 
                           subcategory.subcategoryName ||
                           subcategory.display_name ||
                           subcategory.label ||
                           JSON.stringify(subcategory);
        } else {
          subcategoryName = subcategory;
        }
      } else if (apiRequest.subcategoryId && apiRequest.subcategoryName) {
        subcategoryName = apiRequest.subcategoryName;
      } else if (apiRequest.asset_category.includes(' - ')) {
        [mainCategoryName, subcategoryName] = apiRequest.asset_category.split(' - ');
      } else if (apiRequest.asset_category.includes(' / ')) {
        [mainCategoryName, subcategoryName] = apiRequest.asset_category.split(' / ');
      }

      return {
        id: apiRequest.id,
        employeeId: apiRequest.requested_by,
        employeeName: apiRequest.requestedByName || `User ${apiRequest.requested_by}`,
        category: matchingCategory ? {
          id: matchingCategory.id,
          name: matchingCategory.name,
          nameAr: matchingCategory.nameAr,
          description: matchingCategory.description,
          color: matchingCategory.color,
          subcategories: matchingCategory.subcategories,
          // Add the specific item requested
          requestedItem: subcategoryName || undefined
        } : { 
          id: apiRequest.asset_category, 
          name: mainCategoryName, 
          nameAr: apiRequest.asset_category, 
          description: '',
          color: '#757575',
          requestedItem: subcategoryName || undefined
        },
        subcategoryId: apiRequest.subcategory_id || undefined,
        remarks: apiRequest.remarks,
        status: normalizeRequestStatus(apiRequest.status),
        requestedDate: apiRequest.requested_date,
        processedDate: apiRequest.approved_date || undefined,
        processedBy: apiRequest.approved_by || undefined,
        processedByName: apiRequest.approvedByName || (apiRequest.approved_by ? `User ${apiRequest.approved_by}` : undefined),
        rejectionReason: apiRequest.rejection_reason && apiRequest.rejection_reason !== null ? apiRequest.rejection_reason : undefined,
        assignedAssetId: undefined, // Not provided by API
        assignedAssetName: undefined, // Not provided by API
      };
    });
  }, []);

  // Fetch all requests for statistics (without pagination)
  const fetchAllRequestsForStats = React.useCallback(async () => {
    setStatsLoading(true);
    try {
      // Fetch all requests by looping through all pages
      let allApiRequests: ApiAssetRequestExtended[] = [];
      let currentPage = 1;
      let hasMorePages = true;
      const limit = 1000; // Use a high limit per page
      
      while (hasMorePages) {
        const response: PaginatedResponse<ApiAssetRequest> = await assetApi.getAllAssetRequests({
          page: currentPage,
          limit,
        });
        
        const apiRequests = response.items || [];
        const paginationInfo = {
          total: response.total || 0,
          totalPages: response.totalPages || 1,
        };
        
        if (apiRequests && apiRequests.length > 0) {
          allApiRequests = [...allApiRequests, ...(apiRequests as ApiAssetRequestExtended[])];
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
        const transformedRequests = transformApiRequests(allApiRequests);
        setAllRequestsForStats(transformedRequests);
      } else {
        setAllRequestsForStats([]);
      }
    } catch (error) {
      console.error('Failed to fetch all requests for statistics:', error);
      // Don't show snackbar for this as it's a background operation
    } finally {
      setStatsLoading(false);
    }
  }, [transformApiRequests]);

  // Fetch data from API
  const fetchRequests = React.useCallback(async (page: number = 1, limit: number = 25, isInitialLoad: boolean = false) => {
    try {
      // Only show initial loading on very first load, not on pagination or when returning to page 1
      if (isInitialLoad && page === 1) {
        setInitialLoading(true);
      }
      
      // Fetch asset requests with pagination
      const apiResponse: PaginatedResponse<ApiAssetRequest> =
        await assetApi.getAllAssetRequests({
          page,
          limit,
        });

      // Update pagination info from API response immediately - this gives us total count right away
      setPagination(prev => ({
        ...prev,
        total: apiResponse.total || 0,
        totalPages: apiResponse.totalPages || 1,
      }));

      // Transform API requests to component format
      const transformedRequests = transformApiRequests(apiResponse.items as ApiAssetRequestExtended[]);
      
      setRequests(transformedRequests);

        // Fetch assets for assignment - fetch all assets with high limit to get all pages
        // This ensures all available assets are shown in the Assign Asset dropdown
        let allAssets: Record<string, unknown>[] = [];
        let currentPage = 1;
        let hasMorePages = true;
        const maxPages = 50; // Safety limit to prevent infinite loops
        
        while (hasMorePages && currentPage <= maxPages) {
          const apiAssetsResponse = await assetApi.getAllAssets({
            page: currentPage,
            limit: 100, // Use a high limit to fetch more assets per page
          });
          
          if (apiAssetsResponse.assets && apiAssetsResponse.assets.length > 0) {
            allAssets = [...allAssets, ...apiAssetsResponse.assets];
            
            // Check if there are more pages
            const totalPages = apiAssetsResponse.pagination?.totalPages || 1;
            hasMorePages = currentPage < totalPages;
            currentPage++;
          } else {
            hasMorePages = false;
          }
        }

        const transformedAssets: Asset[] = allAssets.map(
          (apiAsset: Record<string, unknown>) => {
            // Try to find matching category from our comprehensive list
            const matchingCategory = assetCategories.find(
              cat =>
                cat.name.toLowerCase() ===
                  (apiAsset.category as string).toLowerCase() ||
                cat.subcategories?.some(
                  sub =>
                    sub.toLowerCase() ===
                    (apiAsset.category as string).toLowerCase()
                )
            );

            return {
              id: apiAsset.id as string,
              name: apiAsset.name as string,
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
                    id: apiAsset.category as string,
                    name: apiAsset.category as string,
                    nameAr: apiAsset.category as string,
                    description: '',
                    color: '#757575',
                  },
              status: apiAsset.status as AssetStatus,
              assignedTo: apiAsset.assigned_to as string | undefined,
              assignedToName: undefined,
              serialNumber: '',
              purchaseDate: apiAsset.purchase_date as string,
              location: '',
              description: '',
              createdAt: apiAsset.created_at as string,
              updatedAt: apiAsset.created_at as string,
              subcategoryId: (apiAsset.subcategoryId || apiAsset.subcategory_id) as string | undefined,
            };
          }
        );

        setAssets(transformedAssets);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        showSnackbar('Failed to load data', 'error');
      } finally {
        // Only set initial loading to false on very first load
        if (isInitialLoad && page === 1) {
          setInitialLoading(false);
        }
      }
    }, [transformApiRequests]);

  // Initial load: fetch stats FIRST, then paginated requests
  React.useEffect(() => {
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
  }, []); // Only run on initial mount

  // Handle page changes: only fetch paginated requests, not stats
  React.useEffect(() => {
    if (!initialLoadRef.current) return; // Don't fetch if initial load hasn't happened
    
    // Only fetch paginated requests when page changes, not stats
    // Stats are already loaded and don't need to be refreshed on page change
    if (pagination.page > 0) {
      fetchRequests(pagination.page, pagination.limit, false);
    }
  }, [pagination.page, pagination.limit, fetchRequests]);

  // Filter requests
  const filteredRequests = useMemo(() => {
    if (!searchTerm) return requests;

    return requests.filter(
      request =>
        request.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.category.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        request.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [requests, searchTerm]);

  // Get available assets for the selected category
  const availableAssets = useMemo(() => {
    if (!selectedRequest) return [];

    const filtered = assets.filter(asset => {
      // Check if asset status is available
      if (asset.status !== 'available') {
        return false;
      }

      // If request has a subcategoryId, ONLY match assets with the exact same subcategoryId
      if (selectedRequest.subcategoryId) {
        // Exact subcategory ID match required
        if (asset.subcategoryId === selectedRequest.subcategoryId) {
          return true;
        }
        // If subcategoryId doesn't match, reject this asset
        return false;
      }

      // If no subcategoryId in request, fall back to category name matching
      // Get the request category name
      const requestCategoryName = selectedRequest.category.name;

      // Direct category name match
      if (asset.category.name === requestCategoryName) {
        return true;
      }

      // Check if the request has subcategory format (e.g., "IT Equipment - Laptop")
      if (requestCategoryName.includes(' - ')) {
        const mainCategoryName = requestCategoryName.split(' - ')[0];
        if (asset.category.name === mainCategoryName) {
          return true;
        }
      }

      // If request category is a main category, check if asset category matches
      // This handles cases where asset might be in a subcategory but request is for main category
      const mainCategories = [
        'IT Equipment',
        'Software & Licenses',
        'Office Equipment',
        'Mobility / Transport',
        'Employee Accessories',
        'Facility Assets',
        'Health & Safety',
        'Miscellaneous / Custom',
      ];

      if (mainCategories.includes(requestCategoryName)) {
        // Check if asset category starts with the main category
        if (asset.category.name.startsWith(requestCategoryName)) {
          return true;
        }
      }

      return false;
    });

    return filtered;
  }, [assets, selectedRequest]);

  // Filter by tab
  const getFilteredRequestsByTab = (statusFilter?: string) => {
    if (!statusFilter) return filteredRequests;
    return filteredRequests.filter(request => request.status === statusFilter);
  };

  const handleProcessRequest = (request: AssetRequest) => {
    setSelectedRequest(request);
    setIsProcessModalOpen(true);
    reset({
      action: request.status === 'approved' ? 'approve' : '',
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

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    requestId: string
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedRequestId(requestId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRequestId(null);
  };

  const handleProcessSubmit = async (data: Record<string, unknown>) => {
    if (!selectedRequest) return;

    setLoading(true);
    try {
      if (data.action === 'approve') {
        // Validate that we have a valid asset ID
        if (!data.assignedAssetId) {
          throw new Error('No asset selected for assignment');
        }

        // Check if the selected asset is actually in our available assets list
        const selectedAsset = availableAssets.find(
          asset => asset.id === data.assignedAssetId
        );
        if (!selectedAsset) {
          console.error('Selected asset not found in available assets:', {
            selectedAssetId: data.assignedAssetId,
            availableAssets: availableAssets.map(a => ({
              id: a.id,
              name: a.name,
              category: a.category.name,
              subcategoryId: a.subcategoryId,
              status: a.status,
            })),
          });
          throw new Error(
            'Selected asset is not available or not in the correct category'
          );
        }

        // Validate subcategory ID match if request has subcategoryId
        if (selectedRequest.subcategoryId) {
          if (selectedAsset.subcategoryId !== selectedRequest.subcategoryId) {
            throw new Error(
              `The selected asset does not match the requested subcategory. Requested subcategory ID: ${selectedRequest.subcategoryId}, Asset subcategory ID: ${selectedAsset.subcategoryId || 'none'}`
            );
          }
        }

        // Try with asset_id and employee_id
        const payload = {
          asset_id: data.assignedAssetId as string,
          employee_id: selectedRequest.employeeId,
          request_id: selectedRequest.id,
          category: selectedRequest.category.name,
          subcategory_id: selectedRequest.subcategoryId || undefined,
        };

        // Try to fetch the asset details from backend to verify it exists and is available
        try {
          const assetDetails = await assetApi.getAssetById(selectedAsset.id);

          if (assetDetails.status !== 'available') {
            console.error('Asset status mismatch:', {
              frontendStatus: selectedAsset.status,
              backendStatus: assetDetails.status,
            });
            throw new Error(
              `Asset is not available in backend. Frontend status: ${selectedAsset.status}, Backend status: ${assetDetails.status}`
            );
          }

          if (
            assetDetails.category !== selectedRequest.category.name &&
            !assetDetails.category.includes('Mobility') &&
            !selectedRequest.category.name.includes('Mobility')
          ) {
            console.warn('Category mismatch detected:', {
              requestCategory: selectedRequest.category.name,
              assetCategory: assetDetails.category,
            });
          }

          // Validate subcategory ID match if request has subcategoryId
          if (selectedRequest.subcategoryId) {
            const backendSubcategoryId = assetDetails.subcategoryId || assetDetails.subcategory_id;
            if (backendSubcategoryId !== selectedRequest.subcategoryId) {
              throw new Error(
                `The asset does not match the requested subcategory. Requested subcategory ID: ${selectedRequest.subcategoryId}, Asset subcategory ID: ${backendSubcategoryId || 'none'}`
              );
            }
          }
        } catch (assetFetchError: unknown) {
          console.error(
            'Failed to fetch asset details from backend:',
            assetFetchError
          );
          const errorMessage =
            assetFetchError instanceof Error
              ? assetFetchError.message
              : 'Unknown error occurred';
          console.error('Error details:', errorMessage);
          throw new Error(
            `Asset ${selectedAsset.id} not found in backend or not accessible: ${errorMessage}`
          );
        }

        try {
          await assetApi.approveAssetRequest(selectedRequest.id, payload);
          
          // Update local state immediately with approval details
          setRequests(prevRequests => 
            prevRequests.map(request => 
              request.id === selectedRequest.id 
                ? { 
                    ...request, 
                    status: 'approved' as const,
                    assignedAssetId: data.assignedAssetId as string,
                    assignedAssetName: selectedAsset.name,
                    processedDate: new Date().toISOString().split('T')[0],
                    processedBy: 'current-user', // You might want to get this from auth context
                    processedByName: 'Current User' // You might want to get this from auth context
                  }
                : request
            )
          );
          
          // Refresh all requests for statistics
          fetchAllRequestsForStats();
          
          // Show success message with asset assignment details
          showSnackbar(`Asset "${selectedAsset.name}" has been assigned to ${selectedRequest.employeeName} successfully!`, 'success');
          
          // Close modal and return early for approval - no need to refresh from API
          setIsProcessModalOpen(false);
          setLoading(false);
          return;
        } catch (approvalError: unknown) {
          console.error('❌ Approval failed:', approvalError);
          showSnackbar('Failed to approve request', 'error');
          setLoading(false);
          return;
        }
      } else if (data.action === 'reject') {
        try {
          await assetApi.rejectAssetRequest(selectedRequest.id, data.rejectionReason as string);
          
          // Update local state immediately with rejection reason
          setRequests(prevRequests => 
            prevRequests.map(request => 
              request.id === selectedRequest.id 
                ? { 
                    ...request, 
                    status: 'rejected' as const,
                    rejectionReason: data.rejectionReason as string,
                    processedDate: new Date().toISOString().split('T')[0],
                    processedBy: 'current-user', // You might want to get this from auth context
                    processedByName: 'Current User' // You might want to get this from auth context
                  }
                : request
            )
          );
          
          // Refresh all requests for statistics
          fetchAllRequestsForStats();
          
          showSnackbar(`Request from ${selectedRequest.employeeName} has been rejected successfully`, 'success');
          
          // Close modal and return early for rejection - no need to refresh from API
          setIsProcessModalOpen(false);
          setLoading(false);
          return;
        } catch (rejectError) {
          console.error('❌ Rejection failed:', rejectError);
          showSnackbar('Failed to reject request', 'error');
          setLoading(false);
          return;
        }
      }

      // Refresh data from API (only for approval/assignment actions)
      const apiResponse: PaginatedResponse<ApiAssetRequest> = await assetApi.getAllAssetRequests({
        page: pagination.page,
        limit: pagination.limit,
      });
      
      
      // Refresh assets to reflect assignment status - fetch all assets with pagination
      let allAssets: Record<string, unknown>[] = [];
      let currentPage = 1;
      let hasMorePages = true;
      const maxPages = 50; // Safety limit to prevent infinite loops
      
      while (hasMorePages && currentPage <= maxPages) {
        const apiAssetsResponse = await assetApi.getAllAssets({
          page: currentPage,
          limit: 100, // Use a high limit to fetch more assets per page
        });
        
        if (apiAssetsResponse.assets && apiAssetsResponse.assets.length > 0) {
          allAssets = [...allAssets, ...apiAssetsResponse.assets];
          
          // Check if there are more pages
          const totalPages = apiAssetsResponse.pagination?.totalPages || 1;
          hasMorePages = currentPage < totalPages;
          currentPage++;
        } else {
          hasMorePages = false;
        }
      }
      
      const transformedAssets: Asset[] = allAssets.map(
        (apiAsset: Record<string, unknown>) => {
          // Try to find matching category from our comprehensive list
          const matchingCategory = assetCategories.find(
            cat =>
              cat.name.toLowerCase() ===
                (apiAsset.category as string).toLowerCase() ||
              cat.subcategories?.some(
                sub =>
                  sub.toLowerCase() ===
                  (apiAsset.category as string).toLowerCase()
              )
          );

          return {
            id: apiAsset.id as string,
            name: apiAsset.name as string,
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
                  id: apiAsset.category as string,
                  name: apiAsset.category as string,
                  nameAr: apiAsset.category as string,
                  description: '',
                  color: '#757575',
                  subcategories: [],
                },
            status: apiAsset.status as AssetStatus,
            assignedTo: (apiAsset.assigned_to as string) || undefined,
            assignedToName: (apiAsset.assigned_to_name as string) || undefined,
            serialNumber: '',
            purchaseDate: apiAsset.purchase_date as string,
            location: '',
            description: '',
            createdAt: apiAsset.created_at as string,
            updatedAt: apiAsset.updated_at as string || apiAsset.created_at as string,
            subcategoryId: (apiAsset.subcategoryId || apiAsset.subcategory_id) as string | undefined,
          };
        }
      );

      setAssets(transformedAssets);

      const transformedRequests: AssetRequest[] = apiResponse.items.map(
        (apiRequest: ApiAssetRequest) => {
          // Try to find matching category from our comprehensive list
          let matchingCategory = assetCategories.find(
            cat =>
              cat.name.toLowerCase() ===
                apiRequest.asset_category.toLowerCase() ||
              cat.subcategories?.some(
                sub =>
                  sub.toLowerCase() === apiRequest.asset_category.toLowerCase()
              )
          );

          // If no direct match, try to match subcategory format (e.g., "Mobility / Transport - Fuel Card")
          if (!matchingCategory && apiRequest.asset_category.includes(' - ')) {
            const [mainCategoryName, subcategoryName] =
              apiRequest.asset_category.split(' - ');
            matchingCategory = assetCategories.find(
              cat =>
                cat.name.toLowerCase() === mainCategoryName.toLowerCase() &&
                cat.subcategories?.some(
                  sub => sub.toLowerCase() === subcategoryName.toLowerCase()
                )
            );
          }

          // Use asset_category as main category name (no need to split)
          const mainCategoryName = apiRequest.asset_category;
          const subcategoryName = '';

          return {
            id: apiRequest.id,
            employeeId: apiRequest.requested_by,
            employeeName:
              apiRequest.requestedByName || `User ${apiRequest.requested_by}`,
            category: matchingCategory
              ? {
                  id: matchingCategory.id,
                  name: matchingCategory.name,
                  nameAr: matchingCategory.nameAr,
                  description: matchingCategory.description,
                  color: matchingCategory.color,
                  subcategories: matchingCategory.subcategories,
                  // Add the specific item requested
                  requestedItem: subcategoryName || apiRequest.asset_category,
                }
              : {
                  id: apiRequest.asset_category,
                  name: mainCategoryName,
                  nameAr: apiRequest.asset_category,
                  description: '',
                  color: '#757575',
                  requestedItem: subcategoryName || apiRequest.asset_category,
                },
            remarks: apiRequest.remarks,
            status: normalizeRequestStatus(apiRequest.status),
            requestedDate: apiRequest.requested_date,
            processedDate: apiRequest.approved_date || undefined,
            processedBy: apiRequest.approved_by || undefined,
            processedByName:
              apiRequest.approvedByName ||
              (apiRequest.approved_by
                ? `User ${apiRequest.approved_by}`
                : undefined),
            rejectionReason: undefined,
            assignedAssetId: undefined,
            assignedAssetName: undefined,
          };
        }
      );

      setRequests(transformedRequests);

      // Update pagination info from API response
      setPagination(prev => ({
        ...prev,
        total: apiResponse.total || 0,
        totalPages: apiResponse.totalPages || 1,
      }));

      setIsProcessModalOpen(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Failed to process request:', error);
      showSnackbar('Failed to process request', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    page: number
  ) => {
    // Page change is not initial load, so pass false
    setPagination(prev => ({ ...prev, page }));
  };

  const getStatusCounts = () => {
    // Always use pagination.total for total count (available immediately from first API call)
    // For status counts, ONLY use allRequestsForStats once it's loaded
    // Don't show incorrect counts from current page requests
    // This ensures we show correct counts immediately when page loads
    if (allRequestsForStats.length > 0) {
      // Use allRequestsForStats for accurate counts across all pages
      return {
        all: pagination.total || allRequestsForStats.length,
        pending: allRequestsForStats.filter(r => r.status === 'pending').length,
        approved: allRequestsForStats.filter(r => r.status === 'approved').length,
        rejected: allRequestsForStats.filter(r => r.status === 'rejected').length,
      };
    }
    
    // If allRequestsForStats is not loaded yet, show total from pagination but show 0 for status counts
    // This prevents showing incorrect counts (like 25 when it should be 26)
    return {
      all: pagination.total || 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    };
  };

  const statusCounts = getStatusCounts();

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
            {request.employeeName.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant='body2' fontWeight={500}>
              {request.employeeName}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {request.category.name}
            </Typography>
            {(request.category as AssetCategory & { requestedItem?: string })
              .requestedItem &&
              (request.category as AssetCategory & { requestedItem?: string })
                .requestedItem !== request.category.name && (
                <Typography
                  variant='caption'
                  color='primary.main'
                  sx={{ display: 'block', fontWeight: 500 }}
                >
                  {`${(request.category as AssetCategory & { requestedItem?: string }).requestedItem}`}
                </Typography>
              )}
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <StatusChip status={request.status} type='request' />
      </TableCell>
      <TableCell>
        {new Date(request.requestedDate).toLocaleDateString()}
      </TableCell>
      <TableCell>
        {request.remarks && (
          <Tooltip title={request.remarks} arrow>
            <Typography
              variant='body2'
              sx={{
                maxWidth: 200,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {request.remarks}
            </Typography>
          </Tooltip>
        )}
      </TableCell>
      <TableCell>
        {request.rejectionReason && request.rejectionReason !== null && request.rejectionReason.trim() !== '' && (
          <Typography variant="body2" color="text.primary">
            {request.rejectionReason}
          </Typography>
        )}
      </TableCell>
      <TableCell align='right'>
        <IconButton onClick={e => handleMenuClick(e, request.id)} size='small'>
          <MoreVertIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl) && selectedRequestId === request.id}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleViewRequest(request)}>
            <ListItemIcon>
              <ViewIcon fontSize='small' />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
          {request.status === 'pending' && (
            <MenuItem onClick={() => handleProcessRequest(request)}>
              <ListItemIcon>
                <AssignmentIcon fontSize='small' />
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
          Asset Request Management
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
        <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
          <Card>
            <CardContent>
              <Typography color='textSecondary' gutterBottom>
                Total Requests
              </Typography>
              <Typography variant='h4' fontWeight={600}>
                {statusCounts.all}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
          <Card>
            <CardContent>
              <Typography color='textSecondary' gutterBottom>
                Pending
              </Typography>
              <Typography variant='h4' fontWeight={600} color='warning.main'>
                {statusCounts.pending}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
          <Card>
            <CardContent>
              <Typography color='textSecondary' gutterBottom>
                Approved
              </Typography>
              <Typography variant='h4' fontWeight={600} color='success.main'>
                {statusCounts.approved}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
          <Card>
            <CardContent>
              <Typography color='textSecondary' gutterBottom>
                Rejected
              </Typography>
              <Typography variant='h4' fontWeight={600} color='error.main'>
                {statusCounts.rejected}
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
            placeholder='Search requests by employee, category, or status...'
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
            <Tab label='Pending Approval' />
            <Tab label='Approved' />
            <Tab label='Rejected' />
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
                  <TableCell>Rejection Reason</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredRequestsByTab().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
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
                  <TableCell>Employee & Asset</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Requested Date</TableCell>
                  <TableCell>Remarks</TableCell>
                  <TableCell>Rejection Reason</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredRequestsByTab('pending').length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
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
                  <TableCell>Employee & Asset</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Requested Date</TableCell>
                  <TableCell>Remarks</TableCell>
                  <TableCell>Rejection Reason</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredRequestsByTab('approved').length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
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
                  <TableCell>Employee & Asset</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Requested Date</TableCell>
                  <TableCell>Remarks</TableCell>
                  <TableCell>Rejection Reason</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredRequestsByTab('rejected').length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
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
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          mt: 3
        }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={handlePageChange}
            color='primary'
            disabled={initialLoading}
          />
        </Box>
      )}

      {/* Process Request Modal */}
      <Dialog
        open={isProcessModalOpen}
        onClose={() => setIsProcessModalOpen(false)}
        maxWidth='sm'
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle>
          <Typography variant='h6' fontWeight={600}>
            {selectedRequest?.status === 'approved'
              ? 'Assign Asset'
              : 'Process Asset Request'}
          </Typography>
          {selectedRequest && (
            <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
              {selectedRequest.employeeName} - {selectedRequest.category.name}
              {(
                selectedRequest.category as AssetCategory & {
                  requestedItem?: string;
                }
              ).requestedItem &&
                (
                  selectedRequest.category as AssetCategory & {
                    requestedItem?: string;
                  }
                ).requestedItem !== selectedRequest.category.name && (
                  <span style={{ color: '#1976d2', fontWeight: 500 }}>
                    {' '}
                    -{' '}
                    {
                      (
                        selectedRequest.category as AssetCategory & {
                          requestedItem?: string;
                        }
                      ).requestedItem
                    }
                  </span>
                )}
            </Typography>
          )}
        </DialogTitle>

        <form onSubmit={handleSubmit(handleProcessSubmit)}>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 2,
                  flexDirection: 'column',
                }}
              >
                {selectedRequest?.status !== 'approved' && (
                  <Box>
                    <Controller
                      name='action'
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.action}>
                          <InputLabel>Action</InputLabel>
                          <Select {...field} label='Action' disabled={loading}>
                            <MenuItem value='approve'>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                }}
                              >
                                <ApproveIcon color='success' />
                                Approve Request
                              </Box>
                            </MenuItem>
                            <MenuItem value='reject'>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                }}
                              >
                                <RejectIcon color='error' />
                                Reject Request
                              </Box>
                            </MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Box>
                )}

                {(selectedAction === 'approve' ||
                  selectedRequest?.status === 'approved') && (
                  <Box>
                    <Controller
                      name='assignedAssetId'
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.assignedAssetId}>
                          <InputLabel>Assign Asset</InputLabel>
                          <Select
                            {...field}
                            label='Assign Asset'
                            disabled={loading || availableAssets.length === 0}
                          >
                            {availableAssets.length === 0 ? (
                              <MenuItem disabled>
                                No available assets found
                              </MenuItem>
                            ) : (
                              availableAssets.map(asset => (
                                <MenuItem key={asset.id} value={asset.id}>
                                  <Box>
                                    <Typography
                                      variant='body2'
                                      fontWeight={500}
                                    >
                                      {asset.name}
                                    </Typography>
                                    <Typography
                                      variant='caption'
                                      color='text.secondary'
                                    >
                                      {asset.category.name} - {asset.status}
                                    </Typography>
                                  </Box>
                                </MenuItem>
                              ))
                            )}
                          </Select>
                        </FormControl>
                      )}
                    />
                    {availableAssets.length === 0 && (
                      <Alert severity='error' sx={{ mt: 1 }}>
                        <Typography variant='body2'>
                          <strong>
                            No available assets
                          </strong>
                        </Typography>
                      </Alert>
                    )}
                  </Box>
                )}

                {selectedAction === 'reject' &&
                  selectedRequest?.status !== 'approved' && (
                    <Box>
                      <Controller
                        name='rejectionReason'
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label='Rejection Reason (Optional)'
                            multiline
                            rows={3}
                            placeholder='Optionally provide a reason for rejection...'
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
                    <Alert severity='info'>
                      <Typography variant='body2'>
                        <strong>Employee Remarks:</strong>{' '}
                        {selectedRequest.remarks}
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
              variant='outlined'
              disabled={loading}
              sx={{ minWidth: 80 }}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              variant='contained'
              disabled={
                loading ||
                (selectedAction === 'approve' && availableAssets.length === 0)
              }
              sx={{ minWidth: 80 }}
            >
              {loading
                ? 'Processing...'
                : selectedRequest?.status === 'approved'
                  ? 'Assign Asset'
                  : selectedAction === 'approve'
                    ? 'Approve'
                    : 'Reject'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Details Modal */}
      <Dialog
        open={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        maxWidth='md'
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
                  <Card variant='outlined' sx={{ p: 2, height: '100%' }}>
                    <Typography variant='h6' gutterBottom color='primary'>
                      Employee Information
                    </Typography>
                    <Box
                      sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                    >
                      <Typography variant='body2'>
                        <strong>Name:</strong> {selectedRequest.employeeName}
                      </Typography>
                    </Box>
                  </Card>
                </Box>

                {/* Request Information */}
                <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                  <Card variant='outlined' sx={{ p: 2, height: '100%' }}>
                    <Typography variant='h6' gutterBottom color='primary'>
                      Request Information
                    </Typography>
                    <Box
                      sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                    >
                      <Typography variant='body2'>
                        <strong>Category:</strong>{' '}
                        {selectedRequest.category.name}
                      </Typography>
                      <Typography variant='body2'>
                        <strong>Status:</strong>
                        <Box component='span' sx={{ ml: 1 }}>
                          <StatusChip
                            status={selectedRequest.status}
                            type='request'
                          />
                        </Box>
                      </Typography>
                      <Typography variant='body2'>
                        <strong>Requested Date:</strong>{' '}
                        {new Date(
                          selectedRequest.requestedDate
                        ).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Card>
                </Box>

                {/* Remarks */}
                {selectedRequest.remarks && (
                  <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                    <Card variant='outlined' sx={{ p: 2 }}>
                      <Typography variant='h6' gutterBottom color='primary'>
                        Employee Remarks
                      </Typography>
                      <Typography
                        variant='body2'
                        sx={{ fontStyle: 'italic', color: 'text.secondary' }}
                      >
                        "{selectedRequest.remarks}"
                      </Typography>
                    </Card>
                  </Box>
                )}

                {/* Processing Information */}
                {(selectedRequest.processedDate ||
                  selectedRequest.assignedAssetName ||
                  selectedRequest.rejectionReason) && (
                  <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                    <Card variant='outlined' sx={{ p: 2 }}>
                      <Typography variant='h6' gutterBottom color='primary'>
                        Processing Information
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1,
                        }}
                      >
                        {selectedRequest.processedDate && (
                          <Typography variant='body2'>
                            <strong>Processed Date:</strong>{' '}
                            {new Date(
                              selectedRequest.processedDate
                            ).toLocaleDateString()}
                          </Typography>
                        )}
                        {selectedRequest.processedByName && (
                          <Typography variant='body2'>
                            <strong>Processed By:</strong>{' '}
                            {selectedRequest.processedByName}
                          </Typography>
                        )}
                        {selectedRequest.assignedAssetName && (
                          <Alert severity='success' sx={{ mt: 1 }}>
                            <Typography variant='body2'>
                              <strong>Assigned Asset:</strong>{' '}
                              {selectedRequest.assignedAssetName}
                            </Typography>
                          </Alert>
                        )}
                        {selectedRequest.rejectionReason && selectedRequest.rejectionReason !== null && selectedRequest.rejectionReason.trim() !== '' && (
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
            variant='contained'
            sx={{ minWidth: 80 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

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

export default RequestManagement;
