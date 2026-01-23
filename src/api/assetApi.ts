import axiosInstance from './axiosInstance';

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
  asset_category?: string;
  comments?: AssetRequestComment[];
}

export interface AssetRequestComment {
  id: string;
  asset_request_id: string;
  commented_by: string;
  commentedByUser?: {
    id: string;
    first_name?: string;
    last_name?: string;
    name?: string;
    profile_pic?: string | null;
  };
  comment: string;
  tenant_id: string;
  created_at: string;
}

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

class AssetApiService {
  private baseUrl = '/assets';
  private assetRequestsUrl = '/asset-requests';
  private assetSubcategoriesUrl = '/asset-subcategories';
  private assetCategoriesUrl = '/asset-categories';

  async testApiConnection() {
    const response = await axiosInstance.get(this.baseUrl);
    return response;
  }

  async getAllAssets(filters?: {
    status?: string;
    category?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const url = params.toString()
      ? `${this.baseUrl}?${params.toString()}`
      : this.baseUrl;
    const response = await axiosInstance.get(url);

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
  }

  async getAssetById(id: string) {
    const response = await axiosInstance.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async createAsset(data: CreateAssetRequest) {
    const response = await axiosInstance.post(this.baseUrl, data);
    return response.data;
  }

  async updateAsset(id: string, data: UpdateAssetRequest) {
    const response = await axiosInstance.put(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async deleteAsset(id: string) {
    const response = await axiosInstance.delete(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async updateAssetStatus(
    id: string,
    status: string,
    assetData: { name: string; categoryId: string; purchaseDate: string }
  ) {
    const response = await axiosInstance.put(`${this.baseUrl}/${id}`, {
      name: assetData.name,
      categoryId: assetData.categoryId,
      purchaseDate: assetData.purchaseDate,
      status: status,
    });
    return response.data;
  }

  async getAllAssetRequests(filters?: {
    requester?: string;
    tenant?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.requester) params.append('requester', filters.requester);
    if (filters?.tenant) params.append('tenant', filters.tenant);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await axiosInstance.get(
      `${this.assetRequestsUrl}?${params.toString()}`
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
  }

  async getAssetRequestById(
    id: string,
    filters?: { page?: number; limit?: number }
  ) {
    const userStr = localStorage.getItem('user');
    let currentUserId = '';
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        currentUserId = user.id || user.user_id || '';
      } catch {
        // Ignore malformed user data
      }
    }

    const params = new URLSearchParams();
    params.append('requestedBy', currentUserId);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await axiosInstance.get(
      `${this.assetRequestsUrl}/?${params.toString()}`
    );

    const responseData = response.data;

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

    return {
      items: responseData.items || responseData.data || [],
      total: responseData.total || 0,
      page: responseData.page || 1,
      limit: responseData.limit || 25,
      totalPages: responseData.totalPages || 1,
      counts: responseData.counts || undefined,
    };
  }

  async getManagerTeamAssetRequests(filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await axiosInstance.get(
      `${this.assetRequestsUrl}/team?${params.toString()}`
    );

    const responseData = response.data;

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

    // Fallback for other structures if necessary, though the prompt specifies the structure.
    return {
      items: [],
      total: 0,
      page: 1,
      limit: 25,
      totalPages: 1,
      counts: undefined,
    };
  }

  async createAssetRequest(data: CreateAssetRequestRequest) {
    const response = await axiosInstance.post(this.assetRequestsUrl, data);
    return response.data;
  }

  async approveAssetRequest(id: string, data?: ApproveAssetRequestRequest) {
    try {
      const response = await axiosInstance.put(
        `${this.assetRequestsUrl}/${id}/approve`,
        data || {}
      );
      return response.data;
    } catch (bodyError: unknown) {

      if (data?.asset_id || data?.assetId) {
        const assetId = data.asset_id || data.assetId;
        try {
          const url = `${this.assetRequestsUrl}/${id}/approve?asset_id=${assetId}`;
          const response = await axiosInstance.put(url, {});
          return response.data;
        } catch {
          const response = await axiosInstance.put(
            `${this.assetRequestsUrl}/${id}/approve`,
            { asset_id: assetId }
          );
          return response.data;
        }
      }
      throw bodyError;
    }
  }

  async rejectAssetRequest(id: string, rejectionReason?: string) {
    const response = await axiosInstance.put(
      `${this.assetRequestsUrl}/${id}/reject`,
      { rejection_reason: rejectionReason }
    );
    return response.data;
  }

  async deleteAssetRequest(id: string) {
    const response = await axiosInstance.delete(
      `${this.assetRequestsUrl}/${id}`
    );
    return response.data;
  }

  async addAssetRequestComment(id: string, comment: string) {
    const response = await axiosInstance.post(
      `${this.assetRequestsUrl}/${id}/comments`,
      { comment }
    );
    return response.data;
  }

  async getAssetRequestComments(id: string) {
    const response = await axiosInstance.get(
      `${this.assetRequestsUrl}/${id}/comments`
    );
    return response.data;
  }

  async getAllAssetSubcategories(filters?: {
    category?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await axiosInstance.get(
      `${this.assetSubcategoriesUrl}?${params.toString()}`
    );
    return response.data;
  }

  async getAssetSubcategoryById(id: string) {
    const response = await axiosInstance.get(
      `${this.assetSubcategoriesUrl}/${id}`
    );
    return response.data;
  }

  async createAssetSubcategory(data: CreateAssetSubcategoryRequest) {
    const response = await axiosInstance.post(this.assetSubcategoriesUrl, data);
    return response.data;
  }

  async updateAssetSubcategory(
    id: string,
    data: UpdateAssetSubcategoryRequest
  ) {
    const response = await axiosInstance.put(
      `${this.assetSubcategoriesUrl}/${id}`,
      data
    );
    return response.data;
  }

  async deleteAssetSubcategory(id: string) {
    const response = await axiosInstance.delete(
      `${this.assetSubcategoriesUrl}/${id}`
    );
    return response.data;
  }

  async getAssetSubcategoriesByCategory() {
    const response = await axiosInstance.get(
      `${this.assetSubcategoriesUrl}/categories`
    );
    return response.data;
  }

  async getAllAssetCategories() {
    const response = await axiosInstance.get(this.assetCategoriesUrl);
    return response.data;
  }

  async getAssetSubcategoriesByCategoryId(categoryId: string) {
    const params = new URLSearchParams();
    params.append('category_id', categoryId);

    try {
      const response = await axiosInstance.get(
        `${this.assetSubcategoriesUrl}?${params.toString()}`
      );
      return response.data;
    } catch {
      return this.getAllAssetSubcategories({ category: categoryId });
    }
  }

  async getSystemAssets(filters?: {
    category?: string;
    tenantId?: string;
    assigned?: 'assigned' | 'unassigned';
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.tenantId) params.append('tenantId', filters.tenantId);
    if (filters?.assigned) params.append('assigned', filters.assigned);
    if (filters?.page !== undefined && filters.page !== null) {
      params.append('page', filters.page.toString());
    }
    if (filters?.limit !== undefined && filters.limit !== null) {
      params.append('limit', filters.limit.toString());
    } else {
      params.append('limit', '25');
    }

    const response = await axiosInstance.get<{
      items: SystemAsset[];
      total?: number;
      page?: number;
      limit?: number;
      totalPages?: number;
    }>(`/system/assets/?${params.toString()}`);

    const responseData = response.data;

    if (
      responseData &&
      typeof responseData === 'object' &&
      'items' in responseData
    ) {
      return {
        items: Array.isArray(responseData.items) ? responseData.items : [],
        total: responseData.total ?? 0,
        page: responseData.page ?? 1,
        limit: responseData.limit ?? 25,
        totalPages: responseData.totalPages ?? 1,
      };
    }

    return {
      items: [],
      total: 0,
      page: 1,
      limit: 25,
      totalPages: 1,
    };
  }

  async getSystemAssetsSummary() {
    const response = await axiosInstance.get('/system/assets/summary/');
    return response.data;
  }
}

export const assetApiService = new AssetApiService();

export const assetApi = assetApiService;

export interface SystemAsset {
  id: string;
  name: string;
  category_id: string;
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
  } | null;
  category?: {
    id: string;
    name: string;
    description?: string | null;
    icon?: string | null;
    tenant_id: string;
    created_at: string;
  };
  subcategory?: {
    id: string;
    name: string;
    category_id: string;
    description?: string | null;
    tenant_id: string;
    created_at: string;
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
