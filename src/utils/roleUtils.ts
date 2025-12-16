// Utility functions for handling user roles consistently across the application

export interface RoleObject {
  name: string;
  id?: string;
  description?: string;
}

export type UserRole = string | RoleObject | undefined;

/**
 * Safely extracts the role name from a role value that could be a string or object
 * @param role - The role value (string, object with name property, or undefined)
 * @returns The role name as a string, or 'Unknown' if not found
 */
export const getRoleName = (role: UserRole): string => {
  if (typeof role === 'string') {
    return role;
  }
  if (role && typeof role === 'object' && 'name' in role) {
    return role.name;
  }
  return 'Unknown';
};

/**
 * Checks if a user has a specific role
 * @param role - The role value to check
 * @param targetRole - The role name to check against (case-insensitive)
 * @returns True if the user has the target role
 */
export const hasRole = (role: UserRole, targetRole: string): boolean => {
  const roleName = getRoleName(role);
  return roleName.toLowerCase() === targetRole.toLowerCase();
};

/**
 * Checks if a user is an admin
 * @param role - The role value to check
 * @returns True if the user is an admin
 */
export const isAdmin = (role: UserRole): boolean => {
  return hasRole(role, 'admin');
};

/**
 * Checks if a user is a system admin
 * @param role - The role value to check
 * @returns True if the user is a system admin
 */
export const isSystemAdmin = (role: UserRole): boolean => {
  return hasRole(role, 'system-admin') || hasRole(role, 'system_admin');
};

/**
 * Checks if a user is a network admin
 * @param role - The role value to check
 * @returns True if the user is a network admin
 */
export const isNetworkAdmin = (role: UserRole): boolean => {
  return hasRole(role, 'network-admin') || hasRole(role, 'network_admin');
};

/**
 * Checks if a user is an HR admin
 * @param role - The role value to check
 * @returns True if the user is an HR admin
 */
export const isHRAdmin = (role: UserRole): boolean => {
  return (
    hasRole(role, 'hr-admin') ||
    hasRole(role, 'hr_admin') ||
    hasRole(role, 'HR-Admin')
  );
};

/**
 * Checks if a user is a manager
 * @param role - The role value to check
 * @returns True if the user is a manager
 */
export const isManager = (role: UserRole): boolean => {
  return hasRole(role, 'manager');
};

/**
 * Checks if a user is an employee
 * @param role - The role value to check
 * @returns True if the user is an employee
 */
export const isEmployee = (role: UserRole): boolean => {
  return hasRole(role, 'employee');
};

/**
 * Checks if a user is a staff member
 * @param role - The role value to check
 * @returns True if the user is a staff member
 */
export const isStaff = (role: UserRole): boolean => {
  return hasRole(role, 'staff');
};

/**
 * Gets the display name for a role (for UI purposes)
 * @param role - The role value
 * @returns A user-friendly display name for the role
 */
export const getRoleDisplayName = (role: UserRole): string => {
  const roleName = getRoleName(role);
  switch (roleName.toLowerCase()) {
    case 'system-admin':
    case 'system_admin':
      return 'System Admin';
    case 'network-admin':
    case 'network_admin':
      return 'Network Admin';
    case 'hr-admin':
    case 'hr_admin':
    case 'HR-Admin':
      return 'HR Admin';
    case 'admin':
      return 'Admin';
    case 'manager':
      return 'Manager';
    case 'employee':
      return 'Employee';
    case 'staff':
      return 'Staff';
    case 'user':
      return 'User';
    default:
      return roleName;
  }
};

/**
 * Gets the color for a role (for UI purposes)
 * @param role - The role value
 * @returns A color string suitable for UI components
 */
export const getRoleColor = (
  role: UserRole
):
  | 'default'
  | 'primary'
  | 'secondary'
  | 'error'
  | 'info'
  | 'success'
  | 'warning' => {
  const roleName = getRoleName(role);
  switch (roleName.toLowerCase()) {
    case 'system-admin':
    case 'system_admin':
      return 'error';
    case 'network-admin':
    case 'network_admin':
      return 'error';
    case 'hr-admin':
    case 'hr_admin':
      return 'info';
    case 'admin':
      return 'error';
    case 'manager':
      return 'warning';
    case 'employee':
      return 'success';
    case 'staff':
      return 'info';
    case 'user':
      return 'primary';
    default:
      return 'default';
  }
};
