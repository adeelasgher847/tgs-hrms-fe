import axiosInstance from './axiosInstance';

// Normalized types exposed to the rest of the app (camelCase)
export interface BackendDesignation {
  id: string;
  title: string;
  departmentId: string;
  tenantId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendDepartment {
  id: string;
  name: string;
  description?: string;
  tenantId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Frontend Designation interface (your current structure)
export interface FrontendDesignation {
  id: string;
  title: string;
  titleAr: string;
  departmentId: string;
}

// Frontend Department interface (for display)
export interface FrontendDepartment {
  id: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
}

// Create/Update DTO interface
export interface DesignationDto {
  title: string;
  departmentId: string;
}

function normalizeDesignation(raw: any): BackendDesignation {
  return {
    id: raw?.id,
    title: raw?.title,
    departmentId: raw?.departmentId ?? raw?.department_id,
    tenantId: raw?.tenantId ?? raw?.tenant_id,
    createdAt: raw?.createdAt ?? raw?.created_at,
    updatedAt: raw?.updatedAt ?? raw?.updated_at,
  };
}

function normalizeDepartment(raw: any): BackendDepartment {
  return {
    id: raw?.id,
    name: raw?.name,
    description: raw?.description,
    tenantId: raw?.tenantId ?? raw?.tenant_id,
    createdAt: raw?.createdAt ?? raw?.created_at,
    updatedAt: raw?.updatedAt ?? raw?.updated_at,
  };
}

class DesignationApiService {
  private baseUrl = '/designations';
  private departmentUrl = '/departments';

  // Get all departments
  async getAllDepartments(): Promise<BackendDepartment[]> {
    try {
      const response = await axiosInstance.get<any[]>(this.departmentUrl);
      const items = Array.isArray(response.data) ? response.data : [];
      return items.map(normalizeDepartment);
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  }

  // Get all designations for a department
  async getDesignationsByDepartment(
    departmentId: string
  ): Promise<BackendDesignation[]> {
    try {
      const response = await axiosInstance.get<any[]>(
        `${this.baseUrl}/department/${departmentId}`
      );
      const items = Array.isArray(response.data) ? response.data : [];
      return items.map(normalizeDesignation);
    } catch (error) {
      console.error('Error fetching designations:', error);
      throw error;
    }
  }

  // Get all designations from all departments
  async getAllDesignations(): Promise<BackendDesignation[]> {
    try {
      // Since your backend doesn't have a direct endpoint for all designations,
      // we'll need to fetch all departments first and then get designations for each
      const departments = await this.getAllDepartments();
      const allDesignations: BackendDesignation[] = [];

      for (const department of departments) {
        try {
          const designations = await this.getDesignationsByDepartment(
            department.id
          );
          allDesignations.push(...designations);
        } catch (error) {
          console.error(
            `Error fetching designations for department ${department.id}:`,
            error
          );
          // Continue with other departments even if one fails
        }
      }

      return allDesignations;
    } catch (error) {
      console.error('Error fetching all designations:', error);
      throw error;
    }
  }

  // Get designation by ID
  async getDesignationById(id: string): Promise<BackendDesignation> {
    try {
      const response = await axiosInstance.get<any>(`${this.baseUrl}/${id}`);
      return normalizeDesignation(response.data);
    } catch (error) {
      console.error('Error fetching designation:', error);
      throw error;
    }
  }

  // Create new designation
  async createDesignation(
    designationData: DesignationDto
  ): Promise<BackendDesignation> {
    try {
      // Backend expects snake_case: { title, department_id }
      const payload = {
        title: designationData.title,
        department_id: designationData.departmentId,
      };
      const response = await axiosInstance.post<any>(this.baseUrl, payload);
      return normalizeDesignation(response.data);
    } catch (error) {
      console.error('Error creating designation:', error);
      throw error;
    }
  }

  // Update designation
  async updateDesignation(
    id: string,
    designationData: DesignationDto
  ): Promise<BackendDesignation> {
    try {
      // Backend uses department_id from existing record; only title is relevant
      const payload = { title: designationData.title };
      const response = await axiosInstance.put<any>(
        `${this.baseUrl}/${id}`,
        payload
      );
      return normalizeDesignation(response.data);
    } catch (error) {
      console.error('Error updating designation:', error);
      throw error;
    }
  }

  // Delete designation
  async deleteDesignation(id: string): Promise<{ deleted: true; id: string }> {
    try {
      const response = await axiosInstance.delete<{
        deleted: true;
        id: string;
      }>(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting designation:', error);
      throw error;
    }
  }

  // Helper function to convert backend designation to frontend format
  convertBackendToFrontend(
    backendDesignation: BackendDesignation
  ): FrontendDesignation {
    return {
      id: backendDesignation.id,
      title: backendDesignation.title,
      titleAr: '', // Arabic title is optional, empty by default
      departmentId: backendDesignation.departmentId,
    };
  }

  // Helper function to convert backend department to frontend format
  convertBackendDepartmentToFrontend(
    backendDepartment: BackendDepartment
  ): FrontendDepartment {
    return {
      id: backendDepartment.id,
      name: backendDepartment.name,
      nameAr: backendDepartment.name, // Use English name for Arabic display for now
      description: backendDepartment.description,
      descriptionAr: backendDepartment.description, // Use English description for Arabic display for now
    };
  }

  // Helper function to convert frontend designation to backend format
  convertFrontendToBackend(
    frontendDesignation: FrontendDesignation
  ): DesignationDto {
    return {
      title: frontendDesignation.title,
      departmentId: frontendDesignation.departmentId,
    };
  }
}

export const designationApiService = new DesignationApiService();
