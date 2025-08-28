// Debug utility to check user data consistency and identify ID mismatch issues
import { profileApiService } from '../api/profileApi';

export const debugUserData = async () => {
  console.log('🔍 Debugging User Data Consistency...');

  // Check localStorage user data
  const localStorageUser = localStorage.getItem('user');
  console.log('💾 localStorage user data:', localStorageUser ? JSON.parse(localStorageUser) : 'null');

  // Check UserContext user data (if available)
  try {
    const apiUser = await profileApiService.getUserProfile();
    console.log('🌐 API user data:', apiUser);
    
    // Compare IDs
    if (localStorageUser) {
      const localUser = JSON.parse(localStorageUser);
      console.log('🆔 ID Comparison:');
      console.log(`  localStorage ID: ${localUser.id}`);
      console.log(`  API ID: ${apiUser.id}`);
      console.log(`  IDs match: ${localUser.id === apiUser.id ? '✅' : '❌'}`);
      
      if (localUser.id !== apiUser.id) {
        console.warn('⚠️ ID mismatch detected! This could cause the profile picture upload to fail.');
        console.log('💡 Solution: Update localStorage with API user data');
      }
    }
  } catch (error) {
    console.error('❌ Failed to fetch API user data:', error);
  }
};

export const fixUserDataMismatch = async () => {
  console.log('🔧 Attempting to fix user data mismatch...');
  
  try {
    // Get fresh user data from API
    const apiUser = await profileApiService.getUserProfile();
    
    // Update localStorage with API data
    localStorage.setItem('user', JSON.stringify(apiUser));
    
    console.log('✅ User data updated in localStorage');
    console.log('🆔 New user ID:', apiUser.id);
    
    // Reload the page to refresh UserContext
    console.log('🔄 Reloading page to refresh UserContext...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
  } catch (error) {
    console.error('❌ Failed to fix user data mismatch:', error);
  }
};

export const checkAuthToken = () => {
  console.log('🔐 Checking authentication token...');
  
  const token = localStorage.getItem('accessToken');
  if (token) {
    console.log('✅ Access token found');
    console.log('🔑 Token length:', token.length);
    console.log('🔑 Token preview:', token.substring(0, 20) + '...');
  } else {
    console.warn('⚠️ No access token found');
  }
  
  const refreshToken = localStorage.getItem('refreshToken');
  if (refreshToken) {
    console.log('✅ Refresh token found');
  } else {
    console.warn('⚠️ No refresh token found');
  }
};

export const validateUserSession = async () => {
  console.log('🔍 Validating user session...');
  
  // Check tokens
  checkAuthToken();
  
  // Check user data consistency
  await debugUserData();
  
  // Test API connectivity
  try {
    const user = await profileApiService.getUserProfile();
    console.log('✅ API connectivity: OK');
    console.log('✅ User authentication: OK');
    return true;
  } catch (error) {
    console.error('❌ API connectivity failed:', error);
    return false;
  }
};
