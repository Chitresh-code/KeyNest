import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Organization } from '@/lib/api/organizations';

interface OrganizationState {
  currentOrganization: Organization | null;
  isLoading: boolean;
}

interface OrganizationActions {
  setCurrentOrganization: (organization: Organization | null) => void;
  switchOrganization: (organization: Organization) => void;
  setLoading: (loading: boolean) => void;
  clearOrganization: () => void;
}

export const useOrganizationStore = create<OrganizationState & OrganizationActions>()(
  persist(
    (set) => ({
      // Initial state
      currentOrganization: null,
      isLoading: false,

      // Actions
      setCurrentOrganization: (organization) =>
        set((state) => ({
          ...state,
          currentOrganization: organization,
          isLoading: false,
        })),

      switchOrganization: (organization) => {
        set((state) => ({
          ...state,
          currentOrganization: organization,
          isLoading: false,
        }));
        
        // Redirect to dashboard to prevent access to other organization's data
        if (typeof window !== 'undefined') {
          window.location.href = '/dashboard';
        }
      },

      setLoading: (loading) =>
        set((state) => ({
          ...state,
          isLoading: loading,
        })),

      clearOrganization: () => {
        set({
          currentOrganization: null,
          isLoading: false,
        });
      },
    }),
    {
      name: 'keynest-organization',
      partialize: (state) => ({
        currentOrganization: state.currentOrganization,
      }),
    }
  )
);