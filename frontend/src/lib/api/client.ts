import axios, { AxiosResponse, AxiosError } from 'axios';
import { API_CONFIG, ROUTES } from '../constants';

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_CONFIG.baseUrl,
  timeout: 60000, // Increased to 60 seconds for slow API responses
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  config => {
    // Get JWT access token from localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('keynest_access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    // Handle 401 errors with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      if (typeof window !== 'undefined') {
        const refreshToken = localStorage.getItem('keynest_refresh_token');
        
        if (refreshToken) {
          try {
            // Attempt to refresh the token
            const response = await axios.post(
              `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.refresh}`,
              { refresh: refreshToken }
            );
            
            const { access } = response.data;
            localStorage.setItem('keynest_access_token', access);
            
            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${access}`;
            return apiClient(originalRequest);
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            localStorage.removeItem('keynest_access_token');
            localStorage.removeItem('keynest_refresh_token');
            window.location.href = ROUTES.login;
            return Promise.reject(refreshError);
          }
        } else {
          // No refresh token, redirect to login
          localStorage.removeItem('keynest_access_token');
          window.location.href = ROUTES.login;
        }
      }
    }
    
    // Transform error for better handling
    const apiError = {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    };
    
    return Promise.reject(apiError);
  }
);

export default apiClient;

// Named alias for backwards compatibility in hooks
// Several modules import { api } from './client'
export const api = apiClient;
