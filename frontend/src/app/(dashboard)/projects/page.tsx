'use client';

import { useState } from 'react';
import { Plus, Search, FolderOpen, Settings, Trash2, Edit, Users } from 'lucide-react';
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
import { useProjects, useDeleteProject } from '@/lib/api/projects';
import { useOrganizations } from '@/lib/api/organizations';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import CreateProjectDialog from '@/components/projects/create-project-dialog';
import EditProjectDialog from '@/components/projects/edit-project-dialog';
import DeleteConfirmDialog from '@/components/common/delete-confirm-dialog';

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editProject, setEditProject] = useState<any>(null);
  const [deleteProject, setDeleteProject] = useState<any>(null);

  const { data: projectsData, isLoading: projectsLoading } = useProjects();
  const { data: organizationsData } = useOrganizations();
  const deleteProjectMutation = useDeleteProject();

  const projects = projectsData?.results || [];
  const organizations = organizationsData?.results || [];

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteProject = async () => {
    if (!deleteProject) return;
    
    try {
      await deleteProjectMutation.mutateAsync(deleteProject.id);
      setDeleteProject(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (projectsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">
            Manage your projects and their environments
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No projects found' : 'No projects yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Get started by creating your first project'
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg truncate">
                      {project.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {project.description || 'No description'}
                    </CardDescription>
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
                      <DropdownMenuItem onClick={() => setEditProject(project)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setDeleteProject(project)}
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
                  {/* Organization */}
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    {project.organization_name}
                  </div>

                  {/* Environment Count */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Environments</span>
                    <Badge variant="secondary">
                      {project.environment_count}
                    </Badge>
                  </div>

                  {/* Created Info */}
                  <div className="text-xs text-gray-500">
                    Created {formatDistanceToNow(new Date(project.created_at))} ago
                    {project.created_by_name && (
                      <span> by {project.created_by_name}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2">
                    <Link href={`/projects/${project.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        <FolderOpen className="h-4 w-4 mr-2" />
                        View Project
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateProjectDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen}
        organizations={organizations}
      />

      {editProject && (
        <EditProjectDialog 
          open={!!editProject} 
          onOpenChange={() => setEditProject(null)}
          project={editProject}
        />
      )}

      {deleteProject && (
        <DeleteConfirmDialog
          open={!!deleteProject}
          onOpenChange={() => setDeleteProject(null)}
          title="Delete Project"
          description={`Are you sure you want to delete "${deleteProject.name}"? This action cannot be undone and will also delete all environments and variables within this project.`}
          onConfirm={handleDeleteProject}
          isLoading={deleteProjectMutation.isPending}
        />
      )}
    </div>
  );
}