import axiosInstance from "./axiosInstance";

// Backend Employee interface (matches your NestJS entity)
export interface BackendEmployee {
  id: string;
  name: string;
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
  };
  designation: {
    id: string;
    title: string;
    tenantId: string;
    departmentId: string;
    createdAt: string;
    updatedAt: string;
  };
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

// New profile endpoint response types (EmployeeProfileService)
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
  attendanceSummary: EmployeeProfileAttendanceSummaryItem[];
  leaveHistory: EmployeeProfileLeaveHistoryItem[];
}

// Create/Update DTO interface
export interface EmployeeDto {
  name: string;
  email: string;
  phone: string;
  departmentId: string;
  designationId: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

class EmployeeApiService {
  private baseUrl = "/employees";

  // Get all companies
  async getAllEmployees(): Promise<BackendEmployee[]> {
    try {
      const response = await axiosInstance.get<BackendEmployee[]>(this.baseUrl);
      return response.data;
    } catch (error) {
      console.error("Error fetching employees:", error);
      throw error;
    }
  }

  // Get company by ID
  async getEmployeeById(id: string): Promise<BackendEmployee> {
    try {
      const response = await axiosInstance.get<BackendEmployee>(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching employee:", error);
      throw error;
    }
  }

  // Get full employee profile by user id (designation, department, attendance, leaves)
  async getEmployeeProfile(userId: string): Promise<EmployeeFullProfile> {
    try {
      const response = await axiosInstance.get<EmployeeFullProfile>(`${this.baseUrl}/users/${userId}/profile`);
      return response.data;
    } catch (error) {
      console.error("Error fetching employee profile:", error);
      throw error;
    }
  }

  // Create new company
  async createEmployee(employeeData: EmployeeDto): Promise<BackendEmployee> {
    try {
      const response = await axiosInstance.post<BackendEmployee>(this.baseUrl, employeeData);
      return response.data;
    } catch (error) {
      console.error("Error creating employee:", error);
      throw error;
    }
  }

  // Update company
  async updateEmployee(id: string, employeeData: EmployeeDto): Promise<BackendEmployee> {
    try {
      const response = await axiosInstance.put<BackendEmployee>(`${this.baseUrl}/${id}`, employeeData);
      return response.data;
    } catch (error) {
      console.error("Error updating employee:", error);
      throw error;
    }
  }

  // Delete employee
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