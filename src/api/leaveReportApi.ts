import axiosInstance from './axiosInstance';
import { getRoleName } from '../utils/roleUtils';
import type { Leave } from '../type/levetypes';

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
  leaves: Leave[];
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

export interface LeaveRecord {
  id: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  totalDays: number | null;
  status: 'approved' | 'pending' | 'rejected';
  reason?: string;
  appliedDate: string;
  approvedBy?: string | null;
  approvedDate?: string | null;
}

export interface LeaveSummaryItem {
  leaveTypeId: string;
  leaveTypeName: string;
  totalDays: number;
  approvedDays: number;
  pendingDays: number;
  rejectedDays: number;
  maxDaysPerYear: number;
  remainingDays: number;
}

export interface EmployeeReport {
  employeeId: string;
  employeeName: string;
  email?: string;
  department: string;
  designation: string;
  leaveSummary: LeaveSummaryItem[];
  leaveRecords: LeaveRecord[];
  totals: {
    totalLeaveDays: number;
    approvedLeaveDays: number;
    pendingLeaveDays: number;
    totalLeaveRequests: number;
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

    // Helper function to calculate days between two dates
    const calculateDays = (startDate: string, endDate: string): number => {
      try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diff = Math.floor(
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        );
        return diff >= 0 ? diff + 1 : 0; // +1 to include both start and end dates
      } catch {
        return 0;
      }
    };

    if (Array.isArray(data.employeeReports)) {
      const fixedReports = data.employeeReports.map((emp: EmployeeReport) => {
        const leaveRecords: LeaveRecord[] = emp.leaveRecords || [];
        const leaveSummary: LeaveSummaryItem[] = emp.leaveSummary || [];

        // Create a map of leave type IDs to their summaries for quick lookup
        const summaryMap = new Map<string, LeaveSummaryItem>();
        leaveSummary.forEach((summary: LeaveSummaryItem) => {
          summaryMap.set(summary.leaveTypeId, {
            ...summary,
            approvedDays: summary.approvedDays ?? 0,
            pendingDays: summary.pendingDays ?? 0,
            rejectedDays: summary.rejectedDays ?? 0,
            totalDays: summary.totalDays ?? 0,
          });
        });

        // Process leave records to calculate actual days used per leave type
        const leaveTypeStats = new Map<
          string,
          {
            approvedDays: number;
            pendingDays: number;
            rejectedDays: number;
            totalDays: number;
          }
        >();

        leaveRecords.forEach((record: LeaveRecord) => {
          if (!record.startDate || !record.endDate) return;

          // Calculate days for this record
          let recordDays = record.totalDays;
          if (recordDays === null || recordDays === undefined) {
            recordDays = calculateDays(record.startDate, record.endDate);
          }

          // Try to find the leave type ID from the summary
          // If leaveTypeName matches, use that leaveTypeId
          let leaveTypeId: string | null = null;
          for (const [id, summary] of summaryMap.entries()) {
            if (
              summary.leaveTypeName === record.leaveTypeName ||
              summary.leaveTypeName.toLowerCase() ===
                record.leaveTypeName?.toLowerCase()
            ) {
              leaveTypeId = id;
              break;
            }
          }

          // If we found a matching leave type, update stats
          if (leaveTypeId) {
            const stats = leaveTypeStats.get(leaveTypeId) || {
              approvedDays: 0,
              pendingDays: 0,
              rejectedDays: 0,
              totalDays: 0,
            };

            if (record.status === 'approved') {
              stats.approvedDays += recordDays;
            } else if (record.status === 'pending') {
              stats.pendingDays += recordDays;
            } else if (record.status === 'rejected') {
              stats.rejectedDays += recordDays;
            }
            stats.totalDays += recordDays;

            leaveTypeStats.set(leaveTypeId, stats);
          }
        });

        // Update leave summary with calculated values
        const updatedLeaveSummary = leaveSummary.map(
          (summary: LeaveSummaryItem) => {
            const stats = leaveTypeStats.get(summary.leaveTypeId);
            const approvedDays =
              stats?.approvedDays ?? summary.approvedDays ?? 0;
            const pendingDays = stats?.pendingDays ?? summary.pendingDays ?? 0;
            const rejectedDays =
              stats?.rejectedDays ?? summary.rejectedDays ?? 0;
            const totalDays = approvedDays + pendingDays + rejectedDays;
            // Remaining days = maxDays - approvedDays (pending leaves don't reduce remaining balance)
            const remainingDays = (summary.maxDaysPerYear ?? 0) - approvedDays;

            return {
              ...summary,
              approvedDays,
              pendingDays,
              rejectedDays,
              totalDays,
              remainingDays: Math.max(0, remainingDays),
            };
          }
        );

        // Calculate totals from leave records
        const validRecords = leaveRecords.filter(
          (r: LeaveRecord) => r.startDate && r.endDate
        );

        let totalLeaveDays = 0;
        let approvedLeaveDays = 0;
        let pendingLeaveDays = 0;
        let approvedRequests = 0;
        let pendingRequests = 0;
        let rejectedRequests = 0;

        validRecords.forEach((record: LeaveRecord) => {
          let recordDays = record.totalDays;
          if (recordDays === null || recordDays === undefined) {
            recordDays = calculateDays(record.startDate, record.endDate);
          }

          totalLeaveDays += recordDays;

          if (record.status === 'approved') {
            approvedLeaveDays += recordDays;
            approvedRequests += 1;
          } else if (record.status === 'pending') {
            pendingLeaveDays += recordDays;
            pendingRequests += 1;
          } else if (record.status === 'rejected') {
            rejectedRequests += 1;
          }
        });

        // Update totals, preferring calculated values if backend values are 0 or missing
        const totals = emp.totals || {};
        const updatedTotals = {
          totalLeaveDays:
            totalLeaveDays > 0 ? totalLeaveDays : (totals.totalLeaveDays ?? 0),
          approvedLeaveDays:
            approvedLeaveDays > 0
              ? approvedLeaveDays
              : (totals.approvedLeaveDays ?? 0),
          pendingLeaveDays:
            pendingLeaveDays > 0
              ? pendingLeaveDays
              : (totals.pendingLeaveDays ?? 0),
          totalLeaveRequests:
            validRecords.length > 0
              ? validRecords.length
              : (totals.totalLeaveRequests ?? 0),
          approvedRequests:
            approvedRequests > 0
              ? approvedRequests
              : (totals.approvedRequests ?? 0),
          pendingRequests:
            pendingRequests > 0
              ? pendingRequests
              : (totals.pendingRequests ?? 0),
          rejectedRequests:
            rejectedRequests > 0
              ? rejectedRequests
              : (totals.rejectedRequests ?? 0),
        };

        return {
          ...emp,
          leaveSummary: updatedLeaveSummary,
          leaveRecords: leaveRecords.map((record: LeaveRecord) => ({
            ...record,
            totalDays:
              record.totalDays ??
              (record.startDate && record.endDate
                ? calculateDays(record.startDate, record.endDate)
                : 0),
          })),
          totals: updatedTotals,
        };
      });

      return {
        employeeReports: fixedReports,
        total: data.total || fixedReports.length,
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
