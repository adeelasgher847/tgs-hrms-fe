// Debug utility for profile picture upload issues
export const debugProfilePictureUpload = async () => {
  console.log('🔍 Debugging Profile Picture Upload...');
  
  // Check authentication
  const token = localStorage.getItem('accessToken');
  const userData = localStorage.getItem('user');
  
  console.log('🔐 Authentication Check:');
  console.log(`  Access Token: ${token ? '✅ Present' : '❌ Missing'}`);
  console.log(`  User Data: ${userData ? '✅ Present' : '❌ Missing'}`);
  
  if (!token) {
    console.error('❌ No access token found - user not authenticated');
    return { success: false, error: 'No access token' };
  }
  
  if (!userData) {
    console.error('❌ No user data found in localStorage');
    return { success: false, error: 'No user data' };
  }
  
  try {
    const user = JSON.parse(userData);
    console.log('👤 User Data Analysis:');
    console.log(`  User ID: ${user.id}`);
    console.log(`  Name: ${user.first_name} ${user.last_name}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Profile Pic: ${user.profile_pic || 'None'}`);
    
    // Test API call to get current user profile
    const { profileApiService } = await import('../api/profileApi');
    try {
      const currentProfile = await profileApiService.getUserProfile();
      console.log('✅ API Profile Check:');
      console.log(`  API User ID: ${currentProfile.id}`);
      console.log(`  API Name: ${currentProfile.first_name} ${currentProfile.last_name}`);
      console.log(`  API Profile Pic: ${currentProfile.profile_pic || 'None'}`);
      
      // Check for ID mismatch
      if (user.id !== currentProfile.id) {
        console.error('❌ ID Mismatch Detected:');
        console.error(`  localStorage ID: ${user.id}`);
        console.error(`  API ID: ${currentProfile.id}`);
        return { 
          success: false, 
          error: 'ID mismatch between localStorage and API',
          localStorageId: user.id,
          apiId: currentProfile.id
        };
      }
      
      console.log('✅ ID Match: localStorage and API user IDs are consistent');
      return { 
        success: true, 
        userId: user.id,
        profile: currentProfile
      };
      
    } catch (apiError) {
      console.error('❌ API Profile Check Failed:', apiError);
      return { 
        success: false, 
        error: 'Failed to fetch API profile',
        apiError: apiError.message
      };
    }
    
  } catch (parseError) {
    console.error('❌ Error parsing user data:', parseError);
    return { 
      success: false, 
      error: 'Failed to parse user data',
      parseError: parseError.message
    };
  }
};

// Test file upload with mock file
export const testFileUpload = async () => {
  console.log('🧪 Testing File Upload...');
  
  try {
    // Create a mock file for testing
    const mockFile = new File(['mock image data'], 'test-image.jpg', {
      type: 'image/jpeg',
    });
    
    console.log('📁 Mock File Created:');
    console.log(`  Name: ${mockFile.name}`);
    console.log(`  Type: ${mockFile.type}`);
    console.log(`  Size: ${mockFile.size} bytes`);
    
    // Get current user
    const { profileApiService } = await import('../api/profileApi');
    const currentProfile = await profileApiService.getUserProfile();
    
    console.log('👤 Current User:');
    console.log(`  ID: ${currentProfile.id}`);
    console.log(`  Name: ${currentProfile.first_name} ${currentProfile.last_name}`);
    
    // Test upload (this will fail but we can see the error)
    try {
      await profileApiService.uploadProfilePicture(currentProfile.id, mockFile);
      console.log('✅ Upload test successful');
      return { success: true };
    } catch (uploadError) {
      console.log('⚠️ Upload test failed (expected for mock file):');
      console.log(`  Error: ${uploadError.message}`);
      return { 
        success: false, 
        error: uploadError.message,
        expected: true // This is expected for a mock file
      };
    }
    
  } catch (error) {
    console.error('❌ File upload test failed:', error);
    return { 
      success: false, 
      error: error.message
    };
  }
};

// Check backend connectivity
export const checkBackendConnectivity = async () => {
  console.log('🌐 Checking Backend Connectivity...');
  
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  
  try {
    // Test basic connectivity
    const response = await fetch(`${baseURL}/health`, { 
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });
    
    if (response.ok) {
      console.log('✅ Backend connectivity: OK');
      return { success: true };
    } else {
      console.log(`⚠️ Backend connectivity: ${response.status} ${response.statusText}`);
      return { 
        success: false, 
        status: response.status,
        statusText: response.statusText
      };
    }
  } catch (error) {
    console.error('❌ Backend connectivity failed:', error);
    return { 
      success: false, 
      error: error.message
    };
  }
};

// Comprehensive profile picture diagnostic
export const runProfilePictureDiagnostic = async () => {
  console.log('🔧 Running Profile Picture Diagnostic...');
  
  const results = {
    authentication: null,
    connectivity: null,
    fileUpload: null,
    summary: ''
  };
  
  // Check authentication
  results.authentication = await debugProfilePictureUpload();
  
  // Check connectivity
  results.connectivity = await checkBackendConnectivity();
  
  // Test file upload
  results.fileUpload = await testFileUpload();
  
  // Generate summary
  const allSuccessful = results.authentication.success && 
                       results.connectivity.success && 
                       results.fileUpload.success;
  
  results.summary = allSuccessful 
    ? '✅ All checks passed - profile picture upload should work'
    : '❌ Issues detected - check individual results above';
  
  console.log('📊 Diagnostic Summary:', results.summary);
  
  return results;
};
