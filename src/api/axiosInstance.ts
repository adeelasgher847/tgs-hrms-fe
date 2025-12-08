import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { env } from '../config/env';
import { authService } from './authService';
import { axiosErrorHandler } from './axiosErrorHandler';

const axiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  config => {
    const token = authService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  error => Promise.reject(error)
);

axiosInstance.interceptors.response.use(undefined, async (error: unknown) => {
  if (!axiosErrorHandler.isAxiosError(error)) {
    return Promise.reject(error);
  }

  const axiosError = error as AxiosError;
  const originalRequest = axiosError.config as
    | (AxiosRequestConfig & { _retry?: boolean })
    | null;

  const handlerResult = axiosErrorHandler.handleError(error, originalRequest);

  if (handlerResult.shouldLogout) {
    return Promise.reject(handlerResult.error);
  }

  if (handlerResult.shouldRetry && originalRequest) {
    return handleTokenRefresh(originalRequest);
  }

  return Promise.reject(handlerResult.error);
});

async function handleTokenRefresh(
  originalRequest: AxiosRequestConfig & { _retry?: boolean }
): Promise<unknown> {
  originalRequest._retry = true;

  if (authService.isTokenRefreshing()) {
    return new Promise<string>((resolve, reject) => {
      authService.addToQueue(resolve, reject);
    })
      .then(token => {
        originalRequest.headers = {
          ...(originalRequest.headers ?? {}),
          Authorization: `Bearer ${token}`,
        };
        return axiosInstance(originalRequest);
      })
      .catch(err => Promise.reject(err));
  }

  try {
    const newToken = await authService.startTokenRefresh();

    authService.processQueueSuccess(newToken);

    axiosInstance.defaults.headers.common['Authorization'] =
      `Bearer ${newToken}`;

    originalRequest.headers = {
      ...(originalRequest.headers ?? {}),
      Authorization: `Bearer ${newToken}`,
    };

    return axiosInstance(originalRequest);
  } catch (refreshError) {
    authService.processQueueError(refreshError);

    if (axiosErrorHandler.shouldTriggerLogout(refreshError)) {
      axiosErrorHandler.handleLogout(refreshError);
    } else {
      authService.clearTokens();
      window.location.href = '/';
    }
    return Promise.reject(refreshError);
  }
}

export default axiosInstance;
