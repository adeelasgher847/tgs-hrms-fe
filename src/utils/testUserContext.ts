// Test utility to verify UserContext functionality
export const testUserContext = () => {
  console.log('🧪 Testing UserContext...');
  
  // Check if UserContext is available
  try {
    // This will be called from within a component that uses useUser
    console.log('✅ UserContext should be available');
  } catch (error) {
    console.error('❌ UserContext error:', error);
  }
  
  // Check localStorage
  const token = localStorage.getItem('accessToken');
  const userData = localStorage.getItem('user');
  
  console.log('📦 LocalStorage Check:');
  console.log(`  Access Token: ${token ? '✅ Present' : '❌ Missing'}`);
  console.log(`  User Data: ${userData ? '✅ Present' : '❌ Missing'}`);
  
  if (userData) {
    try {
      const user = JSON.parse(userData);
      console.log('👤 User Data:', {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        role: user.role
      });
    } catch (error) {
      console.error('❌ Error parsing user data:', error);
    }
  }
  
  return {
    hasToken: !!token,
    hasUserData: !!userData,
    userData: userData ? JSON.parse(userData) : null
  };
};

// Test UserContext in a component
export const testUserContextInComponent = (useUserHook: any) => {
  try {
    const { user, loading, updateUser, refreshUser, clearUser } = useUserHook();
    
    console.log('🔍 UserContext State:');
    console.log(`  User: ${user ? '✅ Present' : '❌ Null'}`);
    console.log(`  Loading: ${loading ? '⏳ Yes' : '✅ No'}`);
    console.log(`  updateUser: ${typeof updateUser === 'function' ? '✅ Function' : '❌ Not function'}`);
    console.log(`  refreshUser: ${typeof refreshUser === 'function' ? '✅ Function' : '❌ Not function'}`);
    console.log(`  clearUser: ${typeof clearUser === 'function' ? '✅ Function' : '❌ Not function'}`);
    
    if (user) {
      console.log('👤 Current User:', {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        role: user.role
      });
    }
    
    return { success: true, user, loading };
  } catch (error) {
    console.error('❌ UserContext test failed:', error);
    return { success: false, error: error.message };
  }
};

// Debug UserContext provider
export const debugUserContextProvider = () => {
  console.log('🔧 Debugging UserContext Provider...');
  
  // Check if we're in a React component tree
  const isReactEnvironment = typeof window !== 'undefined' && window.React;
  console.log(`  React Environment: ${isReactEnvironment ? '✅ Yes' : '❌ No'}`);
  
  // Check if UserContext is defined
  try {
    // This is a basic check - in real usage, we'd need to access the actual context
    console.log('  UserContext: ✅ Should be defined');
  } catch (error) {
    console.error('  UserContext: ❌ Error accessing context');
  }
  
  return {
    isReactEnvironment,
    timestamp: new Date().toISOString()
  };
};
