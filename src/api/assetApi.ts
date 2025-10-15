import axiosInstance from './axiosInstance';

// Asset Management API Types
export interface Asset {
  id: string;
  name: string;
  category: string;
  status: 'available' | 'assigned' | 'under_maintenance' | 'retired';
  assigned_to: string | null;
  purchase_date: string;
  tenant_id: string;
  created_at: string;
}

export interface CreateAssetRequest {
  name: string;
  category: string;
  purchaseDate: string;
}

export interface UpdateAssetRequest {
  name: string;
  category: string;
  purchaseDate: string;
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
  requestedByUser?: any;
  approvedByUser?: any;
}

// Utility function to validate and normalize status from API
export const validateRequestStatus = (status: any): 'pending' | 'approved' | 'rejected' => {
  if (typeof status !== 'string') {
    console.warn('Invalid status type received from API:', typeof status, status);
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
      console.warn('Unknown status received from API:', status, 'normalized to:', normalized);
      return 'pending';
  }
};

export interface CreateAssetRequestRequest {
  assetCategory: string;
  remarks: string;
}

export interface ApproveAssetRequestRequest {
  asset_id?: string;
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
    try {
      console.log('Testing API connection...');
      const response = await axiosInstance.get('/assets');
      console.log('API Test Response:', response);
      return response;
    } catch (error) {
      console.error('API Test Error:', error);
      throw error;
    }
  },

  // Assets CRUD operations
  getAllAssets: async (filters?: { status?: string; category?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const response = await axiosInstance.get(`/assets?${params.toString()}`);
    
    // Debug: Log the actual response structure
    console.log('API Response:', response.data);
    console.log('API Response Type:', typeof response.data);
    console.log('API Response Keys:', Object.keys(response.data || {}));
    
    // Handle different possible response structures
    const responseData = response.data;
    
    // Case 1: Paginated response with data array
    if (responseData.data && Array.isArray(responseData.data)) {
      console.log('Using paginated response structure with data array');
      return {
        assets: responseData.data,
        pagination: {
          total: responseData.total || 0,
          page: responseData.page || 1,
          limit: responseData.limit || 25,
          totalPages: responseData.totalPages || 1
        }
      };
    }
    
    // Case 2: Paginated response with items array
    if (responseData.items && Array.isArray(responseData.items)) {
      console.log('Using paginated response structure with items array');
      return {
        assets: responseData.items,
        pagination: {
          total: responseData.total || 0,
          page: responseData.page || 1,
          limit: responseData.limit || 25,
          totalPages: responseData.totalPages || 1
        }
      };
    }
    
    // Case 3: Paginated response with results array
    if (responseData.results && Array.isArray(responseData.results)) {
      console.log('Using paginated response structure with results array');
      return {
        assets: responseData.results,
        pagination: {
          total: responseData.total || 0,
          page: responseData.page || 1,
          limit: responseData.limit || 25,
          totalPages: responseData.totalPages || 1
        }
      };
    }
    
    // Case 4: Direct array response
    if (Array.isArray(responseData)) {
      console.log('Using direct array response structure');
      return {
        assets: responseData,
        pagination: {
          total: responseData.length,
          page: 1,
          limit: responseData.length || 25,
          totalPages: 1
        }
      };
    }
    
    // Case 5: Object with assets property
    if (responseData.assets && Array.isArray(responseData.assets)) {
      console.log('Using response structure with assets property');
      return {
        assets: responseData.assets,
        pagination: {
          total: responseData.total || responseData.assets.length,
          page: responseData.page || 1,
          limit: responseData.limit || responseData.assets.length || 25,
          totalPages: responseData.totalPages || 1
        }
      };
    }
    
    // Fallback: Try to find any array in the response
    const possibleArrays = Object.values(responseData).filter(Array.isArray);
    if (possibleArrays.length > 0) {
      console.log('Using fallback - found array in response');
      return {
        assets: possibleArrays[0] as any[],
        pagination: {
          total: responseData.total || possibleArrays[0].length,
          page: responseData.page || 1,
          limit: responseData.limit || possibleArrays[0].length || 25,
          totalPages: responseData.totalPages || 1
        }
      };
    }
    
    // Final fallback
    console.log('Using final fallback - empty array');
    return {
      assets: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 25,
        totalPages: 1
      }
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

  updateAssetStatus: async (id: string, status: string, assetData: { name: string; category: string; purchaseDate: string }) => {
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
  getAllAssetRequests: async (filters?: { requester?: string; tenant?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters?.requester) params.append('requester', filters.requester);
    if (filters?.tenant) params.append('tenant', filters.tenant);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const response = await axiosInstance.get(`/asset-requests?${params.toString()}`);
    
    // Debug: Log the actual response structure
    console.log('Asset Requests API Response:', response.data);
    console.log('Asset Requests API Response Type:', typeof response.data);
    console.log('Asset Requests API Response Keys:', Object.keys(response.data || {}));
    
    // Debug: Log individual request statuses
    const responseData = response.data;
    if (responseData.items && Array.isArray(responseData.items)) {
      console.log('Individual request statuses:');
      responseData.items.forEach((item: any, index: number) => {
        console.log(`Request ${index + 1}:`, {
          id: item.id,
          status: item.status,
          statusType: typeof item.status,
          statusLength: item.status?.length
        });
      });
    } else if (responseData.data && Array.isArray(responseData.data)) {
      console.log('Individual request statuses (data array):');
      responseData.data.forEach((item: any, index: number) => {
        console.log(`Request ${index + 1}:`, {
          id: item.id,
          status: item.status,
          statusType: typeof item.status,
          statusLength: item.status?.length
        });
      });
    }
    
    // Handle different possible response structures
    
    // Case 1: Paginated response with data array
    if (responseData.data && Array.isArray(responseData.data)) {
      console.log('Using paginated response structure with data array');
      return {
        items: responseData.data,
        total: responseData.total || 0,
        page: responseData.page || 1,
        limit: responseData.limit || 25,
        totalPages: responseData.totalPages || 1
      };
    }
    
    // Case 2: Paginated response with items array
    if (responseData.items && Array.isArray(responseData.items)) {
      console.log('Using paginated response structure with items array');
      return {
        items: responseData.items,
        total: responseData.total || 0,
        page: responseData.page || 1,
        limit: responseData.limit || 25,
        totalPages: responseData.totalPages || 1
      };
    }
    
    // Case 3: Paginated response with results array
    if (responseData.results && Array.isArray(responseData.results)) {
      console.log('Using paginated response structure with results array');
      return {
        items: responseData.results,
        total: responseData.total || 0,
        page: responseData.page || 1,
        limit: responseData.limit || 25,
        totalPages: responseData.totalPages || 1
      };
    }
    
    // Case 4: Direct array response
    if (Array.isArray(responseData)) {
      console.log('Using direct array response structure');
      return {
        items: responseData,
        total: responseData.length,
        page: 1,
        limit: responseData.length || 25,
        totalPages: 1
      };
    }
    
    // Case 5: Object with assetRequests property
    if (responseData.assetRequests && Array.isArray(responseData.assetRequests)) {
      console.log('Using response structure with assetRequests property');
      return {
        items: responseData.assetRequests,
        total: responseData.total || responseData.assetRequests.length,
        page: responseData.page || 1,
        limit: responseData.limit || responseData.assetRequests.length || 25,
        totalPages: responseData.totalPages || 1
      };
    }
    
    // Fallback: Try to find any array in the response
    const possibleArrays = Object.values(responseData).filter(Array.isArray);
    if (possibleArrays.length > 0) {
      console.log('Using fallback - found array in response');
      return {
        items: possibleArrays[0] as any[],
        total: responseData.total || possibleArrays[0].length,
        page: responseData.page || 1,
        limit: responseData.limit || possibleArrays[0].length || 25,
        totalPages: responseData.totalPages || 1
      };
    }
    
    // Final fallback
    console.log('Using final fallback - empty array');
    return {
      items: [],
      total: 0,
      page: 1,
      limit: 25,
      totalPages: 1
    };
  },

  getAssetRequestById: async (id: string, filters?: { page?: number; limit?: number }) => {
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
    
    const response = await axiosInstance.get(`/asset-requests/?${params.toString()}`);
    
    // Debug: Log the actual response structure for user requests
    console.log('User Asset Requests API Response:', response.data);
    console.log('User Asset Requests API Response Type:', typeof response.data);
    
    // Debug: Log individual request statuses for user requests
    const responseData = response.data;
    if (responseData.items && Array.isArray(responseData.items)) {
      console.log('User request statuses (items array):');
      responseData.items.forEach((item: any, index: number) => {
        console.log(`User Request ${index + 1}:`, {
          id: item.id,
          status: item.status,
          statusType: typeof item.status,
          statusLength: item.status?.length,
          rawStatus: JSON.stringify(item.status)
        });
      });
    } else if (responseData.data && Array.isArray(responseData.data)) {
      console.log('User request statuses (data array):');
      responseData.data.forEach((item: any, index: number) => {
        console.log(`User Request ${index + 1}:`, {
          id: item.id,
          status: item.status,
          statusType: typeof item.status,
          statusLength: item.status?.length,
          rawStatus: JSON.stringify(item.status)
        });
      });
    }
    
    return response.data;
  },

  createAssetRequest: async (data: CreateAssetRequestRequest) => {
    const response = await axiosInstance.post('/asset-requests', data);
    console.log(response);
    return response.data;
  },

  approveAssetRequest: async (id: string, data?: ApproveAssetRequestRequest) => {
    const response = await axiosInstance.put(`/asset-requests/${id}/approve`, data || {});
    return response.data;
  },

  rejectAssetRequest: async (id: string) => {
    const response = await axiosInstance.put(`/asset-requests/${id}/reject`);
    return response.data;
  },

  deleteAssetRequest: async (id: string) => {
    const response = await axiosInstance.delete(`/asset-requests/${id}`);
    return response.data;
  },
};

export default assetApi;
