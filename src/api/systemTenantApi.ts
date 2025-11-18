import axiosInstance from './axiosInstance';
import type { AxiosError, AxiosResponse } from 'axios';

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

interface PaginatedSystemTenantsResponse {
  data?: SystemTenant[];
  total?: number;
  page?: number;
  totalPages?: number;
}

export const SystemTenantApi = {
  /**
   * @param filters
   * @returns { data, total, page, totalPages }
   */
  getAll: async (
    filters: SystemTenantFilters = { page: 1, limit: 25 }
  ): Promise<{
    data: SystemTenant[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    try {
      const response: AxiosResponse<
        PaginatedSystemTenantsResponse | SystemTenant[]
      > = await axiosInstance.get('/system/tenants', {
        params: {
          page: filters.page ?? 1,
          limit: filters.limit ?? 25,
          includeDeleted: filters.includeDeleted ?? false,
        },
      });

      const payload = response.data;

      const totalFromResponse =
        !Array.isArray(payload) && typeof payload?.total === 'number'
          ? payload.total
          : null;
      const totalHeader = Number(response.headers['x-total-count']);
      const total =
        totalFromResponse ?? (!Number.isNaN(totalHeader) ? totalHeader : 0);

      const page =
        !Array.isArray(payload) && typeof payload?.page === 'number'
          ? payload.page
          : (filters.page ?? 1);

      const totalPagesFromResponse =
        !Array.isArray(payload) && typeof payload?.totalPages === 'number'
          ? payload.totalPages
          : null;
      const totalPages =
        totalPagesFromResponse ??
        (total > 0 ? Math.ceil(total / (filters.limit ?? 25)) : 1);

      let tenants: SystemTenant[] = [];
      if (Array.isArray(payload)) {
        tenants = payload;
      } else if (payload && typeof payload === 'object') {
        tenants = (payload.items ?? payload.data ?? []) as SystemTenant[];
      }

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

  create: async (data: {
    name: string;
    domain?: string;
    logo?: string | File;
    adminName?: string;
    adminEmail?: string;
  }): Promise<SystemTenant> => {
    try {
      if (data.logo instanceof File) {
        const formData = new FormData();
        formData.append('name', String(data.name || ''));
        formData.append('domain', String(data.domain || ''));
        formData.append('logo', data.logo);
        formData.append('adminName', String(data.adminName || ''));
        formData.append('adminEmail', String(data.adminEmail || ''));

        console.log('Sending FormData with fields:', {
          name: data.name,
          domain: data.domain,
          logo: data.logo.name,
          adminName: data.adminName,
          adminEmail: data.adminEmail,
        });

        const response: AxiosResponse<SystemTenant> = await axiosInstance.post(
          '/system/tenants',
          formData
        );
        console.log(' Tenant created successfully:', response.data);
        return response.data;
      } else {
        const response: AxiosResponse<SystemTenant> = await axiosInstance.post(
          '/system/tenants',
          data
        );
        console.log(' Tenant created successfully:', response.data);
        return response.data;
      }
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
      const axiosError = error as AxiosError<{ message?: string }>;
      console.error(
        ` Failed to update status (id=${id}):`,
        axiosError.response?.data ?? axiosError.message
      );
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

  update: async (data: {
    tenantId: string;
    companyName: string;
    domain: string;
    logo: string;
  }): Promise<SystemTenant> => {
    try {
      const response: AxiosResponse<SystemTenant> = await axiosInstance.put(
        '/system/tenants',
        data
      );

      console.log(' Tenant updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error(` Failed to update tenant (id=${data.tenantId}):`, error);
      throw error;
    }
  },

  getAllTenants: async (includeDeleted = true): Promise<SystemTenant[]> => {
    try {
      const res = await axiosInstance.get<
        | SystemTenant[]
        | { items: SystemTenant[]; total?: number; data?: SystemTenant[] }
      >('/system/tenants', {
        params: { includeDeleted },
      });

      let tenants: SystemTenant[] = [];

      if (Array.isArray(res.data)) {
        tenants = res.data;
      } else if (res.data && typeof res.data === 'object') {
        if ('items' in res.data && Array.isArray(res.data.items)) {
          tenants = res.data.items;
          const total = res.data.total || res.data.items.length;
          if (total > res.data.items.length) {
            let page = 2;
            const perPage = res.data.items.length || 25;
            while (tenants.length < total) {
              const pageRes = await axiosInstance.get<
                | SystemTenant[]
                | { items: SystemTenant[]; data?: SystemTenant[] }
              >('/system/tenants', {
                params: { page, includeDeleted, limit: perPage },
              });

              let pageTenants: SystemTenant[] = [];
              if (Array.isArray(pageRes.data)) {
                pageTenants = pageRes.data;
              } else if (pageRes.data && typeof pageRes.data === 'object') {
                if (
                  'items' in pageRes.data &&
                  Array.isArray(pageRes.data.items)
                ) {
                  pageTenants = pageRes.data.items;
                } else if (
                  'data' in pageRes.data &&
                  Array.isArray(pageRes.data.data)
                ) {
                  pageTenants = pageRes.data.data;
                }
              }

              if (pageTenants.length === 0) break;
              tenants = [...tenants, ...pageTenants];
              page++;
            }
          }
        } else if ('data' in res.data && Array.isArray(res.data.data)) {
          tenants = res.data.data;
        }
      }

      console.log(`Fetched ${tenants.length} tenants`);
      return tenants;
    } catch (error) {
      console.error('Error fetching tenants:', error);
      return [];
    }
  },
};
