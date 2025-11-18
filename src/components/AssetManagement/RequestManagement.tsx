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
import type { AxiosError } from 'axios';

// Extended interface for API asset request response that may include additional fields
interface ApiAssetRequestExtended extends ApiAssetRequest {
  category_id?: string;
  subcategory_id?: string | null;
  category?: {
    id: string;
    name: string;
    description?: string | null;
    icon?: string | null;
  };
  subcategory?: {
    id: string;
    name: string;
    description?: string | null;
  };
  subcategory_name?: string;
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
  requestedByName?: string;
  requestedByUser?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
  };
  approvedByName?: string;
  approvedByUser?: {
    id: string;
    name: string;
    email: string;
  };
  // Legacy field for backward compatibility
  asset_category?: string;
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
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AssetRequest | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const initialLoadRef = React.useRef(false); // Track if initial load has been done
  const fetchingRef = React.useRef(false); // Track if fetch is in progress to prevent duplicate calls
  const lastFetchedPageRef = React.useRef<{ page: number; limit: number } | null>(null); // Track last fetched page/limit
  const assetsFetchedRef = React.useRef(false); // Track if assets have been fetched
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
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null
  );

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25, // Backend returns 25 records per page
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

  const transformApiRequests = React.useCallback(
    (apiRequests: ApiAssetRequestExtended[]): AssetRequest[] => {
      return apiRequests.map((apiRequest: ApiAssetRequestExtended) => {
        // Handle new API response structure with category_id and category object
        const categoryId =
          apiRequest.category_id || apiRequest.asset_category || '';
        const subcategoryId = apiRequest.subcategory_id || undefined;

        // Get category name from API response category object
        let mainCategoryName = '';
        if (
          apiRequest.category &&
          typeof apiRequest.category === 'object' &&
          apiRequest.category !== null
        ) {
          mainCategoryName = apiRequest.category.name || categoryId;
        } else if (apiRequest.asset_category) {
          mainCategoryName = apiRequest.asset_category;
        } else {
          mainCategoryName = categoryId;
        }

        // Get subcategory name from API response subcategory object
        let subcategoryName = '';
        if (apiRequest.subcategory) {
          if (
            typeof apiRequest.subcategory === 'object' &&
            apiRequest.subcategory !== null
          ) {
            subcategoryName =
              apiRequest.subcategory.name || apiRequest.subcategoryName || '';
          } else {
            subcategoryName = apiRequest.subcategory || '';
          }
        } else if (apiRequest.subcategoryName) {
          subcategoryName = apiRequest.subcategoryName;
        } else if (apiRequest.subcategory_name) {
          subcategoryName = apiRequest.subcategory_name;
        }

        // Get employee name from API response
        let employeeName = '';
        if (apiRequest.requestedByName) {
          employeeName = apiRequest.requestedByName;
        } else if (
          apiRequest.requestedByUser &&
          apiRequest.requestedByUser.name
        ) {
          employeeName = apiRequest.requestedByUser.name;
        } else if (apiRequest.requested_by) {
          employeeName = `User ${apiRequest.requested_by}`;
        }

        return {
          id: apiRequest.id,
          employeeId: apiRequest.requested_by,
          employeeName: employeeName,
          category: {
            id: categoryId,
            name: mainCategoryName,
            nameAr: mainCategoryName,
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
            (apiRequest.approved_by
              ? `User ${apiRequest.approved_by}`
              : undefined),
          rejectionReason:
            apiRequest.rejection_reason && apiRequest.rejection_reason !== null
              ? apiRequest.rejection_reason
              : undefined,
          assignedAssetId: undefined, // Not provided by API
          assignedAssetName: undefined, // Not provided by API
        };
      });
    },
    []
  );

  // Removed fetchAllRequestsForStats - using counts from API response instead
  const [statusCounts, setStatusCounts] = useState<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  }>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  }); // Store counts from API response

  // Fetch assets separately (only once, not on every request fetch)
  const fetchAssets = React.useCallback(async () => {
    if (assetsFetchedRef.current) return; // Already fetched
    
    try {
      assetsFetchedRef.current = true;
      
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
          // Extract category name from API response
          // Category can be an object { id, name, ... } or a string
          let categoryName = '';
          let categoryId = '';
          
          if (apiAsset.category && typeof apiAsset.category === 'object' && apiAsset.category !== null) {
            const categoryObj = apiAsset.category as { id?: string; name?: string };
            categoryName = categoryObj.name || '';
            categoryId = categoryObj.id || apiAsset.category_id as string || '';
          } else if (apiAsset.categoryName) {
            categoryName = apiAsset.categoryName as string;
            categoryId = apiAsset.category_id as string || '';
          } else if (typeof apiAsset.category === 'string') {
            categoryName = apiAsset.category;
            categoryId = apiAsset.category_id as string || apiAsset.category as string;
          } else {
            categoryName = apiAsset.categoryName as string || '';
            categoryId = apiAsset.category_id as string || '';
          }

          // Try to find matching category from our comprehensive list
          const matchingCategory = assetCategories.find(
            cat =>
              cat.name.toLowerCase() === categoryName.toLowerCase() ||
              cat.subcategories?.some(
                sub =>
                  sub.toLowerCase() === categoryName.toLowerCase()
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
                  id: categoryId,
                  name: categoryName,
                  nameAr: categoryName,
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
            subcategoryId: (apiAsset.subcategoryId ||
              apiAsset.subcategory_id) as string | undefined,
          };
        }
      );

      setAssets(transformedAssets);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
      assetsFetchedRef.current = false; // Reset on error so it can retry
    }
  }, []);

  // Fetch data from API
  const fetchRequests = React.useCallback(
    async (
      page: number = 1,
      limit: number = 25,
      isInitialLoad: boolean = false
    ) => {
      // Prevent duplicate calls
      if (fetchingRef.current) {
        return;
      }

      try {
        fetchingRef.current = true;
        
        if (isInitialLoad && page === 1) {
          setInitialLoading(true);
        }

        const apiResponse: PaginatedResponse<ApiAssetRequest> =
          await assetApi.getAllAssetRequests({
            page,
            limit,
          });

        const hasMorePages = (apiResponse.items || []).length === limit;

        // Use backend pagination info if available, otherwise estimate
        if (apiResponse.total && apiResponse.totalPages) {
          setPagination(prev => ({
            ...prev,
            total: apiResponse.total || 0,
            totalPages: apiResponse.totalPages || 1,
          }));
        } else {
          const estimatedTotal = hasMorePages
            ? page * limit
            : (page - 1) * limit + (apiResponse.items || []).length;
          const estimatedTotalPages = hasMorePages ? page + 1 : page;

          setPagination(prev => ({
            ...prev,
            total: estimatedTotal,
            totalPages: estimatedTotalPages,
          }));
        }

        const transformedRequests = transformApiRequests(
          (apiResponse.items || []) as ApiAssetRequestExtended[]
        );

        setRequests(transformedRequests);

        let allAssets: Record<string, unknown>[] = [];
        let assetCurrentPage = 1;
        let assetsHasMorePages = true;
        const maxPages = 50; // Safety limit to prevent infinite loops

        while (assetsHasMorePages && assetCurrentPage <= maxPages) {
          const apiAssetsResponse = await assetApi.getAllAssets({
            page: assetCurrentPage,
            limit: 100, // Use a high limit to fetch more assets per page
          });

          if (apiAssetsResponse.assets && apiAssetsResponse.assets.length > 0) {
            allAssets = [...allAssets, ...apiAssetsResponse.assets];

            // Check if there are more pages
            const totalPages = apiAssetsResponse.pagination?.totalPages || 1;
            assetsHasMorePages = assetCurrentPage < totalPages;
            assetCurrentPage++;
          } else {
            assetsHasMorePages = false;
          }
        }

        const transformedAssets: Asset[] = allAssets.map(
          (apiAsset: Record<string, unknown>) => {
            // Extract category name from API response
            // Category can be an object { id, name, ... } or a string
            let categoryName = '';
            let categoryId = '';

            if (
              apiAsset.category &&
              typeof apiAsset.category === 'object' &&
              apiAsset.category !== null
            ) {
              const categoryObj = apiAsset.category as {
                id?: string;
                name?: string;
              };
              categoryName = categoryObj.name || '';
              categoryId =
                categoryObj.id || (apiAsset.category_id as string) || '';
            } else if (apiAsset.categoryName) {
              categoryName = apiAsset.categoryName as string;
              categoryId = (apiAsset.category_id as string) || '';
            } else if (typeof apiAsset.category === 'string') {
              categoryName = apiAsset.category;
              categoryId =
                (apiAsset.category_id as string) ||
                (apiAsset.category as string);
            } else {
              categoryName = (apiAsset.categoryName as string) || '';
              categoryId = (apiAsset.category_id as string) || '';
            }

            // Try to find matching category from our comprehensive list
            const matchingCategory = assetCategories.find(
              cat =>
                cat.name.toLowerCase() === categoryName.toLowerCase() ||
                cat.subcategories?.some(
                  sub => sub.toLowerCase() === categoryName.toLowerCase()
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
                    id: categoryId,
                    name: categoryName,
                    nameAr: categoryName,
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
              subcategoryId: (apiAsset.subcategoryId ||
                apiAsset.subcategory_id) as string | undefined,
            };
          }
        );

        setAssets(transformedAssets);
      } catch (error: unknown) {
        const axiosError = error as
          | AxiosError<{ message?: string }>
          | undefined;
        console.error('❌ Failed to fetch data:', error);
        console.error('❌ Error details:', {
          message: axiosError?.message,
          response: axiosError?.response?.data,
          status: axiosError?.response?.status,
        });

        // Only show error toast if it's a real error (not 404 or empty results)
        const status = axiosError?.response?.status;
        const errorMessage =
          axiosError?.response?.data?.message || axiosError?.message || '';

        // Don't show error for 404 (not found) or if it's just empty results
        if (status !== 404 && status !== 200 && errorMessage) {
          showSnackbar(errorMessage || 'Failed to load data', 'error');
        } else {
          // If it's 404 or empty results, just set empty state without showing error
          setRequests([]);
          setPagination(prev => ({
            ...prev,
            total: 0,
            totalPages: 1,
          }));
        }
      } finally {
        fetchingRef.current = false;
        // Only set initial loading to false on very first load
        if (isInitialLoad && page === 1) {
          setInitialLoading(false);
        }
      }
    },
    [transformApiRequests]
  );

  // Initial load: fetch paginated requests and assets (counts come from API response)
  React.useEffect(() => {
    // Only run initial load once
    if (initialLoadRef.current) {
      return;
    }
    if (fetchingRef.current) {
      return; // Don't fetch if already fetching
    }

    initialLoadRef.current = true;
    
    // Mark this page/limit as fetched
    lastFetchedPageRef.current = { page: pagination.page, limit: pagination.limit };

    // Fetch paginated requests only (assets will be fetched when needed)
    fetchRequests(pagination.page, pagination.limit, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on initial mount

  // Handle page changes: fetch paginated requests (counts come from API response)
  React.useEffect(() => {
    if (!initialLoadRef.current) return; // Don't fetch if initial load hasn't happened
    if (fetchingRef.current) return; // Don't fetch if already fetching
    
    // Check if page/limit actually changed
    const lastFetched = lastFetchedPageRef.current;
    if (lastFetched && lastFetched.page === pagination.page && lastFetched.limit === pagination.limit) {
      return; // Already fetched this page/limit combination
    }

    // Fetch paginated requests when page or limit changes (but not on initial load)
    if (pagination.page > 0) {
      lastFetchedPageRef.current = { page: pagination.page, limit: pagination.limit };
      fetchRequests(pagination.page, pagination.limit, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit]); // Removed fetchRequests from deps to prevent re-triggers

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
    // Fetch assets when modal opens (only if not already fetched)
    if (!assetsFetchedRef.current) {
      fetchAssets();
    }
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

        // Prepare payload for approval - use snake_case only
        const payload = {
          asset_id: data.assignedAssetId as string,
          employee_id: selectedRequest.employeeId,
          request_id: selectedRequest.id,
          category_id: selectedRequest.category.id,
          subcategory_id: selectedRequest.subcategoryId || undefined,
        };

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
                    processedByName: 'Current User', // You might want to get this from auth context
                  }
                : request
            )
          );

          // Refresh paginated requests to update counts
          fetchRequests(pagination.page, pagination.limit, false);

          // Show success message with asset assignment details
          showSnackbar(
            `Asset "${selectedAsset.name}" has been assigned to ${selectedRequest.employeeName} successfully!`,
            'success'
          );

          // Close modal and return early for approval - no need to refresh from API
          setIsProcessModalOpen(false);
          setLoading(false);
          return;
        } catch (approvalError: unknown) {
          const axiosError = approvalError as
            | AxiosError<{ message?: string }>
            | undefined;
          console.error('❌ Approval failed:', approvalError);
          console.error('❌ Error details:', {
            message: axiosError?.message,
            response: axiosError?.response?.data,
            status: axiosError?.response?.status,
            requestId: selectedRequest.id,
            payload,
          });

          const errorMessage =
            axiosError?.response?.data?.message ||
            axiosError?.message ||
            'Failed to approve request';
          showSnackbar(errorMessage, 'error');
          setLoading(false);
          return;
        }
      } else if (data.action === 'reject') {
        try {
          await assetApi.rejectAssetRequest(
            selectedRequest.id,
            data.rejectionReason as string
          );

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
                    processedByName: 'Current User', // You might want to get this from auth context
                  }
                : request
            )
          );

          // Refresh paginated requests to update counts
          fetchRequests(pagination.page, pagination.limit, false);

          showSnackbar(
            `Request from ${selectedRequest.employeeName} has been rejected successfully`,
            'success'
          );

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

      const apiResponse: PaginatedResponse<ApiAssetRequest> =
        await assetApi.getAllAssetRequests({
          page: pagination.page,
          limit: pagination.limit,
        });

      // Refresh assets to reflect assignment status - fetch all assets with pagination
      let allAssets: Record<string, unknown>[] = [];
      let assetCurrentPage = 1;
      let assetsHasMorePages = true;
      const maxPages = 50; // Safety limit to prevent infinite loops

      while (assetsHasMorePages && assetCurrentPage <= maxPages) {
        const apiAssetsResponse = await assetApi.getAllAssets({
          page: assetCurrentPage,
          limit: 100, // Use a high limit to fetch more assets per page
        });

        if (apiAssetsResponse.assets && apiAssetsResponse.assets.length > 0) {
          allAssets = [...allAssets, ...apiAssetsResponse.assets];

          // Check if there are more pages
          const totalPages = apiAssetsResponse.pagination?.totalPages || 1;
          assetsHasMorePages = assetCurrentPage < totalPages;
          assetCurrentPage++;
        } else {
          assetsHasMorePages = false;
        }
      }

      const transformedAssets: Asset[] = allAssets.map(
        (apiAsset: Record<string, unknown>) => {
          // Extract category name from API response
          // Category can be an object { id, name, ... } or a string
          let categoryName = '';
          let categoryId = '';

          if (
            apiAsset.category &&
            typeof apiAsset.category === 'object' &&
            apiAsset.category !== null
          ) {
            const categoryObj = apiAsset.category as {
              id?: string;
              name?: string;
            };
            categoryName = categoryObj.name || '';
            categoryId =
              categoryObj.id || (apiAsset.category_id as string) || '';
          } else if (apiAsset.categoryName) {
            categoryName = apiAsset.categoryName as string;
            categoryId = (apiAsset.category_id as string) || '';
          } else if (typeof apiAsset.category === 'string') {
            categoryName = apiAsset.category;
            categoryId =
              (apiAsset.category_id as string) || (apiAsset.category as string);
          } else {
            categoryName = (apiAsset.categoryName as string) || '';
            categoryId = (apiAsset.category_id as string) || '';
          }

          // Try to find matching category from our comprehensive list
          const matchingCategory = assetCategories.find(
            cat =>
              cat.name.toLowerCase() === categoryName.toLowerCase() ||
              cat.subcategories?.some(
                sub => sub.toLowerCase() === categoryName.toLowerCase()
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
                  id: categoryId,
                  name: categoryName,
                  nameAr: categoryName,
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
            updatedAt:
              (apiAsset.updated_at as string) ||
              (apiAsset.created_at as string),
            subcategoryId: (apiAsset.subcategoryId ||
              apiAsset.subcategory_id) as string | undefined,
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
              apiRequest.requestedByName ||
              apiRequest.requestedByUser?.name ||
              `User ${apiRequest.requested_by}`,
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

  // Use counts from API response
  const displayCounts = useMemo(() => {
    // Use counts from API response if available
    if (
      statusCounts.total > 0 ||
      statusCounts.pending > 0 ||
      statusCounts.approved > 0 ||
      statusCounts.rejected > 0
    ) {
      return {
        all: statusCounts.total,
        pending: statusCounts.pending,
        approved: statusCounts.approved,
        rejected: statusCounts.rejected,
      };
    }

    // Fallback: Use total from pagination, show 0 for status counts until API provides them
    return {
      all: pagination.total || 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    };
  }, [statusCounts, pagination.total]);

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
            <Box>
              <Typography variant='caption' color='text.secondary'>
                {request.category.name}
              </Typography>
              {(request.subcategoryName || request.category.requestedItem) && (
                <Typography
                  variant='caption'
                  color='text.secondary'
                  sx={{ display: 'block', mt: 0.5 }}
                >
                  {request.subcategoryName || request.category.requestedItem}
                </Typography>
              )}
            </Box>
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
        {request.rejectionReason &&
          request.rejectionReason !== null &&
          request.rejectionReason.trim() !== '' && (
            <Typography variant='body2' color='text.primary'>
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
                {displayCounts.all}
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
                {displayCounts.pending}
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
                {displayCounts.approved}
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
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredRequestsByTab().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align='center' sx={{ py: 4 }}>
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
                  <TableCell>Employee & Asset</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Requested Date</TableCell>
                  <TableCell>Remarks</TableCell>
                  <TableCell>Rejection Reason</TableCell>
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredRequestsByTab('pending').length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align='center' sx={{ py: 4 }}>
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
                  <TableCell>Employee & Asset</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Requested Date</TableCell>
                  <TableCell>Remarks</TableCell>
                  <TableCell>Rejection Reason</TableCell>
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredRequestsByTab('approved').length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align='center' sx={{ py: 4 }}>
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
                  <TableCell>Employee & Asset</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Requested Date</TableCell>
                  <TableCell>Remarks</TableCell>
                  <TableCell>Rejection Reason</TableCell>
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredRequestsByTab('rejected').length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align='center' sx={{ py: 4 }}>
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
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Pagination Info */}
      {requests.length > 0 && (
        <Box display='flex' justifyContent='center' mt={1}>
          <Typography variant='body2' color='textSecondary'>
            Showing page {pagination.page} of {pagination.totalPages} (
            {pagination.total} total records)
          </Typography>
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
                          <strong>No available assets</strong>
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
                        {selectedRequest.rejectionReason &&
                          selectedRequest.rejectionReason !== null &&
                          selectedRequest.rejectionReason.trim() !== '' && (
                            <Alert severity='error' sx={{ mt: 1 }}>
                              <Typography variant='body2'>
                                <strong>Rejection Reason:</strong>{' '}
                                {selectedRequest.rejectionReason}
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
