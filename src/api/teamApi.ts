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

// Paginated interface
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

// Manager interface for dropdown
export interface Manager {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

class TeamApiService {
  private baseUrl = '/teams';

  // Get available managers (users with manager role who are not assigned to any team)
  async getAvailableManagers(): Promise<Manager[]> {
    try {
      const response = await axiosInstance.get<Manager[]>(
        `${this.baseUrl}/available-managers`
      );
      return response.data;
    } catch {
      return [];
    }
  }

  // Create new team (Admin only)
  async createTeam(teamData: CreateTeamDto): Promise<Team> {
    try {
      const response = await axiosInstance.post<Team>(this.baseUrl, teamData);
      const newTeam = response.data;

      // Add the manager as a team member so they appear in team member lists
      if (newTeam.id && teamData.manager_id) {
        try {
          await this.addMemberToTeam(newTeam.id, teamData.manager_id);
        } catch (error) {
          console.warn('Failed to add manager as team member:', error);
          // Don't throw here as the team was created successfully
        }
      }

      return newTeam;
    } catch {
      throw error;
    }
  }

  // Get all teams with pagination (Admin only)
  async getAllTeams(page: number = 1): Promise<PaginatedResponse<Team>> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<Team>>(
        `${this.baseUrl}?page=${page}`
      );
      const teams = response.data;

      // For each team, fetch the member count if not already included
      if (teams.items) {
        const teamsWithMembers = await Promise.all(
          teams.items.map(async team => {
            if (!team.teamMembers) {
              try {
                const membersResponse = await this.getTeamMembers(team.id, 1);
                return {
                  ...team,
                  teamMembers: membersResponse.items || [],
                };
              } catch {
                return {
                  ...team,
                  teamMembers: [],
                };
              }
            }
            return team;
          })
        );

        return {
          ...teams,
          items: teamsWithMembers,
        };
      }

      return teams;
    } catch {
      throw error;
    }
  }

  // Get specific team details
  async getTeamById(id: string): Promise<Team> {
    try {
      const response = await axiosInstance.get<Team>(`${this.baseUrl}/${id}`);
      return response.data;
    } catch {
      throw error;
    }
  }

  // Update team (Admin only)
  async updateTeam(id: string, teamData: UpdateTeamDto): Promise<Team> {
    try {
      // Get current team data to check if manager is changing
      const currentTeam = await this.getTeamById(id);

      const response = await axiosInstance.patch<Team>(
        `${this.baseUrl}/${id}`,
        teamData
      );
      const updatedTeam = response.data;

      // If manager is changing, update team membership
      if (
        teamData.manager_id &&
        teamData.manager_id !== currentTeam.manager_id
      ) {
        try {
          // Remove old manager from team if they exist
          if (currentTeam.manager_id) {
            await this.removeMemberFromTeam(id, currentTeam.manager_id);
          }

          // Add new manager to team
          await this.addMemberToTeam(id, teamData.manager_id);
        } catch (error) {
          console.warn('Failed to update manager team membership:', error);
          // Don't throw here as the team was updated successfully
        }
      }

      return updatedTeam;
    } catch {
      throw error;
    }
  }

  // Delete team (Admin only)
  async deleteTeam(id: string): Promise<void> {
    try {
      await axiosInstance.delete(`${this.baseUrl}/${id}`);
    } catch {
      throw error;
    }
  }

  // Get manager's teams
  async getMyTeams(): Promise<Team[]> {
    try {
      const response = await axiosInstance.get<Team[]>(
        `${this.baseUrl}/my-teams`
      );
      return response.data;
    } catch {
      return [];
    }
  }

  // Get manager's team members
  async getMyTeamMembers(
    page: number = 1
  ): Promise<PaginatedResponse<TeamMember>> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<TeamMember>>(
        `${this.baseUrl}/my-members?page=${page}`
      );
      return response.data;
    } catch {
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
  async getAvailableEmployees(
    page: number = 1,
    search?: string
  ): Promise<PaginatedResponse<TeamMember>> {
    try {
      const params = new URLSearchParams({ page: page.toString() });
      if (search) params.append('search', search);

      const response = await axiosInstance.get<PaginatedResponse<TeamMember>>(
        `${this.baseUrl}/available-employees?${params}`
      );
      return response.data;
    } catch {
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
  async getTeamMembers(
    teamId: string,
    page: number = 1
  ): Promise<PaginatedResponse<TeamMember>> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<TeamMember>>(
        `${this.baseUrl}/${teamId}/members?page=${page}`
      );
      return response.data;
    } catch {
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
    } catch {
      throw error;
    }
  }

  // Remove member from team
  async removeMemberFromTeam(
    teamId: string,
    employeeId: string
  ): Promise<void> {
    try {
      await axiosInstance.post(`${this.baseUrl}/${teamId}/remove-member`, {
        employee_id: employeeId,
      });
    } catch {
      throw error;
    }
  }

  // Get all team members across all teams (Admin only)
  async getAllTeamMembers(
    page: number = 1
  ): Promise<PaginatedResponse<TeamMember & { team?: { id: string; name: string } }>> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<TeamMember & { team?: { id: string; name: string } }>>(
        `${this.baseUrl}/all-members?page=${page}`
      );
      console.log("Get all team members response:", response)
      return response.data;
    } catch {
      return {
        items: [],
        total: 0,
        page: 1,
        limit: 25,
        totalPages: 1,
      };
    }
  }
}

export const teamApiService = new TeamApiService();
