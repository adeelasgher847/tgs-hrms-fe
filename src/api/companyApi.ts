import axiosInstance from "./axiosInstance";

// Normalized Tenant interface used by UI
export interface BackendCompany {
  id: string;
  name: string;
  createdAt?: string;
}

// Create/Update DTO interface
export interface CompanyDto {
  name: string;
}

// Backend response envelope
type Envelope<T> = {
  statusCode: number;
  message?: string;
  data: T;
};

// Some endpoints (e.g., delete) return id/message without data
type DeleteEnvelope = {
  statusCode: number;
  message?: string;
  id: string;
};

function normalizeTenant(raw: any): BackendCompany {
  return {
    id: raw?.id,
    name: raw?.name,
    createdAt: raw?.createdAt ?? raw?.created_at ?? undefined,
  };
}

class CompanyApiService {
  private baseUrl = "/tenants";

  async getAllCompanies(): Promise<BackendCompany[]> {
    try {
      const response = await axiosInstance.get<Envelope<any[]>>(this.baseUrl);
      const items = Array.isArray(response.data?.data) ? response.data.data : [];
      return items.map(normalizeTenant);
    } catch (error) {
      console.error("Error fetching companies:", error);
      throw error;
    }
  }

  // Get company by ID
  async getCompanyById(id: string): Promise<BackendCompany> {
    try {
      const response = await axiosInstance.get<Envelope<any>>(`${this.baseUrl}/${id}`);
      return normalizeTenant(response.data.data);
    } catch (error) {
      console.error("Error fetching company:", error);
      throw error;
    }
  }

  // Create new company
  async createCompany(companyData: CompanyDto): Promise<BackendCompany> {
    try {
      const response = await axiosInstance.post<Envelope<any>>(this.baseUrl, companyData);
      return normalizeTenant(response.data.data);
    } catch (error) {
      console.error("Error creating company:", error);
      throw error;
    }
  }

  // Update company
  async updateCompany(id: string, companyData: CompanyDto): Promise<BackendCompany> {
    try {
      const response = await axiosInstance.put<Envelope<any>>(`${this.baseUrl}/${id}`, companyData);
      return normalizeTenant(response.data.data);
    } catch (error) {
      console.error("Error updating company:", error);
      throw error;
    }
  }

  // Delete company
  async deleteCompany(id: string): Promise<{ id: string; message?: string }> {
    try {
      const response = await axiosInstance.delete<DeleteEnvelope>(`${this.baseUrl}/${id}`);
      return { id: response.data.id, message: response.data.message };
    } catch (error) {
      console.error("Error deleting company:", error);
      throw error;
    }
  }
}

const companyApi = new CompanyApiService();
export default companyApi;