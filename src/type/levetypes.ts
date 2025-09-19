export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';

export interface Leave {
  id: string;
  userId?: string;
  user_id?: string;
  name?: string; // Employee name (for display)
  fromDate: string; // This will be mapped from from_date
  toDate: string; // This will be mapped from to_date
  reason: string;
  type: string;
  status: LeaveStatus;
  isAdminView?: boolean;
  applied?: string; // Applied date for display
  secondaryReason?: string; // For rejection reasons
  created_at?: string;
  updated_at?: string;
}
