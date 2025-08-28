import axiosInstance from './axiosInstance';

// Team Member interface
export interface TeamMember {
  id: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    profile_pic?: string | null;
  };
  designation: {
    id: string;
    title: string;
    department?: {
      id: string;
      name: string;
    };
  };
  department?: {
    id: string;
    name: string;
  };
  team_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Team interface
export interface Team {
  id: string;
  name: string;
  description: string;
  manager_id: string;
  created_at: string;
  updated_at: string;
  manager?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    profile_pic?: string | null;
  };
  teamMembers?: TeamMember[];
}

// Paginated response interface
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// DTOs
export interface CreateTeamDto {
  name: string;
  description?: string;
  manager_id: string;
}

export interface UpdateTeamDto {
  name?: string;
  description?: string;
  manager_id?: string;
}

export interface AddMemberDto {
  employee_id: string;
}

export interface RemoveMemberDto {
  employee_id: string;
}

class TeamApiService {
  private baseUrl = '/teams';

  // Create new team (Admin only)
  async createTeam(teamData: CreateTeamDto): Promise<Team> {
    try {
      const response = await axiosInstance.post<Team>(this.baseUrl, teamData);
      return response.data;
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  }

  // Get all teams with pagination (Admin only)
  async getAllTeams(page: number = 1): Promise<PaginatedResponse<Team>> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<Team>>(`${this.baseUrl}?page=${page}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }
  }

  // Get specific team details
  async getTeamById(id: string): Promise<Team> {
    try {
      const response = await axiosInstance.get<Team>(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching team:', error);
      throw error;
    }
  }

  // Update team (Admin only)
  async updateTeam(id: string, teamData: UpdateTeamDto): Promise<Team> {
    try {
      const response = await axiosInstance.patch<Team>(`${this.baseUrl}/${id}`, teamData);
      return response.data;
    } catch (error) {
      console.error('Error updating team:', error);
      throw error;
    }
  }

  // Delete team (Admin only)
  async deleteTeam(id: string): Promise<void> {
    try {
      await axiosInstance.delete(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error('Error deleting team:', error);
      throw error;
    }
  }

  // Get manager's teams
  async getMyTeams(): Promise<Team[]> {
    try {
      const response = await axiosInstance.get<Team[]>(`${this.baseUrl}/my-teams`);
      return response.data;
    } catch (error) {
      console.error('Error fetching my teams:', error);
      return [];
    }
  }

  // Get manager's team members
  async getMyTeamMembers(page: number = 1): Promise<PaginatedResponse<TeamMember>> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<TeamMember>>(`${this.baseUrl}/my-members?page=${page}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching my team members:', error);
      return {
        items: [],
        total: 0,
        page: 1,
        limit: 25,
        totalPages: 1,
      };
    }
  }

  // Get available employees for team assignment
  async getAvailableEmployees(page: number = 1, search?: string): Promise<PaginatedResponse<TeamMember>> {
    try {
      const params = new URLSearchParams({ page: page.toString() });
      if (search) params.append('search', search);
      
      const response = await axiosInstance.get<PaginatedResponse<TeamMember>>(`${this.baseUrl}/available-employees?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching available employees:', error);
      return {
        items: [],
        total: 0,
        page: 1,
        limit: 25,
        totalPages: 1,
      };
    }
  }

  // Get team members for specific team
  async getTeamMembers(teamId: string, page: number = 1): Promise<PaginatedResponse<TeamMember>> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<TeamMember>>(`${this.baseUrl}/${teamId}/members?page=${page}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching team members:', error);
      return {
        items: [],
        total: 0,
        page: 1,
        limit: 25,
        totalPages: 1,
      };
    }
  }

  // Add member to team
  async addMemberToTeam(teamId: string, employeeId: string): Promise<void> {
    try {
      await axiosInstance.post(`${this.baseUrl}/${teamId}/add-member`, {
        employee_id: employeeId,
      });
    } catch (error) {
      console.error('Error adding member to team:', error);
      throw error;
    }
  }

  // Remove member from team
  async removeMemberFromTeam(teamId: string, employeeId: string): Promise<void> {
    try {
      await axiosInstance.post(`${this.baseUrl}/${teamId}/remove-member`, {
        employee_id: employeeId,
      });
    } catch (error) {
      console.error('Error removing member from team:', error);
      throw error;
    }
  }
}

export const teamApiService = new TeamApiService();
