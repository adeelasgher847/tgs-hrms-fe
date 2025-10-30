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
  kpis: any[];
  promotions: any[];
  performanceReviews: any[];
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

  async getSystemEmployeePerformance(id: string): Promise<any[]> {
    const res = await axiosInstance.get<any[]>(`${BASE}/${id}/performance`);
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
}

export const systemEmployeeApiService = new SystemEmployeeApiService();
export default systemEmployeeApiService;
