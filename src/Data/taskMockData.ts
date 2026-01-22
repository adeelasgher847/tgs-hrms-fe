import { formatDate as _formatDate } from '../utils/dateUtils';

export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string[];
  assignedToName?: string[];
  status: TaskStatus;
  createdBy?: string;
  createdByName?: string;
  createdAt?: string;
  deadline?: string;
  updatedAt?: string;
  teamId?: string;
}

export interface Team {
  id: string;
  name: string;
  department?: string;
  project?: string;
  managerId?: string;
  memberIds?: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  email?: string;
  role?: string;
  department?: string;
}

export const getStatusColor = (status: string | undefined) => {
  const s = String(status ?? '').toLowerCase();
  if (s.includes('progress')) return 'warning' as const;
  if (s.includes('complete')) return 'success' as const;
  return 'default' as const;
};

export const formatDate = (d: unknown) => _formatDate(d);

export default {
  getStatusColor,
  formatDate,
};
