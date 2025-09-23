import axiosInstance from './axiosInstance';

export interface GoogleLoginRequest {
  idToken: string;
}

export interface GoogleLoginResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: {
      id: string;
      name: string;
    };
    tenant_id: string;
  };
  permissions?: string[];
  message?: string;
}

export const googleLoginService = {
  /**
   * Login with Google ID token
   * @param idToken - Google ID token from Google Sign-In
   * @returns Promise with login response
   */
  loginWithGoogle: async (idToken: string): Promise<GoogleLoginResponse> => {
    try {
      const response = await axiosInstance.post('/signup/google-init', {
        idToken
      });

      return response.data;
    } catch (error: any) {
      console.error('Google login error:', error);
      throw new Error(error.response?.data?.message || 'Google login failed');
    }
  }
};

export default googleLoginService; 