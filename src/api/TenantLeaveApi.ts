import axiosInstance from './axiosInstance';

export interface SystemLeaveFilters {
  tenantId?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'withdrawn' | 'cancelled';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface SystemLeaveResponse {
  id: string;
  tenantId: string;
  tenantName?: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn' | 'cancelled';
  createdAt: string;
}

export interface SystemLeaveSummary {
  tenantId: string;
  tenantName: string;
  totalLeaves: number;
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
  cancelledCount: number;
}

export interface TenantListItem {
  id: string;
  name: string;
  status: string;
  isDeleted: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  tenant_id: string;
  created_at: string;
}

export const TenantLeaveApi = {
  getSystemTenants: async (
    page: number = 1,
    includeDeleted: boolean = false
  ): Promise<TenantListItem[]> => {
    try {
      const { data } = await axiosInstance.get('/system/tenants', {
        params: {
          page,
          includeDeleted: includeDeleted.toString(),
          limit: 1000, 
        },
      });

      if (!Array.isArray(data)) {
        return [];
      }

      return data.map((tenant: any) => ({
        id: tenant.id,
        name: tenant.name,
        status: tenant.status,
        isDeleted: tenant.isDeleted,
        created_at: tenant.created_at,
        updated_at: tenant.updated_at,
        deleted_at: tenant.deleted_at,
      }));
    } catch (error: any) {
      return [];
    }
  },
  getSystemLeaves: async (
    filters: SystemLeaveFilters = {}
  ): Promise<{
    items: SystemLeaveResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    try {
      const params: Record<string, any> = {
        page: filters.page ?? 1,
        limit: filters.limit ?? 10,
      };

      if (filters.tenantId) params.tenantId = filters.tenantId;
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const [{ data: leavesData }, { data: tenantsData }] = await Promise.all([
        axiosInstance.get('/system/leaves', { params }),
        axiosInstance.get('/system/tenants', {
          params: { page: 1, includeDeleted: 'false', limit: 1000 },
        }),
      ]);

      const tenantMap: Record<string, string> = {};
      if (Array.isArray(tenantsData)) {
        tenantsData.forEach((tenant: TenantListItem) => {
          tenantMap[tenant.id] = tenant.name;
        });
      }

      const items: SystemLeaveResponse[] = Array.isArray(leavesData.items)
        ? leavesData.items
        : Array.isArray(leavesData)
          ? leavesData
          : [];

      const enrichedItems = items.map(leave => ({
        ...leave,
        tenantName: leave.tenantName || tenantMap[leave.tenantId] || 'Unknown',
      }));

      const total =
        typeof leavesData.total === 'number' ? leavesData.total : items.length;
      const page = leavesData.page ?? 1;
      const limit = leavesData.limit ?? items.length;
      const totalPages =
        leavesData.totalPages ?? Math.ceil(total / (limit || 1));

      return { items: enrichedItems, total, page, limit, totalPages };
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch system leaves'
      );
    }
  },

  getSystemLeaveSummary: async (
    filters: {
      tenantId?: string;
      status?: 'pending' | 'approved' | 'rejected' | 'withdrawn' | 'cancelled';
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<SystemLeaveSummary[]> => {
    try {
      const params: Record<string, any> = {};
      if (filters.tenantId) params.tenantId = filters.tenantId;
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const { data } = await axiosInstance.get('/system/leaves/summary', {
        params,
      });

      if (!Array.isArray(data)) {
        return [];
      }

      return data.map(item => ({
        tenantId: item.tenantId || 'system',
        tenantName: item.tenantName || 'System / Unassigned',
        totalLeaves: Number(item.totalLeaves ?? 0),
        approvedCount: Number(item.approvedCount ?? 0),
        rejectedCount: Number(item.rejectedCount ?? 0),
        pendingCount: Number(item.pendingCount ?? 0),
        cancelledCount: Number(item.cancelledCount ?? 0),
      }));
    } catch (error: any) {
      return [];
    }
  },

  getDepartments: async (tenantId?: string): Promise<Department[]> => {
    try {
      const { data } = await axiosInstance.get('/departments', {
        params: tenantId ? { tenantId } : {},
      });

      if (!Array.isArray(data)) return [];

      return data.map((dept: any) => ({
        id: dept.id,
        name: dept.name,
        description: dept.description,
        tenant_id: dept.tenant_id,
        created_at: dept.created_at,
      }));
    } catch (error: any) {
      return [];
    }
  },
};
