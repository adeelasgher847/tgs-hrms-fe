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
      console.log('System Admin Benefit Summary (raw):', response.data);

      let raw: any = response.data;

      // Unwrap common envelope keys if present
      if (raw && typeof raw === 'object') {
        if ('data' in raw && raw.data) raw = raw.data;
        else if ('summary' in raw && raw.summary) raw = raw.summary;
        else if ('result' in raw && raw.result) raw = raw.result;
      }

      // If backend returns an array, use the first element
      if (Array.isArray(raw)) {
        raw = raw[0] || {};
      }

      const normalizedTenantId =
        raw.tenant_id ?? raw.tenantId ?? tenant_id ?? 'all';

      const totalActiveRaw =
        raw.totalActiveBenefits ??
        raw.total_active_benefits ??
        raw.totalActive ??
        raw.activeBenefits ??
        raw.total_benefits ??
        0;

      const employeesCoveredRaw =
        raw.totalEmployeesCovered ??
        raw.total_employees_covered ??
        raw.employeesCovered ??
        raw.total_employees ??
        0;

      const mostCommonTypeRaw =
        raw.mostCommonBenefitType ??
        raw.most_common_benefit_type ??
        raw.topBenefitType ??
        raw.top_benefit_type ??
        '-';

      const totalActiveBenefits =
        typeof totalActiveRaw === 'string'
          ? Number.parseInt(totalActiveRaw, 10) || 0
          : Number(totalActiveRaw) || 0;

      const totalEmployeesCovered =
        typeof employeesCoveredRaw === 'string'
          ? Number.parseInt(employeesCoveredRaw, 10) || 0
          : Number(employeesCoveredRaw) || 0;

      const mostCommonBenefitType =
        mostCommonTypeRaw == null || mostCommonTypeRaw === ''
          ? '-'
          : String(mostCommonTypeRaw);

      const normalized = {
        tenant_id: String(normalizedTenantId),
        totalActiveBenefits,
        mostCommonBenefitType,
        totalEmployeesCovered,
      };

      console.log('System Admin Benefit Summary (normalized):', normalized);
      return normalized;
    } catch (error: unknown) {
      console.error(
        'System Admin Benefit Summary API Error:',
        (error as { response?: { data?: unknown }; message?: string }).response
          ?.data || (error as { message?: string }).message
      );
      throw error;
    }
  },

  async getAllTenantsEmployeeBenefits(params?: {
    page?: number;
    limit?: number;
    tenant_id?: string;
  }): Promise<
    | {
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
      }
    | {
        tenants: Array<{
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
      }
  > {
    try {
      const response = await axiosInstance.get('/employee-benefits/all-tenants', {
        params: params || {},
      });

      console.log('All Tenants Employee Benefits:', response.data);

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

      // Fallback for old structure (tenants) – normalize to the same paginated shape
      if (response.data?.tenants) {
        const tenants = response.data.tenants || [];
        return {
          items: tenants,
          total: tenants.length,
          page: params?.page || 1,
          limit: params?.limit || 25,
          totalPages: 1,
        };
      }

      // If response is array or has items but not paginated, wrap it
      const items = response.data?.items || (Array.isArray(response.data) ? response.data : []);
      return {
        items: items,
        total: items.length,
        page: params?.page || 1,
        limit: params?.limit || 25,
        totalPages: 1,
      };
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
