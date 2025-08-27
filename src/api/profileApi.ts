import axiosInstance from './axiosInstance';

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  profile_pic?: string | null;
  role: string;
  tenant: string;
  created_at: string;
  updated_at: string;
}

export interface ProfilePictureResponse {
  message: string;
  user: UserProfile;
}

class ProfileApiService {
  // Get user profile
  async getUserProfile(): Promise<UserProfile> {
    try {
      const response = await axiosInstance.get<UserProfile>('/profile/me');
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  // Upload profile picture
  async uploadProfilePicture(userId: string, file: File): Promise<ProfilePictureResponse> {
    try {
      // First, get the current authenticated user's profile to ensure we use the correct ID
      const currentProfile = await this.getUserProfile();
      
      // Use the authenticated user's ID instead of the passed userId
      const authenticatedUserId = currentProfile.id;
      
      const formData = new FormData();
      formData.append('profile_pic', file);

      const response = await axiosInstance.post<ProfilePictureResponse>(
        `/users/${authenticatedUserId}/profile-picture`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      throw error;
    }
  }

  // Remove profile picture
  async removeProfilePicture(userId: string): Promise<ProfilePictureResponse> {
    try {
      // First, get the current authenticated user's profile to ensure we use the correct ID
      const currentProfile = await this.getUserProfile();
      
      // Use the authenticated user's ID instead of the passed userId
      const authenticatedUserId = currentProfile.id;
      
      const response = await axiosInstance.delete<ProfilePictureResponse>(
        `/users/${authenticatedUserId}/profile-picture`
      );
      return response.data;
    } catch (error) {
      console.error('Error removing profile picture:', error);
      throw error;
    }
  }
}

export const profileApiService = new ProfileApiService();
export default profileApiService;

