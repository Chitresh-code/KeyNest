'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Settings, 
  Trash2, 
  Edit, 
  Eye, 
  EyeOff, 
  Copy, 
  Download, 
  Upload,
  Key,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useEnvironment } from '@/lib/api/environments';
import { useEnvironmentVariables, useDeleteVariable, useExportEnvironment } from '@/lib/api/variables';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import CreateVariableDialog from '@/components/variables/create-variable-dialog';
import EditVariableDialog from '@/components/variables/edit-variable-dialog';
import DeleteConfirmDialog from '@/components/common/delete-confirm-dialog';
import ImportEnvironmentDialog from '@/components/variables/import-environment-dialog';

const environmentTypeColors = {
  development: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300',
  staging: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300', 
  production: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300',
  testing: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300',
};

export default function EnvironmentVariablesPage() {
  const params = useParams();
  const router = useRouter();
  
  const projectId = parseInt(params.id as string);
  const environmentId = parseInt(params.envId as string);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editVariable, setEditVariable] = useState<any>(null);
  const [deleteVariable, setDeleteVariable] = useState<any>(null);
  const [hiddenValues, setHiddenValues] = useState<Set<number>>(new Set());

  const { data: environment, isLoading: environmentLoading, error: environmentError } = useEnvironment(environmentId);
  const { data: variablesData, isLoading: variablesLoading, error: variablesError, refetch: refetchVariables } = useEnvironmentVariables(environmentId);
  const deleteVariableMutation = useDeleteVariable();
  const exportEnvironmentMutation = useExportEnvironment();

  const variables = variablesData?.results || [];

  const filteredVariables = variables.filter((variable: any) =>
    variable.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (variable.decrypted_value && variable.decrypted_value.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleValueVisibility = (variableId: number) => {
    setHiddenValues(prev => {
      const newSet = new Set(prev);
      if (newSet.has(variableId)) {
        newSet.delete(variableId);
      } else {
        newSet.add(variableId);
      }
      return newSet;
    });
  };

  const copyToClipboard = async (key: string, value: string) => {
    try {
      const envFormat = `${key}=${value}`;
      await navigator.clipboard.writeText(envFormat);
      toast.success('Copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleDeleteVariable = async () => {
    if (!deleteVariable) return;
    
    try {
      await deleteVariableMutation.mutateAsync(deleteVariable.id);
      setDeleteVariable(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleExport = () => {
    exportEnvironmentMutation.mutate(environmentId);
  };

  if (environmentLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-muted-foreground">Loading environment...</p>
        </div>
      </div>
    );
  }

  if (environmentError) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-medium text-gray-900 dark:text-foreground mb-2">Failed to load environment</h2>
        <p className="text-gray-600 dark:text-muted-foreground mb-4">
          {environmentError.response?.data?.detail || 'An error occurred while loading the environment.'}
        </p>
        <div className="space-x-2">
          <Button onClick={() => window.location.reload()}>Try Again</Button>
          <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (!environment) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-medium text-gray-900 dark:text-foreground mb-2">Environment not found</h2>
        <p className="text-gray-600 dark:text-muted-foreground mb-4">The environment you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
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
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">{environment.name}</h1>
            <Badge className={environmentTypeColors[environment.environment_type]}>
              {environment.environment_type}
            </Badge>
          </div>
          <p className="text-gray-600 dark:text-muted-foreground">{environment.description || 'No description'}</p>
        </div>
      </div>

      {/* Environment Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-muted-foreground">Project</label>
              <p className="text-gray-900 dark:text-foreground">{environment.project_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-muted-foreground">Variables</label>
              <p className="text-gray-900 dark:text-foreground">{environment.variable_count}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-muted-foreground">Created</label>
              <p className="text-gray-900 dark:text-foreground">
                {formatDistanceToNow(new Date(environment.created_at))} ago
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-muted-foreground">Created By</label>
              <p className="text-gray-900 dark:text-foreground">{environment.created_by_name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Variables Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground">Environment Variables</h2>
            <p className="text-gray-600 dark:text-muted-foreground">
              Manage variables for the {environment.name} environment
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsImportOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import from .env
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export to .env
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Variable
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search variables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Variables Table */}
        {variablesLoading ? (
          <div className="space-y-4">
            {/* Skeleton loading for variables */}
            <Card>
              <div className="p-6 space-y-4">
                <div className="animate-pulse">
                  <div className="flex justify-between items-center mb-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  </div>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
                      <div className="flex items-center space-x-3">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                      </div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        ) : variablesError ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-red-500 mb-4">
                <Key className="h-12 w-12 mx-auto opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-2">
                Failed to load variables
              </h3>
              <p className="text-gray-600 dark:text-muted-foreground mb-4">
                {variablesError.response?.data?.detail || 'An error occurred while loading environment variables.'}
              </p>
              <div className="space-x-2">
                <Button onClick={() => refetchVariables()} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Variable
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : filteredVariables.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-2">
                {searchTerm ? 'No variables found' : 'No variables yet'}
              </h3>
              <p className="text-gray-600 dark:text-muted-foreground mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Add your first environment variable to get started'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Variable
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVariables.map((variable: any) => {
                  const isValueHidden = hiddenValues.has(variable.id);
                  const displayValue = variable.decrypted_value === '[HIDDEN]' || variable.decrypted_value === '[NO_ACCESS]'
                    ? variable.decrypted_value
                    : isValueHidden 
                      ? '•'.repeat(Math.min(variable.decrypted_value?.length || 0, 20))
                      : variable.decrypted_value;

                  return (
                    <TableRow key={variable.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <code className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-900 dark:text-foreground">
                            {variable.key}
                          </code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 max-w-md">
                          <code className="text-sm font-mono bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded truncate flex-1 text-gray-900 dark:text-foreground">
                            {displayValue || '(empty)'}
                          </code>
                          {variable.decrypted_value !== '[HIDDEN]' && variable.decrypted_value !== '[NO_ACCESS]' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleValueVisibility(variable.id)}
                                className="h-6 w-6 p-0"
                              >
                                {isValueHidden ? (
                                  <Eye className="h-3 w-3" />
                                ) : (
                                  <EyeOff className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(variable.key, variable.decrypted_value)}
                                className="h-6 w-6 p-0"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(variable.created_at))} ago
                          {variable.created_by_name && (
                            <div className="text-xs">by {variable.created_by_name}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditVariable(variable)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setDeleteVariable(variable)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>


      {/* Dialogs */}
      <CreateVariableDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen}
        environmentId={environmentId}
      />

      <ImportEnvironmentDialog 
        open={isImportOpen} 
        onOpenChange={setIsImportOpen}
        environmentId={environmentId}
      />

      {editVariable && (
        <EditVariableDialog 
          open={!!editVariable} 
          onOpenChange={() => setEditVariable(null)}
          variable={editVariable}
        />
      )}

      {deleteVariable && (
        <DeleteConfirmDialog
          open={!!deleteVariable}
          onOpenChange={() => setDeleteVariable(null)}
          title="Delete Variable"
          description={`Are you sure you want to delete "${deleteVariable.key}"? This action cannot be undone.`}
          onConfirm={handleDeleteVariable}
          isLoading={deleteVariableMutation.isPending}
        />
      )}
    </div>
  );
}