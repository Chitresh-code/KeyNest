import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from './client';
import { API_CONFIG } from '@/lib/constants';

export interface EnvVariable {
  id: number;
  key: string;
  decrypted_value: string;
  environment: number;
  environment_name: string;
  created_at: string;
  updated_at: string;
  created_by_name: string;
}

export interface CreateVariableData {
  key: string;
  value: string;
  environment: number;
}

export interface UpdateVariableData {
  key?: string;
  value?: string;
}

export interface VariablesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: EnvVariable[];
}

export function useEnvironmentVariables(environmentId: number) {
  return useQuery({
    queryKey: ['environments', environmentId, 'variables'],
    queryFn: async () => {
      const response = await api.get<VariablesResponse>(`${API_CONFIG.endpoints.core.environments}${environmentId}/variables/`);
      return response.data;
    },
    enabled: !!environmentId,
    staleTime: 1000 * 60 * 2, // 2 minutes (shorter for sensitive data)
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors (401, 403) or not found (404)
      if ([401, 403, 404].includes(error?.response?.status)) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
}

export function useVariable(variableId: number) {
  return useQuery({
    queryKey: ['variables', variableId],
    queryFn: async () => {
      const response = await api.get<EnvVariable>(`${API_CONFIG.endpoints.core.variables}${variableId}/`);
      return response.data;
    },
    enabled: !!variableId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useCreateVariable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateVariableData) => {
      const response = await api.post<EnvVariable>(API_CONFIG.endpoints.core.variables, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['environments', data.environment, 'variables'] });
      queryClient.invalidateQueries({ queryKey: ['environments'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(`Variable "${data.key}" created successfully!`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 
                     error.response?.data?.message ||
                     Object.values(error.response?.data || {}).flat().join(', ') ||
                     'Failed to create variable';
      toast.error(message);
    },
  });
}

export function useUpdateVariable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ variableId, data }: { variableId: number; data: UpdateVariableData }) => {
      const response = await api.patch<EnvVariable>(`${API_CONFIG.endpoints.core.variables}${variableId}/`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['environments', data.environment, 'variables'] });
      queryClient.invalidateQueries({ queryKey: ['variables', data.id] });
      queryClient.invalidateQueries({ queryKey: ['environments'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(`Variable "${data.key}" updated successfully!`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 
                     error.response?.data?.message ||
                     Object.values(error.response?.data || {}).flat().join(', ') ||
                     'Failed to update variable';
      toast.error(message);
    },
  });
}

export function useDeleteVariable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variableId: number) => {
      await api.delete(`${API_CONFIG.endpoints.core.variables}${variableId}/`);
      return variableId;
    },
    onSuccess: (variableId) => {
      // Remove individual variable cache
      queryClient.removeQueries({ queryKey: ['variables', variableId] });
      // Invalidate any environment variable lists
      queryClient.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey.includes('variables'),
      });
      // Broader refresh for counts
      queryClient.invalidateQueries({ queryKey: ['environments'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Variable deleted successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 
                     error.response?.data?.message || 
                     'Failed to delete variable';
      toast.error(message);
    },
  });
}

export function useExportEnvironment() {
  return useMutation({
    mutationFn: async (environmentId: number) => {
      const response = await api.get(`${API_CONFIG.endpoints.core.environments}${environmentId}/export/`, {
        responseType: 'blob',
        timeout: 90000, // 1.5 minutes for exports
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `environment-${environmentId}.env`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return response.data;
    },
    onSuccess: () => {
      toast.success('Environment file exported successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 
                     error.response?.data?.message || 
                     'Failed to export environment';
      toast.error(message);
    },
  });
}

export function useImportEnvironment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      environmentId, 
      file, 
      overwrite = false 
    }: { 
      environmentId: number; 
      file: File; 
      overwrite?: boolean;
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      if (overwrite) {
        formData.append('overwrite', 'true');
      }
      
      const response = await api.post(`${API_CONFIG.endpoints.core.environments}${environmentId}/import/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes for file uploads
      });
      return response.data;
    },
    onSuccess: (data, { environmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['environments', environmentId, 'variables'] });
      queryClient.invalidateQueries({ queryKey: ['environments'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      const message = data.overwritten_count 
        ? `Successfully imported ${data.imported_count} variables and updated ${data.overwritten_count} existing ones!`
        : `Successfully imported ${data.imported_count} variables!`;
      toast.success(message);
    },
    onError: (error: any) => {
      // Return the error so we can handle conflicts in the component
      throw error;
    },
  });
}
