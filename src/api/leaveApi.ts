import axiosInstance from './axiosInstance';

export interface CreateLeaveRequest {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface LeaveType {
  id: string;
  name: string;
  description?: string;
}

export interface LeaveTypeListResponse {
  items: LeaveType[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface LeaveResponse {
  id: string;
  employeeId?: string;
  leaveTypeId?: string;
  startDate: string;
  endDate: string;
  totalDays?: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn' | 'cancelled';
  approvedBy?: string;
  tenantId?: string;
  createdAt?: string;
  approvedAt?: string | null;
  remarks?: string | null;
}

export interface LeaveWithUser extends LeaveResponse {
  user: {
    id: string;
    name: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

export interface UpdateLeaveStatusRequest {
  status: 'approved' | 'rejected';
}

export const leaveApi = {
  createLeave: async (data: CreateLeaveRequest): Promise<LeaveResponse> => {
    try {
      const response = await axiosInstance.post('/leaves', data);
      return response.data;
    } catch (error) {
      console.error('Failed to create leave:', error);
      throw error;
    }
  },

  getUserLeaves: async (
    userId?: string,
    page = 1
  ): Promise<{
    items: LeaveResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    try {
      const params = userId ? { userId, page, limit: 25 } : { page, limit: 25 };
      const response = await axiosInstance.get('/leaves', { params });
      console.log('User leaves response:', response);
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
      console.error('Failed to fetch user leaves:', error);
      throw error;
    }
  },

  getAllLeaves: async (
    page = 1
  ): Promise<{
    items: LeaveWithUser[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    try {
      const response = await axiosInstance.get('/leaves/all', {
        params: { page, limit: 25 },
      });
      console.log('All leaves response:', response);
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
      console.error('Failed to fetch all leaves:', error);
      throw error;
    }
  },

  getTeamLeaves: async (
    page = 1
  ): Promise<{
    items: LeaveWithUser[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    try {
      const response = await axiosInstance.get('/leaves/team', {
        params: { page, limit: 25 },
      });
      console.log('Team leaves response:', response);
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
      console.error('Failed to fetch team leaves:', error);
      throw error;
    }
  },

  updateLeaveStatus: async (
    id: string,
    status: 'approved' | 'rejected'
  ): Promise<LeaveResponse> => {
    try {
      const response = await axiosInstance.patch(`/leaves/${id}`, { status });
      return response.data;
    } catch (error) {
      console.error(`Failed to update leave ${id} status:`, error);
      throw error;
    }
  },

  cancelLeave: async (id: string): Promise<LeaveResponse> => {
    try {
      const response = await axiosInstance.patch(`/leaves/${id}/cancel`);
      return response.data;
    } catch (error) {
      console.error(`Failed to cancel leave ${id}:`, error);
      throw error;
    }
  },

  approveLeave: async (id: string): Promise<LeaveResponse> => {
    try {
      const response = await axiosInstance.put(`/leaves/${id}/approve`);
      return response.data;
    } catch (error) {
      console.error(`Failed to approve leave ${id}:`, error);
      throw error;
    }
  },

  rejectLeave: async (
    id: string,
    data?: { remarks?: string }
  ): Promise<LeaveResponse> => {
    try {
      const response = await axiosInstance.put(`/leaves/${id}/reject`, data);
      return response.data;
    } catch (error) {
      console.error(`Failed to reject leave ${id}:`, error);
      throw error;
    }
  },

  getLeaveTypes: async (
    params: { page?: number; limit?: number } = { page: 1, limit: 50 }
  ): Promise<LeaveTypeListResponse> => {
    try {
      const response = await axiosInstance.get('/leave-types', { params });
      const data = response.data;
      if (data && Array.isArray(data.items)) {
        return data;
      }
      if (Array.isArray(data)) {
        return {
          items: data,
          total: data.length,
          page: 1,
          limit: data.length,
          totalPages: 1,
        };
      }
      return { items: [] };
    } catch (error) {
      console.error('Failed to fetch leave types:', error);
      throw error;
    }
  },
};
