// Quick setup utilities for testing

export const quickSetupUser = () => {
  const testUser = {
    id: 'test-user-1',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    role: 'user',
  };

  localStorage.setItem('user', JSON.stringify(testUser));
  localStorage.setItem('accessToken', 'test-token');

  console.log('✅ Quick user setup complete:', testUser);
  console.log('🔄 Reloading page...');

  setTimeout(() => {
    window.location.reload();
  }, 500);

  return testUser;
};

export const quickSetupAdmin = () => {
  const testAdmin = {
    id: 'test-admin-1',
    email: 'admin@example.com',
    first_name: 'Test',
    last_name: 'Admin',
    role: 'admin',
  };

  localStorage.setItem('user', JSON.stringify(testAdmin));
  localStorage.setItem('accessToken', 'test-admin-token');

  console.log('✅ Quick admin setup complete:', testAdmin);
  console.log('🔄 Reloading page...');

  setTimeout(() => {
    window.location.reload();
  }, 500);

  return testAdmin;
};

export const checkSetup = () => {
  const user = localStorage.getItem('user');
  const token = localStorage.getItem('accessToken');

  console.log('📋 Current Setup:', {
    hasUser: !!user,
    hasToken: !!token,
    user: user ? JSON.parse(user) : null,
    tokenLength: token?.length || 0,
  });

  return { user: user ? JSON.parse(user) : null, hasToken: !!token };
};

export const clearSetup = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('accessToken');
  console.log('🗑️ Setup cleared');
};

// Export for browser console
if (typeof window !== 'undefined') {
  (window as any).quickSetupUser = quickSetupUser;
  (window as any).quickSetupAdmin = quickSetupAdmin;
  (window as any).checkSetup = checkSetup;
  (window as any).clearSetup = clearSetup;
}
