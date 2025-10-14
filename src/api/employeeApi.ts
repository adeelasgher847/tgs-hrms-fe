import axiosInstance from './axiosInstance';
import { handleApiError } from '../utils/errorHandler';

export interface EmployeeJoiningReport {
  month: number;
  year: number;
  total: number;
}

export interface GenderPercentage {
  male: number;
  female: number;
  total: number;
}

// Normalized Employee shape used in UI (matches EmployeeManager expectations)
export interface BackendEmployee {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  role_id?: string;
  role_name?: string;
  departmentId: string;
  designationId: string;
  status?: string;
  department: {
    id: string;
    name: string;
    description: string;
    tenantId: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  designation: {
    id: string;
    title: string;
    tenantId: string;
    departmentId: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

// New profile endpoint types (EmployeeProfileService)
export interface EmployeeProfileAttendanceSummaryItem {
  date: string; // YYYY-MM-DD
  checkIn: string | null; // ISO string
  checkOut: string | null; // ISO string
  workedHours: number; // decimal hours
}

export interface EmployeeProfileLeaveHistoryItem {
  id: string;
  fromDate: string; // YYYY-MM-DD
  toDate: string; // YYYY-MM-DD
  reason: string;
  type: string;
  status: string;
}

export interface EmployeeFullProfile {
  id: string; // user id
  name: string;
  email: string;
  role: string;
  designation: string | null;
  department: string | null;
  joinedAt: string;
  profile_pic?: string | null;
  attendanceSummary: EmployeeProfileAttendanceSummaryItem[];
  leaveHistory: EmployeeProfileLeaveHistoryItem[];
}

// Create/Update DTO interface
// DTOs aligned with backend

export interface EmployeeDto {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password?: string; // Made optional since backend will generate temporary password
  designationId: string; // UX carries department selection separately
  gender: string; // <-- Add gender
  role_name?: string; // Role name for employee creation
  role_id?: string; // Role ID (optional)
  team_id?: string; // Team ID (optional)
}

export interface EmployeeUpdateDto {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  password?: string;
  designationId?: string;
  role_id?: string;
  role_name?: string;
  gender?: string; // <-- Optionally add gender for updates
}

type EmployeeFilters = {
  departmentId?: string;
  designationId?: string;
};

// Backend raw entity shapes
type RawUser = {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  tenant_id: string;
};

type RawDepartment = {
  id: string;
  name: string;
  description?: string;
  tenant_id: string;
  created_at: string;
  updated_at?: string;
};

type RawDesignation = {
  id: string;
  title: string;
  department_id: string;
  created_at: string;
  updated_at?: string;
  department?: RawDepartment;
};

type RawEmployee = {
  id: string;
  user_id: string;
  designation_id: string;
  invite_status?: string;
  created_at: string;
  updated_at?: string;
  user?: RawUser;
  designation?: RawDesignation;
};

function normalizeEmployee(raw: unknown): BackendEmployee {
  // Type assertion for flexible data handling
  const data = raw as Record<string, unknown>;

  // Handle different data structures
  const user = data?.user as RawUser | undefined;
  const designation = data?.designation as RawDesignation | undefined;
  const department = designation?.department;
  const roleId =
    (data.role_id as string) || (user && (user as any).role_id) || '';
  const roleName = (data.role_name as string) || (user && (user as any).role_name) || '';

  // If the data looks like a designation (has title), create a mock employee structure
  if (data.title && !data.user) {
    return {
      id: (data.id as string) || `mock-${Date.now()}`,
      name: `Employee ${data.title as string}`,
      firstName: 'Employee',
      lastName: data.title as string,
      email: `employee.${(data.title as string).toLowerCase().replace(/\s+/g, '.')}@company.com`,
      phone: '+1234567890',
      departmentId: (data.department_id as string) || '',
      designationId: (data.id as string) || '',
      status: data.invite_status as string,
      role_id: roleId,
      role_name: roleName, 
      department: null, // Will be populated by department mapping
      designation: {
        id: data.id as string,
        title: data.title as string,
        tenantId: '',
        departmentId: (data.department_id as string) || '',
        createdAt: data.created_at as string,
        updatedAt: (data.updated_at as string) || (data.created_at as string),
      },
      tenantId: '',
      createdAt: data.created_at as string,
      updatedAt: (data.updated_at as string) || (data.created_at as string),
    };
  }

  // Handle full employee data structure
  if (user && designation) {
    return {
      id: data.id as string,
      name: user
        ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()
        : '',
      firstName: user?.first_name,
      lastName: user?.last_name,
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      role_id: roleId,
      role_name: roleName,
      departmentId: designation?.department_id ?? '',
      designationId: data.designation_id as string,
      status: data.invite_status as string,
      department: department
        ? {
            id: department.id,
            name: department.name,
            description: department.description ?? '',
            tenantId: department.tenant_id,
            createdAt: department.created_at,
            updatedAt: department.updated_at ?? department.created_at,
          }
        : null,
      designation: designation
        ? {
            id: designation.id,
            title: designation.title,
            tenantId: user?.tenant_id ?? '',
            departmentId: designation.department_id,
            createdAt: designation.created_at,
            updatedAt: designation.updated_at ?? designation.created_at,
          }
        : null,
      tenantId: user?.tenant_id ?? '',
      createdAt: data.created_at as string,
      updatedAt: (data.updated_at as string) ?? (data.created_at as string),
    };
  }

  // Fallback for unknown structure

  return {
    id: (data.id as string) || `fallback-${Date.now()}`,
    name: (data.name as string) || (data.title as string) || 'Unknown Employee',
    firstName: (data.first_name as string) || 'Unknown',
    lastName: (data.last_name as string) || 'Employee',
    email: (data.email as string) || 'unknown@company.com',
    phone: (data.phone as string) || '+1234567890',
    departmentId: (data.department_id as string) || '',
    designationId: (data.designation_id as string) || (data.id as string) || '',
    status: data.invite_status as string,
    department: null,
    designation: null,
    tenantId: (data.tenant_id as string) || '',
    createdAt: (data.created_at as string) || new Date().toISOString(),
    updatedAt:
      (data.updated_at as string) ||
      (data.created_at as string) ||
      new Date().toISOString(),
  };
}

export interface EmployeeJoiningReport {
  month: number;
  year: number;
  total: number;
}

class EmployeeApiService {
  private baseUrl = '/employees';

  // Debug: Check if we're hitting the right endpoint
  constructor() {}

  // Get all employees with pagination
  async getAllEmployees(
    filters: EmployeeFilters = {},
    page: number = 1
  ): Promise<{
    items: BackendEmployee[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      // Build query parameters including page
      const params = new URLSearchParams();
      params.append('page', page.toString());

      // Add filters
      if (filters.departmentId) {
        params.append('department_id', filters.departmentId);
      }
      if (filters.designationId) {
        params.append('designation_id', filters.designationId);
      }

      const url = `${this.baseUrl}?${params.toString()}`;

      const response = await axiosInstance.get(url);

      // Handle the new backend structure
      if (
        response.data &&
        response.data.items &&
        Array.isArray(response.data.items)
      ) {
        // Normalize each item
        const normalizedItems = response.data.items
          .map((item: unknown) => {
            try {
              return normalizeEmployee(item);
            } catch {
              return null;
            }
          })
          .filter(
            (item: BackendEmployee | null): item is BackendEmployee =>
              item !== null
          );

        return {
          items: normalizedItems,
          total: response.data.total || 0,
          page: response.data.page || page,
          limit: response.data.limit || 25,
          totalPages: response.data.totalPages || 1,
        };
      } else if (Array.isArray(response.data)) {
        // Normalize each item
        const normalizedItems = response.data
          .map((item: unknown) => {
            try {
              return normalizeEmployee(item);
            } catch {
              return null;
            }
          })
          .filter(
            (item: BackendEmployee | null): item is BackendEmployee =>
              item !== null
          );

        return {
          items: normalizedItems,
          total: normalizedItems.length,
          page: 1,
          limit: 25,
          totalPages: 1,
        };
      } else {
        return {
          items: [],
          total: 0,
          page: 1,
          limit: 25,
          totalPages: 1,
        };
      }
    } catch {
      return {
        items: [],
        total: 0,
        page: 1,
        limit: 25,
        totalPages: 1,
      };
    }
  }

  async getEmployeeById(id: string): Promise<BackendEmployee> {
    const response = await axiosInstance.get<RawEmployee>(
      `${this.baseUrl}/${id}`
    );
    return normalizeEmployee(response.data);
  }

  // Get full employee profile by user id (designation, department, attendance, leaves)
  async getEmployeeProfile(userId: string): Promise<EmployeeFullProfile> {
    const response = await axiosInstance.get<EmployeeFullProfile>(
      `${this.baseUrl}/users/${userId}/profile`
    );
    return response.data;
  }

  // Create new company

  async createEmployee(employeeData: EmployeeDto): Promise<BackendEmployee> {
    try {
      const payload = {
        first_name: employeeData.first_name,
        last_name: employeeData.last_name,
        email: employeeData.email,
        phone: employeeData.phone,
        password: employeeData.password,
        designation_id: employeeData.designationId,
        gender: employeeData.gender,
        role_name: employeeData.role_name,
        role_id: employeeData.role_id,
        team_id: employeeData.team_id,
      };
      const response = await axiosInstance.post<RawEmployee>(
        this.baseUrl,
        payload
      );
      return normalizeEmployee(response.data);
    } catch (error) {
      const errorResult = handleApiError(error, {
        operation: 'create',
        resource: 'employee',
        isGlobal: false,
      });
      throw new Error(errorResult.message);
    }
  }

  // Create a new manager employee
  async createManager(employeeData: EmployeeDto): Promise<BackendEmployee> {
    const payload = {
      first_name: employeeData.first_name,
      last_name: employeeData.last_name,
      email: employeeData.email,
      phone: employeeData.phone,
      password: employeeData.password,
      designation_id: employeeData.designationId,
      gender: employeeData.gender,
      role_name: employeeData.role_name,
      role_id: employeeData.role_id,
      team_id: employeeData.team_id,
    };
    const response = await axiosInstance.post<RawEmployee>(
      `${this.baseUrl}/manager`,
      payload
    );
    return normalizeEmployee(response.data);
  }

  // Create a new HR admin employee
  async createHrAdmin(employeeData: EmployeeDto): Promise<BackendEmployee> {
    const payload = {
      first_name: employeeData.first_name,
      last_name: employeeData.last_name,
      email: employeeData.email,
      phone: employeeData.phone,
      password: employeeData.password,
      designation_id: employeeData.designationId,
      gender: employeeData.gender,
      role_name: employeeData.role_name,
      role_id: employeeData.role_id,
      team_id: employeeData.team_id,
    };
    const response = await axiosInstance.post<RawEmployee>(
      `${this.baseUrl}/hr-admin`,
      payload
    );
    return normalizeEmployee(response.data);
  }

  async updateEmployee(
    id: string,
    updates: EmployeeUpdateDto & { role_name?: string }
  ): Promise<BackendEmployee> {
    try {
      const payload: Record<string, any> = {};

      if (updates.first_name !== undefined)
        payload.first_name = updates.first_name;
      if (updates.last_name !== undefined)
        payload.last_name = updates.last_name;
      if (updates.email !== undefined) payload.email = updates.email;
      if (updates.phone !== undefined) payload.phone = updates.phone;
      if (updates.password && updates.password.trim() !== '')
        payload.password = updates.password;
      if (updates.gender !== undefined) payload.gender = updates.gender;

      if (updates.role_name && updates.role_name.trim() !== '') {
        payload.role_name = updates.role_name;
      }

      if (updates.designationId && updates.designationId.trim() !== '') {
        payload.designation_id = updates.designationId;
      }

      console.log('Payload before PUT:', payload);

      const response = await axiosInstance.put<RawEmployee>(
        `${this.baseUrl}/${id}`,
        payload
      );

      console.log('Update response data:', response.data);
      return normalizeEmployee(response.data);
    } catch (error) {
      const errorResult = handleApiError(error, {
        operation: 'update',
        resource: 'employee',
        isGlobal: false,
      });
      throw new Error(errorResult.message);
    }
  }

  async deleteEmployee(id: string): Promise<{ deleted: true; id: string }> {
    try {
      const response = await axiosInstance.delete<{
        deleted: true;
        id: string;
      }>(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      const errorResult = handleApiError(error, {
        operation: 'delete',
        resource: 'employee',
        isGlobal: false,
      });
      throw new Error(errorResult.message);
    }
  }

  // Get gender percentage for dashboard
  async getGenderPercentage(): Promise<GenderPercentage> {
    const response = await axiosInstance.get<GenderPercentage>(
      `${this.baseUrl}/gender-percentage`
    );
    return response.data;
  }

  // Resend invite to employee
  async resendInvite(
    id: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axiosInstance.post<{ message: string }>(
        `${this.baseUrl}/${id}/refresh-invite-status`
      );
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorResult = handleApiError(error, {
        operation: 'update',
        resource: 'employee',
        isGlobal: false,
      });
      throw new Error(errorResult.message);
    }
  }
}

// Get employee joining report
export const getEmployeeJoiningReport = async (): Promise<
  EmployeeJoiningReport[]
> => {
  const response = await axiosInstance.get('/employees/joining-report');
  return response.data;
};

// Get attendance this month
export const getAttendanceThisMonth = async (): Promise<{
  status?: string;
  data?: { total_attendance: number };
  message?: string;
  totalAttendance?: number;
}> => {
  const response = await axiosInstance.get('/employees/attendance-this-month');
  return response.data;
};

// Get leaves this month
export const getLeavesThisMonth = async (): Promise<{
  status?: string;
  data?: { total_leaves: number };
  message?: string;
  totalLeaves?: number;
}> => {
  try {
    const response = await axiosInstance.get('/employees/leaves-this-month');
    return response.data;
  } catch {
    throw new Error('Failed to fetch leaves this month');
  }
};

const employeeApi = new EmployeeApiService();
export default employeeApi;
