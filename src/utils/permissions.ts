export type NormalizedRole =
  | 'system-admin'
  | 'network-admin'
  | 'hr-admin'
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
  if (r === 'network-admin' || r === 'network_admin' || r === 'network admin')
    return 'network-admin';
  if (r === 'hr-admin' || r === 'hr_admin' || r === 'hr admin')
    return 'hr-admin';
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
    case 'network-admin':
      return '/dashboard'; // Network admin dashboard
    case 'hr-admin':
      return '/dashboard/AttendanceCheck'; // HR admin dashboard
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
  const label = (menuLabel || '').toLowerCase().replace(/\s+/g, '').trim();

  // Map sidebar menu names to permission keys
  const normalizedMenuKey = (() => {
    if (label.includes('dashboard')) return 'dashboard';
    if (label.includes('tenant')) return 'tenant';
    if (label.includes('department')) return 'department';
    if (label.includes('employee')) return 'employees';
    if (label.includes('team')) return 'teams';
    if (label.includes('attendance')) return 'attendance';
    if (label.includes('report')) return 'report';
    return 'misc'; 
  })();

  const allowedByRole: Record<NormalizedRole, string[]> = {
    'system-admin': [
      'dashboard',
      'tenant',
      'department',
      'employees',
      'teams',
      'assets',
      'attendance',
      'report',
    ],
    'network-admin': [
      'dashboard',
      'department',
      'employees',
      'teams',
      'assets',
      'attendance',
      'report',
    ],
    'hr-admin': ['attendance', 'teams'],
    admin: ['dashboard', 'department', 'employees', 'teams', 'assets', 'attendance', 'report'],
    manager: ['teams', 'attendance', 'assets', 'report'],
    employee: ['attendance', 'assets'],
    user: ['attendance', 'assets'],
    unknown: [],
  };

  // map synonyms from current sidebar to requirement naming
  const normalizedMenuKey = (() => {
    if (label.includes('dashboard')) return 'dashboard';
    if (label.includes('tenant')) return 'tenant';
    if (label.includes('department')) return 'department';
    if (label.includes('employee')) return 'employees';
    if (label.includes('team')) return 'teams';
    if (label.includes('asset')) return 'assets';
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

  // System-admin: hide Department -> (User List, Policies, Holidays); Attendance -> Reports

  if (r === 'system-admin') {
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
      // hide Reports for system-admin
      if (sub.includes('reports')) {
        visible = false;
      }
    }
  }

  // Show new "Report" only for admin + manager
  if (sub === 'report') {
    visible = r === 'admin' || r === 'manager';
  }

  // Network-admin: same as admin - hide Department -> (User List, Policies, Holidays); Attendance -> Reports only
  if (r === 'network-admin') {
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
      // hide only Reports for network-admin, but keep Attendance and Attendance Table visible
      if (sub.includes('reports')) {
        visible = false;
      }
    }
  }

  // HR-admin: hide Attendance -> Reports and Leave Request
  if (r === 'hr-admin') {
    if (parent.includes('attendance')) {
      if (sub.includes('reports') || sub.includes('leave request')) {
        visible = false;
      }
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
    if (parent.includes('attendance') && sub === 'reports') {
      visible = false;
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
    // For Assets menu - employees only see Asset Requests
    if (parent.includes('assets')) {
      if (sub.includes('asset inventory') || sub.includes('management')) {
        visible = false;
      }
    }
  }

  // Network Admin: For Assets menu - only see Asset Inventory and Management (not Asset Requests)
  if (r === 'network-admin') {
    if (parent.includes('assets')) {
      if (sub.includes('asset requests')) {
        visible = false;
      }
    }
  }

  // System Admin: For Assets menu - only see Asset Inventory and Management (not Asset Requests)
  if (r === 'system-admin') {
    if (parent.includes('assets')) {
      if (sub.includes('asset requests')) {
        visible = false;
      }
    }
  }

  // HR Admin: hide all asset submenus
  if (r === 'hr-admin') {
    if (parent.includes('assets')) {
      visible = false;
    }
  }

  // Admin: For Assets menu - only see Asset Inventory and Management (not Asset Requests)
  if (r === 'admin') {
    if (parent.includes('assets')) {
      if (sub.includes('asset requests')) {
        visible = false;
      }
    }
  }

  // Manager: For Assets menu - only see Asset Requests
  if (r === 'manager') {
    if (parent.includes('assets')) {
      if (sub.includes('asset inventory') || sub.includes('management')) {
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
    return (
      r === 'admin' ||
      r === 'system-admin' ||
      r === 'network-admin' ||
      r === 'hr-admin'
    );
  }

  const allowlists: Record<NormalizedRole, Set<string>> = {
    'system-admin': new Set([
      // Core
      '',
      'tenant',
      'departments',
      'Designations',
      'EmployeeManager',
      'UserProfile',
      'leaves',
      'AttendanceCheck',
      'AttendanceTable',
      'Reports',
      'attendance-summary',
      'AttendanceCheck/TimesheetLayout',
      'AttendanceCheck/TimesheetLayout',
      // Teams
      'teams',
      // Assets - System admin sees Inventory and Management only
      'assets',
      'assets/request-management',
      // Employee profile view
      'EmployeeProfileView',
      // Settings
      'settings',
    ]),
    'network-admin': new Set([
      '',
      'departments',
      'Designations',
      'EmployeeManager',
      'UserList',
      'UserProfile',
      // 'policies', 'holidays',
      'leaves',
      // Attendance - Allow AttendanceCheck for network-admin
      'AttendanceCheck',
      'AttendanceTable',
      'AttendanceCheck/TimesheetLayout',
      // 'Reports',
      'teams',
      // Assets - Network admin sees Inventory and Management only
      'assets',
      'assets/request-management',
      'EmployeeProfileView',
      'attendance-summary',
      // Settings
      'settings',
    ]),
    'hr-admin': new Set([
      '', // Allow main dashboard
      'AttendanceCheck',
      'AttendanceTable',
      'AttendanceCheck/TimesheetLayout',
      'UserProfile',
      // Assets - HR admin has no access
      'settings',
      'teams',
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
      // Assets - Admin sees Inventory and Management only
      'assets',
      'assets/request-management',
      'EmployeeProfileView',
      'attendance-summary',
      // Settings
      'settings',
    ]),
    manager: new Set([
      'AttendanceCheck',
      'AttendanceTable',
      // 'Reports',
      'AttendanceCheck/TimesheetLayout',
      'teams',
      'leaves',
      'UserProfile',
      // Assets - Manager sees only Requests
      'assets/requests',
      'attendance-summary',
      // Settings
      'settings',
    ]),
    employee: new Set([
      'AttendanceCheck',
      'AttendanceTable',
      // 'Reports',
      'AttendanceCheck/TimesheetLayout',
      'leaves',
      'UserProfile',
      // Assets - Employee sees only Requests
      'assets/requests',
      // Settings
      'settings',
    ]),
    user: new Set([
      'AttendanceCheck',
      'AttendanceTable',
      // 'Reports',
      'AttendanceCheck/TimesheetLayout',
      'leaves',
      'UserProfile',
      // Assets - User sees only Requests
      'assets/requests',
      // Settings
      'settings',
    ]),
    unknown: new Set<string>(),
  };

  return allowlists[r].has(p);
};
