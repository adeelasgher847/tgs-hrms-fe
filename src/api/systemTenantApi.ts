import axiosInstance from './axiosInstance';
import type { AxiosResponse } from 'axios';

export interface SystemTenant {
  id: string;
  name: string;
  status: 'active' | 'suspended';
  isDeleted: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SystemTenantDetail {
  id: string;
  name: string;
  status: 'active' | 'suspended';
  created_at: string;
  departmentCount: number;
  employeeCount: number;
  departments: Array<{
    id?: string;
    name?: string;
  }>;
}

export interface SystemTenantFilters {
  page?: number;
  limit?: number;
  includeDeleted?: boolean;
}

export const SystemTenantApi = {
  /**
   * ✅ 1. Get paginated list of tenants
   * @param filters - Optional filters like page, limit, includeDeleted
   * @returns { data, total, page, totalPages }
   */
  getAll: async (
    filters: SystemTenantFilters = { page: 1, limit: 10 }
  ): Promise<{
    data: SystemTenant[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    try {
      const response: AxiosResponse<SystemTenant[]> = await axiosInstance.get(
        '/system/tenants',
        {
          params: {
            page: filters.page ?? 1,
            limit: filters.limit ?? 10,
            includeDeleted: filters.includeDeleted ?? false,
          },
        }
      );

      /**
       * 🔹 Some backends include pagination metadata in headers (e.g. X-Total-Count)
       * 🔹 Others embed it in the JSON response (e.g. { data, total, page, totalPages })
       * This version gracefully handles both.
       */
      const total =
        Number(response.headers['x-total-count']) ||
        (response.data as any)?.total ||
        0;

      const page = (response.data as any)?.page || filters.page || 1;

      const totalPages =
        (response.data as any)?.totalPages ||
        (total > 0 ? Math.ceil(total / (filters.limit ?? 10)) : 1);

      // ✅ Normalize return shape
      const tenants = Array.isArray(response.data)
        ? response.data
        : (response.data as any)?.data || [];

      return {
        data: tenants,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      console.error('❌ Failed to fetch tenants:', error);
      throw error;
    }
  },

  /**
   * ✅ 2. Get tenant details by ID
   */
  getById: async (id: string): Promise<SystemTenantDetail> => {
    try {
      const response: AxiosResponse<SystemTenantDetail> =
        await axiosInstance.get(`/system/tenants/${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to fetch tenant details (id=${id}):`, error);
      throw error;
    }
  },

  /**
   * ✅ 3. Create new tenant
   */
  create: async (data: { name: string }): Promise<SystemTenant> => {
    try {
      const response: AxiosResponse<SystemTenant> = await axiosInstance.post(
        '/system/tenants',
        data
      );
      console.log('✅ Tenant created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to create tenant:', error);
      throw error;
    }
  },

  /**
   * ✅ 4. Update tenant status
   */
  updateStatus: async (
    id: string,
    status: 'active' | 'suspended'
  ): Promise<SystemTenant> => {
    try {
      const response = await axiosInstance.put(
        `/system/tenants/${id}/status`,
        {},
        {
          params: { status },
          headers: { 'Content-Type': 'application/json' },
        }
      );
      console.log('✅ System tenant status updated:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(
        `❌ Failed to update status (id=${id}):`,
        error.response?.data || error
      );
      throw error;
    }
  },

  /**
   * ✅ 5. Delete tenant
   */
  remove: async (id: string): Promise<{ deleted: boolean; id: string }> => {
    try {
      const response: AxiosResponse<{ deleted: boolean; id: string }> =
        await axiosInstance.delete(`/system/tenants/${id}`);
      console.log('✅ Tenant deleted:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to delete tenant (id=${id}):`, error);
      throw error;
    }
  },

  /**
   * ✅ 6. Restore deleted tenant
   */
  restore: async (id: string): Promise<{ restored: boolean; id: string }> => {
    try {
      const response: AxiosResponse<{ restored: boolean; id: string }> =
        await axiosInstance.put(`/system/tenants/${id}/restore`);
      console.log('✅ Tenant restored successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to restore tenant (id=${id}):`, error);
      throw error;
    }
  },
};
