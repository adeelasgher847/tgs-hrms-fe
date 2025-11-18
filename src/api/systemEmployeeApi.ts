import axiosInstance from './axiosInstance';

export type Benefit = {
  id: string;
  employeeId: string;
  benefitId: string;
  startDate: string;
  endDate: string;
  status: string;
  assignedBy: string;
  tenant_id: string;
  createdAt: string;
  benefit: {
    id: string;
    name: string;
    description: string;
    type: string;
    eligibilityCriteria: string;
    status: string;
    tenant_id: string;
    createdBy: string;
    createdAt: string;
  };
};

export type SystemEmployee = {
  id: string;
  name: string;
  email?: string;
  tenantId: string;
  departmentId: string;
  departmentName: string;
  designationId: string;
  designationTitle: string;
  team?: string;
  status: string;
  inviteStatus: string;
  createdAt?: string;
};

export type SystemEmployeeDetails = SystemEmployee & {
  benefits: Benefit[];
  kpis: unknown[];
  promotions: unknown[];
  performanceReviews: unknown[];
};

export type EmployeeLeave = {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  approvedBy: string | null;
  tenantId: string;
  approvedAt: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EmployeeAsset = {
  id: string;
  name: string;
  category: string;
  subcategory_id: string;
  status: string;
  assigned_to: string;
  purchase_date: string;
  tenant_id: string;
  created_at: string;
};

export interface EmployeePerformance {
  id: string;
  employee_id: string;
  kpi_id: string;
  targetValue: number;
  achievedValue: number;
  score: number;
  reviewCycle: string;
  reviewedBy: string;
  remarks: string;
  tenant_id: string;
  createdAt: string;
  kpi: {
    id: string;
    title: string;
    description: string;
    weight: number;
    category: string;
    status: string;
  };
}

export type GetEmployeesParams = {
  tenantId?: string;
  departmentId?: string;
  designationId?: string;
  status?: string;
  page?: number | null; // null to get all records for dropdowns
};

const BASE = '/system/employees';

type PaginatedSystemEmployeeResponse = {
  items: SystemEmployee[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

class SystemEmployeeApiService {
  async getSystemEmployees(
    params?: GetEmployeesParams
  ): Promise<SystemEmployee[] | PaginatedSystemEmployeeResponse> {
    // Build params object, excluding page if it's null (for dropdowns)
    const requestParams: Record<string, unknown> = {};
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof GetEmployeesParams];
        // Only include page parameter if it's not null (for dropdowns, pass null to get all records)
        if (key === 'page' && value === null) {
          return; // Skip page parameter when null
        }
        if (value !== undefined && value !== null) {
          requestParams[key] = value;
        }
      });
    }
    const res = await axiosInstance.get<
      SystemEmployee[] | PaginatedSystemEmployeeResponse
    >(BASE, { params: requestParams });
    console.log('Get system employee api response: ', res);

    // Handle paginated response with items array
    if (
      res.data &&
      typeof res.data === 'object' &&
      'items' in res.data &&
      Array.isArray(res.data.items)
    ) {
      return res.data;
    }

    // Handle direct array response
    if (Array.isArray(res.data)) {
      return res.data;
    }

    return [];
  }

  async getSystemEmployeeById(id: string): Promise<SystemEmployeeDetails> {
    const res = await axiosInstance.get<SystemEmployeeDetails>(`${BASE}/${id}`);
    console.log('Get system employee by id api response: ', res);
    return res.data;
  }

  async getSystemEmployeeLeaves(id: string): Promise<EmployeeLeave[]> {
    const res = await axiosInstance.get<EmployeeLeave[]>(
      `${BASE}/${id}/leaves`
    );
    console.log('Get system employee leaves api response: ', res);
    return res.data || [];
  }

  async getSystemEmployeePerformance(
    id: string
  ): Promise<EmployeePerformance[]> {
    const res = await axiosInstance.get<EmployeePerformance[]>(
      `${BASE}/${id}/performance`
    );
    console.log('Get system employee performance api response: ', res);
    return res.data || [];
  }

  async getSystemEmployeeAssets(id: string): Promise<EmployeeAsset[]> {
    const res = await axiosInstance.get<EmployeeAsset[]>(
      `${BASE}/${id}/assets`
    );
    console.log('Get system employee assets api response: ', res);
    return res.data || [];
  }

  async getTenants(
    page: number,
    includeDeleted: boolean = true
  ): Promise<SystemEmployee[]> {
    const res = await axiosInstance.get<SystemEmployee[]>('/system/tenants', {
      params: { page, includeDeleted },
    });
    console.log('Get tenants API response:', res);
    return res.data || [];
  }

  async getAllTenants(includeDeleted = true): Promise<SystemEmployee[]> {
    try {
      let allTenants: SystemEmployee[] = [];
      let currentPage = 1;
      let hasMorePages = true;
      const maxPages = 100; // Safety limit

      // Fetch all pages to get all tenants
      while (hasMorePages && currentPage <= maxPages) {
        const res = await axiosInstance.get<
          | SystemEmployee[]
          | {
              items?: SystemEmployee[];
              data?: SystemEmployee[] | { items?: SystemEmployee[] };
              total?: number;
              totalPages?: number;
              page?: number;
            }
        >('/system/tenants', {
          params: { includeDeleted, page: currentPage, limit: 25 },
        });

        let pageTenants: SystemEmployee[] = [];

        if (Array.isArray(res.data)) {
          pageTenants = res.data;
        } else if (res.data?.items && Array.isArray(res.data.items)) {
          pageTenants = res.data.items;
        } else {
          const dataField = res.data?.data;
          if (Array.isArray(dataField)) {
            pageTenants = dataField;
          } else if (
            dataField &&
            typeof dataField === 'object' &&
            'items' in dataField
          ) {
            const maybeItems = (dataField as { items?: SystemEmployee[] })
              .items;
            if (Array.isArray(maybeItems)) {
              pageTenants = maybeItems;
            }
          }
        }

        if (pageTenants.length > 0) {
          allTenants = [...allTenants, ...pageTenants];
        }

        // Check if there are more pages
        const totalPages =
          !Array.isArray(res.data) && res.data?.totalPages
            ? res.data.totalPages
            : pageTenants.length === 25
              ? currentPage + 1
              : currentPage;

        hasMorePages = currentPage < totalPages && pageTenants.length === 25;
        currentPage++;
      }

      return allTenants;
    } catch (error) {
      console.error('Error fetching tenants:', error);
      return [];
    }
  }
}

export const systemEmployeeApiService = new SystemEmployeeApiService();
export default systemEmployeeApiService;
