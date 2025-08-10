import axiosInstance from "./axiosInstance";

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

// DTOs aligned with backend
export interface EmployeeDto {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  designationId: string; // UX carries department selection separately
}

export interface EmployeeUpdateDto {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  password?: string;
  designationId?: string;
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

function normalizeEmployee(raw: RawEmployee): BackendEmployee {
  const user = raw.user;
  const designation = raw.designation;
  const department = designation?.department;
  return {
    id: raw.id,
    name: user ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() : "",
    firstName: user?.first_name,
    lastName: user?.last_name,
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    departmentId: designation?.department_id ?? "",
    designationId: raw.designation_id,
    department: department
      ? {
          id: department.id,
          name: department.name,
          description: department.description ?? "",
          tenantId: department.tenant_id,
          createdAt: department.created_at,
          updatedAt: department.updated_at ?? department.created_at,
        }
      : null,
    designation: designation
      ? {
          id: designation.id,
          title: designation.title,
          tenantId: user?.tenant_id ?? "",
          departmentId: designation.department_id,
          createdAt: designation.created_at,
          updatedAt: designation.updated_at ?? designation.created_at,
        }
      : null,
    tenantId: user?.tenant_id ?? "",
    createdAt: raw.created_at,
    updatedAt: raw.updated_at ?? raw.created_at,
  };
}

class EmployeeApiService {
  private baseUrl = "/employees";

  async getAllEmployees(filters?: EmployeeFilters): Promise<BackendEmployee[]> {
    try {
      const params: Record<string, string> = {};
      if (filters?.departmentId) params["department_id"] = filters.departmentId;
      if (filters?.designationId) params["designation_id"] = filters.designationId;
      const response = await axiosInstance.get<RawEmployee[]>(this.baseUrl, { params });
      const items = Array.isArray(response.data) ? response.data : [];
      return items.map(normalizeEmployee);
    } catch (error) {
      console.error("Error fetching employees:", error);
      throw error;
    }
  }

  async getEmployeeById(id: string): Promise<BackendEmployee> {
    try {
      const response = await axiosInstance.get<RawEmployee>(`${this.baseUrl}/${id}`);
      return normalizeEmployee(response.data);
    } catch (error) {
      console.error("Error fetching employee:", error);
      throw error;
    }
  }

  async createEmployee(employeeData: EmployeeDto): Promise<BackendEmployee> {
    try {
      const payload = {
        first_name: employeeData.first_name,
        last_name: employeeData.last_name,
        email: employeeData.email,
        phone: employeeData.phone,
        password: employeeData.password,
        designation_id: employeeData.designationId,
      };
      const response = await axiosInstance.post<RawEmployee>(this.baseUrl, payload);
      return normalizeEmployee(response.data);
    } catch (error) {
      console.error("Error creating employee:", error);
      throw error;
    }
  }

  async updateEmployee(id: string, updates: EmployeeUpdateDto): Promise<BackendEmployee> {
    try {
      const payload: Record<string, any> = {};
      if (updates.first_name !== undefined) payload.first_name = updates.first_name;
      if (updates.last_name !== undefined) payload.last_name = updates.last_name;
      if (updates.email !== undefined) payload.email = updates.email;
      if (updates.phone !== undefined) payload.phone = updates.phone;
      if (updates.password !== undefined && updates.password !== "") payload.password = updates.password;
      if (updates.designationId && updates.designationId.trim() !== "") {
        payload.designation_id = updates.designationId;
      }
      const response = await axiosInstance.put<RawEmployee>(`${this.baseUrl}/${id}`, payload);
      return normalizeEmployee(response.data);
    } catch (error) {
      console.error("Error updating employee:", error);
      throw error;
    }
  }

  async deleteEmployee(id: string): Promise<{ deleted: true; id: string }> {
    try {
      const response = await axiosInstance.delete<{ deleted: true; id: string }>(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting employee:", error);
      throw error;
    }
  }
}

const employeeApi = new EmployeeApiService();
export default employeeApi;