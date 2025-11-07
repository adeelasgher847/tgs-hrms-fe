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

export const getDefaultDashboardRoute = (role?: string): string => {
  const r = normalizeRole(role);
  switch (r) {
    case 'system-admin':
      return '/dashboard';
    case 'network-admin':
      return '/dashboard';
    case 'hr-admin':
      return '/dashboard/AttendanceCheck';
    case 'admin':
      return '/dashboard';
    case 'manager':
      return '/dashboard/teams';
    case 'employee':
    case 'user':
      return '/dashboard/AttendanceCheck';
    default:
      return '/dashboard';
  }
};

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
      'audit logs',
      'performance',
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
    'hr-admin': [
      'attendance',
      'teams',
      'benefits',
      'leave-analytics',
      'payroll',
    ],
    admin: [
      'dashboard',
      'department',
      'employees',
      'teams',
      'assets',
      'attendance',
      'report',
      'payroll',
      'benefits',
    ],
    manager: ['teams', 'attendance', 'assets', 'report', 'leave-analytics'],
    employee: ['attendance', 'assets', 'benefits', 'leave-analytics'],
    user: ['attendance', 'assets', 'benefits'],
    unknown: ['benefits'],
  };

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
    if (label.includes('benefits')) return 'benefits';
    if (label.includes('auditlogs')) return 'audit logs';
    if (label.includes('performance')) return 'performance';
    if (label.includes('payroll')) return 'payroll';
    return 'misc';
  })();

  const allowed = allowedByRole[r] ?? [];
  return allowed.includes(normalizedMenuKey);
};

export const isSubMenuVisibleForRole = (
  parentMenuLabel: string,
  subLabel: string,
  role?: string
): boolean => {
  const r = normalizeRole(role);
  const parent = parentMenuLabel.trim().toLowerCase();
  const sub = subLabel.trim().toLowerCase();

  let visible = true;

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

    if (
      parent.includes('leave analytics') ||
      parent.includes('leave-analytics')
    ) {
      if (sub.includes('report')) {
        visible = false;
      }
    }
    if (parent.includes('attendance')) {
      if (sub.includes('leave request')) {
        visible = false;
      }
    }
  }

  if (sub === 'report') {
    visible = r === 'admin' || r === 'manager';
  }

  if (r === 'network-admin') {
    if (parent.includes('employees')) {
      if (sub.includes('tenant employees')) {
        visible = false;
      }
    }
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
      if (sub.includes('reports')) {
        visible = false;
      }
    }
    if (parent.includes('benefits')) {
      if (!sub.includes('benefits report')) {
        visible = false;
      }
    }
    if (parent.includes('audit logs')) {
      visible = false;
    }
  }

  if (r === 'hr-admin') {
    if (parent.includes('employees')) {
      if (sub.includes('tenant employees')) {
        visible = false;
      }
    }
    if (parent.includes('attendance')) {
      if (sub.includes('reports')) {
        visible = false;
      }
    }
    if (parent.includes('audit logs')) {
      visible = false;
    }
  }

  if (r === 'admin') {
    if (parent.includes('employees')) {
      if (sub.includes('tenant employees')) {
        visible = false;
      }
    }
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
    if (parent.includes('audit logs')) {
      visible = false;
    }
    if (parent.includes('benefits')) {
      if (sub.includes('benefits report') || sub.includes('benefit details')) {
        visible = false;
      }
    }
  }

  // --- Manager rules ---
  if (r === 'manager') {
    if (parent.includes('employees')) {
      if (sub.includes('tenant employees')) {
        visible = false;
      }
    }
    // manager sees only attendance summary (Report), not Reports
    if (parent.includes('attendance') && sub === 'reports') {
      visible = false;
    }
    if (parent.includes('audit logs')) {
      visible = false;
    }
  }

  if (r === 'employee' || r === 'user') {
    if (parent.includes('employees')) {
      if (sub.includes('tenant employees')) {
        visible = false;
      }
    }
    if (parent.includes('attendance')) {
      if (sub === 'report') {
        visible = false;
      }
    }
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
    if (
      parent.includes('leave analytics') ||
      parent.includes('leave-analytics')
    ) {
      if (sub.includes('cross-tenant-leaves')) {
        visible = false;
      }
    }

    if (parent.includes('audit logs')) {
      visible = false;
    }
  }
  if (parent.includes('payroll') && !(r === 'hr-admin' || r === 'admin')) {
    visible = false;
  }

  // System Admin: For Assets menu - only see System Assets Overview (hide all other asset pages)
  if (r === 'system-admin') {
    if (parent.includes('assets')) {
      // Hide all asset submenus except System Assets Overview
      if (
        sub.includes('asset inventory') ||
        sub.includes('asset requests') ||
        sub.includes('management')
      ) {
        visible = false;
      }
      // Only system-admin sees System Assets Overview
      if (sub.includes('system assets overview')) {
        visible = true;
      }
      if (parent.includes('payroll')) {
        if (sub.includes('payroll-configuration')) {
          visible = false;
        }
        // Manager can view employee salary
        if (sub.includes('employee-salary')) {
          visible = true;
        }
      }
    }
    if (parent.includes('employees')) {
      if (sub.includes('employee list')) {
        visible = false;
      }
    }
  } else {
    // Hide System Assets Overview for non-system-admin roles
    if (parent.includes('assets') && sub.includes('system assets overview')) {
      visible = false;
    }
  }

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

  if (r === 'admin') {
    if (parent.includes('assets')) {
      if (sub.includes('asset requests')) {
        visible = false;
      }
    }
  }

  if (r === 'manager') {
    if (parent.includes('assets')) {
      if (sub.includes('asset inventory') || sub.includes('management')) {
        visible = false;
      }
    }
  }

  return visible;
};

export const isDashboardPathAllowedForRole = (
  pathAfterDashboard: string,
  role?: string
): boolean => {
  const r = normalizeRole(role);
  const p = (pathAfterDashboard || '').replace(/^\/+|\/+$/g, '');

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
      'AttendanceCheck',
      'AttendanceTable',
      // 'Reports',
      'attendance-summary',
      'AttendanceCheck/TimesheetLayout',
      'AttendanceCheck/TimesheetLayout',
      'CrossTenantLeaveManagement',
      // Teams
      'teams',
      // Assets - System admin only sees System Assets Overview
      'assets/system-admin',
      // Employee profile view
      'EmployeeProfileView',
      // Settings
      'settings',
      // Benefits
      'benefits',
      'benefits/assign',
      'benefits/reporting',
      'my-benefits',
      'cross-tenant-leaves',
      'audit-logs',
      'TenantEmployees',
      'audit-logs',
      'performance-dashboard',
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
      'payroll-configuration',
      'employee-salary',
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
      'payroll-configuration',
      'employee-salary',
      'benefits-list',
      'employee-benefit',
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
