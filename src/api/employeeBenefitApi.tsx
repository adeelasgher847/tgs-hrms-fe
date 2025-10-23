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

export interface EmployeeWithBenefits {
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  benefits: {
    id: string;
    name: string;
    status: string;
  }[];
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
    page: number = 1
  ): Promise<EmployeeBenefitResponse[]> {
    try {
      const employeeId = localStorage.getItem('employeeId');
      if (!employeeId) {
        console.error('Employee ID not found in localStorage.');
        return [];
      }

      const response = await axiosInstance.get('/employee-benefits', {
        params: { employeeId, page },
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
        console.warn('No benefits found for logged-in employee.');
        return [];
      }

      console.error(
        'Get Employee Benefits API Error:',
        error.response?.data || error.message
      );
      throw error;
    }
  },

  async getEmployeesWithBenefits(page = 1): Promise<EmployeeWithBenefits[]> {
    try {
      const response = await axiosInstance.get('/employee-benefits/employees', {
        params: { page },
      });

      if (Array.isArray(response.data)) {
        console.log('Employees with Benefits:', response.data);
        return response.data;
      }

      console.warn(
        'Unexpected response structure for employees:',
        response.data
      );
      return [];
    } catch (error: any) {
      console.error(
        'Get Employees with Benefits API Error:',
        error.response?.data || error.message
      );
      throw error;
    }
  },

  async getFilteredEmployeeBenefits(params: {
    employeeId?: string;
    department?: string;
    designation?: string;
    page: number;
  }): Promise<EmployeeWithBenefits[]> {
    try {
      const response = await axiosInstance.get('/employee-benefits/employees', {
        params,
      });

      if (Array.isArray(response.data)) {
        console.log('Filtered Employee Benefits:', response.data);
        return response.data;
      }

      if (response.data?.items && Array.isArray(response.data.items)) {
        console.log('Filtered Employee Benefits (items):', response.data.items);
        return response.data.items;
      }

      console.warn('Unexpected filtered response:', response.data);
      return [];
    } catch (error: any) {
      console.error(
        'Get Filtered Employee Benefits API Error:',
        error.response?.data || error.message
      );
      throw error;
    }
  },

  async cancelEmployeeBenefit(id: string): Promise<{ message: string }> {
    try {
      const response = await axiosInstance.put(
        `/employee-benefits/${id}/cancel`
      );
      console.log('Cancel Employee Benefit Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(
        'Cancel Employee Benefit API Error:',
        error.response?.data || error.message
      );
      throw error;
    }
  },
};

export default employeeBenefitApi;
