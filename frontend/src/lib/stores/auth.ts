import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthResponse } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setAuth: (authResponse: AuthResponse) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true, // Start with true to handle hydration

      // Actions
      setUser: user =>
        set(state => ({
          ...state,
          user,
          isAuthenticated: !!user,
          isLoading: false,
        })),

      setTokens: (accessToken, refreshToken) => {
        // Store tokens in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('keynest_access_token', accessToken);
          localStorage.setItem('keynest_refresh_token', refreshToken);
        }
        
        set(state => ({
          ...state,
          accessToken,
          refreshToken,
          isAuthenticated: !!(accessToken && refreshToken),
          isLoading: false,
        }));
      },

      setAuth: authResponse => {
        // Store tokens in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('keynest_access_token', authResponse.access);
          localStorage.setItem('keynest_refresh_token', authResponse.refresh);
        }
        
        set(state => ({
          ...state,
          user: authResponse.user,
          accessToken: authResponse.access,
          refreshToken: authResponse.refresh,
          isAuthenticated: true,
          isLoading: false,
        }));
      },

      logout: () => {
        // Clear localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('keynest_access_token');
          localStorage.removeItem('keynest_refresh_token');
        }
        
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setLoading: loading =>
        set(state => ({
          ...state,
          isLoading: loading,
        })),
    }),
    {
      name: 'keynest-auth',
      partialize: state => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Set loading to false after hydration
        if (state) {
          state.isLoading = false;
        }
      },
    }
  )
);