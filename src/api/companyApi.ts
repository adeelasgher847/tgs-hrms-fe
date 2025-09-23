import axiosInstance from './axiosInstance';

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

// Backend envelope
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

function normalizeTenant(raw: unknown): BackendCompany {
  return {
    id: raw?.id,
    name: raw?.name,
    createdAt: raw?.createdAt ?? raw?.created_at ?? undefined,
  };
}

class CompanyApiService {
  private baseUrl = '/tenants';

  async getAllCompanies(): Promise<BackendCompany[]> {
    const response = await axiosInstance.get<Envelope<BackendCompany[]>>(
      this.baseUrl
    );
    const items = Array.isArray(response.data?.data) ? response.data.data : [];
    return items.map(normalizeTenant);
  }

  // Get company by ID
  async getCompanyById(id: string): Promise<BackendCompany> {
    const response = await axiosInstance.get<Envelope<BackendCompany>>(
      `${this.baseUrl}/${id}`
    );
    return normalizeTenant(response.data.data);
  }

  // Create new company
  async createCompany(companyData: CompanyDto): Promise<BackendCompany> {
    const response = await axiosInstance.post<Envelope<BackendCompany>>(
      this.baseUrl,
      companyData
    );
    return normalizeTenant(response.data.data);
  }

  // Update company
  async updateCompany(
    id: string,
    companyData: CompanyDto
  ): Promise<BackendCompany> {
    const response = await axiosInstance.put<Envelope<BackendCompany>>(
      `${this.baseUrl}/${id}`,
      companyData
    );
    return normalizeTenant(response.data.data);
  }

  // Delete company
  async deleteCompany(id: string): Promise<{ id: string; message?: string }> {
    const response = await axiosInstance.delete<DeleteEnvelope>(
      `${this.baseUrl}/${id}`
    );
    return { id: response.data.id, message: response.data.message };
  }
}

const companyApi = new CompanyApiService();
export default companyApi;
