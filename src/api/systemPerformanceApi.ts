import axiosInstance from './axiosInstance';

export interface KpiCategory {
  category: string;
  avgScore: number;
  recordCount: number;
}

export interface SystemPerformanceKpi {
  tenantId: string;
  tenantName: string;
  categories: KpiCategory[];
}

export interface PerformanceRecord {
  id: string;
  employee_id: string;
  cycle: string;
  overallScore: number;
  status: string;
  reviewedBy: string;
  approvedBy: string;
  recommendation: string;
  tenant_id: string;
  createdAt: string;
  employee: {
    id: string;
    user_id: string;
    designation_id: string;
    status: string;
    invite_status: string;
    team_id: string | null;
    cnic_number: string;
    profile_picture: string;
    cnic_picture: string;
    cnic_back_picture: string;
    created_at: string;
  };
  tenant: {
    id: string;
    name: string;
    status: string;
    isDeleted: boolean;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  };
}

export interface PromotionRecord {
  id: string;
  employee_id: string;
  previousDesignation: string;
  newDesignation: string;
  effectiveDate: string;
  approvedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  remarks: string;
  tenant_id: string;
  createdAt: string;
  employee: PerformanceRecord['employee'];
  tenant: PerformanceRecord['tenant'];
}

export interface PromotionStats {
  tenantId: string;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
}

class SystemPerformanceApiService {
  private baseUrl = '/system/performance';
  private basePromotionsUrl = '/system/performance/promotions';

  async getSystemKpis(): Promise<SystemPerformanceKpi[]> {
    try {
      const response = await axiosInstance.get<SystemPerformanceKpi[]>(
        `${this.baseUrl}/kpis`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch system performance KPIs:', error);
      return [];
    }
  }

  async getPerformanceRecords(
    params: {
      tenantId?: string;
      cycle?: string;
      status?: 'under_review' | 'completed';
      minScore?: number;
      maxScore?: number;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<PerformanceRecord[]> {
    try {
      const response = await axiosInstance.get<PerformanceRecord[]>(
        `${this.baseUrl}/records`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch performance records:', error);
      return [];
    }
  }

  async getPromotions(
    params: {
      tenantId?: string;
      status?: 'pending' | 'approved' | 'rejected';
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<{ promotions: PromotionRecord[]; stats: PromotionStats[] }> {
    try {
      const response = await axiosInstance.get<{
        promotions: PromotionRecord[];
        stats: PromotionStats[];
      }>(this.basePromotionsUrl, { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch promotions:', error);
      return { promotions: [], stats: [] };
    }
  }
}

export const systemPerformanceApiService = new SystemPerformanceApiService();
