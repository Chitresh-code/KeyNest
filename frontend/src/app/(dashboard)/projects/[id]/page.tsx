'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Search, Settings, Trash2, Edit, Play, Database, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useProject } from '@/lib/api/projects';
import { useProjectEnvironments, useDeleteEnvironment } from '@/lib/api/environments';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import CreateEnvironmentDialog from '@/components/environments/create-environment-dialog';
import EditEnvironmentDialog from '@/components/environments/edit-environment-dialog';
import DeleteConfirmDialog from '@/components/common/delete-confirm-dialog';

const environmentTypeColors = {
  development: 'bg-blue-100 text-blue-800',
  staging: 'bg-yellow-100 text-yellow-800', 
  production: 'bg-red-100 text-red-800',
  testing: 'bg-green-100 text-green-800',
};

const environmentTypeIcons = {
  development: Database,
  staging: Play,
  production: Shield,
  testing: Settings,
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = parseInt(params.id as string);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editEnvironment, setEditEnvironment] = useState<any>(null);
  const [deleteEnvironment, setDeleteEnvironment] = useState<any>(null);

  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: environmentsData, isLoading: environmentsLoading } = useProjectEnvironments(projectId);
  const deleteEnvironmentMutation = useDeleteEnvironment();

  const environments = environmentsData?.results || [];

  const filteredEnvironments = environments.filter(env =>
    env.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    env.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    env.environment_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteEnvironment = async () => {
    if (!deleteEnvironment) return;
    
    try {
      await deleteEnvironmentMutation.mutateAsync(deleteEnvironment.id);
      setDeleteEnvironment(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Project not found</h2>
        <p className="text-gray-600 mb-4">The project you're looking for doesn't exist or you don't have access to it.</p>
        <Link href="/projects">
          <Button>Back to Projects</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-600">{project.description || 'No description'}</p>
        </div>
      </div>

      {/* Project Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Organization</label>
              <p className="text-gray-900">{project.organization_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Environments</label>
              <p className="text-gray-900">{project.environment_count}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Created</label>
              <p className="text-gray-900">
                {formatDistanceToNow(new Date(project.created_at))} ago
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Created By</label>
              <p className="text-gray-900">{project.created_by_name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Environments Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Environments</h2>
            <p className="text-gray-600">
              Manage different environments for this project
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Environment
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search environments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Environments List */}
        {environmentsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading environments...</span>
          </div>
        ) : filteredEnvironments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No environments found' : 'No environments yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Create your first environment to start managing variables'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Environment
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEnvironments.map((environment) => {
              const IconComponent = environmentTypeIcons[environment.environment_type];
              return (
                <Card key={environment.id} className="group hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <IconComponent className="h-4 w-4 text-gray-600" />
                          <CardTitle className="text-lg truncate">
                            {environment.name}
                          </CardTitle>
                        </div>
                        <Badge className={environmentTypeColors[environment.environment_type]}>
                          {environment.environment_type}
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditEnvironment(environment)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeleteEnvironment(environment)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Description */}
                      {environment.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {environment.description}
                        </p>
                      )}

                      {/* Variable Count */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Variables</span>
                        <Badge variant="secondary">
                          {environment.variable_count}
                        </Badge>
                      </div>

                      {/* Created Info */}
                      <div className="text-xs text-gray-500">
                        Created {formatDistanceToNow(new Date(environment.created_at))} ago
                      </div>

                      {/* Actions */}
                      <div className="pt-2">
                        <Link href={`/projects/${projectId}/environments/${environment.id}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            <Database className="h-4 w-4 mr-2" />
                            Manage Variables
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateEnvironmentDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen}
        projectId={projectId}
      />

      {editEnvironment && (
        <EditEnvironmentDialog 
          open={!!editEnvironment} 
          onOpenChange={() => setEditEnvironment(null)}
          environment={editEnvironment}
        />
      )}

      {deleteEnvironment && (
        <DeleteConfirmDialog
          open={!!deleteEnvironment}
          onOpenChange={() => setDeleteEnvironment(null)}
          title="Delete Environment"
          description={`Are you sure you want to delete "${deleteEnvironment.name}"? This action cannot be undone and will also delete all variables in this environment.`}
          onConfirm={handleDeleteEnvironment}
          isLoading={deleteEnvironmentMutation.isPending}
        />
      )}
    </div>
  );
}