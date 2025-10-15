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

export interface CreateAssetRequestRequest {
  assetCategory: string;
  remarks: string;
}

export interface ApproveAssetRequestRequest {
  asset_id?: string;
}

// Asset Management API Service
export const assetApi = {
  // Assets CRUD operations
  getAllAssets: async (filters?: { status?: string; category?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    
    const response = await axiosInstance.get(`/assets?${params.toString()}`);
    console.log("Response of Assets from data :",response.data.data)
    return response.data.data;
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
  getAllAssetRequests: async (filters?: { requester?: string; tenant?: string }) => {
    const params = new URLSearchParams();
    if (filters?.requester) params.append('requester', filters.requester);
    if (filters?.tenant) params.append('tenant', filters.tenant);
    
    const response = await axiosInstance.get(`/asset-requests?${params.toString()}`);
    console.log("Response of Asset Requests from data :",response.data)    
    return response.data;
  },

  getAssetRequestById: async (id: string) => {
    const response = await axiosInstance.get(`/asset-requests/${id}`);
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
