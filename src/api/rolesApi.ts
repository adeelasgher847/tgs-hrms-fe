import axiosInstance from './axiosInstance';

// Role interface
export interface Role {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

class RolesApiService {
  private baseUrl = '/roles';

  // Get all roles
  async getAllRoles(): Promise<Role[]> {
    const response = await axiosInstance.get<Role[]>(this.baseUrl);
    return response.data;
  }

  // Get role by ID
  async getRoleById(id: string): Promise<Role | null> {
    const response = await axiosInstance.get<Role>(`${this.baseUrl}/${id}`);
    return response.data;
  }
}

export const rolesApiService = new RolesApiService();
export default rolesApiService;
