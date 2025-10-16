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

class BenefitsApiService {
  private baseUrl = '/benefits';

  async createBenefit(data: CreateBenefitRequest): Promise<BenefitResponse> {
    try {
      const response = await axiosInstance.post(this.baseUrl, data);
      console.log('Create benefit response:', response);
      return response.data;
    } catch (error: any) {
      console.error(
        'Create benefit API Error:',
        error.response?.data || error.message
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
    } catch (error: any) {
      console.error(
        'Get benefits API Error:',
        error.response?.data || error.message
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
    } catch (error: any) {
      console.error(
        'Update benefit API Error:',
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async deleteBenefit(id: string): Promise<{ message: string }> {
    try {
      const response = await axiosInstance.delete(`${this.baseUrl}/${id}`);
      console.log('Delete benefit response:', response);
      return response.data;
    } catch (error: any) {
      console.error(
        'Delete benefit API Error:',
        error.response?.data || error.message
      );
      throw error;
    }
  }
}

const benefitsApi = new BenefitsApiService();
export default benefitsApi;
