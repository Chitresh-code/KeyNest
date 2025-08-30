import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from './client';
import { API_CONFIG } from '@/lib/constants';

export interface Organization {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  member_count: number;
  project_count: number;
  user_role: 'admin' | 'editor' | 'viewer' | null;
}

export interface CreateOrganizationData {
  name: string;
  description: string;
}

export interface UpdateOrganizationData {
  name?: string;
  description?: string;
}

export interface OrganizationsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Organization[];
}

export function useOrganizations() {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const response = await api.get<OrganizationsResponse>(API_CONFIG.endpoints.organizations);
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useOrganization(organizationId: number) {
  return useQuery({
    queryKey: ['organizations', organizationId],
    queryFn: async () => {
      const response = await api.get<Organization>(`${API_CONFIG.endpoints.organizations}${organizationId}/`);
      return response.data;
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOrganizationData) => {
      const response = await api.post<Organization>(API_CONFIG.endpoints.organizations, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success(`Organization "${data.name}" created successfully!`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 
                     error.response?.data?.message || 
                     'Failed to create organization';
      toast.error(message);
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, data }: { organizationId: number; data: UpdateOrganizationData }) => {
      const response = await api.patch<Organization>(`${API_CONFIG.endpoints.organizations}${organizationId}/`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['organizations', data.id] });
      toast.success(`Organization "${data.name}" updated successfully!`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 
                     error.response?.data?.message || 
                     'Failed to update organization';
      toast.error(message);
    },
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (organizationId: number) => {
      await api.delete(`${API_CONFIG.endpoints.organizations}${organizationId}/`);
      return organizationId;
    },
    onSuccess: (organizationId) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.removeQueries({ queryKey: ['organizations', organizationId] });
      toast.success('Organization deleted successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 
                     error.response?.data?.message || 
                     'Failed to delete organization';
      toast.error(message);
    },
  });
}
