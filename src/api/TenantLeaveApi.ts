import axiosInstance from './axiosInstance';

export interface SystemLeaveFilters {
  tenantId?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'withdrawn' | 'cancelled';
  startDate?: string;
  endDate?: string;
  page?: number;
}

export interface SystemLeaveResponse {
  id: string;
  tenantId?: string;
  tenantName?: string;
  employeeName?: string;
  leaveType?: string;
  startDate: string;
  endDate: string;
  totalDays?: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn' | 'cancelled';
  createdAt?: string;
}

export interface SystemLeaveSummary {
  tenantId: string;
  tenantName: string;
  totalLeaves: number;
  approved: number;
  rejected: number;
  pending: number;
}

export const TenantLeaveApi = {
  // ✅ 1. Get all leaves across tenants (with filters)
  getSystemLeaves: async (
    filters: SystemLeaveFilters
  ): Promise<{
    items: SystemLeaveResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    try {
      const response = await axiosInstance.get('/system/leaves', { params: filters });
      console.log('System leaves response:', response);
      const data = response.data;

      if (data && data.items) return data;
      if (Array.isArray(data)) {
        return {
          items: data,
          total: data.length,
          page: 1,
          limit: 25,
          totalPages: 1,
        };
      }
      return { items: [], total: 0, page: 1, limit: 25, totalPages: 1 };
    } catch (error) {
      console.error('❌ Failed to fetch system leaves:', error);
      throw error;
    }
  },

  // ✅ 2. Get aggregated summary data across tenants
  getSystemLeaveSummary: async (): Promise<SystemLeaveSummary[]> => {
    try {
      const response = await axiosInstance.get('/system/leaves/summary');
      console.log('System leave summary response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch leave summary:', error);
      throw error;
    }
  },
};
