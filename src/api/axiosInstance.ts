import axios from 'axios';
import { shouldLogout, forceLogout } from '../utils/authValidation';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5173',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to get refresh token from localStorage or user object
function getRefreshToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (refreshToken) return refreshToken;
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.refresh_token) return user.refresh_token;
    } catch {
      // Ignore parsing errors
    }
  }
  return null;
}

// Helper function to refresh access token
async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token found');
  const response = await axios.post(
    `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5173'}/auth/refresh-token`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return response.data;
}

let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // No token available
    }

    // If data is FormData, remove Content-Type header so axios can set it automatically with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    // Debug logging for payroll config requests
    try {
      if (
        typeof config.url === 'string' &&
        config.url.includes('/payroll/config') &&
        config.method &&
        ['post', 'put'].includes(config.method.toLowerCase())
      ) {
        // eslint-disable-next-line no-console
        console.debug('Outgoing payroll config request:', {
          url: config.url,
          method: config.method,
          data: config.data,
          headers: config.headers,
        });
      }
    } catch (e) {
      // ignore logging errors
    }

    // Debug logging

    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor to handle token refresh and error formatting
axiosInstance.interceptors.response.use(undefined, async (error: unknown) => {
  const originalRequest = (error as Record<string, unknown>).config as Record<string, unknown>;
  
  // Check if user should be logged out (deleted user, invalid token, etc.)
  if (shouldLogout(error)) {
    console.warn('User should be logged out due to:', (((error as Record<string, unknown>).response as Record<string, unknown>)?.data as Record<string, unknown>)?.message || 'Authentication error');
    forceLogout();
    return Promise.reject(error);
  }
  
  // Handle 401 errors for token refresh
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    (error as { response: { status: number } }).response.status === 401 &&
    !(originalRequest as Record<string, unknown>)._retry
  ) {
    if (isRefreshing) {
      return new Promise(function (resolve, reject) {
        failedQueue.push({ resolve, reject });
      })
        .then(token => {
          (originalRequest as Record<string, unknown>).headers = { ...((originalRequest as Record<string, unknown>).headers as Record<string, unknown> || {}), Authorization: 'Bearer ' + token };
          return axiosInstance(originalRequest as Record<string, unknown>);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    }
    (originalRequest as Record<string, unknown>)._retry = true;
    isRefreshing = true;
    try {
      const data = await refreshAccessToken();
      localStorage.setItem('accessToken', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      axiosInstance.defaults.headers.common['Authorization'] =
        'Bearer ' + data.accessToken;
      processQueue(null, data.accessToken);
      (originalRequest as Record<string, unknown>).headers = { ...((originalRequest as Record<string, unknown>).headers as Record<string, unknown> || {}), Authorization: 'Bearer ' + data.accessToken };
      return axiosInstance(originalRequest as Record<string, unknown>);
    } catch (refreshError) {
      processQueue(refreshError, null);
      // If refresh fails, check if it's due to user deletion
      if (shouldLogout(refreshError)) {
        forceLogout();
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
  
  // For all other errors, ensure the error object has proper structure
  if (error && typeof error === 'object' && 'response' in error) {
    try {
      const resp = (error as Record<string, unknown>).response as Record<string, unknown> | undefined;
      if (resp && resp.config && typeof resp.config === 'object') {
        const reqCfg = resp.config as Record<string, unknown>;
        if (
          typeof reqCfg.url === 'string' &&
          reqCfg.url.includes('/payroll/config') &&
          resp.data
        ) {
          // eslint-disable-next-line no-console
          console.debug('Payroll config response error:', {
            url: reqCfg.url,
            status: (resp as any).status,
            data: resp.data,
          });
        }
      }
    } catch (e) {
      // ignore
    }
    const axiosError = error as Record<string, unknown>;
    
    // Ensure error response has proper structure for frontend handling
    if ((axiosError.response as Record<string, unknown>)?.data && typeof ((axiosError.response as Record<string, unknown>).data as Record<string, unknown>) === 'object') {
      // If backend returns structured error, preserve it
      if (((axiosError.response as Record<string, unknown>).data as Record<string, unknown>).message) {
        // Error already has proper structure, pass it through
        return Promise.reject(error);
      }
    }
  }
  
  return Promise.reject(error);
});

export default axiosInstance;
