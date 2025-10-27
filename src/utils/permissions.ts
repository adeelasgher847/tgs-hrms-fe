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

  const allowedByRole: Record<NormalizedRole, string[]> = {
    'system-admin': [
      'dashboard',
      'tenant',
      'department',
      'employees',
      'teams',
      'assets',
      'attendance',
      // 'benefits',
      'leave-analytics',
      'report',
    ],
    'network-admin': [
      'dashboard',
      'department',
      'employees',
      'teams',
      'assets',
      'attendance',
      'benefits',
    ],
    'hr-admin': ['attendance', 'teams', 'benefits', 'leave-analytics'],
    admin: [
      'dashboard',
      'department',
      'employees',
      'teams',
      'assets',
      'attendance',
      'report',
    ],
    manager: ['teams', 'attendance', 'assets', 'report', 'leave-analytics'],
    employee: ['attendance', 'assets', 'benefits', 'leave-analytics',],
    user: ['attendance', 'assets', 'benefits'],
    unknown: ['benefits'], // Temporarily allow benefits for unknown roles
  };

  // map synonyms from current sidebar to requirement naming
  const normalizedMenuKey = (() => {
    if (label.includes('dashboard')) return 'dashboard';
    if (label.includes('tenant')) return 'tenant';
    if (label.includes('department')) return 'department';
    if (label.includes('employee')) return 'employees';
    if (label.includes('team')) return 'teams';
    if (label.includes('asset')) return 'assets';
    if (label.includes('benefit')) return 'benefits';
    if (label.includes('attendance')) return 'attendance';
    if (label.includes('leaveanalytics') || label.includes('leaveanalytics'))
      return 'leave-analytics';
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
    if (parent.includes('benefits')) {
      if (!sub.includes('benefits report')) {
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
  }

  // --- Employee/User rules ---
  if (r === 'employee' || r === 'user') {
    if (parent.includes('attendance')) {
      // Hide both Reports and Report for employees/users
      if ( sub === 'report') {
        visible = false;
      }
    }
  }

  // --- Employee/User rules ---
  if (r === 'employee' || r === 'user') {
    if (parent.includes('attendance')) {
      // Hide both Reports and Report for employees/users
      if (sub === 'report') {
        visible = false;
      }
    }
    // For Assets menu - employees only see Asset Requests
    if (parent.includes('assets')) {
      if (sub.includes('asset inventory') || sub.includes('management')) {
        visible = false;
      }
    }
    if (parent.includes('benefits')) {
      if (!sub.includes('benefit details')) {
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
    if (parent.includes('benefits')) {
      if (sub.includes('benefits report') || sub.includes('benefit details')) {
        visible = false;
      }
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
      // Benefits
      'benefits',
      'benefits/assign',
      'benefits/reporting',
      'my-benefits',
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
      'benefit-report',
    ]),
    'hr-admin': new Set([
      '', // Allow main dashboard
      'AttendanceCheck',
      'AttendanceTable',
      'AttendanceCheck/TimesheetLayout',
      'UserProfile',
      // Assets - HR admin has no access
      'settings',
      // Benefits
      'benefits',
      'benefits/assign',
      'benefits/reporting',
      'my-benefits',
      'teams',
      'leaves',
      'Reports',
      'benefits-list',
      'employee-benefit',
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
      // Benefits
      'benefits',
      'benefits/assign',
      'benefits/reporting',
      'my-benefits',
    ]),
    manager: new Set([
      'AttendanceCheck',
      'AttendanceTable',
      'Reports',
      'AttendanceCheck/TimesheetLayout',
      'teams',
      'leaves',
      'UserProfile',
      // Assets - Manager sees only Requests
      'assets/requests',
      'attendance-summary',
      // Settings
      'settings',
      // Benefits
      'benefits',
      'benefits/assign',
      'benefits/reporting',
      'my-benefits',
    ]),
    employee: new Set([
      'AttendanceCheck',
      'AttendanceTable',
      'Reports',
      'AttendanceCheck/TimesheetLayout',
      'leaves',
      'UserProfile',
      // Assets - Employee sees only Requests
      'assets/requests',
      // Settings
      'settings',
      'benefit-details',
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
      // Benefits
      'benefits',
      'benefits/assign',
      'benefits/reporting',
      'my-benefits',
    ]),
    unknown: new Set<string>(),
  };

  return allowlists[r].has(p);
};
