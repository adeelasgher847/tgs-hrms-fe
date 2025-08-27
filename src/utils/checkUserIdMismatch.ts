// Check for user ID mismatch between localStorage and API
export const checkUserIdMismatch = async () => {
  console.log('🔍 Checking User ID Mismatch...');
  
  try {
    // Get user from localStorage
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      console.error('❌ No user data in localStorage');
      return { success: false, error: 'No user data' };
    }
    
    const localStorageUser = JSON.parse(userStr);
    console.log('📦 localStorage User:', {
      id: localStorageUser.id,
      name: `${localStorageUser.first_name} ${localStorageUser.last_name}`,
      email: localStorageUser.email
    });
    
    // Get user from API
    const { profileApiService } = await import('../api/profileApi');
    const apiUser = await profileApiService.getUserProfile();
    
    console.log('🌐 API User:', {
      id: apiUser.id,
      name: `${apiUser.first_name} ${apiUser.last_name}`,
      email: apiUser.email
    });
    
    // Compare IDs
    if (localStorageUser.id === apiUser.id) {
      console.log('✅ User IDs match!');
      return { 
        success: true, 
        localStorageId: localStorageUser.id,
        apiId: apiUser.id,
        match: true
      };
    } else {
      console.error('❌ User ID mismatch detected!');
      console.error(`  localStorage ID: ${localStorageUser.id}`);
      console.error(`  API ID: ${apiUser.id}`);
      
      return { 
        success: false, 
        error: 'User ID mismatch',
        localStorageId: localStorageUser.id,
        apiId: apiUser.id,
        match: false
      };
    }
    
  } catch (error) {
    console.error('❌ Error checking user ID mismatch:', error);
    return { 
      success: false, 
      error: error.message
    };
  }
};

// Fix user ID mismatch by updating localStorage
export const fixUserIdMismatch = async () => {
  console.log('🔧 Fixing User ID Mismatch...');
  
  try {
    const { profileApiService } = await import('../api/profileApi');
    const apiUser = await profileApiService.getUserProfile();
    
    // Update localStorage with API user data
    localStorage.setItem('user', JSON.stringify(apiUser));
    
    console.log('✅ localStorage updated with API user data');
    console.log('👤 New user data:', {
      id: apiUser.id,
      name: `${apiUser.first_name} ${apiUser.last_name}`,
      email: apiUser.email
    });
    
    return { 
      success: true, 
      user: apiUser
    };
    
  } catch (error) {
    console.error('❌ Error fixing user ID mismatch:', error);
    return { 
      success: false, 
      error: error.message
    };
  }
};
