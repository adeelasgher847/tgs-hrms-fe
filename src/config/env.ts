import type {
  NormalizedRole,
  ParentKey,
  SubmenuPolicy,
} from '../utils/permissions';

export const REQUIRED_ENV_VARS = [
  'VITE_GOOGLE_CLIENT_ID',
  'VITE_API_BASE_URL',
] as const;

type RequiredEnvKey = (typeof REQUIRED_ENV_VARS)[number];

const rawEnv = import.meta.env as unknown as Record<string, string | undefined>;

function getEnvVar(key: RequiredEnvKey): string {
  const value = rawEnv[key];
  if (!value) {
    const message = `Missing required environment variable: ${key}`;
    // Fail fast if required environment variables are missing
    throw new Error(message);
  }

  return value;
}

export const env = {
  googleClientId: getEnvVar('VITE_GOOGLE_CLIENT_ID'),
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL'),
};
export const ROLE_SUBMENU_POLICIES: Record<
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
    performance: { allowOnly: ['employee performance'] },
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
