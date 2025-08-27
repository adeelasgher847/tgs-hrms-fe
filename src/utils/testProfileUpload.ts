// Simple test for profile picture upload
export const testProfileUpload = async () => {
  console.log('🧪 Testing Profile Upload...');
  
  try {
    // Get current user
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      console.error('❌ No user data found');
      return { success: false, error: 'No user data' };
    }
    
    const user = JSON.parse(userStr);
    console.log('👤 Current User:', {
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email
    });
    
    // Test API endpoint
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    const endpoint = `/users/${user.id}/profile-picture`;
    console.log('🌐 API Endpoint:', `${baseURL}${endpoint}`);
    
    // Test with a simple request to see if the endpoint exists
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.error('❌ No access token found');
      return { success: false, error: 'No access token' };
    }
    
    // Test the endpoint with a GET request to see if it's accessible
    try {
      const response = await fetch(`${baseURL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🔍 Endpoint Test Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (response.status === 405) {
        console.log('✅ Endpoint exists (Method Not Allowed for GET is expected)');
      } else if (response.status === 404) {
        console.error('❌ Endpoint not found');
        return { success: false, error: 'Endpoint not found' };
      } else {
        console.log('⚠️ Unexpected response:', response.status);
      }
      
    } catch (fetchError) {
      console.error('❌ Fetch error:', fetchError);
      return { success: false, error: fetchError.message };
    }
    
    // Test file creation
    const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    console.log('📁 Test File:', {
      name: testFile.name,
      type: testFile.type,
      size: testFile.size
    });
    
    // Test FormData
    const formData = new FormData();
    formData.append('profile_pic', testFile);
    
    console.log('📦 FormData Test:');
    for (let [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value);
    }
    
    return { 
      success: true, 
      userId: user.id,
      endpoint: endpoint,
      baseURL: baseURL
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
};

// Test the actual upload with a real file
export const testRealUpload = async (file: File) => {
  console.log('🧪 Testing Real Upload...');
  
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      throw new Error('No user data found');
    }
    
    const user = JSON.parse(userStr);
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('No access token found');
    }
    
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    const endpoint = `/users/${user.id}/profile-picture`;
    
    console.log('📤 Upload Details:');
    console.log(`  URL: ${baseURL}${endpoint}`);
    console.log(`  User ID: ${user.id}`);
    console.log(`  File: ${file.name} (${file.type}, ${file.size} bytes)`);
    
    const formData = new FormData();
    formData.append('profile_pic', file);
    
    const response = await fetch(`${baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Don't set Content-Type for FormData
      },
      body: formData
    });
    
    console.log('📥 Response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    const responseData = await response.text();
    console.log('📄 Response Data:', responseData);
    
    if (response.ok) {
      const data = JSON.parse(responseData);
      console.log('✅ Upload successful:', data);
      return { success: true, data };
    } else {
      console.error('❌ Upload failed:', responseData);
      return { success: false, error: responseData };
    }
    
  } catch (error) {
    console.error('❌ Real upload test failed:', error);
    return { success: false, error: error.message };
  }
};
