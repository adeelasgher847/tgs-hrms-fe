import axiosInstance from './axiosInstance';
import { getRoleName } from '../utils/roleUtils';

export interface LeaveSummaryItem {
  type: string;
  used: number;
  remaining: number;
}

export interface LeaveSummaryResponse {
  year: number;
  summary: LeaveSummaryItem[];
}

export interface TeamMember {
  employeeId: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  leaves: any[];
  totalLeaveDays: number;
}

export interface TeamLeaveSummaryResponse {
  managerId: string;
  month: number;
  year: number;
  teamMembers: TeamMember[];
  totalTeamMembers: number;
  membersOnLeave: number;
}

export interface LeaveBalanceItem {
  leaveTypeId: string;
  leaveTypeName: string;
  maxDaysPerYear: number;
  used: number;
  remaining: number;
  carryForward: boolean;
}

export interface LeaveBalanceResponse {
  employeeId: string;
  year: number;
  balances: LeaveBalanceItem[];
}

export interface AllLeaveReportsResponse {
  employeeReports: EmployeeReport[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface EmployeeReport {
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  leaveSummary: {
    leaveTypeName: string;
    maxDaysPerYear: number;
    totalDays: number;
    remainingDays: number;
  }[];
  totals: {
    approvedRequests: number;
    pendingRequests: number;
    rejectedRequests: number;
  };
}

const getUserFromLocalStorage = () => {
  try {
    const user = localStorage.getItem('user');
    const parsed = user ? JSON.parse(user) : null;

    if (!parsed) {
      return {
        userId: null,
        role: 'unknown',
        isManager: false,
        isHrAdmin: false,
        isSystemAdmin: false,
      };
    }

    const roleName = getRoleName(parsed.role);
    const roleLower = roleName.toLowerCase();

    const isHrAdmin = roleLower === 'hr-admin' || roleLower === 'hr_admin';
    const isSystemAdmin =
      roleLower === 'system-admin' || roleLower === 'system_admin';

    return {
      userId: parsed?.id,
      role: roleLower,
      isManager: roleLower === 'manager',
      isHrAdmin,
      isSystemAdmin,
    };
  } catch (error) {
    console.error('Error getting user from localStorage:', error);
    return {
      userId: null,
      role: 'unknown',
      isManager: false,
      isHrAdmin: false,
      isSystemAdmin: false,
    };
  }
};

export const leaveReportApi = {
  getUserInfo: getUserFromLocalStorage,

  getLeaveSummary: async (page: number): Promise<LeaveSummaryResponse> => {
    const { userId } = getUserFromLocalStorage();
    const response = await axiosInstance.get('/reports/leave-summary', {
      params: { userId, page },
    });
    return response.data;
  },

  getTeamLeaveSummary: async (
    month: number,
    year: number
  ): Promise<TeamLeaveSummaryResponse> => {
    const { userId: managerId } = getUserFromLocalStorage();
    console.log('Sending Team Leave Summary Request:', {
      managerId,
      month,
      year,
    });
    const response = await axiosInstance.get('/reports/team-leave-summary', {
      params: { managerId, month, year },
    });
    return response.data;
  },

  getLeaveBalance: async (): Promise<LeaveBalanceResponse> => {
    const { userId } = getUserFromLocalStorage();
    const response = await axiosInstance.get('/reports/leave-balance', {
      params: { employeeId: userId },
    });
    return response.data;
  },

  exportLeaveSummaryCSV: async (year: number): Promise<Blob> => {
    const { userId } = getUserFromLocalStorage();
    const response = await axiosInstance.get('/reports/leave-summary/export', {
      params: { employeeId: userId, year },
      responseType: 'blob',
    });
    return response.data;
  },

  exportTeamLeaveSummaryCSV: async (
    month: number,
    year: number
  ): Promise<Blob> => {
    const { userId: managerId } = getUserFromLocalStorage();
    const response = await axiosInstance.get(
      '/reports/team-leave-summary/export',
      {
        params: { managerId, month, year },
        responseType: 'blob',
      }
    );
    return response.data;
  },

  exportLeaveBalanceCSV: async (): Promise<Blob> => {
    const { userId } = getUserFromLocalStorage();
    const response = await axiosInstance.get('/reports/leave-balance/export', {
      params: { employeeId: userId },
      responseType: 'blob',
    });
    return response.data;
  },

  getAllLeaveReports: async (
    page: number = 1
  ): Promise<AllLeaveReportsResponse> => {
    const response = await axiosInstance.get(
      `/reports/all-leave-reports?page=${page}`
    );
    const data = response.data;
    if (!data) {
      throw new Error('No response data received');
    }
    if (Array.isArray(data.employeeReports)) {
      return {
        employeeReports: data.employeeReports,
        total: data.total || data.employeeReports.length,
        page: data.page || page,
        limit: data.limit || 10,
        totalPages: data.totalPages || 1,
      };
    }
    if (Array.isArray(data.items)) {
      return {
        employeeReports: data.items,
        total: data.total || data.items.length,
        page: data.page || page,
        limit: data.limit || 10,
        totalPages: data.totalPages || 1,
      };
    }
    if (Array.isArray(data)) {
      return {
        employeeReports: data,
        total: data.length,
        page,
        limit: 10,
        totalPages: 1,
      };
    }
    throw new Error('Unexpected response structure for all leave reports');
  },
};
