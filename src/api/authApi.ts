import axiosInstance from './axiosInstance';

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user?: Record<string, unknown>;
  permissions?: unknown[];
  employee?: { id?: string | number } | null;
  requiresPayment?: boolean;
  session_id?: string;
  signupSessionId?: string;
  company?: Record<string, unknown>;
}

export const authApi = {
  /**
   * Authenticate user credentials and retrieve auth tokens
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await axiosInstance.post('/auth/login', data);
    return response.data;
  },

  /**
   * Send password reset link to user's email
   * @param data - Email address for password reset
   * @returns Promise with message
   */
  forgotPassword: async (
    data: ForgotPasswordRequest
  ): Promise<AuthResponse> => {
    try {
      const response = await axiosInstance.post('/auth/forgot-password', data);
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response: { data: AuthResponse } };
        return apiError.response.data;
      }
      throw new Error('Failed to send password reset link');
    }
  },

  /**
   * Reset user password using reset token
   * @param data - Reset token, new password, and confirmation
   * @returns Promise with message
   */
  resetPassword: async (data: ResetPasswordRequest): Promise<AuthResponse> => {
    try {
      const response = await axiosInstance.post('/auth/reset-password', data);
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response: { data: AuthResponse } };
        return apiError.response.data;
      }
      throw new Error('Failed to reset password');
    }
  },
};

export default authApi;
