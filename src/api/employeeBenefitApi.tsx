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

export interface EmployeeBenefitDetail {
  id: string;
  name: string;
  status: string;
  type?: string;
  statusOfAssignment?: string;
}

export interface EmployeeWithBenefits {
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  tenantId?: string;
  tenant_id?: string;
  tenantName?: string;
  tenant_name?: string;
  benefits: EmployeeBenefitDetail[];
}

export interface TenantEmployeeWithBenefits {
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
}

const employeeBenefitApi = {
  async assignBenefit(
    data: AssignBenefitRequest
  ): Promise<EmployeeBenefitResponse> {
    try {
      const response = await axiosInstance.post('/employee-benefits', data);
      return response.data;
    } catch (error: unknown) {
      throw error;
    }
  },

  async getEmployeeBenefits(
    page: number = 1
  ): Promise<EmployeeBenefitResponse[]> {
    try {
      const employeeId = localStorage.getItem('employeeId');
      if (!employeeId) {
        return [];
      }

      const response = await axiosInstance.get('/employee-benefits', {
        params: { employeeId, page },
      });

      if (Array.isArray(response.data)) {
        return response.data;
      }

      if (response.data?.items && Array.isArray(response.data.items)) {
        return response.data.items;
      }

      return [];
    } catch (error: unknown) {
      if (
        (error as { response?: { status?: number } }).response?.status === 404
      ) {
        return [];
      }

      throw error;
    }
  },

  async getEmployeesWithBenefits(page = 1): Promise<EmployeeWithBenefits[]> {
    try {
      const response = await axiosInstance.get('/employee-benefits/employees', {
        params: { page },
      });

      if (Array.isArray(response.data)) {
        return response.data;
      }

      return [];
    } catch (error: unknown) {
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
        return response.data;
      }

      if (response.data?.items && Array.isArray(response.data.items)) {
        return response.data.items;
      }

      return [];
    } catch (error: unknown) {
      throw error;
    }
  },

  async cancelEmployeeBenefit(id: string): Promise<{ message: string }> {
    try {
      const response = await axiosInstance.put(
        `/employee-benefits/${id}/cancel`
      );
      return response.data;
    } catch (error: unknown) {
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
      return response.data;
    } catch (error: unknown) {
      throw error;
    }
  },

  async getAllTenantsEmployeeBenefits(params?: {
    page?: number;
    limit?: number;
  }): Promise<
    | {
        items: TenantEmployeeWithBenefits[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }
    | {
        tenants: TenantEmployeeWithBenefits[];
      }
  > {
    try {
      const response = await axiosInstance.get(
        '/employee-benefits/all-tenants',
        {
          params: params || {},
        }
      );

      // Check if response has pagination structure
      if (
        response.data &&
        typeof response.data === 'object' &&
        !Array.isArray(response.data) &&
        'items' in response.data &&
        'total' in response.data &&
        'totalPages' in response.data
      ) {
        return {
          items: response.data.items || [],
          total: response.data.total || 0,
          page: response.data.page || params?.page || 1,
          limit: response.data.limit || params?.limit || 25,
          totalPages: response.data.totalPages || 1,
        };
      }

      // Fallback for old structure (tenants)
      if (response.data?.tenants) {
        return response.data as { tenants: TenantEmployeeWithBenefits[] };
      }

      // If response is array or has items but not paginated, wrap it
      const items =
        (response.data?.items as TenantEmployeeWithBenefits[] | undefined) ||
        (Array.isArray(response.data)
          ? (response.data as TenantEmployeeWithBenefits[])
          : []);
      return {
        items: items,
        total: items.length,
        page: params?.page || 1,
        limit: params?.limit || 25,
        totalPages: 1,
      };
    } catch (error: unknown) {
      throw error;
    }
  },
};

export default employeeBenefitApi;
