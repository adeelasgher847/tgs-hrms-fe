import axiosInstance from './axiosInstance';

interface AssignBenefitRequest {
  employeeId: string;
  benefitId: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'inactive';
}

export interface Benefit {
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

export interface EmployeeBenefitResponse {
  id: string;
  employeeId: string;
  benefitId: string;
  startDate: string;
  endDate?: string;
  status: string;
  assignedBy: string;
  tenant_id: string;
  createdAt: string;
  benefit: Benefit;
}

const employeeBenefitApi = {
  async assignBenefit(
    data: AssignBenefitRequest
  ): Promise<EmployeeBenefitResponse> {
    try {
      const response = await axiosInstance.post('/employee-benefits', data);
      console.log('Assign Benefit Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(
        'Assign Benefit API Error:',
        error.response?.data || error.message
      );
      throw error;
    }
  },

  async getEmployeeBenefits(
    employeeId: string
  ): Promise<EmployeeBenefitResponse[]> {
    try {
      const response = await axiosInstance.get('/employee-benefits', {
        params: { employeeId },
      });

      if (Array.isArray(response.data)) {
        console.log('Get Employee Benefits Response:', response.data);
        return response.data;
      }

      if (response.data?.items && Array.isArray(response.data.items)) {
        console.log('Get Employee Benefits (items):', response.data.items);
        return response.data.items;
      }

      console.warn('Unexpected response structure:', response.data);
      return [];
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn(
          `No benefits found or employee not found in tenant: ${employeeId}`
        );
        return [];
      }

      console.error(
        'Get Employee Benefits API Error:',
        error.response?.data || error.message
      );
      throw error;
    }
  },
};

export default employeeBenefitApi;
