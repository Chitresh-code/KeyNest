import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from './client';
import { API_CONFIG } from '@/lib/constants';

export interface Project {
  id: number;
  name: string;
  description: string;
  organization: number;
  organization_name: string;
  created_at: string;
  updated_at: string;
  created_by_name: string;
  environment_count: number;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  organization: number;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
}

export interface ProjectsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Project[];
}

export function useProjects(params?: { organization?: number }) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.organization) {
        searchParams.append('organization', params.organization.toString());
      }
      
      const base = API_CONFIG.endpoints.projects;
      const url = searchParams.toString()
        ? `${base}?${searchParams.toString()}`
        : base;
        
      const response = await api.get<ProjectsResponse>(url);
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useProject(projectId: number) {
  return useQuery({
    queryKey: ['projects', projectId],
    queryFn: async () => {
      const response = await api.get<Project>(`${API_CONFIG.endpoints.projects}${projectId}/`);
      return response.data;
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProjectData) => {
      const response = await api.post<Project>(API_CONFIG.endpoints.projects, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success(`Project "${data.name}" created successfully!`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 
                     error.response?.data?.message || 
                     'Failed to create project';
      toast.error(message);
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, data }: { projectId: number; data: UpdateProjectData }) => {
      const response = await api.patch<Project>(`${API_CONFIG.endpoints.projects}${projectId}/`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', data.id] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success(`Project "${data.name}" updated successfully!`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 
                     error.response?.data?.message || 
                     'Failed to update project';
      toast.error(message);
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: number) => {
      await api.delete(`${API_CONFIG.endpoints.projects}${projectId}/`);
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.removeQueries({ queryKey: ['projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Project deleted successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 
                     error.response?.data?.message || 
                     'Failed to delete project';
      toast.error(message);
    },
  });
}
