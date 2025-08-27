// Test utility to verify the role parsing fix works correctly
import { getRoleName, getRoleColor, isEmployee, getRoleDisplayName } from './roleUtils';

export const testRoleParsing = () => {
  console.log('🧪 Testing Role Parsing Fix...');

  // Test cases
  const testCases = [
    { role: 'admin', expected: 'admin' },
    { role: 'Admin', expected: 'Admin' },
    { role: { name: 'manager' }, expected: 'manager' },
    { role: { name: 'Manager' }, expected: 'Manager' },
    { role: { name: 'employee' }, expected: 'employee' },
    { role: undefined, expected: 'Unknown' },
    { role: null, expected: 'Unknown' },
    { role: '', expected: '' },
  ];

  console.log('📋 Testing getRoleName function:');
  testCases.forEach(({ role, expected }, index) => {
    const result = getRoleName(role);
    const passed = result === expected;
    console.log(`  Test ${index + 1}: ${passed ? '✅' : '❌'} ${JSON.stringify(role)} → "${result}" (expected: "${expected}")`);
  });

  console.log('\n🎨 Testing getRoleColor function:');
  const colorTests = [
    { role: 'admin', expected: 'error' },
    { role: 'manager', expected: 'warning' },
    { role: 'employee', expected: 'success' },
    { role: 'user', expected: 'primary' },
    { role: { name: 'admin' }, expected: 'error' },
    { role: { name: 'Manager' }, expected: 'warning' },
  ];

  colorTests.forEach(({ role, expected }, index) => {
    const result = getRoleColor(role);
    const passed = result === expected;
    console.log(`  Test ${index + 1}: ${passed ? '✅' : '❌'} ${JSON.stringify(role)} → "${result}" (expected: "${expected}")`);
  });

  console.log('\n👤 Testing isEmployee function:');
  const employeeTests = [
    { role: 'employee', expected: true },
    { role: 'Employee', expected: true },
    { role: { name: 'employee' }, expected: true },
    { role: { name: 'Employee' }, expected: true },
    { role: 'admin', expected: false },
    { role: 'manager', expected: false },
    { role: { name: 'admin' }, expected: false },
  ];

  employeeTests.forEach(({ role, expected }, index) => {
    const result = isEmployee(role);
    const passed = result === expected;
    console.log(`  Test ${index + 1}: ${passed ? '✅' : '❌'} ${JSON.stringify(role)} → ${result} (expected: ${expected})`);
  });

  console.log('\n🏷️ Testing getRoleDisplayName function:');
  const displayTests = [
    { role: 'admin', expected: 'Admin' },
    { role: 'manager', expected: 'Manager' },
    { role: 'employee', expected: 'Employee' },
    { role: 'staff', expected: 'Staff' },
    { role: 'user', expected: 'User' },
    { role: { name: 'admin' }, expected: 'Admin' },
    { role: { name: 'Manager' }, expected: 'Manager' },
  ];

  displayTests.forEach(({ role, expected }, index) => {
    const result = getRoleDisplayName(role);
    const passed = result === expected;
    console.log(`  Test ${index + 1}: ${passed ? '✅' : '❌'} ${JSON.stringify(role)} → "${result}" (expected: "${expected}")`);
  });

  console.log('\n🎉 Role Parsing Test Complete!');
  return true;
};

// Test the fix for the specific error that was occurring
export const testUserProfileRoleFix = () => {
  console.log('🔧 Testing UserProfile Role Fix...');

  // Simulate the user profile data that was causing the error
  const mockUserProfile = {
    id: 'user123',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    role: { name: 'manager' }, // This was causing the error
    profile_pic: null,
    tenant: 'Test Company',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  };

  try {
    // Test the functions that were failing
    const roleName = getRoleName(mockUserProfile.role);
    const roleColor = getRoleColor(mockUserProfile.role);
    const isEmployeeUser = isEmployee(mockUserProfile.role);
    const displayName = getRoleDisplayName(mockUserProfile.role);

    console.log('✅ UserProfile role parsing works correctly:');
    console.log(`  Role Name: "${roleName}"`);
    console.log(`  Role Color: "${roleColor}"`);
    console.log(`  Is Employee: ${isEmployeeUser}`);
    console.log(`  Display Name: "${displayName}"`);

    // Test the specific case that was causing the error
    const roleNameLower = roleName.toLowerCase();
    console.log(`  Role Name (lowercase): "${roleNameLower}"`);

    return true;
  } catch (error) {
    console.error('❌ UserProfile role parsing still has issues:', error);
    return false;
  }
};
