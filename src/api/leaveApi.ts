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

  // Get Leaves for User
  getUserLeaves: async (userId?: string): Promise<LeaveResponse[]> => {
    const params = userId ? { userId } : {};
    const response = await axiosInstance.get('/leaves', { params });
    return response.data;
  },

  // Get All Leaves (Admin Only)
  getAllLeaves: async (): Promise<LeaveWithUser[]> => {
    const response = await axiosInstance.get('/leaves/all');
    return response.data;
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
