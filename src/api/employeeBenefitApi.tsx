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
    } catch (error: unknown) {
      console.error(
        'Assign Benefit API Error:',
        (error as { response?: { data?: unknown }; message?: string }).response
          ?.data || (error as { message?: string }).message
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
    } catch (error: unknown) {
      if (
        (error as { response?: { status?: number } }).response?.status === 404
      ) {
        console.warn('No benefits found for logged-in employee.');
        return [];
      }

      console.error(
        'Get Employee Benefits API Error:',
        (error as { response?: { data?: unknown }; message?: string }).response
          ?.data || (error as { message?: string }).message
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
    } catch (error: unknown) {
      console.error(
        'Get Employees with Benefits API Error:',
        (error as { response?: { data?: unknown }; message?: string }).response
          ?.data || (error as { message?: string }).message
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
    } catch (error: unknown) {
      console.error(
        'Get Filtered Employee Benefits API Error:',
        (error as { response?: { data?: unknown }; message?: string }).response
          ?.data || (error as { message?: string }).message
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
    } catch (error: unknown) {
      console.error(
        'Cancel Employee Benefit API Error:',
        (error as { response?: { data?: unknown }; message?: string }).response
          ?.data || (error as { message?: string }).message
      );
      throw error;
    }
  },

  async getSystemAdminBenefitSummary(tenant_id?: string): Promise<{
    tenant_id: string;
    totalActiveBenefits: number;
    mostCommonBenefitType: string;
    totalEmployeesCovered: number;
  }> {
    try {
      const response = await axiosInstance.get(
        '/employee-benefits/system-admin/summary',
        {
          params: { tenant_id: tenant_id || 'all' },
        }
      );
      console.log('System Admin Benefit Summary:', response.data);
      return response.data;
    } catch (error: unknown) {
      console.error(
        'System Admin Benefit Summary API Error:',
        (error as { response?: { data?: unknown }; message?: string }).response
          ?.data || (error as { message?: string }).message
      );
      throw error;
    }
  },

  async getAllTenantsEmployeeBenefits(): Promise<{
    items: Array<{
      tenant_id: string;
      tenant_name: string;
      tenant_status: string;
      employees: Array<{
        employeeId: string;
        employeeName: string;
        email: string;
        profile_pic?: string | null;
        department: string;
        designation: string;
        benefits: Array<{
          id: string;
          name: string;
          description: string;
          type: string;
          eligibilityCriteria: string;
          status: string;
          tenant_id: string;
          createdBy: string;
          createdAt: string;
          benefitAssignmentId: string;
          statusOfAssignment: string;
          startDate: string;
          endDate: string;
          assignedBy: string;
          benefitCreatedAt: string;
        }>;
      }>;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const response = await axiosInstance.get(
        '/employee-benefits/all-tenants'
      );

      console.log('All Tenants Employee Benefits:', response.data);

      // Return exactly what backend sends (no transformation)
      return response.data;
    } catch (error: unknown) {
      console.error(
        'All Tenants Employee Benefits API Error:',
        (error as any).response?.data || (error as any).message
      );
      throw error;
    }
  },
};

export default employeeBenefitApi;
