import axios, { AxiosResponse, AxiosError } from 'axios';
import { API_CONFIG, ROUTES } from '../constants';

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_CONFIG.baseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  config => {
    // Get token from localStorage (we'll implement this with zustand later)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('keynest_token');
      if (token) {
        config.headers.Authorization = `Token ${token}`;
      }
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('keynest_token');
        window.location.href = ROUTES.login;
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
