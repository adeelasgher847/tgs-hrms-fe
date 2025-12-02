export type NormalizedRole =
  | 'system-admin'
  | 'network-admin'
  | 'hr-admin'
  | 'admin'
  | 'manager'
  | 'employee'
  | 'user'
  | 'unknown';

const ALL_ROLES: NormalizedRole[] = [
  'system-admin',
  'network-admin',
  'hr-admin',
  'admin',
  'manager',
  'employee',
  'user',
  'unknown',
];

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

const ROLE_MENU_ALLOWLIST: Record<NormalizedRole, readonly string[]> = {
    'system-admin': [
      'dashboard',
      'tenant',
      'department',
      'employees',
      'teams',
      'assets',
      'attendance',
      'benefits',
      'leave-analytics',
      'report',
      'audit logs',
      'performance',
      'payroll',
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
      'department',
      'teams',
      'assets',
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
      'leave-analytics',
      'payroll',
      'benefits',
    ],
    manager: [
      'teams',
      'attendance',
      'assets',
      'report',
      'leave-analytics',
      'payroll',
      'benefits',
    ],
  employee: ['attendance', 'assets', 'benefits', 'leave-analytics', 'payroll'],
    user: ['attendance', 'assets', 'benefits', 'payroll'],
    unknown: ['benefits'],
  };

const normalizeLabel = (value: string) => (value || '').toLowerCase().trim();

const MENU_KEY_MATCHERS: Array<{ key: string; patterns: string[] }> = [
  { key: 'dashboard', patterns: ['dashboard'] },
  { key: 'tenant', patterns: ['tenant'] },
  { key: 'department', patterns: ['department'] },
  { key: 'employees', patterns: ['employee'] },
  { key: 'teams', patterns: ['team'] },
  { key: 'assets', patterns: ['asset'] },
  { key: 'benefits', patterns: ['benefit'] },
  { key: 'attendance', patterns: ['attendance'] },
  { key: 'leave-analytics', patterns: ['leave analytics', 'leave-analytics'] },
  { key: 'report', patterns: ['report'] },
  { key: 'audit logs', patterns: ['audit logs'] },
  { key: 'performance', patterns: ['performance'] },
  { key: 'payroll', patterns: ['payroll'] },
];

const getMenuKey = (label: string) => {
  const normalized = normalizeLabel(label).replace(/\s+/g, '');
  for (const matcher of MENU_KEY_MATCHERS) {
    if (
      matcher.patterns.some(pattern =>
        normalized.includes(pattern.replace(/\s+/g, ''))
      )
    ) {
      return matcher.key;
    }
  }
  return 'misc';
};

type ParentKey =
  | 'attendance'
  | 'benefits'
  | 'department'
  | 'leave-analytics'
  | 'payroll'
  | 'assets'
  | 'employees'
  | 'audit logs'
  | 'misc';

const PARENT_KEY_MATCHERS: Array<{ key: ParentKey; patterns: string[] }> = [
  { key: 'attendance', patterns: ['attendance'] },
  { key: 'benefits', patterns: ['benefit'] },
  { key: 'department', patterns: ['department'] },
  { key: 'leave-analytics', patterns: ['leave analytics', 'leave-analytics'] },
  { key: 'payroll', patterns: ['payroll'] },
  { key: 'assets', patterns: ['asset'] },
  { key: 'employees', patterns: ['employee'] },
  { key: 'audit logs', patterns: ['audit logs'] },
];

const getParentKey = (label: string): ParentKey => {
  const normalized = normalizeLabel(label);
  for (const matcher of PARENT_KEY_MATCHERS) {
    if (matcher.patterns.some(pattern => normalized.includes(pattern))) {
      return matcher.key;
    }
  }
    return 'misc';
};

type SubmenuPolicy = {
  allowOnly?: readonly string[];
  deny?: readonly string[];
  denyAll?: boolean;
};

const ROLE_SUBMENU_POLICIES: Record<
  NormalizedRole,
  Partial<Record<ParentKey, SubmenuPolicy>>
> = {
  'system-admin': {
    department: { deny: ['user list', 'policies', 'holidays'] },
    benefits: { allowOnly: ['benefits report'] },
    'leave-analytics': { deny: ['report'] },
    attendance: { deny: ['leave request'] },
    payroll: { allowOnly: ['payroll reports'] },
    assets: { allowOnly: ['assets overview'] },
    employees: { deny: ['employee list'] },
  },
  'network-admin': {
    employees: { deny: ['tenant employees'] },
    department: { deny: ['user list', 'policies', 'holidays'] },
    attendance: { deny: ['reports', 'leave request'] },
    benefits: { deny: ['benefits report', 'benefit details'] },
    'audit logs': { denyAll: true },
    assets: { deny: ['asset requests', 'assets overview'] },
  },
  'hr-admin': {
    employees: { deny: ['tenant employees'] },
    attendance: { deny: ['reports'] },
    'audit logs': { denyAll: true },
    payroll: { deny: ['payroll reports', 'my salary'] },
    department: { allowOnly: ['designation'] },
    assets: { deny: ['assets overview', 'asset requests'] },
    benefits: { deny: ['benefits report', 'benefit details'] },
    'leave-analytics': { deny: ['cross tenant leaves'] },
  },
  admin: {
    employees: { deny: ['tenant employees'] },
    department: { deny: ['user list', 'policies', 'holidays'] },
    'leave-analytics': { deny: ['cross tenant leaves'] },
    attendance: { deny: ['reports'] },
    'audit logs': { denyAll: true },
    benefits: { deny: ['benefits report', 'benefit details'] },
    payroll: { deny: ['payroll reports', 'my salary'] },
    assets: { deny: ['assets overview', 'asset requests'] },
  },
  manager: {
    employees: { deny: ['tenant employees'] },
    attendance: { deny: ['reports', 'report'] },
    'audit logs': { denyAll: true },
    payroll: { allowOnly: ['my salary'] },
    assets: { deny: ['assets overview', 'asset inventory', 'management'] },
    benefits: { allowOnly: ['benefit details'] },
    'leave-analytics': { deny: ['cross tenant leaves'] },
  },
  employee: {
    employees: { deny: ['tenant employees'] },
    attendance: { deny: ['report'] },
    assets: { deny: ['asset inventory', 'management', 'assets overview'] },
    benefits: { allowOnly: ['benefit details'] },
    'leave-analytics': { allowOnly: ['report'] },
    'audit logs': { denyAll: true },
    payroll: { allowOnly: ['my salary'] },
  },
  user: {
    employees: { deny: ['tenant employees'] },
    attendance: { deny: ['report'] },
    assets: { deny: ['asset inventory', 'management', 'assets overview'] },
    benefits: { allowOnly: ['benefit details'] },
    'leave-analytics': { allowOnly: ['report'] },
    'audit logs': { denyAll: true },
    payroll: { allowOnly: ['my salary'] },
  },
  unknown: {},
};

const matchesPattern = (value: string, patterns?: readonly string[]) =>
  patterns?.some(pattern => value.includes(pattern)) ?? false;

export const isMenuVisibleForRole = (
  menuLabel: string,
  role?: string
): boolean => {
  const r = normalizeRole(role);
  const allowed = ROLE_MENU_ALLOWLIST[r] ?? [];
  return allowed.includes(getMenuKey(menuLabel));
};

export const isSubMenuVisibleForRole = (
  parentMenuLabel: string,
  subLabel: string,
  role?: string
) => {
  const r = normalizeRole(role);
  const parentKey = getParentKey(parentMenuLabel);
  const subKey = normalizeLabel(subLabel);

  if (subKey === 'report') {
    return r === 'admin';
  }

  if (parentKey === 'assets' && subKey.includes('system assets overview')) {
    return r === 'system-admin';
  }

  const policy = ROLE_SUBMENU_POLICIES[r]?.[parentKey];
  if (!policy) return true;
  if (policy.denyAll) return false;
  if (policy.allowOnly) {
    return matchesPattern(subKey, policy.allowOnly);
  }
  if (matchesPattern(subKey, policy.deny)) {
    return false;
  }
  return true;
};

const DASHBOARD_ALLOWLIST_ENTRIES: Record<NormalizedRole, readonly string[]> = {
  'system-admin': [
      '',
      'tenant',
      'departments',
      'Designations',
      'EmployeeManager',
      'UserProfile',
      'AttendanceCheck',
      'AttendanceTable',
      'attendance-summary',
      'AttendanceCheck/TimesheetLayout',
      'CrossTenantLeaveManagement',
      'teams',
      'assets/system-admin',
      'EmployeeProfileView',
      'settings',
      'benefits',
      'benefits/assign',
      'benefits/reporting',
      'my-benefits',
      'cross-tenant-leaves',
      'audit-logs',
      'TenantEmployees',
      'performance-dashboard',
      'payroll-reports',
      'benefit-report',
  ],
  'network-admin': [
      '',
      'departments',
      'Designations',
      'EmployeeManager',
      'UserList',
      'UserProfile',
      'AttendanceCheck',
      'AttendanceTable',
      'AttendanceCheck/TimesheetLayout',
      'teams',
      'assets',
      'assets/request-management',
      'EmployeeProfileView',
      'attendance-summary',
      'settings',
      'benefits-list',
      'employee-benefit',
  ],
  'hr-admin': [
    '',
      'Designations',
      'AttendanceCheck',
      'AttendanceTable',
      'AttendanceCheck/TimesheetLayout',
      'UserProfile',
      'assets',
      'assets/request-management',
      'settings',
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
      'payroll-records',
      'employee-salary',
  ],
  admin: [
      '',
      'departments',
      'Designations',
      'EmployeeManager',
      'UserList',
      'UserProfile',
      'leaves',
      'CrossTenantLeaveManagement',
      'cross-tenant-leaves',
      'AttendanceCheck',
      'AttendanceTable',
      'AttendanceCheck/TimesheetLayout',
      'Reports',
      'teams',
      'assets',
      'assets/request-management',
      'EmployeeProfileView',
      'attendance-summary',
      'settings',
      'benefits',
      'benefits/assign',
      'benefits/reporting',
      'my-benefits',
      'benefits-list',
      'employee-benefit',
      'payroll-configuration',
      'payroll-records',
      'employee-salary',
  ],
  manager: [
      'AttendanceCheck',
      'AttendanceTable',
      'Reports',
      'AttendanceCheck/TimesheetLayout',
      'teams',
      'leaves',
      'UserProfile',
      'assets/requests',
      'attendance-summary',
      'settings',
      'benefits',
      'benefits/assign',
      'benefits/reporting',
      'my-benefits',
      'benefit-details',
      'employee-salary',
      'my-salary',
  ],
  employee: [
      'AttendanceCheck',
      'AttendanceTable',
      'Reports',
      'AttendanceCheck/TimesheetLayout',
      'leaves',
      'UserProfile',
      'assets/requests',
      'settings',
      'benefit-details',
      'my-salary',
  ],
  user: [
      'AttendanceCheck',
      'AttendanceTable',
      'AttendanceCheck/TimesheetLayout',
      'leaves',
      'UserProfile',
      'assets/requests',
      'settings',
      'benefits',
      'benefits/assign',
      'benefits/reporting',
      'my-benefits',
      'my-salary',
  ],
  unknown: [],
};

const DASHBOARD_ALLOWLIST: Record<NormalizedRole, Set<string>> = Object.entries(
  DASHBOARD_ALLOWLIST_ENTRIES
).reduce(
  (acc, [role, paths]) => {
    acc[role as NormalizedRole] = new Set(paths);
    return acc;
  },
  {} as Record<NormalizedRole, Set<string>>
);

export const isDashboardPathAllowedForRole = (
  pathAfterDashboard: string,
  role?: string
): boolean => {
  const r = normalizeRole(role);
  const normalizedPath = (pathAfterDashboard || '').replace(/^\/+|\/+$/g, '');
  return DASHBOARD_ALLOWLIST[r].has(normalizedPath);
};
