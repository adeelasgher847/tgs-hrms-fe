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

      const total =
        Number(response.headers['x-total-count']) ||
        (response.data as any)?.total ||
        0;

      const page = (response.data as any)?.page || filters.page || 1;

      const totalPages =
        (response.data as any)?.totalPages ||
        (total > 0 ? Math.ceil(total / (filters.limit ?? 10)) : 1);

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
      throw error;
    }
  },

  getById: async (id: string): Promise<SystemTenantDetail> => {
    try {
      const response: AxiosResponse<SystemTenantDetail> =
        await axiosInstance.get(`/system/tenants/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  create: async (data: { name: string }): Promise<SystemTenant> => {
    try {
      const response: AxiosResponse<SystemTenant> = await axiosInstance.post(
        '/system/tenants',
        data
      );
      return response.data;
    } catch (error) {
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
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  remove: async (id: string): Promise<{ deleted: boolean; id: string }> => {
    try {
      const response: AxiosResponse<{ deleted: boolean; id: string }> =
        await axiosInstance.delete(`/system/tenants/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  restore: async (id: string): Promise<{ restored: boolean; id: string }> => {
    try {
      const response: AxiosResponse<{ restored: boolean; id: string }> =
        await axiosInstance.put(`/system/tenants/${id}/restore`);
      return response.data;
    } catch (error) {
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

      return response.data.data;
    } catch (error) {
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
