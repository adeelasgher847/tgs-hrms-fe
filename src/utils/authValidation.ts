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
    // Using a simple profile endpoint that requires authentication
    const response = await axiosInstance.get('/auth/validate-token');
    
    return {
      isValid: true,
      user: response.data.user || response.data,
    };
  } catch (error: any) {
    // If we get 401, 403, or any auth-related error, the token is invalid
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      return { 
        isValid: false, 
        error: 'Token is invalid or user has been deleted' 
      };
    }
    
    // For other errors, we'll assume the token is still valid
    // This prevents network issues from logging out users
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
  
  // Logout on authentication errors
  if (status === 401 || status === 403) {
    return true;
  }
  
  // Logout on specific error messages indicating user deletion
  if (message.includes('user not found') || 
      message.includes('user has been deleted') ||
      message.includes('invalid user') ||
      message.includes('user does not exist')) {
    return true;
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
