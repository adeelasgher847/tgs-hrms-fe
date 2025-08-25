import axiosInstance from './axiosInstance';

// Types
export interface CreateLeaveRequest {
  fromDate: string;
  toDate: string;
  reason: string;
  type: string;
}

export interface LeaveResponse {
  id: string;
  userId?: string;
  user_id?: string;
  from_date: string;
  to_date: string;
  reason: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  applied?: string; // Applied date
  created_at?: string;
  updated_at?: string;
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

// API Methods
export const leaveApi = {
  // Create Leave Request
  createLeave: async (data: CreateLeaveRequest): Promise<LeaveResponse> => {
    // Transform data to match API expectations (from_date, to_date)
    const apiData = {
      from_date: data.fromDate,
      to_date: data.toDate,
      reason: data.reason,
      type: data.type,
    };

    console.log('Sending leave request:', apiData);
    const response = await axiosInstance.post('/leaves', apiData);
    return response.data;
  },

  // Get Leaves for User with pagination
  getUserLeaves: async (userId?: string, page: number = 1): Promise<{
    items: LeaveResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    const params = userId ? { userId, page } : { page };
    const response = await axiosInstance.get('/leaves', { params });
    
    // Handle both paginated and non-paginated responses
    if (response.data && response.data.items) {
      return response.data;
    } else if (Array.isArray(response.data)) {
      return {
        items: response.data,
        total: response.data.length,
        page: 1,
        limit: 25,
        totalPages: 1,
      };
    } else {
      return {
        items: [],
        total: 0,
        page: 1,
        limit: 25,
        totalPages: 1,
      };
    }
  },

  // Get All Leaves (Admin Only) with pagination
  getAllLeaves: async (page: number = 1): Promise<{
    items: LeaveWithUser[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    const response = await axiosInstance.get('/leaves/all', { params: { page } });
    
    // Handle both paginated and non-paginated responses
    if (response.data && response.data.items) {
      return response.data;
    } else if (Array.isArray(response.data)) {
      return {
        items: response.data,
        total: response.data.length,
        page: 1,
        limit: 25,
        totalPages: 1,
      };
    } else {
      return {
        items: [],
        total: 0,
        page: 1,
        limit: 25,
        totalPages: 1,
      };
    }
  },

  // Update Leave Status (Admin Only)
  updateLeaveStatus: async (
    id: string,
    status: 'approved' | 'rejected'
  ): Promise<LeaveResponse> => {
    const response = await axiosInstance.patch(`/leaves/${id}`, { status });
    return response.data;
  },
};
