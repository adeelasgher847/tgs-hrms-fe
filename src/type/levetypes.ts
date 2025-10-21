export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';

export interface Leave {
  id: string;
  employeeId: string;
  employee?: {
    id: string;
    first_name: string;
    last_name?: string;
    email: string;
  };
  leaveTypeId: string;
  leaveType?: {
    id: string;
    name: string;
    description?: string;
    maxDaysPerYear?: number;
    carryForward?: boolean;
  };
  reason: string;
  remarks?: string;
  startDate: string;
  endDate: string;
  totalDays?: number;
  status: LeaveStatus;
  createdAt?: string;
  updatedAt?: string;
  approvedAt?: string | null;
  approvedBy?: string | null;
}
