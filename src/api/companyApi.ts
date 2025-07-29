import axiosInstance from "./axiosInstance";

// Backend Company interface (matches your NestJS entity)
export interface BackendCompany {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// Create/Update DTO interface
export interface CompanyDto {
  name: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

class CompanyApiService {
  private baseUrl = "/company";

  // Get all companies
  async getAllCompanies(): Promise<BackendCompany[]> {
    try {
      const response = await axiosInstance.get<BackendCompany[]>(this.baseUrl);
      return response.data;
    } catch (error) {
      console.error("Error fetching companies:", error);
      throw error;
    }
  }

  // Get company by ID
  async getCompanyById(id: string): Promise<BackendCompany> {
    try {
      const response = await axiosInstance.get<BackendCompany>(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching company:", error);
      throw error;
    }
  }

  // Create new company
  async createCompany(companyData: CompanyDto): Promise<BackendCompany> {
    try {
      const response = await axiosInstance.post<BackendCompany>(this.baseUrl, companyData);
      return response.data;
    } catch (error) {
      console.error("Error creating company:", error);
      throw error;
    }
  }

  // Update company
  async updateCompany(id: string, companyData: CompanyDto): Promise<BackendCompany> {
    try {
      const response = await axiosInstance.put<BackendCompany>(`${this.baseUrl}/${id}`, companyData);
      return response.data;
    } catch (error) {
      console.error("Error updating company:", error);
      throw error;
    }
  }

  // Delete company
  async deleteCompany(id: string): Promise<{ deleted: true; id: string }> {
    try {
      const response = await axiosInstance.delete<{ deleted: true; id: string }>(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting company:", error);
      throw error;
    }
  }
}

const companyApi = new CompanyApiService();
export default companyApi; 