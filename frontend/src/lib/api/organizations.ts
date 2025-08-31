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

// Organization Member Management
export interface OrganizationMember {
  id: number;
  user_id: number;
  username: string;
  full_name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  joined_at: string;
  is_owner: boolean;
}

export interface InviteUserData {
  email: string;
  role: 'admin' | 'editor' | 'viewer';
}

export interface UpdateMemberRoleData {
  role: 'admin' | 'editor' | 'viewer';
}

export function useOrganizationMembers(organizationId: number) {
  return useQuery({
    queryKey: ['organizations', organizationId, 'members'],
    queryFn: async () => {
      const response = await api.get<{ results: OrganizationMember[] }>(`${API_CONFIG.endpoints.organizations}${organizationId}/members/`);
      return response.data;
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, data }: { organizationId: number; data: InviteUserData }) => {
      const response = await api.post(`${API_CONFIG.endpoints.organizations}${organizationId}/invite/`, data);
      return response.data;
    },
    onSuccess: (data, { organizationId }) => {
      queryClient.invalidateQueries({ queryKey: ['organizations', organizationId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success(`Invitation sent to ${data.email}!`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 
                     error.response?.data?.message ||
                     Object.values(error.response?.data || {}).flat().join(', ') ||
                     'Failed to send invitation';
      toast.error(message);
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      organizationId, 
      memberId, 
      data 
    }: { 
      organizationId: number; 
      memberId: number; 
      data: UpdateMemberRoleData 
    }) => {
      const response = await api.patch(`${API_CONFIG.endpoints.organizations}${organizationId}/members/${memberId}/`, data);
      return response.data;
    },
    onSuccess: (_, { organizationId }) => {
      queryClient.invalidateQueries({ queryKey: ['organizations', organizationId, 'members'] });
      toast.success(`Member role updated successfully!`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 
                     error.response?.data?.message || 
                     'Failed to update member role';
      toast.error(message);
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, memberId }: { organizationId: number; memberId: number }) => {
      await api.delete(`${API_CONFIG.endpoints.organizations}${organizationId}/members/${memberId}/`);
      return memberId;
    },
    onSuccess: (_, { organizationId }) => {
      queryClient.invalidateQueries({ queryKey: ['organizations', organizationId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Member removed successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 
                     error.response?.data?.message || 
                     'Failed to remove member';
      toast.error(message);
    },
  });
}
