import axiosInstance from './axiosInstance';

// Asset Management API Types
export interface Asset {
  id: string;
  name: string;
  category: string;
  subcategoryId?: string;
  status: 'available' | 'assigned' | 'under_maintenance' | 'retired';
  assigned_to: string | null;
  purchase_date: string;
  tenant_id: string;
  created_at: string;
}

export interface CreateAssetRequest {
  name: string;
  category: string;
  subcategoryId?: string;
  purchaseDate: string;
}

export interface UpdateAssetRequest {
  name: string;
  category: string;
  subcategoryId?: string;
  purchaseDate: string;
}

// Asset Subcategory Types
export interface AssetSubcategory {
  id: string;
  name: string;
  category: string;
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
  asset_category: string;
  requested_by: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  requested_date: string;
  approved_date: string | null;
  tenant_id: string;
  remarks: string;
  created_at: string;
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
  assetCategory: string;
  subcategoryId?: string;
  remarks: string;
}

export interface ApproveAssetRequestRequest {
  asset_id?: string;
  employee_id?: string;
  request_id?: string;
  category?: string;
  subcategory_id?: string;
}

// Pagination response interface
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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
      };
    }

    // Case 2: Paginated response with items array
    if (responseData.items && Array.isArray(responseData.items)) {
      return {
        assets: responseData.items,
        pagination: {
          total: responseData.total || 0,
          page: responseData.page || 1,
          limit: responseData.limit || 25,
          totalPages: responseData.totalPages || 1,
        },
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
    assetData: { name: string; category: string; purchaseDate: string }
  ) => {
    // Update asset with new status using PUT endpoint
    const response = await axiosInstance.put(`/assets/${id}`, {
      name: assetData.name,
      category: assetData.category,
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

    return response.data;
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
      // If body approach fails and we have asset_id, try query parameter
      if (data?.asset_id) {
        const url = `/asset-requests/${id}/approve?id=${data.request_id}`;
        const response = await axiosInstance.put(url, {});
        return response.data;
      }

      // If both fail, throw the body error
      throw bodyError;
    }
  },

  rejectAssetRequest: async (id: string) => {
    const response = await axiosInstance.put(`/asset-requests/${id}/reject`);
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
};

export default assetApi;
