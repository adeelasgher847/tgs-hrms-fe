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


export interface SystemTenantEmployeeAttendance {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_pic: string;
  attendance: {
    date: string;
    checkIn: string | null;
    checkOut: string | null;
    workedHours: number;
  }[];
  totalDaysWorked: number;
  totalHoursWorked: number;
}

export interface SystemTenantAttendance {
  tenant_id: string;
  tenant_name: string;
  tenant_status: string;
  employees: SystemTenantEmployeeAttendance[];
  totalEmployees: number;
  totalAttendanceRecords: number;
}

export interface SystemAllAttendanceResponse {
  tenants: SystemTenantAttendance[];
  totalTenants: number;
}

class AttendanceApiService {
  private baseUrl = '/attendance';

  // Get all attendance records (Admin only)
  async getAllAttendance(
    page: number = 1,
    startDate?: string,
    endDate?: string,
    selectedEmployee?: string,
    tenantId?: string
  ): Promise<AttendanceResponse> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (startDate) {
        params.append('startDate', startDate);
      }
      if (endDate) {
        params.append('endDate', endDate);
      }
      if (selectedEmployee) {
        params.append('userId', selectedEmployee);
      }
      if (tenantId) {
        params.append('tenantId', tenantId);
      }

      const response = await axiosInstance.get(
        `${this.baseUrl}/all?${params.toString()}`
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
    page: number = 1,
    startDate?: string,
    endDate?: string,
    tenantId?: string
  ): Promise<AttendanceResponse> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (userId) {
        params.append('userId', userId);
      }
      if (startDate) {
        params.append('startDate', startDate);
      }
      if (endDate) {
        params.append('endDate', endDate);
      }
      if (tenantId) {
        params.append('tenantId', tenantId);
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

  // UPDATED: Get daily summaries for a user with date filtering support
  async getDailySummaries(
    userId?: string,
    page: number = 1,
    startDate?: string,
    endDate?: string,
    tenantId?: string
  ): Promise<AttendanceResponse> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (userId) {
        params.append('userId', userId);
      }
      if (startDate) {
        params.append('startDate', startDate);
      }
      if (endDate) {
        params.append('endDate', endDate);
      }
      if (tenantId) {
        params.append('tenantId', tenantId);
      }

      const url = `${this.baseUrl}?${params.toString()}`; // This hits the /attendance endpoint for daily summaries

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
  async getTeamAttendance(
    page: number = 1,
    startDate?: string,
    endDate?: string,
    tenantId?: string
  ): Promise<{
    items: AttendanceEvent[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (startDate) {
        params.append('startDate', startDate);
      }
      if (endDate) {
        params.append('endDate', endDate);
      }
      if (tenantId) {
        params.append('tenantId', tenantId);
      }
      const response = await axiosInstance.get(
        `${this.baseUrl}/team?${params.toString()}`
      );
      return response.data;
    } catch {
      return {
        items: [],
        total: 0,
        page: 1,
        totalPages: 1,
      };
    }
  }

  // Get system-wide (cross-tenant) attendance for system admin
  async getSystemAllAttendance(
    startDate?: string,
    endDate?: string
  ): Promise<SystemAllAttendanceResponse> {
    const params = new URLSearchParams();
    if (startDate) {
      params.append('startDate', startDate);
    }
    if (endDate) {
      params.append('endDate', endDate);
    }

    const query = params.toString();
    const url =
      query.length > 0
        ? `${this.baseUrl}/system/all?${query}`
        : `${this.baseUrl}/system/all`;

    const response = await axiosInstance.get<SystemAllAttendanceResponse>(url);
    return response.data;
  }
}

const attendanceApi = new AttendanceApiService();
export default attendanceApi;
