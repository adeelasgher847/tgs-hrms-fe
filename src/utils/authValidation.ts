import axiosInstance from '../api/axiosInstance';

export interface TokenValidationResult {
  isValid: boolean;
  user?: any;
  error?: string;
}

/**
 * Validates if the current token is still valid by making a test API call
 * This should be called on app startup and periodically
 */
export async function validateToken(): Promise<TokenValidationResult> {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return { isValid: false, error: 'No token found' };
    }

    // Make a lightweight API call to validate the token
    // Using the profile endpoint that actually exists
    const response = await axiosInstance.get('/profile/me');
    
    return {
      isValid: true,
      user: response.data.user || response.data,
    };
  } catch (error: any) {
    // If we get 401, 403, or any auth-related error, the token is invalid
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      console.warn('Token validation failed - authentication error:', error?.response?.status);
      return { 
        isValid: false, 
        error: 'Token is invalid or user has been deleted' 
      };
    }
    
    // For other errors (404, 500, network issues), we'll assume the token is still valid
    // This prevents network issues from logging out users
    console.warn('Token validation failed with non-auth error:', error?.response?.status, error?.message);
    return { 
      isValid: true, 
      error: 'Network error during validation' 
    };
  }
}

/**
 * Clears all authentication data from localStorage
 */
export function clearAuthData(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

/**
 * Redirects to login page and clears auth data
 */
export function forceLogout(): void {
  clearAuthData();
  window.location.href = '/';
}

/**
 * Checks if user should be logged out based on error response
 */
export function shouldLogout(error: any): boolean {
  if (!error?.response) return false;
  
  const status = error.response.status;
  const message = error.response.data?.message?.toLowerCase() || '';
  const url = error.config?.url || '';
  
  // Always logout on 401 (Unauthorized) - token is invalid
  if (status === 401) {
    return true;
  }
  
  // For 403 (Forbidden), be more selective - only logout for specific cases
  if (status === 403) {
    // Logout on specific error messages indicating user deletion or account issues
    if (message.includes('user not found') || 
        message.includes('user has been deleted') ||
        message.includes('invalid user') ||
        message.includes('user does not exist') ||
        message.includes('account disabled') ||
        message.includes('account suspended') ||
        message.includes('access denied') && message.includes('account')) {
      return true;
    }
    
    // Don't logout for permission-based 403 errors (like teams access for HR admin)
    // These are legitimate permission restrictions, not authentication failures
    return false;
  }
  
  return false;
}

/**
 * Sets up periodic token validation
 * Call this once when the app starts
 */
export function setupTokenValidation(intervalMinutes: number = 5): () => void {
  const interval = setInterval(async () => {
    const result = await validateToken();
    if (!result.isValid) {
      console.warn('Token validation failed, logging out user');
      forceLogout();
    }
  }, intervalMinutes * 60 * 1000);

  // Return cleanup function
  return () => clearInterval(interval);
}
