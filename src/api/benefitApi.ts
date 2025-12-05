import axiosInstance from './axiosInstance';

export interface CreateBenefitRequest {
  name: string;
  description: string;
  type: string;
  eligibilityCriteria: string;
  status: 'active' | 'inactive';
}

export interface BenefitResponse {
  id: string;
  name: string;
  description: string;
  type: string;
  eligibilityCriteria: string;
  status: string;
  tenant_id: string;
  createdBy: string;
  createdAt: string;
}

export interface BenefitSummaryResponse {
  totalActiveBenefits: number;
  mostCommonBenefitType: string;
  totalEmployeesCovered: number;
}

class BenefitsApiService {
  private baseUrl = '/benefits';

  async createBenefit(data: CreateBenefitRequest): Promise<BenefitResponse> {
    try {
      const response = await axiosInstance.post(this.baseUrl, data);
      return response.data;
    } catch (error: unknown) {
      // Let callers handle API errors using shared error handling utilities
      throw error;
    }
  }

  async getBenefits(page: number | null = 1): Promise<BenefitResponse[]> {
    try {
      const params: Record<string, unknown> = {};
      // Only add page parameter if it's not null (for dropdowns, pass null to get all records)
      if (page !== null) {
        params.page = page;
      }
      const response = await axiosInstance.get(this.baseUrl, { params });
      return response.data;
    } catch (error: unknown) {
      throw error;
    }
  }

  async getBenefitById(id: string): Promise<BenefitResponse> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error: unknown) {
      throw error;
    }
  }

  async updateBenefit(
    id: string,
    data: CreateBenefitRequest
  ): Promise<BenefitResponse> {
    try {
      const response = await axiosInstance.put(`${this.baseUrl}/${id}`, data);
      return response.data;
    } catch (error: unknown) {
      throw error;
    }
  }

  async deleteBenefit(id: string): Promise<{ deleted: boolean; id: string }> {
    try {
      const response = await axiosInstance.delete(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error: unknown) {
      throw error;
    }
  }

  async getBenefitSummary(): Promise<BenefitSummaryResponse> {
    try {
      const response = await axiosInstance.get('/employee-benefits/summary');
      return response.data;
    } catch (error: unknown) {
      throw error;
    }
  }
}

const benefitsApi = new BenefitsApiService();
export default benefitsApi;
