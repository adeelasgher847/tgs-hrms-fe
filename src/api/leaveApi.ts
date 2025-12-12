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

class LeaveApiService {
  private baseUrl = '/leaves';

  async createLeave(data: CreateLeaveRequest): Promise<LeaveResponse> {
    const response = await axiosInstance.post<LeaveResponse>(
      this.baseUrl,
      data
    );
    return response.data;
  }

  async getUserLeaves(
    userId?: string,
    page = 1
  ): Promise<{
    items: LeaveResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const params = userId ? { userId, page, limit: 25 } : { page, limit: 25 };
    const response = await axiosInstance.get(this.baseUrl, { params });
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
  }

  async getAllLeaves(page = 1): Promise<{
    items: LeaveWithUser[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const response = await axiosInstance.get(`${this.baseUrl}/all`, {
      params: { page, limit: 25 },
    });
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
  }

  async getTeamLeaves(page = 1): Promise<{
    items: LeaveWithUser[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const response = await axiosInstance.get(`${this.baseUrl}/team`, {
      params: { page, limit: 25 },
    });
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
  }

  async updateLeaveStatus(
    id: string,
    status: 'approved' | 'rejected'
  ): Promise<LeaveResponse> {
    const response = await axiosInstance.patch<LeaveResponse>(
      `${this.baseUrl}/${id}`,
      { status }
    );
    return response.data;
  }

  async cancelLeave(id: string): Promise<LeaveResponse> {
    const response = await axiosInstance.patch<LeaveResponse>(
      `${this.baseUrl}/${id}/cancel`
    );
    return response.data;
  }

  async approveLeave(id: string): Promise<LeaveResponse> {
    const response = await axiosInstance.put<LeaveResponse>(
      `${this.baseUrl}/${id}/approve`
    );
    return response.data;
  }

  async rejectLeave(
    id: string,
    data?: { remarks?: string }
  ): Promise<LeaveResponse> {
    const response = await axiosInstance.put<LeaveResponse>(
      `${this.baseUrl}/${id}/reject`,
      data
    );
    return response.data;
  }

  async getLeaveTypes(
    params: { page?: number; limit?: number } = { page: 1, limit: 50 }
  ): Promise<LeaveTypeListResponse> {
    const response = await axiosInstance.get<LeaveTypeListResponse>(
      '/leave-types',
      { params }
    );
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
  }

  async exportSelfLeavesCSV(): Promise<Blob> {
    const response = await axiosInstance.get(`${this.baseUrl}/export/self`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async exportTeamLeavesCSV(): Promise<Blob> {
    const response = await axiosInstance.get(`${this.baseUrl}/export/team`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async exportAllLeavesCSV(): Promise<Blob> {
    const response = await axiosInstance.get(`${this.baseUrl}/export/all`, {
      responseType: 'blob',
    });
    return response.data;
  }
}

export const leaveApiService = new LeaveApiService();

// Maintain backward compatibility - export as leaveApi as well
export const leaveApi = leaveApiService;
