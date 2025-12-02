// Authentication and role management utilities

import {
  getRoleName,
  isAdmin as roleIsAdmin,
  isHRAdmin as roleIsHRAdmin,
  isManager as roleIsManager,
  isNetworkAdmin as roleIsNetworkAdmin,
  isSystemAdmin as roleIsSystemAdmin,
} from './roleUtils';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role:
    | 'user'
    | 'admin'
    | 'system-admin'
    | 'network-admin'
    | 'hr-admin'
    | 'hr admin'
    | 'HR-Admin'
    | { id: string; name: string; description: string };
  tenant_id?: string;
}

const getCurrentRole = () =>
  (getCurrentUser()?.role ?? undefined) as Parameters<typeof roleIsAdmin>[0];

export const getCurrentUser = (): User | null => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);

      // Validate user data
      if (!user.role) {
        return null;
      }

      return user;
    }
    return null;
  } catch {
    return null;
  }
};

export const isAdmin = (): boolean => {
  const role = getCurrentRole();
  if (!role) return false;
  return (
    roleIsAdmin(role) ||
    roleIsSystemAdmin(role) ||
    roleIsNetworkAdmin(role) ||
    roleIsHRAdmin(role)
  );
};

export const isUser = (): boolean => {
  const role = getCurrentRole();
  if (!role) return false;
  const roleName = getRoleName(role).toLowerCase();
  return roleName === 'user' || roleName === 'employee';
};

export const isManager = (): boolean => {
  const role = getCurrentRole();
  if (!role) return false;
  return roleIsManager(role);
};

/**
 * Checks if a user is a system admin
 * @returns True if the user is a system admin
 */
export const isSystemAdmin = (): boolean => {
  const role = getCurrentRole();
  if (!role) return false;
  return roleIsSystemAdmin(role);
};

/**
 * Checks if a user is a network admin
 * @returns True if the user is a network admin
 */
export const isNetworkAdmin = (): boolean => {
  const role = getCurrentRole();
  if (!role) return false;
  return roleIsNetworkAdmin(role);
};

/**
 * Checks if a user is an HR admin
 * @returns True if the user is an HR admin
 */
export const isHRAdmin = (): boolean => {
  const role = getCurrentRole();
  if (!role) return false;
  return roleIsHRAdmin(role);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

export const getUserName = (): string => {
  const user = getCurrentUser();
  if (user) {
    const name = `${user.first_name} ${user.last_name}`.trim();
    return name;
  }
  return 'Current User';
};

export const getUserRole = (): string => {
  const user = getCurrentUser();
  if (!user) return 'unknown';

  // Handle both string and object role formats
  const roleName = typeof user.role === 'string' ? user.role : user.role?.name;
  return roleName || 'unknown';
};
