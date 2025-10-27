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
      console.log('Create benefit response:', response);
      return response.data;
    } catch (error: unknown) {
      console.error(
        'Create benefit API Error:',
        (error as { response?: { data?: unknown }; message?: string }).response
          ?.data || (error as { message?: string }).message
      );
      throw error;
    }
  }

  async getBenefits(page: number): Promise<BenefitResponse[]> {
    try {
      const response = await axiosInstance.get(this.baseUrl, {
        params: { page },
      });
      console.log('Get benefits response:', response);
      return response.data;
    } catch (error: unknown) {
      console.error(
        'Get benefits API Error:',
        (error as { response?: { data?: unknown }; message?: string }).response
          ?.data || (error as { message?: string }).message
      );
      throw error;
    }
  }

  async getBenefitById(id: string): Promise<BenefitResponse> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/${id}`);
      console.log('Get benefit by ID response:', response);
      return response.data;
    } catch (error: unknown) {
      console.error(
        'Get benefit by ID API Error:',
        (error as { response?: { data?: unknown }; message?: string }).response
          ?.data || (error as { message?: string }).message
      );
      throw error;
    }
  }

  async updateBenefit(
    id: string,
    data: CreateBenefitRequest
  ): Promise<BenefitResponse> {
    try {
      const response = await axiosInstance.put(`${this.baseUrl}/${id}`, data);
      console.log('Update benefit response:', response);
      return response.data;
    } catch (error: unknown) {
      console.error(
        'Update benefit API Error:',
        (error as { response?: { data?: unknown }; message?: string }).response
          ?.data || (error as { message?: string }).message
      );
      throw error;
    }
  }

  async deleteBenefit(id: string): Promise<{ deleted: boolean; id: string }> {
    try {
      const response = await axiosInstance.delete(`${this.baseUrl}/${id}`);
      console.log('Delete benefit response:', response.data);
      return response.data;
    } catch (error: unknown) {
      console.error(
        'Delete benefit API Error:',
        (error as { response?: { data?: unknown }; message?: string }).response
          ?.data || (error as { message?: string }).message
      );
      throw error;
    }
  }

  async getBenefitSummary(): Promise<BenefitSummaryResponse> {
    try {
      const response = await axiosInstance.get('/employee-benefits/summary');
      console.log('Get benefit summary response:', response);
      return response.data;
    } catch (error: unknown) {
      console.error(
        'Get benefit summary API Error:',
        (error as { response?: { data?: unknown }; message?: string }).response
          ?.data || (error as { message?: string }).message
      );
      throw error;
    }
  }
}

const benefitsApi = new BenefitsApiService();
export default benefitsApi;
