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
    try {
      const response = await axiosInstance.get<Role[]>(this.baseUrl);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      return [];
    }
  }

  // Get role by ID
  async getRoleById(id: string): Promise<Role | null> {
    try {
      const response = await axiosInstance.get<Role>(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch role:', error);
      return null;
    }
  }
}

export const rolesApiService = new RolesApiService();
export default rolesApiService;
