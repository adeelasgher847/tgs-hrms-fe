import axiosInstance from './axiosInstance';

interface AssignBenefitRequest {
  employeeId: string;
  benefitId: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'inactive';
}

interface EmployeeBenefitResponse {
  id: string;
  employeeId: string;
  benefitId: string;
  startDate: string;
  endDate?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const employeeBenefitApi = {
  async assignBenefit(
    data: AssignBenefitRequest
  ): Promise<EmployeeBenefitResponse> {
    try {
      const response = await axiosInstance.post('/employee-benefits', data);
      console.log('Assign Benefit Response:', response);
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
      const response = await axiosInstance.get(
        `/employee-benefits/${employeeId}`
      );
      console.log('Get Employee Benefits Response:', response);
      return response.data;
    } catch (error: any) {
      console.error(
        'Get Employee Benefits API Error:',
        error.response?.data || error.message
      );
      throw error;
    }
  },
};

export default employeeBenefitApi;
