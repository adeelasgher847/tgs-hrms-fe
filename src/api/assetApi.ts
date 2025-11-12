import type { AxiosError } from 'axios';
import axiosInstance from './axiosInstance';

// Asset Management API Types
export interface Asset {
  id: string;
  name: string;
  category: {
    id: string;
    name: string;
    description?: string | null;
    icon?: string | null;
  };
  category_id: string;
  categoryName?: string;
  subcategory?: {
    id: string;
    name: string;
    description?: string | null;
  };
  subcategory_id?: string;
  subcategoryName?: string;
  status: 'available' | 'assigned' | 'under_maintenance' | 'retired';
  assigned_to: string | null;
  assignedToUser?: {
    id: string;
    name: string;
    email: string;
  } | null;
  assignedToName?: string | null;
  purchase_date: string;
  tenant_id: string;
  created_at: string;
}

export interface CreateAssetRequest {
  name: string;
  categoryId: string;
  subcategoryId?: string;
  purchaseDate: string;
}

export interface UpdateAssetRequest {
  name: string;
  categoryId: string;
  subcategoryId?: string;
  purchaseDate: string;
}

// Asset Subcategory Types
type AssetSubcategoryCategory = string | { id?: string; name?: string };

export interface AssetSubcategory {
  id: string;
  name: string;
  category: AssetSubcategoryCategory;
  description?: string;
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAssetSubcategoryRequest {
  name: string;
  category: string;
  description?: string;
}

export interface UpdateAssetSubcategoryRequest {
  name: string;
  category: string;
  description?: string;
}

export interface AssetRequest {
  id: string;
  category_id: string;
  subcategory_id?: string | null;
  requested_by: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  requested_date: string;
  approved_date: string | null;
  tenant_id: string;
  remarks: string;
  created_at: string;
  rejection_reason?: string | null;
  requestedByName?: string;
  approvedByName?: string;
  requestedByUser?: {
    id: string;
    name: string;
    email: string;
  };
  approvedByUser?: {
    id: string;
    name: string;
    email: string;
  };
  // Legacy field for backward compatibility
  asset_category?: string;
}

// Utility function to validate and normalize status from API
export const validateRequestStatus = (
  status: string | number | boolean
): 'pending' | 'approved' | 'rejected' => {
  if (typeof status !== 'string') {
    return 'pending';
  }

  const normalized = status.toLowerCase().trim();
  switch (normalized) {
    case 'pending':
      return 'pending';
    case 'approved':
      return 'approved';
    case 'rejected':
      return 'rejected';
    default:
      return 'pending';
  }
};

export interface CreateAssetRequestRequest {
  categoryId: string;
  subcategoryId?: string;
  remarks: string;
}

export interface ApproveAssetRequestRequest {
  asset_id?: string;
  assetId?: string; // camelCase version
  employee_id?: string;
  employeeId?: string; // camelCase version
  request_id?: string;
  requestId?: string; // camelCase version
  category?: string;
  categoryId?: string; // camelCase version
  category_id?: string; // snake_case version
  subcategory_id?: string;
  subcategoryId?: string; // camelCase version
}

// Pagination response interface
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  counts?: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    cancelled?: number;
  };
}

// Asset Management API Service
export const assetApi = {
  // Test function to check API connectivity
  testApiConnection: async () => {
    const response = await axiosInstance.get('/assets');
    return response;
  },

  // Assets CRUD operations
  getAllAssets: async (filters?: {
    status?: string;
    category?: string;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await axiosInstance.get(`/assets?${params.toString()}`);

    // Handle different possible response structures
    const responseData = response.data;

    // Case 1: Paginated response with data array
    if (responseData.data && Array.isArray(responseData.data)) {
      return {
        assets: responseData.data,
        pagination: {
          total: responseData.total || 0,
          page: responseData.page || 1,
          limit: responseData.limit || 25,
          totalPages: responseData.totalPages || 1,
        },
        counts: responseData.counts || undefined, // Include counts if available
      };
    }

    // Case 2: Paginated response with items array (new API structure)
    if (responseData.items && Array.isArray(responseData.items)) {
      return {
        assets: responseData.items,
        pagination: {
          total: responseData.total || 0,
          page: responseData.page || 1,
          limit: responseData.limit || 25,
          totalPages: responseData.totalPages || 1,
        },
        counts: responseData.counts || undefined, // Include counts if available
      };
    }

    // Case 3: Paginated response with results array
    if (responseData.results && Array.isArray(responseData.results)) {
      return {
        assets: responseData.results,
        pagination: {
          total: responseData.total || 0,
          page: responseData.page || 1,
          limit: responseData.limit || 25,
          totalPages: responseData.totalPages || 1,
        },
      };
    }

    // Case 4: Direct array response
    if (Array.isArray(responseData)) {
      return {
        assets: responseData,
        pagination: {
          total: responseData.length,
          page: 1,
          limit: responseData.length || 25,
          totalPages: 1,
        },
      };
    }

    // Case 5: Object with assets property
    if (responseData.assets && Array.isArray(responseData.assets)) {
      return {
        assets: responseData.assets,
        pagination: {
          total: responseData.total || responseData.assets.length,
          page: responseData.page || 1,
          limit: responseData.limit || responseData.assets.length || 25,
          totalPages: responseData.totalPages || 1,
        },
      };
    }

    // Fallback: Try to find any array in the response
    const possibleArrays = Object.values(responseData).filter(Array.isArray);
    if (possibleArrays.length > 0) {
      return {
        assets: (possibleArrays[0] || []) as Asset[],
        pagination: {
          total: responseData.total || possibleArrays[0].length,
          page: responseData.page || 1,
          limit: responseData.limit || possibleArrays[0].length || 25,
          totalPages: responseData.totalPages || 1,
        },
      };
    }

    // Final fallback
    return {
      assets: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 25,
        totalPages: 1,
      },
    };
  },

  getAssetById: async (id: string) => {
    const response = await axiosInstance.get(`/assets/${id}`);
    return response.data;
  },

  createAsset: async (data: CreateAssetRequest) => {
    const response = await axiosInstance.post('/assets', data);
    return response.data;
  },

  updateAsset: async (id: string, data: UpdateAssetRequest) => {
    const response = await axiosInstance.put(`/assets/${id}`, data);
    return response.data;
  },

  deleteAsset: async (id: string) => {
    const response = await axiosInstance.delete(`/assets/${id}`);
    return response.data;
  },

  updateAssetStatus: async (
    id: string,
    status: string,
    assetData: { name: string; categoryId: string; purchaseDate: string }
  ) => {
    // Update asset with new status using PUT endpoint
    const response = await axiosInstance.put(`/assets/${id}`, {
      name: assetData.name,
      categoryId: assetData.categoryId,
      purchaseDate: assetData.purchaseDate,
      status: status,
    });
    return response.data;
  },

  // Asset Requests operations
  getAllAssetRequests: async (filters?: {
    requester?: string;
    tenant?: string;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.requester) params.append('requester', filters.requester);
    if (filters?.tenant) params.append('tenant', filters.tenant);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await axiosInstance.get(
      `/asset-requests?${params.toString()}`
    );

    // Debug: Log individual request statuses
    const responseData = response.data;

    // Case 1: Paginated response with data array
    if (responseData.data && Array.isArray(responseData.data)) {
      return {
        items: responseData.data,
        total: responseData.total || 0,
        page: responseData.page || 1,
        limit: responseData.limit || 25,
        totalPages: responseData.totalPages || 1,
      };
    }

    // Case 2: Paginated response with items array
    if (responseData.items && Array.isArray(responseData.items)) {
      return {
        items: responseData.items,
        total: responseData.total || 0,
        page: responseData.page || 1,
        limit: responseData.limit || 25,
        totalPages: responseData.totalPages || 1,
        counts: responseData.counts || undefined,
      };
    }

    // Case 3: Paginated response with results array
    if (responseData.results && Array.isArray(responseData.results)) {
      return {
        items: responseData.results,
        total: responseData.total || 0,
        page: responseData.page || 1,
        limit: responseData.limit || 25,
        totalPages: responseData.totalPages || 1,
      };
    }

    // Case 4: Direct array response
    if (Array.isArray(responseData)) {
      return {
        items: responseData,
        total: responseData.length,
        page: 1,
        limit: responseData.length || 25,
        totalPages: 1,
      };
    }

    // Case 5: Object with assetRequests property
    if (
      responseData.assetRequests &&
      Array.isArray(responseData.assetRequests)
    ) {
      return {
        items: responseData.assetRequests,
        total: responseData.total || responseData.assetRequests.length,
        page: responseData.page || 1,
        limit: responseData.limit || responseData.assetRequests.length || 25,
        totalPages: responseData.totalPages || 1,
      };
    }

    // Fallback: Try to find any array in the response
    const possibleArrays = Object.values(responseData).filter(Array.isArray);
    if (possibleArrays.length > 0) {
      return {
        items: possibleArrays[0] as AssetRequest[],
        total: responseData.total || possibleArrays[0].length,
        page: responseData.page || 1,
        limit: responseData.limit || possibleArrays[0].length || 25,
        totalPages: responseData.totalPages || 1,
      };
    }

    return {
      items: [],
      total: 0,
      page: 1,
      limit: 25,
      totalPages: 1,
    };
  },

  getAssetRequestById: async (
    id: string,
    filters?: { page?: number; limit?: number }
  ) => {
    // Get current user ID from localStorage
    const userStr = localStorage.getItem('user');
    let currentUserId = '';
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        currentUserId = user.id || user.user_id || '';
      } catch (error) {
        console.error('Failed to parse user from localStorage:', error);
      }
    }

    const params = new URLSearchParams();
    params.append('requestedBy', currentUserId);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await axiosInstance.get(
      `/asset-requests/?${params.toString()}`
    );

    const responseData = response.data;

    // Handle different response structures
    // Case 1: Paginated response with items array
    if (responseData.items && Array.isArray(responseData.items)) {
      return {
        items: responseData.items,
        total: responseData.total || 0,
        page: responseData.page || 1,
        limit: responseData.limit || 25,
        totalPages: responseData.totalPages || 1,
        counts: responseData.counts || undefined,
      };
    }

    // Case 2: Paginated response with data array
    if (responseData.data && Array.isArray(responseData.data)) {
      return {
        items: responseData.data,
        total: responseData.total || 0,
        page: responseData.page || 1,
        limit: responseData.limit || 25,
        totalPages: responseData.totalPages || 1,
        counts: responseData.counts || undefined,
      };
    }

    // Case 3: Direct array response
    if (Array.isArray(responseData)) {
      return {
        items: responseData,
        total: responseData.length,
        page: 1,
        limit: responseData.length || 25,
        totalPages: 1,
        counts: undefined,
      };
    }

    // Fallback: Return as is
    return {
      items: responseData.items || responseData.data || [],
      total: responseData.total || 0,
      page: responseData.page || 1,
      limit: responseData.limit || 25,
      totalPages: responseData.totalPages || 1,
      counts: responseData.counts || undefined,
    };
  },

  createAssetRequest: async (data: CreateAssetRequestRequest) => {
    const response = await axiosInstance.post('/asset-requests', data);
    return response.data;
  },

  approveAssetRequest: async (
    id: string,
    data?: ApproveAssetRequestRequest
  ) => {
    // Try with body payload first
    try {
      const response = await axiosInstance.put(
        `/asset-requests/${id}/approve`,
        data || {}
      );
      return response.data;
    } catch (bodyError: unknown) {
      const bodyAxiosError = bodyError as AxiosError | undefined;
      console.error('❌ Approval with body failed:', {
        error: bodyAxiosError?.response?.data,
        status: bodyAxiosError?.response?.status,
      });
      
      // If body approach fails, try with just asset_id in query or body
      if (data?.asset_id || data?.assetId) {
        const assetId = data.asset_id || data.assetId;
        try {
          // Try with asset_id in query parameter
          const url = `/asset-requests/${id}/approve?asset_id=${assetId}`;
          const response = await axiosInstance.put(url, {});
          return response.data;
        } catch (queryError: unknown) {
          const queryAxiosError = queryError as AxiosError | undefined;
          console.error('❌ Approval with query param failed:', {
            error: queryAxiosError?.response?.data,
            status: queryAxiosError?.response?.status,
          });
          
          // Try with minimal payload - just asset_id
          try {
            const response = await axiosInstance.put(
              `/asset-requests/${id}/approve`,
              { asset_id: assetId }
            );
            return response.data;
          } catch (minimalError: unknown) {
            console.error('❌ All approval attempts failed');
            throw minimalError;
          }
        }
      }

      // If all attempts fail, throw the original error
      throw bodyError;
    }
  },

  rejectAssetRequest: async (id: string, rejectionReason?: string) => {
    const response = await axiosInstance.put(`/asset-requests/${id}/reject`, {
      rejection_reason: rejectionReason
    });
    return response.data;
  },

  deleteAssetRequest: async (id: string) => {
    const response = await axiosInstance.delete(`/asset-requests/${id}`);
    return response.data;
  },

  // Asset Subcategories CRUD operations
  getAllAssetSubcategories: async (filters?: {
    category?: string;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await axiosInstance.get(
      `/asset-subcategories?${params.toString()}`
    );
    return response.data;
  },

  getAssetSubcategoryById: async (id: string) => {
    const response = await axiosInstance.get(`/asset-subcategories/${id}`);
    return response.data;
  },

  createAssetSubcategory: async (data: CreateAssetSubcategoryRequest) => {
    const response = await axiosInstance.post('/asset-subcategories', data);
    return response.data;
  },

  updateAssetSubcategory: async (
    id: string,
    data: UpdateAssetSubcategoryRequest
  ) => {
    const response = await axiosInstance.put(
      `/asset-subcategories/${id}`,
      data
    );
    return response.data;
  },

  deleteAssetSubcategory: async (id: string) => {
    const response = await axiosInstance.delete(`/asset-subcategories/${id}`);
    return response.data;
  },

  getAssetSubcategoriesByCategory: async () => {
    const response = await axiosInstance.get('/asset-subcategories/categories');
    return response.data;
  },

  // Asset Categories API
  getAllAssetCategories: async () => {
    const response = await axiosInstance.get('/asset-categories');
    return response.data;
  },

  getAssetSubcategoriesByCategoryId: async (categoryId: string) => {
    // Try with category_id parameter first, then fallback to category
    const params = new URLSearchParams();
    params.append('category_id', categoryId);
    
    try {
      const response = await axiosInstance.get(
        `/asset-subcategories?${params.toString()}`
      );
      return response.data;
    } catch {
      // Fallback to category parameter if category_id doesn't work
      const response = await assetApi.getAllAssetSubcategories({
        category: categoryId,
      });
      return response;
    }
  },

  // System Admin Asset APIs
  getSystemAssets: async (filters?: {
    category?: string;
    tenantId?: string;
    assigned?: 'assigned' | 'unassigned';
  }) => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.tenantId) params.append('tenantId', filters.tenantId);
    if (filters?.assigned) params.append('assigned', filters.assigned);

    const response = await axiosInstance.get(
      `/system/assets/?${params.toString()}`
    );
    return response.data;
  },

  getSystemAssetsSummary: async () => {
    const response = await axiosInstance.get('/system/assets/summary/');
    return response.data;
  },
};

// System Admin Asset Types
export interface SystemAsset {
  id: string;
  name: string;
  category: string;
  subcategory_id: string;
  status: string;
  assigned_to: string | null;
  purchase_date: string;
  tenant_id: string;
  created_at: string;
  assignedToUser?: {
    id: string;
    email: string;
    phone: string;
    first_name: string;
    last_name: string;
    profile_pic: string | null;
    role_id: string;
    gender: string;
    tenant_id: string;
    created_at: string;
    updated_at: string;
    first_login_time: string | null;
  };
  tenant: {
    id: string;
    name: string;
    status: string;
    isDeleted: boolean;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  };
}

export interface SystemAssetSummary {
  tenantId: string;
  tenantName: string;
  totalAssets: number;
  assignedCount: number;
  availableCount: number;
  maintenanceCount: number;
  retiredCount: number;
  lostCount: number;
}

export default assetApi;
