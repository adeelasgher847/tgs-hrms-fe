import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3001",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn("⚠️ No access token found in localStorage");
    }
    
    // Debug logging
    console.log('🌐 API Request:', {
      method: config.method,
      url: config.url,
      data: config.data,
      hasToken: !!token,
      headers: {
        ...config.headers,
        Authorization: token ? 'Bearer [HIDDEN]' : 'None'
      }
    });
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle common errors
axiosInstance.interceptors.response.use(
  (response) => {
    // Debug logging
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    // Debug logging
    console.error('❌ API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message,
      config: {
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      console.error("🔐 Authentication failed - clearing tokens");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      window.location.href = "/";
    } else if (error.response?.status === 403) {
      // Access denied
      console.error("🚫 Access denied - insufficient permissions");
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 