export type LeaveStatus = "Pending" | "Approved" | "Rejected";

export interface Leave {
  id: number;
  from: string;
  to: string;
  reason: string;
  type: string;
  status: LeaveStatus;
  isAdminView?: boolean;
}
