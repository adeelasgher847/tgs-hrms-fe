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
      'report',
    ],
    admin: [
      'dashboard',
      'department',
      'employees',
      'teams',
      'attendance',
      'report',
    ],
    manager: ['teams', 'attendance', 'report'],
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
    if (label.includes('report')) return 'report';
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

  // Default visible unless explicitly restricted
  let visible = true;

  // --- Attendance submenu visibility rules ---
  if (parent.includes('attendance')) {
    // Hide "Reports" for everyone except system-admin
    if (sub === 'reports') {
      visible = false;
    }

    // Show new "Report" only for admin + manager
    if (sub === 'report') {
      visible = r === 'admin' || r === 'manager';
    }

    // Everyone else can see the other attendance options
  }

  // --- System-admin rules ---
  if (r === 'system-admin') {
    // Hide check-in/out sub item
    if (parent.includes('attendance') && sub === 'attendance') {
      visible = false;
    }
  }

  // --- Admin rules ---
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
  }

  // --- Manager rules ---
  if (r === 'manager') {
    // manager sees only attendance summary (Report), not Reports
    if (parent.includes('attendance') && sub === 'reports') {
      visible = false;
    }
  }

  // --- Employee/User rules ---
  if (r === 'employee' || r === 'user') {
    if (parent.includes('attendance')) {
      // Hide both Reports and Report for employees/users
      if (sub === 'reports' || sub === 'report') {
        visible = false;
      }
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
      'leaves',
      'AttendanceTable',
      'Reports',
      'attendance-summary',
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
      'attendance-summary',
    ]),
    manager: new Set([
      'AttendanceCheck',
      'AttendanceTable',
      // 'Reports',
      'AttendanceCheck/TimesheetLayout',
      'teams',
      'leaves',
      'UserProfile',
      'attendance-summary',
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
