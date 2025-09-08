import axiosInstance from './axiosInstance';

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
  departmentId: string;
  designationId: string;
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
}

export interface EmployeeUpdateDto {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  password?: string;
  designationId?: string;
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
      departmentId: designation?.department_id ?? '',
      designationId: data.designation_id as string,
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
            } catch (_error) {
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
            } catch (_error) {
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
    } catch (_error) {
      if (_error && typeof _error === 'object' && 'response' in _error) {
        const errorResponse = _error as {
          response?: { data?: unknown; status?: number };
        };
      }

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
    try {
      const response = await axiosInstance.get<RawEmployee>(
        `${this.baseUrl}/${id}`
      );
      return normalizeEmployee(response.data);
    } catch (_error) {
      throw _error;
    }
  }

  // Get full employee profile by user id (designation, department, attendance, leaves)
  async getEmployeeProfile(userId: string): Promise<EmployeeFullProfile> {
    try {
      const response = await axiosInstance.get<EmployeeFullProfile>(
        `${this.baseUrl}/users/${userId}/profile`
      );
      return response.data;
    } catch (_error) {
      throw _error;
    }
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
        gender: employeeData.gender, // <-- Add gender to payload
      };
      const response = await axiosInstance.post<RawEmployee>(
        this.baseUrl,
        payload
      );
      return normalizeEmployee(response.data);
    } catch (_error) {
      throw _error;
    }
  }

  async updateEmployee(
    id: string,
    updates: EmployeeUpdateDto
  ): Promise<BackendEmployee> {
    try {
      const payload: Partial<
        Pick<
          EmployeeUpdateDto,
          | 'first_name'
          | 'last_name'
          | 'email'
          | 'phone'
          | 'password'
          | 'designationId'
        >
      > = {};
      if (updates.first_name !== undefined)
        payload.first_name = updates.first_name;
      if (updates.last_name !== undefined)
        payload.last_name = updates.last_name;
      if (updates.email !== undefined) payload.email = updates.email;
      if (updates.phone !== undefined) payload.phone = updates.phone;
      if (updates.password !== undefined && updates.password !== '')
        payload.password = updates.password;
      if (updates.designationId && updates.designationId.trim() !== '') {
        // @ts-expect-error: API expects 'designation_id', but TS type only allows 'designationId'
        payload['designation_id'] = updates.designationId;
      }
      const response = await axiosInstance.put<RawEmployee>(
        `${this.baseUrl}/${id}`,
        payload
      );
      return normalizeEmployee(response.data);
    } catch (_error) {
      throw _error;
    }
  }

  async deleteEmployee(id: string): Promise<{ deleted: true; id: string }> {
    try {
      const response = await axiosInstance.delete<{
        deleted: true;
        id: string;
      }>(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (_error) {
      throw _error;
    }
  }

  // Get gender percentage for dashboard
  async getGenderPercentage(): Promise<GenderPercentage> {
    try {
      const response = await axiosInstance.get<GenderPercentage>(
        `${this.baseUrl}/gender-percentage`
      );

      return response.data;
    } catch (_error) {
      throw _error;
    }
  }
}

// Get employee joining report
export const getEmployeeJoiningReport = async (): Promise<
  EmployeeJoiningReport[]
> => {
  try {
    const response = await axiosInstance.get('/employees/joining-report');
    return response.data;
  } catch (_error) {
    throw _error;
  }
};

// Get attendance this month
export const getAttendanceThisMonth = async (): Promise<{
  status?: string;
  data?: { total_attendance: number };
  message?: string;
  totalAttendance?: number;
}> => {
  try {
    const response = await axiosInstance.get(
      '/employees/attendance-this-month'
    );
    return response.data;
  } catch (error: unknown) {
    throw _error; // Re-throw the error so component can handle it
  }
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
  } catch (error: unknown) {
    throw _error; // Re-throw the error so component can handle it
  }
};

const employeeApi = new EmployeeApiService();
export default employeeApi;
