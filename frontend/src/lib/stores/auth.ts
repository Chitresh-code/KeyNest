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
    set => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      setUser: user =>
        set(state => ({
          ...state,
          user,
          isAuthenticated: !!user,
        })),

      setToken: token =>
        set(state => ({
          ...state,
          token,
          isAuthenticated: !!token,
        })),

      setAuth: authResponse =>
        set(state => ({
          ...state,
          user: authResponse.user,
          token: authResponse.token,
          isAuthenticated: true,
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
    }
  )
);