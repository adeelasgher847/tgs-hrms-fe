import { th } from 'date-fns/locale';
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
  members?: TeamMember[];
  memberCount?: number;
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

export interface TenantTeamMember {
  id: string;
  status: string;
  user: {
    id: string;
    name: string;
    email: string;
    profile_pic?: string | null;
  };
  designation: {
    id: string;
    title: string;
  };
  department: {
    id: string;
    name: string;
  };
}

export interface TenantTeam {
  id: string;
  name: string;
  description: string;
  created_at: string;
  manager: {
    id: string;
    name: string;
    first_name: string;
    last_name: string;
    email: string;
    profile_pic?: string | null;
    role: string;
  };
  members: TenantTeamMember[];
}

export interface TenantTeams {
  tenant_id: string;
  tenant_name: string;
  tenant_status: string;
  teams: TenantTeam[];
}

export interface AllTenantsTeamsResponse {
  tenants: TenantTeams[];
}

class TeamApiService {
  private baseUrl = '/teams';

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

  async createTeam(teamData: CreateTeamDto): Promise<Team> {
    const response = await axiosInstance.post<Team>(this.baseUrl, teamData);
    const newTeam = response.data;

    if (newTeam.id && teamData.manager_id) {
      try {
        await this.addMemberToTeam(newTeam.id, teamData.manager_id);
      } catch (error) {
        throw error;
      }
    }

    return newTeam;
  }

  async getAllTeams(page: number | null = 1): Promise<PaginatedResponse<Team>> {
    const url = page === null ? this.baseUrl : `${this.baseUrl}?page=${page}`;
    const response = await axiosInstance.get<PaginatedResponse<Team>>(url);
    const teams = response.data;

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
              return { ...team, teamMembers: [] };
            }
          }
          return team;
        })
      );

      return { ...teams, items: teamsWithMembers };
    }

    return teams;
  }

  async getTeamById(id: string): Promise<Team> {
    const response = await axiosInstance.get<Team>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async updateTeam(id: string, teamData: UpdateTeamDto): Promise<Team> {
    const currentTeam = await this.getTeamById(id);

    const response = await axiosInstance.patch<Team>(
      `${this.baseUrl}/${id}`,
      teamData
    );
    const updatedTeam = response.data;

    if (teamData.manager_id && teamData.manager_id !== currentTeam.manager_id) {
      try {
        if (currentTeam.manager_id) {
          await this.removeMemberFromTeam(id, currentTeam.manager_id);
        }
        await this.addMemberToTeam(id, teamData.manager_id);
      } catch (error) {
        throw error;
      }
    }

    return updatedTeam;
  }

  async deleteTeam(id: string): Promise<void> {
    await axiosInstance.delete(`${this.baseUrl}/${id}`);
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
      return { items: [], total: 0, page: 1, limit: 25, totalPages: 1 };
    }
  }

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
      return { items: [], total: 0, page: 1, limit: 25, totalPages: 1 };
    }
  }

  async getAvailableEmployees(
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<PaginatedResponse<TeamMember>> {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search) params.append('search', search);

      const response = await axiosInstance.get<PaginatedResponse<TeamMember>>(
        `${this.baseUrl}/employee-pool?${params}`
      );
      return response.data;
    } catch {
      return { items: [], total: 0, page: 1, limit: 25, totalPages: 1 };
    }
  }

  // Add member to team
  async addMemberToTeam(
    teamId: string,
    employeeId: string,
    companyId?: string
  ): Promise<void> {
    const payload: any = { employee_id: employeeId };
    if (companyId) payload.company_id = companyId;

    await axiosInstance.post(`${this.baseUrl}/${teamId}/add-member`, payload);
  }

  // Remove member from team
  async removeMemberFromTeam(
    teamId: string,
    employeeId: string
  ): Promise<void> {
    await axiosInstance.post(`${this.baseUrl}/${teamId}/remove-member`, {
      employee_id: employeeId,
    });
  }

  async getAllTeamMembers(
    page: number = 1
  ): Promise<
    PaginatedResponse<TeamMember & { team?: { id: string; name: string } }>
  > {
    try {
      const response = await axiosInstance.get<
        PaginatedResponse<TeamMember & { team?: { id: string; name: string } }>
      >(`${this.baseUrl}/all-members?page=${page}`);
      return response.data;
    } catch {
      return { items: [], total: 0, page: 1, limit: 25, totalPages: 1 };
    }
  }

  async getAllTenantsWithTeams(
    tenantId?: string
  ): Promise<AllTenantsTeamsResponse> {
    try {
      const params = tenantId ? `?tenant_id=${tenantId}` : '';
      const response = await axiosInstance.get<AllTenantsTeamsResponse>(
        `${this.baseUrl}/all-tenants${params}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export const teamApiService = new TeamApiService();
