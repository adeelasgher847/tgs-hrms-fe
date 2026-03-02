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
    const response = await axiosInstance.post(this.baseUrl, data);
    return response.data;
  }

  async getBenefits(params?: {
    page?: number;
    type?: string;
    status?: string;
  }): Promise<
    | BenefitResponse[]
    | { items: BenefitResponse[]; total?: number; totalPages?: number }
  > {
    const query: Record<string, string | number> = {};
    if (params?.page != null) query.page = String(params.page);
    if (params?.type && params.type.trim() !== '') query.type = params.type;
    if (params?.status && params.status.trim() !== '')
      query.status = params.status;
    const response = await axiosInstance.get(this.baseUrl, {
      params: Object.keys(query).length ? query : { page: '1' },
    });
    return response.data;
  }

  async getBenefitById(id: string): Promise<BenefitResponse> {
    const response = await axiosInstance.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async updateBenefit(
    id: string,
    data: CreateBenefitRequest
  ): Promise<BenefitResponse> {
    const response = await axiosInstance.put(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async deleteBenefit(id: string): Promise<{ deleted: boolean; id: string }> {
    const response = await axiosInstance.delete(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async getBenefitSummary(): Promise<BenefitSummaryResponse> {
    const response = await axiosInstance.get('/employee-benefits/summary');
    return response.data;
  }

  /** Export benefits (CSV). Admin side. */
  async exportBenefits(params?: {
    type?: string;
    status?: string;
  }): Promise<Blob> {
    const query: Record<string, string> = {};
    if (params?.type?.trim()) query.type = params.type.trim();
    if (params?.status?.trim()) query.status = params.status.trim();
    const response = await axiosInstance.get(`${this.baseUrl}/export`, {
      params: query,
      responseType: 'blob',
    });
    return response.data;
  }
}

const benefitsApi = new BenefitsApiService();
export default benefitsApi;
