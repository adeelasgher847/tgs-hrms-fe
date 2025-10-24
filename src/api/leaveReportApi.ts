import axiosInstance from './axiosInstance';

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

const getUserFromLocalStorage = () => {
  const user = localStorage.getItem('user');
  const parsed = user ? JSON.parse(user) : null;
  return {
    userId: parsed?.id,
    role: parsed?.role?.toLowerCase() || 'unknown',
    isManager: parsed?.role?.toLowerCase() === 'manager',
    isHrAdmin: parsed?.role?.toLowerCase() === 'hr-admin',
  };
};

export const leaveReportApi = {
  getUserInfo: getUserFromLocalStorage,

  getLeaveSummary: async (page: number): Promise<LeaveSummaryResponse> => {
    const { userId } = getUserFromLocalStorage();
    const response = await axiosInstance.get('/reports/leave-summary', {
      params: { userId, page },
    });
    console.log('Leave Summary Response:', response.data);
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

    console.log('Team Leave Summary Response:', response.data);
    return response.data;
  },

  getLeaveBalance: async (): Promise<LeaveBalanceResponse> => {
    const { userId } = getUserFromLocalStorage();
    const response = await axiosInstance.get('/reports/leave-balance', {
      params: { employeeId: userId },
    });
    console.log('Leave Balance Response:', response.data);
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

  getAllLeaveReports: async (): Promise<any> => {
    console.log('Sending All Leave Reports Request...');
    const response = await axiosInstance.get('/reports/all-leave-reports');
    console.log('All Leave Reports Response:', response.data);
    return response.data;
  },
};
