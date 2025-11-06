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
   * @param filters
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

      interface ResponseData {
        total?: number;
        page?: number;
        totalPages?: number;
        data?: SystemTenant[];
      }

      const responseData = response.data as SystemTenant[] | ResponseData;

      const total =
        Number(response.headers['x-total-count']) ||
        (Array.isArray(responseData) ? undefined : responseData?.total) ||
        0;

      const page =
        (Array.isArray(responseData) ? undefined : responseData?.page) ||
        filters.page ||
        1;

      const totalPages =
        (Array.isArray(responseData) ? undefined : responseData?.totalPages) ||
        (total > 0 ? Math.ceil(total / (filters.limit ?? 10)) : 1);

      const tenants = Array.isArray(responseData)
        ? responseData
        : responseData?.data || [];

      return {
        data: tenants,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      console.error(' Failed to fetch tenants:', error);
      throw error;
    }
  },

  getById: async (id: string): Promise<SystemTenantDetail> => {
    try {
      const response: AxiosResponse<SystemTenantDetail> =
        await axiosInstance.get(`/system/tenants/${id}`);
      return response.data;
    } catch (error) {
      console.error(` Failed to fetch tenant details (id=${id}):`, error);
      throw error;
    }
  },

  create: async (data: { name: string }): Promise<SystemTenant> => {
    try {
      const response: AxiosResponse<SystemTenant> = await axiosInstance.post(
        '/system/tenants',
        data
      );
      console.log(' Tenant created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error(' Failed to create tenant:', error);
      throw error;
    }
  },

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
      console.log(' System tenant status updated:', response.data);
      return response.data;
    } catch (error) {
      const errorData =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: unknown } }).response?.data
          : error;
      console.error(` Failed to update status (id=${id}):`, errorData);
      throw error;
    }
  },

  remove: async (id: string): Promise<{ deleted: boolean; id: string }> => {
    try {
      const response: AxiosResponse<{ deleted: boolean; id: string }> =
        await axiosInstance.delete(`/system/tenants/${id}`);
      console.log(' Tenant deleted:', response.data);
      return response.data;
    } catch (error) {
      console.error(` Failed to delete tenant (id=${id}):`, error);
      throw error;
    }
  },

  restore: async (id: string): Promise<{ restored: boolean; id: string }> => {
    try {
      const response: AxiosResponse<{ restored: boolean; id: string }> =
        await axiosInstance.put(`/system/tenants/${id}/restore`);
      console.log(' Tenant restored successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error(` Failed to restore tenant (id=${id}):`, error);
      throw error;
    }
  },

  update: async (
    id: string,
    data: { name?: string; status?: 'active' | 'suspended' }
  ): Promise<SystemTenant> => {
    try {
      const response: AxiosResponse<{
        statusCode: number;
        message: string;
        data: SystemTenant;
      }> = await axiosInstance.put(`/tenants/${id}`, data);

      console.log(' Tenant updated successfully:', response.data);
      return response.data.data;
    } catch (error) {
      console.error(` Failed to update tenant (id=${id}):`, error);
      throw error;
    }
  },

  getAllTenants: async (includeDeleted = true): Promise<SystemTenant[]> => {
    let page = 1;
    const perPage = 25;
    let allTenants: SystemTenant[] = [];
    let hasMoreData = true;

    while (hasMoreData) {
      const res = await axiosInstance.get<SystemTenant[]>('/system/tenants', {
        params: { page, includeDeleted },
      });

      const tenants = res.data ?? [];
      allTenants = [...allTenants, ...tenants];

      if (tenants.length < perPage) {
        hasMoreData = false;
      } else {
        page++;
      }
    }

    return allTenants;
  },
};
