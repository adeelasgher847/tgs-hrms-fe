export type LeaveStatus = "Pending" | "Approved" | "Rejected";

export interface Leave {
  id: number;
  name: string; // Employee name
  from: string;
  to: string;
  reason: string;
  type: string;
  status: LeaveStatus;
  isAdminView?: boolean;
}
