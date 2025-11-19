/**
 * API Client Service - Academy Multi M
 * Handles all HTTP requests with JWT authentication and auto-refresh
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Create axios instance with base configuration
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Store for token management (simple in-memory, should use secure storage)
 */
let tokens = {
  access: localStorage.getItem('accessToken') || null,
  refresh: localStorage.getItem('refreshToken') || null,
};

/**
 * Request interceptor - Attach JWT token
 */
apiClient.interceptors.request.use(
  (config) => {
    if (tokens.access) {
      config.headers.Authorization = `Bearer ${tokens.access}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor - Handle 401 and refresh token
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      tokens.refresh
    ) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken: tokens.refresh,
        });

        const { accessToken, refreshToken } = response.data.data;

        // Update tokens
        tokens.access = accessToken;
        tokens.refresh = refreshToken;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        tokens = { access: null, refresh: null };
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Set tokens after login
 */
export const setTokens = (accessToken, refreshToken) => {
  tokens.access = accessToken;
  tokens.refresh = refreshToken;
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};

/**
 * Clear tokens on logout
 */
export const clearTokens = () => {
  tokens = { access: null, refresh: null };
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

/**
 * Get current access token
 */
export const getAccessToken = () => tokens.access;

export default apiClient;
