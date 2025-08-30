import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from './client';
import { API_CONFIG } from '@/lib/constants';

export interface Environment {
  id: number;
  name: string;
  project: number;
  project_name: string;
  environment_type: 'development' | 'staging' | 'production' | 'testing';
  description: string;
  created_at: string;
  updated_at: string;
  created_by_name: string;
  variable_count: number;
}

export interface CreateEnvironmentData {
  name: string;
  project: number;
  environment_type: 'development' | 'staging' | 'production' | 'testing';
  description?: string;
}

export interface UpdateEnvironmentData {
  name?: string;
  environment_type?: 'development' | 'staging' | 'production' | 'testing';
  description?: string;
}

export interface EnvironmentsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Environment[];
}

export function useEnvironments(params?: { project?: number }) {
  return useQuery({
    queryKey: ['environments', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.project) {
        searchParams.append('project', params.project.toString());
      }
      
      const base = API_CONFIG.endpoints.environments;
      const url = searchParams.toString() 
        ? `${base}?${searchParams.toString()}`
        : base;
        
      const response = await api.get<EnvironmentsResponse>(url);
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useProjectEnvironments(projectId: number) {
  return useQuery({
    queryKey: ['projects', projectId, 'environments'],
    queryFn: async () => {
      const response = await api.get<EnvironmentsResponse>(`${API_CONFIG.endpoints.projects}${projectId}/environments/`);
      return response.data;
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useEnvironment(environmentId: number) {
  return useQuery({
    queryKey: ['environments', environmentId],
    queryFn: async () => {
      const response = await api.get<Environment>(`${API_CONFIG.endpoints.environments}${environmentId}/`);
      return response.data;
    },
    enabled: !!environmentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateEnvironment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateEnvironmentData) => {
      const response = await api.post<Environment>(API_CONFIG.endpoints.environments, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['environments'] });
      queryClient.invalidateQueries({ queryKey: ['projects', data.project, 'environments'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(`Environment "${data.name}" created successfully!`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 
                     error.response?.data?.message || 
                     'Failed to create environment';
      toast.error(message);
    },
  });
}

export function useUpdateEnvironment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ environmentId, data }: { environmentId: number; data: UpdateEnvironmentData }) => {
      const response = await api.patch<Environment>(`${API_CONFIG.endpoints.environments}${environmentId}/`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['environments'] });
      queryClient.invalidateQueries({ queryKey: ['environments', data.id] });
      queryClient.invalidateQueries({ queryKey: ['projects', data.project, 'environments'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(`Environment "${data.name}" updated successfully!`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 
                     error.response?.data?.message || 
                     'Failed to update environment';
      toast.error(message);
    },
  });
}

export function useDeleteEnvironment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (environmentId: number) => {
      await api.delete(`${API_CONFIG.endpoints.environments}${environmentId}/`);
      return environmentId;
    },
    onSuccess: (environmentId) => {
      queryClient.invalidateQueries({ queryKey: ['environments'] });
      queryClient.removeQueries({ queryKey: ['environments', environmentId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Environment deleted successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 
                     error.response?.data?.message || 
                     'Failed to delete environment';
      toast.error(message);
    },
  });
}
