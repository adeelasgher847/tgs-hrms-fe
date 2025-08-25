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

export const authApi = {
  /**
   * Send password reset link to user's email
   * @param data - Email address for password reset
   * @returns Promise with response message
   */
  forgotPassword: async (data: ForgotPasswordRequest): Promise<AuthResponse> => {
    try {
      const response = await axiosInstance.post('/auth/forgot-password', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw new Error('Failed to send password reset link');
    }
  },

  /**
   * Reset user password using reset token
   * @param data - Reset token, new password, and confirmation
   * @returns Promise with response message
   */
  resetPassword: async (data: ResetPasswordRequest): Promise<AuthResponse> => {
    try {
      const response = await axiosInstance.post('/auth/reset-password', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw new Error('Failed to reset password');
    }
  },
};

export default authApi; 