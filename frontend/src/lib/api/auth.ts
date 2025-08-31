import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import apiClient from './client';
import { useAuthStore } from '../stores/auth';
import { API_CONFIG, ROUTES } from '../constants';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  ApiError,
  OAuthRequest,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
  PasswordChangeRequest,
  AccountActivationRequest,
  InvitationAcceptRequest,
} from '@/types';

// API Functions
const authApi = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post(API_CONFIG.endpoints.auth.register, data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post(API_CONFIG.endpoints.auth.login, data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post(API_CONFIG.endpoints.auth.logout);
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get(API_CONFIG.endpoints.auth.profile);
    return response.data;
  },

  googleOAuth: async (data: OAuthRequest): Promise<AuthResponse> => {
    const response = await apiClient.post(API_CONFIG.endpoints.auth.oauth.google, data);
    return response.data;
  },

  githubOAuth: async (data: OAuthRequest): Promise<AuthResponse> => {
    const response = await apiClient.post(API_CONFIG.endpoints.auth.oauth.github, data);
    return response.data;
  },

  passwordResetRequest: async (data: PasswordResetRequest): Promise<{message: string}> => {
    const response = await apiClient.post(API_CONFIG.endpoints.auth.passwordReset, data);
    return response.data;
  },

  passwordResetConfirm: async (data: PasswordResetConfirmRequest): Promise<{message: string}> => {
    const response = await apiClient.post(API_CONFIG.endpoints.auth.passwordResetConfirm, data);
    return response.data;
  },

  changePassword: async (data: PasswordChangeRequest): Promise<{message: string}> => {
    const response = await apiClient.post(API_CONFIG.endpoints.auth.changePassword, data);
    return response.data;
  },

  activateAccount: async (data: AccountActivationRequest): Promise<{message: string}> => {
    const response = await apiClient.post(API_CONFIG.endpoints.auth.activate, data);
    return response.data;
  },

  acceptInvitation: async (data: InvitationAcceptRequest): Promise<{message: string}> => {
    const response = await apiClient.post(API_CONFIG.endpoints.auth.invitations.accept, data);
    return response.data;
  },

  getConfig: async (): Promise<any> => {
    const response = await apiClient.get(API_CONFIG.endpoints.auth.config);
    return response.data;
  },
};

// Custom Hooks
export const useRegister = () => {
  const router = useRouter();
  const setAuth = useAuthStore(state => state.setAuth);

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data: AuthResponse) => {
      // Store auth data
      setAuth(data);
      
      // Tokens are stored by setAuth in the store
      
      // Show success message
      toast.success('Account created successfully! Welcome to KeyNest.');
      
      // Redirect to dashboard
      router.push(ROUTES.dashboard);
    },
    onError: (error: any) => {
      console.error('Registration error:', error);
      
      // Handle specific error formats from backend
      const apiError = error as { data?: ApiError; message?: string };
      
      if (apiError.data?.details) {
        // Show field-specific errors
        Object.entries(apiError.data.details).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            toast.error(`${field}: ${messages[0]}`);
          }
        });
      } else if (apiError.data?.error) {
        toast.error(apiError.data.error);
      } else if (apiError.data?.detail) {
        toast.error(apiError.data.detail);
      } else {
        toast.error('Registration failed. Please try again.');
      }
    },
  });
};

export const useLogin = () => {
  const router = useRouter();
  const setAuth = useAuthStore(state => state.setAuth);

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data: AuthResponse) => {
      // Store auth data
      setAuth(data);
      
      // Tokens are stored by setAuth in the store
      
      // Show success message
      toast.success(`Welcome back, ${data.user.first_name || data.user.username}!`);
      
      // Redirect to dashboard
      router.push(ROUTES.dashboard);
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      
      // Handle specific error formats from backend
      const apiError = error as { data?: ApiError; message?: string };
      
      if (apiError.data?.error) {
        if (apiError.data.error === 'Invalid credentials') {
          toast.error('Invalid email or password. Please try again.');
        } else {
          toast.error(apiError.data.error);
        }
      } else if (apiError.data?.detail) {
        toast.error(apiError.data.detail);
      } else {
        toast.error('Login failed. Please try again.');
      }
    },
  });
};

export const useLogout = () => {
  const router = useRouter();
  const logout = useAuthStore(state => state.logout);

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Clear auth state
      logout();
      
      // Show success message
      toast.success('You have been logged out successfully.');
      
      // Redirect to home
      router.push(ROUTES.home);
    },
    onError: (error) => {
      console.error('Logout error:', error);
      
      // Even if API fails, clear local state
      logout();
      router.push(ROUTES.home);
    },
  });
};

export const useProfile = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: authApi.getProfile,
    enabled: isAuthenticated,
    retry: (failureCount, error: any) => {
      // Don't retry on 401 errors
      if (error?.status === 401) return false;
      return failureCount < 3;
    },
  });
};

// Utility function to check authentication status
export const useAuthCheck = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const accessToken = useAuthStore(state => state.accessToken);
  const refreshToken = useAuthStore(state => state.refreshToken);
  const user = useAuthStore(state => state.user);

  const isFullyAuthenticated = isAuthenticated && accessToken && refreshToken && user;

  return {
    isAuthenticated: isFullyAuthenticated,
    user,
    accessToken,
    refreshToken,
  };
};

export const useGoogleOAuth = () => {
  const router = useRouter();
  const setAuth = useAuthStore(state => state.setAuth);

  return useMutation({
    mutationFn: authApi.googleOAuth,
    onSuccess: (data: AuthResponse) => {
      setAuth(data);
      toast.success(`Welcome, ${data.user.first_name || data.user.username}!`);
      router.push(ROUTES.dashboard);
    },
    onError: (error: any) => {
      console.error('Google OAuth error:', error);
      const apiError = error as { data?: ApiError; message?: string };
      
      if (apiError.data?.error) {
        toast.error(apiError.data.error);
      } else if (apiError.data?.detail) {
        toast.error(apiError.data.detail);
      } else {
        toast.error('Google login failed. Please try again.');
      }
    },
  });
};

export const useGitHubOAuth = () => {
  const router = useRouter();
  const setAuth = useAuthStore(state => state.setAuth);

  return useMutation({
    mutationFn: authApi.githubOAuth,
    onSuccess: (data: AuthResponse) => {
      setAuth(data);
      toast.success(`Welcome, ${data.user.first_name || data.user.username}!`);
      router.push(ROUTES.dashboard);
    },
    onError: (error: any) => {
      console.error('GitHub OAuth error:', error);
      const apiError = error as { data?: ApiError; message?: string };
      
      if (apiError.data?.error) {
        toast.error(apiError.data.error);
      } else if (apiError.data?.detail) {
        toast.error(apiError.data.detail);
      } else {
        toast.error('GitHub login failed. Please try again.');
      }
    },
  });
};

export const usePasswordResetRequest = () => {
  return useMutation({
    mutationFn: authApi.passwordResetRequest,
    onSuccess: (data) => {
      toast.success(data.message || 'Password reset email sent successfully!');
    },
    onError: (error: any) => {
      console.error('Password reset request error:', error);
      const apiError = error as { data?: ApiError; message?: string };
      
      if (apiError.data?.error) {
        toast.error(apiError.data.error);
      } else if (apiError.data?.detail) {
        toast.error(apiError.data.detail);
      } else {
        toast.error('Failed to send password reset email. Please try again.');
      }
    },
  });
};

export const usePasswordResetConfirm = () => {
  const router = useRouter();
  
  return useMutation({
    mutationFn: authApi.passwordResetConfirm,
    onSuccess: (data) => {
      toast.success(data.message || 'Password reset successfully! You can now login with your new password.');
      router.push(ROUTES.login);
    },
    onError: (error: any) => {
      console.error('Password reset confirm error:', error);
      const apiError = error as { data?: ApiError; message?: string };
      
      if (apiError.data?.details) {
        Object.entries(apiError.data.details).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            toast.error(`${field}: ${messages[0]}`);
          }
        });
      } else if (apiError.data?.error) {
        toast.error(apiError.data.error);
      } else if (apiError.data?.detail) {
        toast.error(apiError.data.detail);
      } else {
        toast.error('Failed to reset password. Please try again.');
      }
    },
  });
};