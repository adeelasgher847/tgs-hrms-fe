export type NormalizedRole =
  | 'system-admin'
  | 'admin'
  | 'manager'
  | 'employee'
  | 'user'
  | 'unknown';

export const normalizeRole = (role?: string): NormalizedRole => {
  if (!role) return 'unknown';
  const r = role.trim().toLowerCase();
  if (r === 'system-admin' || r === 'system_admin' || r === 'system admin')
    return 'system-admin';
  if (r === 'admin') return 'admin';
  if (r === 'manager') return 'manager';
  if (r === 'employee') return 'employee';
  if (r === 'user') return 'user';
  return r as NormalizedRole;
};

// Role -> default route under /dashboard
export const getDefaultDashboardRoute = (role?: string): string => {
  const r = normalizeRole(role);
  switch (r) {
    case 'system-admin':
      return '/dashboard'; // System admin dashboard
    case 'admin':
      return '/dashboard'; // HR dashboard (_index)
    case 'manager':
      return '/dashboard/teams';
    case 'employee':
    case 'user':
      return '/dashboard/AttendanceCheck';
    default:
      return '/dashboard';
  }
};

// Top-level menu visibility by label
export const isMenuVisibleForRole = (
  menuLabel: string,
  role?: string
): boolean => {
  const r = normalizeRole(role);
  const label = menuLabel.trim().toLowerCase();

  // Only keep core HRMS sections per requirements
  const allowedByRole: Record<NormalizedRole, string[]> = {
    'system-admin': [
      'dashboard',
      'tenant',
      'department',
      'employees',
      'teams',
      'attendance',
    ],
    admin: ['dashboard', 'department', 'employees', 'teams', 'attendance'],
    manager: ['teams', 'attendance'],
    employee: ['attendance'],
    user: ['attendance'],
    unknown: [],
  };

  // map synonyms from current sidebar to requirement naming
  const normalizedMenuKey = (() => {
    if (label.includes('dashboard')) return 'dashboard';
    if (label.includes('tenant')) return 'tenant';
    if (label.includes('department')) return 'department';
    if (label.includes('employee')) return 'employees';
    if (label.includes('team')) return 'teams';
    if (label.includes('attendance')) return 'attendance';
    // Hide all miscellaneous sections for now (Projects, Accounts, Payroll, App, Other Pages, UI Components)
    return 'misc';
  })();

  const allowed = allowedByRole[r] ?? [];
  return allowed.includes(normalizedMenuKey);
};

// Submenu visibility helper per parent menu and sub label
export const isSubMenuVisibleForRole = (
  parentMenuLabel: string,
  subLabel: string,
  role?: string
): boolean => {
  const r = normalizeRole(role);
  const parent = parentMenuLabel.trim().toLowerCase();
  const sub = subLabel.trim().toLowerCase();

  // Default: visible unless explicitly hidden below
  let visible = true;

  // System-admin: hide only the "Attendance" submenu (check-in/check-out)
  if (r === 'system-admin') {
    if (parent.includes('attendance')) {
      // Hide only the exact "Attendance" sub item (check-in/check-out), keep "Attendance Table" and "Reports"
      if (sub === 'attendance') {
        visible = false;
      }
    }
  }

  // Admin: hide Department -> (User List, Policies, Holidays); Attendance -> Reports only
  if (r === 'admin') {
    if (parent.includes('department')) {
      if (
        sub.includes('user list') ||
        sub.includes('policies') ||
        sub.includes('holidays')
      ) {
        visible = false;
      }
    }
    if (parent.includes('attendance')) {
      // hide only Reports for admin, but keep Attendance and Attendance Table visible
      if (sub.includes('reports')) {
        visible = false;
      }
    }
  }

  // Manager: hide Attendance -> Reports
  if (r === 'manager') {
    if (parent.includes('attendance') && sub.includes('reports')) {
      visible = false;
    }
  }

  // Employee/User: hide Attendance -> Reports
  if (r === 'employee' || r === 'user') {
    if (parent.includes('attendance') && sub.includes('reports')) {
      visible = false;
    }
  }

  return visible;
};

// Allowed paths under /dashboard per role
export const isDashboardPathAllowedForRole = (
  pathAfterDashboard: string,
  role?: string
): boolean => {
  const r = normalizeRole(role);
  const p = (pathAfterDashboard || '').replace(/^\/+|\/+$/g, '');

  // Index /dashboard
  if (p === '') {
    return r === 'admin' || r === 'system-admin';
  }

  const allowlists: Record<NormalizedRole, Set<string>> = {
    'system-admin': new Set([
      // Core
      '',
      'tenant',
      'departments',
      'Designations',
      'EmployeeManager',
      'UserList',
      'UserProfile',
      // Hide these submenus for admin/system-admin, but keep route available only if you want deep link access.
      // To block direct access, remove the entries below from the allowlist.
      // 'policies', 'holidays',
      'leaves',
      // Attendance - Allow AttendanceTable and Reports, but NOT AttendanceCheck (check-in/check-out)
      // 'AttendanceCheck', // HIDDEN for system-admin
      'AttendanceTable', // ALLOWED for system-admin
      // 'AttendanceCheck/TimesheetLayout', // HIDDEN for system-admin
      'Reports', // ALLOWED for system-admin
      // Teams
      'teams',
      // Employee profile view
      'EmployeeProfileView',
    ]),
    admin: new Set([
      '',
      'departments',
      'Designations',
      'EmployeeManager',
      'UserList',
      'UserProfile',
      // 'policies', 'holidays',
      'leaves',
      // Attendance - Allow AttendanceCheck for admin
      'AttendanceCheck',
      'AttendanceTable',
      'AttendanceCheck/TimesheetLayout',
      // 'Reports',
      'teams',
      'EmployeeProfileView',
    ]),
    manager: new Set([
      'AttendanceCheck',
      'AttendanceTable',
      // 'Reports',
      'AttendanceCheck/TimesheetLayout',
      'teams',
      'leaves',
      'UserProfile',
    ]),
    employee: new Set([
      'AttendanceCheck',
      'AttendanceTable',
      // 'Reports',
      'AttendanceCheck/TimesheetLayout',
      'leaves',
      'UserProfile',
    ]),
    user: new Set([
      'AttendanceCheck',
      'AttendanceTable',
      // 'Reports',
      'AttendanceCheck/TimesheetLayout',
      'leaves',
      'UserProfile',
    ]),
    unknown: new Set<string>(),
  };

  return allowlists[r].has(p);
};
