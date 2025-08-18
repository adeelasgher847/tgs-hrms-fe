import { leaveApi } from './leaveApi';

// Test function to verify leave API integration
export const testLeaveAPI = async () => {
  console.log('🧪 Testing Leave API Integration...');

  try {
    // Test 1: Create a leave request
    console.log('📝 Testing CREATE leave request...');
    const testData = {
      fromDate: '2025-01-15',
      toDate: '2025-01-17',
      reason: 'Test leave request',
      type: 'sick',
    };
    console.log('Sending data:', testData);

    const newLeave = await leaveApi.createLeave(testData);
    console.log('✅ CREATE successful:', newLeave);

    // Test 2: Get user leaves
    console.log('📋 Testing GET user leaves...');
    const userLeaves = await leaveApi.getUserLeaves();
    console.log('✅ GET user leaves successful:', userLeaves);

    // Test 3: Get all leaves (admin only)
    console.log('👥 Testing GET all leaves (admin)...');
    const allLeaves = await leaveApi.getAllLeaves();
    console.log('✅ GET all leaves successful:', allLeaves);

    // Test 4: Update leave status (if there are leaves)
    if (newLeave.id) {
      console.log('🔄 Testing UPDATE leave status...');
      const updatedLeave = await leaveApi.updateLeaveStatus(
        newLeave.id,
        'approved'
      );
      console.log('✅ UPDATE status successful:', updatedLeave);
    }

    console.log('🎉 All Leave API tests passed!');
    return true;
  } catch (error: any) {
    console.error('❌ Leave API test failed:', error);
    if (error.response) {
      console.error('API Error Response:', error.response.data);
      console.error('API Error Status:', error.response.status);
      console.error('API Error Headers:', error.response.headers);
    }
    return false;
  }
};

// Debug function to check current leaves
export const debugLeaves = async () => {
  console.log('🔍 Debugging current leaves...');
  try {
    const userLeaves = await leaveApi.getUserLeaves();
    console.log('Current user leaves:', userLeaves);

    const allLeaves = await leaveApi.getAllLeaves();
    console.log('All leaves (admin):', allLeaves);
  } catch (error: any) {
    console.error('Debug error:', error);
  }
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testLeaveAPI = testLeaveAPI;
  (window as any).debugLeaves = debugLeaves;
}
