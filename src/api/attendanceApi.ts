// attendanceApi.ts
import axiosInstance from './axiosInstance';

export interface AttendanceEvent {
  id: string;
  user_id: string;
  timestamp: string;
  type: 'check-in' | 'check-out' | string;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface AttendanceRecord {
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workedHours: number;
}

export interface AttendanceResponse {
  items: AttendanceEvent[] | AttendanceRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class AttendanceApiService {
  private baseUrl = '/attendance';

  // Get all attendance records (Admin only)
  async getAllAttendance(page: number = 1): Promise<AttendanceResponse> {
    try {
      const response = await axiosInstance.get(
        `${this.baseUrl}/all?page=${page}`
      );

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
    } catch {
      return {
        items: [],
        total: 0,
        page: 1,
        limit: 25,
        totalPages: 1,
      };
    }
  }

  // Get attendance events for a user
  async getAttendanceEvents(
    userId?: string,
    page: number = 1
  ): Promise<AttendanceResponse> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (userId) {
        params.append('userId', userId);
      }

      const url = `${this.baseUrl}/events?${params.toString()}`;

      const response = await axiosInstance.get(url);

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
    } catch {
      return {
        items: [],
        total: 0,
        page: 1,
        limit: 25,
        totalPages: 1,
      };
    }
  }

  // Get daily summaries for a user
  async getDailySummaries(
    userId?: string,
    page: number = 1
  ): Promise<AttendanceResponse> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (userId) {
        params.append('userId', userId);
      }

      const url = `${this.baseUrl}?${params.toString()}`;

      const response = await axiosInstance.get(url);

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
    } catch {
      return {
        items: [],
        total: 0,
        page: 1,
        limit: 25,
        totalPages: 1,
      };
    }
  }

  // Get today's summary
  async getTodaySummary(
    userId?: string
  ): Promise<{ checkIn: string | null; checkOut: string | null }> {
    try {
      const params = new URLSearchParams();
      if (userId) {
        params.append('userId', userId);
      }

      const url = `${this.baseUrl}/today?${params.toString()}`;

      const response = await axiosInstance.get(url);

      return response.data;
    } catch {
      return {
        checkIn: null,
        checkOut: null,
      };
    }
  }

  // Create attendance record
  async createAttendance(
    type: 'check-in' | 'check-out'
  ): Promise<AttendanceEvent> {
    const response = await axiosInstance.post(this.baseUrl, { type });
    return response.data;
  }

  // Get team attendance for manager
  async getTeamAttendance(page: number = 1): Promise<{ items: AttendanceEvent[]; total: number; page: number; totalPages: number }> {
    try {
      const response = await axiosInstance.get(
        `${this.baseUrl}/team?page=${page}`
      );
      return response.data;
    } catch {
      return {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
    }
  }
}

const attendanceApi = new AttendanceApiService();
export default attendanceApi;
