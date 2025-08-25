// timesheetApi.ts
import axiosInstance from './axiosInstance';

export interface TimesheetEntry {
  id: string;
  user_id: string;
  employee_full_name: string;
  created_at: string;
  start_time: string | null;
  end_time: string | null;
  duration_hours: number | null;
  durationHours?: number | null; // Additional field from backend
}

interface TimesheetEmployee {
  userId: string;
  fullName: string;
}

interface TimesheetData {
  employee: TimesheetEmployee;
  totalHours: number;
  sessions: TimesheetEntry[];
}

interface TimesheetResponse {
  items: TimesheetData;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface TimesheetSummaryEntry {
  user_id: string;
  employee_name: string;
  total_hours: number;
}

interface TimesheetSummaryResponse {
  items: TimesheetSummaryEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class TimesheetApiService {
  private baseUrl = '/timesheet';

  async startWork(): Promise<TimesheetEntry> {
    try {
      console.log('🔄 TimesheetApiService - startWork called');
      const response = await axiosInstance.post<TimesheetEntry>(`${this.baseUrl}/start`);
      console.log('✅ TimesheetApiService - startWork response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ TimesheetApiService - Error starting work:', error);
      throw error;
    }
  }

  async endWork(): Promise<TimesheetEntry> {
    try {
      console.log('🔄 TimesheetApiService - endWork called');
      const response = await axiosInstance.post<TimesheetEntry>(`${this.baseUrl}/end`);
      console.log('✅ TimesheetApiService - endWork response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ TimesheetApiService - Error ending work:', error);
      throw error;
    }
  }

  async getUserTimesheet(page: number = 1): Promise<TimesheetResponse> {
    try {
      console.log('🔄 TimesheetApiService - getUserTimesheet called with page:', page);
      
      const response = await axiosInstance.get(`${this.baseUrl}?page=${page}`);
      console.log('✅ TimesheetApiService - Raw response:', response.data);
      
      // Handle the new backend response structure
      if (response.data && response.data.items && response.data.items.sessions) {
        console.log('✅ TimesheetApiService - New paginated response structure detected');
        return {
          items: response.data.items,
          total: response.data.total || 0,
          page: response.data.page || page,
          limit: response.data.limit || 25,
          totalPages: response.data.totalPages || 1,
        };
      } else if (response.data && response.data.items && Array.isArray(response.data.items)) {
        console.log('✅ TimesheetApiService - Old array response detected, converting to new format');
        return {
          items: {
            employee: { userId: '', fullName: '' },
            totalHours: 0,
            sessions: response.data.items,
          },
          total: response.data.total || response.data.items.length,
          page: response.data.page || 1,
          limit: response.data.limit || 25,
          totalPages: response.data.totalPages || 1,
        };
      } else if (Array.isArray(response.data)) {
        console.log('✅ TimesheetApiService - Direct array response detected, converting to new format');
        return {
          items: {
            employee: { userId: '', fullName: '' },
            totalHours: 0,
            sessions: response.data,
          },
          total: response.data.length,
          page: 1,
          limit: 25,
          totalPages: 1,
        };
      } else {
        console.log('⚠️ TimesheetApiService - Unknown response format, returning empty');
        return {
          items: {
            employee: { userId: '', fullName: '' },
            totalHours: 0,
            sessions: [],
          },
          total: 0,
          page: 1,
          limit: 25,
          totalPages: 1,
        };
      }
    } catch (error) {
      console.error('❌ TimesheetApiService - Error fetching timesheet:', error);
      return {
        items: {
          employee: { userId: '', fullName: '' },
          totalHours: 0,
          sessions: [],
        },
        total: 0,
        page: 1,
        limit: 25,
        totalPages: 1,
      };
    }
  }

  // Get summary for admin (tenant-wise) with pagination
  async getSummary(from?: string, to?: string, page: number = 1): Promise<TimesheetSummaryResponse> {
    try {
      console.log('🔄 TimesheetApiService - getSummary called with:', { from, to, page });
      
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (from) params.append('from', from);
      if (to) params.append('to', to);

      const url = `${this.baseUrl}/summary?${params.toString()}`;
      console.log('🌐 TimesheetApiService - Making request to:', url);

      const response = await axiosInstance.get(url);
      console.log('✅ TimesheetApiService - Summary response:', response.data);
      
      // Handle the new paginated summary response structure
      if (response.data && response.data.items && Array.isArray(response.data.items)) {
        console.log('✅ TimesheetApiService - Paginated summary response detected');
        return {
          items: response.data.items,
          total: response.data.total || 0,
          page: response.data.page || page,
          limit: response.data.limit || 25,
          totalPages: response.data.totalPages || 1,
        };
      } else if (Array.isArray(response.data)) {
        console.log('✅ TimesheetApiService - Direct array summary response detected');
        return {
          items: response.data,
          total: response.data.length,
          page: 1,
          limit: 25,
          totalPages: 1,
        };
      } else {
        console.log('⚠️ TimesheetApiService - Unknown summary response format, returning empty');
        return {
          items: [],
          total: 0,
          page: 1,
          limit: 25,
          totalPages: 1,
        };
      }
    } catch (error) {
      console.error('❌ TimesheetApiService - Error fetching summary:', error);
      return {
        items: [],
        total: 0,
        page: 1,
        limit: 25,
        totalPages: 1,
      };
    }
  }
}

const timesheetApi = new TimesheetApiService();
export default timesheetApi;
