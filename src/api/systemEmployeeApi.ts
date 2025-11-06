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
  page?: number;
};

const BASE = '/system/employees';

class SystemEmployeeApiService {
  async getSystemEmployees(
    params?: GetEmployeesParams
  ): Promise<SystemEmployee[]> {
    const res = await axiosInstance.get<SystemEmployee[]>(BASE, { params });
    console.log('Get system employee api response: ', res);
    return res.data || [];
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
    let page = 1;
    const perPage = 25;
    let allTenants: SystemEmployee[] = [];
    let hasMoreData = true;
    const maxPages = 1000; // Safety limit to prevent infinite loops
    let totalPages: number | undefined;

    while (hasMoreData && page <= maxPages) {
      try {
        const res = await axiosInstance.get<
          | SystemEmployee[]
          | { items: SystemEmployee[]; total?: number; totalPages?: number }
        >('/system/tenants', {
          params: { page, includeDeleted },
        });

        // Handle both direct array response and paginated response structure
        let tenants: SystemEmployee[] = [];
        if (Array.isArray(res.data)) {
          tenants = res.data;
        } else if (
          res.data &&
          typeof res.data === 'object' &&
          'items' in res.data
        ) {
          tenants = Array.isArray(res.data.items) ? res.data.items : [];
          // Store pagination metadata if available
          if (res.data.totalPages !== undefined) {
            totalPages = res.data.totalPages;
          }
        }

        // Add tenants to the collection
        if (tenants.length > 0) {
          allTenants = [...allTenants, ...tenants];
        }

        // Determine if we should continue fetching
        // Stop if: empty page, less than perPage items, or reached totalPages
        if (tenants.length === 0) {
          hasMoreData = false;
        } else if (totalPages !== undefined && page >= totalPages) {
          hasMoreData = false;
        } else if (tenants.length < perPage) {
          hasMoreData = false;
        } else {
          page++;
        }
      } catch (error) {
        console.error(`Error fetching tenants page ${page}:`, error);
        // If there's an error, stop fetching to avoid infinite loops
        hasMoreData = false;
        break;
      }
    }

    if (page > maxPages) {
      console.warn(
        `Reached maximum page limit (${maxPages}) while fetching tenants. Total fetched: ${allTenants.length}`
      );
    }

    console.log(
      `Fetched ${allTenants.length} tenants across ${page} page(s)${totalPages ? ` (total pages: ${totalPages})` : ''}`
    );
    return allTenants;
  }
}

export const systemEmployeeApiService = new SystemEmployeeApiService();
export default systemEmployeeApiService;
