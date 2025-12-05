import axiosInstance from './axiosInstance';

export interface ActiveEmployeesPerTenant {
  tenantId: string;
  tenantName: string;
  activeCount: string;
}

export interface RecentLogMeta {
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

export interface RecentLog {
  id: string;
  action: string;
  entityType: string;
  userId: string | null;
  userRole: string | null;
  tenantId: string | null;
  route: string;
  method: string;
  ip: string;
  meta: RecentLogMeta;
  createdAt: string;
}

export interface SystemDashboardResponse {
  totalTenants: number;
  activeTenants: number;
  totalEmployees: number;
  activeEmployeesPerTenant: ActiveEmployeesPerTenant[];
  systemUptimeSeconds: number;
  recentLogs: RecentLog[];
}

export interface TenantGrowth {
  tenantId: string;
  tenantName: string;
  month: string;
  monthName: string;
  employees: number;
  departments: number;
  designations: number;
}

class SystemDashboardApiService {
  private baseUrl = '/system/dashboard';
  private logsUrl = '/system/logs';
  private tenantGrowthUrl = '/system/tenant-growth';

  async getSystemDashboard(): Promise<SystemDashboardResponse | null> {
    try {
      const response = await axiosInstance.get<SystemDashboardResponse>(
        this.baseUrl
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getSystemLogs(
    page: number = 1,
    filters?: {
      userRole?: string;
      tenantId?: string;
      method?: string;
    }
  ): Promise<RecentLog[]> {
    try {
      const params: Record<string, string | number> = { page };
      if (filters?.userRole) {
        params.userRole = filters.userRole;
      }
      if (filters?.tenantId) {
        params.tenantId = filters.tenantId;
      }
      if (filters?.method) {
        params.method = filters.method;
      }
      const response = await axiosInstance.get<RecentLog[]>(this.logsUrl, {
        params,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async exportSystemLogs(): Promise<Blob | null> {
    try {
      const response = await axiosInstance.get(`${this.logsUrl}/export`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getTenantGrowth(
    year: number,
    tenantId: string
  ): Promise<TenantGrowth[]> {
    try {
      const response = await axiosInstance.get<TenantGrowth[]>(
        this.tenantGrowthUrl,
        {
          params: { year, tenantId },
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export const systemDashboardApiService = new SystemDashboardApiService();
export default systemDashboardApiService;
