import axiosInstance from './axiosInstance';

// Backend Department interface (matches your NestJS entity)
export interface BackendDepartment {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Frontend Department interface (your current structure)
export interface FrontendDepartment {
  id: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  subtitle?: string;
  subtitleAr?: string;
}

// Create/Update DTO interface
export interface DepartmentDto {
  name: string;
  description?: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

class DepartmentApiService {
  private baseUrl = '/departments';

  // Get all departments
  async getAllDepartments(): Promise<BackendDepartment[]> {
    const response = await axiosInstance.get<BackendDepartment[]>(
      this.baseUrl
    );
    return response.data;
  }

  // Get department by ID
  async getDepartmentById(id: string): Promise<BackendDepartment> {
    const response = await axiosInstance.get<BackendDepartment>(
      `${this.baseUrl}/${id}`
    );
    return response.data;
  }

  // Create new department
  async createDepartment(
    departmentData: DepartmentDto
  ): Promise<BackendDepartment> {
    const response = await axiosInstance.post<BackendDepartment>(
      this.baseUrl,
      departmentData
    );
    return response.data;
  }

  // Update department
  async updateDepartment(
    id: string,
    departmentData: DepartmentDto
  ): Promise<BackendDepartment> {
    const response = await axiosInstance.put<BackendDepartment>(
      `${this.baseUrl}/${id}`,
      departmentData
    );
    return response.data;
  }

  // Delete department
  async deleteDepartment(id: string): Promise<{ deleted: true; id: string }> {
    const response = await axiosInstance.delete<{
      deleted: true;
      id: string;
    }>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  // Helper function to convert backend department to frontend format
  convertBackendToFrontend(backendDept: BackendDepartment): FrontendDepartment {
    // Backend only stores English fields, Arabic fields are optional
    return {
      id: backendDept.id,
      name: backendDept.name,
      nameAr: '', // Arabic name is optional, empty by default
      description: backendDept.description || '',
      descriptionAr: '', // Arabic description is optional, empty by default
    };
  }

  // Helper function to convert frontend department to backend format
  convertFrontendToBackend(frontendDept: FrontendDepartment): DepartmentDto {
    // Only send English fields to backend, Arabic fields are ignored
    return {
      name: frontendDept.name,
      description: frontendDept.description || undefined, // Only send if not empty
    };
  }
}

export const departmentApiService = new DepartmentApiService();
