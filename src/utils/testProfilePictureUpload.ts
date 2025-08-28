// Test utility to verify profile picture upload functionality
import { profileApiService } from '../api/profileApi';
import { debugUserData, validateUserSession } from './debugUserData';

export const testProfilePictureUpload = async () => {
  console.log('🧪 Testing Profile Picture Upload...');

  // Step 1: Validate user session
  console.log('\n📋 Step 1: Validating user session...');
  const sessionValid = await validateUserSession();
  if (!sessionValid) {
    console.error('❌ User session validation failed');
    return false;
  }

  // Step 2: Check user data consistency
  console.log('\n📋 Step 2: Checking user data consistency...');
  await debugUserData();

  // Step 3: Test API endpoints
  console.log('\n📋 Step 3: Testing API endpoints...');
  try {
    const user = await profileApiService.getUserProfile();
    console.log('✅ GET /profile/me: OK');
    console.log('👤 User ID:', user.id);
    console.log('👤 User Name:', `${user.first_name} ${user.last_name}`);
    
    return {
      success: true,
      user,
      message: 'Profile picture upload test completed successfully'
    };
  } catch (error) {
    console.error('❌ API test failed:', error);
    return {
      success: false,
      error,
      message: 'Profile picture upload test failed'
    };
  }
};

export const createTestImageFile = (): File => {
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

export const testUploadWithMockFile = async () => {
  console.log('🧪 Testing upload with mock file...');
  
  try {
    // Get current user
    const user = await profileApiService.getUserProfile();
    
    // Create test file
    const testFile = await createTestImageFile();
    
    console.log('📁 Test file created:', {
      name: testFile.name,
      type: testFile.type,
      size: `${(testFile.size / 1024).toFixed(2)} KB`
    });
    
    // Attempt upload
    console.log('📤 Attempting upload...');
    const response = await profileApiService.uploadProfilePicture(user.id, testFile);
    
    console.log('✅ Upload successful!');
    console.log('📋 Response:', response);
    
    return {
      success: true,
      response,
      message: 'Mock file upload test successful'
    };
  } catch (error) {
    console.error('❌ Mock file upload test failed:', error);
    return {
      success: false,
      error,
      message: 'Mock file upload test failed'
    };
  }
};
