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
    const response = await axiosInstance.post('/employee-benefits', data);
    return response.data;
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
    const response = await axiosInstance.get('/employee-benefits/employees', {
      params: { page },
    });

    if (Array.isArray(response.data)) {
      return response.data;
    }

    return [];
  },

  async getFilteredEmployeeBenefits(params: {
    employeeId?: string;
    department?: string;
    designation?: string;
    page: number;
  }): Promise<EmployeeWithBenefits[]> {
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
  },

  async cancelEmployeeBenefit(id: string): Promise<{ message: string }> {
    const response = await axiosInstance.put(`/employee-benefits/${id}/cancel`);
    return response.data;
  },

  async getSystemAdminBenefitSummary(tenant_id?: string): Promise<{
    tenant_id: string;
    totalActiveBenefits: number;
    mostCommonBenefitType: string;
    totalEmployeesCovered: number;
  }> {
    const response = await axiosInstance.get(
      '/employee-benefits/system-admin/summary',
      {
        params: { tenant_id: tenant_id || 'all' },
      }
    );

    let raw: Record<string, unknown> = response.data as Record<string, unknown>;

    // Unwrap common envelope keys if present
    if (raw && typeof raw === 'object') {
      if ('data' in raw && raw.data) raw = raw.data as Record<string, unknown>;
      else if ('summary' in raw && raw.summary)
        raw = raw.summary as Record<string, unknown>;
      else if ('result' in raw && raw.result)
        raw = raw.result as Record<string, unknown>;
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

    return normalized;
  },

  async getAllTenantsEmployeeBenefits(params?: {
    page?: number;
    limit?: number;
    tenant_id?: string;
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
    } catch {
      return {
        items: [],
        total: 0,
        page: params?.page || 1,
        limit: params?.limit || 25,
        totalPages: 1,
      };
    }
  },
};

export default employeeBenefitApi;
