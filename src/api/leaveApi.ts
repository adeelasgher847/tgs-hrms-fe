import axiosInstance from './axiosInstance';

export interface CreateLeaveRequest {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
  documents?: File[];
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
  managerRemarks?: string | null;
}

export interface CreateLeaveForEmployeeRequest {
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
  documents?: File[];
}

export interface UpdateLeaveRequest {
  leaveTypeId?: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
  documents?: File[];
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
    const formData = new FormData();

    formData.append('leaveTypeId', data.leaveTypeId);
    formData.append('startDate', data.startDate);
    formData.append('endDate', data.endDate);
    formData.append('reason', data.reason);

    if (data.documents && Array.isArray(data.documents)) {
      data.documents.forEach(file => {
        formData.append('documents', file);
      });
    }

    const response = await axiosInstance.post<LeaveResponse>(
      this.baseUrl,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
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

  async getAllLeaves(
    page = 1,
    filters?: { month?: number; year?: number; status?: string }
  ): Promise<{
    items: LeaveWithUser[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    type AllLeaveParams = {
      page: number;
      limit: number;
      month?: number;
      year?: number;
      status?: string;
    };
    const params: AllLeaveParams = { page, limit: 25 };
    if (filters?.month) params.month = filters.month;
    if (filters?.year) params.year = filters.year;
    if (filters?.status) params.status = filters.status;

    const response = await axiosInstance.get(`${this.baseUrl}/all`, {
      params,
    });
    return response.data;
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

  async rejectLeave(id: string): Promise<LeaveResponse> {
    // Admin/HR admin rejectLeave API no longer accepts remarks parameter
    const response = await axiosInstance.put<LeaveResponse>(
      `${this.baseUrl}/${id}/reject`
    );
    return response.data;
  }

  async approveManagerLeave(
    id: string,
    data: { managerRemarks: string }
  ): Promise<LeaveResponse> {
    // Ensure managerRemarks is trimmed and not empty
    const trimmedRemarks = data.managerRemarks?.trim() || '';
    if (!trimmedRemarks) {
      throw new Error('Manager remarks cannot be empty');
    }

    // Use the correct endpoint: PATCH /leaves/{id}/manager-remarks
    // Backend expects 'remarks' field in request body, but returns 'managerRemarks' in response
    const payload = {
      remarks: trimmedRemarks,
    };

    const response = await axiosInstance.patch<LeaveResponse>(
      `${this.baseUrl}/${id}/manager-remarks`,
      payload
    );
    return response.data;
  }

  async approveLeaveByManager(
    id: string,
    data?: { remarks?: string }
  ): Promise<LeaveResponse> {
    // PATCH:/leaves/{id}/approve-manager
    // Remarks are optional for approval
    const payload = data?.remarks?.trim()
      ? { remarks: data.remarks.trim() }
      : {};

    const response = await axiosInstance.patch<LeaveResponse>(
      `${this.baseUrl}/${id}/approve-manager`,
      payload
    );
    return response.data;
  }

  async rejectLeaveByManager(
    id: string,
    data: { remarks: string }
  ): Promise<LeaveResponse> {
    // PATCH:/leaves/{id}/reject-manager
    // Remarks are required for rejection
    const trimmedRemarks = data.remarks?.trim() || '';
    if (!trimmedRemarks) {
      throw new Error('Rejection remarks cannot be empty');
    }

    const payload = {
      remarks: trimmedRemarks,
    };

    const response = await axiosInstance.patch<LeaveResponse>(
      `${this.baseUrl}/${id}/reject-manager`,
      payload
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

  async createLeaveForEmployee(
    data: CreateLeaveForEmployeeRequest
  ): Promise<LeaveResponse> {
    const formData = new FormData();

    formData.append('employeeId', data.employeeId);
    formData.append('leaveTypeId', data.leaveTypeId);
    formData.append('startDate', data.startDate);
    formData.append('endDate', data.endDate);
    formData.append('reason', data.reason);

    if (data.documents && Array.isArray(data.documents)) {
      data.documents.forEach(file => {
        formData.append('documents', file);
      });
    }

    const response = await axiosInstance.post<LeaveResponse>(
      `${this.baseUrl}/for-employee`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  async updateLeave(
    id: string,
    data: UpdateLeaveRequest
  ): Promise<LeaveResponse> {
    const formData = new FormData();

    // Append ONLY provided fields
    if (data.leaveTypeId) {
      formData.append('leaveTypeId', data.leaveTypeId);
    }

    if (data.startDate) {
      formData.append('startDate', data.startDate);
    }

    if (data.endDate) {
      formData.append('endDate', data.endDate);
    }

    if (data.reason) {
      formData.append('reason', data.reason);
    }

    if (data.documents && Array.isArray(data.documents)) {
      data.documents.forEach(file => {
        formData.append('documents', file);
      });
    }

    const response = await axiosInstance.patch<LeaveResponse>(
      `${this.baseUrl}/${id}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  }
}

export const leaveApiService = new LeaveApiService();
export const leaveApi = leaveApiService;
