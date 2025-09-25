import axiosInstance from './axiosInstance';
import { handleApiError, isGlobalDesignation } from '../utils/errorHandler';

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

function normalizeDesignation(raw: unknown): BackendDesignation {
  return {
    id: raw?.id,
    title: raw?.title,
    departmentId: raw?.departmentId ?? raw?.department_id,
    tenantId: raw?.tenantId ?? raw?.tenant_id,
    createdAt: raw?.createdAt ?? raw?.created_at,
    updatedAt: raw?.updatedAt ?? raw?.updated_at,
  };
}

function normalizeDepartment(raw: unknown): BackendDepartment {
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
    const response = await axiosInstance.get<BackendDepartment[]>(
      this.departmentUrl
    );
    const items = Array.isArray(response.data) ? response.data : [];
    return items.map(normalizeDepartment);
  }

  // Get all designations for a department with pagination
  async getDesignationsByDepartment(
    departmentId: string,
    page: number = 1
  ): Promise<{
    items: BackendDesignation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const response = await axiosInstance.get(
        `${this.baseUrl}/department/${departmentId}?page=${page}`
      );

      // Handle both paginated and non-paginated responses
      let items: unknown[] = [];
      let total = 0;
      let currentPage = page;
      let limit = 25;
      let totalPages = 1;

      if (response.data && response.data.items) {
        // Paginated response
        items = response.data.items;
        total = response.data.total || items.length;
        currentPage = response.data.page || page;
        limit = response.data.limit || 25;
        totalPages = response.data.totalPages || Math.ceil(total / limit);
      } else if (Array.isArray(response.data)) {
        // Direct array (non-paginated)
        items = response.data;
        total = items.length;
        totalPages = 1;
      } else {
        // Fallback
        items = [];
        total = 0;
        totalPages = 1;
      }

      return {
        items: items.map(normalizeDesignation),
        total,
        page: currentPage,
        limit,
        totalPages,
      };
    } catch {
      // Return empty paginated structure on error
      return {
        items: [],
        total: 0,
        page: 1,
        limit: 25,
        totalPages: 1,
      };
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
          const response = await this.getDesignationsByDepartment(
            department.id,
            1
          );
          allDesignations.push(...response.items);
        } catch {
          // Continue with other departments even if one fails
        }
      }

      return allDesignations;
    } catch {
      throw new Error('Failed to fetch all designations');
    }
  }

  // Get designation by ID
  async getDesignationById(id: string): Promise<BackendDesignation> {
    const response = await axiosInstance.get<BackendDesignation>(
      `${this.baseUrl}/${id}`
    );
    return normalizeDesignation(response.data);
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
      const response = await axiosInstance.post<BackendDesignation>(
        this.baseUrl,
        payload
      );
      return normalizeDesignation(response.data);
    } catch (error) {
      const errorResult = handleApiError(error, {
        operation: 'create',
        resource: 'designation',
        isGlobal: false, // Will be determined by the error message
      });
      throw new Error(errorResult.message);
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
      const response = await axiosInstance.put<BackendDesignation>(
        `${this.baseUrl}/${id}`,
        payload
      );
      return normalizeDesignation(response.data);
    } catch (error) {
      const errorResult = handleApiError(error, {
        operation: 'update',
        resource: 'designation',
        isGlobal: false, // Will be determined by the error message
      });
      throw new Error(errorResult.message);
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
      const errorResult = handleApiError(error, {
        operation: 'delete',
        resource: 'designation',
        isGlobal: false, // Will be determined by the error message
      });
      throw new Error(errorResult.message);
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
