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
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    items: PerformanceRecord[];
    total?: number;
    page?: number;
    totalPages?: number;
  }> {
    try {
      const requestParams: Record<string, string | number> = {};
      if (params.tenantId) requestParams.tenantId = params.tenantId;
      if (params.cycle) requestParams.cycle = params.cycle;
      if (params.status) requestParams.status = params.status;
      if (params.minScore !== undefined)
        requestParams.minScore = params.minScore;
      if (params.maxScore !== undefined)
        requestParams.maxScore = params.maxScore;
      if (params.startDate) requestParams.startDate = params.startDate;
      if (params.endDate) requestParams.endDate = params.endDate;
      if (params.page !== undefined && params.page !== null) {
        requestParams.page = params.page;
        requestParams.limit = params.limit ?? 25;
      }

      const response = await axiosInstance.get<
        | PerformanceRecord[]
        | {
            items: PerformanceRecord[];
            total?: number;
            page?: number;
            totalPages?: number;
          }
      >(`${this.baseUrl}/records`, { params: requestParams });

      if (Array.isArray(response.data)) {
        return {
          items: response.data,
          total: response.data.length,
          page: 1,
          totalPages: 1,
        };
      } else if (response.data && typeof response.data === 'object') {
        return {
          items: response.data.items || [],
          total: response.data.total,
          page: response.data.page || 1,
          totalPages: response.data.totalPages || 1,
        };
      }
      return { items: [], total: 0, page: 1, totalPages: 1 };
    } catch (error) {
      console.error('Failed to fetch performance records:', error);
      return { items: [], total: 0, page: 1, totalPages: 1 };
    }
  }

  async getPromotions(
    params: {
      tenantId?: string;
      status?: 'pending' | 'approved' | 'rejected';
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    promotions: PromotionRecord[];
    stats: PromotionStats[];
    total?: number;
    page?: number;
    totalPages?: number;
  }> {
    try {
      const requestParams: Record<string, string | number> = {};
      if (params.tenantId) requestParams.tenantId = params.tenantId;
      if (params.status) requestParams.status = params.status;
      if (params.startDate) requestParams.startDate = params.startDate;
      if (params.endDate) requestParams.endDate = params.endDate;
      if (params.page !== undefined && params.page !== null) {
        requestParams.page = params.page;
        requestParams.limit = params.limit ?? 25;
      } else {
        requestParams.page = 1;
        requestParams.limit = params.limit ?? 25;
      }

      const response = await axiosInstance.get<
        | {
            promotions: {
              items: PromotionRecord[];
              total?: number;
              page?: number;
              limit?: number;
              totalPages?: number;
            };
            stats: PromotionStats[];
          }
        | {
            promotions: PromotionRecord[];
            stats: PromotionStats[];
            total?: number;
            page?: number;
            totalPages?: number;
          }
        | {
            items: PromotionRecord[];
            stats: PromotionStats[];
            total?: number;
            page?: number;
            totalPages?: number;
          }
      >(this.basePromotionsUrl, { params: requestParams });

      if (response.data && typeof response.data === 'object') {
        if ('promotions' in response.data) {
          const promotionsData = response.data.promotions;
          if (
            promotionsData &&
            typeof promotionsData === 'object' &&
            'items' in promotionsData
          ) {
            return {
              promotions: Array.isArray(promotionsData.items)
                ? promotionsData.items
                : [],
              stats: Array.isArray(response.data.stats)
                ? response.data.stats
                : [],
              total: promotionsData.total,
              page: promotionsData.page,
              totalPages: promotionsData.totalPages,
            };
          } else if (Array.isArray(promotionsData)) {
            return {
              promotions: promotionsData,
              stats: Array.isArray(response.data.stats)
                ? response.data.stats
                : [],
            };
          }
        } else if ('items' in response.data) {
          return {
            promotions: Array.isArray(response.data.items)
              ? response.data.items
              : [],
            stats: Array.isArray(response.data.stats)
              ? response.data.stats
              : [],
            total: response.data.total,
            page: response.data.page,
            totalPages: response.data.totalPages,
          };
        }
      }

      return { promotions: [], stats: [] };
    } catch (error) {
      console.error('Failed to fetch promotions:', error);
      return { promotions: [], stats: [] };
    }
  }
}

export const systemPerformanceApiService = new SystemPerformanceApiService();
