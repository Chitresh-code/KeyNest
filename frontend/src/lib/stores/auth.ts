import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthResponse } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setAuth: (authResponse: AuthResponse) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      token: null,
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

      setToken: token =>
        set(state => ({
          ...state,
          token,
          isAuthenticated: !!token,
          isLoading: false,
        })),

      setAuth: authResponse =>
        set(state => ({
          ...state,
          user: authResponse.user,
          token: authResponse.token,
          isAuthenticated: true,
          isLoading: false,
        })),

      logout: () => {
        // Clear localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('keynest_token');
        }
        
        set({
          user: null,
          token: null,
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
        token: state.token,
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