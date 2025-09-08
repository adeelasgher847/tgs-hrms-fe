// Authentication and role management utilities

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'user' | 'admin' | { id: string; name: string; description: string };
  tenant_id?: string;
}

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
  } catch (_error) {
    return null;
  }
};

export const isAdmin = (): boolean => {
  const user = getCurrentUser();
  if (!user) return false;

  // Handle both string and object role formats
  const roleName = typeof user.role === 'string' ? user.role : user.role?.name;
  const roleLc = (roleName || '').toLowerCase();
  const result =
    roleLc === 'admin' ||
    roleLc === 'system-admin' ||
    roleLc === 'system admin' ||
    roleLc === 'system_admin';

  return result;
};

export const isUser = (): boolean => {
  const user = getCurrentUser();
  if (!user) return false;

  // Handle both string and object role formats
  const roleName = typeof user.role === 'string' ? user.role : user.role?.name;
  const result =
    roleName === 'user' || roleName === 'User' || roleName === 'Employee';

  return result;
};

export const isManager = (): boolean => {
  const user = getCurrentUser();
  if (!user) return false;

  // Handle both string and object role formats
  const roleName = typeof user.role === 'string' ? user.role : user.role?.name;
  const result = roleName === 'manager' || roleName === 'Manager';

  return result;
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
