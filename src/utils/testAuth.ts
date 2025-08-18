import {
  getCurrentUser,
  isAdmin,
  isUser,
  getAuthToken,
  getUserName,
} from './auth';

// Test function to verify authentication setup
export const testAuthSetup = () => {
  console.log('🔐 Testing Authentication Setup...');

  const token = getAuthToken();
  const user = getCurrentUser();
  const adminStatus = isAdmin();
  const userStatus = isUser();
  const userName = getUserName();

  console.log('📋 Auth Status:', {
    hasToken: !!token,
    tokenLength: token?.length || 0,
    user: user,
    isAdmin: adminStatus,
    isUser: userStatus,
    userName: userName,
  });

  if (!token) {
    console.error('❌ No access token found!');
    console.log(
      '💡 Make sure you are logged in and have a valid token in localStorage'
    );
  }

  if (!user) {
    console.error('❌ No user data found!');
    console.log('💡 Make sure user data is stored in localStorage');
  }

  if (!adminStatus && !userStatus) {
    console.error('❌ No valid role found!');
    console.log('💡 User should have either "admin" or "user" role');
  }

  if (adminStatus) {
    console.log('✅ Admin role detected');
  }

  if (userStatus) {
    console.log('✅ User role detected');
  }

  return {
    hasToken: !!token,
    hasUser: !!user,
    isAdmin: adminStatus,
    isUser: userStatus,
    userName: userName,
  };
};

// Export for browser console
if (typeof window !== 'undefined') {
  (window as any).testAuthSetup = testAuthSetup;
}
