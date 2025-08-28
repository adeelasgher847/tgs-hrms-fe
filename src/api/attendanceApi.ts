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
      console.log('🔄 AttendanceApiService - getAllAttendance called with page:', page);
      
      const response = await axiosInstance.get(`${this.baseUrl}/all?page=${page}`);
      console.log('✅ AttendanceApiService - Raw response:', response.data);
      
      if (response.data && response.data.items) {
        console.log('✅ AttendanceApiService - Paginated response detected');
        return response.data;
      } else if (Array.isArray(response.data)) {
        console.log('✅ AttendanceApiService - Array response detected, converting to paginated format');
        return {
          items: response.data,
          total: response.data.length,
          page: 1,
          limit: 25,
          totalPages: 1,
        };
      } else {
        console.log('⚠️ AttendanceApiService - Unknown response format, returning empty');
        return {
          items: [],
          total: 0,
          page: 1,
          limit: 25,
          totalPages: 1,
        };
      }
    } catch (error) {
      console.error('❌ AttendanceApiService - Error fetching all attendance:', error);
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
  async getAttendanceEvents(userId?: string, page: number = 1): Promise<AttendanceResponse> {
    try {
      console.log('🔄 AttendanceApiService - getAttendanceEvents called with:', { userId, page });
      
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (userId) {
        params.append('userId', userId);
      }

      const url = `${this.baseUrl}/events?${params.toString()}`;
      console.log('🌐 AttendanceApiService - Making request to:', url);

      const response = await axiosInstance.get(url);
      console.log('✅ AttendanceApiService - Raw response:', response.data);
      
      if (response.data && response.data.items) {
        console.log('✅ AttendanceApiService - Paginated response detected');
        return response.data;
      } else if (Array.isArray(response.data)) {
        console.log('✅ AttendanceApiService - Array response detected, converting to paginated format');
        return {
          items: response.data,
          total: response.data.length,
          page: 1,
          limit: 25,
          totalPages: 1,
        };
      } else {
        console.log('⚠️ AttendanceApiService - Unknown response format, returning empty');
        return {
          items: [],
          total: 0,
          page: 1,
          limit: 25,
          totalPages: 1,
        };
      }
    } catch (error) {
      console.error('❌ AttendanceApiService - Error fetching attendance events:', error);
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
  async getDailySummaries(userId?: string, page: number = 1): Promise<AttendanceResponse> {
    try {
      console.log('🔄 AttendanceApiService - getDailySummaries called with:', { userId, page });
      
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (userId) {
        params.append('userId', userId);
      }

      const url = `${this.baseUrl}?${params.toString()}`;
      console.log('🌐 AttendanceApiService - Making request to:', url);

      const response = await axiosInstance.get(url);
      console.log('✅ AttendanceApiService - Raw response:', response.data);
      
      if (response.data && response.data.items) {
        console.log('✅ AttendanceApiService - Paginated response detected');
        return response.data;
      } else if (Array.isArray(response.data)) {
        console.log('✅ AttendanceApiService - Array response detected, converting to paginated format');
        return {
          items: response.data,
          total: response.data.length,
          page: 1,
          limit: 25,
          totalPages: 1,
        };
      } else {
        console.log('⚠️ AttendanceApiService - Unknown response format, returning empty');
        return {
          items: [],
          total: 0,
          page: 1,
          limit: 25,
          totalPages: 1,
        };
      }
    } catch (error) {
      console.error('❌ AttendanceApiService - Error fetching daily summaries:', error);
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
  async getTodaySummary(userId?: string): Promise<{ checkIn: string | null; checkOut: string | null }> {
    try {
      console.log('🔄 AttendanceApiService - getTodaySummary called with userId:', userId);
      
      const params = new URLSearchParams();
      if (userId) {
        params.append('userId', userId);
      }

      const url = `${this.baseUrl}/today?${params.toString()}`;
      console.log('🌐 AttendanceApiService - Making request to:', url);

      const response = await axiosInstance.get(url);
      console.log('✅ AttendanceApiService - Today summary response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ AttendanceApiService - Error fetching today summary:', error);
      return {
        checkIn: null,
        checkOut: null,
      };
    }
  }

  // Create attendance record
  async createAttendance(type: 'check-in' | 'check-out'): Promise<AttendanceEvent> {
    try {
      console.log('🔄 AttendanceApiService - createAttendance called with type:', type);
      
      const response = await axiosInstance.post(this.baseUrl, { type });
      console.log('✅ AttendanceApiService - Create response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ AttendanceApiService - Error creating attendance:', error);
      throw error;
    }
  }
}

const attendanceApi = new AttendanceApiService();
export default attendanceApi;
