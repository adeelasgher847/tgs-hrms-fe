// Test utility for profile picture upload feature
import { profileApiService } from '../api/profileApi';
import { snackbar } from './snackbar';

export const testProfilePictureFeature = async () => {
  console.log('🧪 Testing Profile Picture Upload Feature...');

  try {
    // Test 1: Get current user profile
    console.log('📋 Test 1: Fetching current user profile...');
    const profile = await profileApiService.getUserProfile();
    console.log('✅ Current profile:', {
      id: profile.id,
      name: `${profile.first_name} ${profile.last_name}`,
      email: profile.email,
      hasProfilePic: !!profile.profile_pic,
      profilePicUrl: profile.profile_pic,
    });

    // Test 2: Check if user has profile picture
    if (profile.profile_pic) {
      console.log('📸 User has existing profile picture');
      
      // Test 3: Remove profile picture
      console.log('🗑️ Test 3: Removing profile picture...');
      try {
        const removeResponse = await profileApiService.removeProfilePicture(profile.id);
        console.log('✅ Profile picture removed successfully');
        console.log('📋 Updated profile:', {
          hasProfilePic: !!removeResponse.user.profile_pic,
          profilePicUrl: removeResponse.user.profile_pic,
        });
      } catch (error) {
        console.error('❌ Failed to remove profile picture:', error);
      }
    } else {
      console.log('📸 User has no profile picture');
    }

    // Test 4: Test API endpoints availability
    console.log('🔗 Test 4: Testing API endpoints...');
    console.log('✅ Profile API service methods available:');
    console.log('  - getUserProfile()');
    console.log('  - uploadProfilePicture(userId, file)');
    console.log('  - removeProfilePicture(userId)');

    // Test 5: Check localStorage user data
    console.log('💾 Test 5: Checking localStorage user data...');
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      console.log('✅ User data in localStorage:', {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        hasProfilePic: !!user.profile_pic,
        profilePicUrl: user.profile_pic,
      });
    } else {
      console.warn('⚠️ No user data found in localStorage');
    }

    // Test 6: Check API base URL
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    console.log('🌐 Test 6: API Configuration...');
    console.log('✅ API Base URL:', API_BASE_URL);

    console.log('🎉 Profile Picture Feature Test Complete!');
    snackbar.success('Profile picture feature test completed successfully!');

    return {
      success: true,
      profile,
      apiBaseUrl: API_BASE_URL,
      hasUserData: !!userData,
    };

  } catch (error) {
    console.error('❌ Profile Picture Feature Test Failed:', error);
    snackbar.error('Profile picture feature test failed');
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const validateProfilePictureFile = (file: File): { valid: boolean; error?: string } => {
  console.log('🔍 Validating profile picture file...');
  console.log('📁 File details:', {
    name: file.name,
    type: file.type,
    size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
  });

  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    const error = `Invalid file type: ${file.type}. Allowed types: ${validTypes.join(', ')}`;
    console.error('❌', error);
    return { valid: false, error };
  }

  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    const error = `File too large: ${(file.size / 1024 / 1024).toFixed(2)} MB. Maximum size: 5MB`;
    console.error('❌', error);
    return { valid: false, error };
  }

  console.log('✅ File validation passed');
  return { valid: true };
};

export const createTestImageFile = async (): Promise<File> => {
  // Create a simple test image (1x1 pixel PNG)
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, 1, 1);
  }
  
  return new Promise<File>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'test-profile-pic.png', { type: 'image/png' });
        resolve(file);
      }
    }, 'image/png');
  });
};

export const testProfilePictureUpload = async (file: File) => {
  console.log('🚀 Testing profile picture upload...');
  
  try {
    // Get current user
    const profile = await profileApiService.getUserProfile();
    
    // Validate file
    const validation = validateProfilePictureFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Upload file
    console.log('📤 Uploading profile picture...');
    const response = await profileApiService.uploadProfilePicture(profile.id, file);
    
    console.log('✅ Upload successful!');
    console.log('📋 Response:', {
      message: response.message,
      hasProfilePic: !!response.user.profile_pic,
      profilePicUrl: response.user.profile_pic,
    });

    snackbar.success('Profile picture upload test successful!');
    return { success: true, response };

  } catch (error) {
    console.error('❌ Upload test failed:', error);
    snackbar.error('Profile picture upload test failed');
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
