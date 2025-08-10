// Test user setup utilities

export const setupTestUser = (role: 'user' | 'admin' = 'user') => {
  const testUser = {
    id: `test-${role}-${Date.now()}`,
    email: `test-${role}@example.com`,
    first_name: 'Test',
    last_name: role === 'admin' ? 'Admin' : 'User',
    role: role,
    tenant_id: 'test-tenant'
  };
  
  localStorage.setItem('user', JSON.stringify(testUser));
  localStorage.setItem('accessToken', `test-token-${role}`);
  localStorage.setItem('setupTestUser', 'true');
  
  console.log(`✅ Test ${role} user set up:`, testUser);
  console.log('🔄 Reloading page to apply changes...');
  
  setTimeout(() => {
    window.location.reload();
  }, 1000);
  
  return testUser;
};

export const setupTestAdmin = () => {
  return setupTestUser('admin');
};

export const setupTestRegularUser = () => {
  return setupTestUser('user');
};

export const clearTestUser = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('setupTestUser');
  console.log('🗑️ Test user cleared');
};

export const checkCurrentSetup = () => {
  const user = localStorage.getItem('user');
  const token = localStorage.getItem('accessToken');
  
  console.log('📋 Current Setup:', {
    hasUser: !!user,
    hasToken: !!token,
    user: user ? JSON.parse(user) : null,
    tokenLength: token?.length || 0
  });
  
  return { user: user ? JSON.parse(user) : null, hasToken: !!token };
};

// Export for browser console
if (typeof window !== 'undefined') {
  (window as any).setupTestUser = setupTestUser;
  (window as any).setupTestAdmin = setupTestAdmin;
  (window as any).setupTestRegularUser = setupTestRegularUser;
  (window as any).clearTestUser = clearTestUser;
  (window as any).checkCurrentSetup = checkCurrentSetup;
} 